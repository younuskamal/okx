#!/bin/bash

echo "========================================"
echo "  OKX Trading System - Backend Server"
echo "========================================"
echo ""

# Check Python
echo "[1/3] Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found! Please install Python 3.8+"
    exit 1
fi

python3 --version

# Install dependencies
echo ""
echo "[2/3] Installing dependencies..."
python3 -m pip install -q -r backend/requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

# Start server
echo ""
echo "[3/3] Starting backend server..."
echo ""
echo "Backend will be available at:"
echo "  - API: http://localhost:8000"
echo "  - Docs: http://localhost:8000/docs"
echo "  - Health: http://localhost:8000/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload


