from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.db.raw import skill_graph_json

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/skills")
async def graph_skills(user=Depends(get_current_user)):
    """Cytoscape-ready skill graph (Section 8.5)."""
    return await skill_graph_json(user.id)


@router.get("/full")
async def graph_full(user=Depends(get_current_user)):
    # TODO(Section 8.5): extend skill_graph_json with project and role nodes
    # for the "Project-centric" / "Technology-centric" explorer views.
    return await skill_graph_json(user.id)
