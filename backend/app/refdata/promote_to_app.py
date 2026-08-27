"""Promotes the curated tech-relevant ESCO subset into the app-level graph
tables (Section 5.2 Step 3: "A second pass promotes a curated subset
(tech-relevant) into the app-level `skills` and `roles` tables").

Run after load_all.py:

    python -m app.refdata.load_all
    python -m app.refdata.promote_to_app

Idempotent via upsert on the natural unique key (`name`), so re-running
after a refdata refresh updates descriptions without duplicating rows or
disturbing existing `user_has_skill` / `skill_required_by_role` edges.
"""

from __future__ import annotations

import asyncio

from app.db.client import connect_db, disconnect_db, db


async def promote_skills() -> int:
    tech_skills = await db.escotechskill.find_many()
    count = 0
    for s in tech_skills:
        if not s.preferredLabel:
            continue
        await db.skill.upsert(
            where={"name": s.preferredLabel},
            data={
                "create": {"name": s.preferredLabel, "description": s.description, "escoUri": s.skillUri},
                "update": {"description": s.description, "escoUri": s.skillUri},
            },
        )
        count += 1
    return count


async def promote_roles() -> int:
    tech_occupations = await db.escotechoccupation.find_many()
    count = 0
    for o in tech_occupations:
        if not o.preferredLabel:
            continue
        await db.role.upsert(
            where={"name": o.preferredLabel},
            data={
                "create": {"name": o.preferredLabel, "description": o.description, "escoOccupationUri": o.occupationUri},
                "update": {"description": o.description, "escoOccupationUri": o.occupationUri},
            },
        )
        count += 1
    return count


async def main() -> None:
    await connect_db()
    try:
        skills_count = await promote_skills()
        roles_count = await promote_roles()
        print(f"Promoted {skills_count} skills, {roles_count} roles into app-level tables.")
        print(
            "NOTE: skill_required_by_role stays empty until an occupation-skill "
            "relations file is available (see ml_pipeline/README.md gap #1) or "
            "the curated ~400-technology/~80-skill layer (Section 15.1) is authored."
        )
    finally:
        await disconnect_db()


if __name__ == "__main__":
    asyncio.run(main())
