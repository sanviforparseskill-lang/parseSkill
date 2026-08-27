from datetime import datetime

from pydantic import BaseModel


class SyncTriggerResponse(BaseModel):
    job_id: str


class SyncStatus(BaseModel):
    job_id: str
    status: str  # pending | running | done | failed
    attempts: int
    last_error: str | None = None


class SyncLogEntry(BaseModel):
    id: str
    started_at: datetime
    completed_at: datetime | None
    status: str
    sources_synced: list[str]
    repos_processed: int
    new_technologies_count: int
    new_skills_count: int
    error_message: str | None = None


class SyncProgressEvent(BaseModel):
    stage: str  # queued | fetching | extracting | scoring | done | error
    message: str | None = None
    new_skills: int | None = None
    new_tech: int | None = None
