"""FastAPI web process (Section 2 / 3): `uvicorn app.main:app --reload`.

Handles HTTP + SSE traffic and starts the PostgreSQL-backed job loop in the
same process. This keeps the free-tier deployment to one Render web service.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.client import connect_db, disconnect_db
from app.db.pubsub import connect_pubsub, disconnect_pubsub
from app import worker


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await connect_db()
    await connect_pubsub()
    worker_task = asyncio.create_task(worker.run_worker())
    try:
        yield
    finally:
        worker.stop_worker()
        await worker_task
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
