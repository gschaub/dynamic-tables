@echo off
setlocal

if "%~1"=="" (
  echo No input file was provided.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Convert-VideoToWordPressGif.ps1" -InputPath "%~1"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
  echo Conversion failed with exit code %EXIT_CODE%.
) else (
  echo Conversion finished.
)
echo.
pause
exit /b %EXIT_CODE%
