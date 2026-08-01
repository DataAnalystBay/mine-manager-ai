from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.executive_pdf.executive_action_pdf_data import (
    load_pdf_actions_for_kpi,
)
from app.services.executive_pdf.executive_kpi_pdf_data import (
    load_live_kpi_pdf_data,
)
from app.services.executive_pdf.executive_pdf_branding import (
    load_pdf_branding,
)
from app.services.executive_pdf.executive_pdf_service import (
    generate_executive_kpi_pdf,
)


router = APIRouter(
    prefix="/api/executive-kpi",
    tags=["Executive KPI PDF"],
)


# ==================================================
# Decision banner data preparation
# ==================================================


def _normalise_text(value: Any) -> str:
    return str(value or "").strip()


def _resolve_risk_level(kpi_data: Dict[str, Any]) -> str:
    """
    Convert the KPI status into the risk wording expected by the
    Executive Decision Banner.
    """

    status = _normalise_text(kpi_data.get("status")).lower()
    achievement = kpi_data.get("achievement_percentage")

    critical_statuses = {
        "critical",
        "off target",
        "high risk",
        "red",
    }

    warning_statuses = {
        "watch",
        "warning",
        "at risk",
        "medium risk",
        "amber",
        "below target",
        "review",
    }

    positive_statuses = {
        "on target",
        "good",
        "healthy",
        "green",
        "achieved",
    }

    if status in critical_statuses:
        return "Critical"

    if status in warning_statuses:
        return "At Risk"

    if status in positive_statuses:
        return "On Target"

    try:
        achievement_value = float(achievement)

        if achievement_value < 90:
            return "Critical"

        if achievement_value < 100:
            return "At Risk"

        return "On Target"

    except (TypeError, ValueError):
        return "At Risk"


def _resolve_decision_urgency(risk_level: str) -> str:
    normalized_risk = _normalise_text(risk_level).lower()

    if normalized_risk == "critical":
        return "High"

    if normalized_risk == "at risk":
        return "Medium"

    return "Low"


def _resolve_management_priority(
    recommended_action_data: List[Dict[str, Any]],
) -> str:
    """
    Use the highest-priority Executive Action as the management priority.
    """

    if recommended_action_data:
        first_action = recommended_action_data[0]

        action_title = (
            first_action.get("title")
            or first_action.get("action")
        )

        action_timing = (
            first_action.get("timing")
            or first_action.get("due_date")
        )

        if action_title and action_timing:
            return (
                f"{_normalise_text(action_title)} — "
                f"{_normalise_text(action_timing)}."
            )

        if action_title:
            return f"{_normalise_text(action_title)}."

    return (
        "Confirm accountable ownership and monitor recovery against "
        "the KPI target during the next management review."
    )


