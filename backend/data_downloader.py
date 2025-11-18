"""
Automatic Historical Data Downloader for Backtesting
"""
import ccxt
import sqlite3
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import asyncio
from backend.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)

class DataDownloader:
    """Downloads and caches historical OHLCV data"""
    
    def __init__(self, db_path: str = "trading_data.db", ws_manager: Optional[WebSocketManager] = None):
        self.db_path = Path(db_path)
        self.ws_manager = ws_manager
        self.exchange = ccxt.okx({'enableRateLimit': True})
        self.init_database()
    
    def init_database(self):
        """Initialize data storage database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # OHLCV data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ohlcv_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                open REAL NOT NULL,
                high REAL NOT NULL,
                low REAL NOT NULL,
                close REAL NOT NULL,
                volume REAL NOT NULL,
                UNIQUE(symbol, timeframe, timestamp)
            )
        """)
        
        # Dataset metadata table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dataset_metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                total_candles INTEGER NOT NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(symbol, timeframe)
            )
        """)
        
        # Create indexes for fast queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_ohlcv_lookup 
            ON ohlcv_data(symbol, timeframe, timestamp)
        """)
        
        conn.commit()
        conn.close()
        logger.info("Data database initialized")
    
    def _normalize_timeframe(self, timeframe: str) -> str:
        """Normalize timeframe to OKX format"""
        # OKX uses specific timeframe formats
        # Convert common formats to OKX format
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
    
    async def download_historical_data(
        self,
        symbol: str = "ETH/USDT",
        timeframe: str = "2m",
        days: int = 365,
        progress_callback=None
    ) -> Dict:
        """Download historical OHLCV data"""
        # Normalize timeframe for OKX
        okx_timeframe = self._normalize_timeframe(timeframe)
        logger.info(f"Starting data download: {symbol} {okx_timeframe} (requested: {timeframe}) for {days} days")
        
        if self.ws_manager:
            await self.ws_manager.send_backtest_update({
                "type": "data_download",
                "status": "starting",
                "message": f"Downloading {symbol} {okx_timeframe} data..."
            })
        
        # Calculate date range
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days)
        
        since = int(start_time.timestamp() * 1000)
        end_timestamp = int(end_time.timestamp() * 1000)
        
        all_candles = []
        total_expected = 0
        limit = 100
        
        # First, check what we already have
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT MIN(timestamp), MAX(timestamp), COUNT(*) 
            FROM ohlcv_data 
            WHERE symbol = ? AND timeframe = ?
        """, (symbol, timeframe))
        existing = cursor.fetchone()
        conn.close()
        
        if existing and existing[0] and existing[1]:
            existing_start = existing[0]
            existing_end = existing[1]
            existing_count = existing[2]
            
            # Only download missing data
            if since < existing_start:
                # Need to download older data
                logger.info(f"Downloading older data: {since} to {existing_start}")
            if end_timestamp > existing_end:
                # Need to download newer data
                logger.info(f"Downloading newer data: {existing_end} to {end_timestamp}")
                since = existing_end + 1
        else:
            logger.info("No existing data found, downloading full range")
        
        # Download data
        while since < end_timestamp:
            try:
                # Use OKX normalized timeframe
                candles = self.exchange.fetch_ohlcv(
                    symbol,
                    okx_timeframe,
                    since=since,
                    limit=limit
                )
                
                if not candles:
                    break
                
                # Filter candles within range
                filtered = [c for c in candles if c[0] <= end_timestamp]
                all_candles.extend(filtered)
                
                if candles[-1][0] >= end_timestamp:
                    break
                
                since = candles[-1][0] + 1
                
                # Progress update
                progress = ((since - int(start_time.timestamp() * 1000)) / 
                           (end_timestamp - int(start_time.timestamp() * 1000))) * 100
                progress = min(100, max(0, progress))
                
                if self.ws_manager:
                    await self.ws_manager.send_backtest_update({
                        "type": "data_download",
                        "status": "downloading",
                        "progress": progress,
                        "candles_downloaded": len(all_candles),
                        "message": f"Downloaded {len(all_candles)} candles..."
                    })
                
                if progress_callback:
                    progress_callback(progress, len(all_candles))
                
                # Rate limiting
                await asyncio.sleep(self.exchange.rateLimit / 1000)
                
            except Exception as e:
                logger.error(f"Error downloading data: {e}")
                if self.ws_manager:
                    await self.ws_manager.send_backtest_update({
                        "type": "data_download",
                        "status": "error",
                        "message": str(e)
                    })
                break
        
        # Store in database (use original timeframe for storage)
        if all_candles:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            stored = 0
            for candle in all_candles:
                try:
                    cursor.execute("""
                        INSERT OR REPLACE INTO ohlcv_data
                        (symbol, timeframe, timestamp, open, high, low, close, volume)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (symbol, timeframe, candle[0], candle[1], candle[2], 
                          candle[3], candle[4], candle[5]))
                    stored += 1
                except Exception as e:
                    logger.error(f"Error storing candle: {e}")
            
            # Update metadata (store both original and OKX timeframe)
            cursor.execute("""
                INSERT OR REPLACE INTO dataset_metadata
                (symbol, timeframe, start_date, end_date, total_candles, last_updated)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                symbol,
                timeframe,  # Store original timeframe
                datetime.fromtimestamp(all_candles[0][0] / 1000).isoformat(),
                datetime.fromtimestamp(all_candles[-1][0] / 1000).isoformat(),
                stored,
                datetime.now().isoformat()
            ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Stored {stored} candles in database")
        
        result = {
            "symbol": symbol,
            "timeframe": timeframe,
            "okx_timeframe": okx_timeframe,
            "total_candles": len(all_candles),
            "start_date": datetime.fromtimestamp(all_candles[0][0] / 1000).isoformat() if all_candles else None,
            "end_date": datetime.fromtimestamp(all_candles[-1][0] / 1000).isoformat() if all_candles else None,
            "status": "completed",
            "note": f"OKX doesn't support {timeframe}, used {okx_timeframe} instead" if timeframe != okx_timeframe else None
        }
        
        if self.ws_manager:
            await self.ws_manager.send_backtest_update({
                "type": "data_download",
                "status": "completed",
                "result": result
            })
        
        return result
    
    def get_available_datasets(self) -> List[Dict]:
        """Get list of available datasets"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT symbol, timeframe, start_date, end_date, 
                   total_candles, last_updated
            FROM dataset_metadata
            ORDER BY last_updated DESC
        """)
        
        datasets = []
        for row in cursor.fetchall():
            datasets.append({
                "symbol": row[0],
                "timeframe": row[1],
                "start_date": row[2],
                "end_date": row[3],
                "total_candles": row[4],
                "last_updated": row[5]
            })
        
        conn.close()
        return datasets
    
    def get_ohlcv_data(
        self,
        symbol: str,
        timeframe: str,
        start_date: str,
        end_date: str
    ) -> List[List[float]]:
        """Get OHLCV data from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        start_ts = int(datetime.fromisoformat(start_date.replace('Z', '+00:00')).timestamp() * 1000)
        end_ts = int(datetime.fromisoformat(end_date.replace('Z', '+00:00')).timestamp() * 1000)
        
        cursor.execute("""
            SELECT timestamp, open, high, low, close, volume
            FROM ohlcv_data
            WHERE symbol = ? AND timeframe = ? 
            AND timestamp >= ? AND timestamp <= ?
            ORDER BY timestamp ASC
        """, (symbol, timeframe, start_ts, end_ts))
        
        candles = []
        for row in cursor.fetchall():
            candles.append([row[0], row[1], row[2], row[3], row[4], row[5]])
        
        conn.close()
        return candles

