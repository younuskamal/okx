# Install Node.js to Run Frontend

## ⚠️ Node.js Not Installed

Node.js is required to run the frontend. Please install it first.

## Quick Installation

### Option 1: Official Installer (Recommended)

1. **Visit:** https://nodejs.org/
2. **Download** the LTS version (18.x or higher)
3. **Run the installer** and follow the setup wizard
4. **Restart your terminal** after installation
5. **Verify installation:**
   ```bash
   node --version
   npm --version
   ```

### Option 2: Using Chocolatey (Windows)

If you have Chocolatey installed:
```bash
choco install nodejs-lts
```

### Option 3: Using Winget (Windows 11)

```bash
winget install OpenJS.NodeJS.LTS
```

## After Installation

Once Node.js is installed:

1. **Restart your terminal/PowerShell**
2. **Navigate to frontend:**
   ```bash
   cd frontend
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start the frontend:**
   ```bash
   npm start
   ```

The frontend will open at: **http://localhost:3000**

## Alternative: Use Backend Only

If you don't want to install Node.js right now, you can still use the backend:

1. **Start the backend:**
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Access the API directly:**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/health
   - All API endpoints are available

The backend is fully functional without the frontend!

## Quick Start Script

After installing Node.js, you can use:
```bash
scripts\start_frontend.bat
```

This will automatically install dependencies and start the frontend.


