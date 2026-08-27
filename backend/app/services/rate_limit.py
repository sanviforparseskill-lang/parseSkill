"""Sliding-window rate limiting on `rate_limit_counters` (Section 2 / 11).

Bucketed by minute: `window_start` is truncated to the minute, so a check
is a single upsert-and-read against a small, indexed row set rather than a
separate service. Good enough for the per-user limits in this app (30
chat messages/hour, sync triggers, etc).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.db.client import db


async def check_and_increment(user_id: str, action: str, *, limit: int, window_minutes: int) -> bool:
    """Returns True if the request is allowed (and records it), False if over limit."""
    now = datetime.now(timezone.utc)
    window_start = now.replace(second=0, microsecond=0)
    cutoff = now - timedelta(minutes=window_minutes)

    rows = await db.query_raw(
        """
        SELECT COALESCE(SUM(count), 0) AS total
        FROM rate_limit_counters
        WHERE user_id = $1::uuid AND action = $2 AND window_start >= $3::timestamptz
        """,
        user_id,
        action,
        cutoff,
    )
    total = rows[0]["total"] if rows else 0
    if total >= limit:
        return False

    await db.execute_raw(
        """
        INSERT INTO rate_limit_counters (user_id, action, window_start, count)
        VALUES ($1::uuid, $2, $3::timestamptz, 1)
        ON CONFLICT (user_id, action, window_start)
        DO UPDATE SET count = rate_limit_counters.count + 1
        """,
        user_id,
        action,
        window_start,
    )
    return True
