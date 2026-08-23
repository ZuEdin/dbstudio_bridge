import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import util from 'util';
import { linkSharedNodeModules } from './sharedDependencyManager.js';
import { ensureTauriIcons, ensureFrontendIcons } from './tauriIconManager.js';
import { processManager } from './processManager.js';

const execPromise = util.promisify(exec);

const findFileRecursive = (dir, predicate) => {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (predicate(f, p)) return p;
    if (fs.statSync(p).isDirectory() && f !== 'node_modules' && f !== '.git' && f !== 'target') {
      const res = findFileRecursive(p, predicate);
      if (res) return res;
    }
  }
  return null;
};

const findInstallers = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const p = path.join(dir, f.name);
    if (f.isDirectory() && f.name !== 'node_modules' && f.name !== '.git') {
      results.push(...findInstallers(p));
    } else if (f.isFile() && (f.name.endsWith('.msi') || (f.name.endsWith('.exe') && (f.name.toLowerCase().includes('setup') || f.name.toLowerCase().includes('installer') || p.includes('bundle') || p.includes('release'))))) {
      results.push(p);
    }
  }
  return results;
};

/**
 * Erstellt ein natives Installationspaket (.msi, .exe Setup, Single-File Binary)
 * für Tauri, Electron oder .NET Projekte.
 */
export async function buildInstallationPackage(projectId, settings) {
  const projectDir = path.join(settings.projectsDir, projectId);
  if (!fs.existsSync(projectDir)) {
    throw new Error(`Projektverzeichnis für '${projectId}' nicht gefunden: ${projectDir}`);
  }

  processManager.setProcessStatus({
    id: `${projectId}_package_build`,
    name: `${projectId} (Erstelle Installations-Package...)`,
    type: 'custom',
    status: 'building',
    workingDirectory: projectDir,
    command: 'Paketiere native Desktop-Installation'
  });

  processManager.broadcastLog({
    stream: 'system',
    message: `[PackageBuilder] Starte Erstellung des Installations-Packages für '${projectId}'...`
  });

  const backendDir = path.join(projectDir, 'Backend');
  const frontendDir = path.join(projectDir, 'Frontend');

  // Schritt 1: Frontend transpilieren falls vorhanden
  if (fs.existsSync(frontendDir)) {
    processManager.broadcastLog({
      stream: 'system',
      message: `[PackageBuilder] [1/3] Transpiliere Frontend (npm run build)...`
    });
    await linkSharedNodeModules(frontendDir, settings.sharedDependenciesDir);
    await ensureFrontendIcons(frontendDir);
    try {
      await execPromise('npm run build', { cwd: frontendDir });
    } catch (feErr) {
      processManager.broadcastLog({
        stream: 'stderr',
        message: `[PackageBuilder] Frontend-Build Warnung: ${feErr.message}`
      });
    }
  }

  // Schritt 2: copy-dist.js ausführen (falls Desktop App)
  if (fs.existsSync(backendDir)) {
    const copyDistFile = findFileRecursive(backendDir, f => f === 'copy-dist.js');
    if (copyDistFile) {
      try {
        processManager.broadcastLog({
          stream: 'system',
          message: `[PackageBuilder] [2/3] Kopiere Frontend-Assets (copy-dist.js)...`
        });
        await execPromise(`node "${path.basename(copyDistFile)}"`, { cwd: path.dirname(copyDistFile) });
      } catch (e) {}
    }
  }

  let appType = 'Unbekannt';
  let buildResult = null;
  let packageDir = projectDir;

  // Fall A: Tauri Desktop App
  const tauriDir = findFileRecursive(backendDir, (f, p) => f === 'src-tauri' && fs.statSync(p).isDirectory());
  if (tauriDir) {
    appType = 'Tauri Desktop App';
    const tauriPackageDir = path.dirname(tauriDir);
    packageDir = tauriPackageDir;
    await ensureTauriIcons(tauriDir);
    await linkSharedNodeModules(tauriPackageDir, settings.sharedDependenciesDir);

    processManager.broadcastLog({
      stream: 'system',
      message: `[PackageBuilder] [3/3] Kompiliere native Tauri Installer-Dateien (tauri build)...`
    });

    try {
      const { stdout, stderr } = await execPromise('npx tauri build || npm run tauri:build', { cwd: tauriPackageDir });
      buildResult = stdout;
    } catch (tauriErr) {
      processManager.broadcastLog({
        stream: 'stderr',
        message: `[PackageBuilder Error] ${tauriErr.message}`
      });
      // Trotzdem prüfen ob Installer erzeugt wurde
    }
  } else {
    // Fall B: Electron Desktop App
    const electronMarker = findFileRecursive(backendDir, (f, p) => f === 'README_ELECTRON.md' || (f === 'main.js' && !p.includes('dist')));
    if (electronMarker) {
      appType = 'Electron Desktop App';
      const elecPackageDir = path.dirname(electronMarker);
      packageDir = elecPackageDir;
      await linkSharedNodeModules(elecPackageDir, settings.sharedDependenciesDir);

      processManager.broadcastLog({
        stream: 'system',
        message: `[PackageBuilder] [3/3] Kompiliere Electron Installer-Paket...`
      });

      try {
        const { stdout } = await execPromise('npm run build || npx electron-builder', { cwd: elecPackageDir });
        buildResult = stdout;
      } catch (elecErr) {
        processManager.broadcastLog({
          stream: 'stderr',
          message: `[PackageBuilder Error] ${elecErr.message}`
        });
      }
    } else {
      // Fall C: .NET Self-Contained Binary
      const csprojFile = findFileRecursive(backendDir, f => f.endsWith('.csproj'));
      if (csprojFile) {
        appType = '.NET 10 Self-Contained Binary';
        const csprojDir = path.dirname(csprojFile);
        packageDir = csprojDir;

        processManager.broadcastLog({
          stream: 'system',
          message: `[PackageBuilder] [3/3] Erzeuge Single-File Release Executable (dotnet publish)...`
        });

        try {
          const { stdout } = await execPromise('dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true', { cwd: csprojDir });
          buildResult = stdout;
        } catch (dotnetErr) {
          processManager.broadcastLog({
            stream: 'stderr',
            message: `[PackageBuilder Error] ${dotnetErr.message}`
          });
        }
      }
    }
  }

  // Suche nach generierten Installations-Dateien (.msi, .exe)
  const installers = findInstallers(packageDir);
  const mainInstaller = installers.length > 0 ? installers[0] : null;

  processManager.removeProcess(`${projectId}_package_build`);

  processManager.broadcastLog({
    stream: 'system',
    message: mainInstaller 
      ? `[PackageBuilder] ✓ Installations-Package erfolgreich bereitgestellt: ${path.basename(mainInstaller)}` 
      : `[PackageBuilder] Build abgeschlossen in ${packageDir}`
  });

  return {
    success: true,
    projectId,
    appType,
    packageDir,
    installerPath: mainInstaller,
    installerName: mainInstaller ? path.basename(mainInstaller) : null,
    allInstallers: installers
  };
}

