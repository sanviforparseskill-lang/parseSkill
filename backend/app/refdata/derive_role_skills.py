"""Derives `skill_required_by_role` from real evidence instead of hand
curation: aggregates `refdata.linkedin_jobs_clean.skills_linked` (ESCO skill
URIs already resolved per posting) by `target_role` across all 11k+ postings,
and turns "skill X appears in N% of postings for role Y" into an importance
weight. This covers all ~25 canonical target roles the ml_pipeline
canonicalized job titles into (see ml_pipeline/README.md), not just the
handful hand-picked in seed_curated_ontology.py — and it's real frequency
data, not a guess.

Idempotent — upserts by natural key. Run after seed_curated_ontology.py
(so Role rows for names shared between both, e.g. "DevOps Engineer", merge
onto the same row rather than duplicating).

    python -m app.refdata.derive_role_skills
"""

from __future__ import annotations

import asyncio
from collections import Counter, defaultdict

from app.db.client import connect_db, disconnect_db, db

# Below this many postings for a role, frequency stats are too noisy to trust.
MIN_POSTINGS_PER_ROLE = 5
# Cap how many skills we attach per role — long-tail one-off skill mentions
# add noise, not signal, past this point.
MAX_SKILLS_PER_ROLE = 40
# A skill must show up in at least this fraction of a role's postings to
# count as "required" rather than an incidental one-off mention.
MIN_FREQUENCY = 0.03


async def main() -> None:
    await connect_db()
    try:
        rows = await db.linkedinjobclean.find_many()
        by_role: dict[str, list[list[str]]] = defaultdict(list)
        for r in rows:
            if not r.targetRole or not r.skillsLinked:
                continue
            by_role[r.targetRole].append(r.skillsLinked)

        skills = await db.skill.find_many(where={"escoUri": {"not": None}})
        skill_id_by_uri = {s.escoUri: s.id for s in skills}

        role_count = 0
        edge_count = 0
        for role_name, postings in by_role.items():
            if len(postings) < MIN_POSTINGS_PER_ROLE:
                continue

            uri_counts: Counter[str] = Counter()
            for uris in postings:
                uri_counts.update(set(uris))  # once per posting, not per repeat mention

            total = len(postings)
            ranked = sorted(uri_counts.items(), key=lambda kv: kv[1], reverse=True)
            top = [(uri, count) for uri, count in ranked if count / total >= MIN_FREQUENCY][:MAX_SKILLS_PER_ROLE]
            if not top:
                continue

            role = await db.role.upsert(
                where={"name": role_name},
                data={
                    "create": {"name": role_name, "description": f"Derived from {total} LinkedIn postings canonicalized to this role."},
                    "update": {},
                },
            )
            role_count += 1

            for uri, count in top:
                skill_id = skill_id_by_uri.get(uri)
                if not skill_id:
                    continue
                importance = min(1.0, count / total)
                await db.skillrequiredbyrole.upsert(
                    where={"skillId_roleId": {"skillId": skill_id, "roleId": role.id}},
                    data={
                        "create": {"skillId": skill_id, "roleId": role.id, "importance": importance},
                        "update": {"importance": importance},
                    },
                )
                edge_count += 1

        print(f"Derived skill_required_by_role for {role_count} roles ({edge_count} edges) from {len(rows)} LinkedIn postings.")
    finally:
        await disconnect_db()


if __name__ == "__main__":
    asyncio.run(main())
