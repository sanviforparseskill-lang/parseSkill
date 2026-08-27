from __future__ import annotations

import secrets

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.security import create_access_token
from app.schemas.auth import CurrentUser
from app.services import auth_service, neon_auth_service
from app.services.neon_auth_service import JWTError

router = APIRouter(prefix="/auth", tags=["auth"])

_STATE_COOKIE = "ps_oauth_state"


@router.get("/signin/github")
async def signin_github():
    state = secrets.token_urlsafe(24)
    redirect = RedirectResponse(auth_service.build_authorize_url(state))
    redirect.set_cookie(_STATE_COOKIE, state, httponly=True, max_age=600, samesite="lax")
    return redirect


@router.get("/callback/github")
async def github_callback(
    code: str,
    state: str,
    ps_oauth_state: str | None = Cookie(default=None),
):
    if not ps_oauth_state or ps_oauth_state != state:
        raise HTTPException(status_code=400, detail="OAuth state mismatch")

    settings = get_settings()
    access_token = await auth_service.exchange_code_for_token(code)
    gh_user = await auth_service.fetch_github_user(access_token)
    user_id, is_new = await auth_service.upsert_user_from_github(gh_user, access_token)

    refresh_token = await auth_service.create_session(user_id)
    jwt_token = create_access_token(user_id)

    redirect = RedirectResponse(f"{settings.frontend_url}/{'onboarding' if is_new else 'dashboard'}")
    redirect.delete_cookie(_STATE_COOKIE)
    redirect.set_cookie(
        settings.session_cookie_name,
        refresh_token,
        httponly=True,
        max_age=settings.refresh_token_ttl_days * 86400,
        samesite="lax",
        secure=settings.is_production,
    )
    redirect.set_cookie(
        "ps_access",
        jwt_token,
        httponly=True,
        max_age=settings.access_token_ttl_minutes * 60,
        samesite="lax",
        secure=settings.is_production,
    )
    return redirect


class NeonSessionRequest(BaseModel):
    access_token: str


@router.post("/neon/session")
async def neon_session(body: NeonSessionRequest, response: Response):
    """Second sign-in path (Neon Auth / Stack Auth), called by the frontend
    right after it completes sign-in with the Neon Auth widget — see
    frontend/src/routes/handler.$.tsx. Mints the same ps_access /
    ps_session cookies the GitHub OAuth callback does, so the rest of the
    app doesn't need to know which path the user came in through."""
    settings = get_settings()
    try:
        claims = await neon_auth_service.verify_access_token(body.access_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid Neon Auth access token")

    user_id, is_new = await neon_auth_service.upsert_user_from_neon_auth(claims)
    refresh_token = await auth_service.create_session(user_id)
    jwt_token = create_access_token(user_id)

    response.set_cookie(
        settings.session_cookie_name,
        refresh_token,
        httponly=True,
        max_age=settings.refresh_token_ttl_days * 86400,
        samesite="lax",
        secure=settings.is_production,
    )
    response.set_cookie(
        "ps_access",
        jwt_token,
        httponly=True,
        max_age=settings.access_token_ttl_minutes * 60,
        samesite="lax",
        secure=settings.is_production,
    )
    return {"onboarded": not is_new}


@router.post("/signout")
async def signout(response: Response):
    settings = get_settings()
    response.delete_cookie(settings.session_cookie_name)
    response.delete_cookie("ps_access")
    return {"ok": True}


@router.get("/me", response_model=CurrentUser)
async def me(user=Depends(get_current_user)):
    return CurrentUser(
        id=user.id,
        github_handle=user.githubHandle,
        display_name=user.displayName,
        avatar_url=user.avatarUrl,
        onboarded=user.lastSyncedAt is not None,
    )
