@echo off
setlocal

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "MAIC_ZIP=%~1"
set "ASSETS_ZIP=%~2"
set "SLUG=%~3"

set "PS_COMMAND=Set-Location '%ROOT%'; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; & '.\tools\create-openmaic-polished-lesson.ps1'"
if not "%MAIC_ZIP%"=="" set "PS_COMMAND=%PS_COMMAND% -MaicZip '%MAIC_ZIP%'"
if not "%ASSETS_ZIP%"=="" set "PS_COMMAND=%PS_COMMAND% -AssetsZip '%ASSETS_ZIP%'"
if not "%SLUG%"=="" set "PS_COMMAND=%PS_COMMAND% -Slug '%SLUG%'"
set "PS_COMMAND=%PS_COMMAND%; Write-Host ''; Write-Host 'Done. Press Enter to close this window.'; Read-Host"

start "OpenMAIC polished lesson generator" powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -Command "%PS_COMMAND%"

endlocal
