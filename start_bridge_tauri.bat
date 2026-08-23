@echo off
title DB Studio Native Bridge (Tauri Desktop)
echo ====================================================
echo   Starting DB Studio Bridge as Native Desktop App
echo ====================================================
cd /d "%~dp0bridge-app"
npm run tauri:dev
pause
