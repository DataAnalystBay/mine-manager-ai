from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.company import CompanySettings
from app.models.mine import MineSettings
from app.models.kpi_target import KpiTarget
from app.models.alert_threshold import AlertThreshold


COMPANY_NAME = "Achit-Ikht LLC"
MINE_NAME = "Achit-Ikht Copper Cathode Operation"


KPI_CONFIG = [
    {
        "kpi_name": "Cathode Production",
        "kpi_category": "Production",
        "target_value": 10000,
        "unit": "t/year",
        "warning_threshold": 9700,
        "critical_threshold": 9300,
        "direction": "higher_is_better",
    },
    {
        "kpi_name": "Production Plan Attainment",
        "kpi_category": "Production",
        "target_value": 98.0,
        "unit": "%",
        "warning_threshold": 97.0,
        "critical_threshold": 93.0,
        "direction": "higher_is_better",
    },
    {
        "kpi_name": "Cu Recovery",
        "kpi_category": "Plant",
        "target_value": 77.0,
        "unit": "%",
        "warning_threshold": 76.0,
        "critical_threshold": 73.0,
        "direction": "higher_is_better",
    },
    {
        "kpi_name": "Plant Availability",
        "kpi_category": "Plant",
        "target_value": 93.0,
        "unit": "%",
        "warning_threshold": 92.0,
        "critical_threshold": 85.0,
        "direction": "higher_is_better",
    },
    {
        "kpi_name": "Plant Utilization",
        "kpi_category": "Plant",
        "target_value": 90.0,
        "unit": "%",
        "warning_threshold": 88.0,
        "critical_threshold": 82.0,
        "direction": "higher_is_better",
    },
    {
        "kpi_name": "EW Current Efficiency",
        "kpi_category": "Plant",
        "target_value": 92.0,
        "unit": "%",
        "warning_threshold": 90.0,
        "critical_threshold": 86.0,
        "direction": "higher_is_better",
    },
    {
        "kpi_name": "PLS Cu Grade",
        "kpi_category": "Plant",
        "target_value": 2.55,
        "unit": "g/L",
        "warning_threshold": 2.35,
        "critical_threshold": 2.15,
        "direction": "higher_is_better",
    },
    {
        "kpi_name": "Acid Consumption",
        "kpi_category": "Plant",
        "target_value": 4.0,
        "unit": "kg/t",
        "warning_threshold": 4.3,
        "critical_threshold": 4.7,
        "direction": "lower_is_better",
    },
    {
        "kpi_name": "Power Consumption",
        "kpi_category": "Plant",
        "target_value": 2250,
        "unit": "kWh/t",
        "warning_threshold": 2350,
        "critical_threshold": 2500,
        "direction": "lower_is_better",
    },
    {
        "kpi_name": "TRIFR",
        "kpi_category": "Safety",
        "target_value": 2.0,
        "unit": "per 1M hours",
        "warning_threshold": 2.5,
        "critical_threshold": 4.0,
        "direction": "lower_is_better",
    },
    {
        "kpi_name": "LTI",
        "kpi_category": "Safety",
        "target_value": 0,
        "unit": "count",
        "warning_threshold": 1,
        "critical_threshold": 1,
        "direction": "lower_is_better",
    },
]


ALERT_CONFIG = [
    {
        "alert_name": "Production Below Plan",
        "kpi_name": "Production Plan Attainment",
        "warning_value": 97.0,
        "critical_value": 93.0,
        "unit": "%",
        "alert_level": "high",
    },
    {
        "alert_name": "Low Copper Recovery",
        "kpi_name": "Cu Recovery",
        "warning_value": 76.0,
        "critical_value": 73.0,
        "unit": "%",
        "alert_level": "high",
    },
    {
        "alert_name": "Low Plant Availability",
        "kpi_name": "Plant Availability",
        "warning_value": 92.0,
        "critical_value": 85.0,
        "unit": "%",
        "alert_level": "high",
    },
    {
        "alert_name": "High Acid Consumption",
        "kpi_name": "Acid Consumption",
        "warning_value": 4.3,
        "critical_value": 4.7,
        "unit": "kg/t",
        "alert_level": "medium",
    },
    {
        "alert_name": "High Power Consumption",
        "kpi_name": "Power Consumption",
        "warning_value": 2350,
        "critical_value": 2500,
        "unit": "kWh/t",
        "alert_level": "medium",
    },
    {
        "alert_name": "Safety LTI",
        "kpi_name": "LTI",
        "warning_value": 1,
        "critical_value": 1,
        "unit": "count",
        "alert_level": "critical",
    },
]


