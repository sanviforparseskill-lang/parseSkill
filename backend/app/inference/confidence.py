"""Confidence score computation (Section 5.2 Step 4):

    confidence(S) = min(1.0,
        0.4 * evidence_breadth(S) +   # how many distinct technologies map to S
        0.3 * evidence_depth(S) +     # code volume across those technologies
        0.2 * evidence_recency(S) +   # weighted by commit dates
        0.1 * evidence_diversity(S)   # solo repos vs collab, contest vs project
    )

Every component is normalized to [0, 1] against the user's own portfolio,
never a global benchmark (Section 5.2: avoids "everyone is 30% Python").
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class SkillEvidenceInput:
    skill_id: str
    contributing_technologies: list[str]  # distinct technologies mapping to this skill
    max_technologies_for_any_skill: int  # denominator for breadth, from this user's own skill set
    lines_authored: int
    max_lines_for_any_skill: int  # denominator for depth
    most_recent_commit_at: datetime | None
    oldest_relevant_commit_at: datetime | None
    is_solo_repo_only: bool
    is_contest_only: bool


def evidence_breadth(evidence: SkillEvidenceInput) -> float:
    if evidence.max_technologies_for_any_skill == 0:
        return 0.0
    return min(1.0, len(evidence.contributing_technologies) / evidence.max_technologies_for_any_skill)


def evidence_depth(evidence: SkillEvidenceInput) -> float:
    if evidence.max_lines_for_any_skill == 0:
        return 0.0
    return min(1.0, evidence.lines_authored / evidence.max_lines_for_any_skill)


def evidence_recency(evidence: SkillEvidenceInput, *, half_life_days: int = 365) -> float:
    """Exponential decay so skills last touched years ago don't outscore
    active ones, without a hard cliff."""
    if not evidence.most_recent_commit_at:
        return 0.0
    days_ago = (datetime.now(timezone.utc) - evidence.most_recent_commit_at).days
    return 0.5 ** (days_ago / half_life_days)


def evidence_diversity(evidence: SkillEvidenceInput) -> float:
    """1.0 when evidence spans both solo/collab repos and both project and
    contest contexts; lower when it's all one kind."""
    score = 1.0
    if evidence.is_solo_repo_only:
        score -= 0.5
    if evidence.is_contest_only:
        score -= 0.5
    return max(0.0, score)


def compute_confidence(evidence: SkillEvidenceInput) -> float:
    breadth = evidence_breadth(evidence)
    depth = evidence_depth(evidence)
    recency = evidence_recency(evidence)
    diversity = evidence_diversity(evidence)
    return min(1.0, 0.4 * breadth + 0.3 * depth + 0.2 * recency + 0.1 * diversity)
