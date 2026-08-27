from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.db.client import db
from app.schemas.portfolio import PortfolioConfigOut, PortfolioConfigUpdate

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


def _to_out(config) -> PortfolioConfigOut:
    return PortfolioConfigOut(
        is_public=config.isPublic,
        slug=config.slug,
        theme=config.theme,
        sections=config.sections,
        featured_project_ids=config.featuredProjectIds,
    )


@router.get("", response_model=PortfolioConfigOut)
async def get_portfolio(user=Depends(get_current_user)):
    config = await db.portfolioconfig.find_unique(where={"userId": user.id})
    if not config:
        config = await db.portfolioconfig.create(data={"userId": user.id, "slug": user.githubHandle})
    return _to_out(config)


@router.patch("", response_model=PortfolioConfigOut)
async def update_portfolio(body: PortfolioConfigUpdate, user=Depends(get_current_user)):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    field_map = {
        "theme": "theme",
        "sections": "sections",
        "featured_project_ids": "featuredProjectIds",
        "slug": "slug",
    }
    prisma_data = {field_map[k]: v for k, v in data.items()}
    config = await db.portfolioconfig.upsert(
        where={"userId": user.id},
        data={"create": {"userId": user.id, "slug": user.githubHandle, **prisma_data}, "update": prisma_data},
    )
    return _to_out(config)


@router.post("/publish", response_model=PortfolioConfigOut)
async def toggle_publish(is_public: bool, user=Depends(get_current_user)):
    config = await db.portfolioconfig.upsert(
        where={"userId": user.id},
        data={
            "create": {"userId": user.id, "slug": user.githubHandle, "isPublic": is_public},
            "update": {"isPublic": is_public},
        },
    )
    return _to_out(config)
