import { spawn } from 'child_process';
import path from 'path';

class ProcessManager {
  constructor() {
    this.processes = new Map();
    this.logHistory = [];
    this.wsClients = new Set();
  }

  registerWsClient(ws) {
    this.wsClients.add(ws);
    
    // Sofort aktuellen Zustand senden (Push Update)
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'STATE_SYNC',
        processes: this.getAllProcesses()
      }));
    }

    // Sende bisherige Log-History an neuen Client (letzte 100 Logs)
    const recentLogs = this.logHistory.slice(-100);
    for (const log of recentLogs) {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(log));
      }
    }

    ws.on('close', () => {
      this.wsClients.delete(ws);
    });
  }

  broadcastLog(logEntry) {
    const enriched = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      ...logEntry
    };

    this.logHistory.push(enriched);
    if (this.logHistory.length > 2000) {
      this.logHistory.shift();
    }

    const payload = JSON.stringify(enriched);
    for (const client of this.wsClients) {
      if (client.readyState === 1) {
        client.send(payload);
      }
    }
  }

  broadcastState() {
    const payload = JSON.stringify({
      type: 'STATE_SYNC',
      processes: this.getAllProcesses()
    });
    for (const client of this.wsClients) {
      if (client.readyState === 1) {
        client.send(payload);
      }
    }
  }

  getAllProcesses() {
    return Array.from(this.processes.values()).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      status: p.status,
      pid: p.child?.pid,
      port: p.port,
      workingDirectory: p.workingDirectory,
      command: p.command,
      startedAt: p.startedAt
    }));
  }

  setProcessStatus({ id, name, type = 'custom', status = 'building', workingDirectory = '', command = '', port, env = {} }) {
    const existing = this.processes.get(id) || {};
    const updated = {
      ...existing,
      id,
      name: name || existing.name || id,
      type: type || existing.type || 'custom',
      status,
      workingDirectory: workingDirectory || existing.workingDirectory || '',
      command: command || existing.command || '',
      port: port || existing.port,
      env: { ...(existing.env || {}), ...env },
      startedAt: existing.startedAt || new Date().toISOString()
    };
    this.processes.set(id, updated);
    this.broadcastState();
    return updated;
  }

  registerProcess({ id, name, type = 'custom', command, args = [], cwd, port, env = {}, status = 'stopped' }) {
    const existing = this.processes.get(id) || {};
    const fullCommand = typeof command === 'string' && args && args.length > 0 
      ? `${command} ${args.join(' ')}` 
      : (typeof command === 'string' ? command : (existing.command || ''));

    const updated = {
      ...existing,
      id,
      name: name || existing.name || id,
      type: type || existing.type || 'custom',
      command: fullCommand,
      execCommand: command || existing.execCommand || (fullCommand ? fullCommand.split(' ')[0] : ''),
      execArgs: args || existing.execArgs || (fullCommand && fullCommand.includes(' ') ? fullCommand.split(' ').slice(1) : []),
      workingDirectory: cwd || existing.workingDirectory || '',
      port: port || existing.port,
      env: { ...(existing.env || {}), ...env },
      status: status || 'stopped',
      startedAt: status === 'running' ? (existing.startedAt || new Date().toISOString()) : null,
      child: status === 'running' ? existing.child : null
    };
    this.processes.set(id, updated);
    this.broadcastState();
    return updated;
  }

  removeProcess(id) {
    if (this.processes.has(id)) {
      this.processes.delete(id);
      this.broadcastState();
      return true;
    }
    return false;
  }

  async startProcess({ id, name, type, command, args = [], cwd, port, env = {} }) {
    // Falls bereits läuft, vorher stoppen
    if (this.processes.has(id)) {
      await this.stopProcess(id);
    }

    this.broadcastLog({
      stream: 'system',
      processId: id,
      message: `[ProcessManager] Starte '${name}' in ${cwd}: ${command} ${args.join(' ')}`
    });

    try {
      const child = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        shell: true
      });

      // Beim Starten zunächst 'building' anzeigen, bis Dev-Server oder App bereit ist
      const isDevBuild = type === 'desktop_tauri' || type === 'desktop_electron' || 
                         (args && (args.includes('dev') || args.includes('run')));

      const procData = {
        id,
        name,
        type,
        command: typeof command === 'string' && args.length > 0 ? `${command} ${args.join(' ')}` : command,
        execCommand: command,
        execArgs: args,
        workingDirectory: cwd,
        port,
        env,
        status: isDevBuild ? 'building' : 'running',
        startedAt: new Date().toISOString(),
        child
      };

      this.processes.set(id, procData);
      this.broadcastState();

      // Automatischer Fallback-Timer: nach 10 Sekunden auf 'running' wechseln
      const readyTimer = setTimeout(() => {
        if (procData.status === 'building' && procData.child) {
          procData.status = 'running';
          this.broadcastState();
        }
      }, 10000);

      child.stdout.on('data', (data) => {
        const text = data.toString();
        this.broadcastLog({
          stream: 'stdout',
          processId: id,
          message: text
        });

        // Erkennung, dass Build abgeschlossen ist und Server/Fenster läuft
        if (procData.status === 'building') {
          if (
            text.includes('ready') || 
            text.includes('Local:') || 
            text.includes('localhost') || 
            text.includes('127.0.0.1') || 
            text.includes('Running') ||
            text.includes('Listening') ||
            text.includes('Now listening on') ||
            text.includes('Application started')
          ) {
            clearTimeout(readyTimer);
            procData.status = 'running';
            this.broadcastState();
          }
        }
      });

      child.stderr.on('data', (data) => {
        this.broadcastLog({
          stream: 'stderr',
          processId: id,
          message: data.toString()
        });
      });

      child.on('error', (err) => {
        this.broadcastLog({
          stream: 'stderr',
          processId: id,
          message: `[Error] ${err.message}`
        });
        procData.status = 'failed';
        procData.child = null;
        this.broadcastState();
      });

      child.on('close', (code) => {
        this.broadcastLog({
          stream: 'system',
          processId: id,
          message: `[Process Closed] Dienst '${procData.name}' beendet (Exit-Code ${code})`
        });
        procData.status = 'stopped';
        procData.child = null;
        this.broadcastState();
      });

      return procData;
    } catch (err) {
      this.broadcastLog({
        stream: 'stderr',
        processId: id,
        message: `[Spawn Failed] ${err.message}`
      });
      this.broadcastState();
      throw err;
    }
  }

  async stopProcess(id) {
    const proc = this.processes.get(id);
    if (!proc) {
      return false;
    }

    // Spezielles Handling für Docker-Container
    if (proc.type === 'container_docker') {
      this.broadcastLog({
        stream: 'system',
        processId: id,
        message: `[ProcessManager] Stoppe Docker Stack '${proc.name}' via 'docker compose down'...`
      });

      try {
        const { exec } = await import('child_process');
        const util = await import('util');
        const execAsync = util.promisify(exec);
        await execAsync('docker compose down', { cwd: proc.workingDirectory });
      } catch (e) {
        console.warn(`Docker compose down Hinweis/Fehler bei ${id}:`, e.message);
      }

      proc.status = 'stopped';
      proc.child = null;
      this.broadcastState();
      return true;
    }

    if (!proc.child || !proc.child.pid) {
      proc.status = 'stopped';
      proc.child = null;
      this.broadcastState();
      return true;
    }

    this.broadcastLog({
      stream: 'system',
      processId: id,
      message: `[ProcessManager] Stoppe Prozess '${proc.name}' (PID: ${proc.child.pid})...`
    });

    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', proc.child.pid.toString(), '/f', '/t']);
      } else {
        proc.child.kill('SIGTERM');
      }
      proc.status = 'stopped';
      proc.child = null;
      this.broadcastState();
      return true;
    } catch (err) {
      console.error(`Fehler beim Beenden von Prozess ${id}:`, err);
      proc.status = 'stopped';
      proc.child = null;
      this.broadcastState();
      return false;
    }
  }

  async startProcessById(id) {
    const proc = this.processes.get(id);
    if (!proc) {
      throw new Error(`Prozess '${id}' ist nicht registriert.`);
    }

    if (proc.type === 'container_docker') {
      const { startDockerContainers } = await import('./dockerManager.js');
      return startDockerContainers({
        projectId: proc.id.replace('_docker', ''),
        projectDir: proc.workingDirectory,
        ports: { backendPort: proc.port }
      });
    }

    this.broadcastLog({
      stream: 'system',
      processId: id,
      message: `[ProcessManager] Starte Dienst '${proc.name}' in ${proc.workingDirectory}...`
    });

    const command = proc.execCommand || (proc.command ? proc.command.split(' ')[0] : 'npm');
    const args = proc.execArgs || (proc.command && proc.command.includes(' ') ? proc.command.split(' ').slice(1) : []);

    return this.startProcess({
      id: proc.id,
      name: proc.name,
      type: proc.type,
      command,
      args,
      cwd: proc.workingDirectory,
      port: proc.port,
      env: proc.env || {}
    });
  }

  async restartProcess(id) {
    const proc = this.processes.get(id);
    if (!proc) return false;
    await this.stopProcess(id);
    // Kurze Pause vor Neustart
    await new Promise(r => setTimeout(r, 1000));
    return this.startProcessById(id);
  }
}

export const processManager = new ProcessManager();
