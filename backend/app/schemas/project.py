from datetime import datetime

from pydantic import BaseModel


class ProjectOut(BaseModel):
    id: str
    repo_full_name: str
    description: str | None
    primary_language: str | None
    stars: int
    forks: int
    is_fork: bool
    is_template_derived: bool
    contribution_weight: float | None
    complexity_score: float | None
    last_commit_at: datetime | None
    top_technologies: list[str]


class ProjectDetail(ProjectOut):
    complexity_breakdown: dict[str, float]
    technologies: list[dict]  # {name, weight, category}
    architecture_patterns: list[str]
    concepts_demonstrated: list[str]
    skill_contributions: list[dict]  # {skill_name, weight}
    readme_excerpt: str | None
