"""The worker loop (Section 2 / 3): `python -m app.worker`.

Polls `job_queue` with `FOR UPDATE SKIP LOCKED`, dispatches to the handler
for the job's `job_type`, and runs the APScheduler-based janitor (stale
lock reset) and nightly PageRank job in-process — no Celery, no separate
scheduler service (Section 2: "Scheduler: APScheduler (in-process)").
"""

from __future__ import annotations

import asyncio
import logging
import signal

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.db import pubsub, queue
from app.db.client import connect_db, disconnect_db
from app.jobs import assistant_reply, nightly_pagerank, sync_profile
from app.services.cache import purge_expired

logging.basicConfig(level=logging.INFO, format="%(asctime)s worker %(levelname)s %(message)s")
logger = logging.getLogger("worker")

POLL_INTERVAL_SECONDS = 1.0

_HANDLERS = {
    "sync_profile": sync_profile.run,
    "assistant_reply": assistant_reply.run,
    "nightly_pagerank": nightly_pagerank.run,
}

_shutdown = asyncio.Event()


def stop_worker() -> None:
    _shutdown.set()


async def _process_one() -> bool:
    job = await queue.claim_next_job()
    if not job:
        return False

    handler = _HANDLERS.get(job["job_type"])
    if not handler:
        await queue.mark_failed(job["id"], f"No handler registered for job_type={job['job_type']!r}")
        return True

    try:
        await handler(job["payload"] | {"job_id": job["id"]})
        await queue.mark_done(job["id"])
    except Exception as exc:  # noqa: BLE001 — isolate one bad job from the poll loop
        logger.exception("Job %s (%s) failed", job["id"], job["job_type"])
        await queue.mark_failed(job["id"], str(exc))
    return True


async def _poll_loop() -> None:
    while not _shutdown.is_set():
        processed = await _process_one()
        if not processed:
            await asyncio.sleep(POLL_INTERVAL_SECONDS)


def _build_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(queue.reset_stale_locks, IntervalTrigger(minutes=1), id="reset_stale_locks")
    scheduler.add_job(purge_expired, IntervalTrigger(minutes=5), id="purge_expired_cache")
    scheduler.add_job(
        lambda: queue.enqueue("nightly_pagerank", {}),
        CronTrigger(hour=3, minute=0),
        id="enqueue_nightly_pagerank",
    )
    return scheduler


async def main() -> None:
    scheduler = _build_scheduler()
    scheduler.start()
    logger.info("Worker started, polling job_queue every %.1fs", POLL_INTERVAL_SECONDS)
    try:
        await _poll_loop()
    finally:
        scheduler.shutdown(wait=False)


async def run_worker() -> None:
    """Run the worker inside an already-connected FastAPI process."""
    await main()


async def main_process() -> None:
    await connect_db()
    await pubsub.connect_pubsub()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _shutdown.set)
        except NotImplementedError:
            pass  # Windows: signal handlers on the event loop aren't supported; Ctrl+C still raises KeyboardInterrupt.

    try:
        await main()
    finally:
        await pubsub.disconnect_pubsub()
        await disconnect_db()


if __name__ == "__main__":
    try:
        asyncio.run(main_process())
    except KeyboardInterrupt:
        pass
