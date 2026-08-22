"""
WebSocket Broadcaster Service for WealthOS
"""
import logging
from typing import Dict, Set

logger = logging.getLogger("wealthos.ws_broadcaster")

# Active WebSocket connections store
ACTIVE_CONNECTIONS: Dict[str, Set] = {}

def get_connection_count() -> int:
    """Returns the current number of active WebSocket client connections."""
    return sum(len(conns) for conns in ACTIVE_CONNECTIONS.values())
