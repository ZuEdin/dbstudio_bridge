import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateTauriScripts = (
  config: BackendConfig,
  root: string,
  dbTypeStr: string,
  defaultDbPort: number
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  const batContent = `@echo off
title ${config.projectName} - Tauri Desktop Manager
cls

:MENU
cls
echo =================================================
echo   ${config.projectName} - Tauri App Manager
echo   DB Engine: ${dbTypeStr.toUpperCase()} (Port: ${defaultDbPort})
echo =================================================
echo.
echo  [1] Dependencies fuer Frontend & Tauri CLI installieren
echo  [2] Frontend transpilieren (generiert 'dist' Ordner)
echo  [3] Tauri Dev-Modus starten (npx tauri dev)
echo  [4] Native Desktop App bauen (npx tauri build)
echo  [5] Standard App-Icons herunterladen und generieren
echo  [6] Beenden
echo.
set /p choice="Auswahl (1-6): "

if "%choice%"=="1" goto INSTALL
if "%choice%"=="2" goto BUILDFE
if "%choice%"=="3" goto START
if "%choice%"=="4" goto BUILD
if "%choice%"=="5" goto ICONS
if "%choice%"=="6" exit

goto MENU

:INSTALL
cls
echo Installiere Dependencies...
call npm install
cd Frontend
call npm install
cd ..
pause
goto MENU

:BUILDFE
cls
echo Transpiliere Frontend in dist...
cd Frontend
call npm run build
cd ..
pause
goto MENU

:START
cls
echo Starte Tauri Dev-Modus...
call npx tauri dev
pause
goto MENU

:BUILD
cls
echo Baue native Desktop App mit Tauri...
call npx tauri build
pause
goto MENU

:ICONS
cls
echo Generiere Standard-Icons fuer Tauri...
cd /d "%~dp0"
if not exist src-tauri\\icons mkdir src-tauri\\icons
echo Lade Platzhalter-Icon herunter...
curl -s -L -o src-tauri\\temp_icon.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/app-icon.png"
if exist src-tauri\\temp_icon.png (
    echo Generiere Icons im Tauri-Format...
    call npx tauri icon src-tauri\\temp_icon.png
    del src-tauri\\temp_icon.png
    echo Icons wurden erfolgreich generiert!
) else (
    echo Fehler: Konnte das Platzhalter-Icon nicht herunterladen.
    echo Bitte stellen Sie sicher, dass curl installiert ist und Sie Internetverbindung haben.
)
pause
goto MENU
`;

  files.push({ name: 'run.bat', path: `${root}/run.bat`, content: batContent, language: 'text' });

  const shContent = `#!/bin/bash
# ${config.projectName} Tauri Manager

show_menu() {
  clear
  echo "================================================="
  echo "  ${config.projectName} - Tauri Desktop Manager"
  echo "  DB Engine: ${dbTypeStr.toUpperCase()}"
  echo "================================================="
  echo ""
  echo "  [1] Dependencies installieren"
  echo "  [2] Frontend transpilieren (dist)"
  echo "  [3] Tauri Dev-Modus starten"
  echo "  [4] Native Desktop App bauen (tauri build)"
  echo "  [5] Standard App-Icons herunterladen & generieren"
  echo "  [6] Beenden"
  echo ""
  read -p "Auswahl (1-6): " choice
  case $choice in
    1) npm install && cd Frontend && npm install && cd .. ;;
    2) cd Frontend && npm run build && cd .. ;;
    3) npx tauri dev ;;
    4) npx tauri build ;;
    5) 
      cd "$(dirname "$0")"
      mkdir -p src-tauri/icons
      echo "Lade Platzhalter-Icon herunter..."
      curl -s -L -o src-tauri/temp_icon.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/app-icon.png"
      if [ -f src-tauri/temp_icon.png ]; then
        echo "Generiere Icons im Tauri-Format..."
        npx tauri icon src-tauri/temp_icon.png
        rm src-tauri/temp_icon.png
        echo "Icons erfolgreich generiert!"
      else
        echo "Fehler: Konnte das Platzhalter-Icon nicht herunterladen."
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
  files.push({ name: 'run.sh', path: `${root}/run.sh`, content: shContent, language: 'text' });

  const readmeTauri = `# ${config.projectName} - Tauri Desktop Application

- **Frontend**: Transpiliert via Vite direkt in den \`dist\`-Ordner.
- **SQLite**: Wird lokal im nativen App-Daten-Ordner des Betriebssystems ausgeführt (\`sqlite:app_data/db.sqlite\`).
- **MySQL / PostgreSQL**: Werden nativ über Rust-Treiber mit dem entsprechenden Server & Port (${defaultDbPort}) verbunden.
`;

  files.push({ name: 'README_TAURI.md', path: `${root}/README_TAURI.md`, content: readmeTauri, language: 'markdown' });

  return files;
};
