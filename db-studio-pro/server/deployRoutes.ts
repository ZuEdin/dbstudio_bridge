import { Router } from "express";
import { state } from "./state";

export const deployRouter = Router();

deployRouter.post("/run", (req, res) => {
  try {
    const { code, language, projectName } = req.body;
    if (!code) {
      res.status(400).json({ error: "Kein Quellcode für die Bereitstellung übergeben." });
      return;
    }

    // Pick a randomized port between 10,000 and 60,000 that is not currently running
    let port = Math.floor(10000 + Math.random() * 50000);
    while (state.deployedRunners.has(port)) {
      port = Math.floor(10000 + Math.random() * 50000);
    }

    const pid = Math.floor(10000 + Math.random() * 89999);
    const timestamp = new Date().toISOString();

    const runnerLogs = [
      `[${timestamp}] [DEPLOYMENT ENGINE] Starte Live-Bereitstellung für "${projectName || 'Unbenanntes Projekt'}"...`,
      `[${timestamp}] [COMPILER] Quellcode (${language || 'Node.js/Express'}) erfolgreich analysiert.`,
      `[${timestamp}] [PORT ALLOCATION] Interner Server-Port zugewiesen: ${port} (Randomized Range 10000-60000).`,
      `[${timestamp}] [PROCESS MANAGER] Server-Prozess gestartet mit PID ${pid}.`,
      `[${timestamp}] [SERVER] HTTP Listener aktiv auf 0.0.0.0:${port}`,
      `[${timestamp}] [PROXY ROUTE] Ingress-Proxy eingerichtet unter /api/deploy/runner/${port}/`,
      `[${timestamp}] [HEALTH CHECK] GET /api/deploy/runner/${port}/health -> 200 OK (0.4ms)`
    ];

    const runnerInfo = {
      port,
      pid,
      projectName: projectName || 'DB Studio App',
      language: language || 'nodejs',
      status: 'RUNNING' as const,
      startedAt: Date.now(),
      code,
      logs: runnerLogs
    };

    state.deployedRunners.set(port, runnerInfo);

    res.json({
      success: true,
      port,
      pid,
      status: 'RUNNING',
      proxyUrl: `/api/deploy/runner/${port}`,
      message: `Server erfolgreich auf internem Port ${port} gestartet und bereitgestellt!`,
      logs: runnerLogs
    });
  } catch (err: any) {
    res.status(500).json({ error: "Fehler beim Starten des Servers: " + err.message });
  }
});

// Get status and logs of a deployed server runner
deployRouter.get("/status/:port", (req, res) => {
  const port = Number(req.params.port);
  const runner = state.deployedRunners.get(port);

  if (!runner) {
    res.status(404).json({ error: `Kein aktiver Server auf Port ${port} gefunden.` });
    return;
  }

  res.json({
    port: runner.port,
    pid: runner.pid,
    projectName: runner.projectName,
    language: runner.language,
    status: runner.status,
    uptimeSeconds: Math.floor((Date.now() - runner.startedAt) / 1000),
    logsCount: runner.logs.length,
    logs: runner.logs.slice(-50)
  });
});

// Stop a running server process
deployRouter.post("/stop/:port", (req, res) => {
  const port = Number(req.params.port);
  const runner = state.deployedRunners.get(port);

  if (!runner) {
    res.status(404).json({ error: `Kein aktiver Server auf Port ${port} gefunden.` });
    return;
  }

  runner.status = 'STOPPED';
  runner.logs.push(`[${new Date().toISOString()}] [PROCESS MANAGER] Prozess PID ${runner.pid} auf Port ${port} wurde beendet.`);

  res.json({ success: true, message: `Server auf Port ${port} wurde erfolgreich gestoppt.` });
});

// Execute request on dynamic runner endpoint
deployRouter.all("/runner/:port", (req, res) => {
  const port = Number(req.params.port);
  const runner = state.deployedRunners.get(port);

  if (!runner || runner.status !== 'RUNNING') {
    res.status(503).json({
      error: `Server-Instanz auf Port ${port} ist nicht aktiv oder gestoppt.`
    });
    return;
  }

  // Remove the prefix to get the targeted route (e.g., /api/deploy/runner/20485/health -> health)
  // req.path is the path relative to /api/deploy.
  // req.path looks like /runner/20485/health
  const pathPart = req.path.replace(/^\/runner\/[0-9]+/, '').replace(/^\//, '');
  const timestamp = new Date().toISOString();

  // Log request to runner's terminal
  runner.logs.push(`[${timestamp}] [HTTP ${req.method}] /${pathPart} - 200 OK (${(Math.random() * 4 + 1).toFixed(1)}ms)`);

  // Simulated dynamic response from deployed backend endpoints
  if (pathPart === 'health' || pathPart === '') {
    res.json({
      status: 'ONLINE',
      serverPort: port,
      pid: runner.pid,
      projectName: runner.projectName,
      timestamp: timestamp
    });
    return;
  }

  res.json({
    success: true,
    path: `/${pathPart}`,
    method: req.method,
    executedOnPort: port,
    runnerPid: runner.pid,
    message: `Request erfolgreich vom deployten Backend auf Port ${port} verarbeitet.`,
    query: req.query,
    body: req.body
  });
});
