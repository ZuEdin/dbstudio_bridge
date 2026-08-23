import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateTauriFiles = (config: BackendConfig, root: string, target: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    if (target === 'tauri') {
        const cargoToml = `[package]
name = "${config.projectName.toLowerCase()}-app"
version = "0.1.0"
description = "High Performance Tauri Desktop Client for DB Studio Pro"
authors = ["DB Studio Pro Generator"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5" }

[dependencies]
tauri = { version = "1.5", features = ["api-all", "custom-protocol"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }

[features]
# this feature is used for production builds or when \`devPath\` points to the filesystem
# DO NOT REMOVE!!
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
`;

        const tauriConf = `{
  "build": {
    "beforeDevCommand": "",
    "beforeBuildCommand": "",
    "devPath": "../dist",
    "distDir": "../dist"
  },
  "package": {
    "productName": "${config.projectName}",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": true
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.${config.projectName.toLowerCase()}.desktop",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "${config.projectName} Desktop Studio (Tauri)",
        "width": 1280,
        "height": 850,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
`;

        const buildRs = `fn main() {
  tauri_build::build()
}
`;

        const mainRs = `#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct QueryResult {
    success: bool,
    rows_affected: u32,
    data: String,
    error: Option<String>,
}

// 1. High Performance Rust Command for Local Storage Query Executions
#[tauri::command]
async fn execute_local_query(sql: String) -> Result<QueryResult, String> {
    println!("Executing high-performance local query in Rust context: {}", sql);
    
    // Simulates rust-native database communication for ultra performance
    if sql.trim().to_uppercase().starts_with("SELECT") {
        Ok(QueryResult {
            success: true,
            rows_affected: 0,
            data: r#"[{"id": 1, "status": "active", "perf": "native_rust_core"}]"#.to_string(),
            error: None,
        })
    } else {
        Ok(QueryResult {
            success: true,
            rows_affected: 1,
            data: "[]".to_string(),
            error: None,
        })
    }
}

// 2. Local Network Database Diagnostics (Low Latency Sockets)
#[tauri::command]
fn check_database_latency(host: String) -> Result<u64, String> {
    let start = std::time::Instant::now();
    // Native Rust Socket ping
    match std::net::TcpStream::connect_timeout(
        &format!("{}:80", host).parse().unwrap_or("127.0.0.1:80".parse().unwrap()),
        std::time::Duration::from_millis(1500)
    ) {
        Ok(_) => Ok(start.elapsed().as_millis() as u64),
        Err(e) => Err(format!("Latency ping call failed: {}", e))
    }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        execute_local_query,
        check_database_latency
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
`;

        const readmeTauri = `# Tauri Premium Desktop Integration

Tauri replaces high-cost client wrappers with a **Rust-Native High Performance Backend**.

## Schnelle Einrichtung (Lokale Entwicklung)

1. **Systemvoraussetzungen (Rust Compiler)**:
   * macOS / Linux: \`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\`
   * Windows: Installationsassistent von [tauri.app](https://tauri.app/v1/guides/getting-started/prerequisites) ausführen.

2. **Tauri CLI installieren**:
   \`\`\`bash
   npm install -D @tauri-apps/cli
   \`\`\`

3. **Desktop Developer Server starten**:
   \`\`\`bash
   npm run tauri dev
   \`\`\`

## Produktion Ready Native Installer Builden

\`\`\`bash
npm run tauri build
\`\`\`
Die fertige, kompilierte Standalone Desktop-App (\`< 15MB\` Dateigröße, \`< 40MB RAM\` Verbrauch) wird unter \`src-tauri/target/release/bundle/\` abgelegt!
`;

        const tauriPackageJsonContent = `{
  "name": "${config.projectName.toLowerCase()}-tauri-desktop",
  "version": "1.0.0",
  "description": "Desktop version of ${config.projectName} with Tauri",
  "scripts": {
    "tauri": "tauri",
    "dev": "npm run build && tauri dev",
    "build": "node copy-dist.js",
    "tauri:build": "npm run build && tauri build",
    "frontend:install": "cd ../../Frontend && npm install",
    "frontend:build": "cd ../../Frontend && npm run build"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^1.5.0"
  }
}`;

        const tauriCopyDistJsContent = `const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('[Tauri Build] Transpiling Frontend in ../../Frontend...');
  let frontendDir = path.join(__dirname, '..', '..', 'Frontend');
  if (!fs.existsSync(frontendDir)) {
    frontendDir = path.join(__dirname, '..', '..', 'AngularFrontend');
  }
  
  if (fs.existsSync(frontendDir)) {
    const hasLocalModules = fs.existsSync(path.join(frontendDir, 'node_modules'));
    const hasParentModules = fs.existsSync(path.join(frontendDir, '..', 'node_modules')) || fs.existsSync(path.join(__dirname, '..', 'node_modules')) || fs.existsSync(path.join(__dirname, 'node_modules'));
    if (!hasLocalModules && !hasParentModules) {
      console.log('[Tauri Build] Running npm install in ' + frontendDir + '...');
      try {
        execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
      } catch (e) {
        console.log('[Tauri Build] npm install warning (continuing):', e.message);
      }
    } else {
      console.log('[Tauri Build] node_modules folder detected, skipping npm install...');
    }
    console.log('[Tauri Build] Running npm run build in ' + frontendDir + '...');
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
    
    const srcDist = path.join(frontendDir, 'dist');
    const targetDist = path.join(__dirname, 'dist');
    
    if (fs.existsSync(targetDist)) {
      fs.rmSync(targetDist, { recursive: true, force: true });
    }
    
    if (fs.existsSync(srcDist)) {
      let actualSrc = srcDist;
      
      // If there is no index.html in the root of dist, look inside subdirectories (e.g., Angular/Vite builds)
      if (!fs.existsSync(path.join(srcDist, 'index.html'))) {
        try {
          const subdirs = fs.readdirSync(srcDist, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
          
          for (const sub of subdirs) {
            const subPath = path.join(srcDist, sub);
            if (fs.existsSync(path.join(subPath, 'index.html'))) {
              actualSrc = subPath;
              break;
            }
            const browserPath = path.join(subPath, 'browser');
            if (fs.existsSync(path.join(browserPath, 'index.html'))) {
              actualSrc = browserPath;
              break;
            }
          }
        } catch (e) {
          console.log('[Tauri Build] Warning scanning subdirs:', e.message);
        }
      }
      
      console.log('[Tauri Build] Copying files from ' + actualSrc + ' to ' + targetDist + '...');
      copyDir(actualSrc, targetDist);
      console.log('[Tauri Build] Copy completed successfully!');
    } else {
      console.error('[Tauri Build] Error: Frontend dist folder not found at ' + srcDist);
    }
  } else {
    console.error('[Tauri Build] Error: Frontend directory not found!');
  }
} catch (error) {
  console.error('[Tauri Build] Build failed:', error);
  process.exit(1);
}
`;

        files.push({
            name: 'package.json',
            path: `${root}/package.json`,
            content: tauriPackageJsonContent,
            language: 'json'
        });

        files.push({
            name: 'copy-dist.js',
            path: `${root}/copy-dist.js`,
            content: tauriCopyDistJsContent,
            language: 'javascript'
        });

        files.push({
            name: 'Cargo.toml',
            path: `${root}/src-tauri/Cargo.toml`,
            content: cargoToml,
            language: 'toml'
        });

        files.push({
            name: 'tauri.conf.json',
            path: `${root}/src-tauri/tauri.conf.json`,
            content: tauriConf,
            language: 'json'
        });

        files.push({
            name: 'main.rs',
            path: `${root}/src-tauri/src/main.rs`,
            content: mainRs,
            language: 'rust'
        });

        files.push({
            name: 'build.rs',
            path: `${root}/src-tauri/build.rs`,
            content: buildRs,
            language: 'rust'
        });

        files.push({
            name: 'README_TAURI.md',
            path: `${root}/README_TAURI.md`,
            content: readmeTauri,
            language: 'markdown'
        });

        // Add run.bat and run.sh scripts for Tauri deployment
        const tauriBatContent = `@echo off
title Tauri Manager
cls

:MENU
cls
echo =================================================
echo   Tauri Desktop Manager
echo =================================================
echo.
echo  [1] Dependencies installieren (inkl. Frontend)
echo  [2] Frontend transpilieren (dist)
echo  [3] Tauri Dev-Modus starten (npm run dev)
echo  [4] Native Desktop App bauen (npm run tauri:build)
echo  [5] Standard App-Icons herunterladen und generieren
echo  [6] Beenden
echo.
set /p choice="Auswahl (1-6): "

if "%choice%"=="1" goto INSTALL
if "%choice%"=="2" goto BUILDFE
if "%choice%"=="3" goto DEV
if "%choice%"=="4" goto BUILD
if "%choice%"=="5" goto ICONS
if "%choice%"=="6" exit

goto MENU

:INSTALL
cls
echo Installiere Tauri-Dependencies...
call npm install
if exist ..\\..\\Frontend (
    echo Installiere Frontend-Dependencies...
    cd ..\\..\\Frontend
    call npm install
    cd ..\\Backend\\${config.projectName}
)
echo.
echo Downloade standard Tauri-Icons...
if not exist src-tauri\\\\icons mkdir src-tauri\\\\icons
curl -s -L -o src-tauri\\\\icons\\\\icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
curl -s -L -o src-tauri\\\\icons\\\\icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
curl -s -L -o src-tauri\\\\icons\\\\32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
curl -s -L -o src-tauri\\\\icons\\\\128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
curl -s -L -o src-tauri\\\\icons\\\\128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"
echo.
pause
goto MENU

:BUILDFE
cls
echo Transpiliere Frontend und kopiere Assets...
call npm run build
echo.
pause
goto MENU

:DEV
cls
echo Starte Tauri Dev-Modus...
call npm run dev
pause
goto MENU

:BUILD
cls
echo Baue native Desktop App mit Tauri...
call npm run tauri:build
pause
goto MENU

:ICONS
cls
echo Downloade standard Tauri-Icons...
if not exist src-tauri\\\\icons mkdir src-tauri\\\\icons
curl -s -L -o src-tauri\\\\icons\\\\icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
curl -s -L -o src-tauri\\\\icons\\\\icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
curl -s -L -o src-tauri\\\\icons\\\\32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
curl -s -L -o src-tauri\\\\icons\\\\128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
curl -s -L -o src-tauri\\\\icons\\\\128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"

if exist src-tauri\\\\icons\\\\icon.ico (
    echo Icons wurden erfolgreich heruntergeladen!
) else (
    echo Warnung: Download fehlgeschlagen. Versuche Fallback-Generierung...
    node -e "require('fs').writeFileSync('src-tauri/temp_icon.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QgKDBUpbSjN2gAAAD1JREFUeN7t1CENAAAQw7Dzb+VbCHioEEnpWeaenKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrOwXFauPC/C9uXIAAAAASUVORK5CYII=', 'base64'))"
    if exist src-tauri\\\\temp_icon.png (
        echo Generiere Icons im Tauri-Format...
        call npx tauri icon src-tauri\\\\temp_icon.png
        del src-tauri\\\\temp_icon.png
        echo Icons wurden erfolgreich generiert!
    ) else (
        echo Fehler: Konnte Fallback-Icon nicht erstellen.
    )
)
pause
goto MENU
`;

        const tauriShContent = `#!/bin/bash
# Tauri Desktop Manager

show_menu() {
  clear
  echo "================================================="
  echo "  Tauri Desktop Manager"
  echo "================================================="
  echo ""
  echo "  [1] Dependencies installieren (inkl. Frontend)"
  echo "  [2] Frontend transpilieren (dist)"
  echo "  [3] Tauri Dev-Modus starten (npm run dev)"
  echo "  [4] Native Desktop App bauen (npm run tauri:build)"
  echo "  [5] Standard App-Icons herunterladen & generieren"
  echo "  [6] Beenden"
  echo ""
  read -p "Auswahl (1-6): " choice
  case $choice in
    1) 
      npm install
      if [ -d "../../Frontend" ]; then
        cd ../../Frontend
        npm install
        cd "../Backend/${config.projectName}"
      fi
      mkdir -p src-tauri/icons
      echo "Downloade standard Tauri-Icons..."
      curl -s -L -o src-tauri/icons/icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
      curl -s -L -o src-tauri/icons/icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
      curl -s -L -o src-tauri/icons/32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
      curl -s -L -o src-tauri/icons/128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
      curl -s -L -o src-tauri/icons/128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"
      read -p "Drücke Enter zum Fortfahren..." temp
      show_menu
      ;;
    2) npm run build ;;
    3) npm run dev ;;
    4) npm run tauri:build ;;
    5) 
      mkdir -p src-tauri/icons
      echo "Downloade standard Tauri-Icons..."
      curl -s -L -o src-tauri/icons/icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
      curl -s -L -o src-tauri/icons/icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
      curl -s -L -o src-tauri/icons/32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
      curl -s -L -o src-tauri/icons/128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
      curl -s -L -o src-tauri/icons/128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"
      if [ -f src-tauri/icons/icon.ico ]; then
        echo "Icons erfolgreich heruntergeladen!"
      else
        echo "Warnung: Download fehlgeschlagen. Versuche Fallback-Generierung..."
        node -e "require('fs').writeFileSync('src-tauri/temp_icon.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QgKDBUpbSjN2gAAAD1JREFUeN7t1CENAAAQw7Dzb+VbCHioEEnpWeaenKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrOwXFauPC/C9uXIAAAAASUVORK5CYII=', 'base64'))"
        if [ -f src-tauri/temp_icon.png ]; then
          echo "Generiere Icons im Tauri-Format..."
          npx tauri icon src-tauri/temp_icon.png
          rm src-tauri/temp_icon.png
          echo "Icons erfolgreich generiert!"
        else
          echo "Fehler: Konnte Fallback-Icon nicht erstellen."
        fi
      fi
      read -p "Drücke Enter zum Fortfahren..." temp
      show_menu
      ;;
    6) exit 0 ;;
    *) show_menu ;;
  esac
}

show_menu
`;

        files.push({
            name: 'run.bat',
            path: `${root}/run.bat`,
            content: tauriBatContent,
            language: 'text'
        });

        files.push({
            name: 'run.sh',
            path: `${root}/run.sh`,
            content: tauriShContent,
            language: 'text'
        });
    }
    return files;
};
