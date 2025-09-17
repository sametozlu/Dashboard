import type { Express } from "express";
import { createServer, type Server } from "http";
import { rateLimit, validateRequest, validateParams } from "./middleware/validation";
import { hardwareBridge } from "./hardware-bridge";
import { setupWebSocket } from "./websocket";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple authentication without database
  const validCredentials = {
    username: "netmon",
    password: "netmon"
  };

  // Login endpoint (with rate limit and validation)
  app.post("/api/auth/login", rateLimit(10, 60_000), async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (username === validCredentials.username && password === validCredentials.password) {
        const sessionId = "sess-" + Date.now();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        // Persist session for WS + HTTP
        await storage.createSession(1, sessionId, expiresAt);
        
        res.cookie("sessionId", sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          expires: expiresAt // 24 hours
        });

        res.json({
          user: {
            id: 1,
            username: username
          }
        });
      } else {
        res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
      }
    } catch (error) {
      res.status(400).json({ message: "Geçersiz istek" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    res.clearCookie("sessionId");
    res.json({ message: "Çıkış yapıldı" });
  });

  // Get current user endpoint
  app.get("/api/auth/me", async (req, res) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (!sessionId) {
        return res.status(401).json({ message: "Oturum bulunamadı" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ message: "Oturum bulunamadı" });
      }

      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ message: "Kullanıcı bulunamadı" });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch {
      res.status(500).json({ message: "Sunucu hatası" });
    }
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString()
    });
  });

  // Liveness & Readiness
  app.get("/api/live", (_req, res) => res.json({ live: true }));
  app.get("/api/ready", (_req, res) => {
    try {
      const connected = hardwareBridge.isRealHardwareConnected();
      const ready = process.env.HARDWARE_ENABLED === 'true' ? connected : true;
      res.status(ready ? 200 : 503).json({ ready, hardwareConnected: connected });
    } catch {
      res.status(503).json({ ready: false });
    }
  });

  // Hardware health (mode + connection status)
  app.get("/api/hardware/health", (_req, res) => {
    try {
      const connected = hardwareBridge.isRealHardwareConnected();
      const mode = connected ? "real" : "sim"; // if not connected assume simulation unless env says otherwise
      res.json({
        mode,
        connected,
        tcpHost: process.env.HARDWARE_TCP_HOST || '127.0.0.1',
        tcpPort: Number(process.env.HARDWARE_TCP_PORT || 9000),
        lastUpdateTs: (hardwareBridge as any).getLastUpdateTs ? (hardwareBridge as any).getLastUpdateTs() : 0
      });
    } catch (error) {
      res.status(500).json({ message: "Hardware health check failed" });
    }
  });

  // Hardware API endpoints
  // Rate limit all hardware routes
  app.use('/api/hardware', rateLimit(60, 60_000));
  // Simple authentication middleware for hardware routes
  const requireAuth = async (req: any, res: any, next: any) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (!sessionId) {
        return res.status(401).json({ message: "Oturum bulunamadı" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ message: "Oturum bulunamadı" });
      }

      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ message: "Kullanıcı bulunamadı" });
      }

      req.user = { id: user.id, username: user.username };
      next();
    } catch {
      res.status(500).json({ message: "Sunucu hatası" });
    }
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
      const result = await hardwareBridge.setPowerModuleState(moduleId, enabled);
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

  // Konfigürasyon endpointleri
  app.get("/api/config", requireAuth, async (req, res) => {
    try {
      const config = await storage.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Konfigürasyon verisi alınamadı" });
    }
  });

  app.post("/api/config", requireAuth, async (req, res) => {
    try {
      const config = req.body;
      await storage.setConfig(config);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Konfigürasyon verisi kaydedilemedi" });
    }
  });

  // Admin: switch hardware mode (real/sim) - simple protection via requireAuth
  // Simple admin guard: only allow default demo user for now; expand to roles later
  const requireAdmin = async (req: any, res: any, next: any) => {
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) return res.status(401).json({ message: "Oturum bulunamadı" });
    // In-memory demo: user id 1 is admin
    req.user?.id === 1 ? next() : res.status(403).json({ message: "Yetki yok" });
  };

  app.post("/api/admin/hardware-mode", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { mode } = req.body as { mode?: string };
      if (mode === "real") {
        hardwareBridge.enableRealHardware();
      } else if (mode === "sim") {
        hardwareBridge.enableSimulationMode();
      } else {
        return res.status(400).json({ message: "Geçersiz mod. 'real' veya 'sim' olmalı" });
      }
      res.json({ success: true, mode });
    } catch (error) {
      res.status(500).json({ message: "Donanım modu değiştirilemedi" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time communication
  setupWebSocket(httpServer);
  
  return httpServer;
}
