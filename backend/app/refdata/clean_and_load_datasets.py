"""Clean CSV datasets and bulk-load them to Neon.

This is the safe end-to-end flow for the project's reference datasets:
1. discover the root-level CSV files,
2. normalize column names and clean null/blank values,
3. deduplicate rows,
4. bulk-load the cleaned data to Postgres using COPY.

Usage:
    python -m app.refdata.clean_and_load_datasets --folder "E:\parseSkill"
"""

from __future__ import annotations

import argparse
import re
from io import StringIO
from pathlib import Path

import pandas as pd
import psycopg
from psycopg import Connection, sql

from app.core.config import get_settings

DEFAULT_SCHEMA = "raw_datasets"
IGNORE_DIRS = {".git", ".venv", "backend", "frontend", "node_modules"}


def _normalize_identifier(value: str) -> str:
    cleaned = re.sub(r"[^0-9A-Za-z_]+", "_", str(value).strip())
    cleaned = cleaned.strip("_")
    if not cleaned:
        cleaned = "column"
    cleaned = cleaned.lower()
    if cleaned[0].isdigit():
        cleaned = f"col_{cleaned}"
    return cleaned


def _discover_csvs(base_dir: Path) -> list[Path]:
    discovered: list[Path] = []
    for item in sorted(base_dir.iterdir()):
        if item.is_dir():
            continue
        if item.suffix.lower() == ".csv":
            discovered.append(item)
    return discovered


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()
    cleaned.columns = [_normalize_identifier(col) for col in cleaned.columns]
    cleaned = cleaned.replace({"": None, " ": None})
    for col in cleaned.columns:
        cleaned[col] = cleaned[col].map(lambda value: None if pd.isna(value) else str(value).strip())
    cleaned = cleaned.drop_duplicates()
    cleaned = cleaned.reset_index(drop=True)
    return cleaned


def _table_name_from_path(path: Path) -> str:
    name = re.sub(r"[^0-9A-Za-z_]+", "_", path.stem).strip("_")
    return name.lower() if name else "dataset"


def _ensure_schema(conn: Connection, schema: str) -> None:
    with conn.cursor() as cur:
        cur.execute(sql.SQL("CREATE SCHEMA IF NOT EXISTS {}").format(sql.Identifier(schema)))


def _drop_table(conn: Connection, schema: str, table_name: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL("DROP TABLE IF EXISTS {}.{} CASCADE").format(
                sql.Identifier(schema),
                sql.Identifier(table_name),
            )
        )


def _create_table_from_df(conn: Connection, schema: str, table_name: str, df: pd.DataFrame) -> None:
    columns = [
        sql.SQL("{} TEXT").format(sql.Identifier(col))
        for col in df.columns
    ]
    create_sql = sql.SQL("CREATE TABLE IF NOT EXISTS {}.{} ({})").format(
        sql.Identifier(schema),
        sql.Identifier(table_name),
        sql.SQL(", ").join(columns),
    )
    with conn.cursor() as cur:
        cur.execute(create_sql)


def _copy_dataframe(conn: Connection, schema: str, table_name: str, df: pd.DataFrame) -> int:
    csv_buffer = StringIO()
    df.to_csv(csv_buffer, index=False, header=True, na_rep="")
    data = csv_buffer.getvalue()

    with conn.cursor() as cur:
        with cur.copy(f"COPY {schema}.{table_name} FROM STDIN WITH (FORMAT csv, HEADER true, NULL '')") as copy:
            copy.write(data)
    conn.commit()

    with conn.cursor() as cur:
        cur.execute(sql.SQL("SELECT COUNT(*) FROM {}.{}").format(sql.Identifier(schema), sql.Identifier(table_name)))
        return int(cur.fetchone()[0])


def load_dataset_file(path: Path, schema: str = DEFAULT_SCHEMA, replace: bool = False) -> int:
    if not path.exists():
        raise FileNotFoundError(path)

    df = pd.read_csv(path)
    cleaned = _clean_dataframe(df)
    if cleaned.empty:
        raise ValueError(f"No rows left after cleaning: {path}")

    settings = get_settings()
    connection = psycopg.connect(settings.database_url, sslmode="require")
    try:
        _ensure_schema(connection, schema)
        table_name = _table_name_from_path(path)
        if replace:
            _drop_table(connection, schema, table_name)
        _create_table_from_df(connection, schema, table_name, cleaned)
        rows = _copy_dataframe(connection, schema, table_name, cleaned)
        print(f"  {path.name} -> {schema}.{table_name}: {rows:,} rows")
        return rows
    finally:
        connection.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean root-level dataset CSV files and load them into Neon")
    parser.add_argument("--folder", type=Path, default=Path(__file__).resolve().parents[2], help="Root folder containing dataset CSV files")
    parser.add_argument("--schema", default=DEFAULT_SCHEMA, help=f"Schema to write cleaned tables into, e.g. {DEFAULT_SCHEMA}")
    parser.add_argument("--replace", action="store_true", help="Drop and recreate tables before loading")
    args = parser.parse_args()

    csv_files = _discover_csvs(args.folder)
    project_files = [f for f in csv_files if f.name not in {"temp_dataset.csv"}]
    if not project_files:
        raise SystemExit(f"No dataset CSVs found in {args.folder}")

    print(f"Discovered {len(project_files)} CSV files to clean and load")
    for path in project_files:
        load_dataset_file(path, schema=args.schema, replace=args.replace)

    print("Done.")


if __name__ == "__main__":
    main()
