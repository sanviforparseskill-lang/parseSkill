"""GitHub OAuth (Section 8.2) — the only signup path. Exchanges the OAuth
code for a token, pulls the GitHub identity, upserts the user row, and
persists the access token so the sync worker can call the GitHub API
without re-authenticating (Section 4).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx

from app.core.config import get_settings
from app.core.security import hash_token, new_refresh_token
from app.db.client import db

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


def build_authorize_url(state: str) -> str:
    settings = get_settings()
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": settings.github_oauth_redirect_uri,
        "scope": settings.github_oauth_scopes,
        "state": state,
    }
    return f"{GITHUB_AUTHORIZE_URL}?{urlencode(params)}"


async def exchange_code_for_token(code: str) -> str:
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GITHUB_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
                "redirect_uri": settings.github_oauth_redirect_uri,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        if "access_token" not in data:
            raise ValueError(f"GitHub OAuth exchange failed: {data}")
        return data["access_token"]


async def fetch_github_user(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            GITHUB_USER_URL,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
        )
        resp.raise_for_status()
        return resp.json()


async def upsert_user_from_github(gh_user: dict, access_token: str) -> tuple[str, bool]:
    """Returns (user_id, is_new). Persists the OAuth token so the sync worker
    can call the GitHub API later without re-authenticating (Section 4)."""
    existing = await db.user.find_unique(where={"githubId": gh_user["id"]})
    if existing:
        await db.user.update(
            where={"id": existing.id},
            data={
                "githubHandle": gh_user["login"],
                "avatarUrl": gh_user.get("avatar_url"),
                "githubAccessToken": access_token,
            },
        )
        return existing.id, False

    created = await db.user.create(
        data={
            "githubId": gh_user["id"],
            "githubHandle": gh_user["login"],
            "displayName": gh_user.get("name"),
            "avatarUrl": gh_user.get("avatar_url"),
            "bio": gh_user.get("bio"),
            "location": gh_user.get("location"),
            "githubAccessToken": access_token,
        }
    )
    return created.id, True


async def create_session(user_id: str) -> str:
    """Persists a hashed refresh token and returns the raw value for the cookie."""
    settings = get_settings()
    raw, token_hash = new_refresh_token()
    await db.session.create(
        data={
            "userId": user_id,
            "tokenHash": token_hash,
            "expiresAt": datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_ttl_days),
        }
    )
    return raw


async def resolve_session(raw_token: str) -> str | None:
    """Returns the user_id for a valid, non-expired session token."""
    token_hash = hash_token(raw_token)
    session = await db.session.find_first(where={"tokenHash": token_hash})
    if not session or session.expiresAt < datetime.now(timezone.utc):
        return None
    return session.userId
