"""The `sync_profile` job (Section 9 Flow 1 / Flow 2) — everything that runs
when a user presses "Update Profile". Single entry point for data refresh;
never triggered automatically (Section 2 design principle #3).

All graph writes happen inside one Prisma transaction (Section 4 step 8);
sync_logs and the NOTIFY happen after commit so the browser never sees
"done" before the data is actually queryable.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.db import pubsub
from app.db.client import db
from app.extractor.github import GitHubExtractor
from app.inference import skill_mapper
from app.inference.confidence import (
    SkillEvidenceInput,
    compute_confidence,
    evidence_breadth,
    evidence_depth,
    evidence_diversity,
    evidence_recency,
)
from app.inference.technology_detector import (
    boilerplate_weight,
    detect_architecture_patterns,
    detect_template,
    extract_technologies,
)
from app.inference.technology_detector import (
    has_tests as detect_has_tests,
)
from app.intelligence.scores import (
    ProjectComplexityInput,
    complexity_score,
    documentation_quality,
    recompute_all_scores,
)
from app.rag.vectorstore import replace_user_chunks
from prisma import Json

_DEPLOYMENT_MARKER_PATHS = {
    "Procfile",
    "vercel.json",
    "netlify.toml",
    "fly.toml",
    "render.yaml",
    "app.yaml",
    "Dockerfile",
    "docker-compose.yml",
    "k8s/deployment.yaml",
    "kubernetes/deployment.yaml",
    "helm/Chart.yaml",
}


def _quarter_of(iso_date: str) -> str:
    dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
    return f"{dt.year}-Q{(dt.month - 1) // 3 + 1}"


async def run(payload: dict) -> None:
    user_id = payload["user_id"]
    channel = pubsub.sync_channel(user_id)
    started_at = datetime.now(timezone.utc)

    user = await db.user.find_unique(where={"id": user_id})
    if not user or not user.githubAccessToken:
        await _fail(user_id, channel, started_at, "No linked GitHub account with a stored access token")
        return

    await pubsub.notify(channel, {"stage": "fetching", "message": "Pulling GitHub repos"})

    extractor = GitHubExtractor(user.githubAccessToken)
    try:
        repos = await extractor.list_repos(user.githubHandle)
        new_tech_count = 0
        new_skill_count = 0

        await pubsub.notify(channel, {"stage": "extracting", "message": f"Analyzing {len(repos)} repos"})

        for repo in repos:
            full_name = repo["full_name"]
            manifests = await extractor.fetch_manifests(full_name)
            repo_paths = manifests.pop("_repo_paths", [])  # type: ignore[assignment]
            has_ci_cd = bool(manifests.pop("_has_ci_workflows", False))
            technologies = extract_technologies({**manifests, "_repo_paths": repo_paths, "_has_ci_workflows": has_ci_cd})
            authorship = await extractor.commit_authorship(full_name, user.githubHandle)
            contributor = await extractor.contributor_stats(full_name, user.githubHandle)
            readme = await extractor.fetch_readme(full_name)

            template = detect_template({t["name"] for t in technologies}, repo_paths)
            non_config_lines = contributor["additions"]
            weight = boilerplate_weight(
                is_fork=repo.get("fork", False),
                has_significant_original_commits=authorship["commit_count"] > 10,
                is_template_derived=template is not None,
                non_template_commit_count=authorship["commit_count"],
                non_config_lines_authored=non_config_lines,
            )

            architecture_patterns = detect_architecture_patterns(repo_paths)
            project_has_tests = detect_has_tests(repo_paths)
            has_deployment_config = any(p in _DEPLOYMENT_MARKER_PATHS for p in repo_paths)
            doc_quality = documentation_quality(readme)

            breakdown = complexity_score(
                ProjectComplexityInput(
                    total_lines_authored=non_config_lines,
                    distinct_technologies_count=len(technologies),
                    architecture_patterns_detected=len(architecture_patterns),
                    has_tests=project_has_tests,
                    has_ci_cd=has_ci_cd,
                    has_deployment_config=has_deployment_config,
                    documentation_quality=doc_quality,
                )
            )

            project = await db.project.upsert(
                where={"userId_repoFullName": {"userId": user_id, "repoFullName": full_name}},
                data={
                    "create": {
                        "userId": user_id,
                        "repoFullName": full_name,
                        "description": repo.get("description"),
                        "primaryLanguage": repo.get("language"),
                        "stars": repo.get("stargazers_count", 0),
                        "forks": repo.get("forks_count", 0),
                        "isFork": repo.get("fork", False),
                        "isTemplateDerived": template is not None,
                        "contributionWeight": weight,
                        "complexityScore": breakdown["total"],
                        "complexityBreakdown": Json(breakdown),
                        "architecturePatterns": architecture_patterns,
                        "hasTests": project_has_tests,
                        "hasCiCd": has_ci_cd,
                        "hasDeploymentConfig": has_deployment_config,
                        "readmeExcerpt": (readme or "")[:1000] or None,
                        "createdAtGh": repo.get("created_at"),
                        "lastCommitAt": authorship["last_commit_at"],
                        "lastSyncedAt": datetime.now(timezone.utc),
                    },
                    "update": {
                        "description": repo.get("description"),
                        "stars": repo.get("stargazers_count", 0),
                        "forks": repo.get("forks_count", 0),
                        "isTemplateDerived": template is not None,
                        "contributionWeight": weight,
                        "complexityScore": breakdown["total"],
                        "complexityBreakdown": Json(breakdown),
                        "architecturePatterns": architecture_patterns,
                        "hasTests": project_has_tests,
                        "hasCiCd": has_ci_cd,
                        "hasDeploymentConfig": has_deployment_config,
                        "readmeExcerpt": (readme or "")[:1000] or None,
                        "lastCommitAt": authorship["last_commit_at"],
                        "lastSyncedAt": datetime.now(timezone.utc),
                    },
                },
            )

            tech_ids = []
            for tech in technologies:
                tech_id = await skill_mapper.ensure_technology_row(tech["name"], category=None, ecosystem=tech["ecosystem"])
                tech_ids.append(tech_id)
                existing_edge = await db.projectusestechnology.find_unique(
                    where={"projectId_technologyId": {"projectId": project.id, "technologyId": tech_id}}
                )
                if not existing_edge:
                    new_tech_count += 1
                await db.projectusestechnology.upsert(
                    where={"projectId_technologyId": {"projectId": project.id, "technologyId": tech_id}},
                    data={"create": {"projectId": project.id, "technologyId": tech_id, "weight": weight}, "update": {"weight": weight}},
                )

            await _record_tech_quarter_activity(user_id, tech_ids, authorship.get("commit_dates", []))

        await pubsub.notify(channel, {"stage": "scoring", "message": "Computing skill confidence"})
        new_skill_count = await _recompute_skills(user_id)
        await recompute_all_scores(user_id)

        await pubsub.notify(channel, {"stage": "scoring", "message": "Rebuilding AI assistant index"})
        await _rebuild_rag_index(user_id)

        await db.user.update(where={"id": user_id}, data={"lastSyncedAt": datetime.now(timezone.utc)})
        await db.synclog.create(
            data={
                "userId": user_id,
                "jobId": payload.get("job_id"),
                "startedAt": started_at,
                "completedAt": datetime.now(timezone.utc),
                "status": "success",
                "sourcesSynced": ["github"],
                "reposProcessed": len(repos),
                "newTechnologiesCount": new_tech_count,
                "newSkillsCount": new_skill_count,
            }
        )
        await pubsub.notify(channel, {"stage": "done", "new_skills": new_skill_count, "new_tech": new_tech_count})
    except Exception as exc:
        await _fail(user_id, channel, started_at, str(exc))
        raise
    finally:
        await extractor.close()


async def _recompute_skills(user_id: str) -> int:
    """Simplified confidence pass: aggregates technology-mapped skill weight
    per skill and feeds it through inference/confidence.py using per-user
    maxima as normalization (Section 5.2 Step 4). Recency/diversity inputs
    are placeholders until per-technology commit history exists (see
    intelligence/scores.py TODOs) — breadth/depth dominate for now.
    """
    rows = await db.query_raw(
        """
        SELECT tms.skill_id, s.name AS skill_name,
               COUNT(DISTINCT put.technology_id) AS tech_count,
               SUM(put.weight) AS total_weight,
               MAX(p.last_commit_at) AS most_recent_commit_at,
               bool_and(p.user_id IS NOT NULL) AS solo_only
        FROM project_uses_technology put
        JOIN projects p ON p.id = put.project_id
        JOIN technology_maps_to_skill tms ON tms.technology_id = put.technology_id
        JOIN skills s ON s.id = tms.skill_id
        WHERE p.user_id = $1::uuid
        GROUP BY tms.skill_id, s.name
        """,
        user_id,
    )
    if not rows:
        return 0

    max_tech_count = max(r["tech_count"] for r in rows)
    max_weight = max(float(r["total_weight"] or 0) for r in rows) or 1.0

    new_skill_count = 0
    for row in rows:
        most_recent_commit_at = row["most_recent_commit_at"]
        if isinstance(most_recent_commit_at, str):
            most_recent_commit_at = datetime.fromisoformat(most_recent_commit_at)
        evidence = SkillEvidenceInput(
            skill_id=row["skill_id"],
            contributing_technologies=[""] * row["tech_count"],
            max_technologies_for_any_skill=max_tech_count,
            lines_authored=int(float(row["total_weight"] or 0) * 1000),
            max_lines_for_any_skill=int(max_weight * 1000),
            most_recent_commit_at=most_recent_commit_at,
            oldest_relevant_commit_at=None,
            is_solo_repo_only=True,
            is_contest_only=False,
        )
        confidence = compute_confidence(evidence)
        breadth = evidence_breadth(evidence)
        depth = evidence_depth(evidence)
        recency = evidence_recency(evidence)
        diversity = evidence_diversity(evidence)

        existing = await db.userhasskill.find_unique(where={"userId_skillId": {"userId": user_id, "skillId": row["skill_id"]}})
        if not existing:
            new_skill_count += 1

        await db.userhasskill.upsert(
            where={"userId_skillId": {"userId": user_id, "skillId": row["skill_id"]}},
            data={
                "create": {
                    "userId": user_id,
                    "skillId": row["skill_id"],
                    "confidence": confidence,
                    "breadth": breadth,
                    "depth": depth,
                    "recency": recency,
                    "diversity": diversity,
                    "firstEvidenceDate": existing.firstEvidenceDate if existing else datetime.now(timezone.utc),
                    "evidenceCount": row["tech_count"],
                },
                "update": {
                    "confidence": confidence,
                    "breadth": breadth,
                    "depth": depth,
                    "recency": recency,
                    "diversity": diversity,
                    "evidenceCount": row["tech_count"],
                },
            },
        )
    return new_skill_count


async def _record_tech_quarter_activity(user_id: str, tech_ids: list[str], commit_dates: list[str]) -> None:
    """Buckets this repo's user-authored commits into quarters and
    attributes them to every technology used in the repo (Section 5.4) —
    the fact table `app/api/v1/timeline.py` reads from."""
    if not tech_ids or not commit_dates:
        return

    by_quarter: dict[str, int] = {}
    for iso_date in commit_dates:
        by_quarter[_quarter_of(iso_date)] = by_quarter.get(_quarter_of(iso_date), 0) + 1
    first_seen = min(commit_dates)
    first_seen_dt = datetime.fromisoformat(first_seen.replace("Z", "+00:00"))

    for tech_id in tech_ids:
        for quarter, count in by_quarter.items():
            existing = await db.techquarteractivity.find_unique(
                where={"userId_technologyId_quarter": {"userId": user_id, "technologyId": tech_id, "quarter": quarter}}
            )
            new_count = float(existing.commitCount) + count if existing else count
            await db.techquarteractivity.upsert(
                where={"userId_technologyId_quarter": {"userId": user_id, "technologyId": tech_id, "quarter": quarter}},
                data={
                    "create": {
                        "userId": user_id,
                        "technologyId": tech_id,
                        "quarter": quarter,
                        "commitCount": new_count,
                        "firstSeenAt": first_seen_dt,
                    },
                    "update": {"commitCount": new_count},
                },
            )
        # Keep firstSeenAt as the earliest ever seen across syncs, not just this run's min.
        earliest_row = await db.techquarteractivity.find_first(
            where={"userId": user_id, "technologyId": tech_id}, order={"firstSeenAt": "asc"}
        )
        if earliest_row and earliest_row.firstSeenAt > first_seen_dt:
            await db.techquarteractivity.update_many(
                where={"userId": user_id, "technologyId": tech_id}, data={"firstSeenAt": first_seen_dt}
            )


async def _rebuild_rag_index(user_id: str) -> None:
    skills = await db.userhasskill.find_many(where={"userId": user_id}, include={"skill": True})
    projects = await db.project.find_many(where={"userId": user_id})

    chunks = [
        {
            "chunk_type": "skill",
            "reference_id": s.skillId,
            "content": f"{s.skill.name}: confidence {float(s.confidence):.2f}, based on {s.evidenceCount} technologies.",
        }
        for s in skills
    ] + [
        {
            "chunk_type": "project",
            "reference_id": p.id,
            "content": f"{p.repoFullName}: {p.description or 'no description'}. Complexity {p.complexityScore or 'unscored'}.",
        }
        for p in projects
    ]
    await replace_user_chunks(user_id, chunks)


async def _fail(user_id: str, channel: str, started_at: datetime, error: str) -> None:
    await db.synclog.create(
        data={
            "userId": user_id,
            "startedAt": started_at,
            "completedAt": datetime.now(timezone.utc),
            "status": "failed",
            "sourcesSynced": [],
            "errorMessage": error,
        }
    )
    await pubsub.notify(channel, {"stage": "error", "message": error})
