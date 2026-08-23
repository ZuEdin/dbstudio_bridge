import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);
const TASK_NAME = 'DBStudioBridgeDaemon';

/**
 * Verwaltet Windows Autostart und Windows Dienst-Registrierungen.
 */
export async function getWindowsAutostartStatus() {
  if (process.platform !== 'win32') {
    return { supported: false, enabled: false, message: 'Nur unter Windows verfügbar.' };
  }

  try {
    const { stdout } = await execPromise(`schtasks /Query /TN "${TASK_NAME}" /FO CSV /NH`);
    const isPresent = stdout.toLowerCase().includes(TASK_NAME.toLowerCase());
    return {
      supported: true,
      enabled: isPresent,
      taskName: TASK_NAME,
      message: isPresent ? 'Autostart aktiv (Windows Aufgabenplanung)' : 'Autostart inaktiv'
    };
  } catch (err) {
    // Wenn schtasks fehlschlägt, ist die Aufgabe nicht registriert
    return {
      supported: true,
      enabled: false,
      taskName: TASK_NAME,
      message: 'Autostart inaktiv'
    };
  }
}

export async function toggleWindowsAutostart(enable, scriptPath) {
  if (process.platform !== 'win32') {
    return { success: false, error: 'Nur unter Windows verfügbar.' };
  }

  const targetScript = scriptPath || path.resolve('server/server.js');

  if (enable) {
    try {
      // Erstelle Aufgabe im Task Scheduler für Benutzeranmeldung
      const cmd = `schtasks /Create /TN "${TASK_NAME}" /TR "node \\"${targetScript}\\"" /SC ONLOGON /RL HIGHEST /F`;
      await execPromise(cmd);
      return { success: true, enabled: true, message: `Autostart erfolgreich für '${TASK_NAME}' eingerichtet.` };
    } catch (err) {
      return { success: false, error: `Fehler beim Einrichten: ${err.message}` };
    }
  } else {
    try {
      await execPromise(`schtasks /Delete /TN "${TASK_NAME}" /F`);
      return { success: true, enabled: false, message: `Autostart für '${TASK_NAME}' erfolgreich entfernt.` };
    } catch (err) {
      return { success: true, enabled: false, message: 'Autostart-Aufgabe war nicht vorhanden.' };
    }
  }
}
