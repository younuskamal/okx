"""
Engulfing Strategy Implementation (Shared)
"""
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class EngulfingStrategy:
    """Engulfing pattern detection and trading logic"""
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.pip_value = 0.01  # For ETH/USDT
        
        # Strategy parameters
        self.engulf_strength = self.config.get("engulf_strength", 1.3)
        self.close_near_percent = self.config.get("close_near_percent", 0.1)
        self.min_range_pips_current = self.config.get("min_range_pips_current", 15)
        self.min_range_pips_previous = self.config.get("min_range_pips_previous", 10)
    
    def update_config(self, config: Dict):
        """Update strategy configuration"""
        self.config.update(config)
        self.engulf_strength = self.config.get("engulf_strength", 1.3)
        self.close_near_percent = self.config.get("close_near_percent", 0.1)
        self.min_range_pips_current = self.config.get("min_range_pips_current", 15)
        self.min_range_pips_previous = self.config.get("min_range_pips_previous", 10)
    
    def is_bullish_candle(self, candle: List[float]) -> bool:
        """Check if candle is bullish (close > open)"""
        open_price, close = candle[1], candle[4]
        return close > open_price
    
    def is_bearish_candle(self, candle: List[float]) -> bool:
        """Check if candle is bearish (close < open)"""
        open_price, close = candle[1], candle[4]
        return close < open_price
    
    def get_candle_body(self, candle: List[float]) -> float:
        """Get candle body size"""
        open_price, close = candle[1], candle[4]
        return abs(close - open_price)
    
    def get_candle_range(self, candle: List[float]) -> float:
        """Get candle range (high - low)"""
        high, low = candle[2], candle[3]
        return high - low
    
    def get_upper_wick(self, candle: List[float]) -> float:
        """Get upper wick size"""
        open_price, high, close = candle[1], candle[2], candle[4]
        body_top = max(open_price, close)
        return high - body_top
    
    def get_lower_wick(self, candle: List[float]) -> float:
        """Get lower wick size"""
        open_price, low, close = candle[1], candle[3], candle[4]
        body_bottom = min(open_price, close)
        return body_bottom - low
    
    def body_engulfs_previous(self, current: List[float], previous: List[float]) -> bool:
        """Check if current candle body fully engulfs previous candle body"""
        curr_open, curr_close = current[1], current[4]
        prev_open, prev_close = previous[1], previous[4]
        
        curr_body_top = max(curr_open, curr_close)
        curr_body_bottom = min(curr_open, curr_close)
        prev_body_top = max(prev_open, prev_close)
        prev_body_bottom = min(prev_open, prev_close)
        
        return (curr_body_bottom <= prev_body_bottom and 
                curr_body_top >= prev_body_top)
    
    def check_bullish_engulfing(self, current: List[float], previous: List[float]) -> bool:
        """
        Check for bullish engulfing pattern
        """
        # Check previous is bearish, current is bullish
        if not (self.is_bearish_candle(previous) and self.is_bullish_candle(current)):
            return False
        
        # Body > both wicks
        body = self.get_candle_body(current)
        upper_wick = self.get_upper_wick(current)
        lower_wick = self.get_lower_wick(current)
        if not (body > upper_wick and body > lower_wick):
            return False
        
        # Range conditions
        curr_range = self.get_candle_range(current)
        prev_range = self.get_candle_range(previous)
        
        curr_range_pips = curr_range / self.pip_value
        prev_range_pips = prev_range / self.pip_value
        
        if curr_range_pips < self.min_range_pips_current:
            return False
        if prev_range_pips < self.min_range_pips_previous:
            return False
        if curr_range < prev_range * self.engulf_strength:
            return False
        
        # Close near high
        high, low, close = current[2], current[3], current[4]
        if (high - low) == 0:
            return False
        close_ratio = (close - low) / (high - low)
        if close_ratio < (1.0 - self.close_near_percent):
            return False
        
        # Body engulfs previous
        if not self.body_engulfs_previous(current, previous):
            return False
        
        return True
    
    def check_bearish_engulfing(self, current: List[float], previous: List[float]) -> bool:
        """
        Check for bearish engulfing pattern
        """
        # Check previous is bullish, current is bearish
        if not (self.is_bullish_candle(previous) and self.is_bearish_candle(current)):
            return False
        
        # Body > both wicks
        body = self.get_candle_body(current)
        upper_wick = self.get_upper_wick(current)
        lower_wick = self.get_lower_wick(current)
        if not (body > upper_wick and body > lower_wick):
            return False
        
        # Range conditions
        curr_range = self.get_candle_range(current)
        prev_range = self.get_candle_range(previous)
        
        curr_range_pips = curr_range / self.pip_value
        prev_range_pips = prev_range / self.pip_value
        
        if curr_range_pips < self.min_range_pips_current:
            return False
        if prev_range_pips < self.min_range_pips_previous:
            return False
        if curr_range < prev_range * self.engulf_strength:
            return False
        
        # Close near low
        high, low, close = current[2], current[3], current[4]
        if (high - low) == 0:
            return False
        close_ratio = (close - low) / (high - low)
        if close_ratio > self.close_near_percent:
            return False
        
        # Body engulfs previous
        if not self.body_engulfs_previous(current, previous):
            return False
        
        return True


