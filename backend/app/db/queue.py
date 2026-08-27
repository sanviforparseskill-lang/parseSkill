"""Postgres-backed job queue — replaces Celery + Redis (Section 2 / 11).

Consumed with `SELECT ... FOR UPDATE SKIP LOCKED` so multiple workers (or a
restarted worker) never double-process a row. Prisma's query builder can't
express `FOR UPDATE SKIP LOCKED` or a transactional claim, so this goes
through raw SQL on the same Prisma connection pool.
"""

from __future__ import annotations

import os
import socket
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from prisma import Json

from app.db.client import db

_WORKER_ID = f"{socket.gethostname()}:{os.getpid()}"

STALE_LOCK_MINUTES = 10


async def enqueue(job_type: str, payload: dict[str, Any], *, priority: int = 0, run_after: datetime | None = None) -> UUID:
    row = await db.jobqueue.create(
        data={
            "jobType": job_type,
            "payload": Json(payload),
            "priority": priority,
            "runAfter": run_after or datetime.now(timezone.utc),
        }
    )
    return UUID(row.id)


async def claim_next_job() -> dict[str, Any] | None:
    """Atomically claim one pending, due job. Returns None if the queue is empty."""
    async with db.tx() as tx:
        rows = await tx.query_raw(
            """
            SELECT id, job_type, payload, attempts
            FROM job_queue
            WHERE status = 'pending' AND run_after <= now()
            ORDER BY priority DESC, created_at
            FOR UPDATE SKIP LOCKED
            LIMIT 1
            """
        )
        if not rows:
            return None
        job = rows[0]
        await tx.execute_raw(
            """
            UPDATE job_queue
            SET status = 'running', locked_by = $1, locked_at = now(), attempts = attempts + 1
            WHERE id = $2::uuid
            """,
            _WORKER_ID,
            job["id"],
        )
        return job


async def mark_done(job_id: str) -> None:
    await db.jobqueue.update(
        where={"id": job_id},
        data={"status": "done", "completedAt": datetime.now(timezone.utc)},
    )


async def mark_failed(job_id: str, error: str, *, max_attempts: int = 3) -> None:
    job = await db.jobqueue.find_unique(where={"id": job_id})
    if job and job.attempts >= (job.maxAttempts or max_attempts):
        await db.jobqueue.update(where={"id": job_id}, data={"status": "failed", "lastError": error})
    else:
        # Leave pending for a retry with backoff instead of burning the slot on 'failed'.
        await db.jobqueue.update(
            where={"id": job_id},
            data={
                "status": "pending",
                "lastError": error,
                "runAfter": datetime.now(timezone.utc) + timedelta(seconds=30),
            },
        )


async def reset_stale_locks() -> int:
    """Janitor sweep (APScheduler, every minute in the worker): un-stick jobs whose
    worker crashed mid-run instead of releasing the lock."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=STALE_LOCK_MINUTES)
    result = await db.execute_raw(
        "UPDATE job_queue SET status = 'pending', locked_by = NULL, locked_at = NULL "
        "WHERE status = 'running' AND locked_at < $1::timestamptz",
        cutoff,
    )
    return result
