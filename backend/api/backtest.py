"""
Backtest API Endpoints
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict
import logging

from backend.backtest_engine import BacktestEngine
from backend.trading_engine import TradingEngine
from backend.settings_manager import SettingsManager

logger = logging.getLogger(__name__)
router = APIRouter()

# Global backtest engine instance
backtest_engine: Optional[BacktestEngine] = None
trading_engine: Optional[TradingEngine] = None

def set_backtest_engine(engine: BacktestEngine):
    """Set global backtest engine instance"""
    global backtest_engine
    backtest_engine = engine

def set_trading_engine(engine: TradingEngine):
    """Set trading engine for WebSocket access"""
    global trading_engine
    trading_engine = engine

class BacktestRequest(BaseModel):
    """Backtest request model"""
    start_date: str
    end_date: str
    timeframe: str = "2m"
    symbol: str = "ETH/USDT"
    initial_balance: float = 10000.0
    strategy_params: Optional[Dict] = None
    risk_params: Optional[Dict] = None

@router.post("/backtest/run")
async def run_backtest(request: BacktestRequest, background_tasks: BackgroundTasks):
    """Run backtest"""
    try:
        global backtest_engine
        
        # Get settings
        settings_manager = SettingsManager()
        settings = settings_manager.get_all_settings()
        
        trading_config = settings.get('trading', {})
        position_size_percent = trading_config.get('position_size_percent', 10.0)
        
        # Use provided params or fall back to settings
        strategy_params = request.strategy_params or settings.get('strategy', {})
        risk_params = request.risk_params or settings.get('risk', {})
        
        # Get WebSocket manager
        ws_manager = trading_engine.ws_manager if trading_engine else None
        
        backtest_engine = BacktestEngine(
            initial_balance=request.initial_balance,
            strategy_params=strategy_params,
            risk_params=risk_params,
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


