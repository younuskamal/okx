@echo off
setlocal ENABLEDELAYEDEXPANSION

cd /d %~dp0

echo ========================================
echo   OKX Trading System Launcher
echo ========================================
echo.

REM Validate Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH.
    pause
    exit /b 1
)

REM Validate Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

echo Starting backend and frontend services...
echo A console window will open for each service.
echo.

start "OKX Backend" cmd /k "cd /d %~dp0 && scripts\start_backend.bat"
timeout /t 5 /nobreak >nul
start "OKX Frontend" cmd /k "cd /d %~dp0 && scripts\start_frontend.bat"

echo.
echo Waiting for services to initialize...
timeout /t 8 /nobreak >nul

echo Launching dashboard in your default browser.
start "" "http://localhost:3000"

echo.
echo ========================================
echo   All services launched successfully!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
pause
