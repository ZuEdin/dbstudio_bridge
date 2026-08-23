import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { processManager } from './processManager.js';
import { linkSharedNodeModules } from './sharedDependencyManager.js';

const execPromise = util.promisify(exec);

/**
 * Scannt ein Verzeichnis nach Package-Dateien und liefert gefundene Dependencies zurück.
 */
export async function getDependenciesForDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return { error: `Verzeichnis '${dirPath}' existiert nicht.` };
  }

  const result = {
    dirPath,
    npm: null,
    nuget: null,
    cargo: null
  };

  // 1. NPM (package.json)
  const pkgPath = path.join(dirPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const raw = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(raw);

      const prodDeps = Object.entries(pkg.dependencies || {}).map(([name, version]) => ({
        name,
        version: String(version),
        type: 'production',
        manager: 'npm'
      }));

      const devDeps = Object.entries(pkg.devDependencies || {}).map(([name, version]) => ({
        name,
        version: String(version),
        type: 'development',
        manager: 'npm'
      }));

      const nodeModulesPath = path.join(dirPath, 'node_modules');
      let isSymlink = false;
      let nodeModulesInstalled = fs.existsSync(nodeModulesPath);
      if (nodeModulesInstalled) {
        try {
          const stats = fs.lstatSync(nodeModulesPath);
          isSymlink = stats.isSymbolicLink() || (process.platform === 'win32' && stats.isDirectory());
        } catch { }
      }

      result.npm = {
        name: pkg.name || path.basename(dirPath),
        version: pkg.version || '1.0.0',
        dependencies: prodDeps,
        devDependencies: devDeps,
        totalCount: prodDeps.length + devDeps.length,
        nodeModulesInstalled,
        isSymlinked: isSymlink,
        scripts: Object.keys(pkg.scripts || {})
      };
    } catch (e) {
      result.npm = { error: `Fehler beim Parsen von package.json: ${e.message}` };
    }
  }

  // 2. NuGet (.csproj)
  try {
    const files = fs.readdirSync(dirPath);
    const csproj = files.find(f => f.endsWith('.csproj'));
    if (csproj) {
      const csprojContent = fs.readFileSync(path.join(dirPath, csproj), 'utf-8');
      const nugetPackages = [];
      const regex = /<PackageReference\s+Include="([^"]+)"(?:\s+Version="([^"]+)")?/gi;
      let match;
      while ((match = regex.exec(csprojContent)) !== null) {
        nugetPackages.push({
          name: match[1],
          version: match[2] || 'Latest',
          type: 'production',
          manager: 'nuget'
        });
      }
      result.nuget = {
        projectName: csproj,
        packages: nugetPackages,
        totalCount: nugetPackages.length
      };
    }
  } catch { }

  // 3. Cargo (Cargo.toml für Tauri/Rust)
  const cargoPath = path.join(dirPath, 'Cargo.toml');
  const srcTauriCargo = path.join(dirPath, 'src-tauri', 'Cargo.toml');
  const targetCargo = fs.existsSync(cargoPath) ? cargoPath : (fs.existsSync(srcTauriCargo) ? srcTauriCargo : null);

  if (targetCargo) {
    try {
      const content = fs.readFileSync(targetCargo, 'utf-8');
      const crates = [];
      const lines = content.split('\n');
      let inDepsSection = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('[dependencies]') || trimmed.startsWith('[target.') && trimmed.includes('.dependencies]')) {
          inDepsSection = true;
          continue;
        }
        if (trimmed.startsWith('[') && !trimmed.includes('dependencies')) {
          inDepsSection = false;
        }
        if (inDepsSection && trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [crateName, ...verPart] = trimmed.split('=');
          crates.push({
            name: crateName.trim(),
            version: verPart.join('=').trim().replace(/"/g, ''),
            type: 'production',
            manager: 'cargo'
          });
        }
      }
      result.cargo = {
        cargoFile: path.basename(targetCargo),
        crates,
        totalCount: crates.length
      };
    } catch { }
  }

  return result;
}

/**
 * Ermittelt alle verfügbaren Targets (Shared Store + Lokale Projekte und Subordner).
 */
