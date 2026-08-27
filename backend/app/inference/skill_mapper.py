"""Technology -> skill mapping (Section 5.2 Step 3), read from the
`technology_maps_to_skill` ontology table seeded from Tabiya ESCO plus the
curated ~400-technology tech layer (Section 15.1, app/refdata/).
"""

from __future__ import annotations

from app.db.client import db


async def map_technologies_to_skills(technology_names: list[str]) -> dict[str, list[dict]]:
    """Returns {technology_name: [{skill_id, skill_name, weight}, ...]}."""
    if not technology_names:
        return {}

    rows = await db.query_raw(
        """
        SELECT t.name AS technology_name, s.id AS skill_id, s.name AS skill_name, tms.weight
        FROM technologies t
        JOIN technology_maps_to_skill tms ON tms.technology_id = t.id
        JOIN skills s ON s.id = tms.skill_id
        WHERE t.name = ANY($1::text[])
        """,
        technology_names,
    )

    result: dict[str, list[dict]] = {name: [] for name in technology_names}
    for row in rows:
        result[row["technology_name"]].append(
            {"skill_id": row["skill_id"], "skill_name": row["skill_name"], "weight": float(row["weight"] or 1.0)}
        )
    return result


async def ensure_technology_row(name: str, *, category: str | None, ecosystem: str | None) -> str:
    """Upserts a technology node so extraction always has a row to attach
    project_uses_technology edges to, even for technologies not yet in the
    curated ontology (they simply won't map to any skill until curated)."""
    tech = await db.technology.upsert(
        where={"name": name},
        data={
            "create": {"name": name, "category": category, "ecosystem": ecosystem},
            "update": {},
        },
    )
    return tech.id
