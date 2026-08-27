from fastapi import APIRouter

from app.api.v1 import (
    auth,
    chat,
    graph,
    portfolio,
    profile,
    projects,
    public,
    recommendations,
    roadmap,
    skills,
    sync,
    timeline,
)

api_router = APIRouter(prefix="/api/v1")

for router in (
    auth.router,
    sync.router,
    profile.router,
    skills.router,
    projects.router,
    timeline.router,
    recommendations.router,
    roadmap.router,
    chat.router,
    portfolio.router,
    graph.router,
    public.router,
):
    api_router.include_router(router)
