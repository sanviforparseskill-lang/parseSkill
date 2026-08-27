"""Postgres LISTEN/NOTIFY fan-out for SSE (Section 2 / 10).

Prisma has no LISTEN/NOTIFY support, so this holds its own asyncpg
connection dedicated to pub/sub, separate from Prisma's pool used for
CRUD. One connection is enough: asyncpg lets many channel listeners share
it, and payloads are kept under the 8KB NOTIFY limit by only ever sending
small JSON envelopes (status + counts), never full rows.
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from typing import Any

import asyncpg

from app.core.config import get_settings

_listen_conn: asyncpg.Connection | None = None
_notify_conn: asyncpg.Connection | None = None
_subscribers: dict[str, list[asyncio.Queue]] = {}


async def connect_pubsub() -> None:
    global _listen_conn, _notify_conn
    settings = get_settings()
    dsn = settings.direct_url or settings.database_url
    _listen_conn = await asyncpg.connect(dsn)
    _notify_conn = await asyncpg.connect(dsn)


async def disconnect_pubsub() -> None:
    global _listen_conn, _notify_conn
    if _listen_conn:
        await _listen_conn.close()
        _listen_conn = None
    if _notify_conn:
        await _notify_conn.close()
        _notify_conn = None


async def notify(channel: str, payload: dict[str, Any]) -> None:
    assert _notify_conn is not None, "pubsub not connected"
    await _notify_conn.execute("SELECT pg_notify($1, $2)", channel, json.dumps(payload))


async def subscribe(channel: str) -> AsyncIterator[dict[str, Any]]:
    """Yield NOTIFY payloads for `channel` until the caller stops iterating
    (e.g. the client disconnects the SSE stream)."""
    assert _listen_conn is not None, "pubsub not connected"
    queue: asyncio.Queue = asyncio.Queue()
    _subscribers.setdefault(channel, []).append(queue)

    def _on_notify(_conn, _pid, _channel, payload: str) -> None:
        queue.put_nowait(json.loads(payload))

    await _listen_conn.add_listener(channel, _on_notify)
    try:
        while True:
            payload = await queue.get()
            yield payload
    finally:
        await _listen_conn.remove_listener(channel, _on_notify)
        _subscribers[channel].remove(queue)


def sync_channel(user_id: str) -> str:
    return f"user_sync:{user_id}"


def chat_channel(user_id: str) -> str:
    return f"user_chat:{user_id}"
