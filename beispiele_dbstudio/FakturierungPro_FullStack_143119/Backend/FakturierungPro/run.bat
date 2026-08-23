@echo off
title Electron Manager
cls

:MENU
cls
echo =================================================
echo   Electron Desktop Manager
echo =================================================
echo.
echo  [1] Dependencies installieren (inkl. Frontend)
echo  [2] Frontend transpilieren (dist)
echo  [3] Electron App starten (npm start)
echo  [4] Desktop Executable erstellen (npm run electron:build)
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
echo Installiere Electron-Dependencies...
call npm install
if exist ..\..\Frontend (
    echo Installiere Frontend-Dependencies...
    cd ..\..\Frontend
    call npm install
    cd ..\Backend\FakturierungPro
)
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

:START
cls
echo Starte Electron App...
call npm start
pause
goto MENU

:BUILD
cls
echo Baue native Desktop App mit Electron...
call npm run electron:build
pause
goto MENU
