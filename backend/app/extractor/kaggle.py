"""Kaggle extractor (Section 4): public API, ~200 req/hour, cached
aggressively. Requires KAGGLE_USERNAME/KAGGLE_KEY (the same credentials
used by the `kaggle` CLI)."""

from __future__ import annotations

import httpx

from app.core.config import get_settings
from app.services import cache

_BASE = "https://www.kaggle.com/api/v1"
_CACHE_TTL_SECONDS = 6 * 3600


async def fetch_profile(handle: str) -> dict | None:
    settings = get_settings()
    if not settings.kaggle_username or not settings.kaggle_key:
        return None

    cache_key = f"kaggle:{handle}"
    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    # Kaggle's public API has no single "user profile" endpoint with medal
    # counts (that data only lives on the profile HTML page, which scraping
    # would be fragile/ToS-risky to depend on) — so this aggregates what the
    # documented API *does* expose per-user: kernels and datasets, filtered
    # by `user` and combined client-side (Section 4).
    async with httpx.AsyncClient(auth=(settings.kaggle_username, settings.kaggle_key), timeout=20.0) as client:
        kernels_resp = await client.get(f"{_BASE}/kernels/list", params={"user": handle, "pageSize": 100})
        kernels = kernels_resp.json() if kernels_resp.status_code == 200 else []

        datasets_resp = await client.get(f"{_BASE}/datasets/list", params={"user": handle, "pageSize": 100})
        datasets = datasets_resp.json() if datasets_resp.status_code == 200 else []

    if kernels_resp.status_code != 200 and datasets_resp.status_code != 200:
        return None

    medal_counts: dict[str, int] = {"gold": 0, "silver": 0, "bronze": 0}
    for k in kernels:
        medal = (k.get("medal") or "").lower()
        if medal in medal_counts:
            medal_counts[medal] += 1

    result = {
        "kernels_published": len(kernels),
        "kernel_languages": sorted({k.get("language") for k in kernels if k.get("language")}),
        "kernel_total_votes": sum(k.get("totalVotes", 0) or 0 for k in kernels),
        "kernel_medals": medal_counts,
        "datasets_published": len(datasets),
        "dataset_total_votes": sum(d.get("voteCount", 0) or 0 for d in datasets),
    }
    await cache.set(cache_key, result, ttl_seconds=_CACHE_TTL_SECONDS)
    return result
