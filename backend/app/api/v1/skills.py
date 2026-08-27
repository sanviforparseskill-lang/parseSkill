from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.db.client import db
from app.schemas.skill import EvidenceRepo, SkillEvidence, SkillOut

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("", response_model=list[SkillOut])
async def list_skills(user=Depends(get_current_user)):
    rows = await db.userhasskill.find_many(
        where={"userId": user.id},
        include={"skill": True},
        order={"confidence": "desc"},
    )
    return [
        SkillOut(
            id=row.skill.id,
            name=row.skill.name,
            category=row.skill.category,
            confidence=float(row.confidence),
            first_evidence_date=row.firstEvidenceDate,
            evidence_count=row.evidenceCount,
        )
        for row in rows
    ]


@router.get("/{skill_id}/evidence", response_model=SkillEvidence)
async def skill_evidence(skill_id: str, user=Depends(get_current_user)):
    """Backs the "every score is auditable" invariant (Section 5.2): click a
    skill, see exactly which repos/technologies produced the confidence
    score and how the four weighted components broke down."""
    uhs = await db.userhasskill.find_unique(
        where={"userId_skillId": {"userId": user.id, "skillId": skill_id}},
        include={"skill": True},
    )
    if not uhs:
        raise HTTPException(status_code=404, detail="No evidence for this skill on this profile")

    rows = await db.query_raw(
        """
        SELECT p.id AS project_id, p.repo_full_name, put.weight,
               array_agg(t.name) AS technologies
        FROM technology_maps_to_skill tms
        JOIN project_uses_technology put ON put.technology_id = tms.technology_id
        JOIN projects p ON p.id = put.project_id
        JOIN technologies t ON t.id = tms.technology_id
        WHERE tms.skill_id = $1::uuid AND p.user_id = $2::uuid
        GROUP BY p.id, p.repo_full_name, put.weight
        ORDER BY put.weight DESC NULLS LAST
        """,
        skill_id,
        user.id,
    )

    return SkillEvidence(
        skill_id=uhs.skill.id,
        skill_name=uhs.skill.name,
        confidence=float(uhs.confidence),
        breadth=float(uhs.breadth),
        depth=float(uhs.depth),
        recency=float(uhs.recency),
        diversity=float(uhs.diversity),
        evidence_repos=[
            EvidenceRepo(
                project_id=r["project_id"],
                repo_full_name=r["repo_full_name"],
                weight=float(r["weight"] or 0),
                technologies=r["technologies"],
            )
            for r in rows
        ],
    )
