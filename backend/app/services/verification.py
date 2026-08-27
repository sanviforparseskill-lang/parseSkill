"""Bio-token account-link ownership verification (Section 5.1): before a
platform handle is persisted onto `users`, the user must prove they control
it by placing a per-user token somewhere on their public profile.

Kaggle has no public API surface exposing free-text profile fields (its
public API is kernels/competitions/datasets listing only), so Kaggle linking
is intentionally left unverified — see the TODO in app/api/v1/profile.py.
"""

from __future__ import annotations

from app.extractor import codeforces, leetcode

_TOKEN_PREFIX = "parseskill-verify-"


def verification_token(user_id: str) -> str:
    """Deterministic, non-secret per-user token — its purpose is proving
    "I control this handle", not authentication, so it doesn't need to be
    unguessable, just unique per user."""
    return f"{_TOKEN_PREFIX}{user_id[:12]}"


async def verify_leetcode(handle: str, user_id: str) -> bool:
    about_me = await leetcode.fetch_about_me(handle)
    return bool(about_me) and verification_token(user_id) in about_me


async def verify_codeforces(handle: str, user_id: str) -> bool:
    organization = await codeforces.fetch_organization(handle)
    return bool(organization) and verification_token(user_id) in organization


_VERIFIERS = {
    "leetcode": verify_leetcode,
    "codeforces": verify_codeforces,
}


async def verify_ownership(platform: str, handle: str, user_id: str) -> bool | None:
    """Returns True/False if `platform` supports verification, None if it
    doesn't (caller should treat None as "allow, but can't confirm")."""
    verifier = _VERIFIERS.get(platform)
    if verifier is None:
        return None
    return await verifier(handle, user_id)
