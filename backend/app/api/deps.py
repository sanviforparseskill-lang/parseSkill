from __future__ import annotations

from fastapi import Cookie, Depends, HTTPException, status

from app.core.security import decode_access_token
from app.db.client import db


async def get_current_user_id(ps_access: str | None = Cookie(default=None)) -> str:
    """Reads the short-lived JWT access token from the HttpOnly cookie set at
    OAuth callback (Section 10: "JWT in HttpOnly cookie, refresh token rotation")."""
    if not ps_access:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_id = decode_access_token(ps_access)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    return user_id


async def get_current_user(user_id: str = Depends(get_current_user_id)):
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
