import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { hardwareBridge } from "./hardware-bridge";
import { setupWebSocket } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  app.use(async (req, res, next) => {
    await storage.deleteExpiredSessions();
    next();
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
      }

      const sessionId = nanoid();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await storage.createSession(user.id, sessionId, expiresAt);
      
      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: expiresAt
      });

      res.json({
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Geçersiz istek" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      await storage.deleteSession(sessionId);
    }
    res.clearCookie("sessionId");
    res.json({ message: "Çıkış yapıldı" });
  });

  // Get current user endpoint
  app.get("/api/auth/me", async (req, res) => {
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: "Oturum bulunamadı" });
    }

    const session = await storage.getSession(sessionId);
    if (!session) {
      res.clearCookie("sessionId");
      return res.status(401).json({ message: "Geçersiz oturum" });
    }

    const user = await storage.getUser(session.userId);
    if (!user) {
      await storage.deleteSession(sessionId);
      res.clearCookie("sessionId");
      return res.status(401).json({ message: "Kullanıcı bulunamadı" });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username
      }
    });
  });

  // Hardware API endpoints
  // Authentication middleware for hardware routes
  const requireAuth = async (req: any, res: any, next: any) => {
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: "Oturum bulunamadı" });
    }

    const session = await storage.getSession(sessionId);
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ message: "Geçersiz oturum" });
    }

    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(401).json({ message: "Kullanıcı bulunamadı" });
    }

    req.user = user;
    next();
  };

  // Power module endpoints
  app.get("/api/hardware/power-modules", requireAuth, async (req, res) => {
    try {
      const modules = await hardwareBridge.getPowerModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Güç modülü verileri alınamadı" });
    }
  });

  app.post("/api/hardware/power-modules/:id/state", requireAuth, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const { enabled } = req.body;
      const result = await hardwareBridge.setBowerModuleState(moduleId, enabled);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Güç modülü durumu değiştirilemedi" });
    }
  });

  // Battery endpoints
  app.get("/api/hardware/batteries", requireAuth, async (req, res) => {
    try {
      const batteries = await hardwareBridge.getBatteryInfo();
      res.json(batteries);
    } catch (error) {
      res.status(500).json({ message: "Pil verileri alınamadı" });
    }
  });

  app.post("/api/hardware/batteries/:id/test", requireAuth, async (req, res) => {
    try {
      const batteryId = parseInt(req.params.id);
      const { testType } = req.body;
      const result = await hardwareBridge.startBatteryTest(batteryId, testType || 0);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Pil testi başlatılamadı" });
    }
  });

  // AC input endpoints
  app.get("/api/hardware/ac-inputs", requireAuth, async (req, res) => {
    try {
      const phases = await hardwareBridge.getACInputs();
      res.json(phases);
    } catch (error) {
      res.status(500).json({ message: "AC giriş verileri alınamadı" });
    }
  });

  // DC output endpoints
  app.get("/api/hardware/dc-outputs", requireAuth, async (req, res) => {
    try {
      const circuits = await hardwareBridge.getDCOutputs();
      res.json(circuits);
    } catch (error) {
      res.status(500).json({ message: "DC çıkış verileri alınamadı" });
    }
  });

  app.post("/api/hardware/dc-outputs/:id/state", requireAuth, async (req, res) => {
    try {
      const circuitId = parseInt(req.params.id);
      const { enabled } = req.body;
      const result = await hardwareBridge.setDCCircuitState(circuitId, enabled);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "DC devre durumu değiştirilemedi" });
    }
  });

  // Alarm endpoints
  app.get("/api/hardware/alarms", requireAuth, async (req, res) => {
    try {
      const alarms = await hardwareBridge.getActiveAlarms();
      res.json(alarms);
    } catch (error) {
      res.status(500).json({ message: "Alarm verileri alınamadı" });
    }
  });

  app.post("/api/hardware/alarms/:id/acknowledge", requireAuth, async (req, res) => {
    try {
      const alarmId = parseInt(req.params.id);
      const result = await hardwareBridge.acknowledgeAlarm(alarmId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Alarm onaylanamadı" });
    }
  });

  // System status endpoint
  app.get("/api/hardware/system-status", requireAuth, async (req, res) => {
    try {
      const status = await hardwareBridge.getSystemStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Sistem durumu alınamadı" });
    }
  });

  app.post("/api/hardware/system/operation-mode", requireAuth, async (req, res) => {
    try {
      const { mode } = req.body;
      const result = await hardwareBridge.setOperationMode(mode);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Çalışma modu değiştirilemedi" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time communication
  setupWebSocket(httpServer);
  
  return httpServer;
}
