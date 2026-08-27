"""Cache on `cache_entries` (UNLOGGED table) — replaces Redis for hot data
that tolerates being lost on crash (Section 2 / 11), e.g. throttled
LeetCode/Codeforces/Kaggle responses. A process-local `functools.lru_cache`
sits in front of this for the hottest keys within a single worker run.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from prisma import Json

from app.db.client import db


async def get(key: str) -> Any | None:
    row = await db.cacheentry.find_unique(where={"key": key})
    if not row or row.expiresAt < datetime.now(timezone.utc):
        return None
    return row.valueJson


async def set(key: str, value: Any, *, ttl_seconds: int) -> None:
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
    await db.cacheentry.upsert(
        where={"key": key},
        data={
            "create": {"key": key, "valueJson": Json(value), "expiresAt": expires_at},
            "update": {"valueJson": Json(value), "expiresAt": expires_at},
        },
    )


async def purge_expired() -> int:
    return await db.cacheentry.delete_many(where={"expiresAt": {"lt": datetime.now(timezone.utc)}})
