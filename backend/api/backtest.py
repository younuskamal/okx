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
from backend.notification_manager import NotificationManager
from backend.optimizer import ParameterOptimizer

logger = logging.getLogger(__name__)
router = APIRouter()

# Global backtest engine instance
backtest_engine: Optional[BacktestEngine] = None
trading_engine: Optional[TradingEngine] = None
notification_manager: Optional[NotificationManager] = None

def set_backtest_engine(engine: BacktestEngine):
    """Set global backtest engine instance"""
    global backtest_engine
    backtest_engine = engine

def set_trading_engine(engine: TradingEngine):
    """Set trading engine for WebSocket access"""
    global trading_engine
    trading_engine = engine


def set_notification_manager(manager: NotificationManager):
    """Attach notification manager for backtest events"""
    global notification_manager
    notification_manager = manager

class BacktestRequest(BaseModel):
    """Backtest request model"""
    start_date: str
    end_date: str
    timeframe: str = "2m"
    symbol: str = "ETH/USDT"
    initial_balance: float = 10000.0
    strategy_params: Optional[Dict] = None
    risk_params: Optional[Dict] = None
    forward_split: float = 0.2
    monte_carlo_iterations: int = 250


class OptimizationRequest(BaseModel):
    symbol: str = "ETH/USDT"
    timeframe: str = "2m"
    start_date: str
    end_date: str
    strategy_ranges: Dict[str, Dict]
    risk_ranges: Dict[str, Dict]
    top_n: int = 5
    sort_key: str = 'roi'

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
            ws_manager=ws_manager,
            notification_manager=notification_manager,
            monte_carlo_iterations=request.monte_carlo_iterations
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
            position_size_percent=position_size_percent,
            forward_split=request.forward_split
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


@router.post("/backtest/optimizer")
async def run_optimizer(request: OptimizationRequest):
    """Run parameter optimizer on cached candles"""
    try:
        settings_manager = SettingsManager()
        base_settings = settings_manager.get_all_settings()
        initial_balance = base_settings.get('backtest', {}).get('default_initial_balance', 10000.0)
        engine = BacktestEngine(
            initial_balance=initial_balance,
            strategy_params=base_settings.get('strategy', {}),
            risk_params=base_settings.get('risk', {}),
            ws_manager=trading_engine.ws_manager if trading_engine else None,
            notification_manager=None
        )
        candles = await engine.fetch_historical_data(
            request.symbol,
            request.timeframe,
            request.start_date,
            request.end_date
        )
        optimizer = ParameterOptimizer()
        results = await optimizer.optimize(
            candles,
            base_settings,
            request.strategy_ranges,
            request.risk_ranges,
            top_n=request.top_n,
            sort_key=request.sort_key
        )
        if notification_manager:
            await notification_manager.send_notification(
                'optimizer_completed',
                'Optimization finished',
                f"{results['total_runs']} combinations evaluated",
                severity='info',
                metadata=results
            )
        return results
    except Exception as exc:
        logger.error(f"Optimizer error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


