"""
Enhanced Backtesting Engine
"""
import ccxt
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import asyncio
import logging
import sys
import os

# Add parent directory to path for shared imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.strategy import EngulfingStrategy
from backend.websocket_manager import WebSocketManager
from backend.notification_manager import NotificationManager

logger = logging.getLogger(__name__)

class BacktestEngine:
    """Enhanced backtesting engine"""
    
    def __init__(self, initial_balance: float = 10000.0,
                 strategy_params: Dict = None,
                 risk_params: Dict = None,
                 ws_manager: Optional[WebSocketManager] = None,
                 notification_manager: Optional[NotificationManager] = None):
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.equity_curve = []
        self.trades = []
        self.current_position: Optional[Dict] = None
        self.strategy = EngulfingStrategy(strategy_params or {})
        self.risk_params = risk_params or {}
        self.ws_manager = ws_manager
        self.running = False
        self.results: Optional[Dict] = None
        self.notification_manager = notification_manager
        
        # Risk parameters
        self.structural_sl_buffer_pips = self.risk_params.get('structural_sl_buffer_pips', 5)
        self.min_profit_pips = self.risk_params.get('min_profit_pips', 0)
        self.min_profit_money = self.risk_params.get('min_profit_money', 0)
        self.close_at_first_profit = self.risk_params.get('close_at_first_profit', True)
    
    def calculate_stop_loss(self, signal_type: str, engulfing_candle: List[float]) -> float:
        """Calculate structural stop loss"""
        buffer = self.structural_sl_buffer_pips * 0.01
        high, low = engulfing_candle[2], engulfing_candle[3]
        
        if signal_type == 'buy':
            return low - buffer
        else:  # sell
            return high + buffer
    
    def calculate_profit_pips(self, entry_price: float, current_price: float, side: str) -> float:
        """Calculate profit in pips"""
        if side == 'buy':
            profit = current_price - entry_price
        else:  # sell
            profit = entry_price - current_price
        return profit / 0.01
    
    def calculate_profit_usd(self, entry_price: float, current_price: float,
                            side: str, quantity: float) -> float:
        """Calculate profit in USD"""
        if side == 'buy':
            profit = (current_price - entry_price) * quantity
        else:  # sell
            profit = (entry_price - current_price) * quantity
        return profit
    
    def should_exit_position(self, entry_price: float, current_price: float,
                            side: str, quantity: float) -> bool:
        """Check if position should be closed"""
        if self.close_at_first_profit:
            profit_usd = self.calculate_profit_usd(entry_price, current_price, side, quantity)
            if profit_usd > 0:
                return True
        
        profit_pips = self.calculate_profit_pips(entry_price, current_price, side)
        profit_usd = self.calculate_profit_usd(entry_price, current_price, side, quantity)
        
        if self.min_profit_pips > 0 and profit_pips >= self.min_profit_pips:
            return True
        if self.min_profit_money > 0 and profit_usd >= self.min_profit_money:
            return True
        
        return False
    
    def is_trading_window_open(self, timestamp: int, trading_config: Dict) -> bool:
        """Check if timestamp is within trading window"""
        try:
            from datetime import datetime
            import pytz
            
            start_hour = trading_config.get('trading_window_start', 15)
            end_hour = trading_config.get('trading_window_end', 19)
            timezone_str = trading_config.get('timezone', 'Europe/Moscow')
            
            local_tz = pytz.timezone(timezone_str)
            dt = datetime.fromtimestamp(timestamp / 1000, tz=local_tz)
            current_hour = dt.hour
            return start_hour <= current_hour < end_hour
        except Exception as e:
            logger.error(f"Error checking trading window: {e}")
            return True  # Default to allowing trades
    
    def open_position(self, signal_type: str, engulfing_candle: List[float],
                     timestamp: int, index: int, position_size_percent: float = 10.0) -> bool:
        """Open a new position"""
        if self.current_position is not None:
            return False
        
        current_price = engulfing_candle[4]
        position_size_usd = self.balance * (position_size_percent / 100.0)
        quantity = position_size_usd / current_price
        
        side = 'buy' if signal_type == 'buy' else 'sell'
        stop_loss = self.calculate_stop_loss(signal_type, engulfing_candle)
        
        self.current_position = {
            'side': side,
            'entry_price': current_price,
            'quantity': quantity,
            'stop_loss': stop_loss,
            'entry_time': timestamp,
            'entry_index': index
        }
        
        return True
    
    def close_position(self, exit_price: float, timestamp: int, index: int,
                      reason: str = 'exit') -> bool:
        """Close current position"""
        if self.current_position is None:
            return False
        
        pos = self.current_position
        entry_price = pos['entry_price']
        quantity = pos['quantity']
        side = pos['side']
        
        # Calculate P&L
        if side == 'buy':
            pnl = (exit_price - entry_price) * quantity
        else:  # sell
            pnl = (entry_price - exit_price) * quantity
        
        # Update balance
        self.balance += pnl
        
        # Record trade
        trade = {
            'entry_time': pos['entry_time'],
            'exit_time': timestamp,
            'entry_price': entry_price,
            'exit_price': exit_price,
            'side': side,
            'quantity': quantity,
            'pnl': pnl,
            'pnl_pct': (pnl / (entry_price * quantity)) * 100,
            'reason': reason,
            'entry_index': pos['entry_index'],
            'exit_index': index
        }
        self.trades.append(trade)
        
        self.current_position = None
        return True
    
    def update_position(self, current_price: float, timestamp: int, index: int):
        """Update position and check exit conditions"""
        if self.current_position is None:
            return
        
        pos = self.current_position
        entry_price = pos['entry_price']
        stop_loss = pos['stop_loss']
        quantity = pos['quantity']
        side = pos['side']
        
        # Check stop loss
        hit_sl = False
        if side == 'buy' and current_price <= stop_loss:
            hit_sl = True
        elif side == 'sell' and current_price >= stop_loss:
            hit_sl = True
        
        if hit_sl:
            self.close_position(stop_loss, timestamp, index, 'stop_loss')
            return
        
        # Check exit conditions
        if self.should_exit_position(entry_price, current_price, side, quantity):
            self.close_position(current_price, timestamp, index, 'take_profit')
    
    def _normalize_timeframe(self, timeframe: str) -> str:
        """Normalize timeframe to OKX format"""
        # OKX uses specific timeframe formats
        timeframe_map = {
            '1m': '1m',
            '2m': '3m',  # OKX doesn't support 2m, use 3m as closest
            '3m': '3m',
            '5m': '5m',
            '15m': '15m',
            '30m': '30m',
            '1h': '1H',
            '1H': '1H',
            '2h': '2H',
            '2H': '2H',
            '4h': '4H',
            '4H': '4H',
            '1d': '1D',
            '1D': '1D',
        }
        return timeframe_map.get(timeframe.lower(), timeframe)
    
    async def fetch_historical_data(self, symbol: str, timeframe: str,
                                   start_date: str, end_date: str) -> List[List[float]]:
        """Fetch historical OHLCV data from OKX"""
        # Normalize timeframe for OKX
        okx_timeframe = self._normalize_timeframe(timeframe)
        if timeframe != okx_timeframe:
            logger.info(f"Timeframe {timeframe} normalized to {okx_timeframe} for OKX API")
        
        logger.info(f"Fetching historical data: {symbol} {okx_timeframe} (requested: {timeframe}) from {start_date} to {end_date}")
        
        exchange = ccxt.okx({'enableRateLimit': True})
        
        # Parse dates
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        all_candles = []
        since = int(start_dt.timestamp() * 1000)
        end_timestamp = int(end_dt.timestamp() * 1000)
        limit = 100
        
        while since < end_timestamp:
            try:
                # Use normalized timeframe for OKX API
                candles = exchange.fetch_ohlcv(symbol, okx_timeframe, since=since, limit=limit)
                if not candles:
                    break
                
                # Filter candles within date range
                filtered = [c for c in candles if c[0] <= end_timestamp]
                all_candles.extend(filtered)
                
                if candles[-1][0] >= end_timestamp:
                    break
                
                since = candles[-1][0] + 1
                
                if len(all_candles) % 1000 == 0:
                    logger.info(f"Fetched {len(all_candles)} candles...")
                    if self.ws_manager:
                        await self.ws_manager.send_backtest_update({
                            "status": "fetching",
                            "candles_fetched": len(all_candles)
                        })
                
                await asyncio.sleep(exchange.rateLimit / 1000)
                
            except Exception as e:
                logger.error(f"Error fetching data: {e}")
                break
        
        logger.info(f"Total candles fetched: {len(all_candles)}")
        return all_candles
    
    async def run(self, symbol: str, timeframe: str, start_date: str, end_date: str,
                 trading_config: Dict = None, position_size_percent: float = 10.0):
        """Run backtest"""
        self.running = True
        trading_config = trading_config or {}
        
        try:
            if self.ws_manager:
                await self.ws_manager.send_backtest_update({
                    "status": "starting",
                    "message": "Starting backtest..."
                })
            
            # Normalize timeframe and check if conversion needed
            okx_timeframe = self._normalize_timeframe(timeframe)
            if timeframe != okx_timeframe:
                logger.warning(f"Timeframe {timeframe} not supported by OKX, using {okx_timeframe} instead")
                if self.ws_manager:
                    await self.ws_manager.send_backtest_update({
                        "status": "warning",
                        "message": f"Using {okx_timeframe} instead of {timeframe} (OKX limitation)"
                    })
            
            # Fetch historical data (will use normalized timeframe internally)
            candles = await self.fetch_historical_data(symbol, timeframe, start_date, end_date)
            
            if len(candles) < 100:
                raise Exception("Not enough historical data. Need at least 100 candles.")
            
            if self.ws_manager:
                await self.ws_manager.send_backtest_update({
                    "status": "running",
                    "message": f"Running backtest on {len(candles)} candles..."
                })
            
            # Run backtest
            for i in range(1, len(candles)):
                if not self.running:
                    break
                
                current_candle = candles[i]
                previous_candle = candles[i-1]
                timestamp = current_candle[0]
                current_price = current_candle[4]
                
                # Update current position
                if self.current_position:
                    self.update_position(current_price, timestamp, i)
                
                # Check for new signals only if no position
                if self.current_position is None:
                    # Check trading window
                    if self.is_trading_window_open(timestamp, trading_config):
                        # Check bullish engulfing
                        if self.strategy.check_bullish_engulfing(current_candle, previous_candle):
                            self.open_position('buy', current_candle, timestamp, i, position_size_percent)
                        
                        # Check bearish engulfing
                        elif self.strategy.check_bearish_engulfing(current_candle, previous_candle):
                            self.open_position('sell', current_candle, timestamp, i, position_size_percent)
                
                # Record equity
                equity = self.balance
                if self.current_position:
                    pos = self.current_position
                    entry_price = pos['entry_price']
                    quantity = pos['quantity']
                    side = pos['side']
                    
                    if side == 'buy':
                        unrealized_pnl = (current_price - entry_price) * quantity
                    else:  # sell
                        unrealized_pnl = (entry_price - current_price) * quantity
                    
                    equity += unrealized_pnl
                
                self.equity_curve.append({
                    'timestamp': timestamp,
                    'equity': equity,
                    'price': current_price
                })
                
                # Progress update
                if i % 1000 == 0 and self.ws_manager:
                    await self.ws_manager.send_backtest_update({
                        "status": "running",
                        "progress": (i / len(candles)) * 100,
                        "candles_processed": i
                    })
            
            # Close any open position at the end
            if self.current_position:
                last_candle = candles[-1]
                self.close_position(last_candle[4], last_candle[0], len(candles)-1, 'end_of_data')
            
            # Generate results
            self.results = self.generate_report()
            
            if self.ws_manager:
                await self.ws_manager.send_backtest_update({
                    "status": "completed",
                    "message": "Backtest completed",
                    "results": self.results
                })
            await self._notify(
                'backtest_completed',
                'Backtest finished',
                f"ROI: {self.results.get('roi', 0):.2f}%",
                severity='success',
                metadata=self.results
            )

        except Exception as e:
            logger.error(f"Error in backtest: {e}")
            if self.ws_manager:
                await self.ws_manager.send_backtest_update({
                    "status": "error",
                    "message": str(e)
                })
            await self._notify('error', 'Backtest failed', str(e), severity='error')
        finally:
            self.running = False
    
    def generate_report(self) -> Dict:
        """Generate backtest report"""
        if not self.trades:
            return {
                'total_trades': 0,
                'win_rate': 0,
                'total_profit': 0,
                'max_drawdown': 0,
                'final_balance': self.balance,
                'roi': 0,
                'profit_factor': 0
            }
        
        df_trades = pd.DataFrame(self.trades)
        df_equity = pd.DataFrame(self.equity_curve)
        
        # Calculate metrics
        total_trades = len(df_trades)
        winning_trades = len(df_trades[df_trades['pnl'] > 0])
        losing_trades = len(df_trades[df_trades['pnl'] < 0])
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        
        total_profit = df_trades['pnl'].sum()
        avg_win = df_trades[df_trades['pnl'] > 0]['pnl'].mean() if winning_trades > 0 else 0
        avg_loss = df_trades[df_trades['pnl'] < 0]['pnl'].mean() if losing_trades > 0 else 0
        
        # Calculate max drawdown
        df_equity['peak'] = df_equity['equity'].cummax()
        df_equity['drawdown'] = (df_equity['equity'] - df_equity['peak']) / df_equity['peak'] * 100
        max_drawdown = df_equity['drawdown'].min()
        
        # Profit factor
        gross_profit = df_trades[df_trades['pnl'] > 0]['pnl'].sum() if winning_trades > 0 else 0
        gross_loss = abs(df_trades[df_trades['pnl'] < 0]['pnl'].sum()) if losing_trades > 0 else 0
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
        
        # ROI
        roi = ((self.balance - self.initial_balance) / self.initial_balance) * 100
        
        return {
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'win_rate': win_rate,
            'total_profit': total_profit,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'max_drawdown': max_drawdown,
            'profit_factor': profit_factor,
            'roi': roi,
            'final_balance': self.balance,
            'initial_balance': self.initial_balance,
            'trades': self.trades,
            'equity_curve': self.equity_curve
        }
    
    def get_status(self) -> Dict:
        """Get backtest status"""
        return {
            "running": self.running,
            "has_results": self.results is not None
        }
    
    def get_results(self) -> Dict:
        """Get backtest results"""
        if not self.results:
            raise Exception("No results available. Run backtest first.")
        return self.results

    async def _notify(self, event_type: str, title: str, message: str, severity: str = 'info', metadata: Optional[Dict] = None):
        if not self.notification_manager:
            return
        try:
            await self.notification_manager.send_notification(event_type, title, message, severity, metadata)
        except Exception as exc:
            logger.debug(f"Notification skip: {exc}")

