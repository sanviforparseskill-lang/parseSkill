from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.db.client import db

router = APIRouter(prefix="/timeline", tags=["timeline"])

# Skill Evolution Timeline (Section 5.4/6.2), backed by tech_quarter_activity
# (populated during sync_profile — see app/jobs/sync_profile.py
# `_record_tech_quarter_activity`): one row per (user, technology, quarter)
# with a commit count, so cells/milestones/velocity all derive from the same
# fact table instead of separate ad-hoc queries.


@router.get("")
async def get_timeline(user=Depends(get_current_user)):
    rows = await db.query_raw(
        """
        SELECT t.id AS technology_id, t.name AS technology_name, t.category,
               tqa.quarter, tqa.commit_count, tqa.first_seen_at
        FROM tech_quarter_activity tqa
        JOIN technologies t ON t.id = tqa.technology_id
        WHERE tqa.user_id = $1::uuid
        ORDER BY tqa.quarter ASC
        """,
        user.id,
    )

    cells = [
        {
            "technology_id": r["technology_id"],
            "technology_name": r["technology_name"],
            "category": r["category"],
            "quarter": r["quarter"],
            "commit_count": float(r["commit_count"]),
        }
        for r in rows
    ]

    first_seen_by_tech: dict[str, dict] = {}
    for r in rows:
        tech_id = r["technology_id"]
        if tech_id not in first_seen_by_tech or r["first_seen_at"] < first_seen_by_tech[tech_id]["first_seen_at"]:
            first_seen_by_tech[tech_id] = {
                "technology_id": tech_id,
                "technology_name": r["technology_name"],
                "first_seen_at": r["first_seen_at"],
            }
    milestones = [
        {
            "type": "first_commit",
            "technology_id": v["technology_id"],
            "technology_name": v["technology_name"],
            "date": v["first_seen_at"],
            "label": f"Started working with {v['technology_name']}",
        }
        for v in sorted(first_seen_by_tech.values(), key=lambda x: x["first_seen_at"])
    ]

    velocity_rows = await db.query_raw(
        """
        SELECT quarter, COUNT(DISTINCT technology_id) AS new_technologies
        FROM (
            SELECT technology_id, to_char(first_seen_at, 'YYYY-"Q"Q') AS quarter
            FROM tech_quarter_activity
            WHERE user_id = $1::uuid
        ) first_seen_quarters
        GROUP BY quarter
        ORDER BY quarter ASC
        """,
        user.id,
    )
    learning_velocity = [{"quarter": r["quarter"], "new_technologies": r["new_technologies"]} for r in velocity_rows]

    return {"cells": cells, "milestones": milestones, "learning_velocity": learning_velocity}


@router.get("/milestones")
async def get_milestones(user=Depends(get_current_user)):
    full = await get_timeline(user)
    return {"milestones": full["milestones"]}
