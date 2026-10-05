from __future__ import annotations

import logging
import threading
import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.public_lead import PublicLead
from app.schemas.public_lead import PublicLeadCreate, PublicLeadResponse
from app.services.public_lead_notification_service import notify_new_public_lead


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/public", tags=["Public Leads"])

RATE_LIMIT_ATTEMPTS = 5
RATE_LIMIT_WINDOW_SECONDS = 10 * 60
MAX_CONTENT_LENGTH = 16 * 1024
_attempts: dict[str, deque[float]] = defaultdict(deque)
_attempts_lock = threading.Lock()


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _enforce_rate_limit(request: Request) -> None:
    now = time.monotonic()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    key = _client_key(request)

    with _attempts_lock:
        attempts = _attempts[key]
        while attempts and attempts[0] <= cutoff:
            attempts.popleft()
        if len(attempts) >= RATE_LIMIT_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )
        attempts.append(now)


def _reset_lead_rate_limiter_for_tests() -> None:
    with _attempts_lock:
        _attempts.clear()


@router.post(
    "/leads",
    response_model=PublicLeadResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_201_CREATED,
)
def create_public_lead(
    lead_data: PublicLeadCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> PublicLeadResponse:
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_CONTENT_LENGTH:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Request payload is too large.",
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request.",
            )

    _enforce_rate_limit(request)

    if lead_data.website:
        logger.info("Public lead request filtered by abuse protection.")
        return PublicLeadResponse()

    lead = PublicLead(
        name=lead_data.name,
        company=lead_data.company,
        role=lead_data.role,
        email_or_phone=lead_data.email_or_phone,
        operation_type=lead_data.operation_type,
        improvement_request=lead_data.improvement_request,
        intent=lead_data.intent,
        language=lead_data.language,
    )

    try:
        db.add(lead)
        db.commit()
        db.refresh(lead)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Public lead persistence failed.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to process request.",
        )

    logger.info(
        "Public lead persisted lead_id=%s intent=%s language=%s",
        lead.id,
        lead.intent,
        lead.language,
    )

    try:
        notify_new_public_lead(lead)
    except Exception:
        logger.error(
            "Public lead notification failed lead_id=%s intent=%s language=%s",
            lead.id,
            lead.intent,
            lead.language,
        )

    return PublicLeadResponse(lead_id=lead.id)
