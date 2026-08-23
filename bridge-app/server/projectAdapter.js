import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { linkSharedNodeModules } from './sharedDependencyManager.js';
import { ensureTauriIcons, ensureFrontendIcons } from './tauriIconManager.js';

/**
 * Passt das empfangene Projekt an die lokale Umgebung an.
 */
export async function adaptProject({
  projectDir,
  projectId,
  stack,
  ports,
  sharedDepsDir,
  allowedOrigins
}) {
  const modifications = [];

  // 1. Shared Node Modules verknüpfen & DB Studio Favicons/Icons bereitstellen (Frontend)
  const frontendDir = path.join(projectDir, 'Frontend');
  if (fs.existsSync(frontendDir)) {
    const linkResult = await linkSharedNodeModules(frontendDir, sharedDepsDir);
    modifications.push({
      file: 'Frontend/node_modules',
      action: 'link_shared_dependencies',
      details: linkResult
    });

    // DB Studio Favicons & Web App Icons (React, Angular, Vue, HTML etc.) einbinden
    const feIconResult = await ensureFrontendIcons(frontendDir);
    if (feIconResult.copied.length > 0) {
      modifications.push({
        file: 'Frontend/public',
        action: 'applied_dbstudio_web_icons',
        copiedCount: feIconResult.copied.length
      });
    }

    // 2. vite.config.ts anpassen
    const viteConfigPath = path.join(frontendDir, 'vite.config.ts');
    const viteConfigJsPath = path.join(frontendDir, 'vite.config.js');
    const targetViteConfig = fs.existsSync(viteConfigPath) ? viteConfigPath : (fs.existsSync(viteConfigJsPath) ? viteConfigJsPath : null);

    if (targetViteConfig) {
      let content = fs.readFileSync(targetViteConfig, 'utf-8');
      
      // Port & Host einbinden falls nicht vorhanden
      if (!content.includes(`port: ${ports.frontendPort}`)) {
        if (content.includes('server:')) {
          content = content.replace(/server:\s*\{[^}]*\}/s, `server: { port: ${ports.frontendPort}, host: true }`);
        } else if (content.includes('defineConfig({')) {
          content = content.replace('defineConfig({', `defineConfig({\n  server: { port: ${ports.frontendPort}, host: true },`);
        }
        fs.writeFileSync(targetViteConfig, content, 'utf-8');
        modifications.push({ file: path.basename(targetViteConfig), action: 'updated_server_port', port: ports.frontendPort });
      }
    }

    // 3. .env anpassen
    const envPath = path.join(frontendDir, '.env');
    const envContent = [
      `VITE_PORT=${ports.frontendPort}`,
      `VITE_BACKEND_URL=http://localhost:${ports.backendPort}`,
      `VITE_API_BASE_URL=http://localhost:${ports.backendPort}/api`,
      `VITE_PROJECT_ID=${projectId}`
    ].join('\n');
    fs.writeFileSync(envPath, envContent, 'utf-8');
    modifications.push({ file: 'Frontend/.env', action: 'written_environment_variables' });
  }

  // 4. Backend Konfigurationen anpassen (.NET / Node / SQLite)
  const backendDir = path.join(projectDir, 'Backend');
  if (fs.existsSync(backendDir)) {
    // Suche nach appsettings.json in allen Subfoldern von Backend
    const findAppSettings = (dir) => {
      const results = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(...findAppSettings(fullPath));
        } else if (file === 'appsettings.json' || file === 'appsettings.Development.json') {
          results.push(fullPath);
        }
      }
      return results;
    };

    const appSettingsFiles = findAppSettings(backendDir);
    for (const appSettingsPath of appSettingsFiles) {
      try {
        const raw = fs.readFileSync(appSettingsPath, 'utf-8');
        const json = JSON.parse(raw);

        // SQLite & MySQL Pfad / Host anpassen
        if (json.ConnectionStrings) {
          for (const key of Object.keys(json.ConnectionStrings)) {
            const conn = json.ConnectionStrings[key];
            if (conn.includes('.db') || conn.includes('sqlite')) {
              // Sicherstellen, dass das Datenbankverzeichnis existiert
              const dbDir = path.join(path.dirname(appSettingsPath), 'database');
              if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
              }
              const dbFile = path.join(dbDir, 'app.db').replace(/\\/g, '/');
              json.ConnectionStrings[key] = `Data Source=${dbFile}`;
            } else if (conn.includes('Server=') && (conn.includes('3306') || conn.includes('mysql') || conn.includes('mariadb'))) {
              // Falls MySQL in Docker läuft, ggf. anpassen
              // Default Server=localhost oder Server=db
            }
          }
        }

        // CORS Origins aktualisieren
        json.CorsOrigins = Array.from(new Set([
          ...(json.CorsOrigins || []),
          `http://localhost:${ports.frontendPort}`,
          `http://127.0.0.1:${ports.frontendPort}`,
          ...(allowedOrigins || [])
        ]));

        fs.writeFileSync(appSettingsPath, JSON.stringify(json, null, 2), 'utf-8');
        modifications.push({ file: path.relative(projectDir, appSettingsPath), action: 'updated_connection_and_cors' });
      } catch (err) {
        console.error('Fehler beim Aktualisieren von appsettings:', err);
      }
    }

    // PHP Backend Konfiguration (.env / config.php)
    const phpEnvPath = path.join(backendDir, '.env');
    if (!fs.existsSync(phpEnvPath) && (fs.existsSync(path.join(backendDir, 'index.php')) || fs.existsSync(path.join(backendDir, 'api.php')))) {
      const phpEnv = [
        `APP_ENV=development`,
        `APP_PORT=${ports.backendPort}`,
        `DB_HOST=127.0.0.1`,
        `DB_PORT=3306`,
        `DB_NAME=app_db`,
        `DB_USER=root`,
        `DB_PASSWORD=root`
      ].join('\n');
      fs.writeFileSync(phpEnvPath, phpEnv, 'utf-8');
      modifications.push({ file: 'Backend/.env', action: 'written_php_environment' });
    }
  }

  // 5. Tauri Icons automatisch überprüfen & bereitstellen falls Desktop-Projekt
  const findTauriDir = (dir) => {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file === 'src-tauri') return fullPath;
          if (file !== 'node_modules' && file !== '.git' && file !== 'target' && file !== 'dist') {
            const nested = findTauriDir(fullPath);
            if (nested) return nested;
          }
        }
      } catch (e) {}
    }
    return null;
  };

  const tauriDir = findTauriDir(projectDir);
  if (tauriDir) {
    const iconResult = await ensureTauriIcons(tauriDir);
    if (iconResult.restored.length > 0) {
      modifications.push({
        file: 'src-tauri/icons',
        action: 'auto_restored_tauri_icons',
        restored: iconResult.restored
      });
    }
  }

  return modifications;
}

/**
 * Schreibt empfangene Dateien oder entpackt ein ZIP-Archiv in den Projektordner.
 */
export async function writeProjectFiles(projectDir, payload) {
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Fall A: Array aus { path, content }
  if (Array.isArray(payload.files)) {
    for (const file of payload.files) {
      const fullPath = path.join(projectDir, file.path);
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(fullPath, file.content, 'utf-8');
    }
  }

  // Fall B: Base64 kodiertes ZIP-Archiv
  if (payload.zipBase64) {
    const zipBuffer = Buffer.from(payload.zipBase64, 'base64');
    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(projectDir, true);
  }

  return { success: true, projectDir };
}
