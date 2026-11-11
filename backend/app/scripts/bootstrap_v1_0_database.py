"""Guarded Mine Manager AI V1.0 bootstrap for empty PostgreSQL databases."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Engine, make_url

import app.database as database_module
from app.database import DATABASE_URL
from app.scripts.v1_0_schema_contract import (
    CONTRACT_REVISION,
    TABLE_COLUMNS,
    verify_schema_contract,
)


BACKEND_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_ARTIFACT = BACKEND_ROOT / "schema" / "v1_0_c4e91a7b2d30.sql"
ALEMBIC_INI = BACKEND_ROOT / "alembic.ini"

AZURE_HOST_MARKERS = (
    ".database.azure.com",
    ".postgres.database.azure.com",
    "database.windows.net",
)


class BootstrapRefused(RuntimeError):
    """Raised when an empty-installation safety condition is not satisfied."""


def _relation_inventory(connection: Connection) -> list[dict[str, Any]]:
    return [
        dict(row)
        for row in connection.execute(
            text(
                """
                SELECT ns.nspname AS schema_name,
                       rel.relname AS relation_name,
                       rel.relkind AS relation_kind
                FROM pg_class AS rel
                JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
                WHERE ns.nspname NOT IN ('pg_catalog', 'information_schema')
                  AND ns.nspname NOT LIKE 'pg_toast%'
                  AND rel.relkind IN ('r', 'p', 'S', 'v', 'm', 'f')
                ORDER BY ns.nspname, rel.relname
                """
            )
        ).mappings()
    ]


def assert_empty_database(connection: Connection) -> None:
    """Fail closed when any user relation or Alembic state exists."""

    relations = _relation_inventory(connection)
    if not relations:
        return

    alembic_present = any(
        item["relation_name"] == "alembic_version"
        for item in relations
    )
    relation_preview = ", ".join(
        f"{item['schema_name']}.{item['relation_name']}"
        for item in relations[:10]
    )
    reason = (
        "an Alembic revision table already exists"
        if alembic_present
        else "the database contains user/application relations"
    )
    raise BootstrapRefused(
        "V1.0 bootstrap refused because "
        f"{reason}: {relation_preview}. "
        "This command is only for a genuinely empty new database."
    )


def assert_safe_target(
    *,
    database_url: str,
    confirmed_database_name: str,
) -> None:
    """Reject Azure/blocked hosts and require exact database-name confirmation."""

    url = make_url(database_url)
    hostname = (url.host or "").strip().lower()
    database_name = (url.database or "").strip()

    if not hostname or not database_name:
        raise BootstrapRefused(
            "V1.0 bootstrap refused because database host/name is incomplete."
        )

    blocked_hosts = {
        value.strip().lower()
        for value in os.getenv("BOOTSTRAP_BLOCKED_HOSTS", "").split(",")
        if value.strip()
    }
    if (
        any(marker in hostname for marker in AZURE_HOST_MARKERS)
        or hostname in blocked_hosts
    ):
        raise BootstrapRefused(
            "V1.0 bootstrap refused for an Azure or explicitly blocked host."
        )

    if confirmed_database_name != database_name:
        raise BootstrapRefused(
            "V1.0 bootstrap refused because --confirm-database-name does not "
            "exactly match the configured target database."
        )


def _make_engine(database_url: str) -> Engine:
    sslmode = os.getenv("DB_SSLMODE", "require")
    return create_engine(
        database_url,
        connect_args={"sslmode": sslmode},
        pool_pre_ping=True,
    )


def _alembic_config() -> Config:
    config = Config(str(ALEMBIC_INI))
    config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    return config


def alembic_head() -> str:
    """Return the single migration head, which must descend from the baseline."""

    script = ScriptDirectory.from_config(_alembic_config())
    heads = script.get_heads()
    if len(heads) != 1:
        raise RuntimeError(
            f"Expected exactly one Alembic head; found {sorted(heads)}."
        )
    head = heads[0]
    lineage = {
        revision.revision
        for revision in script.walk_revisions(base="base", head=head)
    }
    if CONTRACT_REVISION not in lineage:
        raise RuntimeError(
            f"Alembic head {head} does not descend from the V1.0 baseline "
            f"{CONTRACT_REVISION}."
        )
    return head


def _run_alembic(database_url: str, operation: str) -> None:
    """Run Alembic against the already-confirmed bootstrap target URL."""

    original_url = database_module.DATABASE_URL
    database_module.DATABASE_URL = database_url
    try:
        if operation == "stamp":
            command.stamp(_alembic_config(), CONTRACT_REVISION)
        elif operation == "upgrade":
            command.upgrade(_alembic_config(), "head")
        else:
            raise ValueError(f"Unsupported Alembic operation: {operation}")
    finally:
        database_module.DATABASE_URL = original_url


def _read_alembic_revision(connection: Connection) -> str | None:
    exists = connection.execute(
        text("SELECT to_regclass('public.alembic_version')")
    ).scalar_one()
    if exists is None:
        return None
    revisions = connection.execute(
        text("SELECT version_num FROM public.alembic_version")
    ).scalars().all()
    if len(revisions) != 1:
        raise RuntimeError(
            "Expected one Alembic revision after stamp; "
            f"found {len(revisions)}."
        )
    return str(revisions[0])


def bootstrap_database(
    *,
    database_url: str,
    confirmed_database_name: str,
) -> dict[str, Any]:
    """Create, verify, stamp, and upgrade a fresh DB to the Alembic head."""

    assert_safe_target(
        database_url=database_url,
        confirmed_database_name=confirmed_database_name,
    )
    if not SCHEMA_ARTIFACT.is_file():
        raise RuntimeError(f"Schema artifact not found: {SCHEMA_ARTIFACT}")
    # Resolve the target before any DDL so a broken migration tree cannot
    # leave a half-initialized database behind.
    head_revision = alembic_head()

    schema_sql = SCHEMA_ARTIFACT.read_text(encoding="utf-8")
    engine = _make_engine(database_url)

    try:
        with engine.begin() as connection:
            actual_database = connection.execute(
                text("SELECT current_database()")
            ).scalar_one()
            if actual_database != confirmed_database_name:
                raise BootstrapRefused(
                    "Connected database does not match the explicit confirmation."
                )
            assert_empty_database(connection)

            connection.exec_driver_sql(schema_sql)
            differences = verify_schema_contract(connection)
            if differences:
                raise RuntimeError(
                    "V1.0 schema verification failed before Alembic stamp:\n- "
                    + "\n- ".join(differences)
                )

        _run_alembic(database_url, "stamp")

        with engine.connect() as connection:
            revision = _read_alembic_revision(connection)
            if revision != CONTRACT_REVISION:
                raise RuntimeError(
                    f"Alembic stamp verification failed: {revision!r}"
                )
            differences = verify_schema_contract(
                connection,
                allow_alembic_version=True,
            )
            if differences:
                raise RuntimeError(
                    "Post-stamp schema verification failed:\n- "
                    + "\n- ".join(differences)
                )

        # Migrations after the baseline intentionally change the schema, so
        # the baseline contract (checked before and after the stamp) is not
        # re-checked once the upgrade has run.
        _run_alembic(database_url, "upgrade")

        with engine.connect() as connection:
            revision = _read_alembic_revision(connection)
        if revision != head_revision:
            raise RuntimeError(
                "alembic upgrade head did not reach the migration head: "
                f"database is at {revision!r}, head is {head_revision!r}."
            )

        return {
            "database": confirmed_database_name,
            "baseline_revision": CONTRACT_REVISION,
            "schema_revision": revision,
            "baseline_tables": len(TABLE_COLUMNS),
            "status": "ready",
        }
    finally:
        engine.dispose()


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Bootstrap an EMPTY new Mine Manager AI PostgreSQL database from "
            f"the V1.0 {CONTRACT_REVISION} schema contract, then upgrade it "
            "to the Alembic head."
        )
    )
    parser.add_argument(
        "--confirm-empty-installation",
        action="store_true",
        help="Required acknowledgement that the target is a new empty database.",
    )
    parser.add_argument(
        "--confirm-database-name",
        required=True,
        help="Must exactly equal DB_NAME from the active backend environment.",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    if not args.confirm_empty_installation:
        raise BootstrapRefused(
            "V1.0 bootstrap refused without --confirm-empty-installation."
        )
    result = bootstrap_database(
        database_url=DATABASE_URL,
        confirmed_database_name=args.confirm_database_name,
    )
    print(
        "V1.0 database bootstrap complete: "
        f"database={result['database']}, "
        f"baseline={result['baseline_revision']}, "
        f"revision={result['schema_revision']}, "
        f"baseline_tables={result['baseline_tables']}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
