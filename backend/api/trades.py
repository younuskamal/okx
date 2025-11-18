"""
Trades and Positions API Endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict
import logging

from backend.database import get_trades, get_positions

logger = logging.getLogger(__name__)
router = APIRouter()

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


