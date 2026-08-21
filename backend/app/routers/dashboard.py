import os

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import SessionLocal

from app.services.analytics_engine_service import get_shared_analytics


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
    dependencies=[Depends(get_current_user)],
)


ACTIVE_COMPANY_ID = int(os.getenv("ACTIVE_COMPANY_ID", "1"))
ACTIVE_MINE_ID = int(os.getenv("ACTIVE_MINE_ID", "1"))


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
# ACTIVE TENANT RESOLUTION
# ============================================================

def resolve_active_tenant(
    db: Session,
    requested_mine_name: str | None = None,
):
    """
    Resolve the active tenant from backend environment settings.

    ACTIVE_COMPANY_ID and ACTIVE_MINE_ID are authoritative for the
    current V1.0 deployment/demo profile. A caller-supplied mine name
    is never used as the security boundary.

    This prevents a request from selecting another customer's data by
    changing only the mine_name query parameter.
    """

    tenant = db.execute(
        text(
            """
            SELECT
                m.id AS mine_id,
                m.company_id AS company_id,
                m.mine_name AS mine_name,
                c.company_name AS company_name
            FROM public.mine_settings AS m
            JOIN public.company_settings AS c
                ON c.id = m.company_id
            WHERE m.id = :mine_id
              AND m.company_id = :company_id
            """
        ),
        {
            "company_id": ACTIVE_COMPANY_ID,
            "mine_id": ACTIVE_MINE_ID,
        },
    ).mappings().first()

    if tenant is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Active tenant company={ACTIVE_COMPANY_ID}, "
                f"mine={ACTIVE_MINE_ID} was not found."
            ),
        )

    # requested_mine_name is accepted for frontend compatibility only.
    # The active IDs remain authoritative.
    return {
        "company_id": int(tenant["company_id"]),
        "mine_id": int(tenant["mine_id"]),
        "company_name": tenant["company_name"],
        "mine_name": tenant["mine_name"],
        "requested_mine_name": requested_mine_name,
    }


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
        "operation_profile": None,
        "applicability": {
            "production": True,
            "waste": True,
            "fleet": True,
            "plant": True,
            "safety": True,
        },
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
    mine_name: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Return the latest operational KPI summary for the active tenant.

    company_id + mine_id are the authoritative tenant boundary.
    mine_name is retained only for frontend compatibility/display.
    """

    tenant = resolve_active_tenant(
        db=db,
        requested_mine_name=mine_name,
    )

    company_id = tenant["company_id"]
    mine_id = tenant["mine_id"]
    mine_name = tenant["mine_name"]

    is_sxew_operation = (
        mine_name == "Achit-Ikht Copper Cathode Operation"
    )

    waste_applicable = not is_sxew_operation
    fleet_applicable = not is_sxew_operation

    tenant_params = {
        "company_id": company_id,
        "mine_id": mine_id,
    }

    production = db.execute(
        text(
            """
            SELECT *
            FROM public.production_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        tenant_params,
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
            FROM public.fleet_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        tenant_params,
    ).mappings().first()

    if fleet_result:
        availability = float(fleet_result["availability"] or 0)
        utilization = float(fleet_result["utilization"] or 0)

        fleet = calculate_fleet_score(
            availability,
            utilization,
        )
    else:
        # Keep the existing V1.0 numeric response contract.
        # A later UI improvement can display this as N/A/No Data.
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
            FROM public.plant_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        tenant_params,
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
            FROM public.safety_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        tenant_params,
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

    operation_profile = (
        "sxew_copper"
        if is_sxew_operation
        else "standard_mine"
    )

    health = calculate_health_score(
        ore=ore,
        waste=waste,
        fleet=fleet,
        plant=plant,
        safety_score=safety_score,
        operation_profile=operation_profile,
    )

    return {
        "company_id": company_id,
        "mine_id": mine_id,
        "company_name": tenant["company_name"],
        "mine_name": mine_name,
        "report_date": str(production["report_date"]),
        "operation_profile": operation_profile,
        "applicability": {
            "production": True,
            "waste": waste_applicable,
            "fleet": fleet_applicable,
            "plant": True,
            "safety": True,
        },
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
    mine_name: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Generate an executive briefing from the latest operational KPIs.
    """

    summary = get_executive_summary(
        mine_name=mine_name,
        db=db,
    )


    mine_name = summary.get("mine_name") or mine_name
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

    is_sxew = (
        summary.get("operation_profile")
        == "sxew_copper"
    )

    production_label = (
        "Cathode production"
        if is_sxew
        else "Ore production"
    )

    production_action = (
        "Review cathode production losses, plant availability, "
        "copper recovery, EW performance, and process constraints."
        if is_sxew
        else
        "Review mining sequence, shovel availability, and "
        "short-interval control performance."
    )

    health_action = (
        "Run a cross-functional review on cathode production, "
        "process plant, and safety performance."
        if is_sxew
        else
        "Run a cross-functional review on production, fleet, "
        "plant, and safety performance."
    )

    if summary["health"] < 85:
        risks.append("Overall mine health is below target.")
        actions.append(
            health_action
        )

    if summary["ore"] < 95:
        risks.append(
            f"{production_label} is below plan."
        )
        actions.append(
            production_action
        )

    if (
        summary["applicability"]["waste"]
        and summary["waste"] < 95
    ):
        risks.append("Waste movement is below plan.")
        actions.append(
            "Check truck allocation, haul road delays, and waste "
            "dump constraints."
        )

    if (
        summary["applicability"]["fleet"]
        and summary["fleet"] < 90
    ):
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

    if is_sxew:
        briefing = (
            f"{mine_name} is currently operating with a Mine Health Score "
            f"of {summary['health']}%. "
            f"Cathode production performance is {summary['ore']}%, "
            f"process plant performance is {summary['plant']}%, "
            f"Cu recovery is {summary['recovery']}%, "
            f"and safety score is {summary['safety_score']}%. "
            f"The key management focus should be: {actions[0]}"
        )
    else:
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
    mine_name: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Generate prioritized operational actions from the latest KPIs.
    """

    summary = get_executive_summary(
        mine_name=mine_name,
        db=db,
    )


    mine_name = summary.get("mine_name") or mine_name
    if summary.get("status") != "Connected to PostgreSQL":
        return {
            "mine_name": mine_name,
            "report_date": summary.get("report_date"),
            "priority_level": "No Data",
            "actions": [],
            "status": "No operational data",
        }

    actions = []

    is_sxew = (
        summary.get("operation_profile")
        == "sxew_copper"
    )

    if summary["ore"] < 95:
        actions.append(
            {
                "category": "Production",
                "priority": 1,
                "severity": "High",
                "title": (
                    "Cathode Production Below Target"
                    if is_sxew
                    else "Ore Production Below Target"
                ),
                "description": (
                    (
                        f"Cathode production performance is "
                        f"{summary['ore']}%, below the 95% threshold."
                    )
                    if is_sxew
                    else (
                        f"Ore performance is {summary['ore']}%, "
                        "below the 95% threshold."
                    )
                ),
                "recommended_action": (
                    (
                        "Review cathode production losses, plant availability, "
                        "Cu recovery, EW performance, and process constraints."
                    )
                    if is_sxew
                    else (
                        "Review mining sequence, shovel allocation, and "
                        "short-interval control performance."
                    )
                ),
            }
        )

    if (
        summary["applicability"]["waste"]
        and summary["waste"] < 95
    ):
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

    if (
        summary["applicability"]["fleet"]
        and summary["fleet"] < 90
    ):
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
    mine_name: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Generate an operational risk register from the latest KPIs.
    """

    summary = get_executive_summary(
        mine_name=mine_name,
        db=db,
    )


    mine_name = summary.get("mine_name") or mine_name
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

    is_sxew = (
        summary.get("operation_profile")
        == "sxew_copper"
    )

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
            owner=(
                "Process Operations"
                if is_sxew
                else "Mine Operations"
            ),
            title=(
                "Cathode production below target"
                if is_sxew
                else "Ore production below target"
            ),
            mitigation=(
                (
                    "Review cathode production losses, plant availability, "
                    "Cu recovery, EW performance, and process constraints."
                )
                if is_sxew
                else (
                    "Review mining sequence, shovel allocation, and "
                    "short-interval control performance."
                )
            ),
            score=16,
        )

    if (
        summary["applicability"]["waste"]
        and summary["waste"] < 95
    ):
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

    if (
        summary["applicability"]["fleet"]
        and summary["fleet"] < 90
    ):
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
    mine_name: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Return historical Mine Health and component KPI values.
    """

    tenant = resolve_active_tenant(
        db=db,
        requested_mine_name=mine_name,
    )

    return get_health_history_service(
        mine_name=tenant["mine_name"],
        db=db,
    )


# ============================================================
# TREND ANALYSIS
# ============================================================

@router.get("/trend-analysis")
def get_trend_analysis(
    mine_name: str | None = Query(default=None),
    language: str = Query(default="en"),
    db: Session = Depends(get_db),
):
    """
    Return Mine Health direction, drivers, and recommendations
    in the requested language.
    """

    tenant = resolve_active_tenant(
        db=db,
        requested_mine_name=mine_name,
    )

    return get_trend_analysis_service(
        mine_name=tenant["mine_name"],
        db=db,
        language=language,
    )


# ============================================================
# SHARED ANALYTICS — SPRINT 10.6
# ============================================================

@router.get("/shared-analytics")
def shared_analytics(
    mine_name: str | None = Query(default=None),
    days: int = Query(
        default=7,
        ge=1,
        le=365,
        description="Number of recent reporting days to return.",
    ),
    language: str = Query(default="en"),
    db: Session = Depends(get_db),
):
    """
    Return the unified analytics response used by:

    - Executive Dashboard
    - Executive PDF Reports
    - Executive Briefing
    - Future Board Packs

    The optional language parameter is propagated to the shared analytics
    service so dynamic trend insights and recommendations can be returned
    in the selected UI language.
    """

    tenant = resolve_active_tenant(
        db=db,
        requested_mine_name=mine_name,
    )

    return get_shared_analytics(
        db=db,
        mine_name=tenant["mine_name"],
        days=days,
        language=language,
    )

@router.get(
    "/kpi-detail",
    response_model=KpiDetailResponse,
)
def read_kpi_detail(
    mine_name: str | None = Query(default=None),
    kpi_name: str = Query(...),
    days: int = Query(7, ge=2, le=30),
    db: Session = Depends(get_db),
):
    try:
        tenant = resolve_active_tenant(
            db=db,
            requested_mine_name=mine_name,
        )

        return get_kpi_detail(
            db=db,
            mine_name=tenant["mine_name"],
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