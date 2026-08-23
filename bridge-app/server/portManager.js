import net from 'net';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * Prüft, ob ein gegebener Port auf 127.0.0.1 frei ist.
 */
export function isPortAvailable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });
    server.listen(port, host);
  });
}

/**
 * Sucht den nächsten freien Port ab startPort.
 */
export async function findAvailablePort(startPort, maxAttempts = 50, host = '127.0.0.1') {
  let currentPort = startPort;
  for (let i = 0; i < maxAttempts; i++) {
    const available = await isPortAvailable(currentPort, host);
    if (available) {
      return currentPort;
    }
    currentPort++;
  }
  throw new Error(`Kein freier Port gefunden im Bereich ${startPort} bis ${startPort + maxAttempts}`);
}

/**
 * Ermittelt den Prozess (PID), der einen bestimmten Port belegt (Windows / Linux).
 */
export async function getProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execPromise(`netstat -ano -p tcp | findstr :${port}`);
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1].endsWith(`:${port}`) && parts[3] === 'LISTENING') {
          const pid = parseInt(parts[4], 10);
          if (!isNaN(pid) && pid > 0) {
            return { pid, port };
          }
        }
      }
    } else {
      const { stdout } = await execPromise(`lsof -i :${port} -t`);
      const pid = parseInt(stdout.trim(), 10);
      if (!isNaN(pid) && pid > 0) {
        return { pid, port };
      }
    }
  } catch (err) {
    // Kein Prozess gefunden oder Befehl fehlgeschlagen
  }
  return null;
}

/**
 * Beendet den Prozess, der einen Port belegt.
 */
export async function killProcessOnPort(port) {
  const proc = await getProcessOnPort(port);
  if (!proc) {
    return { killed: false, message: `Kein Prozess auf Port ${port} gefunden.` };
  }

  try {
    if (process.platform === 'win32') {
      await execPromise(`taskkill /F /PID ${proc.pid}`);
    } else {
      process.kill(proc.pid, 'SIGKILL');
    }
    return { killed: true, pid: proc.pid, port, message: `Prozess ${proc.pid} auf Port ${port} beendet.` };
  } catch (err) {
    return { killed: false, pid: proc.pid, port, error: err.message };
  }
}
