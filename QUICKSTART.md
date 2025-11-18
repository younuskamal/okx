# Quick Start Guide - 5 Minutes

## Prerequisites Check

```bash
# Check Python (needs 3.8+)
python --version

# Check Node.js (needs 18+, optional for frontend)
node --version
```

## Fastest Way to Start

### Windows Users

**Option 1: Use Startup Scripts**
```bash
# Start both backend and frontend
scripts\start_all.bat
```

**Option 2: Manual Start**
```bash
# Terminal 1 - Backend
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend (after Node.js installed)
cd frontend
npm install
npm start
```

### Linux/Mac Users

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start backend
./scripts/start_backend.sh

# Start frontend (new terminal)
./scripts/start_frontend.sh
```

## Verify Installation

1. **Backend Running:**
   - Open: http://localhost:8000/docs
   - Should see API documentation

2. **Frontend Running:**
   - Open: http://localhost:3000
   - Should see the dashboard

## First Steps

1. **Configure API Keys:**
   - Go to Settings tab
   - Enter OKX API credentials
   - Set `OKX_SANDBOX=true` for testing
   - Click "Save All Settings"

2. **Run a Backtest:**
   - Go to Backtest tab
   - Set date range (last year)
   - Click "Run Backtest"
   - View results

3. **Test Live Trading (Sandbox):**
   - Ensure sandbox mode is enabled
   - Go to Dashboard
   - Click "Start Trading"
   - Monitor logs and positions

## Common Issues

**"Module not found" errors:**
```bash
pip install -r backend/requirements.txt
```

**"Port already in use":**
- Change port: `--port 8001`
- Or stop the process using the port

**Frontend won't connect:**
- Ensure backend is running
- Check browser console for errors
- Verify CORS settings

## Next Steps

- Read full README.md
- Review Settings tab for all options
- Test backtest with different parameters
- Monitor system in sandbox mode

---

**You're ready to trade!** 🚀
