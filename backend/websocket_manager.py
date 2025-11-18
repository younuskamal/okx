"""
WebSocket Manager for real-time updates
"""
from fastapi import WebSocket
from typing import List, Dict
import json
import asyncio
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: Dict, websocket: WebSocket):
        """Send message to specific connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: Dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_trade_update(self, trade: Dict):
        """Send trade update"""
        await self.broadcast({
            "type": "trade_update",
            "data": trade
        })
    
    async def send_position_update(self, position: Dict):
        """Send position update"""
        await self.broadcast({
            "type": "position_update",
            "data": position
        })
    
    async def send_metrics_update(self, metrics: Dict):
        """Send metrics update"""
        await self.broadcast({
            "type": "metrics_update",
            "data": metrics
        })
    
    async def send_log(self, log_entry: Dict):
        """Send log entry"""
        await self.broadcast({
            "type": "log",
            "data": log_entry
        })
    
    async def send_backtest_update(self, update: Dict):
        """Send backtest update"""
        await self.broadcast({
            "type": "backtest_update",
            "data": update
        })


