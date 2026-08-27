"""One-time (then periodic, per Section 15 refresh cadences) loader:

    python -m app.refdata.load_all

Reads ml_pipeline/clean/*.parquet (produced by `python ml_pipeline/scripts/run_all.py`
— see ml_pipeline/README.md for exactly what each file contains and the
known gaps) and populates the `refdata` schema tables. Idempotent: each
table is truncated and reloaded rather than diffed, since refdata is
reference data with no foreign keys pointing into it from user data.
"""

from __future__ import annotations

import asyncio
import math
from pathlib import Path

import numpy as np
import pandas as pd

from app.db.client import connect_db, disconnect_db, db

CLEAN_DIR = Path(__file__).resolve().parents[3] / "ml_pipeline" / "clean"
BATCH_SIZE = 2000


def _clean_nan(value):
    """Parquet -> Python round-trips leave float NaN in place of SQL NULL for
    optional numeric/string columns; Prisma's JSON encoder chokes on NaN."""
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


def _records(df: pd.DataFrame, column_map: dict[str, str]) -> list[dict]:
    records = []
    for row in df.to_dict(orient="records"):
        record = {}
        for src, dest in column_map.items():
            value = row.get(src)
            if isinstance(value, np.ndarray):
                value = value.tolist()
            if isinstance(value, list):
                record[dest] = [v for v in value if v is not None]
            else:
                record[dest] = _clean_nan(value)
        records.append(record)
    return records


async def _load_table(prisma_model, table_name: str, records: list[dict]) -> None:
    await db.execute_raw(f'TRUNCATE TABLE refdata."{table_name}" CASCADE')
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i : i + BATCH_SIZE]
        await prisma_model.create_many(data=batch)
    print(f"  {table_name}: {len(records):,} rows")


async def load_esco_skills() -> None:
    df = pd.read_parquet(CLEAN_DIR / "esco_skills.parquet")
    records = _records(df, {
        "skill_uri": "skillUri", "skill_type": "skillType", "reuse_level": "reuseLevel",
        "preferred_label": "preferredLabel", "altLabels": "altLabels", "description": "description",
    })
    await _load_table(db.escoskill, "esco_skills", records)


async def load_esco_occupations() -> None:
    df = pd.read_parquet(CLEAN_DIR / "esco_occupations.parquet")
    records = _records(df, {
        "occupation_uri": "occupationUri", "isco_group": "iscoGroup", "esco_code": "escoCode",
        "preferred_label": "preferredLabel", "altLabels": "altLabels", "description": "description",
    })
    await _load_table(db.escooccupation, "esco_occupations", records)


async def load_esco_tech_skills() -> None:
    df = pd.read_parquet(CLEAN_DIR / "esco_tech_skills.parquet")
    records = _records(df, {
        "skill_uri": "skillUri", "skill_type": "skillType", "reuse_level": "reuseLevel",
        "preferred_label": "preferredLabel", "altLabels": "altLabels", "description": "description",
    })
    await _load_table(db.escotechskill, "esco_tech_skills", records)


async def load_esco_tech_occupations() -> None:
    df = pd.read_parquet(CLEAN_DIR / "esco_tech_occupations.parquet")
    records = _records(df, {
        "occupation_uri": "occupationUri", "isco_group": "iscoGroup", "esco_code": "escoCode",
        "preferred_label": "preferredLabel", "altLabels": "altLabels", "description": "description",
    })
    await _load_table(db.escotechoccupation, "esco_tech_occupations", records)


async def load_linkedin_jobs() -> None:
    df = pd.read_parquet(CLEAN_DIR / "linkedin_jobs_clean.parquet")
    records = _records(df, {
        "job_link": "jobLink", "job_title": "jobTitle", "target_role": "targetRole",
        "role_match_method": "roleMatchMethod", "role_match_score": "roleMatchScore",
        "company": "company", "job_location": "jobLocation", "job_level": "jobLevel",
        "job_type": "jobType", "first_seen": "firstSeen", "skills_linked": "skillsLinked",
        "skills_unlinked": "skillsUnlinked", "skill_count": "skillCount",
    })
    await _load_table(db.linkedinjobclean, "linkedin_jobs_clean", records)


async def load_stackoverflow_survey() -> None:
    df = pd.read_parquet(CLEAN_DIR / "stackoverflow_survey_clean.parquet")
    records = _records(df, {
        "ResponseId": "responseId", "MainBranch": "mainBranch", "Age": "age", "EdLevel": "edLevel",
        "Employment": "employment", "YearsCode": "yearsCode", "WorkExp": "workExp", "DevType": "devType",
        "OrgSize": "orgSize", "RemoteWork": "remoteWork", "Country": "country",
        "ConvertedCompYearly": "convertedCompYearly", "LanguageHaveWorkedWith": "languageHaveWorkedWith",
        "DatabaseHaveWorkedWith": "databaseHaveWorkedWith", "PlatformHaveWorkedWith": "platformHaveWorkedWith",
        "WebframeHaveWorkedWith": "webframeHaveWorkedWith", "DevEnvsHaveWorkedWith": "devEnvsHaveWorkedWith",
        "AIModelsHaveWorkedWith": "aiModelsHaveWorkedWith", "JobSat": "jobSat",
    })
    await _load_table(db.stackoverflowsurveyclean, "stackoverflow_survey_clean", records)


async def main() -> None:
    if not CLEAN_DIR.exists() or not any(CLEAN_DIR.glob("*.parquet")):
        raise SystemExit(f"No cleaned parquet files in {CLEAN_DIR}. Run `python ml_pipeline/scripts/run_all.py` first.")

    await connect_db()
    try:
        print("Loading refdata tables from ml_pipeline/clean/ ...")
        await load_esco_skills()
        await load_esco_occupations()
        await load_esco_tech_skills()
        await load_esco_tech_occupations()
        await load_linkedin_jobs()
        await load_stackoverflow_survey()
        print("Done.")
    finally:
        await disconnect_db()


if __name__ == "__main__":
    asyncio.run(main())
