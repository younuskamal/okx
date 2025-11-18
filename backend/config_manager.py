"""
Configuration Manager for Trading System
"""
import json
import os
from typing import Dict, Any
from pathlib import Path

class ConfigManager:
    """Manages system configuration"""
    
    def __init__(self, config_file: str = "config.json"):
        self.config_file = Path(config_file)
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file or return defaults"""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading config: {e}")
        
        return self.get_default_settings()
    
    def save_config(self, config: Dict[str, Any]):
        """Save configuration to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=2)
            self.config = config
        except Exception as e:
            print(f"Error saving config: {e}")
    
    def get_default_settings(self) -> Dict[str, Any]:
        """Get default settings"""
        return {
            "strategy": {
                "engulf_strength": 1.3,
                "close_near_percent": 0.1,
                "min_range_pips_current": 15,
                "min_range_pips_previous": 10,
                "timeframe": "2m",
                "symbol": "ETH/USDT"
            },
            "trading": {
                "trading_window_start": 15,
                "trading_window_end": 19,
                "timezone": "Europe/Moscow",  # UTC+3
                "max_positions": 1,
                "position_size_percent": 10.0,
                "mode": "paper"  # paper, live, backtest
            },
            "risk": {
                "structural_sl_buffer_pips": 5,
                "min_profit_pips": 0,
                "min_profit_money": 0,
                "close_at_first_profit": True,
                "stop_loss_enabled": True,
                "take_profit_enabled": True
            },
            "api_keys": {
                "okx_api_key": os.getenv("OKX_API_KEY", ""),
                "okx_secret_key": os.getenv("OKX_SECRET_KEY", ""),
                "okx_passphrase": os.getenv("OKX_PASSPHRASE", ""),
                "okx_sandbox": os.getenv("OKX_SANDBOX", "true").lower() == "true"
            },
            "advanced": {
                "candle_refresh_interval": 120,
                "max_retry_attempts": 3,
                "auto_restart": False,
                "enable_logging": True
            },
            "backtest": {
                "default_initial_balance": 10000.0,
                "default_days": 365,
                "use_cached_data": True
            }
        }
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        keys = key.split('.')
        value = self.config
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    return default
            else:
                return default
        return value
    
    def set(self, key: str, value: Any):
        """Set configuration value"""
        keys = key.split('.')
        config = self.config
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        config[keys[-1]] = value