def _prepare_decision_banner_data(
    kpi_data: Dict[str, Any],
    ai_insight_data: Dict[str, Any],
    recommended_action_data: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Add explicit fields used by the Executive Decision Banner without
    overwriting values already supplied by the KPI analytics service.
    """

    prepared_data = dict(ai_insight_data or {})

    risk_level = (
        prepared_data.get("risk_level")
        or _resolve_risk_level(kpi_data)
    )

    prepared_data.setdefault(
        "risk_level",
        risk_level,
    )

    prepared_data.setdefault(
        "management_priority",
        _resolve_management_priority(
            recommended_action_data=recommended_action_data,
        ),
    )

    prepared_data.setdefault(
        "decision_urgency",
        _resolve_decision_urgency(risk_level),
    )

    return prepared_data


# ==================================================
# Action preview
# ==================================================


@router.get("/{kpi_key}/actions-preview")
def preview_executive_kpi_actions(
    kpi_key: str,
    limit: int = Query(
        default=5,
        ge=1,
        le=20,
    ),
    include_completed: bool = Query(
        default=False,
    ),
    db: Session = Depends(get_db),
):
    """
    Preview the Executive Actions that will be included in the
    Executive KPI Analysis PDF.
    """

    actions = load_pdf_actions_for_kpi(
        db=db,
        kpi_key=kpi_key,
        limit=limit,
        include_completed=include_completed,
    )

    return {
        "kpi_key": kpi_key,
        "action_count": len(actions),
        "include_completed": include_completed,
        "actions": actions,
    }


# ==================================================
# Branding preview
# ==================================================


@router.get("/branding/preview")
def preview_executive_pdf_branding(
    company_id: int = Query(
        default=None,
        ge=1,
    ),
    mine_id: int = Query(
        default=None,
        ge=1,
    ),
    db: Session = Depends(get_db),
):
    """
    Preview the company and mine branding used by PDF exports.
    """

    branding = load_pdf_branding(
        db=db,
        company_id=company_id,
        mine_id=mine_id,
    )

    return branding


# ==================================================
# Test PDF export
# ==================================================


@router.get("/export-pdf/test")
def export_test_executive_kpi_pdf(
    db: Session = Depends(get_db),
):
    """
    Generate a branded Executive KPI Analysis PDF using:

        - live KPI analytics
        - PostgreSQL history
        - Executive benchmark analysis
        - AI executive insight
        - KPI root causes
        - Executive Actions
        - Executive Decision Banner
        - Company Settings branding
        - Mine Settings configuration
    """

    kpi_key = "ore_production"
    days = 7

    try:
        branding = load_pdf_branding(
            db=db,
        )

        mine_name = branding["mine_name"]
        company_name = branding["company_name"]
        logo_path = branding["logo_url"]

        pdf_data = load_live_kpi_pdf_data(
            db=db,
            mine_name=mine_name,
            kpi_key=kpi_key,
            days=days,
        )

        recommended_action_data = load_pdf_actions_for_kpi(
            db=db,
            kpi_key=kpi_key,
            limit=5,
            include_completed=True,
        )

        kpi_data = pdf_data["kpi_data"]

        ai_insight_data = _prepare_decision_banner_data(
            kpi_data=kpi_data,
            ai_insight_data=pdf_data["ai_insight_data"],
            recommended_action_data=recommended_action_data,
        )

        pdf_buffer = generate_executive_kpi_pdf(
            kpi_data=kpi_data,
            historical_data=pdf_data["historical_data"],
            benchmark_data=pdf_data["benchmark_data"],
            ai_insight_data=ai_insight_data,
            root_cause_data=pdf_data["root_cause_data"],
            recommended_action_data=recommended_action_data,
            company_name=company_name,
            mine_name=mine_name,
            reporting_period=kpi_data["reporting_period"],
            prepared_by="Mine Manager AI",
            logo_path=logo_path,
            report_title="Executive KPI Analysis Report",
        )

        filename = (
            f"executive_kpi_analysis_"
            f"{kpi_key}_"
            f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                )
            },
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate the Executive KPI Analysis PDF. "
                f"Error: {exc}"
            ),
        ) from exc


# ==================================================
# Production PDF export
# ==================================================


@router.get("/{kpi_key}/export-pdf")
def export_executive_kpi_pdf(
    kpi_key: str,

    company_id: int = Query(
        default=None,
        ge=1,
    ),

    mine_id: int = Query(
        default=None,
        ge=1,
    ),

    days: int = Query(
        default=7,
        ge=1,
        le=90,
    ),

    action_limit: int = Query(
        default=5,
        ge=1,
        le=20,
    ),

    include_completed_actions: bool = Query(
        default=False,
    ),

    db: Session = Depends(get_db),
):
    """
    Generate an automatically branded Executive KPI Analysis PDF.

    Branding is loaded from:
        company_settings
        mine_settings

    Example:
        /api/executive-kpi/ore_production/export-pdf

    Optional:
        ?company_id=1
        &mine_id=1
        &days=14
        &action_limit=5
        &include_completed_actions=false
    """

    try:
        branding = load_pdf_branding(
            db=db,
            company_id=company_id,
            mine_id=mine_id,
        )

        company_name = branding["company_name"]
        mine_name = branding["mine_name"]
        logo_path = branding["logo_url"]

        pdf_data = load_live_kpi_pdf_data(
            db=db,
            mine_name=mine_name,
            kpi_key=kpi_key,
            days=days,
        )

        recommended_action_data = load_pdf_actions_for_kpi(
            db=db,
            kpi_key=kpi_key,
            limit=action_limit,
            include_completed=include_completed_actions,
        )

        kpi_data = pdf_data["kpi_data"]

        ai_insight_data = _prepare_decision_banner_data(
            kpi_data=kpi_data,
            ai_insight_data=pdf_data["ai_insight_data"],
            recommended_action_data=recommended_action_data,
        )

        pdf_buffer = generate_executive_kpi_pdf(
            kpi_data=kpi_data,
            historical_data=pdf_data["historical_data"],
            benchmark_data=pdf_data["benchmark_data"],
            ai_insight_data=ai_insight_data,
            root_cause_data=pdf_data["root_cause_data"],
            recommended_action_data=recommended_action_data,
            company_name=company_name,
            mine_name=mine_name,
            reporting_period=kpi_data["reporting_period"],
            prepared_by="Mine Manager AI",
            logo_path=logo_path,
            report_title="Executive KPI Analysis Report",
        )

        safe_kpi_key = (
            str(kpi_key)
            .strip()
            .lower()
            .replace(" ", "_")
            .replace("-", "_")
        )

        filename = (
            f"executive_kpi_analysis_"
            f"{safe_kpi_key}_"
            f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                )
            },
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate the Executive KPI Analysis PDF. "
                f"Error: {exc}"
            ),
        ) from exc
