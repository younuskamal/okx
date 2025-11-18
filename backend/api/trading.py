"""
Trading API Endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import logging

from backend.trading_engine import TradingEngine

logger = logging.getLogger(__name__)
router = APIRouter()

# Global trading engine instance
trading_engine: Optional[TradingEngine] = None

def set_trading_engine(engine: TradingEngine):
    """Set global trading engine instance"""
    global trading_engine
    trading_engine = engine

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

@router.post("/trading/start")
async def start_trading():
    """Start trading engine"""
    try:
        if not trading_engine:
            raise HTTPException(status_code=500, detail="Trading engine not initialized")
        
        if trading_engine.is_running():
            return {"status": "already_running", "message": "Trading is already active"}
        
        # Get latest settings
        from backend.api.settings import settings_manager
        if settings_manager:
            settings = settings_manager.get_all_settings()
        else:
            from backend.settings_manager import SettingsManager
            sm = SettingsManager()
            settings = sm.get_all_settings()
        
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

@router.get("/trading/metrics")
async def get_trading_metrics():
    """Get trading metrics"""
    try:
        if not trading_engine:
            return {"metrics": {}}
        return trading_engine.get_metrics()
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trading/account")
async def get_account_overview(force: bool = False):
    """Fetch balances, orders, positions, and mark price."""
    if not trading_engine:
        raise HTTPException(status_code=500, detail="Trading engine not initialized")
    try:
        snapshot = await trading_engine.get_account_snapshot(force_refresh=force)
        return snapshot
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/trading/wallets")
async def get_wallet_breakdown():
    """Return wallet balances only."""
    if not trading_engine:
        raise HTTPException(status_code=500, detail="Trading engine not initialized")
    try:
        return await trading_engine.get_wallet_balances()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

