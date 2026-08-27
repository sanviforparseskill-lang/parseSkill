"""FastAPI web process (Section 2 / 3): `uvicorn app.main:app --reload`.

Handles all HTTP + SSE traffic. Never runs sync/inference/ML work itself —
it only enqueues jobs onto `job_queue` for the worker process (app/worker.py)
to pick up. See Section 3's "Two Python processes, one database" diagram.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.client import connect_db, disconnect_db
from app.db.pubsub import connect_pubsub, disconnect_pubsub


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await connect_db()
    await connect_pubsub()
    try:
        yield
    finally:
        await disconnect_pubsub()
        await disconnect_db()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="parseSkill API", version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    @app.get("/healthz")
    async def healthz():
        return {"status": "ok"}

    return app


app = create_app()