export async function getAllDependencyTargets(settings) {
  const targets = [];

  // 1. Zentraler Shared Store
  const sharedDir = settings.sharedDependenciesDir;
  if (fs.existsSync(sharedDir)) {
    targets.push({
      id: 'shared',
      name: '📦 Zentraler Shared Dependencies Store (Global)',
      type: 'global_shared',
      path: sharedDir,
      subTargets: []
    });
  }

  // 2. Projekte
  const projectsDir = settings.projectsDir;
  if (fs.existsSync(projectsDir)) {
    const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projDir = path.join(projectsDir, entry.name);
        const subTargets = [];

        // Frontend
        const feDir = path.join(projDir, 'Frontend');
        if (fs.existsSync(feDir)) {
          subTargets.push({
            id: `${entry.name}__frontend`,
            name: `Frontend (React/Vite)`,
            subPath: 'Frontend',
            fullPath: feDir
          });
        }

        // Backend
        const beDir = path.join(projDir, 'Backend');
        if (fs.existsSync(beDir)) {
          // Backend kann Unterordner haben (z. B. Tauri App oder .NET API)
          const beSubEntries = fs.readdirSync(beDir, { withFileTypes: true });
          let foundSub = false;
          for (const sub of beSubEntries) {
            if (sub.isDirectory() && sub.name !== 'node_modules') {
              const fullSub = path.join(beDir, sub.name);
              if (fs.existsSync(path.join(fullSub, 'package.json')) || fs.existsSync(path.join(fullSub, 'src-tauri')) || fs.readdirSync(fullSub).some(f => f.endsWith('.csproj'))) {
                subTargets.push({
                  id: `${entry.name}__backend_${sub.name}`,
                  name: `Backend / Desktop (${sub.name})`,
                  subPath: path.join('Backend', sub.name),
                  fullPath: fullSub
                });
                foundSub = true;
              }
            }
          }
          if (!foundSub) {
            subTargets.push({
              id: `${entry.name}__backend`,
              name: `Backend (Root)`,
              subPath: 'Backend',
              fullPath: beDir
            });
          }
        }

        targets.push({
          id: entry.name,
          name: `📁 ${entry.name}`,
          type: 'project',
          path: projDir,
          subTargets
        });
      }
    }
  }

  return targets;
}

/**
 * Installiert ein Paket im angegebenen Zielverzeichnis.
 */
export async function installPackage({ targetDir, packageManager = 'npm', packageName, isDev = false, version }) {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Zielverzeichnis '${targetDir}' existiert nicht.`);
  }
  if (!packageName || !packageName.trim()) {
    throw new Error('Paketname darf nicht leer sein.');
  }

  const pkgNameClean = packageName.trim();
  const pkgWithVersion = version && version.trim() ? `${pkgNameClean}@${version.trim()}` : pkgNameClean;

  let command = '';
  if (packageManager === 'npm') {
    const devFlag = isDev ? '--save-dev' : '--save';
    command = `npm install ${devFlag} ${pkgWithVersion}`;
  } else if (packageManager === 'nuget') {
    const verArg = version && version.trim() ? `--version ${version.trim()}` : '';
    command = `dotnet add package ${pkgNameClean} ${verArg}`.trim();
  } else if (packageManager === 'cargo') {
    const verArg = version && version.trim() ? `@${version.trim()}` : '';
    command = `cargo add ${pkgNameClean}${verArg}`;
  } else {
    throw new Error(`Nicht unterstützter Paketmanager: ${packageManager}`);
  }

  processManager.broadcastLog({
    stream: 'system',
    message: `[Package Manager] Führe Befehl aus: '${command}' in ${targetDir}...`
  });

  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: targetDir,
      env: process.env,
      shell: true
    });

    const output = `${stdout || ''}\n${stderr || ''}`.trim();

    processManager.broadcastLog({
      stream: 'stdout',
      message: `[Package Manager Success] '${pkgWithVersion}' erfolgreich installiert.\n${output}`
    });

    return {
      success: true,
      command,
      output,
      message: `Paket '${pkgWithVersion}' wurde erfolgreich installiert.`
    };
  } catch (err) {
    const errMsg = `${err.message}\n${err.stderr || ''}`;
    processManager.broadcastLog({
      stream: 'stderr',
      message: `[Package Manager Error] Installation von '${pkgWithVersion}' fehlgeschlagen: ${errMsg}`
    });
    throw new Error(`Fehler bei '${command}': ${errMsg}`);
  }
}

/**
 * Deinstalliert ein Paket aus dem Zielverzeichnis.
 */
export async function uninstallPackage({ targetDir, packageManager = 'npm', packageName }) {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Zielverzeichnis '${targetDir}' existiert nicht.`);
  }
  if (!packageName || !packageName.trim()) {
    throw new Error('Paketname darf nicht leer sein.');
  }

  const pkgNameClean = packageName.trim();
  let command = '';

  if (packageManager === 'npm') {
    command = `npm uninstall ${pkgNameClean}`;
  } else if (packageManager === 'nuget') {
    command = `dotnet remove package ${pkgNameClean}`;
  } else if (packageManager === 'cargo') {
    command = `cargo rm ${pkgNameClean}`;
  } else {
    throw new Error(`Nicht unterstützter Paketmanager: ${packageManager}`);
  }

  processManager.broadcastLog({
    stream: 'system',
    message: `[Package Manager] Deinstalliere '${pkgNameClean}' via: '${command}' in ${targetDir}...`
  });

  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: targetDir,
      env: process.env,
      shell: true
    });

    const output = `${stdout || ''}\n${stderr || ''}`.trim();

    processManager.broadcastLog({
      stream: 'stdout',
      message: `[Package Manager] '${pkgNameClean}' erfolgreich deinstalliert.`
    });

    return {
      success: true,
      command,
      output,
      message: `Paket '${pkgNameClean}' wurde erfolgreich deinstalliert.`
    };
  } catch (err) {
    const errMsg = `${err.message}\n${err.stderr || ''}`;
    processManager.broadcastLog({
      stream: 'stderr',
      message: `[Package Manager Error] Deinstallation von '${pkgNameClean}' fehlgeschlagen: ${errMsg}`
    });
    throw new Error(`Fehler bei '${command}': ${errMsg}`);
  }
}

