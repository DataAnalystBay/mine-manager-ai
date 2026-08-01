from typing import Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


def log_audit(
    db: Session,
    company_id: int,
    actor_user: Optional[User],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    entity_name: Optional[str] = None,
    description: Optional[str] = None,
    status: str = "SUCCESS",
    ip_address: Optional[str] = None,
) -> AuditLog:
    """
    Create and save an audit log entry.

    Parameters:
        db:
            Active SQLAlchemy database session.

        company_id:
            Company that owns the audit record.

        actor_user:
            Authenticated user who performed the action.
            Can be None for system-generated actions.

        action:
            Action code, such as CREATE_USER or RESET_PASSWORD.

        entity_type:
            Type of affected record, such as USER or REPORT.

        entity_id:
            Database ID of the affected record.

        entity_name:
            Human-readable name of the affected record.

        description:
            Description of the action.

        status:
            Result of the action. Defaults to SUCCESS.

        ip_address:
            Optional client IP address.

    Returns:
        The saved AuditLog database record.
    """

    normalized_action = action.strip().upper()
    normalized_entity_type = entity_type.strip().upper()
    normalized_status = status.strip().upper()

    audit_log = AuditLog(
        company_id=company_id,
        actor_user_id=(
            actor_user.id
            if actor_user
            else None
        ),
        actor_name=(
            actor_user.full_name
            if actor_user
            else None
        ),
        actor_email=(
            actor_user.email
            if actor_user
            else None
        ),
        action=normalized_action,
        entity_type=normalized_entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        description=description,
        status=normalized_status,
        ip_address=ip_address,
    )

    try:
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)

    except Exception:
        db.rollback()
        raise

    return audit_log