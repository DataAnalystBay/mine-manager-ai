"""
Deployment Readiness API Router
===============================

Provides administrative endpoints for reviewing Mine Manager AI
deployment and security readiness.
"""

from fastapi import APIRouter, HTTPException, status

from app.services.deployment_readiness_service import (
    get_deployment_readiness,
)


router = APIRouter(
    prefix="/api/deployment-readiness",
    tags=["Deployment Readiness"],
)


@router.get(
    "",
    summary="Get deployment readiness report",
    description=(
        "Runs deployment, security, database, filesystem, dependency, "
        "and operational readiness checks."
    ),
)
def read_deployment_readiness():
    """
    Return the complete deployment-readiness report.

    The report includes:

    - Overall readiness status
    - Readiness score
    - Passed, warning, and failed counts
    - Blocking checks
    - Recommendations
    - All individual checks
    - Checks grouped by category
    - Runtime information
    """
    try:
        return get_deployment_readiness()

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Unable to generate deployment readiness report.",
                "error_type": type(exc).__name__,
                "error": str(exc),
            },
        ) from exc


@router.get(
    "/summary",
    summary="Get deployment readiness summary",
)
def read_deployment_readiness_summary():
    """
    Return a compact summary for dashboard cards and status indicators.
    """
    try:
        report = get_deployment_readiness()

        return {
            "generated_at": report.get("generated_at"),
            "readiness": report.get("readiness"),
            "score": report.get("score"),
            "summary": report.get("summary"),
            "blocking_checks": report.get("blocking_checks", []),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Unable to generate deployment readiness summary.",
                "error_type": type(exc).__name__,
                "error": str(exc),
            },
        ) from exc


@router.get(
    "/recommendations",
    summary="Get deployment recommendations",
)
def read_deployment_recommendations():
    """
    Return unresolved deployment recommendations.
    """
    try:
        report = get_deployment_readiness()

        return {
            "generated_at": report.get("generated_at"),
            "readiness": report.get("readiness"),
            "recommendations": report.get("recommendations", []),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Unable to generate deployment recommendations.",
                "error_type": type(exc).__name__,
                "error": str(exc),
            },
        ) from exc