from pydantic import BaseModel


class RolePrediction(BaseModel):
    role_id: str
    role_name: str
    confidence: float
    description: str | None


class SkillGapItem(BaseModel):
    skill_id: str
    skill_name: str
    importance: float
    priority_score: float
    already_have: bool


class LearningPathStep(BaseModel):
    skill_id: str
    skill_name: str
    depth: int
    estimated_weeks: float | None
    resource_type: str | None


class ProjectIdea(BaseModel):
    title: str
    description: str
    skills_exercised: list[str]
    complexity: str
    estimated_hours: int
    why_this_project: str


class RoadmapSkill(BaseModel):
    skill_id: str
    skill_name: str
    order_index: int
    estimated_hours: int
    status: str  # not_started | learning | done
    project_idea: ProjectIdea | None