def get_or_create_company(db: Session) -> CompanySettings:
    company = (
        db.query(CompanySettings)
        .filter(CompanySettings.company_name == COMPANY_NAME)
        .first()
    )

    if company:
        print(f"Company already exists: {company.company_name}")
        return company

    company = CompanySettings(
        company_name=COMPANY_NAME,
        logo_url=None,
        primary_color="#0F3D5E",
        secondary_color="#16A34A",
        timezone="Asia/Ulaanbaatar",
        language="mn",
    )

    db.add(company)
    db.flush()

    print(f"Created company: {company.company_name}")

    return company


def get_or_create_mine(
    db: Session,
    company: CompanySettings,
) -> MineSettings:
    mine = (
        db.query(MineSettings)
        .filter(
            MineSettings.company_id == company.id,
            MineSettings.mine_name == MINE_NAME,
        )
        .first()
    )

    if mine:
        print(f"Operation already exists: {mine.mine_name}")
        return mine

    mine = MineSettings(
        company_id=company.id,
        mine_name=MINE_NAME,
        site_code="AIK-SXEW",
        location="Mongolia",
        mine_type="Processing Plant / SX-EW",
        shift_pattern="24/7 Continuous",
        operating_hours=24,
        calendar_type="Calendar Year",
    )

    db.add(mine)
    db.flush()

    print(f"Created operation: {mine.mine_name}")

    return mine


def seed_kpis(
    db: Session,
    mine: MineSettings,
) -> None:
    for config in KPI_CONFIG:
        existing = (
            db.query(KpiTarget)
            .filter(
                KpiTarget.mine_id == mine.id,
                KpiTarget.kpi_name == config["kpi_name"],
            )
            .first()
        )

        if existing:
            existing.kpi_category = config["kpi_category"]
            existing.target_value = config["target_value"]
            existing.unit = config["unit"]
            existing.warning_threshold = config["warning_threshold"]
            existing.critical_threshold = config["critical_threshold"]
            existing.direction = config["direction"]

            print(f"Updated KPI: {config['kpi_name']}")

        else:
            target = KpiTarget(
                mine_id=mine.id,
                **config,
            )

            db.add(target)

            print(f"Created KPI: {config['kpi_name']}")


def seed_alerts(
    db: Session,
    mine: MineSettings,
) -> None:
    for config in ALERT_CONFIG:
        existing = (
            db.query(AlertThreshold)
            .filter(
                AlertThreshold.mine_id == mine.id,
                AlertThreshold.alert_name == config["alert_name"],
            )
            .first()
        )

        if existing:
            existing.kpi_name = config["kpi_name"]
            existing.warning_value = config["warning_value"]
            existing.critical_value = config["critical_value"]
            existing.unit = config["unit"]
            existing.alert_level = config["alert_level"]

            print(f"Updated alert: {config['alert_name']}")

        else:
            alert = AlertThreshold(
                mine_id=mine.id,
                **config,
            )

            db.add(alert)

            print(f"Created alert: {config['alert_name']}")


def seed_achit_ikht_demo():
    db = SessionLocal()

    try:
        print("=" * 60)
        print("Mine Manager AI — Achit-Ikht Demo Configuration")
        print("=" * 60)

        company = get_or_create_company(db)

        mine = get_or_create_mine(
            db,
            company,
        )

        seed_kpis(
            db,
            mine,
        )

        seed_alerts(
            db,
            mine,
        )

        db.commit()

        print()
        print("=" * 60)
        print("Achit-Ikht configuration saved successfully.")
        print("=" * 60)

        print(f"Company ID: {company.id}")
        print(f"Operation ID: {mine.id}")
        print(f"Company: {company.company_name}")
        print(f"Operation: {mine.mine_name}")
        print("Currency: MNT (demo/business context)")
        print("Timezone: Asia/Ulaanbaatar")
        print("Language: Mongolian")
        print(f"KPI targets configured: {len(KPI_CONFIG)}")
        print(f"Alert thresholds configured: {len(ALERT_CONFIG)}")

    except Exception as exc:
        db.rollback()

        print()
        print("ERROR: Achit-Ikht configuration was not saved.")
        print(str(exc))

        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_achit_ikht_demo()