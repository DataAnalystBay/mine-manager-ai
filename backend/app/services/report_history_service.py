from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.report_history import ReportHistory


def format_file_size(file_size_bytes: Optional[int]) -> str:
    """
    Convert a byte count into a human-readable file size.

    Examples:
        850 -> 850 B
        2048 -> 2.0 KB
        1048576 -> 1.0 MB
    """

    if file_size_bytes is None:
        return "Unknown"

    if file_size_bytes < 0:
        return "Unknown"

    size = float(file_size_bytes)

    units = ["B", "KB", "MB", "GB", "TB"]

    for unit in units:
        if size < 1024 or unit == units[-1]:
            if unit == "B":
                return f"{int(size)} {unit}"

            return f"{size:.1f} {unit}"

        size /= 1024

    return f"{file_size_bytes} B"


def create_report_history(
    db: Session,
    *,
    report_key: str,
    report_name: str,
    report_format: str,
    filename: str,
    file_size_bytes: Optional[int] = None,
    generated_by: Optional[str] = None,
    company_name: Optional[str] = None,
    mine_name: Optional[str] = None,
    status: str = "completed",
    error_message: Optional[str] = None,
) -> ReportHistory:
    """
    Create and save one report-history record.
    """

    history_record = ReportHistory(
        report_key=report_key.strip(),
        report_name=report_name.strip(),
        report_format=report_format.strip().upper(),
        filename=filename.strip(),
        file_size_bytes=file_size_bytes,
        generated_by=generated_by,
        company_name=company_name,
        mine_name=mine_name,
        status=status.strip().lower(),
        error_message=error_message,
    )

    try:
        db.add(history_record)
        db.commit()
        db.refresh(history_record)

        return history_record

    except Exception:
        db.rollback()
        raise


def record_completed_report(
    db: Session,
    *,
    report_key: str,
    report_name: str,
    report_format: str,
    filename: str,
    file_size_bytes: Optional[int] = None,
    generated_by: Optional[str] = None,
    company_name: Optional[str] = None,
    mine_name: Optional[str] = None,
) -> ReportHistory:
    """
    Save a successfully generated report.
    """

    return create_report_history(
        db=db,
        report_key=report_key,
        report_name=report_name,
        report_format=report_format,
        filename=filename,
        file_size_bytes=file_size_bytes,
        generated_by=generated_by,
        company_name=company_name,
        mine_name=mine_name,
        status="completed",
        error_message=None,
    )


def record_failed_report(
    db: Session,
    *,
    report_key: str,
    report_name: str,
    report_format: str,
    filename: str,
    error_message: str,
    generated_by: Optional[str] = None,
    company_name: Optional[str] = None,
    mine_name: Optional[str] = None,
) -> ReportHistory:
    """
    Save a failed report-generation attempt.
    """

    return create_report_history(
        db=db,
        report_key=report_key,
        report_name=report_name,
        report_format=report_format,
        filename=filename,
        file_size_bytes=None,
        generated_by=generated_by,
        company_name=company_name,
        mine_name=mine_name,
        status="failed",
        error_message=error_message,
    )


def get_recent_report_history(
    db: Session,
    *,
    limit: int = 20,
    report_format: Optional[str] = None,
    status: Optional[str] = None,
) -> List[ReportHistory]:
    """
    Return recent report-history records.

    Optional filters:
        report_format: PDF, XLSX, PPTX
        status: completed, failed
    """

    safe_limit = max(1, min(limit, 100))

    query = db.query(ReportHistory)

    if report_format:
        query = query.filter(
            ReportHistory.report_format == report_format.strip().upper()
        )

    if status:
        query = query.filter(
            ReportHistory.status == status.strip().lower()
        )

    return (
        query
        .order_by(ReportHistory.generated_at.desc())
        .limit(safe_limit)
        .all()
    )


def get_report_history_by_id(
    db: Session,
    report_history_id: int,
) -> Optional[ReportHistory]:
    """
    Return a single report-history record.
    """

    return (
        db.query(ReportHistory)
        .filter(ReportHistory.id == report_history_id)
        .first()
    )


def delete_report_history(
    db: Session,
    report_history_id: int,
) -> bool:
    """
    Delete one report-history record.

    Returns:
        True when a record was deleted.
        False when no record was found.
    """

    history_record = get_report_history_by_id(
        db=db,
        report_history_id=report_history_id,
    )

    if history_record is None:
        return False

    try:
        db.delete(history_record)
        db.commit()
        return True

    except Exception:
        db.rollback()
        raise


def serialize_report_history(
    history_record: ReportHistory,
) -> dict:
    """
    Convert a SQLAlchemy ReportHistory object into an API-ready dictionary.
    """

    return {
        "id": history_record.id,
        "report_key": history_record.report_key,
        "report_name": history_record.report_name,
        "report_format": history_record.report_format,
        "filename": history_record.filename,
        "file_size_bytes": history_record.file_size_bytes,
        "file_size_display": format_file_size(
            history_record.file_size_bytes
        ),
        "generated_by": history_record.generated_by,
        "company_name": history_record.company_name,
        "mine_name": history_record.mine_name,
        "status": history_record.status,
        "error_message": history_record.error_message,
        "generated_at": (
            history_record.generated_at.isoformat()
            if history_record.generated_at
            else None
        ),
    }
