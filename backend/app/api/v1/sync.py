from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Request
from sse_starlette.sse import EventSourceResponse

from app.api.deps import get_current_user
from app.db import pubsub, queue
from app.db.client import db
from app.schemas.sync import SyncLogEntry, SyncStatus, SyncTriggerResponse

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/trigger", response_model=SyncTriggerResponse)
async def trigger_sync(user=Depends(get_current_user)):
    """The single entry point for data refresh (Section 4: "Update Profile").
    Enqueues a job for the worker and notifies any open SSE stream immediately
    so the browser knows the job was accepted."""
    job_id = await queue.enqueue("sync_profile", {"user_id": user.id})
    await pubsub.notify(pubsub.sync_channel(user.id), {"stage": "queued", "job_id": str(job_id)})
    return SyncTriggerResponse(job_id=str(job_id))


@router.get("/status/{job_id}", response_model=SyncStatus)
async def sync_status(job_id: str):
    job = await db.jobqueue.find_unique(where={"id": job_id})
    if not job:
        return SyncStatus(job_id=job_id, status="unknown", attempts=0)
    return SyncStatus(job_id=job_id, status=job.status, attempts=job.attempts, last_error=job.lastError)


@router.get("/stream/{job_id}")
async def sync_stream(job_id: str, request: Request, user=Depends(get_current_user)):
    """SSE stream of sync progress, driven by Postgres LISTEN on
    `user_sync:{user_id}` (Section 4 step 3)."""

    async def event_generator():
        async for payload in pubsub.subscribe(pubsub.sync_channel(user.id)):
            if await request.is_disconnected():
                break
            yield {"event": "progress", "data": json.dumps(payload)}
            if payload.get("stage") in {"done", "error"}:
                break

    return EventSourceResponse(event_generator())


@router.get("/history", response_model=list[SyncLogEntry])
async def sync_history(user=Depends(get_current_user)):
    logs = await db.synclog.find_many(
        where={"userId": user.id}, order={"startedAt": "desc"}, take=20
    )
    return [
        SyncLogEntry(
            id=log.id,
            started_at=log.startedAt,
            completed_at=log.completedAt,
            status=log.status,
            sources_synced=log.sourcesSynced,
            repos_processed=log.reposProcessed,
            new_technologies_count=log.newTechnologiesCount,
            new_skills_count=log.newSkillsCount,
            error_message=log.errorMessage,
        )
        for log in logs
    ]
