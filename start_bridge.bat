@echo off
title DB Studio Local Bridge Daemon
echo ====================================================
echo   Starting DB Studio Local Bridge (Daemon + UI)
echo ====================================================
cd /d "%~dp0bridge-app"
npm run bridge
pause
