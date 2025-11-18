"""
Comprehensive Settings Management System
"""
import json
import logging
from typing import Dict, Any, Optional, List
from backend.database import get_settings, save_settings
from backend.config_manager import ConfigManager

logger = logging.getLogger(__name__)

class SettingsManager:
    """Manages all system settings with validation and runtime updates"""
    
    def __init__(self):
        self.config_manager = ConfigManager()
        self._settings_cache: Optional[Dict] = None
        self._load_settings()
    
    def _load_settings(self):
        """Load settings from database or use defaults"""
        settings = get_settings()
        if not settings:
            settings = self.config_manager.get_default_settings()
            save_settings(settings)
        self._settings_cache = settings
    
    def get_all_settings(self) -> Dict[str, Any]:
        """Get all current settings"""
        if not self._settings_cache:
            self._load_settings()
        return self._settings_cache.copy()
    
    def get_category(self, category: str) -> Dict[str, Any]:
        """Get settings for a specific category"""
        all_settings = self.get_all_settings()
        return all_settings.get(category, {})
    
    def update_category(self, category: str, updates: Dict[str, Any], validate: bool = True) -> bool:
        """Update settings in a category"""
        try:
            if not self._settings_cache:
                self._load_settings()
            
            if validate:
                self._validate_category(category, updates)
            
            # Merge updates
            if category not in self._settings_cache:
                self._settings_cache[category] = {}
            
            self._settings_cache[category].update(updates)
            
            # Save to database
            save_settings(self._settings_cache)
            
            logger.info(f"Settings updated: {category}")
            return True
        except Exception as e:
            logger.error(f"Error updating settings: {e}")
            raise
    
    def update_setting(self, category: str, key: str, value: Any, validate: bool = True) -> bool:
        """Update a single setting"""
        return self.update_category(category, {key: value}, validate)
    
    def _validate_category(self, category: str, updates: Dict[str, Any]):
        """Validate settings updates"""
        if category == "strategy":
            self._validate_strategy(updates)
        elif category == "trading":
            self._validate_trading(updates)
        elif category == "risk":
            self._validate_risk(updates)
        elif category == "api_keys":
            self._validate_api_keys(updates)
        elif category == "backtest":
            self._validate_backtest(updates)
    
    def _validate_strategy(self, updates: Dict[str, Any]):
        """Validate strategy settings"""
        if "engulf_strength" in updates:
            val = updates["engulf_strength"]
            if not isinstance(val, (int, float)) or val < 1.0 or val > 5.0:
                raise ValueError("engulf_strength must be between 1.0 and 5.0")
        
        if "close_near_percent" in updates:
            val = updates["close_near_percent"]
            if not isinstance(val, (int, float)) or val < 0 or val > 1:
                raise ValueError("close_near_percent must be between 0 and 1")
        
        if "min_range_pips_current" in updates:
            val = updates["min_range_pips_current"]
            if not isinstance(val, int) or val < 1 or val > 1000:
                raise ValueError("min_range_pips_current must be between 1 and 1000")
        
        if "timeframe" in updates:
            valid_timeframes = ["1m", "2m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "1d"]
            if updates["timeframe"] not in valid_timeframes:
                raise ValueError(f"timeframe must be one of: {valid_timeframes}")
    
    def _validate_trading(self, updates: Dict[str, Any]):
        """Validate trading settings"""
        if "trading_window_start" in updates:
            val = updates["trading_window_start"]
            if not isinstance(val, int) or val < 0 or val > 23:
                raise ValueError("trading_window_start must be between 0 and 23")
        
        if "trading_window_end" in updates:
            val = updates["trading_window_end"]
            if not isinstance(val, int) or val < 0 or val > 23:
                raise ValueError("trading_window_end must be between 0 and 23")
        
        if "max_positions" in updates:
            val = updates["max_positions"]
            if not isinstance(val, int) or val < 1 or val > 10:
                raise ValueError("max_positions must be between 1 and 10")
        
        if "position_size_percent" in updates:
            val = updates["position_size_percent"]
            if not isinstance(val, (int, float)) or val < 0.1 or val > 100:
                raise ValueError("position_size_percent must be between 0.1 and 100")
    
    def _validate_risk(self, updates: Dict[str, Any]):
        """Validate risk settings"""
        if "structural_sl_buffer_pips" in updates:
            val = updates["structural_sl_buffer_pips"]
            if not isinstance(val, (int, float)) or val < 0 or val > 100:
                raise ValueError("structural_sl_buffer_pips must be between 0 and 100")
        
        if "min_profit_pips" in updates:
            val = updates["min_profit_pips"]
            if not isinstance(val, (int, float)) or val < 0:
                raise ValueError("min_profit_pips must be >= 0")
        
        if "min_profit_money" in updates:
            val = updates["min_profit_money"]
            if not isinstance(val, (int, float)) or val < 0:
                raise ValueError("min_profit_money must be >= 0")
    
    def _validate_api_keys(self, updates: Dict[str, Any]):
        """Validate API key settings"""
        # Don't validate actual keys, just structure
        pass
    
    def _validate_backtest(self, updates: Dict[str, Any]):
        """Validate backtest settings"""
        if "initial_balance" in updates:
            val = updates["initial_balance"]
            if not isinstance(val, (int, float)) or val < 100:
                raise ValueError("initial_balance must be >= 100")
    
    def get_default_settings(self) -> Dict[str, Any]:
        """Get default settings structure"""
        return self.config_manager.get_default_settings()
    
    def reset_to_defaults(self) -> bool:
        """Reset all settings to defaults"""
        try:
            defaults = self.get_default_settings()
            self._settings_cache = defaults
            save_settings(defaults)
            logger.info("Settings reset to defaults")
            return True
        except Exception as e:
            logger.error(f"Error resetting settings: {e}")
            return False


