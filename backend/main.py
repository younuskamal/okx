"""
FastAPI Backend for OKX Trading System
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from typing import Optional
import logging
from datetime import datetime

from backend.api.main import router, initialize_api_globals
from backend.websocket_manager import WebSocketManager
from backend.trading_engine import TradingEngine
from backend.backtest_engine import BacktestEngine
from backend.data_downloader import DataDownloader
from backend.settings_manager import SettingsManager
from backend.notification_manager import NotificationManager
from backend.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global instances
ws_manager = WebSocketManager()
trading_engine: Optional[TradingEngine] = None
backtest_engine: Optional[BacktestEngine] = None
data_downloader: Optional[DataDownloader] = None
settings_manager: Optional[SettingsManager] = None
notification_manager: Optional[NotificationManager] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    global trading_engine, backtest_engine, data_downloader, settings_manager, notification_manager
    logger.info("Initializing database...")
    init_db()
    
    logger.info("Initializing settings manager...")
    settings_manager = SettingsManager()
    settings = settings_manager.get_all_settings()

    notification_manager = NotificationManager(ws_manager=ws_manager)
    notification_manager.update_from_settings(settings.get('notifications', {}))

    logger.info("Initializing trading engine...")
    trading_engine = TradingEngine(settings, ws_manager, notification_manager=notification_manager)

    logger.info("Initializing data downloader...")
    data_downloader = DataDownloader(ws_manager=ws_manager)

    logger.info("Initializing API globals...")
    initialize_api_globals(
        trading_engine,
        backtest_engine,
        data_downloader,
        settings_manager,
        notification_manager
    )
    
    logger.info("Backend started successfully")
    
    yield
    
    # Shutdown
    if trading_engine:
        await trading_engine.stop()
    logger.info("Backend shutdown complete")

app = FastAPI(
    title="OKX Trading System API",
    description="Professional trading system with engulfing strategy",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:80",
        "http://127.0.0.1:80",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "OKX Trading System API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "trading_active": trading_engine.is_running() if trading_engine else False
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            import json
            message = json.loads(data)
            if message.get("type") == "ping":
                await ws_manager.send_personal_message({"type": "pong"}, websocket)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
