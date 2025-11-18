"""
Data Management API Endpoints
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional
import logging

from backend.data_downloader import DataDownloader
from backend.trading_engine import TradingEngine

logger = logging.getLogger(__name__)
router = APIRouter()

# Global data downloader instance
data_downloader: Optional[DataDownloader] = None
trading_engine: Optional[TradingEngine] = None

def set_data_downloader(downloader: DataDownloader):
    """Set global data downloader instance"""
    global data_downloader
    data_downloader = downloader

def set_trading_engine(engine: TradingEngine):
    """Set trading engine for WebSocket access"""
    global trading_engine
    trading_engine = engine

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


