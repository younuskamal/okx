@echo off
echo Starting OKX Trading System Backend...
echo.

cd /d %~dp0

echo Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)

echo.
echo Installing/Updating dependencies...
python -m pip install -r backend/requirements.txt --quiet

echo.
echo Starting backend server...
echo Backend will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000

pause


