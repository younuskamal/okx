# How to Start the Project

## Step-by-Step Instructions

### 1. Install Backend Dependencies

Open a **new PowerShell or Command Prompt** window and run:

```powershell
cd C:\Users\yonsy\OneDrive\Desktop\okx
python -m pip install fastapi uvicorn[standard] websockets ccxt pandas numpy python-dotenv pytz pydantic python-multipart
```

**Wait for installation to complete** (this may take a few minutes).

### 2. Verify Installation

Test if packages are installed:

```powershell
python -c "import fastapi; print('FastAPI installed successfully')"
```

If you see "FastAPI installed successfully", proceed to step 3.

### 3. Start the Backend Server

In the same terminal, run:

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Keep this terminal window open!**

### 4. Test the Backend

Open a **new browser tab** and visit:
- **API Health Check:** http://localhost:8000/api/health
- **API Documentation:** http://localhost:8000/docs

If you see the API docs page, the backend is running successfully! ✅

### 5. Start the Frontend (Optional)

**Note:** You need Node.js installed first.

#### Install Node.js:
1. Visit: https://nodejs.org/
2. Download and install the LTS version
3. Restart your terminal

#### Then run:

Open a **new terminal window** and run:

```powershell
cd C:\Users\yonsy\OneDrive\Desktop\okx\frontend
npm install
npm start
```

The frontend will open at: http://localhost:3000

## Alternative: Use Docker

If you have Docker installed:

```powershell
docker-compose up -d
```

This starts both backend and frontend automatically.

## Quick Start Scripts

I've created startup scripts for you:

**Windows Batch:**
```powershell
.\start.bat
```

**PowerShell:**
```powershell
.\start.ps1
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'fastapi'"
- Make sure you ran the pip install command
- Try: `python -m pip install --upgrade pip` first
- Then install packages again

### "Port 8000 already in use"
- Another process is using port 8000
- Change the port: `--port 8001`
- Or find and stop the process using port 8000

### Backend starts but shows errors
- Check that all files are in the correct locations
- Verify Python version is 3.8+
- Check the error messages in the terminal

## Current Status

✅ Python 3.10.11 installed  
⏳ Backend dependencies need installation  
⏳ Backend server needs to be started  
❌ Node.js not installed (needed for frontend)  

## What You Can Do Right Now

Even without the frontend, you can:

1. **Use the API directly:**
   - Visit http://localhost:8000/docs
   - Test all endpoints interactively
   - Configure settings via API

2. **Use the backend Python scripts:**
   - Run backtests directly
   - Use the trading engine programmatically

3. **Install Node.js later** to get the full web dashboard

## Need Help?

- Check the README.md for full documentation
- Review QUICKSTART.md for detailed setup
- Check backend logs in the terminal where you started the server


