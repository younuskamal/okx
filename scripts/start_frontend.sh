\#!/bin/bash

echo "========================================"
echo "  OKX Trading System - Frontend Server"
echo "========================================"
echo ""

# Check Node.js
echo "[1/3] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

node --version

# Install dependencies
echo ""
echo "[2/3] Installing dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

# Start server
echo ""
echo "[3/3] Starting frontend server..."
echo ""
echo "Frontend will be available at:"
echo "  - Dashboard: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

npm start


