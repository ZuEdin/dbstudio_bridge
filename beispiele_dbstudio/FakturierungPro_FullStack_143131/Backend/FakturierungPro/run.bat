@echo off
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
if exist ..\..\Frontend (
    echo Installiere Frontend-Dependencies...
    cd ..\..\Frontend
    call npm install
    cd ..\Backend\FakturierungPro
)
echo.
echo Downloade standard Tauri-Icons...
if not exist src-tauri\\icons mkdir src-tauri\\icons
curl -s -L -o src-tauri\\icons\\icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
curl -s -L -o src-tauri\\icons\\icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
curl -s -L -o src-tauri\\icons\\32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
curl -s -L -o src-tauri\\icons\\128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
curl -s -L -o src-tauri\\icons\\128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"
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
if not exist src-tauri\\icons mkdir src-tauri\\icons
curl -s -L -o src-tauri\\icons\\icon.ico "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.ico"
curl -s -L -o src-tauri\\icons\\icon.icns "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/icon.icns"
curl -s -L -o src-tauri\\icons\\32x32.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/32x32.png"
curl -s -L -o src-tauri\\icons\\128x128.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128.png"
curl -s -L -o src-tauri\\icons\\128x128@2x.png "https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/.icons/128x128@2x.png"

if exist src-tauri\\icons\\icon.ico (
    echo Icons wurden erfolgreich heruntergeladen!
) else (
    echo Warnung: Download fehlgeschlagen. Versuche Fallback-Generierung...
    node -e "require('fs').writeFileSync('src-tauri/temp_icon.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QgKDBUpbSjN2gAAAD1JREFUeN7t1CENAAAQw7Dzb+VbCHioEEnpWeaenKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrOwXFauPC/C9uXIAAAAASUVORK5CYII=', 'base64'))"
    if exist src-tauri\\temp_icon.png (
        echo Generiere Icons im Tauri-Format...
        call npx tauri icon src-tauri\\temp_icon.png
        del src-tauri\\temp_icon.png
        echo Icons wurden erfolgreich generiert!
    ) else (
        echo Fehler: Konnte Fallback-Icon nicht erstellen.
    )
)
pause
goto MENU
