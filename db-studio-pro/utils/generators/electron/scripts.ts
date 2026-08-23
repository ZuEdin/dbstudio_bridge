import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateElectronScripts = (
  config: BackendConfig,
  root: string,
  bePort: number,
  dbTypeStr: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  const batContent = `@echo off
title ${config.projectName} Manager (Electron Desktop)
cls

:MENU
cls
echo =================================================
echo   ${config.projectName} - Desktop App Manager
echo =================================================
echo  Datenbank-Typ: ${dbTypeStr.toUpperCase()}
echo  Eingebetteter Port: ${bePort}
echo =================================================
echo.
echo  [1] Dependencies installieren (npm run install-all)
echo  [2] Frontend transpiles in Backend/public
echo  [3] Electron App starten (electron .)
echo  [4] Desktop Executable erstellen (npm run dist)
echo  [5] Beenden
echo.
set /p choice="Auswahl (1-5): "

if "%choice%"=="1" goto INSTALL
if "%choice%"=="2" goto BUILDFE
if "%choice%"=="3" goto START
if "%choice%"=="4" goto BUILD
if "%choice%"=="5" exit

goto MENU

:INSTALL
cls
echo Installiere alle Projektabhaengigkeiten...
call npm run install-all
echo.
pause
goto MENU

:BUILDFE
cls
echo Transpiliere Frontend direkt in den Backend/public Ordner...
call npm run build:frontend
echo.
pause
goto MENU

:START
cls
echo Starte Electron App...
call npm start
pause
goto MENU

:BUILD
cls
echo Baue vollstaendige Desktop Executable...
call npm run dist
pause
goto MENU
`;

  files.push({ name: 'run.bat', path: `${root}/run.bat`, content: batContent, language: 'text' });

  const shContent = `#!/bin/bash
# ${config.projectName} Desktop App Manager
cd "$(dirname "$0")"

if [ ! -d "Frontend/dist" ] && [ -d "Frontend" ]; then
  echo "Building Frontend..."
  (cd Frontend && npm run build)
fi

run_electron() {
  if [ -d "Backend/test" ]; then
    (cd Backend/test && npx electron .)
  elif [ -d "Backend" ]; then
    (cd Backend && npx electron .)
  else
    npx electron .
  fi
}

show_menu() {
  clear
  echo "================================================="
  echo "  ${config.projectName} - Desktop App Manager"
  echo "  DB Engine: ${dbTypeStr.toUpperCase()}"
  echo "================================================="
  echo ""
  echo "  [1] Dependencies installieren (npm run install-all)"
  echo "  [2] Frontend in Backend/public transpilieren"
  echo "  [3] Electron App starten"
  echo "  [4] Executable erstellen (electron-builder)"
  echo "  [5] Beenden"
  echo ""
  read -p "Auswahl (1-5): " choice
  case $choice in
    1) npm run install-all ;;
    2) npm run build:frontend ;;
    3) run_electron ;;
    4) npm run dist ;;
    5) exit 0 ;;
    *) show_menu ;;
  esac
}

if [ "$1" == "--direct" ]; then
  run_electron
else
  show_menu
fi
`;
  files.push({ name: 'run.sh', path: `${root}/run.sh`, content: shContent, language: 'text' });

  const readmeContent = `# ${config.projectName} Desktop Application (Electron + Embedded Backend)

## Architektur

- **Frontend**: Transpiliert mittels Vite direkt in \`Backend/public\`.
- **Backend**: Eingebetteter Node.js Express Server, der direkt im Electron Main-Prozess gesteuert wird.
- **Port 3000 Entkopplung**: Der Desktop-Client nutzt einen internen Loopback-Port (\`${bePort}\`) ohne Konflikte mit Web-Port 3000.

## Datenbank-Integration

- **SQLite**: Die Datenbankdatei wird direkt im systemweiten \`userData\` Pfad gespeichert (\`${config.projectName.toLowerCase()}.sqlite\`). Vollstaendig offline-faehig.
- **MySQL / PostgreSQL / MSSQL**: Werden ueber Standard-Ports (3306, 5432, 1433) oder konfigurierte Verbindungsparameter in \`Backend/.env\` angesprochen.

## Quickstart

\`\`\`bash
# 1. Dependencies installieren
npm run install-all

# 2. Transpilieren & Starten
npm start
\`\`\`
`;

  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
