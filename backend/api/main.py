"""
Main API Router - Combines all API modules
"""
from fastapi import APIRouter
from backend.api import trading, backtest, data, settings, trades

# Create main router
router = APIRouter()

# Include all sub-routers
router.include_router(trading.router, tags=["Trading"])
router.include_router(backtest.router, tags=["Backtest"])
router.include_router(data.router, tags=["Data"])
router.include_router(settings.router, tags=["Settings"])
router.include_router(trades.router, tags=["Trades"])

# Export router and setter functions
from backend.api.trading import set_trading_engine as set_trading_engine_api
from backend.api.backtest import (
    set_backtest_engine,
    set_trading_engine as set_trading_engine_backtest,
    set_notification_manager as set_notification_manager_backtest
)
from backend.api.data import set_data_downloader, set_trading_engine as set_trading_engine_data
from backend.api.settings import set_settings_manager, set_notification_manager

def initialize_api_globals(trading_engine, backtest_engine, data_downloader, settings_manager, notification_manager):
    """Initialize all API global instances"""
    set_trading_engine_api(trading_engine)
    set_trading_engine_backtest(trading_engine)
    set_trading_engine_data(trading_engine)
    set_backtest_engine(backtest_engine)
    set_data_downloader(data_downloader)
    set_settings_manager(settings_manager)
    set_notification_manager(notification_manager)
    set_notification_manager_backtest(notification_manager)

