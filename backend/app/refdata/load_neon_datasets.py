"""Bulk-load local datasets into Neon Postgres using COPY.

This is optimized for large CSV/TSV exports and avoids the row-by-row churn that
will choke on multi-hundred-MB files. The loader creates tables under a
`raw_datasets` schema and uses PostgreSQL's COPY FROM STDIN for efficient bulk
inserts.

Examples:
    python -m app.refdata.load_neon_datasets --folder ./datasets
    python -m app.refdata.load_neon_datasets --folder ./datasets --schema raw_datasets --replace
    python -m app.refdata.load_neon_datasets --folder ./datasets/job_skills.csv
"""

from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path
from typing import Iterable

import psycopg
from psycopg import Connection, sql

from app.core.config import get_settings

DEFAULT_SCHEMA = "raw_datasets"


def _sanitize_identifier(value: str, used: set[str]) -> str:
    clean = re.sub(r"[^0-9A-Za-z_]+", "_", value.strip())
    clean = clean.strip("_")
    if not clean:
        clean = "column"
    clean = clean.lower()
    if clean[0].isdigit():
        clean = f"c_{clean}"
    if clean in used:
        base = clean
        idx = 1
        while f"{base}_{idx}" in used:
            idx += 1
        clean = f"{base}_{idx}"
    used.add(clean)
    return clean


def _detect_dialect(path: Path) -> csv.Dialect:
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        sample = handle.read(65536)

    try:
        return csv.Sniffer().sniff(sample or "", delimiters=",;\t|")
    except csv.Error:
        class _Fallback(csv.Dialect):
            delimiter = ","
            quotechar = '"'
            doublequote = True
            skipinitialspace = False
            lineterminator = "\n"
            quoting = csv.QUOTE_MINIMAL

        return _Fallback()


def _read_header(path: Path) -> tuple[list[str], csv.Dialect]:
    dialect = _detect_dialect(path)
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.reader(handle, dialect)
        try:
            raw_header = next(reader)
        except StopIteration:
            raise ValueError(f"CSV file is empty: {path}")

    used: set[str] = set()
    cols = [_sanitize_identifier(col, used) for col in raw_header]
    return cols, dialect


def _table_name_from_path(path: Path) -> str:
    stem = path.stem
    name = re.sub(r"[^0-9A-Za-z_]+", "_", stem).strip("_")
    if not name:
        name = "dataset"
    return name.lower()


def _ensure_schema(conn: Connection, schema: str) -> None:
    with conn.cursor() as cur:
        cur.execute(sql.SQL("CREATE SCHEMA IF NOT EXISTS {}" ).format(sql.Identifier(schema)))


def _drop_table(conn: Connection, schema: str, table_name: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL("DROP TABLE IF EXISTS {}.{} CASCADE").format(
                sql.Identifier(schema),
                sql.Identifier(table_name),
            )
        )


def _create_table(conn: Connection, schema: str, table_name: str, columns: Iterable[str]) -> None:
    column_defs = [
        sql.SQL("{} TEXT").format(sql.Identifier(column))
        for column in columns
    ]
    query = sql.SQL("CREATE TABLE IF NOT EXISTS {}.{} ({})").format(
        sql.Identifier(schema),
        sql.Identifier(table_name),
        sql.SQL(", ").join(column_defs),
    )
    with conn.cursor() as cur:
        cur.execute(query)


def _copy_csv_to_table(conn: Connection, schema: str, table_name: str, path: Path, dialect: csv.Dialect) -> int:
    quote = dialect.quotechar or '"'
    delimiter = dialect.delimiter
    copy_sql = (
        f"COPY {schema}.{table_name} FROM STDIN WITH "
        f"(FORMAT csv, HEADER true, DELIMITER '{delimiter}', QUOTE '{quote}', NULL '')"
    )
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        with conn.cursor() as cur:
            cur.copy(copy_sql, handle)
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL("SELECT COUNT(*) FROM {}.{}").format(
                sql.Identifier(schema),
                sql.Identifier(table_name),
            )
        )
        return int(cur.fetchone()[0])


def load_file(path: Path, schema: str = DEFAULT_SCHEMA, replace: bool = False) -> int:
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found: {path}")

    settings = get_settings()
    conn = None
    try:
        conn = __import__("psycopg").connect(settings.database_url, sslmode="require")
        _ensure_schema(conn, schema)

        table_name = _table_name_from_path(path)
        columns, dialect = _read_header(path)

        if replace:
            _drop_table(conn, schema, table_name)

        _create_table(conn, schema, table_name, columns)
        row_count = _copy_csv_to_table(conn, schema, table_name, path, dialect)
        conn.commit()
        return row_count
    finally:
        if conn is not None:
            conn.close()


def _discover_files(base_dir: Path) -> list[Path]:
    if base_dir.is_file():
        return [base_dir]
    allowed_suffixes = {".csv", ".tsv", ".txt", ".parquet"}
    files = []
    for path in sorted(base_dir.rglob("*")):
        if path.is_file() and path.suffix.lower() in allowed_suffixes:
            files.append(path)
    return files


def main() -> None:
    parser = argparse.ArgumentParser(description="Bulk-load CSV/TSV/Parquet datasets into Neon Postgres")
    parser.add_argument("--folder", type=Path, help="Folder containing dataset files")
    parser.add_argument("--schema", default=DEFAULT_SCHEMA, help=f"Postgres schema to write into (default: {DEFAULT_SCHEMA})")
    parser.add_argument("--replace", action="store_true", help="Drop and recreate each table before loading")
    args = parser.parse_args()

    target = args.folder or Path(__file__).resolve().parents[3]
    files = _discover_files(target)
    if not files:
        raise SystemExit(f"No dataset files found under {target}")

    print(f"Found {len(files)} dataset files under {target}")
    for path in files:
        print(f"Loading {path.name} -> {args.schema}.{_table_name_from_path(path)} ...")
        rows = load_file(path, schema=args.schema, replace=args.replace)
        print(f"  rows inserted: {rows:,}")


if __name__ == "__main__":
    main()
