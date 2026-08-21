ACHIT_IKHT_CONFIG = {
    "company": {
        "name": "Achit-Ikht LLC",
        "name_mn": "Ачит-Ихт ХХК",
        "country": "Mongolia",
        "industry": "Mining / Mineral Processing",
        "operation_type": "Hydrometallurgical Copper Processing",
        "primary_product": "Copper Cathode",
        "currency": "MNT",
        "timezone": "Asia/Ulaanbaatar",
        "default_language": "mn",
        "secondary_language": "en",
        "units": "metric",
    },

    "mine": {
        "name": "Achit-Ikht Copper Cathode Operation",
        "name_mn": "Ачит-Ихт катодын зэсийн үйлдвэр",
        "operation_type": "Processing Plant / SX-EW",
        "status": "active",
        "annual_capacity_tonnes": 10000,
        "primary_product": "Copper Cathode",
        "process_flow": [
            "Leaching",
            "PLS",
            "SX",
            "EW",
            "Copper Cathode",
        ],
    },

    "modules": {
        "executive_dashboard": True,
        "production": True,
        "plant": True,
        "maintenance": True,
        "safety": True,
        "fleet": False,
        "executive_ai_insights": True,
        "executive_actions": True,
        "predictive_intelligence": True,
        "executive_reports": True,
    },

    "kpi_targets": {
        "cathode_production_annual_t": 10000,
        "cathode_production_monthly_t": 833,
        "production_plan_attainment_pct": 98.0,

        "cu_recovery_pct": 77.0,
        "plant_availability_pct": 93.0,
        "plant_utilization_pct": 90.0,
        "ew_current_efficiency_pct": 92.0,

        # Synthetic demo targets.
        "pls_cu_grade_g_l": 2.55,
        "acid_consumption_kg_t": 4.00,
        "power_consumption_kwh_t": 2250,

        "lti": 0,
        "trifr": 2.0,
    },

    "alert_thresholds": {
        "production": {
            "warning_below_pct": 97.0,
            "high_below_pct": 95.0,
            "critical_below_pct": 93.0,
        },

        "cu_recovery": {
            "warning_below_pct": 76.0,
            "high_below_pct": 75.0,
            "critical_below_pct": 73.0,
        },

        "plant_availability": {
            "warning_below_pct": 92.0,
            "high_below_pct": 90.0,
            "critical_below_pct": 85.0,
        },

        "safety": {
            "lti_critical_above": 0,
            "near_miss_trend_periods": 3,
        },
    },

    "critical_equipment": [
        {
            "code": "PLS-P-201",
            "name": "PLS Pump P-201",
            "category": "PLS Pump",
            "criticality": "High",
        },
        {
            "code": "LEACH-P-101",
            "name": "Leach Irrigation Pump",
            "category": "Leach",
            "criticality": "High",
        },
        {
            "code": "ACID-P-301",
            "name": "Acid Dosing Pump",
            "category": "Acid System",
            "criticality": "High",
        },
        {
            "code": "SX-MS-101",
            "name": "SX Mixer-Settler",
            "category": "SX",
            "criticality": "High",
        },
        {
            "code": "EW-R-101",
            "name": "EW Rectifier Unit",
            "category": "EW",
            "criticality": "Critical",
        },
        {
            "code": "EW-CB-01",
            "name": "EW Cell Bank",
            "category": "EW",
            "criticality": "Critical",
        },
    ],

    "risk_categories": [
        "Production",
        "Plant / Process",
        "Equipment",
        "Safety",
        "External",
    ],

    "ai_context": {
        "company_name": "Achit-Ikht LLC",
        "operation_description": (
            "Hydrometallurgical copper processing operation producing "
            "copper cathode through Leaching, PLS, SX and EW processes."
        ),
        "primary_product": "Copper Cathode",
        "currency": "MNT",

        "management_priorities": [
            "Cathode production versus plan",
            "Copper recovery",
            "Plant availability",
            "Plant utilization",
            "EW current efficiency",
            "Equipment downtime",
            "Safety performance",
        ],

        "instruction": (
            "Analyze the operation as a hydrometallurgical copper cathode "
            "processing operation. Do not provide haul-truck, drilling, "
            "blasting or open-pit fleet recommendations unless corresponding "
            "data is explicitly provided."
        ),
    },
}