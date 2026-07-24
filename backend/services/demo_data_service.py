from datetime import date, timedelta
import random


def generate_production_demo(days: int =30):
    data = []
    today = date.today()

    for i in range(days):
        report_date = today - timedelta(days=days - i - 1)

        ore_plan = random.randint(48000, 54000)
        ore_actual = int(ore_plan * random.uniform(0.92, 1.06))

        waste_plan = random.randint(90000, 105000)
        waste_actual = int(waste_plan * random.uniform(0.90, 1.08))

        data.append({
            "report_date": report_date.isoformat(),
            "ore_plan": ore_plan,
            "ore_actual": ore_actual,
            "waste_plan": waste_plan,
            "waste_actual": waste_actual,
        })

    return data


def generate_fleet_demo(days: int =30):
    data = []
    today = date.today()

    trucks = [
        "CAT793-01",
        "CAT793-02",
        "CAT793-03",
        "CAT793-04",
        "CAT793-05",
    ]

    for i in range(days):
        report_date = today - timedelta(days=days - i - 1)

        for truck in trucks:
            data.append({
                "report_date": report_date.isoformat(),
                "truck_id": truck,
                "availability": round(random.uniform(82, 96), 1),
                "utilization": round(random.uniform(70, 90), 1),
                "breakdown_hours": round(random.uniform(0, 5), 1),
                "idle_hours": round(random.uniform(1, 6), 1),
            })

    return data


def generate_plant_demo(days: int =30):
    data = []
    today = date.today()

    for i in range(days):
        report_date = today - timedelta(days=days - i - 1)

        throughput_plan = random.randint(42000, 48000)
        throughput_actual = int(throughput_plan * random.uniform(0.91, 1.05))

        data.append({
            "report_date": report_date.isoformat(),
            "throughput_plan": throughput_plan,
            "throughput_actual": throughput_actual,
            "recovery": round(random.uniform(87, 93), 1),
            "downtime_hours": round(random.uniform(0, 4), 1),
        })

    return data


def generate_safety_demo(days: int =30):
    data = []
    today = date.today()

    for i in range(days):
        report_date = today - timedelta(days=days - i - 1)

        data.append({
            "report_date": report_date.isoformat(),
            "near_misses": random.randint(0, 4),
            "hazards_reported": random.randint(3, 12),
            "open_actions": random.randint(2, 15),
            "critical_risks": random.randint(0, 3),
            "recordable_incidents": random.choice([0, 0, 0, 0, 1]),
        })

    return data


def generate_maintenance_demo(days: int =30):
    data = []
    today = date.today()

    for i in range(days):
        report_date = today - timedelta(days=days - i - 1)

        data.append({
            "report_date": report_date.isoformat(),
            "pm_compliance": round(random.uniform(78, 96), 1),
            "backlog_work_orders": random.randint(20, 80),
            "planned_work_percent": round(random.uniform(55, 82), 1),
            "unplanned_work_percent": round(random.uniform(18, 45), 1),
            "equipment_availability": round(random.uniform(80, 94), 1),
        })

    return data


def generate_workforce_demo(days: int =30):
    data = []
    today = date.today()

    for i in range(days):
        report_date = today - timedelta(days=days - i - 1)

        data.append({
            "report_date": report_date.isoformat(),
            "attendance_rate": round(random.uniform(88, 98), 1),
            "overtime_hours": random.randint(80, 240),
            "fatigue_cases": random.randint(0, 5),
            "training_compliance": round(random.uniform(82, 99), 1),
            "contractor_headcount": random.randint(120, 220),
        })

    return data


def generate_all_demo_data():
    """
    Generate all demo datasets used by Demo Mode.
    """

    return {
        "production": generate_production_demo(),
        "fleet": generate_fleet_demo(),
        "plant": generate_plant_demo(),
        "safety": generate_safety_demo(),
        "maintenance": generate_maintenance_demo(),
        "workforce": generate_workforce_demo(),
    }