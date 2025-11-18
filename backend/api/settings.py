"""
Settings API Endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from backend.settings_manager import SettingsManager

logger = logging.getLogger(__name__)
router = APIRouter()

# Global settings manager
settings_manager: Optional[SettingsManager] = None

def set_settings_manager(manager: SettingsManager):
    """Set global settings manager"""
    global settings_manager
    settings_manager = manager

class SettingUpdate(BaseModel):
    """Single setting update"""
    category: str
    key: str
    value: Any

class CategoryUpdate(BaseModel):
    """Category settings update"""
    category: str
    settings: Dict[str, Any]

@router.get("/settings")
async def get_all_settings():
    """Get all settings"""
    try:
        if not settings_manager:
            raise HTTPException(status_code=500, detail="Settings manager not initialized")
        return settings_manager.get_all_settings()
    except Exception as e:
        logger.error(f"Error getting settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/settings/{category}")
async def get_category_settings(category: str):
    """Get settings for a specific category"""
    try:
        if not settings_manager:
            raise HTTPException(status_code=500, detail="Settings manager not initialized")
        return settings_manager.get_category(category)
    except Exception as e:
        logger.error(f"Error getting category settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings/category")
async def update_category_settings(update: CategoryUpdate):
    """Update settings in a category"""
    try:
        if not settings_manager:
            raise HTTPException(status_code=500, detail="Settings manager not initialized")
        settings_manager.update_category(update.category, update.settings)
        
        # Reload trading engine if running
        # Import here to avoid circular dependency
        try:
            from backend.api.trading import trading_engine as te
            if te and te.is_running():
                new_settings = settings_manager.get_all_settings()
                await te.reload_settings(new_settings)
                logger.info("Trading engine settings reloaded")
        except Exception as reload_error:
            logger.warning(f"Could not reload trading engine: {reload_error}")
        
        return {"status": "success", "message": f"{update.category} settings updated"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating category settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings/single")
async def update_single_setting(update: SettingUpdate):
    """Update a single setting"""
    try:
        if not settings_manager:
            raise HTTPException(status_code=500, detail="Settings manager not initialized")
        settings_manager.update_setting(update.category, update.key, update.value)
        
        # Reload trading engine if running
        try:
            from backend.api.trading import trading_engine as te
            if te and te.is_running():
                new_settings = settings_manager.get_all_settings()
                await te.reload_settings(new_settings)
        except Exception as reload_error:
            logger.warning(f"Could not reload trading engine: {reload_error}")
        
        return {"status": "success", "message": f"{update.category}.{update.key} updated"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating setting: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings/reset")
async def reset_settings():
    """Reset all settings to defaults"""
    try:
        if not settings_manager:
            raise HTTPException(status_code=500, detail="Settings manager not initialized")
        settings_manager.reset_to_defaults()
        return {"status": "success", "message": "Settings reset to defaults"}
    except Exception as e:
        logger.error(f"Error resetting settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/settings/defaults")
async def get_default_settings():
    """Get default settings structure"""
    try:
        if not settings_manager:
            raise HTTPException(status_code=500, detail="Settings manager not initialized")
        return settings_manager.get_default_settings()
    except Exception as e:
        logger.error(f"Error getting default settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))