/**
 * Führt einen vollständigen Install / Restore aller Dependencies aus.
 */
export async function restoreAllDependencies({ targetDir, packageManager = 'npm' }) {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Zielverzeichnis '${targetDir}' existiert nicht.`);
  }

  let command = '';
  if (packageManager === 'npm') {
    command = 'npm install';
  } else if (packageManager === 'nuget') {
    command = 'dotnet restore';
  } else if (packageManager === 'cargo') {
    command = 'cargo check';
  } else {
    command = 'npm install';
  }

  processManager.broadcastLog({
    stream: 'system',
    message: `[Package Manager] Starte vollständige Synchronisation via '${command}' in ${targetDir}...`
  });

  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: targetDir,
      env: process.env,
      shell: true
    });

    const output = `${stdout || ''}\n${stderr || ''}`.trim();

    processManager.broadcastLog({
      stream: 'stdout',
      message: `[Package Manager] Dependencies erfolgreich synchronisiert/wiederhergestellt.`
    });

    return {
      success: true,
      command,
      output,
      message: 'Alle Dependencies wurden erfolgreich synchronisiert.'
    };
  } catch (err) {
    const errMsg = `${err.message}\n${err.stderr || ''}`;
    processManager.broadcastLog({
      stream: 'stderr',
      message: `[Package Manager Error] Restore fehlgeschlagen: ${errMsg}`
    });
    throw new Error(`Fehler bei '${command}': ${errMsg}`);
  }
}

/**
 * Aktualisiert ein bestimmtes Paket auf die neueste Version (Latest).
 */
export async function updatePackage({ targetDir, packageManager = 'npm', packageName, isDev = false }) {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Zielverzeichnis '${targetDir}' existiert nicht.`);
  }
  if (!packageName || !packageName.trim()) {
    throw new Error('Paketname darf nicht leer sein.');
  }

  const pkgNameClean = packageName.trim();
  let command = '';

  if (packageManager === 'npm') {
    const devFlag = isDev ? '--save-dev' : '--save';
    command = `npm install ${devFlag} ${pkgNameClean}@latest`;
  } else if (packageManager === 'nuget') {
    command = `dotnet add package ${pkgNameClean}`;
  } else if (packageManager === 'cargo') {
    command = `cargo update -p ${pkgNameClean}`;
  } else {
    throw new Error(`Nicht unterstützter Paketmanager: ${packageManager}`);
  }

  processManager.broadcastLog({
    stream: 'system',
    message: `[Package Manager] Aktualisiere '${pkgNameClean}' auf neueste Version via '${command}' in ${targetDir}...`
  });

  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: targetDir,
      env: process.env,
      shell: true
    });

    const output = `${stdout || ''}\n${stderr || ''}`.trim();

    processManager.broadcastLog({
      stream: 'stdout',
      message: `[Package Manager Success] '${pkgNameClean}' erfolgreich aktualisiert.\n${output}`
    });

    return {
      success: true,
      command,
      output,
      message: `Paket '${pkgNameClean}' wurde erfolgreich auf die neueste Version aktualisiert.`
    };
  } catch (err) {
    const errMsg = `${err.message}\n${err.stderr || ''}`;
    processManager.broadcastLog({
      stream: 'stderr',
      message: `[Package Manager Error] Update von '${pkgNameClean}' fehlgeschlagen: ${errMsg}`
    });
    throw new Error(`Fehler bei '${command}': ${errMsg}`);
  }
}

/**
 * Aktualisiert alle Pakete im Zielverzeichnis auf die neuesten Versionen.
 */
export async function updateAllPackages({ targetDir, packageManager = 'npm' }) {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Zielverzeichnis '${targetDir}' existiert nicht.`);
  }

  let command = '';
  if (packageManager === 'npm') {
    command = 'npm update';
  } else if (packageManager === 'nuget') {
    command = 'dotnet restore';
  } else if (packageManager === 'cargo') {
    command = 'cargo update';
  } else {
    command = 'npm update';
  }

  processManager.broadcastLog({
    stream: 'system',
    message: `[Package Manager] Aktualisiere alle Pakete via '${command}' in ${targetDir}...`
  });

  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: targetDir,
      env: process.env,
      shell: true
    });

    const output = `${stdout || ''}\n${stderr || ''}`.trim();

    processManager.broadcastLog({
      stream: 'stdout',
      message: `[Package Manager] Alle Pakete erfolgreich aktualisiert.`
    });

    return {
      success: true,
      command,
      output,
      message: 'Alle Pakete wurden erfolgreich aktualisiert.'
    };
  } catch (err) {
    const errMsg = `${err.message}\n${err.stderr || ''}`;
    processManager.broadcastLog({
      stream: 'stderr',
      message: `[Package Manager Error] Gesamt-Update fehlgeschlagen: ${errMsg}`
    });
    throw new Error(`Fehler bei '${command}': ${errMsg}`);
  }
}
