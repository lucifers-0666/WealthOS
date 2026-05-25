"""
WealthOS WebSocket Manager
Handles connections, broadcasting, stale detection, reconnect safety.
"""
import asyncio
import json
import logging
from datetime import datetime
from typing import Set
from fastapi import WebSocket

logger = logging.getLogger("wealthos.ws")


class ConnectionManager:
    def __init__(self):
        self.active: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self._lock:
            self.active.add(ws)
        logger.info("WS connected. Total: %d", len(self.active))

    async def disconnect(self, ws: WebSocket):
        async with self._lock:
            self.active.discard(ws)
        logger.info("WS disconnected. Total: %d", len(self.active))

    async def broadcast(self, payload: dict):
        """Broadcast JSON payload to all connected clients. Prune dead sockets."""
        if not self.active:
            return
        message = json.dumps(payload)
        dead = set()
        async with self._lock:
            targets = set(self.active)
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        if dead:
            async with self._lock:
                self.active -= dead
            logger.info("Pruned %d dead WS connections", len(dead))

    async def send_personal(self, ws: WebSocket, payload: dict):
        try:
            await ws.send_text(json.dumps(payload))
        except Exception as e:
            logger.warning("send_personal failed: %s", e)
            await self.disconnect(ws)

    @property
    def connection_count(self) -> int:
        return len(self.active)


# Singleton
manager = ConnectionManager()
