"""Codeforces extractor (Section 4): official REST API, no auth, throttled
to 1 req/2s per IP as documented by Codeforces."""

from __future__ import annotations

import asyncio

import httpx

_BASE = "https://codeforces.com/api"
_THROTTLE_SECONDS = 2


async def fetch_profile(handle: str) -> dict | None:
    async with httpx.AsyncClient(timeout=20.0) as client:
        info_resp = await client.get(f"{_BASE}/user.info", params={"handles": handle})
        if info_resp.status_code != 200 or info_resp.json().get("status") != "OK":
            return None
        info = info_resp.json()["result"][0]

        await asyncio.sleep(_THROTTLE_SECONDS)
        rating_resp = await client.get(f"{_BASE}/user.rating", params={"handle": handle})
        rating_history = rating_resp.json().get("result", []) if rating_resp.status_code == 200 else []

    return {
        "handle": info.get("handle"),
        "rating": info.get("rating"),
        "max_rating": info.get("maxRating"),
        "contest_count": len(rating_history),
        "rating_history": rating_history,
    }


async def fetch_organization(handle: str) -> str | None:
    """Used for bio-token account-link verification (Section 5.1). Codeforces
    has no free-text "bio" field in its public API — `organization` is the
    only user-editable free-text field exposed by user.info, so verification
    asks the user to temporarily set it to their token."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(f"{_BASE}/user.info", params={"handles": handle})
        if resp.status_code != 200 or resp.json().get("status") != "OK":
            return None
        return resp.json()["result"][0].get("organization")
