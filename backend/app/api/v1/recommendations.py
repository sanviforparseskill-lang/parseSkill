from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.db.client import db
from app.ml.role_predictor import predict_roles
from app.refdata.project_ideas import PROJECT_IDEAS
from app.schemas.recommendations import ProjectIdea, RolePrediction, SkillGapItem

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/roles", response_model=list[RolePrediction])
async def top_roles(user=Depends(get_current_user)):
    predictions = await predict_roles(user.id)
    return [
        RolePrediction(role_id=p["role_id"], role_name=p["role_name"], confidence=p["confidence"], description=p.get("description"))
        for p in predictions
    ]


@router.get("/gap/{role_id}", response_model=list[SkillGapItem])
async def skill_gap(role_id: str, user=Depends(get_current_user)):
    """Required-minus-known skills for `role_id`, ranked by ESCO importance
    blended with the skill's co-occurrence PageRank (Section 5.5 Step 2 /
    Section 7 example query) — a skill central to the wider skill graph
    (high pagerank) is prioritized slightly above one of equal role-importance
    that's a dead end, since learning it opens more doors next."""
    role = await db.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    rows = await db.query_raw(
        """
        SELECT s.id AS skill_id, s.name AS skill_name, srr.importance, s.pagerank,
               EXISTS (
                   SELECT 1 FROM user_has_skill uhs
                   WHERE uhs.user_id = $2::uuid AND uhs.skill_id = srr.skill_id
               ) AS already_have
        FROM skill_required_by_role srr
        JOIN skills s ON s.id = srr.skill_id
        WHERE srr.role_id = $1::uuid
        ORDER BY srr.importance DESC NULLS LAST
        """,
        role_id,
        user.id,
    )
    max_pagerank = max((float(r["pagerank"] or 0) for r in rows), default=0.0) or 1.0
    items = [
        SkillGapItem(
            skill_id=r["skill_id"],
            skill_name=r["skill_name"],
            importance=float(r["importance"] or 0),
            # 80% role importance, 20% graph centrality (normalized against
            # this role's own skill set so it isn't dominated by whichever
            # skill happens to be globally central).
            priority_score=round(0.8 * float(r["importance"] or 0) + 0.2 * (float(r["pagerank"] or 0) / max_pagerank), 4),
            already_have=r["already_have"],
        )
        for r in rows
    ]
    items.sort(key=lambda i: i.priority_score, reverse=True)
    return items


@router.get("/projects", response_model=list[ProjectIdea])
async def suggested_projects(user=Depends(get_current_user)):
    """Matches the curated project-idea bank (app/refdata/project_ideas.py)
    against the user's known skills across all roles' skill gaps, ranked by
    how many gap skills each idea exercises (Section 5.5 Step 4)."""
    gap_rows = await db.query_raw(
        """
        SELECT DISTINCT s.name AS skill_name
        FROM skill_required_by_role srr
        JOIN skills s ON s.id = srr.skill_id
        WHERE NOT EXISTS (
            SELECT 1 FROM user_has_skill uhs
            WHERE uhs.user_id = $1::uuid AND uhs.skill_id = srr.skill_id
        )
        """,
        user.id,
    )
    gap_skill_names = {r["skill_name"].lower() for r in gap_rows}
    if not gap_skill_names:
        return []

    scored = []
    for idea in PROJECT_IDEAS:
        idea_skills = {s.lower() for s in idea["skills_exercised"]}
        overlap = idea_skills & gap_skill_names
        if overlap:
            scored.append((len(overlap), idea))
    scored.sort(key=lambda pair: pair[0], reverse=True)

    return [
        ProjectIdea(
            title=idea["title"],
            description=idea["description"],
            skills_exercised=idea["skills_exercised"],
            complexity=idea["complexity"],
            estimated_hours=idea["estimated_hours"],
            why_this_project=idea["why_this_project"],
        )
        for _, idea in scored[:10]
    ]
