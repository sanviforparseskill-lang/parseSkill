from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_current_user
from app.db.client import db
from app.db.raw import learning_path_for_role
from app.schemas.recommendations import RoadmapSkill

router = APIRouter(prefix="/roadmap", tags=["roadmap"])

# Hours-per-skill heuristic (Section 5.5 Step 3), pending a real
# resources/estimated-time lookup table sourced from curated learning
# content. Tiered by skill category since e.g. a language takes materially
# longer to reach working proficiency in than a single library/tool.
_HOURS_BY_CATEGORY = {
    "language": 60,
    "framework": 35,
    "database": 25,
    "devops": 30,
    "ml": 45,
    "cloud": 30,
}
_DEFAULT_HOURS = 20


def _estimated_hours(category: str | None, depth: int) -> int:
    base = _HOURS_BY_CATEGORY.get((category or "").lower(), _DEFAULT_HOURS)
    # Deeper prerequisite chains mean less can be picked up in parallel with
    # what the user already knows, so pad in proportion to depth.
    return round(base * (1 + 0.15 * depth))


@router.get("/{role_id}", response_model=list[RoadmapSkill])
async def get_roadmap(role_id: str, months: int = Query(default=3, ge=1, le=24), user=Depends(get_current_user)):
    """Schedules missing skills honoring `skill_prerequisite_of_skill` so no
    skill is placed before its prerequisite (Section 5.5 Step 3, Section 8.9).
    Ordering is prerequisite-depth via the recursive CTE in app/db/raw.py.
    Status/order for skills the user has already started is read from
    `user_roadmap_skill`; missing entries are seeded so subsequent
    PATCH /roadmap/skill/{skill_id}/status calls have a row to update."""
    role = await db.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    steps = await learning_path_for_role(user.id, role_id)
    skill_ids = [s["skill_id"] for s in steps]
    skills = await db.skill.find_many(where={"id": {"in": skill_ids}})
    category_by_id = {s.id: s.category for s in skills}

    existing_rows = await db.userroadmapskill.find_many(where={"userId": user.id, "roleId": role_id})
    existing_by_skill = {r.skillId: r for r in existing_rows}

    result = []
    for i, s in enumerate(steps):
        existing = existing_by_skill.get(s["skill_id"])
        hours = _estimated_hours(category_by_id.get(s["skill_id"]), s["depth"])
        if existing:
            status = existing.status
            order_index = existing.orderIndex
        else:
            status = "not_started"
            order_index = i
            await db.userroadmapskill.upsert(
                where={"userId_roleId_skillId": {"userId": user.id, "roleId": role_id, "skillId": s["skill_id"]}},
                data={
                    "create": {"userId": user.id, "roleId": role_id, "skillId": s["skill_id"], "status": status, "orderIndex": order_index},
                    "update": {},
                },
            )
        result.append(
            RoadmapSkill(
                skill_id=s["skill_id"],
                skill_name=s["skill_name"],
                order_index=order_index,
                estimated_hours=hours,
                status=status,
                project_idea=None,
            )
        )
    result.sort(key=lambda r: r.order_index)
    return result


@router.patch("/skill/{skill_id}/status")
async def set_skill_status(skill_id: str, status: str, role_id: str = Query(...), user=Depends(get_current_user)):
    if status not in {"not_started", "learning", "done"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    role = await db.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    existing = await db.userroadmapskill.find_unique(
        where={"userId_roleId_skillId": {"userId": user.id, "roleId": role_id, "skillId": skill_id}}
    )
    order_index = existing.orderIndex if existing else 0

    updated = await db.userroadmapskill.upsert(
        where={"userId_roleId_skillId": {"userId": user.id, "roleId": role_id, "skillId": skill_id}},
        data={
            "create": {"userId": user.id, "roleId": role_id, "skillId": skill_id, "status": status, "orderIndex": order_index},
            "update": {"status": status},
        },
    )
    return {"skill_id": skill_id, "role_id": role_id, "status": updated.status}
