@echo off
chcp 65001 > nul
echo ===================================================
echo   東京合戦 (Tokyo Conquest)
echo   東京都全53市区町村 開拓×レトロFF風コマンド合戦
echo   Local Web Server Launcher
echo ===================================================
echo.
echo Starting local web server on port 3000...
echo Opening http://localhost:3000 in your browser...
echo.

where npx >nul 2>nul
if %errorlevel% equ 0 (
  start http://localhost:3000
  npx --yes serve -l 3000 .
) else (
  echo Node.js / npx not found. Opening index.html directly...
  start index.html
)
pause

