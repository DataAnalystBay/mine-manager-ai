from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import SessionLocal

from app.services.analytics_engine_service import get_shared_analytics

from fastapi import HTTPException, Query

from app.schemas.kpi_detail import KpiDetailResponse
from app.services.kpi_detail_service import get_kpi_detail

from app.services.kpi_calculation_service import (
    safe_percentage,
    calculate_fleet_score,
    calculate_plant_score,
    calculate_health_score,
)

from app.services.trend_engine_service import (
    get_health_history_service,
    get_trend_analysis_service,
)


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    """
    Create and safely close a database session.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# EMPTY RESPONSE
# ============================================================

def empty_summary(mine_name: str):
    """
    Return a stable executive-summary response when no production
    data exists for the selected mine.
    """

    return {
        "mine_name": mine_name,
        "report_date": None,
        "health": 0,
        "ore": 0,
        "waste": 0,
        "fleet": 0,
        "availability": 0,
        "utilization": 0,
        "plant": 0,
        "throughput": 0,
        "recovery": 0,
        "safety": 0,
        "safety_score": 0,
        "near_misses": 0,
        "critical_risks": 0,
        "status": "No production data",
    }


# ============================================================
# EXECUTIVE SUMMARY
# ============================================================

@router.get("/executive-summary")
def get_executive_summary(
    mine_name: str = Query(default="Oyu Tolgoi Surface"),
    db: Session = Depends(get_db),
):
    """
    Return the latest operational KPI summary for the selected mine.

    This endpoint keeps the existing response structure used by the
    current dashboard frontend.
    """

    production = db.execute(
        text(
            """
            SELECT *
            FROM production_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        {"mine_name": mine_name},
    ).mappings().first()

    if production is None:
        return empty_summary(mine_name)

    ore = safe_percentage(
        production["ore_actual"],
        production["ore_plan"],
    )

    waste = safe_percentage(
        production["waste_actual"],
        production["waste_plan"],
    )

    # --------------------------------------------------------
    # Fleet
    # --------------------------------------------------------

    fleet_result = db.execute(
        text(
            """
            SELECT *
            FROM fleet_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        {"mine_name": mine_name},
    ).mappings().first()

    if fleet_result:
        availability = float(fleet_result["availability"] or 0)
        utilization = float(fleet_result["utilization"] or 0)

        fleet = calculate_fleet_score(
            availability,
            utilization,
        )
    else:
        availability = 0
        utilization = 0
        fleet = 0

    # --------------------------------------------------------
    # Plant
    # --------------------------------------------------------

    plant_result = db.execute(
        text(
            """
            SELECT *
            FROM plant_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        {"mine_name": mine_name},
    ).mappings().first()

    if plant_result:
        plant, throughput, recovery = calculate_plant_score(
            plant_result["throughput_actual"],
            plant_result["throughput_plan"],
            plant_result["recovery"],
        )
    else:
        plant = 0
        throughput = 0
        recovery = 0

    # --------------------------------------------------------
    # Safety
    # --------------------------------------------------------

    safety_result = db.execute(
        text(
            """
            SELECT *
            FROM safety_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        {"mine_name": mine_name},
    ).mappings().first()

    if safety_result:
        incidents = int(safety_result["incidents"] or 0)
        near_misses = int(safety_result["near_misses"] or 0)
        critical_risks = int(safety_result["critical_risks"] or 0)
        safety_score = float(safety_result["safety_score"] or 0)
    else:
        incidents = 0
        near_misses = 0
        critical_risks = 0
        safety_score = 0

    # --------------------------------------------------------
    # Mine Health
    # --------------------------------------------------------

    health = calculate_health_score(
        ore=ore,
        waste=waste,
        fleet=fleet,
        plant=plant,
        safety_score=safety_score,
    )

    return {
        "mine_name": mine_name,
        "report_date": str(production["report_date"]),
        "health": health,
        "ore": ore,
        "waste": waste,
        "fleet": fleet,
        "availability": availability,
        "utilization": utilization,
        "plant": plant,
        "throughput": throughput,
        "recovery": recovery,
        "safety": incidents,
        "safety_score": safety_score,
        "near_misses": near_misses,
        "critical_risks": critical_risks,
        "status": "Connected to PostgreSQL",
    }


# ============================================================
# AI BRIEFING
# ============================================================

@router.get("/ai-briefing")
def get_ai_briefing(
    mine_name: str = Query(default="Oyu Tolgoi Surface"),
    db: Session = Depends(get_db),
):
    """
    Generate an executive briefing from the latest operational KPIs.
    """

    summary = get_executive_summary(
        mine_name=mine_name,
        db=db,
    )

    if summary.get("status") != "Connected to PostgreSQL":
        return {
            "mine_name": mine_name,
            "report_date": summary.get("report_date"),
            "briefing": "No operational data available for briefing.",
            "priority_actions": [],
            "risks": [],
            "status": "No data",
        }

    risks = []
    actions = []

    if summary["health"] < 85:
        risks.append("Overall mine health is below target.")
        actions.append(
            "Run a cross-functional review on production, fleet, "
            "plant, and safety performance."
        )

    if summary["ore"] < 95:
        risks.append("Ore production is below plan.")
        actions.append(
            "Review mining sequence, shovel availability, and "
            "short-interval control performance."
        )

    if summary["waste"] < 95:
        risks.append("Waste movement is below plan.")
        actions.append(
            "Check truck allocation, haul road delays, and waste "
            "dump constraints."
        )

    if summary["fleet"] < 90:
        risks.append("Fleet performance is below target.")
        actions.append(
            "Review truck availability, utilization, maintenance "
            "delays, and dispatch efficiency."
        )

    if summary["plant"] < 95:
        risks.append("Plant performance is below target.")
        actions.append(
            "Review throughput bottlenecks, recovery performance, "
            "and plant downtime causes."
        )

    if (
        summary["safety_score"] < 95
        or summary["safety"] > 0
        or summary["critical_risks"] > 0
    ):
        risks.append("Safety performance requires management attention.")
        actions.append(
            "Review incidents, near misses, and critical risk controls "
            "before the next shift."
        )

    if not risks:
        risks.append(
            "No major operational risks detected from current KPI thresholds."
        )
        actions.append(
            "Maintain the current operating rhythm and continue "
            "monitoring leading indicators."
        )

    briefing = (
        f"{mine_name} is currently operating with a Mine Health Score "
        f"of {summary['health']}%. "
        f"Ore performance is {summary['ore']}%, "
        f"waste movement is {summary['waste']}%, "
        f"fleet performance is {summary['fleet']}%, "
        f"plant performance is {summary['plant']}%, "
        f"and safety score is {summary['safety_score']}%. "
        f"The key management focus should be: {actions[0]}"
    )

    return {
        "mine_name": mine_name,
        "report_date": summary["report_date"],
        "briefing": briefing,
        "priority_actions": actions[:5],
        "risks": risks[:5],
        "status": "AI briefing generated from PostgreSQL KPIs",
    }


# ============================================================
# PRIORITY ACTIONS
# ============================================================

@router.get("/priority-actions")
def get_priority_actions(
    mine_name: str = Query(default="Oyu Tolgoi Surface"),
    db: Session = Depends(get_db),
):
    """
    Generate prioritized operational actions from the latest KPIs.
    """

    summary = get_executive_summary(
        mine_name=mine_name,
        db=db,
    )

    if summary.get("status") != "Connected to PostgreSQL":
        return {
            "mine_name": mine_name,
            "report_date": summary.get("report_date"),
            "priority_level": "No Data",
            "actions": [],
            "status": "No operational data",
        }

    actions = []

    if summary["ore"] < 95:
        actions.append(
            {
                "category": "Production",
                "priority": 1,
                "severity": "High",
                "title": "Ore Production Below Target",
                "description": (
                    f"Ore performance is {summary['ore']}%, "
                    "below the 95% threshold."
                ),
                "recommended_action": (
                    "Review mining sequence, shovel allocation, and "
                    "short-interval control performance."
                ),
            }
        )

    if summary["waste"] < 95:
        actions.append(
            {
                "category": "Production",
                "priority": 2,
                "severity": "Medium",
                "title": "Waste Movement Below Target",
                "description": (
                    f"Waste movement is {summary['waste']}%, "
                    "below the 95% threshold."
                ),
                "recommended_action": (
                    "Check haul road delays, truck allocation, and "
                    "waste dump constraints."
                ),
            }
        )

    if summary["fleet"] < 90:
        actions.append(
            {
                "category": "Fleet",
                "priority": 3,
                "severity": "High",
                "title": "Fleet Performance Below Target",
                "description": (
                    f"Fleet performance is {summary['fleet']}%, "
                    "below the 90% threshold."
                ),
                "recommended_action": (
                    "Review truck availability, utilization, maintenance "
                    "delays, and dispatch efficiency."
                ),
            }
        )

    if summary["plant"] < 95:
        actions.append(
            {
                "category": "Plant",
                "priority": 4,
                "severity": "Medium",
                "title": "Plant Performance Below Target",
                "description": (
                    f"Plant performance is {summary['plant']}%, "
                    "below the 95% threshold."
                ),
                "recommended_action": (
                    "Review throughput bottlenecks, recovery performance, "
                    "and plant downtime causes."
                ),
            }
        )

    if (
        summary["safety_score"] < 95
        or summary["safety"] > 0
        or summary["critical_risks"] > 0
    ):
        actions.append(
            {
                "category": "Safety",
                "priority": 5,
                "severity": "Critical",
                "title": "Safety Requires Management Attention",
                "description": (
                    f"Incidents: {summary['safety']}, "
                    f"critical risks: {summary['critical_risks']}, "
                    f"safety score: {summary['safety_score']}%."
                ),
                "recommended_action": (
                    "Review safety incidents, near misses, and critical "
                    "risk controls before the next shift."
                ),
            }
        )

    if not actions:
        actions.append(
            {
                "category": "Operations",
                "priority": 1,
                "severity": "Low",
                "title": "Operations Stable",
                "description": (
                    "All major KPIs are within acceptable thresholds."
                ),
                "recommended_action": (
                    "Maintain the current operating rhythm and continue "
                    "monitoring leading indicators."
                ),
            }
        )

    severity_rank = {
        "Critical": 4,
        "High": 3,
        "Medium": 2,
        "Low": 1,
    }

    actions = sorted(
        actions,
        key=lambda action: severity_rank.get(
            action["severity"],
            0,
        ),
        reverse=True,
    )

    for index, action in enumerate(actions, start=1):
        action["priority"] = index

    return {
        "mine_name": mine_name,
        "report_date": summary["report_date"],
        "priority_level": actions[0]["severity"],
        "actions": actions,
        "status": "Priority actions generated from live KPIs",
    }


# ============================================================
# RISK REGISTER
# ============================================================

@router.get("/risk-register")
def get_risk_register(
    mine_name: str = Query(default="Oyu Tolgoi Surface"),
    db: Session = Depends(get_db),
):
    """
    Generate an operational risk register from the latest KPIs.
    """

    summary = get_executive_summary(
        mine_name=mine_name,
        db=db,
    )

    if summary.get("status") != "Connected to PostgreSQL":
        return {
            "mine_name": mine_name,
            "report_date": summary.get("report_date"),
            "overall_risk": "No Data",
            "risk_score": 0,
            "risks": [],
            "status": "No operational data",
        }

    risks = []

    def add_risk(
        category,
        severity,
        likelihood,
        impact,
        owner,
        title,
        mitigation,
        score,
    ):
        risks.append(
            {
                "category": category,
                "severity": severity,
                "likelihood": likelihood,
                "impact": impact,
                "owner": owner,
                "title": title,
                "mitigation": mitigation,
                "risk_score": score,
            }
        )

    if summary["ore"] < 95:
        add_risk(
            category="Production",
            severity="High",
            likelihood="High",
            impact="High",
            owner="Mine Operations",
            title="Ore production below target",
            mitigation=(
                "Review mining sequence, shovel allocation, and "
                "short-interval control performance."
            ),
            score=16,
        )

    if summary["waste"] < 95:
        add_risk(
            category="Production",
            severity="Medium",
            likelihood="Medium",
            impact="High",
            owner="Mine Operations",
            title="Waste movement below target",
            mitigation=(
                "Review haul road delays, truck allocation, and "
                "waste dump constraints."
            ),
            score=12,
        )

    if summary["fleet"] < 90:
        add_risk(
            category="Fleet",
            severity="High",
            likelihood="High",
            impact="High",
            owner="Maintenance / Dispatch",
            title="Fleet performance below target",
            mitigation=(
                "Review truck availability, utilization, maintenance "
                "delays, and dispatch efficiency."
            ),
            score=16,
        )

    if summary["plant"] < 95:
        add_risk(
            category="Plant",
            severity="Medium",
            likelihood="Medium",
            impact="Medium",
            owner="Process Plant",
            title="Plant performance below target",
            mitigation=(
                "Review throughput bottlenecks, recovery performance, "
                "and downtime causes."
            ),
            score=9,
        )

    if (
        summary["safety_score"] < 95
        or summary["safety"] > 0
        or summary["critical_risks"] > 0
    ):
        add_risk(
            category="Safety",
            severity="Critical",
            likelihood="High",
            impact="Very High",
            owner="HSE / Operations",
            title="Safety performance requires attention",
            mitigation=(
                "Review incidents, near misses, and critical risk "
                "controls before the next shift."
            ),
            score=20,
        )

    if not risks:
        add_risk(
            category="Operations",
            severity="Low",
            likelihood="Low",
            impact="Low",
            owner="Operations Leadership",
            title="Operations stable",
            mitigation=(
                "Maintain the current operating rhythm and continue "
                "monitoring leading indicators."
            ),
            score=4,
        )

    max_score = max(
        risk["risk_score"]
        for risk in risks
    )

    if max_score >= 18:
        overall_risk = "Critical"
    elif max_score >= 14:
        overall_risk = "High"
    elif max_score >= 8:
        overall_risk = "Medium"
    else:
        overall_risk = "Low"

    return {
        "mine_name": mine_name,
        "report_date": summary["report_date"],
        "overall_risk": overall_risk,
        "risk_score": max_score,
        "risks": risks,
        "status": "Risk register generated from live KPIs",
    }


# ============================================================
# HEALTH HISTORY
# ============================================================

@router.get("/health-history")
def get_health_history(
    mine_name: str = Query(default="Oyu Tolgoi Surface"),
    db: Session = Depends(get_db),
):
    """
    Return historical Mine Health and component KPI values.
    """

    return get_health_history_service(
        mine_name=mine_name,
        db=db,
    )


# ============================================================
# TREND ANALYSIS
# ============================================================

@router.get("/trend-analysis")
def get_trend_analysis(
    mine_name: str = Query(default="Oyu Tolgoi Surface"),
    db: Session = Depends(get_db),
):
    """
    Return Mine Health direction, drivers, and recommendations.
    """

    return get_trend_analysis_service(
        mine_name=mine_name,
        db=db,
    )


# ============================================================
# SHARED ANALYTICS — SPRINT 10.6
# ============================================================

@router.get("/shared-analytics")
def shared_analytics(
    mine_name: str = Query(default="Oyu Tolgoi Surface"),
    days: int = Query(
        default=7,
        ge=1,
        le=365,
        description="Number of recent reporting days to return.",
    ),
    db: Session = Depends(get_db),
):
    """
    Return the unified analytics response used by:

    - Executive Dashboard
    - Executive PDF Reports
    - Executive Briefing
    - Future Board Packs
    """

    return get_shared_analytics(
        db=db,
        mine_name=mine_name,
        days=days,
    )

@router.get(
    "/kpi-detail",
    response_model=KpiDetailResponse,
)
def read_kpi_detail(
    mine_name: str = Query(...),
    kpi_name: str = Query(...),
    days: int = Query(7, ge=2, le=30),
):
    try:
        return get_kpi_detail(
            mine_name=mine_name,
            kpi_name=kpi_name,
            days=days,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to generate KPI detail.",
        ) from error