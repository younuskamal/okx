"""
Simple database layer using SQLite
"""
import sqlite3
import json
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

DB_PATH = Path("trading_system.db")

def get_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Trades table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trade_id TEXT UNIQUE NOT NULL,
            symbol TEXT NOT NULL,
            side TEXT NOT NULL,
            entry_price REAL NOT NULL,
            exit_price REAL,
            quantity REAL NOT NULL,
            pnl REAL,
            pnl_percent REAL,
            entry_time TIMESTAMP NOT NULL,
            exit_time TIMESTAMP,
            status TEXT NOT NULL,
            stop_loss REAL,
            take_profit REAL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Positions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            position_id TEXT UNIQUE NOT NULL,
            symbol TEXT NOT NULL,
            side TEXT NOT NULL,
            entry_price REAL NOT NULL,
            current_price REAL,
            quantity REAL NOT NULL,
            unrealized_pnl REAL,
            stop_loss REAL,
            take_profit REAL,
            entry_time TIMESTAMP NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Backtest results table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS backtest_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            backtest_id TEXT UNIQUE NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            symbol TEXT NOT NULL,
            timeframe TEXT NOT NULL,
            initial_balance REAL NOT NULL,
            final_balance REAL NOT NULL,
            total_trades INTEGER NOT NULL,
            winning_trades INTEGER NOT NULL,
            losing_trades INTEGER NOT NULL,
            win_rate REAL NOT NULL,
            total_profit REAL NOT NULL,
            max_drawdown REAL NOT NULL,
            profit_factor REAL,
            roi REAL NOT NULL,
            results_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()
    logger.info("Database initialized")

def get_settings() -> Optional[Dict]:
    """Get settings from database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        return None
    
    settings = {}
    for row in rows:
        try:
            settings[row['key']] = json.loads(row['value'])
        except:
            settings[row['key']] = row['value']
    
    return settings

def save_settings(settings: Dict):
    """Save settings to database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    for key, value in settings.items():
        value_str = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
        cursor.execute("""
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
        """, (key, value_str, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()

def save_trade(trade: Dict):
    """Save trade to database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT OR REPLACE INTO trades (
            trade_id, symbol, side, entry_price, exit_price, quantity,
            pnl, pnl_percent, entry_time, exit_time, status, stop_loss,
            take_profit, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        trade.get('trade_id'),
        trade.get('symbol'),
        trade.get('side'),
        trade.get('entry_price'),
        trade.get('exit_price'),
        trade.get('quantity'),
        trade.get('pnl'),
        trade.get('pnl_percent'),
        trade.get('entry_time'),
        trade.get('exit_time'),
        trade.get('status'),
        trade.get('stop_loss'),
        trade.get('take_profit'),
        trade.get('reason')
    ))
    
    conn.commit()
    conn.close()

def get_trades(limit: int = 100, offset: int = 0) -> List[Dict]:
    """Get trades from database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM trades
        ORDER BY entry_time DESC
        LIMIT ? OFFSET ?
    """, (limit, offset))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def save_position(position: Dict):
    """Save position to database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT OR REPLACE INTO positions (
            position_id, symbol, side, entry_price, current_price, quantity,
            unrealized_pnl, stop_loss, take_profit, entry_time, status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        position.get('position_id'),
        position.get('symbol'),
        position.get('side'),
        position.get('entry_price'),
        position.get('current_price'),
        position.get('quantity'),
        position.get('unrealized_pnl'),
        position.get('stop_loss'),
        position.get('take_profit'),
        position.get('entry_time'),
        position.get('status'),
        datetime.now().isoformat()
    ))
    
    conn.commit()
    conn.close()

def update_position(position_id: str, updates: Dict):
    """Update position in database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values()) + [position_id]
    
    cursor.execute(f"""
        UPDATE positions
        SET {set_clause}, updated_at = ?
        WHERE position_id = ?
    """, values + [datetime.now().isoformat()])
    
    conn.commit()
    conn.close()

def get_positions() -> List[Dict]:
    """Get active positions from database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM positions
        WHERE status = 'open'
        ORDER BY entry_time DESC
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


