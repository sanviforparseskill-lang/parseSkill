from datetime import date

from pydantic import BaseModel


class SkillOut(BaseModel):
    id: str
    name: str
    category: str | None
    confidence: float
    first_evidence_date: date | None
    evidence_count: int


class EvidenceRepo(BaseModel):
    project_id: str
    repo_full_name: str
    weight: float
    technologies: list[str]


class SkillEvidence(BaseModel):
    skill_id: str
    skill_name: str
    confidence: float
    breadth: float
    depth: float
    recency: float
    diversity: float
    evidence_repos: list[EvidenceRepo]
