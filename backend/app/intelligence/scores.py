"""Developer Intelligence Engine (Section 6.2): coding score, project
quality, consistency, and learning velocity. Computed per user during every
sync and written onto `users` via INSERT ... ON CONFLICT ... DO UPDATE
(idempotent — see app/jobs/sync_profile.py).
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from datetime import datetime, timezone

from app.db.client import db


@dataclass
class ProjectComplexityInput:
    total_lines_authored: int
    distinct_technologies_count: int
    architecture_patterns_detected: int
    has_tests: bool
    has_ci_cd: bool
    has_deployment_config: bool
    documentation_quality: float  # 0..1, from README length/structure heuristic


def complexity_score(p: ProjectComplexityInput) -> dict[str, float]:
    """Section 5.3 Step 3:

        complexity =
            0.25 * log(total_lines_authored) +
            0.20 * distinct_technologies_count +
            0.15 * architecture_patterns_detected +
            0.15 * has_tests +
            0.10 * has_ci_cd +
            0.10 * has_deployment_config +
            0.05 * documentation_quality

    Every term is normalized to [0, 1] before weighting, so the weights sum
    to a 0-100 score directly instead of needing an empirically-picked scale
    factor: log_lines against log(20000) (a very large solo-authored repo),
    tech/pattern counts against fixed caps (8 technologies, 5 patterns) past
    which more doesn't mean more complex, just more sprawling. Returns the
    per-factor breakdown (0-100 each) alongside the total so callers can
    persist it for the "every score is inspectable" invariant (Section 1).
    """
    log_lines_norm = min(1.0, math.log(max(p.total_lines_authored, 1) + 1) / math.log(20000))
    tech_norm = min(1.0, p.distinct_technologies_count / 8)
    patterns_norm = min(1.0, p.architecture_patterns_detected / 5)

    breakdown = {
        "lines_authored": 0.25 * log_lines_norm * 100,
        "technology_breadth": 0.20 * tech_norm * 100,
        "architecture_patterns": 0.15 * patterns_norm * 100,
        "has_tests": 0.15 * (100 if p.has_tests else 0),
        "has_ci_cd": 0.10 * (100 if p.has_ci_cd else 0),
        "has_deployment_config": 0.10 * (100 if p.has_deployment_config else 0),
        "documentation_quality": 0.05 * p.documentation_quality * 100,
    }
    breakdown["total"] = min(100.0, sum(breakdown.values()))
    return breakdown


def documentation_quality(readme_text: str | None) -> float:
    """0..1 heuristic from README length/structure (Section 5.3 Step 3
    input) — length alone rewards padding, so structure (headers, code
    blocks, links) counts too."""
    if not readme_text or not readme_text.strip():
        return 0.0

    length_score = min(1.0, len(readme_text) / 3000)
    has_headers = bool(re.search(r"^#{1,3}\s", readme_text, re.MULTILINE))
    has_code_blocks = "```" in readme_text
    has_sections = len(re.findall(r"^#{1,3}\s", readme_text, re.MULTILINE)) >= 3
    has_links_or_badges = bool(re.search(r"\[.+?\]\(.+?\)", readme_text))

    structure_score = sum([has_headers, has_code_blocks, has_sections, has_links_or_badges]) / 4
    return round(0.5 * length_score + 0.5 * structure_score, 3)


async def project_quality_score(user_id: str) -> float:
    """weighted_mean of per-project complexity, weighted by contribution_weight and recency."""
    rows = await db.query_raw(
        """
        SELECT complexity_score, contribution_weight, last_commit_at
        FROM projects
        WHERE user_id = $1::uuid AND complexity_score IS NOT NULL
        """,
        user_id,
    )
    if not rows:
        return 0.0

    now = datetime.now(timezone.utc)
    total_weight = 0.0
    weighted_sum = 0.0
    for r in rows:
        recency_weight = 1.0
        if r["last_commit_at"]:
            last_commit_at = r["last_commit_at"]
            if isinstance(last_commit_at, str):
                last_commit_at = datetime.fromisoformat(last_commit_at)
            days_ago = (now - last_commit_at).days
            recency_weight = 0.5 ** (days_ago / 365)
        weight = float(r["contribution_weight"] or 1.0) * recency_weight
        weighted_sum += float(r["complexity_score"]) * weight
        total_weight += weight

    return weighted_sum / total_weight if total_weight else 0.0


async def consistency_score(user_id: str) -> float:
    """Fraction of the past 52 weeks with at least one commit (Section 6.2)."""
    rows = await db.query_raw(
        """
        SELECT DISTINCT date_trunc('week', last_commit_at) AS week
        FROM projects
        WHERE user_id = $1::uuid AND last_commit_at > now() - interval '52 weeks'
        """,
        user_id,
    )
    # NOTE: this only sees a project's *last* commit, not every commit in the
    # window, so it undercounts. Real accuracy needs a per-commit fact table
    # populated during sync (Section 6.1 output) rather than project-level dates.
    return min(1.0, len(rows) / 52) * 100


async def learning_velocity(user_id: str) -> float:
    """Count of new technologies first seen in the past 90 days (Section 6.2),
    using each technology's first *authored-commit* date from
    tech_quarter_activity (Section 5.4) rather than the owning project's
    creation date — a technology adopted 2 years into an old project would
    otherwise never count as "newly learned"."""
    rows = await db.query_raw(
        """
        SELECT COUNT(DISTINCT technology_id) AS new_tech
        FROM tech_quarter_activity
        WHERE user_id = $1::uuid AND first_seen_at > now() - interval '90 days'
        """,
        user_id,
    )
    return float(rows[0]["new_tech"]) if rows else 0.0


async def recompute_all_scores(user_id: str) -> dict[str, float]:
    quality = await project_quality_score(user_id)
    consistency = await consistency_score(user_id)
    velocity = await learning_velocity(user_id)

    await db.user.update(
        where={"id": user_id},
        data={
            "projectQualityScore": quality,
            "consistencyScore": consistency,
            "learningVelocity": velocity,
        },
    )
    return {"project_quality_score": quality, "consistency_score": consistency, "learning_velocity": velocity}