/**
 * Führt die erstellte Installations-Datei aus oder öffnet den Zielordner im Windows Explorer.
 */
export async function launchInstallerPackage(installerPath) {
  if (!installerPath || !fs.existsSync(installerPath)) {
    throw new Error(`Installations-Datei nicht gefunden: ${installerPath}`);
  }

  const isWindows = process.platform === 'win32';
  if (isWindows) {
    // Starte den Installer direkt als eigener Prozess
    spawn('cmd.exe', ['/c', 'start', '""', installerPath], {
      detached: true,
      stdio: 'ignore'
    }).unref();
  } else {
    spawn('xdg-open', [installerPath], { detached: true }).unref();
  }

  return {
    success: true,
    message: `Installationspaket '${path.basename(installerPath)}' gestartet.`
  };
}

/**
 * Öffnet den Ordner mit der Installations-Datei im Explorer
 */
export async function openInstallerFolder(installerOrDirPath) {
  if (!installerOrDirPath || !fs.existsSync(installerOrDirPath)) {
    throw new Error(`Pfad nicht gefunden: ${installerOrDirPath}`);
  }

  const stat = fs.statSync(installerOrDirPath);
  if (process.platform === 'win32') {
    const winPath = path.normalize(installerOrDirPath).replace(/\//g, '\\');
    if (stat.isFile()) {
      spawn('explorer.exe', [`/select,${winPath}`], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('explorer.exe', [winPath], { detached: true, stdio: 'ignore' }).unref();
    }
  } else {
    spawn('xdg-open', [installerOrDirPath], { detached: true, stdio: 'ignore' }).unref();
  }

  return { success: true };
}
