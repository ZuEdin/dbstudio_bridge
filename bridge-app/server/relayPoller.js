import { collectSystemTelemetry } from './telemetry.js';
import { loadSettings } from './config.js';
import { handleDeploymentLogic } from './server.js';
import { processManager } from './processManager.js';

let pollerInterval = null;
let isPolling = false;

export function startRelayPoller() {
  stopRelayPoller();
  
  const checkAndPoll = async () => {
    const settings = loadSettings();
    if (!settings.relay || !settings.relay.enabled || !settings.relay.relayUrl) {
      return;
    }

    if (isPolling) return;
    isPolling = true;

    try {
      const relayUrl = settings.relay.relayUrl.trim();
      const token = settings.securityToken;
      const telemetry = await collectSystemTelemetry();

      // 1. Jobs abholen & Vollständige Zwei-Wege-Telemetrie an PHP Relay senden
      const res = await fetch(`${relayUrl}?action=pull_jobs&token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bridge-Token': token,
          'bypass-tunnel-reminder': '1'
        },
        body: JSON.stringify(telemetry)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.jobs && data.jobs.length > 0) {
          for (const job of data.jobs) {
            await executeRelayJob(job, settings, relayUrl, token);
          }
        }
      }

      // 2. Synchronisiere die letzten 20 Logs mit dem Relay für DB Studio
      if (processManager.logHistory && processManager.logHistory.length > 0) {
        const recentLogs = processManager.logHistory.slice(-20);
        await fetch(`${relayUrl}?action=push_logs&token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Bridge-Token': token },
          body: JSON.stringify(recentLogs)
        }).catch(() => {});
      }
    } catch (err) {
      // Leise fehlschlagen bei Verbindungsunterbrechung
    } finally {
      isPolling = false;
    }
  };

  // Alle 2 Sekunden prüfen
  pollerInterval = setInterval(checkAndPoll, 2000);
  checkAndPoll();
}

export function stopRelayPoller() {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
  }
}

async function executeRelayJob(job, settings, relayUrl, token) {
  let payload = job.payload;
  if (!payload) return;

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      console.error('[RelayPoller] Ungültiges JSON im Job-Payload:', e);
      return;
    }
  }

  const projectId = payload.projectId || payload.processId || 'Project_' + Date.now();

  // 1. Prüfe ob es ein Prozess-Steuerungs-Befehl ist (STOP / RESTART / START / KILL)
  if (payload.controlAction || payload.action) {
    const act = (payload.controlAction || payload.action).toLowerCase();
    console.log(`[Relay Gateway] ⚡ Prozess-Befehl empfangen: ${act.toUpperCase()} für '${projectId}'`);
    
    if (act === 'stop' || act === 'kill') {
      await processManager.stopProcess(projectId + '_backend');
      await processManager.stopProcess(projectId + '_frontend');
      await processManager.stopProcess(projectId);
    } else if (act === 'restart') {
      await processManager.restartProcess(projectId + '_backend');
      await processManager.restartProcess(projectId + '_frontend');
      await processManager.restartProcess(projectId);
    } else if (act === 'start') {
      await processManager.restartProcess(projectId + '_backend');
      await processManager.restartProcess(projectId + '_frontend');
    }
    return;
  }

  // 2. Normaler Deploy-Auftrag
  console.log(`[Relay Gateway] 🚀 Neuer Deploy-Auftrag vom PHP-Server abgeholt: '${projectId}'`);

  try {
    const result = await handleDeploymentLogic(payload, settings);
    console.log(`[Relay Gateway] ✅ Bereitstellung für '${projectId}' erfolgreich ausgeführt:`, result.ports);

    // 3. Ergebnis an das PHP-Relay zurückmelden
    if (relayUrl && job.id) {
      await fetch(`${relayUrl}?action=push_result&token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Bridge-Token': token },
        body: JSON.stringify({ jobId: job.id, success: true, result })
      }).catch(() => {});
    }
  } catch (err) {
    console.error(`[Relay Gateway] ❌ Fehler beim Ausführen des Jobs:`, err);
    if (relayUrl && job.id) {
      await fetch(`${relayUrl}?action=push_result&token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Bridge-Token': token },
        body: JSON.stringify({ jobId: job.id, success: false, error: err.message })
      }).catch(() => {});
    }
  }
}
