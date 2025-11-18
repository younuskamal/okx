@echo off
echo ========================================
echo   OKX Trading System - Start All
echo ========================================
echo.
echo Starting both backend and frontend...
echo.

start "OKX Backend" cmd /k "scripts\start_backend.bat"
timeout /t 5 /nobreak >nul
start "OKX Frontend" cmd /k "scripts\start_frontend.bat"

echo.
echo Both servers are starting in separate windows.
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause


