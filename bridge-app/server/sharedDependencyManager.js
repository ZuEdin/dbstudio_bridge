import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * Initialisiert das zentrale Shared_Dependencies-Verzeichnis.
 */
export function initSharedStore(sharedDirPath) {
  const nodeModulesPath = path.join(sharedDirPath, 'node_modules');
  const nugetPath = path.join(sharedDirPath, 'nuget_cache');
  const cargoPath = path.join(sharedDirPath, 'cargo_cache');

  if (!fs.existsSync(sharedDirPath)) {
    fs.mkdirSync(sharedDirPath, { recursive: true });
  }
  if (!fs.existsSync(nodeModulesPath)) {
    fs.mkdirSync(nodeModulesPath, { recursive: true });
  }
  if (!fs.existsSync(nugetPath)) {
    fs.mkdirSync(nugetPath, { recursive: true });
  }
  if (!fs.existsSync(cargoPath)) {
    fs.mkdirSync(cargoPath, { recursive: true });
  }

  // Erstelle ein dummy package.json im shared Ordner falls nicht vorhanden
  const sharedPkgJson = path.join(sharedDirPath, 'package.json');
  if (!fs.existsSync(sharedPkgJson)) {
    const pkgContent = {
      name: "dbstudio-shared-dependencies",
      version: "1.0.0",
      private: true,
      description: "Zentraler Cache für DB Studio Projekte",
      dependencies: {
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "lucide-react": "^1.16.0",
        "clsx": "^2.1.1",
        "tailwind-merge": "^2.3.0"
      },
      devDependencies: {
        "@types/react": "^18.3.3",
        "@types/react-dom": "^18.3.0",
        "@vitejs/plugin-react": "^4.3.1",
        "autoprefixer": "^10.4.19",
        "postcss": "^8.4.38",
        "tailwindcss": "^3.4.4",
        "typescript": "^5.4.5",
        "vite": "^5.2.11"
      }
    };
    fs.writeFileSync(sharedPkgJson, JSON.stringify(pkgContent, null, 2), 'utf-8');
  }

  return {
    sharedDirPath,
    nodeModulesPath,
    nugetPath,
    cargoPath
  };
}

/**
 * Erstellt einen Symlink / Directory Junction von Shared node_modules in das Ziel-Projektverzeichnis.
 */
export async function linkSharedNodeModules(targetFrontendDir, sharedDirPath) {
  const sharedNodeModules = path.join(sharedDirPath, 'node_modules');
  const targetNodeModules = path.join(targetFrontendDir, 'node_modules');

  // Prüfen ob shared node_modules existiert
  if (!fs.existsSync(sharedNodeModules)) {
    fs.mkdirSync(sharedNodeModules, { recursive: true });
  }

  // Falls target node_modules bereits existiert
  if (fs.existsSync(targetNodeModules)) {
    try {
      const stats = fs.lstatSync(targetNodeModules);
      if (stats.isSymbolicLink() || (process.platform === 'win32' && stats.isDirectory())) {
        // Prüfe ob es schon ein Symlink ist
        return { success: true, alreadyLinked: true, path: targetNodeModules };
      }
    } catch (e) {
      // Ignorieren und neu verknüpfen
    }
  }

  try {
    if (process.platform === 'win32') {
      // Windows Directory Junction (benötigt keine Admin-Rechte)
      await execPromise(`cmd /c mklink /J "${targetNodeModules}" "${sharedNodeModules}"`);
    } else {
      fs.symlinkSync(sharedNodeModules, targetNodeModules, 'junction');
    }
    return { success: true, path: targetNodeModules, source: sharedNodeModules };
  } catch (err) {
    console.warn('Junction konnte nicht erstellt werden, versuche fs.symlink:', err.message);
    try {
      fs.symlinkSync(sharedNodeModules, targetNodeModules, 'dir');
      return { success: true, path: targetNodeModules, source: sharedNodeModules };
    } catch (symErr) {
      console.error('Symlink fehlgeschlagen:', symErr);
      return { success: false, error: symErr.message };
    }
  }
}
