"""
API Routes for Trading System
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, List
import logging
from datetime import datetime

from backend.database import (
    get_settings, save_settings, get_trades, save_trade,
    get_positions, save_position, update_position
)
from backend.trading_engine import TradingEngine
from backend.backtest_engine import BacktestEngine
from backend.websocket_manager import WebSocketManager
from backend.data_downloader import DataDownloader

logger = logging.getLogger(__name__)
router = APIRouter()

# Global trading engine instance (will be set by main.py)
trading_engine: Optional[TradingEngine] = None
backtest_engine: Optional[BacktestEngine] = None
data_downloader: Optional[DataDownloader] = None

def set_trading_engine(engine: TradingEngine):
    """Set global trading engine instance"""
    global trading_engine
    trading_engine = engine

def set_backtest_engine(engine: BacktestEngine):
    """Set global backtest engine instance"""
    global backtest_engine
    backtest_engine = engine

def set_data_downloader(downloader: DataDownloader):
    """Set global data downloader instance"""
    global data_downloader
    data_downloader = downloader

class SettingsUpdate(BaseModel):
    """Settings update model"""
    strategy: Optional[Dict] = None
    trading: Optional[Dict] = None
    risk: Optional[Dict] = None
    api_keys: Optional[Dict] = None

class BacktestRequest(BaseModel):
    """Backtest request model"""
    start_date: str
    end_date: str
    timeframe: str = "2m"
    symbol: str = "ETH/USDT"
    initial_balance: float = 10000.0
    strategy_params: Dict = {}
    risk_params: Dict = {}

@router.get("/settings")
async def get_settings_endpoint():
    """Get current settings"""
    try:
        settings = get_settings()
        if not settings:
            # Return default settings
            from backend.config_manager import ConfigManager
            cm = ConfigManager()
            return cm.get_default_settings()
        return settings
    except Exception as e:
        logger.error(f"Error getting settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings")
async def update_settings_endpoint(settings_update: SettingsUpdate):
    """Update settings"""
    try:
        current_settings = get_settings() or {}
        
        # Merge updates
        if settings_update.strategy:
            current_settings.setdefault("strategy", {}).update(settings_update.strategy)
        if settings_update.trading:
            current_settings.setdefault("trading", {}).update(settings_update.trading)
        if settings_update.risk:
            current_settings.setdefault("risk", {}).update(settings_update.risk)
        if settings_update.api_keys:
            current_settings.setdefault("api_keys", {}).update(settings_update.api_keys)
        
        save_settings(current_settings)
        
        # Reload trading engine if running
        if trading_engine and trading_engine.is_running():
            await trading_engine.reload_settings(current_settings)
        
        return {"status": "success", "message": "Settings updated"}
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trades")
async def get_trades_endpoint(limit: int = 100, offset: int = 0):
    """Get trade history"""
    try:
        trades = get_trades(limit=limit, offset=offset)
        return {"trades": trades, "total": len(trades)}
    except Exception as e:
        logger.error(f"Error getting trades: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/positions")
async def get_positions_endpoint():
    """Get current positions"""
    try:
        positions = get_positions()
        return {"positions": positions}
    except Exception as e:
        logger.error(f"Error getting positions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trading/start")
async def start_trading():
    """Start trading engine"""
    try:
        if not trading_engine:
            raise HTTPException(status_code=500, detail="Trading engine not initialized")
        
        if trading_engine.is_running():
            return {"status": "already_running", "message": "Trading is already active"}
        
        settings = get_settings()
        await trading_engine.start(settings)
        return {"status": "success", "message": "Trading started"}
    except Exception as e:
        logger.error(f"Error starting trading: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trading/stop")
async def stop_trading():
    """Stop trading engine"""
    try:
        if not trading_engine:
            raise HTTPException(status_code=500, detail="Trading engine not initialized")
        
        if not trading_engine.is_running():
            return {"status": "not_running", "message": "Trading is not active"}
        
        await trading_engine.stop()
        return {"status": "success", "message": "Trading stopped"}
    except Exception as e:
        logger.error(f"Error stopping trading: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trading/status")
async def get_trading_status():
    """Get trading engine status"""
    try:
        if not trading_engine:
            return {"running": False, "message": "Engine not initialized"}
        
        status = trading_engine.get_status()
        return status
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backtest/run")
async def run_backtest(request: BacktestRequest, background_tasks: BackgroundTasks):
    """Run backtest"""
    try:
        global backtest_engine
        
        # Get settings for trading config
        settings = get_settings() or {}
        trading_config = settings.get('trading', {})
        position_size_percent = trading_config.get('position_size_percent', 10.0)
        
        # Get WebSocket manager from trading engine
        ws_manager = trading_engine.ws_manager if trading_engine else None
        
        backtest_engine = BacktestEngine(
            initial_balance=request.initial_balance,
            strategy_params=request.strategy_params,
            risk_params=request.risk_params,
            ws_manager=ws_manager
        )
        set_backtest_engine(backtest_engine)
        
        # Run backtest in background
        background_tasks.add_task(
            backtest_engine.run,
            symbol=request.symbol,
            timeframe=request.timeframe,
            start_date=request.start_date,
            end_date=request.end_date,
            trading_config=trading_config,
            position_size_percent=position_size_percent
        )
        
        return {"status": "started", "message": "Backtest started"}
    except Exception as e:
        logger.error(f"Error starting backtest: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/backtest/status")
async def get_backtest_status():
    """Get backtest status"""
    try:
        if not backtest_engine:
            return {"running": False, "message": "No backtest running"}
        
        status = backtest_engine.get_status()
        return status
    except Exception as e:
        logger.error(f"Error getting backtest status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/backtest/results")
async def get_backtest_results():
    """Get backtest results"""
    try:
        if not backtest_engine:
            raise HTTPException(status_code=404, detail="No backtest results available")
        
        results = backtest_engine.get_results()
        return results
    except Exception as e:
        logger.error(f"Error getting backtest results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics")
async def get_metrics():
    """Get system metrics"""
    try:
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "trading_active": trading_engine.is_running() if trading_engine else False,
            "positions_count": len(get_positions()),
            "total_trades": len(get_trades()),
        }
        
        if trading_engine:
            engine_metrics = trading_engine.get_metrics()
            metrics.update(engine_metrics)
        
        return metrics
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data/datasets")
async def get_datasets():
    """Get available datasets"""
    try:
        if not data_downloader:
            raise HTTPException(status_code=500, detail="Data downloader not initialized")
        datasets = data_downloader.get_available_datasets()
        return {"datasets": datasets}
    except Exception as e:
        logger.error(f"Error getting datasets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/data/download")
async def download_data(
    symbol: str = "ETH/USDT",
    timeframe: str = "2m",
    days: int = 365,
    background_tasks: BackgroundTasks = None
):
    """Download historical data"""
    try:
        if not data_downloader:
            raise HTTPException(status_code=500, detail="Data downloader not initialized")
        
        ws_manager = trading_engine.ws_manager if trading_engine else None
        downloader = DataDownloader(ws_manager=ws_manager)
        
        # Run download in background
        background_tasks.add_task(
            downloader.download_historical_data,
            symbol=symbol,
            timeframe=timeframe,
            days=days
        )
        
        return {"status": "started", "message": "Data download started"}
    except Exception as e:
        logger.error(f"Error starting data download: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data/ohlcv")
async def get_ohlcv_data(
    symbol: str = "ETH/USDT",
    timeframe: str = "2m",
    start_date: str = None,
    end_date: str = None
):
    """Get OHLCV data"""
    try:
        if not data_downloader:
            raise HTTPException(status_code=500, detail="Data downloader not initialized")
        
        if not start_date or not end_date:
            raise HTTPException(status_code=400, detail="start_date and end_date required")
        
        data = data_downloader.get_ohlcv_data(symbol, timeframe, start_date, end_date)
        return {"data": data, "count": len(data)}
    except Exception as e:
        logger.error(f"Error getting OHLCV data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

