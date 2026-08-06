from sqlalchemy import text

from app.database import engine


TABLES = [
    "production_daily",
    "fleet_daily",
    "plant_daily",
    "safety_daily",
]


def main():
    with engine.connect() as connection:
        for table_name in TABLES:
            print()
            print("=" * 70)
            print(table_name)
            print("=" * 70)

            rows = connection.execute(
                text(
                    f"""
                    SELECT *
                    FROM {table_name}
                    ORDER BY report_date ASC
                    LIMIT 15
                    """
                )
            ).mappings().all()

            if not rows:
                print("No rows found.")
                continue

            for row in rows:
                print(dict(row))


if __name__ == "__main__":
    main()