@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "MAIC_ZIP=%~1"
set "ASSETS_ZIP=%~2"
set "SLUG=%~3"

if "%MAIC_ZIP%"=="" set "MAIC_ZIP=%USERPROFILE%\Downloads\Fractions with Pizza.maic.zip"
if "%ASSETS_ZIP%"=="" set "ASSETS_ZIP=%USERPROFILE%\Downloads\Fractions with Pizza.zip"
if "%SLUG%"=="" set "SLUG=openmaic-lesson"

set "WORK_DIR=%ROOT%\outputs\openmaic\work\%SLUG%"
set "MAIC_DIR=%WORK_DIR%\maic"
set "ASSETS_DIR=%WORK_DIR%\assets"
set "COMBINED_DIR=%WORK_DIR%\combined"
set "SLIDE_DIR=%WORK_DIR%\slides"
set "OUT_FILE=%ROOT%\dist\pre_quraan\units\openmaic-classroom\%SLUG%-standalone.html"
set "SAVE_FILE=%ROOT%\outputs\openmaic\%SLUG%-standalone.html"

if not exist "%MAIC_ZIP%" (
  echo Missing OpenMAIC classroom ZIP: %MAIC_ZIP%
  exit /b 1
)
if not exist "%ASSETS_ZIP%" (
  echo Missing OpenMAIC companion ZIP: %ASSETS_ZIP%
  exit /b 1
)

if exist "%WORK_DIR%" rmdir /s /q "%WORK_DIR%"
mkdir "%MAIC_DIR%" "%ASSETS_DIR%" "%COMBINED_DIR%" "%SLIDE_DIR%" 2>nul

echo Extracting OpenMAIC ZIPs...
tar.exe -xf "%MAIC_ZIP%" -C "%MAIC_DIR%"
if errorlevel 1 exit /b 1
tar.exe -xf "%ASSETS_ZIP%" -C "%ASSETS_DIR%"
if errorlevel 1 exit /b 1

set "MANIFEST="
for /r "%MAIC_DIR%" %%F in (manifest.json) do if not defined MANIFEST set "MANIFEST=%%F"
if not defined MANIFEST (
  echo No manifest.json found in %MAIC_ZIP%
  exit /b 1
)
copy /y "%MANIFEST%" "%COMBINED_DIR%\manifest.json" >nul

set "AUDIO_DIR="
for /d /r "%MAIC_DIR%" %%D in (*) do if /i "%%~nxD"=="audio" if not defined AUDIO_DIR set "AUDIO_DIR=%%D"
if not defined AUDIO_DIR (
  echo No audio folder found in %MAIC_ZIP%
  exit /b 1
)
mkdir "%COMBINED_DIR%\audio" 2>nul
xcopy "%AUDIO_DIR%\*" "%COMBINED_DIR%\audio\" /e /i /y >nul

set "MEDIA_DIR="
for /d /r "%MAIC_DIR%" %%D in (*) do if /i "%%~nxD"=="media" if not defined MEDIA_DIR set "MEDIA_DIR=%%D"
if defined MEDIA_DIR (
  mkdir "%COMBINED_DIR%\media" 2>nul
  xcopy "%MEDIA_DIR%\*" "%COMBINED_DIR%\media\" /e /i /y >nul
)

set "PPTX="
for /r "%ASSETS_DIR%" %%F in (*.pptx) do if not defined PPTX set "PPTX=%%F"
if defined PPTX (
  for %%P in ("%PPTX%") do copy /y "%PPTX%" "%COMBINED_DIR%\%%~nxP" >nul
  echo Exporting PowerPoint slides...
  cscript.exe //Nologo "%ROOT%\tools\export-pptx-slides.vbs" "%PPTX%" "%SLIDE_DIR%"
  if errorlevel 1 (
    echo PowerPoint export failed. The lesson will use JSON-rendered slides instead.
  )
) else (
  echo No PPTX found. The lesson will use JSON-rendered slides.
)

for /r "%ASSETS_DIR%" %%F in (*.html) do copy /y "%%F" "%COMBINED_DIR%\%%~nxF" >nul

echo Creating polished standalone HTML...
node "%ROOT%\tools\create-openmaic-standalone-html.js" "%COMBINED_DIR%" "%OUT_FILE%" "%SLIDE_DIR%"
if errorlevel 1 exit /b 1

for %%I in ("%SAVE_FILE%") do if not exist "%%~dpI" mkdir "%%~dpI"
copy /y "%OUT_FILE%" "%SAVE_FILE%" >nul

echo.
echo Polished OpenMAIC lesson generated.
echo Served file: %OUT_FILE%
echo Saved copy:  %SAVE_FILE%
echo Work dir:    %WORK_DIR%

endlocal
