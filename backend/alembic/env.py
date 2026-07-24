from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.database import Base, DATABASE_URL

# Import all active SQLAlchemy models so they are registered
# inside Base.metadata before Alembic compares schemas.
from app import models  # noqa: F401


# --------------------------------------------------
# Alembic Configuration
# --------------------------------------------------

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# Use the same database URL as the FastAPI application.
# Escaping "%" prevents ConfigParser interpolation errors.
config.set_main_option(
    "sqlalchemy.url",
    DATABASE_URL.replace("%", "%%"),
)


target_metadata = Base.metadata


# --------------------------------------------------
# Autogenerate Protection
# --------------------------------------------------

def include_object(
    object_,
    name,
    type_,
    reflected,
    compare_to,
):
    """
    Protect existing database-only tables from accidental deletion.

    Some operational tables already exist in PostgreSQL but are not yet
    represented in the active app/models package.

    When Alembic reflects one of those tables and cannot find a matching
    SQLAlchemy model, compare_to is None. Returning False prevents
    autogenerate from creating a DROP TABLE operation for it.
    """

    if (
        type_ == "table"
        and reflected
        and compare_to is None
    ):
        return False

    return True


# --------------------------------------------------
# Offline Migrations
# --------------------------------------------------

def run_migrations_offline() -> None:
    """
    Run migrations without creating a live database connection.

    Alembic generates SQL using the configured database URL.
    """

    url = config.get_main_option(
        "sqlalchemy.url"
    )

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named",
        },
        compare_type=True,
        compare_server_default=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


# --------------------------------------------------
# Online Migrations
# --------------------------------------------------

def run_migrations_online() -> None:
    """
    Run migrations using a live database connection.
    """

    configuration = config.get_section(
        config.config_ini_section,
        {},
    )

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


# --------------------------------------------------
# Migration Entry Point
# --------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()