"""Market data streaming and caching service."""
import asyncio
import logging
from collections import deque
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import ccxt

from backend.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)


class MarketDataService:
    """Polls OKX for candles/orderbook/trades and streams them via WebSocket."""

    def __init__(self, ws_manager: WebSocketManager, cache_size: int = 500):
        self.ws_manager = ws_manager
        self.cache_size = cache_size
        self.exchange = ccxt.okx({'enableRateLimit': True})
        self.symbol: str = 'ETH/USDT'
        self.timeframe: str = '2m'
        self._task: Optional[asyncio.Task] = None
        self._running = False
        self.candles: Dict[str, deque] = {}
        self.orderbooks: Dict[str, Dict] = {}
        self.trades: Dict[str, deque] = {}
        self.refresh_interval = 5
        self.last_push: Dict[str, datetime] = {}

    async def start(self, symbol: str, timeframe: str, interval: int = 5):
        """Start polling for the given symbol/timeframe."""
        self.symbol = symbol
        self.timeframe = timeframe
        self.refresh_interval = max(2, interval)
        if self._task and not self._task.done():
            await self.stop()
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Market data service started for %s %s", symbol, timeframe)

    async def stop(self):
        """Stop the polling task."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("Market data service stopped")

    async def update_subscription(self, symbol: str, timeframe: str):
        """Update the current subscription if settings change."""
        if symbol == self.symbol and timeframe == self.timeframe:
            return
        logger.info("Updating market data subscription to %s %s", symbol, timeframe)
        await self.start(symbol, timeframe, self.refresh_interval)

    async def _run_loop(self):
        while self._running:
            try:
                await self._poll_once()
            except Exception as exc:  # pragma: no cover - resilience loop
                logger.error("Market data poll failed: %s", exc)
            await asyncio.sleep(self.refresh_interval)

    async def _poll_once(self):
        symbol = self.symbol
        timeframe = self.timeframe
        candles = await asyncio.get_event_loop().run_in_executor(
            None, lambda: self.exchange.fetch_ohlcv(symbol, timeframe, limit=150)
        )
        if candles:
            self._store_candles(symbol, timeframe, candles)
            await self._push('market_candles', {
                'symbol': symbol,
                'timeframe': timeframe,
                'candles': candles[-self.cache_size:]
            })

        orderbook = await asyncio.get_event_loop().run_in_executor(
            None, lambda: self.exchange.fetch_order_book(symbol, limit=25)
        )
        if orderbook:
            self.orderbooks[symbol] = orderbook
            await self._push('market_orderbook', {
                'symbol': symbol,
                'bids': orderbook.get('bids', [])[:25],
                'asks': orderbook.get('asks', [])[:25],
                'timestamp': orderbook.get('timestamp')
            })

        trades = await asyncio.get_event_loop().run_in_executor(
            None, lambda: self.exchange.fetch_trades(symbol, limit=50)
        )
        if trades:
            self._store_trades(symbol, trades)
            await self._push('market_trades', {
                'symbol': symbol,
                'trades': list(self.trades[symbol])
            })

    def _store_candles(self, symbol: str, timeframe: str, candles: List[List[float]]):
        key = f"{symbol}:{timeframe}"
        cache = self.candles.setdefault(key, deque(maxlen=self.cache_size))
        cache.extend(candles)

    def _store_trades(self, symbol: str, trades: List[Dict]):
        cache = self.trades.setdefault(symbol, deque(maxlen=200))
        cache.extend(trades)

    async def _push(self, message_type: str, data: Dict):
        now = datetime.utcnow()
        last = self.last_push.get(message_type)
        if last and (now - last) < timedelta(seconds=1):
            return
        self.last_push[message_type] = now
        await self.ws_manager.broadcast({'type': message_type, 'data': data})

    def get_snapshot(self) -> Dict:
        key = f"{self.symbol}:{self.timeframe}"
        return {
            'symbol': self.symbol,
            'timeframe': self.timeframe,
            'candles': list(self.candles.get(key, []))[-self.cache_size:],
            'orderbook': self.orderbooks.get(self.symbol),
            'trades': list(self.trades.get(self.symbol, [])),
        }
