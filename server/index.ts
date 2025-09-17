import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { sanitizeInput } from "./middleware/validation";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectRedis from "connect-redis";
import { createClient as createRedisClient } from "redis";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
// Use a relaxed CSP only in development for Vite HMR; strict defaults in production
if (app.get("env") === "development") {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          fontSrc: ["'self'", "https:", "data:"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
          frameSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    })
  );
} else {
  app.use(helmet());
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Redis-backed session (optional; falls back to MemoryStore if Redis not available)
try {
  const useRedis = !!process.env.REDIS_URL;
  if (useRedis) {
    const RedisStore = connectRedis(session);
    const redisClient = createRedisClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch(() => {});
    app.use(session({
      store: new (RedisStore as any)({ client: redisClient }),
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: app.get("env") === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
      }
    }));
  }
} catch {}
app.use(sanitizeInput());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  if (!process.env.SESSION_SECRET && app.get("env") === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    // do not rethrow, avoid crashing the process
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve both API and client on the same port (defaults to 5000)
  const port = Number(process.env.PORT || 5000);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

})();
