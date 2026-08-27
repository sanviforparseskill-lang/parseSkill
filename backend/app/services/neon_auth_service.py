"""Neon Auth (Stack Auth) — a second sign-in path shown alongside the
GitHub OAuth flow (Section 8.2 covers GitHub; this covers Neon Auth). We
verify the access token Neon Auth issued in the browser, upsert a user row,
and hand back a normal parseSkill session so the rest of the app never has
to know Neon Auth exists — see POST /auth/neon/session in api/v1/auth.py.

Users created this way have no GitHub identity yet (no commits to analyze),
so profile sync/scoring stays empty until they separately connect GitHub
from Settings.
"""

from __future__ import annotations

import time
from urllib.parse import urlsplit, urlunsplit

import httpx
import jwt
from jwt import PyJWK
from jwt.exceptions import InvalidTokenError

from app.core.config import get_settings
from app.db.client import db

# Neon Auth (Stack Auth) signs access tokens with EdDSA/Ed25519 (OKP), which
# python-jose (used for our own HS256 session tokens, see core/security.py)
# doesn't support at all — hence PyJWT here instead, just for this verifier.
JWTError = InvalidTokenError


def _issuer_origin(issuer_url: str) -> str:
    """Neon Auth's `iss`/`aud` claims are the bare origin (scheme + host),
    while NEON_AUTH_ISSUER_URL also carries the `/<db>/auth` path segment
    needed for JWKS discovery — strip the path so audience checks match
    what's actually embedded in issued tokens."""
    parts = urlsplit(issuer_url)
    return urlunsplit((parts.scheme, parts.netloc, "", "", ""))

_jwks_cache: dict | None = None
_jwks_cached_at: float = 0.0
_JWKS_TTL_SECONDS = 3600


async def _get_jwks() -> dict:
    global _jwks_cache, _jwks_cached_at
    if _jwks_cache is not None and (time.monotonic() - _jwks_cached_at) < _JWKS_TTL_SECONDS:
        return _jwks_cache

    settings = get_settings()
    url = f"{settings.neon_auth_issuer_url}/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_cached_at = time.monotonic()
        return _jwks_cache


def _find_key(jwks: dict, kid: str | None) -> dict | None:
    return next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)


async def verify_access_token(access_token: str) -> dict:
    """Returns the decoded claims for a valid Neon Auth access token, or
    raises jwt.exceptions.InvalidTokenError."""
    kid = jwt.get_unverified_header(access_token).get("kid")

    jwks = await _get_jwks()
    matching = _find_key(jwks, kid)
    if matching is None:
        # JWKS may have rotated — refetch once and retry before giving up.
        global _jwks_cache
        _jwks_cache = None
        jwks = await _get_jwks()
        matching = _find_key(jwks, kid)
    if matching is None:
        raise InvalidTokenError(f"No matching JWKS key for kid={kid!r}")

    settings = get_settings()
    signing_key = PyJWK.from_dict(matching)
    return jwt.decode(
        access_token,
        signing_key.key,
        algorithms=[matching.get("alg", "EdDSA")],
        audience=_issuer_origin(settings.neon_auth_issuer_url),
    )


async def upsert_user_from_neon_auth(claims: dict) -> tuple[str, bool]:
    """Returns (user_id, is_new). `claims["sub"]` is the stable Neon Auth
    (Stack Auth) user id."""
    neon_auth_user_id = claims["sub"]
    existing = await db.user.find_unique(where={"neonAuthUserId": neon_auth_user_id})
    if existing:
        return existing.id, False

    display_name = claims.get("display_name") or claims.get("name")
    email = claims.get("primary_email") or claims.get("email")
    placeholder_handle = f"neon-{neon_auth_user_id[:8]}"

    created = await db.user.create(
        data={
            "neonAuthUserId": neon_auth_user_id,
            "email": email,
            "displayName": display_name,
            "githubHandle": placeholder_handle,
        }
    )
    return created.id, True
