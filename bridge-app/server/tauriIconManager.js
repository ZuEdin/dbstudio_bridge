import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DBSTUDIO_EXTERNAL_ICONS_DIR = 'C:\\_DEV\\dbstudio_icons';
const DBSTUDIO_LOCAL_ASSETS_DIR = path.join(__dirname, 'assets', 'dbstudio-icons');
const LOCAL_ASSETS_DIR = path.join(__dirname, 'assets', 'tauri-icons');
const FALLBACK_SRC_TAURI_ICONS = path.join(__dirname, '..', 'src-tauri', 'icons');

const REQUIRED_TAURI_ICONS = [
  '32x32.png',
  '128x128.png',
  '128x128@2x.png',
  'icon.icns',
  'icon.ico',
  'icon.png'
];

const DBSTUDIO_ICON_MAP = {
  '32x32.png': 'favicon-32x32.png',
  '128x128.png': 'apple-icon-120x120.png',
  '128x128@2x.png': 'favicon-256x256.png',
  'icon.ico': 'favicon.ico',
  'icon.png': 'favicon-256x256.png'
};

const WEB_ICON_FILES = [
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-96x96.png',
  'favicon-256x256.png',
  'apple-icon-180x180.png',
  'android-icon-192x192.png',
  'manifest.json',
  'browserconfig.xml'
];

/**
 * Lädt eine Datei von einer HTTPS-URL herunter
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download fehlgeschlagen mit HTTP ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(() => resolve(true));
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Stellt sicher, dass alle standardmäßigen Tauri-Desktop-Icons im Zielverzeichnis vorhanden sind.
 */
export async function ensureTauriIcons(targetTauriOrIconsDir) {
  let iconsDir = targetTauriOrIconsDir;
  if (!iconsDir.endsWith('icons')) {
    iconsDir = path.join(iconsDir, 'icons');
  }

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const restored = [];
  const errors = [];

  for (const icon of REQUIRED_TAURI_ICONS) {
    const targetPath = path.join(iconsDir, icon);
    const existsAndValid = fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0;

    if (!existsAndValid) {
      let restoredFromSource = false;

      // 1. DB Studio Branding Icons aus externem Ordner prüfen (C:\_DEV\dbstudio_icons)
      const mappedDbStudioFile = DBSTUDIO_ICON_MAP[icon];
      if (mappedDbStudioFile) {
        const extPath = path.join(DBSTUDIO_EXTERNAL_ICONS_DIR, mappedDbStudioFile);
        if (fs.existsSync(extPath) && fs.statSync(extPath).size > 0) {
          try {
            fs.copyFileSync(extPath, targetPath);
            restored.push(`${icon} (aus DB Studio Branding)`);
            restoredFromSource = true;
          } catch (e) {}
        }

        // 1b. DB Studio Icons aus lokalem Server-Asset-Ordner prüfen
        if (!restoredFromSource) {
          const localDbPath = path.join(DBSTUDIO_LOCAL_ASSETS_DIR, mappedDbStudioFile);
          if (fs.existsSync(localDbPath) && fs.statSync(localDbPath).size > 0) {
            try {
              fs.copyFileSync(localDbPath, targetPath);
              restored.push(`${icon} (aus lokalem DB Studio Asset Store)`);
              restoredFromSource = true;
            } catch (e) {}
          }
        }
      }

      // 2. Lokale Vorlage aus server/assets/tauri-icons prüfen
      if (!restoredFromSource) {
        const localAssetPath = path.join(LOCAL_ASSETS_DIR, icon);
        if (fs.existsSync(localAssetPath) && fs.statSync(localAssetPath).size > 0) {
          try {
            fs.copyFileSync(localAssetPath, targetPath);
            restored.push(`${icon} (aus lokalem Bridge-Cache)`);
            restoredFromSource = true;
          } catch (e) {}
        }
      }

      // 3. Lokale Vorlage aus bridge-app/src-tauri/icons prüfen
      if (!restoredFromSource) {
        const fallbackPath = path.join(FALLBACK_SRC_TAURI_ICONS, icon);
        if (fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).size > 0) {
          try {
            fs.copyFileSync(fallbackPath, targetPath);
            restored.push(`${icon} (aus App-Assets)`);
            restoredFromSource = true;
          } catch (e) {}
        }
      }

      // 4. Wenn lokal nicht verfügbar, automatisch via HTTPS von GitHub herunterladen
      if (!restoredFromSource) {
        const remoteUrl = `https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/${icon}`;
        try {
          await downloadFile(remoteUrl, targetPath);
          restored.push(`${icon} (automatisch von GitHub geladen)`);
        } catch (err) {
          errors.push(`Fehler beim Download von ${icon}: ${err.message}`);
        }
      }
    }
  }

  return {
    success: errors.length === 0,
    iconsDir,
    restored,
    errors
  };
}

