from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from prisma import Json

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.client import db
from app.extractor.resume import parse_resume
from app.schemas.profile import (
    LinkAccountRequest,
    ProfileOut,
    ProfileUpdate,
    ResumeAuditEvidenceRepo,
    ResumeAuditOut,
    ResumeAuditSkill,
    ResumeParseResult,
    VerificationTokenOut,
)
from app.services.verification import verification_token, verify_ownership

router = APIRouter(prefix="/profile", tags=["profile"])

_LINKABLE_PLATFORMS = {"leetcode", "codeforces", "kaggle"}
_HANDLE_FIELD = {
    "leetcode": "leetcodeHandle",
    "codeforces": "codeforcesHandle",
    "kaggle": "kaggleHandle",
}


def _to_out(user) -> ProfileOut:
    return ProfileOut(
        id=user.id,
        github_handle=user.githubHandle,
        leetcode_handle=user.leetcodeHandle,
        codeforces_handle=user.codeforcesHandle,
        kaggle_handle=user.kaggleHandle,
        display_name=user.displayName,
        avatar_url=user.avatarUrl,
        bio=user.bio,
        tagline=user.tagline,
        location=user.location,
        coding_score=float(user.codingScore) if user.codingScore is not None else None,
        project_quality_score=float(user.projectQualityScore) if user.projectQualityScore is not None else None,
        consistency_score=float(user.consistencyScore) if user.consistencyScore is not None else None,
        learning_velocity=float(user.learningVelocity) if user.learningVelocity is not None else None,
        last_synced_at=user.lastSyncedAt,
    )


@router.get("", response_model=ProfileOut)
async def get_profile(user=Depends(get_current_user)):
    return _to_out(user)


@router.patch("", response_model=ProfileOut)
async def update_profile(body: ProfileUpdate, user=Depends(get_current_user)):
    data = {k: v for k, v in body.model_dump(by_alias=False).items() if v is not None}
    field_map = {"display_name": "displayName", "tagline": "tagline", "bio": "bio", "location": "location"}
    prisma_data = {field_map[k]: v for k, v in data.items()}
    updated = await db.user.update(where={"id": user.id}, data=prisma_data)
    return _to_out(updated)


@router.get("/verification-token", response_model=VerificationTokenOut)
async def get_verification_token(user=Depends(get_current_user)):
    """Section 5.1 account linking: the token to paste into a platform's
    public profile before calling POST /profile/link/{platform}."""
    token = verification_token(user.id)
    return VerificationTokenOut(
        token=token,
        instructions={
            "leetcode": f'Add "{token}" anywhere in your LeetCode profile "About Me" section, then link your handle.',
            "codeforces": f'Set your Codeforces "Organization" field to "{token}" (Settings), then link your handle. You can change it back after.',
            "kaggle": "Kaggle's public API has no bio field to verify against — linking is accepted without verification.",
        },
    )


@router.post("/link/{platform}", response_model=ProfileOut)
async def link_account(platform: str, body: LinkAccountRequest, user=Depends(get_current_user)):
    if platform not in _LINKABLE_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    verified = await verify_ownership(platform, body.handle, user.id)
    if verified is False:
        token = verification_token(user.id)
        raise HTTPException(
            status_code=400,
            detail=f"Could not verify ownership of {platform} handle '{body.handle}'. "
            f"Add token '{token}' to your public profile (see GET /profile/verification-token) and retry.",
        )

    updated = await db.user.update(where={"id": user.id}, data={_HANDLE_FIELD[platform]: body.handle})
    return _to_out(updated)


@router.delete("/link/{platform}", response_model=ProfileOut)
async def unlink_account(platform: str, user=Depends(get_current_user)):
    if platform not in _LINKABLE_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")
    updated = await db.user.update(where={"id": user.id}, data={_HANDLE_FIELD[platform]: None})
    return _to_out(updated)


async def _corroborated_skills(user_id: str, skills_claimed: list[str]) -> list[str]:
    """Cross-checks resume-claimed skill names against skills the user
    already has code evidence for (Section 1: resume never adds unverified
    skills on its own — it can only corroborate what the graph already
    inferred from GitHub)."""
    if not skills_claimed:
        return []
    rows = await db.query_raw(
        """
        SELECT s.name FROM user_has_skill uhs
        JOIN skills s ON s.id = uhs.skill_id
        WHERE uhs.user_id = $1::uuid
        """,
        user_id,
    )
    evidenced = {r["name"].lower() for r in rows}
    return [claim for claim in skills_claimed if claim.lower() in evidenced]


