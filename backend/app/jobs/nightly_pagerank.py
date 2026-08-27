"""Nightly PageRank over the skill co-occurrence graph (Section 7 "Graph
algorithms run as SQL jobs"). Scheduled by APScheduler inside the worker
process (Section 2), not triggered by user action.

Implements power-iteration PageRank directly in SQL: each iteration is one
UPDATE that redistributes each skill's rank across `skill_co_occurs_with_skill`
edges (treated as undirected, per the table's `skill_a_id < skill_b_id`
canonical ordering).
"""

from __future__ import annotations

from app.db.client import db

DAMPING = 0.85
ITERATIONS = 20


async def run(_payload: dict | None = None) -> None:
    skill_count_rows = await db.query_raw("SELECT COUNT(*) AS n FROM skills")
    n = skill_count_rows[0]["n"]
    if n == 0:
        return

    await db.execute_raw("UPDATE skills SET pagerank = 1.0 / $1", n)

    for _ in range(ITERATIONS):
        await db.execute_raw(
            """
            WITH degree AS (
                SELECT skill_id, COUNT(*) AS out_degree FROM (
                    SELECT skill_a_id AS skill_id FROM skill_co_occurs_with_skill
                    UNION ALL
                    SELECT skill_b_id AS skill_id FROM skill_co_occurs_with_skill
                ) edges
                GROUP BY skill_id
            ),
            contributions AS (
                SELECT e.skill_b_id AS skill_id, s.pagerank / NULLIF(d.out_degree, 0) AS contribution
                FROM skill_co_occurs_with_skill e
                JOIN skills s ON s.id = e.skill_a_id
                JOIN degree d ON d.skill_id = e.skill_a_id
                UNION ALL
                SELECT e.skill_a_id AS skill_id, s.pagerank / NULLIF(d.out_degree, 0) AS contribution
                FROM skill_co_occurs_with_skill e
                JOIN skills s ON s.id = e.skill_b_id
                JOIN degree d ON d.skill_id = e.skill_b_id
            ),
            summed AS (
                SELECT skill_id, SUM(contribution) AS total FROM contributions GROUP BY skill_id
            )
            UPDATE skills s
            SET pagerank = (1 - $1) / $2 + $1 * COALESCE(summed.total, 0)
            FROM summed
            WHERE s.id = summed.skill_id
            """,
            DAMPING,
            n,
        )
