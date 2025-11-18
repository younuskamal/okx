@echo off
echo ========================================
echo   OKX Trading System - Backend Server
echo ========================================
echo.

cd /d %~dp0\..

echo [1/3] Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

echo.
echo [2/3] Installing dependencies...
python -m pip install -q -r backend/requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [3/3] Starting backend server...
echo.
echo Backend will be available at:
echo   - API: http://localhost:8000
echo   - Docs: http://localhost:8000/docs
echo   - Health: http://localhost:8000/api/health
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

pause