@router.post("/resume", response_model=ResumeParseResult)
async def upload_resume(file: UploadFile, user=Depends(get_current_user)):
    """Section 4 / 8.3 Step 3: parse an uploaded resume PDF into structured
    data. Per Section 1's "LLM as presenter, not predictor" principle, the
    extraction only surfaces what's literally in the resume text (see
    extractor/resume.py's prompt) and never writes a *new* skill onto the
    graph on its own — it's persisted so it survives a reload, and claimed
    skills are cross-checked against skills already evidenced from code
    (`corroborated_skills`) rather than trusted at face value."""
    if file.content_type not in ("application/pdf", "application/x-pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported")

    settings = get_settings()
    resume_dir = Path(settings.storage_dir) / "resumes"
    resume_dir.mkdir(parents=True, exist_ok=True)
    dest = resume_dir / f"{user.id}-{uuid.uuid4().hex}.pdf"

    contents = await file.read()
    max_bytes = 10 * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail="Resume file too large (10MB max)")
    dest.write_bytes(contents)

    try:
        parsed = await parse_resume(str(dest))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not parse resume: {exc}") from exc

    skills_claimed = parsed.get("skills_claimed") or []
    record = await db.resumeparse.upsert(
        where={"userId": user.id},
        data={
            "create": {
                "userId": user.id,
                "skillsClaimed": skills_claimed,
                "education": Json(parsed.get("education") or []),
                "workExperience": Json(parsed.get("work_experience") or []),
                "projects": Json(parsed.get("projects") or []),
            },
            "update": {
                "skillsClaimed": skills_claimed,
                "education": Json(parsed.get("education") or []),
                "workExperience": Json(parsed.get("work_experience") or []),
                "projects": Json(parsed.get("projects") or []),
                "parsedAt": datetime.now(timezone.utc),
            },
        },
    )
    corroborated = await _corroborated_skills(user.id, skills_claimed)
    return ResumeParseResult(**parsed, corroborated_skills=corroborated, parsed_at=record.parsedAt)


@router.get("/resume", response_model=ResumeParseResult)
async def get_resume(user=Depends(get_current_user)):
    """Latest persisted resume parse (Settings shows this across reloads
    instead of re-parsing), or all-empty fields if nothing's been uploaded."""
    record = await db.resumeparse.find_unique(where={"userId": user.id})
    if not record:
        return ResumeParseResult()
    corroborated = await _corroborated_skills(user.id, record.skillsClaimed)
    return ResumeParseResult(
        education=record.education or [],
        work_experience=record.workExperience or [],
        projects=record.projects or [],
        skills_claimed=record.skillsClaimed,
        corroborated_skills=corroborated,
        parsed_at=record.parsedAt,
    )


@router.get("/resume/audit", response_model=ResumeAuditOut)
async def resume_audit(user=Depends(get_current_user)):
    """Resume Audit page (Section 1's "receipts, not resumes" ethos taken
    literally): for every skill claimed on the resume, says whether the
    user's own GitHub evidence backs it up — and if so, exactly which repos
    proved it, same as a skill's evidence panel on the graph page. Nothing
    here is inferred from the resume alone; a claim only counts as
    "implemented" if `user_has_skill` already has it from code."""
    record = await db.resumeparse.find_unique(where={"userId": user.id})
    if not record or not record.skillsClaimed:
        return ResumeAuditOut()

    claimed = record.skillsClaimed
    matches = await db.query_raw(
        """
        SELECT s.id AS skill_id, s.name AS skill_name, uhs.confidence
        FROM skills s
        JOIN user_has_skill uhs ON uhs.skill_id = s.id AND uhs.user_id = $2::uuid
        WHERE lower(s.name) = ANY($1::text[])
        """,
        [c.lower() for c in claimed],
        user.id,
    )
    by_lower_name = {m["skill_name"].lower(): m for m in matches}
    matched_skill_ids = [m["skill_id"] for m in matches]

    evidence_by_skill: dict[str, list[ResumeAuditEvidenceRepo]] = {}
    if matched_skill_ids:
        rows = await db.query_raw(
            """
            SELECT tms.skill_id, p.id AS project_id, p.repo_full_name, MAX(put.weight) AS weight
            FROM technology_maps_to_skill tms
            JOIN project_uses_technology put ON put.technology_id = tms.technology_id
            JOIN projects p ON p.id = put.project_id
            WHERE tms.skill_id = ANY($1::uuid[]) AND p.user_id = $2::uuid
            GROUP BY tms.skill_id, p.id, p.repo_full_name
            ORDER BY weight DESC NULLS LAST
            """,
            matched_skill_ids,
            user.id,
        )
        for r in rows:
            evidence_by_skill.setdefault(r["skill_id"], []).append(
                ResumeAuditEvidenceRepo(project_id=r["project_id"], repo_full_name=r["repo_full_name"], weight=float(r["weight"] or 0))
            )

    skills: list[ResumeAuditSkill] = []
    implemented_count = 0
    for claim in claimed:
        match = by_lower_name.get(claim.lower())
        if match:
            implemented_count += 1
            skills.append(
                ResumeAuditSkill(
                    name=claim,
                    implemented=True,
                    confidence=float(match["confidence"]),
                    evidence_repos=evidence_by_skill.get(match["skill_id"], []),
                )
            )
        else:
            skills.append(ResumeAuditSkill(name=claim, implemented=False))

    return ResumeAuditOut(
        parsed_at=record.parsedAt,
        skills=skills,
        credibility_score=implemented_count / len(claimed) if claimed else None,
        education=record.education or [],
        work_experience=record.workExperience or [],
    )
