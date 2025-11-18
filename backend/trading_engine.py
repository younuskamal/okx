"""
Enhanced Trading Engine with WebSocket support
"""
import ccxt
import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, List
import pytz
import sys
import os

# Add parent directory to path for shared imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.strategy import EngulfingStrategy
from backend.websocket_manager import WebSocketManager
from backend.notification_manager import NotificationManager
from backend.database import save_trade, save_position, update_position, get_positions

logger = logging.getLogger(__name__)

class TradingEngine:
    """Enhanced trading engine with async support"""
    
    def __init__(self, settings: Dict, ws_manager: WebSocketManager, notification_manager: Optional[NotificationManager] = None):
        self.settings = settings
        self.ws_manager = ws_manager
        self.notification_manager = notification_manager
        self.exchange: Optional[ccxt.okx] = None
        self.strategy = EngulfingStrategy()
        self.current_position: Optional[Dict] = None
        self.running = False
        self.task: Optional[asyncio.Task] = None
        self.candles_cache: List[List[float]] = []
        self.metrics = {
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "total_pnl": 0.0,
            "last_update": None
        }
        
    def _init_exchange(self, api_keys: Dict):
        """Initialize OKX exchange connection"""
        try:
            self.exchange = ccxt.okx({
                'apiKey': api_keys.get('okx_api_key', ''),
                'secret': api_keys.get('okx_secret_key', ''),
                'password': api_keys.get('okx_passphrase', ''),
                'sandbox': api_keys.get('okx_sandbox', True),
                'enableRateLimit': True,
            })
            logger.info("OKX exchange initialized")
            return True
        except Exception as e:
            logger.error(f"Error initializing exchange: {e}")
            return False
    
    def _update_strategy_config(self):
        """Update strategy with current settings"""
        strategy_config = self.settings.get('strategy', {})
        self.strategy.update_config(strategy_config)
    
    def is_trading_window_open(self) -> bool:
        """Check if current time is within trading window"""
        trading_config = self.settings.get('trading', {})
        start_hour = trading_config.get('trading_window_start', 15)
        end_hour = trading_config.get('trading_window_end', 19)
        timezone_str = trading_config.get('timezone', 'Europe/Moscow')
        
        try:
            local_tz = pytz.timezone(timezone_str)
            now_local = datetime.now(local_tz)
            current_hour = now_local.hour
            return start_hour <= current_hour < end_hour
        except Exception as e:
            logger.error(f"Error checking trading window: {e}")
            return False
    
    def _normalize_timeframe(self, timeframe: str) -> str:
        """Normalize timeframe to OKX format"""
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
    
    async def get_candles(self, symbol: str, timeframe: str, limit: int = 10) -> List[List[float]]:
        """Fetch recent candles"""
        try:
            if not self.exchange:
                return []
            # Normalize timeframe for OKX
            okx_timeframe = self._normalize_timeframe(timeframe)
            candles = self.exchange.fetch_ohlcv(symbol, okx_timeframe, limit=limit)
            return candles
        except Exception as e:
            logger.error(f"Error fetching candles: {e}")
            await self.ws_manager.send_log({
                "level": "error",
                "message": f"Error fetching candles: {e}",
                "timestamp": datetime.now().isoformat()
            })
            await self._notify(
                'api_disconnect',
                'Failed to fetch candles',
                str(e),
                severity='warning'
            )
            return []
    
    def calculate_stop_loss(self, signal_type: str, engulfing_candle: List[float]) -> float:
        """Calculate structural stop loss"""
        risk_config = self.settings.get('risk', {})
        buffer_pips = risk_config.get('structural_sl_buffer_pips', 5)
        buffer = buffer_pips * 0.01  # Convert pips to price
        
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
        return profit / 0.01  # Convert to pips
    
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
        risk_config = self.settings.get('risk', {})
        close_at_first_profit = risk_config.get('close_at_first_profit', True)
        min_profit_pips = risk_config.get('min_profit_pips', 0)
        min_profit_money = risk_config.get('min_profit_money', 0)
        
        if close_at_first_profit:
            profit_usd = self.calculate_profit_usd(entry_price, current_price, side, quantity)
            if profit_usd > 0:
                return True
        
        profit_pips = self.calculate_profit_pips(entry_price, current_price, side)
        profit_usd = self.calculate_profit_usd(entry_price, current_price, side, quantity)
        
        if min_profit_pips > 0 and profit_pips >= min_profit_pips:
            return True
        if min_profit_money > 0 and profit_usd >= min_profit_money:
            return True
        
        return False
    
    async def place_market_order(self, side: str, quantity: float, symbol: str) -> Optional[Dict]:
        """Place a market order"""
        try:
            if not self.exchange:
                return None
            order = self.exchange.create_market_order(symbol, side, quantity)
            logger.info(f"Placed {side} order: {order.get('id', 'unknown')}")
            await self.ws_manager.send_log({
                "level": "info",
                "message": f"Order placed: {side} {quantity} {symbol}",
                "timestamp": datetime.now().isoformat()
            })
            return order
        except Exception as e:
            logger.error(f"Error placing order: {e}")
            await self.ws_manager.send_log({
                "level": "error",
                "message": f"Error placing order: {e}",
                "timestamp": datetime.now().isoformat()
            })
            await self._notify('error', 'Order placement failed', str(e), severity='error')
            return None
    
    async def close_position(self, position: Dict, reason: str = "exit") -> bool:
        """Close current position"""
        try:
            side = 'sell' if position['side'] == 'buy' else 'buy'
            quantity = abs(position['quantity'])
            symbol = position.get('symbol', self.settings.get('strategy', {}).get('symbol', 'ETH/USDT'))
            
            order = await self.place_market_order(side, quantity, symbol)
            
            if order:
                exit_price = position['current_price']
                profit = self.calculate_profit_usd(
                    position['entry_price'],
                    exit_price,
                    position['side'],
                    quantity
                )
                
                # Update metrics
                self.metrics['total_trades'] += 1
                if profit > 0:
                    self.metrics['winning_trades'] += 1
                else:
                    self.metrics['losing_trades'] += 1
                self.metrics['total_pnl'] += profit
                self.metrics['last_update'] = datetime.now().isoformat()
                
                # Save trade
                trade = {
                    'trade_id': f"trade_{datetime.now().timestamp()}",
                    'symbol': symbol,
                    'side': position['side'],
                    'entry_price': position['entry_price'],
                    'exit_price': exit_price,
                    'quantity': quantity,
                    'pnl': profit,
                    'pnl_percent': (profit / (position['entry_price'] * quantity)) * 100,
                    'entry_time': position['entry_time'],
                    'exit_time': datetime.now().isoformat(),
                    'status': 'closed',
                    'stop_loss': position.get('stop_loss'),
                    'reason': reason
                }
                save_trade(trade)
                
                await self.ws_manager.send_trade_update(trade)
                await self.ws_manager.send_metrics_update(self.metrics)

                logger.info(f"Closed position. Profit: ${profit:.2f}")
                self.current_position = None
                event_type = 'trade_closed'
                if reason == 'stop_loss':
                    event_type = 'stop_loss'
                elif reason == 'take_profit':
                    event_type = 'take_profit'
                await self._notify(
                    event_type,
                    f"Trade closed ({reason})",
                    f"PnL: ${profit:.2f}",
                    severity='success' if profit > 0 else 'warning',
                    metadata=trade
                )
                return True
            return False
        except Exception as e:
            logger.error(f"Error closing position: {e}")
            return False
    
    async def open_position(self, signal_type: str, engulfing_candle: List[float]) -> bool:
        """Open a new position based on signal"""
        if self.current_position is not None:
            logger.warning("Position already open, skipping new signal")
            return False
        
        if not self.is_trading_window_open():
            logger.info("Outside trading window, skipping signal")
            return False
        
        try:
            if not self.exchange:
                return False
            
            # Get account balance
            balance = self.exchange.fetch_balance()
            trading_config = self.settings.get('trading', {})
            position_size_percent = trading_config.get('position_size_percent', 10.0)
            
            quote_currency = 'USDT'
            usdt_balance = balance.get(quote_currency, {}).get('free', 0)
            
            if usdt_balance < 10:
                logger.warning(f"Insufficient balance: ${usdt_balance:.2f}")
                await self._notify(
                    'margin_issue',
                    'Insufficient balance',
                    f"Available USDT: {usdt_balance:.2f}",
                    severity='warning'
                )
                return False
            
            # Calculate position size
            position_size_usd = usdt_balance * (position_size_percent / 100.0)
            current_price = engulfing_candle[4]
            quantity = position_size_usd / current_price
            
            symbol = self.settings.get('strategy', {}).get('symbol', 'ETH/USDT')
            side = 'buy' if signal_type == 'buy' else 'sell'
            
            # Place order
            order = await self.place_market_order(side, quantity, symbol)
            if not order:
                return False
            
            # Calculate stop loss
            stop_loss = self.calculate_stop_loss(signal_type, engulfing_candle)
            
            # Store position
            position_id = f"pos_{datetime.now().timestamp()}"
            self.current_position = {
                'position_id': position_id,
                'symbol': symbol,
                'side': side,
                'entry_price': current_price,
                'current_price': current_price,
                'quantity': quantity,
                'stop_loss': stop_loss,
                'entry_time': datetime.now().isoformat(),
                'status': 'open'
            }
            
            save_position(self.current_position)
            await self.ws_manager.send_position_update(self.current_position)

            logger.info(f"Opened {side} position at ${current_price:.2f}, SL: ${stop_loss:.2f}")
            await self._notify(
                'trade_opened',
                f"{side.title()} position opened",
                f"Entry: ${current_price:.2f} | Size: {quantity:.4f}",
                metadata=self.current_position
            )
            return True
            
        except Exception as e:
            logger.error(f"Error opening position: {e}")
            return False
    
    async def update_position(self, current_price: float):
        """Update position with current price and check exit conditions"""
        if self.current_position is None:
            return
        
        self.current_position['current_price'] = current_price
        
        # Update in database
        update_position(
            self.current_position['position_id'],
            {'current_price': current_price}
        )
        
        # Check stop loss
        side = self.current_position['side']
        entry_price = self.current_position['entry_price']
        stop_loss = self.current_position['stop_loss']
        quantity = self.current_position['quantity']
        
        hit_sl = False
        if side == 'buy' and current_price <= stop_loss:
            hit_sl = True
        elif side == 'sell' and current_price >= stop_loss:
            hit_sl = True
        
        if hit_sl:
            logger.info(f"Stop loss hit at ${current_price:.2f}")
            await self.close_position(self.current_position, 'stop_loss')
            return
        
        # Check exit conditions
        if self.should_exit_position(entry_price, current_price, side, quantity):
            logger.info(f"Take profit condition met at ${current_price:.2f}")
            await self.close_position(self.current_position, 'take_profit')
            return
        
        # Send position update
        await self.ws_manager.send_position_update(self.current_position)
    
    async def trading_loop(self):
        """Main trading loop"""
        logger.info("Trading loop started")
        
        strategy_config = self.settings.get('strategy', {})
        symbol = strategy_config.get('symbol', 'ETH/USDT')
        timeframe = strategy_config.get('timeframe', '2m')
        
        while self.running:
            try:
                # Fetch candles
                candles = await self.get_candles(symbol, timeframe, limit=10)
                if len(candles) < 2:
                    await asyncio.sleep(10)
                    continue
                
                current_candle = candles[-1]
                previous_candle = candles[-2]
                
                # Update position if exists
                if self.current_position:
                    current_price = current_candle[4]
                    await self.update_position(current_price)
                
                # Check for new signals only if no position
                if self.current_position is None:
                    # Check bullish engulfing
                    if self.strategy.check_bullish_engulfing(current_candle, previous_candle):
                        logger.info("Bullish engulfing pattern detected!")
                        await self.ws_manager.send_log({
                            "level": "info",
                            "message": "Bullish engulfing pattern detected",
                            "timestamp": datetime.now().isoformat()
                        })
                        await self.open_position('buy', current_candle)
                    
                    # Check bearish engulfing
                    elif self.strategy.check_bearish_engulfing(current_candle, previous_candle):
                        logger.info("Bearish engulfing pattern detected!")
                        await self.ws_manager.send_log({
                            "level": "info",
                            "message": "Bearish engulfing pattern detected",
                            "timestamp": datetime.now().isoformat()
                        })
                        await self.open_position('sell', current_candle)
                
                # Wait for next candle (2 minutes = 120 seconds)
                await asyncio.sleep(120)
                
            except Exception as e:
                logger.error(f"Error in trading loop: {e}")
                await self._notify('error', 'Trading loop error', str(e), severity='error')
                await asyncio.sleep(10)
    
    async def start(self, settings: Dict = None):
        """Start trading engine"""
        if settings:
            self.settings = settings
            if self.notification_manager:
                self.notification_manager.update_from_settings(settings.get('notifications', {}))

        # Initialize exchange
        api_keys = self.settings.get('api_keys', {})
        if not self._init_exchange(api_keys):
            await self._notify('api_disconnect', 'Failed to initialize OKX', 'Please verify API credentials', severity='error')
            raise Exception("Failed to initialize exchange")
        
        # Update strategy config
        self._update_strategy_config()
        
        # Load current position from database
        positions = get_positions()
        if positions:
            self.current_position = positions[0]
        
        self.running = True
        self.task = asyncio.create_task(self.trading_loop())
        logger.info("Trading engine started")
        await self._notify('system_event', 'Trading engine started', 'Live trading loop is running', severity='success')

    async def stop(self):
        """Stop trading engine"""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Trading engine stopped")
        await self._notify('system_event', 'Trading engine stopped', 'Trading loop halted', severity='info')
    
    async def reload_settings(self, settings: Dict):
        """Reload settings and restart if needed"""
        was_running = self.running
        if was_running:
            await self.stop()
        
        self.settings = settings
        self._update_strategy_config()

        # Reinitialize exchange if API keys changed
        api_keys = settings.get('api_keys', {})
        if api_keys:
            self._init_exchange(api_keys)

        if self.notification_manager:
            self.notification_manager.update_from_settings(settings.get('notifications', {}))

        if was_running:
            await self.start(settings)

        logger.info("Settings reloaded and applied")
    
    def is_running(self) -> bool:
        """Check if engine is running"""
        return self.running
    
    def get_status(self) -> Dict:
        """Get engine status"""
        return {
            "running": self.running,
            "has_position": self.current_position is not None,
            "position": self.current_position,
            "metrics": self.metrics
        }
    
    def get_metrics(self) -> Dict:
        """Get trading metrics"""
        return self.metrics

    async def _notify(self, event_type: str, title: str, message: str, severity: str = 'info', metadata: Optional[Dict] = None):
        """Helper to send notifications safely"""
        if not self.notification_manager:
            return
        try:
            await self.notification_manager.send_notification(event_type, title, message, severity, metadata)
        except Exception as exc:
            logger.debug(f"Notification dispatch skipped: {exc}")

