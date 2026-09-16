"""Versioned PostgreSQL schema contract for the V1.0 bootstrap baseline."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import Connection


CONTRACT_REVISION = "c4e91a7b2d30"
SCHEMA_NAME = "public"


def _column(
    data_type: str,
    nullable: bool,
    default: str | None = None,
) -> tuple[str, bool, str | None]:
    return data_type, nullable, default


TABLE_COLUMNS: dict[
    str,
    dict[str, tuple[str, bool, str | None]],
] = {
    "companies": {
        "id": _column("integer", False, "nextval"),
        "company_name": _column("character varying(255)", False),
        "mine_name": _column("character varying(255)", False),
        "is_active": _column("boolean", True, "true"),
        "created_at": _column("timestamp with time zone", True, "now"),
    },
    "users": {
        "id": _column("integer", False, "nextval"),
        "company_id": _column("integer", False),
        "full_name": _column("character varying(255)", False),
        "email": _column("character varying(255)", False),
        "hashed_password": _column("character varying(255)", False),
        "role": _column("character varying(100)", True, "Viewer"),
        "is_active": _column("boolean", True, "true"),
        "created_at": _column("timestamp with time zone", True, "now"),
        "updated_at": _column("timestamp without time zone", True, "current_timestamp"),
    },
    "company_settings": {
        "id": _column("integer", False, "nextval"),
        "company_name": _column("character varying(255)", False),
        "company_name_en": _column("character varying(255)", True),
        "company_name_mn": _column("character varying(255)", True),
        "logo_url": _column("text", True),
        "primary_color": _column("character varying(20)", True, "#16A34A"),
        "secondary_color": _column("character varying(20)", True, "#1E293B"),
        "timezone": _column("character varying(100)", True, "Asia/Ulaanbaatar"),
        "language": _column("character varying(50)", True, "English"),
        "created_at": _column("timestamp without time zone", True, "current_timestamp"),
        "updated_at": _column("timestamp without time zone", True, "current_timestamp"),
    },
    "mine_settings": {
        "id": _column("integer", False, "nextval"),
        "company_id": _column("integer", True),
        "mine_name": _column("character varying(255)", False),
        "mine_name_en": _column("character varying(255)", True),
        "mine_name_mn": _column("character varying(255)", True),
        "site_code": _column("character varying(50)", True),
        "location": _column("character varying(255)", True),
        "mine_type": _column("character varying(100)", True),
        "shift_pattern": _column("character varying(100)", True),
        "operating_hours": _column("character varying(100)", True),
        "calendar_type": _column("character varying(100)", True),
        "created_at": _column("timestamp without time zone", True, "current_timestamp"),
        "updated_at": _column("timestamp without time zone", True, "current_timestamp"),
    },
    "kpi_targets": {
        "id": _column("integer", False, "nextval"),
        "mine_id": _column("integer", True),
        "kpi_name": _column("character varying(255)", False),
        "kpi_code": _column("character varying(100)", True),
        "kpi_category": _column("character varying(100)", True),
        "target_value": _column("numeric(18,2)", True),
        "unit": _column("character varying(50)", True),
        "warning_threshold": _column("numeric(18,2)", True),
        "critical_threshold": _column("numeric(18,2)", True),
        "direction": _column("character varying(50)", True, "higher_is_better"),
        "is_executive": _column("boolean", True, "false"),
        "is_active": _column("boolean", True, "true"),
        "created_at": _column("timestamp without time zone", True, "current_timestamp"),
        "updated_at": _column("timestamp without time zone", True, "current_timestamp"),
    },
    "alert_thresholds": {
        "id": _column("integer", False, "nextval"),
        "mine_id": _column("integer", True),
        "alert_name": _column("character varying(255)", False),
        "kpi_name": _column("character varying(255)", True),
        "warning_value": _column("numeric(18,2)", True),
        "critical_value": _column("numeric(18,2)", True),
        "unit": _column("character varying(50)", True),
        "alert_level": _column("character varying(50)", True, "medium"),
        "created_at": _column("timestamp without time zone", True, "current_timestamp"),
        "updated_at": _column("timestamp without time zone", True, "current_timestamp"),
    },
    "shift_patterns": {
        "id": _column("integer", False, "nextval"),
        "mine_id": _column("integer", True),
        "shift_name": _column("character varying(100)", False),
        "start_time": _column("time without time zone", False),
        "end_time": _column("time without time zone", False),
        "shift_type": _column("character varying(50)", True),
        "is_active": _column("boolean", True, "true"),
        "created_at": _column("timestamp without time zone", True, "current_timestamp"),
        "updated_at": _column("timestamp without time zone", True, "current_timestamp"),
    },
    "production_daily": {
        "id": _column("integer", False, "nextval"),
        "report_date": _column("date", False),
        "ore_plan": _column("numeric", True),
        "ore_actual": _column("numeric", True),
        "waste_plan": _column("numeric", True),
        "waste_actual": _column("numeric", True),
        "product_coal": _column("numeric", True),
        "ash_pct": _column("numeric", True),
        "moisture_pct": _column("numeric", True),
        "calorific_value": _column("numeric", True),
        "created_at": _column("timestamp without time zone", True, "current_timestamp"),
        "mine_name": _column("character varying(100)", False),
        "company_id": _column("integer", False),
        "mine_id": _column("integer", False),
    },
    "fleet_daily": {
        "id": _column("integer", False, "nextval"),
        "report_date": _column("date", False),
        "mine_name": _column("character varying(100)", True),
        "availability": _column("numeric", True),
        "utilization": _column("numeric", True),
        "created_at": _column("timestamp without time zone", True, "current_timestamp"),
        "company_id": _column("integer", False),
        "mine_id": _column("integer", False),
    },
    "plant_daily": {
        "id": _column("integer", False, "nextval"),
        "report_date": _column("date", False),
        "mine_name": _column("character varying(100)", False),
        "throughput_plan": _column("numeric", True),
        "throughput_actual": _column("numeric", True),
        "recovery": _column("numeric", True),
        "availability": _column("numeric", True),
        "created_at": _column("timestamp without time zone", True, "current_timestamp"),
        "company_id": _column("integer", False),
        "mine_id": _column("integer", False),
    },
    "safety_daily": {
        "id": _column("integer", False, "nextval"),
        "report_date": _column("date", False),
        "mine_name": _column("character varying(100)", False),
        "incidents": _column("integer", True, "0"),
        "near_misses": _column("integer", True, "0"),
        "critical_risks": _column("integer", True, "0"),
        "safety_score": _column("numeric", True, "100"),
        "created_at": _column("timestamp without time zone", True, "current_timestamp"),
        "company_id": _column("integer", False),
        "mine_id": _column("integer", False),
    },
    "upload_logs": {
        "id": _column("integer", False, "nextval"),
        "report_type": _column("character varying(50)", False),
        "file_name": _column("character varying(255)", False),
        "uploaded_by": _column("character varying(100)", True),
        "status": _column("character varying(50)", True, "Success"),
        "uploaded_at": _column("timestamp without time zone", True, "current_timestamp"),
        "company_id": _column("integer", True),
        "mine_id": _column("integer", True),
    },
    "report_history": {
        "id": _column("integer", False, "nextval"),
        "report_key": _column("character varying(100)", False),
        "report_name": _column("character varying(255)", False),
        "report_format": _column("character varying(20)", False),
        "filename": _column("character varying(500)", False),
        "file_size_bytes": _column("bigint", True),
        "generated_by": _column("character varying(255)", True),
        "company_name": _column("character varying(255)", True),
        "mine_name": _column("character varying(255)", True),
        "status": _column("character varying(50)", False, "completed"),
        "error_message": _column("text", True),
        "generated_at": _column("timestamp with time zone", False, "now"),
        "company_id": _column("integer", False),
        "mine_id": _column("integer", False),
    },
    "executive_actions": {
        "id": _column("integer", False, "nextval"),
        "action_key": _column("character varying(255)", False),
        "kpi_key": _column("character varying(100)", False),
        "kpi_name": _column("character varying(255)", True),
        "linked_cause": _column("character varying(50)", True),
        "title": _column("character varying(500)", False),
        "description": _column("text", True),
        "priority": _column("character varying(50)", False, "medium"),
        "owner": _column("character varying(255)", True),
        "timing": _column("character varying(255)", True),
        "expected_benefit": _column("text", True),
        "status": _column("character varying(50)", False, "open"),
        "due_date": _column("date", True),
        "completed_at": _column("timestamp with time zone", True),
        "created_at": _column("timestamp with time zone", False, "now"),
        "updated_at": _column("timestamp with time zone", False, "now"),
        "company_id": _column("integer", False),
        "mine_id": _column("integer", False),
        "source": _column("character varying(50)", True),
        "category": _column("character varying(100)", True),
    },
    "audit_logs": {
        "id": _column("integer", False, "nextval"),
        "company_id": _column("integer", False),
        "actor_user_id": _column("integer", True),
        "actor_name": _column("character varying(255)", True),
        "actor_email": _column("character varying(255)", True),
        "action": _column("character varying(100)", False),
        "entity_type": _column("character varying(100)", False),
        "entity_id": _column("integer", True),
        "entity_name": _column("character varying(255)", True),
        "description": _column("text", True),
        "status": _column("character varying(50)", False, "SUCCESS"),
        "ip_address": _column("character varying(100)", True),
        "created_at": _column("timestamp with time zone", False, "now"),
    },
}


PRIMARY_KEYS = {table: ("id",) for table in TABLE_COLUMNS}

UNIQUE_CONSTRAINTS = {
    "users": {"users_email_key": ("email",)},
    "production_daily": {
        "uq_production_daily_tenant_date": (
            "company_id", "mine_id", "report_date",
        ),
    },
    "fleet_daily": {
        "uq_fleet_daily_tenant_date": (
            "company_id", "mine_id", "report_date",
        ),
    },
    "plant_daily": {
        "uq_plant_daily_tenant_date": (
            "company_id", "mine_id", "report_date",
        ),
    },
    "safety_daily": {
        "uq_safety_daily_tenant_date": (
            "company_id", "mine_id", "report_date",
        ),
    },
    "executive_actions": {
        "uq_executive_actions_tenant_action_key": (
            "company_id", "mine_id", "action_key",
        ),
    },
}

FOREIGN_KEYS = {
    "users": {
        "users_company_id_fkey": (
            ("company_id",), "companies", ("id",), "NO ACTION",
        ),
    },
    "mine_settings": {
        "mine_settings_company_id_fkey": (
            ("company_id",), "company_settings", ("id",), "CASCADE",
        ),
    },
    "kpi_targets": {
        "kpi_targets_mine_id_fkey": (
            ("mine_id",), "mine_settings", ("id",), "CASCADE",
        ),
    },
    "alert_thresholds": {
        "alert_thresholds_mine_id_fkey": (
            ("mine_id",), "mine_settings", ("id",), "CASCADE",
        ),
    },
    "shift_patterns": {
        "shift_patterns_mine_id_fkey": (
            ("mine_id",), "mine_settings", ("id",), "CASCADE",
        ),
    },
    **{
        table: {
            f"fk_{table}_company_id": (
                ("company_id",), "company_settings", ("id",), "RESTRICT",
            ),
            f"fk_{table}_mine_id": (
                ("mine_id",), "mine_settings", ("id",), "RESTRICT",
            ),
        }
        for table in (
            "production_daily", "fleet_daily", "plant_daily", "safety_daily",
        )
    },
    "report_history": {
        "fk_report_history_company_id": (
            ("company_id",), "company_settings", ("id",), "RESTRICT",
        ),
        "fk_report_history_mine_id": (
            ("mine_id",), "mine_settings", ("id",), "RESTRICT",
        ),
    },
    "executive_actions": {
        "fk_executive_actions_company_id": (
            ("company_id",), "company_settings", ("id",), "RESTRICT",
        ),
        "fk_executive_actions_mine_id": (
            ("mine_id",), "mine_settings", ("id",), "RESTRICT",
        ),
    },
    "audit_logs": {
        "audit_logs_company_id_fkey": (
            ("company_id",), "companies", ("id",), "CASCADE",
        ),
        "audit_logs_actor_user_id_fkey": (
            ("actor_user_id",), "users", ("id",), "SET NULL",
        ),
    },
}

INDEXES = {
    "users": {
        "ix_users_email": (True, ("email",)),
        "ix_users_company_id": (False, ("company_id",)),
    },
    **{
        table: {
            f"ix_{table}_company_id": (False, ("company_id",)),
            f"ix_{table}_mine_id": (False, ("mine_id",)),
            f"ix_{table}_tenant_date": (
                False, ("company_id", "mine_id", "report_date"),
            ),
        }
        for table in (
            "production_daily", "fleet_daily", "plant_daily", "safety_daily",
        )
    },
    "upload_logs": {
        "ix_upload_logs_company_id": (False, ("company_id",)),
        "ix_upload_logs_mine_id": (False, ("mine_id",)),
        "ix_upload_logs_tenant": (False, ("company_id", "mine_id")),
    },
    "report_history": {
        "ix_public_report_history_id": (False, ("id",)),
        "ix_public_report_history_report_key": (False, ("report_key",)),
        "ix_public_report_history_report_format": (False, ("report_format",)),
        "ix_public_report_history_status": (False, ("status",)),
        "ix_public_report_history_generated_at": (False, ("generated_at",)),
        "ix_report_history_company_id": (False, ("company_id",)),
        "ix_report_history_mine_id": (False, ("mine_id",)),
        "ix_report_history_tenant": (False, ("company_id", "mine_id")),
        "ix_report_history_tenant_generated_at": (
            False, ("company_id", "mine_id", "generated_at"),
        ),
    },
    "executive_actions": {
        "ix_executive_actions_id": (False, ("id",)),
        "ix_executive_actions_action_key": (False, ("action_key",)),
        "ix_executive_actions_kpi_key": (False, ("kpi_key",)),
        "ix_executive_actions_status": (False, ("status",)),
        "ix_executive_actions_company_id": (False, ("company_id",)),
        "ix_executive_actions_mine_id": (False, ("mine_id",)),
        "ix_executive_actions_tenant": (
            False, ("company_id", "mine_id"),
        ),
        "ix_executive_actions_tenant_status": (
            False, ("company_id", "mine_id", "status"),
        ),
    },
    "audit_logs": {
        "ix_public_audit_logs_id": (False, ("id",)),
        "ix_public_audit_logs_company_id": (False, ("company_id",)),
        "ix_public_audit_logs_actor_user_id": (False, ("actor_user_id",)),
        "ix_public_audit_logs_action": (False, ("action",)),
    },
}


def _actual_type(row: Mapping[str, Any]) -> str:
    data_type = str(row["data_type"])
    if data_type == "character varying":
        return f"character varying({row['character_maximum_length']})"
    if data_type == "numeric" and row["numeric_precision"] is not None:
        return f"numeric({row['numeric_precision']},{row['numeric_scale']})"
    return data_type


def _default_matches(actual: str | None, expected: str | None) -> bool:
    if expected is None:
        return actual is None
    normalized = str(actual or "").lower()
    if expected == "nextval":
        return normalized.startswith("nextval(")
    if expected == "now":
        return normalized in {"now()", "current_timestamp"}
    if expected == "current_timestamp":
        return normalized in {"current_timestamp", "now()"}
    return expected.lower() in normalized


def verify_schema_contract(
    connection: Connection,
    *,
    allow_alembic_version: bool = False,
) -> list[str]:
    """Return all differences between PostgreSQL and the V1.0 contract."""

    errors: list[str] = []
    expected_tables = set(TABLE_COLUMNS)
    if allow_alembic_version:
        expected_tables.add("alembic_version")

    actual_tables = {
        row[0]
        for row in connection.execute(
            text(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = :schema
                  AND table_type = 'BASE TABLE'
                """
            ),
            {"schema": SCHEMA_NAME},
        )
    }
    if actual_tables != expected_tables:
        errors.append(
            "table set differs: "
            f"missing={sorted(expected_tables - actual_tables)}, "
            f"unexpected={sorted(actual_tables - expected_tables)}"
        )

    column_rows = connection.execute(
        text(
            """
            SELECT table_name, column_name, data_type,
                   character_maximum_length, numeric_precision,
                   numeric_scale, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = :schema
            ORDER BY table_name, ordinal_position
            """
        ),
        {"schema": SCHEMA_NAME},
    ).mappings()
    actual_columns: dict[str, dict[str, Mapping[str, Any]]] = {}
    for row in column_rows:
        if row["table_name"] == "alembic_version" and allow_alembic_version:
            continue
        actual_columns.setdefault(row["table_name"], {})[row["column_name"]] = row

    for table, expected_columns in TABLE_COLUMNS.items():
        rows = actual_columns.get(table, {})
        if set(rows) != set(expected_columns):
            errors.append(
                f"{table} columns differ: "
                f"missing={sorted(set(expected_columns) - set(rows))}, "
                f"unexpected={sorted(set(rows) - set(expected_columns))}"
            )
            continue
        for name, (data_type, nullable, default) in expected_columns.items():
            row = rows[name]
            actual_spec = (
                _actual_type(row), row["is_nullable"] == "YES",
            )
            if actual_spec != (data_type, nullable):
                errors.append(
                    f"{table}.{name} type/nullability is {actual_spec}, "
                    f"expected {(data_type, nullable)}"
                )
            if not _default_matches(row["column_default"], default):
                errors.append(
                    f"{table}.{name} default is {row['column_default']!r}, "
                    f"expected {default!r}"
                )

    constraint_rows = connection.execute(
        text(
            """
            SELECT con.conname, rel.relname AS table_name, con.contype,
                   array_agg(att.attname ORDER BY keys.ordinality) AS columns,
                   ref.relname AS referenced_table,
                   CASE WHEN con.contype = 'f' THEN
                     (SELECT array_agg(ratt.attname ORDER BY rkeys.ordinality)
                      FROM unnest(con.confkey) WITH ORDINALITY AS rkeys(attnum, ordinality)
                      JOIN pg_attribute AS ratt
                        ON ratt.attrelid = con.confrelid
                       AND ratt.attnum = rkeys.attnum)
                   END AS referenced_columns,
                   CASE con.confdeltype
                     WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
                     WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL'
                     WHEN 'd' THEN 'SET DEFAULT'
                   END AS on_delete
            FROM pg_constraint AS con
            JOIN pg_class AS rel ON rel.oid = con.conrelid
            JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
            JOIN unnest(con.conkey) WITH ORDINALITY AS keys(attnum, ordinality)
              ON true
            JOIN pg_attribute AS att
              ON att.attrelid = con.conrelid AND att.attnum = keys.attnum
            LEFT JOIN pg_class AS ref ON ref.oid = con.confrelid
            WHERE ns.nspname = :schema AND con.contype IN ('p', 'u', 'f')
            GROUP BY con.oid, con.conname, rel.relname, con.contype,
                     ref.relname, con.confrelid, con.confkey, con.confdeltype
            """
        ),
        {"schema": SCHEMA_NAME},
    ).mappings()
    actual_pk: dict[str, tuple[str, ...]] = {}
    actual_unique: dict[str, dict[str, tuple[str, ...]]] = {}
    actual_fk: dict[str, dict[str, tuple[Any, ...]]] = {}
    for row in constraint_rows:
        table = row["table_name"]
        if table == "alembic_version" and allow_alembic_version:
            continue
        columns = tuple(row["columns"])
        if row["contype"] == "p":
            actual_pk[table] = columns
        elif row["contype"] == "u":
            actual_unique.setdefault(table, {})[row["conname"]] = columns
        else:
            actual_fk.setdefault(table, {})[row["conname"]] = (
                columns,
                row["referenced_table"],
                tuple(row["referenced_columns"]),
                row["on_delete"],
            )

    if actual_pk != PRIMARY_KEYS:
        errors.append("primary-key contract differs")
    if actual_unique != UNIQUE_CONSTRAINTS:
        errors.append("unique-constraint contract differs")
    if actual_fk != FOREIGN_KEYS:
        errors.append("foreign-key contract differs")

    index_rows = connection.execute(
        text(
            """
            SELECT rel.relname AS table_name, idx.relname AS index_name,
                   ind.indisunique,
                   array_agg(att.attname ORDER BY keys.ordinality) AS columns
            FROM pg_index AS ind
            JOIN pg_class AS rel ON rel.oid = ind.indrelid
            JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
            JOIN pg_class AS idx ON idx.oid = ind.indexrelid
            JOIN unnest(ind.indkey) WITH ORDINALITY AS keys(attnum, ordinality)
              ON keys.attnum > 0
            JOIN pg_attribute AS att
              ON att.attrelid = rel.oid AND att.attnum = keys.attnum
            WHERE ns.nspname = :schema
              AND NOT EXISTS (
                  SELECT 1 FROM pg_constraint AS con
                  WHERE con.conindid = ind.indexrelid
              )
            GROUP BY rel.relname, idx.relname, ind.indisunique
            """
        ),
        {"schema": SCHEMA_NAME},
    ).mappings()
    actual_indexes: dict[str, dict[str, tuple[bool, tuple[str, ...]]]] = {}
    for row in index_rows:
        if row["table_name"] == "alembic_version" and allow_alembic_version:
            continue
        actual_indexes.setdefault(row["table_name"], {})[row["index_name"]] = (
            row["indisunique"], tuple(row["columns"]),
        )
    actual_indexes = {table: value for table, value in actual_indexes.items() if value}
    if actual_indexes != INDEXES:
        errors.append("non-constraint index contract differs")

    sequence_names = {
        row[0]
        for row in connection.execute(
            text(
                """
                SELECT sequence_name
                FROM information_schema.sequences
                WHERE sequence_schema = :schema
                """
            ),
            {"schema": SCHEMA_NAME},
        )
    }
    expected_sequences = {f"{table}_id_seq" for table in TABLE_COLUMNS}
    if sequence_names != expected_sequences:
        errors.append(
            "sequence set differs: "
            f"missing={sorted(expected_sequences - sequence_names)}, "
            f"unexpected={sorted(sequence_names - expected_sequences)}"
        )

    return errors
