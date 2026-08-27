"""LeetCode extractor (Section 4): unofficial GraphQL endpoint, throttled to
1 req/2s and cached for 6h via app/services/cache.py to stay under their bot
detection (Section 4 rate-limit strategy). The GraphQL query shape below is
the commonly-used community endpoint; it is not an official/stable API and
may need adjustment if LeetCode changes their schema.
"""

from __future__ import annotations

import asyncio

import httpx

from app.services import cache

_ENDPOINT = "https://leetcode.com/graphql"
_THROTTLE_SECONDS = 2
_CACHE_TTL_SECONDS = 6 * 3600

_PROFILE_QUERY = """
query userProfile($username: String!) {
  matchedUser(username: $username) {
    submitStatsGlobal {
      acSubmissionNum { difficulty count }
    }
    profile { ranking }
  }
  userContestRanking(username: $username) {
    rating
    attendedContestsCount
  }
}
"""


_HEATMAP_QUERY = """
query userHeatmapAndTags($username: String!) {
  matchedUser(username: $username) {
    submissionCalendar
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
  }
}
"""

_ABOUT_QUERY = """
query userAbout($username: String!) {
  matchedUser(username: $username) {
    profile { aboutMe }
  }
}
"""


async def fetch_profile(handle: str) -> dict | None:
    cache_key = f"leetcode:{handle}"
    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    await asyncio.sleep(_THROTTLE_SECONDS)
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(_ENDPOINT, json={"query": _PROFILE_QUERY, "variables": {"username": handle}})
        if resp.status_code != 200:
            return None
        data = resp.json().get("data")
        if not data:
            return None

    await asyncio.sleep(_THROTTLE_SECONDS)
    async with httpx.AsyncClient(timeout=20.0) as client:
        heatmap_resp = await client.post(_ENDPOINT, json={"query": _HEATMAP_QUERY, "variables": {"username": handle}})
        if heatmap_resp.status_code == 200:
            heatmap_data = heatmap_resp.json().get("data", {}).get("matchedUser") or {}
            data["submissionCalendar"] = heatmap_data.get("submissionCalendar")
            data["tagProblemCounts"] = heatmap_data.get("tagProblemCounts")

    await cache.set(cache_key, data, ttl_seconds=_CACHE_TTL_SECONDS)
    return data


async def fetch_about_me(handle: str) -> str | None:
    """Used for bio-token account-link verification (Section 5.1) — a
    lightweight query separate from `fetch_profile` so verification doesn't
    go through the profile cache (a stale cached profile could hide a token
    the user just added)."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(_ENDPOINT, json={"query": _ABOUT_QUERY, "variables": {"username": handle}})
        if resp.status_code != 200:
            return None
        matched = resp.json().get("data", {}).get("matchedUser")
        if not matched:
            return None
        return (matched.get("profile") or {}).get("aboutMe")
