from datetime import datetime

from pydantic import BaseModel


class ProfileOut(BaseModel):
    id: str
    github_handle: str
    leetcode_handle: str | None
    codeforces_handle: str | None
    kaggle_handle: str | None
    display_name: str | None
    avatar_url: str | None
    bio: str | None
    tagline: str | None
    location: str | None
    coding_score: float | None
    project_quality_score: float | None
    consistency_score: float | None
    learning_velocity: float | None
    last_synced_at: datetime | None


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    tagline: str | None = None
    bio: str | None = None
    location: str | None = None


class LinkAccountRequest(BaseModel):
    handle: str
    verification_token: str | None = None


class VerificationTokenOut(BaseModel):
    token: str
    instructions: dict[str, str]


class ResumeEducation(BaseModel):
    institution: str | None = None
    degree: str | None = None
    field: str | None = None
    year: str | None = None


class ResumeWorkExperience(BaseModel):
    company: str | None = None
    title: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None


class ResumeProject(BaseModel):
    name: str | None = None
    description: str | None = None


class ResumeParseResult(BaseModel):
    education: list[ResumeEducation] = []
    work_experience: list[ResumeWorkExperience] = []
    projects: list[ResumeProject] = []
    skills_claimed: list[str] = []
    corroborated_skills: list[str] = []
    parsed_at: datetime | None = None


class ResumeAuditEvidenceRepo(BaseModel):
    project_id: str
    repo_full_name: str
    weight: float


class ResumeAuditSkill(BaseModel):
    name: str
    """As written on the resume — not normalized, so the audit reads back
    the user's own claim verbatim."""
    implemented: bool
    """True only if the claim matches a skill this user has code evidence
    for (Section 1: never trust the resume's word alone)."""
    confidence: float | None = None
    evidence_repos: list[ResumeAuditEvidenceRepo] = []


class ResumeAuditOut(BaseModel):
    parsed_at: datetime | None = None
    skills: list[ResumeAuditSkill] = []
    credibility_score: float | None = None
    """implemented / total claimed, None if nothing's been claimed yet —
    distinct from 0.0, which means claims exist but none are backed up."""
    education: list[ResumeEducation] = []
    work_experience: list[ResumeWorkExperience] = []
