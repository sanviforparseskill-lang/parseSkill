from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db.client import db
from app.ml.role_predictor import predict_roles
from app.schemas.portfolio import PublicPortfolio

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/@{handle}", response_model=PublicPortfolio)
async def public_portfolio(handle: str):
    config = await db.portfolioconfig.find_unique(where={"slug": handle})
    if not config or not config.isPublic:
        raise HTTPException(status_code=404, detail="Portfolio not found or not published")

    user = await db.user.find_unique(where={"id": config.userId})
    if not user:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    projects = []
    if config.featuredProjectIds:
        rows = await db.project.find_many(where={"id": {"in": config.featuredProjectIds}})
        projects = [{"repo_full_name": p.repoFullName, "description": p.description, "complexity_score": float(p.complexityScore or 0)} for p in rows]

    top_predictions = await predict_roles(user.id, top_n=1)
    top_role = (
        {"role_id": top_predictions[0]["role_id"], "role_name": top_predictions[0]["role_name"], "confidence": top_predictions[0]["confidence"]}
        if top_predictions
        else None
    )

    return PublicPortfolio(
        handle=user.githubHandle,
        display_name=user.displayName,
        tagline=user.tagline,
        avatar_url=user.avatarUrl,
        theme=config.theme,
        sections=config.sections,
        top_projects=projects,
        top_role=top_role,
    )
