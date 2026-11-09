@echo off
chcp 65001 > nul
set SCRIPT_DIR=%~dp0
set TARGET=%SCRIPT_DIR%start.bat
set ICON=%SCRIPT_DIR%icon.ico
set SHORTCUT_NAME=東京合戦.lnk

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), '%SHORTCUT_NAME%')); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.IconLocation = '%ICON%,0'; $s.Description = '東京合戦 - 東京都全53市区町村 開拓×レトロFF風コマンド合戦'; $s.Save()"

echo デスクトップに「東京合戦」のショートカットを作成しました！
pause

