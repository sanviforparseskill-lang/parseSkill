from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.db.client import db
from app.schemas.project import ProjectDetail, ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
async def list_projects(user=Depends(get_current_user)):
    projects = await db.project.find_many(
        where={"userId": user.id},
        include={"technologies": {"include": {"technology": True}}},
        order={"complexityScore": "desc"},
    )
    return [
        ProjectOut(
            id=p.id,
            repo_full_name=p.repoFullName,
            description=p.description,
            primary_language=p.primaryLanguage,
            stars=p.stars,
            forks=p.forks,
            is_fork=p.isFork,
            is_template_derived=p.isTemplateDerived,
            contribution_weight=float(p.contributionWeight) if p.contributionWeight is not None else None,
            complexity_score=float(p.complexityScore) if p.complexityScore is not None else None,
            last_commit_at=p.lastCommitAt,
            top_technologies=[
                pt.technology.name
                for pt in sorted(p.technologies, key=lambda x: x.weight or 0, reverse=True)[:4]
            ],
        )
        for p in projects
    ]


@router.get("/{project_id}", response_model=ProjectDetail)
async def get_project(project_id: str, user=Depends(get_current_user)):
    project = await db.project.find_unique(
        where={"id": project_id},
        include={
            "technologies": {"include": {"technology": True}},
            "concepts": {"include": {"concept": True}},
        },
    )
    if not project or project.userId != user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    tech_contributions = await db.query_raw(
        """
        SELECT s.name AS skill_name, tms.weight
        FROM project_uses_technology put
        JOIN technology_maps_to_skill tms ON tms.technology_id = put.technology_id
        JOIN skills s ON s.id = tms.skill_id
        WHERE put.project_id = $1::uuid
        ORDER BY tms.weight DESC NULLS LAST
        """,
        project_id,
    )

    return ProjectDetail(
        id=project.id,
        repo_full_name=project.repoFullName,
        description=project.description,
        primary_language=project.primaryLanguage,
        stars=project.stars,
        forks=project.forks,
        is_fork=project.isFork,
        is_template_derived=project.isTemplateDerived,
        contribution_weight=float(project.contributionWeight) if project.contributionWeight is not None else None,
        complexity_score=float(project.complexityScore) if project.complexityScore is not None else None,
        last_commit_at=project.lastCommitAt,
        top_technologies=[pt.technology.name for pt in project.technologies[:4]],
        complexity_breakdown={k: float(v) for k, v in (project.complexityBreakdown or {}).items()},
        technologies=[
            {"name": pt.technology.name, "weight": float(pt.weight or 0), "category": pt.technology.category}
            for pt in project.technologies
        ],
        architecture_patterns=project.architecturePatterns,
        concepts_demonstrated=[pc.concept.name for pc in project.concepts],
        skill_contributions=[{"skill_name": r["skill_name"], "weight": float(r["weight"] or 0)} for r in tech_contributions],
        readme_excerpt=project.readmeExcerpt,
    )
