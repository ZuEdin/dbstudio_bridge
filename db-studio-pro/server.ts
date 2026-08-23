import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Import modular routers
import { authRouter, chatRouter, adRouter } from "./server/authRoutes";
import { dbRouter } from "./server/dbRoutes";
import { projectRouter } from "./server/projectRoutes";
import { deployRouter } from "./server/deployRoutes";
import { apiRouter } from "./server/apiRoutes";
import { mailerRouter, backupRouter } from "./server/mailerRoutes";
import { aiRouter } from "./server/aiRoutes";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global parsing middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // CORS-like / general headers (needed for preview & sub-processes)
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  // Base API Health Check Endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      Status: "ok",
      Service: "DB Studio Pro Live Backend Engine",
      Version: "2.5.0",
      Environment: "Production Cloud Engine",
      Features: ["TeamProjects", "LiveDeployment", "DynamicRunnerPorts", "Auth", "Webhooks", "Zapier"]
    });
  });

  // Mount API Routers
  app.use("/api/auth", authRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/ad", adRouter);
  app.use("/api/db", dbRouter);
  app.use("/api/deploy", deployRouter);
  app.use("/api/backend-apis", apiRouter);
  app.use("/api/mailer", mailerRouter);
  app.use("/api/backup", backupRouter);

  // Mount remaining project and AI assistant routes directly to /api
  app.use("/api", projectRouter);
  app.use("/api", aiRouter);

  // Fallback 404 handler for missing /api/ endpoints so Vite SPA fallback doesn't return 200 OK HTML
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: `API endpoint ${req.originalUrl} nicht gefunden` });
      return;
    }
    next();
  });

  // Vite middleware for development vs static asset serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
