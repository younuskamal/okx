"""Notification manager for multi-channel alerts."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, Optional
import smtplib
import ssl

import requests

from backend.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)


class NotificationManager:
    """Dispatches alerts to Telegram, email, webhooks, and the dashboard."""

    def __init__(self, ws_manager: Optional[WebSocketManager] = None):
        self.ws_manager = ws_manager
        self.config: Dict[str, Any] = self._default_config()

    def _default_config(self) -> Dict[str, Any]:
        return {
            "enabled": True,
            "channels": {
                "desktop": {"enabled": True},
                "telegram": {
                    "enabled": False,
                    "bot_token": "",
                    "chat_id": ""
                },
                "email": {
                    "enabled": False,
                    "smtp_host": "",
                    "smtp_port": 587,
                    "username": "",
                    "password": "",
                    "from_address": "",
                    "to_addresses": "",
                    "use_tls": True
                },
                "webhook": {
                    "enabled": False,
                    "url": "",
                    "headers": {}
                }
            },
            "events": {
                "trade_opened": True,
                "trade_closed": True,
                "stop_loss": True,
                "take_profit": True,
                "error": True,
                "api_disconnect": True,
                "margin_issue": True,
                "system_event": True,
                "backtest_completed": True,
                "optimizer_completed": True
            }
        }

    def update_from_settings(self, settings: Optional[Dict[str, Any]]):
        """Merge notification settings into runtime configuration."""
        merged = self._default_config()
        if settings:
            merged = self._deep_merge(merged, settings)
        self.config = merged
        logger.info("Notification settings refreshed")

    def _deep_merge(self, base: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
        result = base.copy()
        for key, value in updates.items():
            if isinstance(value, dict) and isinstance(result.get(key), dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        return result

    async def send_notification(
        self,
        event_type: str,
        title: str,
        message: str,
        severity: str = "info",
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Send a notification to the enabled channels."""
        if not self.config.get("enabled", True):
            return

        if not self.config.get("events", {}).get(event_type, True):
            return

        payload = {
            "event_type": event_type,
            "title": title,
            "message": message,
            "severity": severity,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        }

        tasks = []

        if self.ws_manager and self.config["channels"].get("desktop", {}).get("enabled", True):
            tasks.append(self.ws_manager.broadcast({
                "type": "notification",
                "data": payload
            }))

        if self.config["channels"].get("telegram", {}).get("enabled"):
            tasks.append(self._send_telegram(payload))

        if self.config["channels"].get("email", {}).get("enabled"):
            tasks.append(self._send_email(payload))

        if self.config["channels"].get("webhook", {}).get("enabled"):
            tasks.append(self._send_webhook(payload))

        if tasks:
            await asyncio.gather(*[self._shield(task) for task in tasks], return_exceptions=True)

    async def _shield(self, task):
        try:
            await task
        except Exception as exc:  # pragma: no cover
            logger.error("Notification dispatch error: %s", exc)

    async def _send_telegram(self, payload: Dict[str, Any]):
        config = self.config["channels"]["telegram"]
        token = config.get("bot_token")
        chat_id = config.get("chat_id")
        if not token or not chat_id:
            return

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        body = {
            "chat_id": chat_id,
            "text": f"{payload['title']}\n{payload['message']}",
            "parse_mode": "HTML"
        }
        await asyncio.to_thread(requests.post, url, json=body, timeout=10)

    async def _send_webhook(self, payload: Dict[str, Any]):
        config = self.config["channels"]["webhook"]
        url = config.get("url")
        if not url:
            return
        headers = config.get("headers") or {}
        await asyncio.to_thread(requests.post, url, json=payload, headers=headers, timeout=10)

    async def _send_email(self, payload: Dict[str, Any]):
        config = self.config["channels"]["email"]
        host = config.get("smtp_host")
        port = config.get("smtp_port", 587)
        username = config.get("username")
        password = config.get("password")
        from_address = config.get("from_address")
        to_addresses = config.get("to_addresses", "")

        if not (host and port and from_address and to_addresses):
            return

        recipients = [addr.strip() for addr in to_addresses.split(',') if addr.strip()]
        if not recipients:
            return

        msg = MIMEMultipart()
        msg['From'] = from_address
        msg['To'] = ', '.join(recipients)
        msg['Subject'] = payload['title']
        msg.attach(MIMEText(payload['message'], 'plain'))

        def send_email():
            context = ssl.create_default_context()
            with smtplib.SMTP(host, port, timeout=20) as server:
                if config.get("use_tls", True):
                    server.starttls(context=context)
                if username and password:
                    server.login(username, password)
                server.sendmail(from_address, recipients, msg.as_string())

        await asyncio.to_thread(send_email)
