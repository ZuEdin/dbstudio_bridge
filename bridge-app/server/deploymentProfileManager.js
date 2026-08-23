import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

const PROFILES_FILE = path.resolve('server/deployment_profiles.json');

// Standard-Profile
const DEFAULT_PROFILES = [
  {
    id: 'staging',
    name: 'Staging Server',
    environment: 'staging',
    protocol: 'ftps',
    host: 'staging.meinedomain.de',
    port: 21,
    username: 'staging-deploy',
    remotePath: '/var/www/staging/app',
    healthCheckUrl: 'https://staging.meinedomain.de/health',
    autoDeployOnBuild: false
  },
  {
    id: 'production',
    name: 'Produktions Server',
    environment: 'production',
    protocol: 'sftp',
    host: 'live.meinedomain.de',
    port: 22,
    username: 'prod-deploy',
    remotePath: '/var/www/production/app',
    healthCheckUrl: 'https://meinedomain.de/api/health',
    autoDeployOnBuild: false
  }
];

export function getDeploymentProfiles() {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    // Ignore and return defaults
  }
  return DEFAULT_PROFILES;
}

export function saveDeploymentProfiles(profiles) {
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Führt einen automatisierten Post-Deploy Healthcheck durch.
 */
export async function performDeployHealthCheck(targetUrl) {
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return { success: false, error: 'Ungültige URL (muss mit http:// oder https:// beginnen).' };
  }

  const startTime = Date.now();

  return new Promise((resolve) => {
    try {
      const client = targetUrl.startsWith('https') ? https : http;
      const req = client.get(targetUrl, { timeout: 8000 }, (res) => {
        const latencyMs = Date.now() - startTime;
        const statusCode = res.statusCode || 0;
        const isHealthy = statusCode >= 200 && statusCode < 400;

        resolve({
          success: isHealthy,
          url: targetUrl,
          statusCode,
          latencyMs,
          contentType: res.headers['content-type'] || 'unknown',
          message: isHealthy 
            ? `Healthcheck erfolgreich (HTTP ${statusCode}, ${latencyMs}ms Latenz).`
            : `Server antwortete mit Fehler-Code HTTP ${statusCode}.`
        });
      });

      req.on('error', (err) => {
        resolve({
          success: false,
          url: targetUrl,
          latencyMs: Date.now() - startTime,
          error: `Verbindungsfehler: ${err.message}`
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          url: targetUrl,
          latencyMs: 8000,
          error: 'Zeitüberschreitung beim Healthcheck (Timeout > 8s).'
        });
      });
    } catch (err) {
      resolve({ success: false, url: targetUrl, error: err.message });
    }
  });
}
