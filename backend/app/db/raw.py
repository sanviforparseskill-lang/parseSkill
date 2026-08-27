"""Graph traversal queries (Section 7). These are the kinds of lookups that
don't map to Prisma's query builder — recursive CTEs, Jaccard similarity —
so they live as raw SQL, executed through the shared Prisma connection.
"""

from __future__ import annotations

from app.db.client import db


async def top_skills(user_id: str, limit: int = 5) -> list[dict]:
    return await db.query_raw(
        """
        SELECT s.name, uhs.confidence, uhs.evidence_count
        FROM user_has_skill uhs
        JOIN skills s ON s.id = uhs.skill_id
        WHERE uhs.user_id = $1::uuid
        ORDER BY uhs.confidence DESC
        LIMIT $2
        """,
        user_id,
        limit,
    )


async def missing_skills_for_role(user_id: str, role_id: str) -> list[dict]:
    return await db.query_raw(
        """
        SELECT s.id AS skill_id, s.name
        FROM skill_required_by_role srr
        JOIN skills s ON s.id = srr.skill_id
        WHERE srr.role_id = $1::uuid
        AND NOT EXISTS (
            SELECT 1 FROM user_has_skill uhs
            WHERE uhs.user_id = $2::uuid AND uhs.skill_id = srr.skill_id
        )
        ORDER BY srr.importance DESC NULLS LAST
        """,
        role_id,
        user_id,
    )


async def learning_path_for_role(user_id: str, role_id: str, max_depth: int = 8) -> list[dict]:
    """For each missing skill required by `role_id`, find the shortest
    prerequisite path from the user's known skills (Section 7 recursive CTE)."""
    missing = await missing_skills_for_role(user_id, role_id)
    steps: list[dict] = []
    for target in missing:
        rows = await db.query_raw(
            """
            WITH RECURSIVE path AS (
                SELECT s.id AS skill_id, s.name, ARRAY[s.id] AS path_ids, 0 AS depth
                FROM user_has_skill uhs
                JOIN skills s ON s.id = uhs.skill_id
                WHERE uhs.user_id = $1::uuid

                UNION ALL

                SELECT s2.id, s2.name, path.path_ids || s2.id, path.depth + 1
                FROM path
                JOIN skill_prerequisite_of_skill edge ON edge.prerequisite_id = path.skill_id
                JOIN skills s2 ON s2.id = edge.dependent_id
                WHERE NOT s2.id = ANY(path.path_ids) AND path.depth < $3
            )
            SELECT skill_id, name, depth FROM path
            WHERE skill_id = $2::uuid
            ORDER BY depth ASC
            LIMIT 1
            """,
            user_id,
            target["skill_id"],
            max_depth,
        )
        if rows:
            steps.append({"skill_id": rows[0]["skill_id"], "skill_name": rows[0]["name"], "depth": rows[0]["depth"]})
        else:
            # No path found within max_depth (or no prerequisite chain at all):
            # surface it directly rather than dropping it silently.
            steps.append({"skill_id": target["skill_id"], "skill_name": target["name"], "depth": 0})
    steps.sort(key=lambda s: s["depth"])
    return steps


async def similar_developers(user_id: str, limit: int = 10) -> list[dict]:
    """Jaccard similarity on skill sets (Section 7 / 8.8 "Similar Developers")."""
    return await db.query_raw(
        """
        WITH me AS (
            SELECT skill_id FROM user_has_skill WHERE user_id = $1::uuid
        ),
        overlap AS (
            SELECT
                uhs.user_id,
                COUNT(*) AS shared,
                (SELECT COUNT(*) FROM user_has_skill WHERE user_id = uhs.user_id) AS theirs,
                (SELECT COUNT(*) FROM me) AS mine
            FROM user_has_skill uhs
            WHERE uhs.skill_id IN (SELECT skill_id FROM me)
            AND uhs.user_id <> $1::uuid
            GROUP BY uhs.user_id
        )
        SELECT user_id, shared::float / NULLIF(theirs + mine - shared, 0) AS jaccard
        FROM overlap
        ORDER BY jaccard DESC
        LIMIT $2
        """,
        user_id,
        limit,
    )


async def skill_graph_json(user_id: str) -> dict:
    """Cytoscape-ready {nodes, edges} for GET /graph/skills (Section 8.5)."""
    skill_nodes = await db.query_raw(
        """
        SELECT s.id, s.name, s.category, uhs.confidence
        FROM user_has_skill uhs
        JOIN skills s ON s.id = uhs.skill_id
        WHERE uhs.user_id = $1::uuid
        """,
        user_id,
    )
    tech_nodes = await db.query_raw(
        """
        SELECT DISTINCT t.id, t.name, t.category
        FROM project_uses_technology put
        JOIN technologies t ON t.id = put.technology_id
        JOIN projects p ON p.id = put.project_id
        WHERE p.user_id = $1::uuid
        """,
        user_id,
    )
    edges = await db.query_raw(
        """
        SELECT DISTINCT tms.technology_id, tms.skill_id, tms.weight
        FROM technology_maps_to_skill tms
        JOIN user_has_skill uhs ON uhs.skill_id = tms.skill_id
        WHERE uhs.user_id = $1::uuid
        """,
        user_id,
    )
    project_nodes = await db.query_raw(
        """
        SELECT id, repo_full_name
        FROM projects
        WHERE user_id = $1::uuid
        """,
        user_id,
    )
    project_edges = await db.query_raw(
        """
        SELECT DISTINCT put.project_id, put.technology_id, put.weight
        FROM project_uses_technology put
        JOIN projects p ON p.id = put.project_id
        WHERE p.user_id = $1::uuid
        """,
        user_id,
    )

    nodes = [
        {"data": {"id": f"skill:{s['id']}", "label": s["name"], "type": "skill", "confidence": float(s["confidence"]), "category": s["category"]}}
        for s in skill_nodes
    ]
    nodes += [{"data": {"id": f"tech:{t['id']}", "label": t["name"], "type": "technology", "category": t["category"]}} for t in tech_nodes]
    nodes += [{"data": {"id": f"project:{p['id']}", "label": p["repo_full_name"], "type": "project"}} for p in project_nodes]
    cy_edges = [
        {"data": {"source": f"tech:{e['technology_id']}", "target": f"skill:{e['skill_id']}", "weight": float(e["weight"] or 0)}}
        for e in edges
    ]
    cy_edges += [
        {"data": {"source": f"project:{e['project_id']}", "target": f"tech:{e['technology_id']}", "weight": float(e["weight"] or 0)}}
        for e in project_edges
    ]
    return {"nodes": nodes, "edges": cy_edges}