/**
 * Stellt sicher, dass alle Web-Frontend-Icons (React, Angular, Vue, HTML, Blazor etc.)
 * automatisch mit dem professionellen DB Studio Branding ausgestattet werden.
 *
 * @param {string} projectOrFrontendDir Pfad zum Frontend- oder Projekt-Verzeichnis
 * @returns {Promise<{success: boolean, targetDirs: string[], copied: string[]}>}
 */
export async function ensureFrontendIcons(projectOrFrontendDir) {
  const copied = [];
  const targetDirs = [];

  const sourceDir = fs.existsSync(DBSTUDIO_EXTERNAL_ICONS_DIR) 
    ? DBSTUDIO_EXTERNAL_ICONS_DIR 
    : DBSTUDIO_LOCAL_ASSETS_DIR;

  if (!fs.existsSync(sourceDir)) {
    return { success: false, targetDirs: [], copied: [] };
  }

  // Relevante Zielordner für Web-Assets ermitteln
  const candidateSubdirs = [
    'public',
    'src/assets',
    'src',
    'wwwroot'
  ];

  const searchBases = [projectOrFrontendDir];
  const feSub = path.join(projectOrFrontendDir, 'Frontend');
  if (fs.existsSync(feSub)) searchBases.push(feSub);

  for (const base of searchBases) {
    for (const sub of candidateSubdirs) {
      const dir = path.join(base, sub);
      if (fs.existsSync(dir) && !targetDirs.includes(dir)) {
        targetDirs.push(dir);
      }
    }
  }

  // Falls noch kein passender Ordner existiert, erstelle 'public'
  if (targetDirs.length === 0) {
    const defaultPublic = fs.existsSync(feSub) 
      ? path.join(feSub, 'public') 
      : path.join(projectOrFrontendDir, 'public');
    fs.mkdirSync(defaultPublic, { recursive: true });
    targetDirs.push(defaultPublic);
  }

  // Icons kopieren
  for (const targetDir of targetDirs) {
    for (const file of WEB_ICON_FILES) {
      const srcFile = path.join(sourceDir, file);
      const destFile = path.join(targetDir, file);

      if (fs.existsSync(srcFile)) {
        try {
          fs.copyFileSync(srcFile, destFile);
          copied.push(`${file} -> ${path.relative(projectOrFrontendDir, destFile)}`);
        } catch (e) {}
      }
    }
  }

  // index.html anpassen & Favicon-Referenzen sicherstellen
  const indexHtmlCandidates = [
    path.join(projectOrFrontendDir, 'index.html'),
    path.join(feSub, 'index.html'),
    path.join(projectOrFrontendDir, 'src', 'index.html'),
    path.join(feSub, 'src', 'index.html')
  ];

  for (const htmlPath of indexHtmlCandidates) {
    if (fs.existsSync(htmlPath)) {
      try {
        let content = fs.readFileSync(htmlPath, 'utf-8');
        let modified = false;

        // Vite Default Icon ersetzen
        if (content.includes('href="/vite.svg"') || content.includes('href="vite.svg"')) {
          content = content.replace(/href="[^"]*vite\.svg"/g, 'href="/favicon.ico"');
          modified = true;
        }

        // Falls kein Favicon vorhanden, im <head> einbetten
        if (!content.includes('rel="icon"') && content.includes('<head>')) {
          content = content.replace(
            '<head>',
            '<head>\n    <link rel="icon" type="image/x-icon" href="/favicon.ico" />\n    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />\n    <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />'
          );
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(htmlPath, content, 'utf-8');
          copied.push(`index.html (DB Studio Favicon eingebunden)`);
        }
      } catch (e) {}
    }
  }

  return {
    success: true,
    targetDirs,
    copied
  };
}
