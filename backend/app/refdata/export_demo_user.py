"""Export one user's frontend-facing dataset as sanitized static JSON.

Usage examples:

    python -m app.refdata.export_demo_user --github-handle sanvi-s
    python -m app.refdata.export_demo_user --user-id <uuid> --output ../frontend/public/data/demo-sanvi.json
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from app.db.client import connect_db, db, disconnect_db
from app.db.raw import learning_path_for_role, skill_graph_json
from app.ml.role_predictor import predict_roles

EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
TOKEN_RE = re.compile(r"\b(?:ghp|github_pat|sk|token|secret)_[A-Za-z0-9_\-]+\b", re.IGNORECASE)


def _jsonable(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(k): _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    return value


def _isoformat(value: Any) -> str:
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


def _sanitize_string(text: str) -> str:
    text = EMAIL_RE.sub("[redacted-email]", text)
    text = TOKEN_RE.sub("[redacted-token]", text)
    return text


def _sanitize(value: Any) -> Any:
    if isinstance(value, str):
        return _sanitize_string(value)
    if isinstance(value, list):
        return [_sanitize(v) for v in value]
    if isinstance(value, dict):
        return {k: _sanitize(v) for k, v in value.items()}
    return value


def _profile_from_user(user: Any) -> dict[str, Any]:
    return {
        "id": user.id,
        "github_handle": user.githubHandle,
        "leetcode_handle": user.leetcodeHandle,
        "codeforces_handle": user.codeforcesHandle,
        "kaggle_handle": user.kaggleHandle,
        "display_name": user.displayName,
        "avatar_url": user.avatarUrl,
        "bio": user.bio,
        "tagline": user.tagline,
        "location": user.location,
        "coding_score": float(user.codingScore) if user.codingScore is not None else None,
        "project_quality_score": float(user.projectQualityScore) if user.projectQualityScore is not None else None,
        "consistency_score": float(user.consistencyScore) if user.consistencyScore is not None else None,
        "learning_velocity": float(user.learningVelocity) if user.learningVelocity is not None else None,
        "last_synced_at": user.lastSyncedAt.isoformat() if user.lastSyncedAt else None,
    }


async def _resume_payload(user_id: str) -> tuple[dict[str, Any], dict[str, Any]]:
    record = await db.resumeparse.find_unique(where={"userId": user_id})
    if not record:
        empty_parse = {
            "education": [],
            "work_experience": [],
            "projects": [],
            "skills_claimed": [],
            "corroborated_skills": [],
            "parsed_at": None,
        }
        empty_audit = {
            "parsed_at": None,
            "skills": [],
            "credibility_score": None,
            "education": [],
            "work_experience": [],
        }
        return empty_parse, empty_audit

    rows = await db.query_raw(
        """
        SELECT s.name FROM user_has_skill uhs
        JOIN skills s ON s.id = uhs.skill_id
        WHERE uhs.user_id = $1::uuid
        """,
        user_id,
    )
    evidenced = {r["name"].lower() for r in rows}
    corroborated = [claim for claim in record.skillsClaimed if claim.lower() in evidenced]

    parse_payload = {
        "education": record.education or [],
        "work_experience": record.workExperience or [],
        "projects": record.projects or [],
        "skills_claimed": record.skillsClaimed,
        "corroborated_skills": corroborated,
        "parsed_at": record.parsedAt.isoformat() if record.parsedAt else None,
    }

    claimed_lower = [c.lower() for c in record.skillsClaimed]
    implemented_rows = []
    if claimed_lower:
        implemented_rows = await db.query_raw(
            """
            SELECT s.id AS skill_id, s.name AS skill_name, uhs.confidence
            FROM skills s
            JOIN user_has_skill uhs ON uhs.skill_id = s.id AND uhs.user_id = $2::uuid
            WHERE lower(s.name) = ANY($1::text[])
            """,
            claimed_lower,
            user_id,
        )

    by_name = {row["skill_name"].lower(): row for row in implemented_rows}
    skill_ids = [row["skill_id"] for row in implemented_rows]
    evidence_by_skill: dict[str, list[dict[str, Any]]] = {}

    if skill_ids:
        evidence_rows = await db.query_raw(
            """
            SELECT tms.skill_id, p.id AS project_id, p.repo_full_name, MAX(put.weight) AS weight
            FROM technology_maps_to_skill tms
            JOIN project_uses_technology put ON put.technology_id = tms.technology_id
            JOIN projects p ON p.id = put.project_id
            WHERE tms.skill_id = ANY($1::uuid[]) AND p.user_id = $2::uuid
            GROUP BY tms.skill_id, p.id, p.repo_full_name
            ORDER BY weight DESC NULLS LAST
            """,
            skill_ids,
            user_id,
        )
        for row in evidence_rows:
            evidence_by_skill.setdefault(row["skill_id"], []).append(
                {
                    "project_id": row["project_id"],
                    "repo_full_name": row["repo_full_name"],
                    "weight": float(row["weight"] or 0),
                }
            )

    skills = []
    implemented_count = 0
    for claim in record.skillsClaimed:
        match = by_name.get(claim.lower())
        if match:
            implemented_count += 1
            skills.append(
                {
                    "name": claim,
                    "implemented": True,
                    "confidence": float(match["confidence"]),
                    "evidence_repos": evidence_by_skill.get(match["skill_id"], []),
                }
            )
        else:
            skills.append({"name": claim, "implemented": False, "confidence": None, "evidence_repos": []})

    audit_payload = {
        "parsed_at": record.parsedAt.isoformat() if record.parsedAt else None,
        "skills": skills,
        "credibility_score": (implemented_count / len(record.skillsClaimed)) if record.skillsClaimed else None,
        "education": record.education or [],
        "work_experience": record.workExperience or [],
    }

    return parse_payload, audit_payload


async def _skills_payload(user_id: str) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    rows = await db.userhasskill.find_many(
        where={"userId": user_id},
        include={"skill": True},
        order={"confidence": "desc"},
    )
    skills = [
        {
            "id": row.skill.id,
            "name": row.skill.name,
            "category": row.skill.category,
            "confidence": float(row.confidence),
            "first_evidence_date": row.firstEvidenceDate.isoformat() if row.firstEvidenceDate else None,
            "evidence_count": row.evidenceCount,
        }
        for row in rows
    ]

    evidence: dict[str, dict[str, Any]] = {}
    for row in rows:
        evidence_rows = await db.query_raw(
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
            row.skill.id,
            user_id,
        )
        evidence[row.skill.id] = {
            "skill_id": row.skill.id,
            "skill_name": row.skill.name,
            "confidence": float(row.confidence),
            "breadth": float(row.breadth),
            "depth": float(row.depth),
            "recency": float(row.recency),
            "diversity": float(row.diversity),
            "evidence_repos": [
                {
                    "project_id": r["project_id"],
                    "repo_full_name": r["repo_full_name"],
                    "weight": float(r["weight"] or 0),
                    "technologies": r["technologies"],
                }
                for r in evidence_rows
            ],
        }

    return skills, evidence


async def _projects_payload(user_id: str) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    projects = await db.project.find_many(
        where={"userId": user_id},
        include={"technologies": {"include": {"technology": True}}, "concepts": {"include": {"concept": True}}},
        order={"complexityScore": "desc"},
    )

    list_payload = []
    detail_payload: dict[str, dict[str, Any]] = {}
    for project in projects:
        top_tech = [
            pt.technology.name
            for pt in sorted(project.technologies, key=lambda x: x.weight or 0, reverse=True)[:4]
        ]
        base = {
            "id": project.id,
            "repo_full_name": project.repoFullName,
            "description": project.description,
            "primary_language": project.primaryLanguage,
            "stars": project.stars,
            "forks": project.forks,
            "is_fork": project.isFork,
            "is_template_derived": project.isTemplateDerived,
            "contribution_weight": float(project.contributionWeight) if project.contributionWeight is not None else None,
            "complexity_score": float(project.complexityScore) if project.complexityScore is not None else None,
            "last_commit_at": project.lastCommitAt.isoformat() if project.lastCommitAt else None,
            "top_technologies": top_tech,
        }
        list_payload.append(base)

        tech_contrib = await db.query_raw(
            """
            SELECT s.name AS skill_name, tms.weight
            FROM project_uses_technology put
            JOIN technology_maps_to_skill tms ON tms.technology_id = put.technology_id
            JOIN skills s ON s.id = tms.skill_id
            WHERE put.project_id = $1::uuid
            ORDER BY tms.weight DESC NULLS LAST
            """,
            project.id,
        )

        detail_payload[project.id] = {
            **base,
            "complexity_breakdown": {k: float(v) for k, v in (project.complexityBreakdown or {}).items()},
            "technologies": [
                {"name": pt.technology.name, "weight": float(pt.weight or 0), "category": pt.technology.category}
                for pt in project.technologies
            ],
            "architecture_patterns": project.architecturePatterns,
            "concepts_demonstrated": [pc.concept.name for pc in project.concepts],
            "skill_contributions": [
                {"skill_name": row["skill_name"], "weight": float(row["weight"] or 0)} for row in tech_contrib
            ],
            "readme_excerpt": project.readmeExcerpt,
        }

    return list_payload, detail_payload


async def _timeline_payload(user_id: str) -> dict[str, Any]:
    rows = await db.query_raw(
        """
        SELECT t.id AS technology_id, t.name AS technology_name, t.category,
               tqa.quarter, tqa.commit_count, tqa.first_seen_at
        FROM tech_quarter_activity tqa
        JOIN technologies t ON t.id = tqa.technology_id
        WHERE tqa.user_id = $1::uuid
        ORDER BY tqa.quarter ASC
        """,
        user_id,
    )

    cells = [
        {
            "technology_id": row["technology_id"],
            "technology_name": row["technology_name"],
            "category": row["category"],
            "quarter": row["quarter"],
            "commit_count": float(row["commit_count"]),
        }
        for row in rows
    ]

    first_seen_by_tech: dict[str, dict[str, Any]] = {}
    for row in rows:
        tech_id = row["technology_id"]
        seen_at = row["first_seen_at"]
        if tech_id not in first_seen_by_tech or _isoformat(seen_at) < _isoformat(first_seen_by_tech[tech_id]["first_seen_at"]):
            first_seen_by_tech[tech_id] = {
                "technology_id": tech_id,
                "technology_name": row["technology_name"],
                "first_seen_at": seen_at,
            }

    milestones = [
        {
            "type": "first_commit",
            "technology_id": row["technology_id"],
            "technology_name": row["technology_name"],
            "date": _isoformat(row["first_seen_at"]),
            "label": f"Started working with {row['technology_name']}",
        }
        for row in sorted(first_seen_by_tech.values(), key=lambda x: x["first_seen_at"])
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
        user_id,
    )
    learning_velocity = [
        {"quarter": row["quarter"], "new_technologies": row["new_technologies"]}
        for row in velocity_rows
    ]

    return {
        "cells": cells,
        "milestones": milestones,
        "learning_velocity": learning_velocity,
    }


async def _recommendations_payload(user_id: str) -> tuple[list[dict[str, Any]], dict[str, list[dict[str, Any]]], list[dict[str, Any]]]:
    roles = await predict_roles(user_id)
    role_payload = [
        {
            "role_id": role["role_id"],
            "role_name": role["role_name"],
            "confidence": role["confidence"],
            "description": role.get("description"),
        }
        for role in roles
    ]

    gap_by_role: dict[str, list[dict[str, Any]]] = {}
    for role in role_payload:
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
            role["role_id"],
            user_id,
        )
        max_pagerank = max((float(row["pagerank"] or 0) for row in rows), default=0.0) or 1.0
        items = [
            {
                "skill_id": row["skill_id"],
                "skill_name": row["skill_name"],
                "importance": float(row["importance"] or 0),
                "priority_score": round(0.8 * float(row["importance"] or 0) + 0.2 * (float(row["pagerank"] or 0) / max_pagerank), 4),
                "already_have": row["already_have"],
            }
            for row in rows
        ]
        items.sort(key=lambda item: item["priority_score"], reverse=True)
        gap_by_role[role["role_id"]] = items

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
        user_id,
    )
    gap_skill_names = {row["skill_name"].lower() for row in gap_rows}

    from app.refdata.project_ideas import PROJECT_IDEAS  # local import to keep startup light

    scored = []
    for idea in PROJECT_IDEAS:
        overlap = {skill.lower() for skill in idea["skills_exercised"]} & gap_skill_names
        if overlap:
            scored.append((len(overlap), idea))
    scored.sort(key=lambda pair: pair[0], reverse=True)

    project_ideas = [
        {
            "title": idea["title"],
            "description": idea["description"],
            "skills_exercised": idea["skills_exercised"],
            "complexity": idea["complexity"],
            "estimated_hours": idea["estimated_hours"],
            "why_this_project": idea["why_this_project"],
        }
        for _, idea in scored[:10]
    ]

    return role_payload, gap_by_role, project_ideas


async def _roadmap_payload(user_id: str, roles: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    hours_by_category = {
        "language": 60,
        "framework": 35,
        "database": 25,
        "devops": 30,
        "ml": 45,
        "cloud": 30,
    }

    def estimated_hours(category: str | None, depth: int) -> int:
        base = hours_by_category.get((category or "").lower(), 20)
        return round(base * (1 + 0.15 * depth))

    role_ids = [r["role_id"] for r in roles]
    roadmap_by_role: dict[str, list[dict[str, Any]]] = {}
    for role_id in role_ids:
        steps = await learning_path_for_role(user_id, role_id)
        skill_ids = [step["skill_id"] for step in steps]
        skills = await db.skill.find_many(where={"id": {"in": skill_ids}})
        category_by_id = {skill.id: skill.category for skill in skills}
        existing = await db.userroadmapskill.find_many(where={"userId": user_id, "roleId": role_id})
        existing_by_skill = {row.skillId: row for row in existing}

        rows = []
        for i, step in enumerate(steps):
            existing_row = existing_by_skill.get(step["skill_id"])
            status = existing_row.status if existing_row else "not_started"
            order_index = existing_row.orderIndex if existing_row else i
            rows.append(
                {
                    "skill_id": step["skill_id"],
                    "skill_name": step["skill_name"],
                    "order_index": order_index,
                    "estimated_hours": estimated_hours(category_by_id.get(step["skill_id"]), step["depth"]),
                    "status": status,
                    "project_idea": None,
                }
            )
        rows.sort(key=lambda x: x["order_index"])
        roadmap_by_role[role_id] = rows

    return roadmap_by_role


async def _portfolio_payload(user: Any, roles: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any]]:
    config = await db.portfolioconfig.find_unique(where={"userId": user.id})
    if config:
        portfolio = {
            "is_public": config.isPublic,
            "slug": config.slug,
            "theme": config.theme,
            "sections": config.sections,
            "featured_project_ids": config.featuredProjectIds,
        }
    else:
        portfolio = {
            "is_public": False,
            "slug": user.githubHandle,
            "theme": "minimal",
            "sections": None,
            "featured_project_ids": [],
        }

    top_projects = []
    if portfolio["featured_project_ids"]:
        rows = await db.project.find_many(where={"id": {"in": portfolio["featured_project_ids"]}})
        top_projects = [
            {
                "repo_full_name": row.repoFullName,
                "description": row.description,
                "complexity_score": float(row.complexityScore or 0),
            }
            for row in rows
        ]

    top_role = None
    if roles:
        top_role = {
            "role_id": roles[0]["role_id"],
            "role_name": roles[0]["role_name"],
            "confidence": roles[0]["confidence"],
        }

    public_portfolio = {
        "handle": user.githubHandle,
        "display_name": user.displayName,
        "tagline": user.tagline,
        "avatar_url": user.avatarUrl,
        "theme": portfolio["theme"],
        "sections": portfolio["sections"],
        "top_projects": top_projects,
        "top_role": top_role,
    }
    return portfolio, public_portfolio


def _build_extras(dataset: dict[str, Any]) -> dict[str, Any]:
    roadmap_rows = []
    for rows in dataset["roadmap_by_role"].values():
        roadmap_rows.extend(rows)

    done_count = sum(1 for row in roadmap_rows if row["status"] == "done")
    learning_count = sum(1 for row in roadmap_rows if row["status"] == "learning")
    not_started_count = sum(1 for row in roadmap_rows if row["status"] == "not_started")

    return {
        "quiz_results": [],
        "career_report": {
            "top_role": dataset["recommendations"]["roles"][0] if dataset["recommendations"]["roles"] else None,
            "skills_detected": len(dataset["skills"]),
        },
        "roadmap_progress": {
            "done": done_count,
            "learning": learning_count,
            "not_started": not_started_count,
        },
        "exam_calendar": [],
        "dashboard_stats": {
            "coding_score": dataset["profile"]["coding_score"],
            "project_quality_score": dataset["profile"]["project_quality_score"],
            "consistency_score": dataset["profile"]["consistency_score"],
            "learning_velocity": dataset["profile"]["learning_velocity"],
            "projects": len(dataset["projects"]),
            "skills": len(dataset["skills"]),
        },
        "effort_score": {
            "value": dataset["profile"]["consistency_score"],
            "formula": "currently mapped to consistency_score",
        },
        "streak": {
            "current_days": 0,
            "note": "Derived streak tracking not yet modeled in backend schema.",
        },
    }


async def export_demo_user(github_handle: str | None, user_id: str | None, output_path: Path, profile_label: str) -> Path:
    if not github_handle and not user_id:
        raise SystemExit("Provide either --github-handle or --user-id")

    await connect_db()
    try:
        user = await db.user.find_unique(where={"id": user_id}) if user_id else await db.user.find_first(where={"githubHandle": github_handle})
        if not user:
            identity = user_id if user_id else github_handle
            raise SystemExit(f"User not found: {identity}")

        auth_me = {
            "id": user.id,
            "github_handle": user.githubHandle,
            "display_name": user.displayName,
            "avatar_url": user.avatarUrl,
            "onboarded": user.lastSyncedAt is not None,
        }

        profile = _profile_from_user(user)
        verification_token = {
            "token": "demo-verify-token",
            "instructions": {
                "leetcode": "Demo mode: verification disabled.",
                "codeforces": "Demo mode: verification disabled.",
                "kaggle": "Demo mode: verification disabled.",
            },
        }

        resume_parse, resume_audit = await _resume_payload(user.id)
        skills, skill_evidence = await _skills_payload(user.id)
        projects, project_details = await _projects_payload(user.id)
        timeline = await _timeline_payload(user.id)
        roles, gap_by_role, project_ideas = await _recommendations_payload(user.id)
        roadmap_by_role = await _roadmap_payload(user.id, roles)
        portfolio, public_portfolio = await _portfolio_payload(user, roles)
        graph = await skill_graph_json(user.id)

        sync_logs = await db.synclog.find_many(where={"userId": user.id}, order={"startedAt": "desc"}, take=20)
        sync_history = [
            {
                "id": row.id,
                "started_at": row.startedAt.isoformat(),
                "completed_at": row.completedAt.isoformat() if row.completedAt else None,
                "status": row.status,
                "sources_synced": row.sourcesSynced,
                "repos_processed": row.reposProcessed,
                "new_technologies_count": row.newTechnologiesCount,
                "new_skills_count": row.newSkillsCount,
                "error_message": row.errorMessage,
            }
            for row in sync_logs
        ]

        chat_rows = await db.chatmessage.find_many(where={"userId": user.id}, order={"createdAt": "asc"}, take=200)
        chat_history = [
            {
                "id": row.id,
                "role": row.role,
                "content": row.content,
                "citations": row.citations,
                "created_at": row.createdAt.isoformat(),
            }
            for row in chat_rows
        ]

        dataset: dict[str, Any] = {
            "meta": {
                "profile_label": profile_label,
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "source": "local-dev-db",
                "sanitized": True,
            },
            "auth": {"me": auth_me},
            "profile": profile,
            "verification_token": verification_token,
            "resume_parse": resume_parse,
            "resume_audit": resume_audit,
            "skills": skills,
            "skill_evidence": skill_evidence,
            "projects": projects,
            "project_details": project_details,
            "timeline": timeline,
            "recommendations": {
                "roles": roles,
                "gap_by_role": gap_by_role,
                "projects": project_ideas,
            },
            "roadmap_by_role": roadmap_by_role,
            "portfolio": portfolio,
            "public_portfolio": public_portfolio,
            "graph_skills": graph,
            "sync": {"history": sync_history},
            "chat": {
                "history": chat_history,
                "canned_replies": [
                    "Your strongest signal is backend/API engineering with consistent recent activity.",
                    "To increase ML role fit, ship one project with data pipeline, model training, and serving in production shape.",
                    "Your roadmap suggests prioritizing missing high-importance skills before broadening into adjacent tooling.",
                ],
            },
        }

        dataset["extras"] = _build_extras(dataset)
        sanitized = _sanitize(_jsonable(dataset))

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(sanitized, indent=2), encoding="utf-8")
        return output_path
    finally:
        await disconnect_db()


def _default_output_path() -> Path:
    return Path(__file__).resolve().parents[3] / "frontend" / "public" / "data" / "demo-sanvi.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export sanitized demo JSON for frontend-only deployments")
    parser.add_argument("--github-handle", default="sanvi-s", help="GitHub handle of the user to export")
    parser.add_argument("--user-id", default=None, help="User UUID override (takes precedence when provided)")
    parser.add_argument("--profile-label", default="Sanvi", help="Human-readable profile label")
    parser.add_argument("--output", default=str(_default_output_path()), help="Destination JSON path")
    return parser.parse_args()


async def _main() -> None:
    args = parse_args()
    output = await export_demo_user(
        github_handle=args.github_handle,
        user_id=args.user_id,
        output_path=Path(args.output).resolve(),
        profile_label=args.profile_label,
    )
    print(f"Exported demo data to {output}")


if __name__ == "__main__":
    asyncio.run(_main())
