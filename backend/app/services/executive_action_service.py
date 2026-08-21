from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.executive_action import ExecutiveAction
from app.schemas.executive_action import (
    ExecutiveActionCreate,
    ExecutiveActionUpdate,
)


ACTIVE_STATUSES = {
    "open",
    "in_progress",
    "blocked",
}

HIGH_PRIORITIES = {
    "high",
    "critical",
}


def get_action_by_id(
    db: Session,
    action_id: int,
) -> Optional[ExecutiveAction]:
    return (
        db.query(ExecutiveAction)
        .filter(
            ExecutiveAction.id == action_id
        )
        .first()
    )


def get_action_by_key(
    db: Session,
    action_key: str,
) -> Optional[ExecutiveAction]:
    return (
        db.query(ExecutiveAction)
        .filter(
            ExecutiveAction.action_key == action_key
        )
        .first()
    )


def list_actions(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    kpi_key: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[ExecutiveAction]:
    query = db.query(ExecutiveAction)

    if status:
        query = query.filter(
            ExecutiveAction.status == status
        )

    if priority:
        query = query.filter(
            ExecutiveAction.priority == priority
        )

    if kpi_key:
        query = query.filter(
            ExecutiveAction.kpi_key == kpi_key
        )

    return (
        query
        .order_by(
            ExecutiveAction.created_at.desc(),
            ExecutiveAction.id.desc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_action(
    db: Session,
    action_data: ExecutiveActionCreate,
) -> ExecutiveAction:
    action = ExecutiveAction(
        **action_data.model_dump()
    )

    if action.status == "completed":
        action.completed_at = datetime.now(
            timezone.utc
        )

    db.add(action)
    db.commit()
    db.refresh(action)

    return action


def update_action(
    db: Session,
    action: ExecutiveAction,
    action_data: ExecutiveActionUpdate,
) -> ExecutiveAction:
    update_values = action_data.model_dump(
        exclude_unset=True
    )

    old_status = action.status

    for field, value in update_values.items():
        setattr(action, field, value)

    if "status" in update_values:
        new_status = update_values["status"]

        if new_status == "completed":
            if old_status != "completed":
                action.completed_at = datetime.now(
                    timezone.utc
                )
        else:
            action.completed_at = None

    action.updated_at = datetime.now(
        timezone.utc
    )

    db.commit()
    db.refresh(action)

    return action


def update_action_status(
    db: Session,
    action: ExecutiveAction,
    status: str,
) -> ExecutiveAction:
    old_status = action.status

    action.status = status

    if status == "completed":
        if old_status != "completed":
            action.completed_at = datetime.now(
                timezone.utc
            )
    else:
        action.completed_at = None

    action.updated_at = datetime.now(
        timezone.utc
    )

    db.commit()
    db.refresh(action)

    return action


def delete_action(
    db: Session,
    action: ExecutiveAction,
) -> None:
    db.delete(action)
    db.commit()


def calculate_average_days_to_close(
    completed_actions: list[ExecutiveAction],
) -> float:
    closure_days: list[float] = []

    for action in completed_actions:
        if (
            action.created_at is None
            or action.completed_at is None
        ):
            continue

        created_at = action.created_at
        completed_at = action.completed_at

        if created_at.tzinfo is None:
            created_at = created_at.replace(
                tzinfo=timezone.utc
            )

        if completed_at.tzinfo is None:
            completed_at = completed_at.replace(
                tzinfo=timezone.utc
            )

        duration = completed_at - created_at

        days_to_close = max(
            duration.total_seconds()
            / 86400,
            0,
        )

        closure_days.append(
            days_to_close
        )

    if not closure_days:
        return 0.0

    return round(
        sum(closure_days)
        / len(closure_days),
        1,
    )


def get_action_summary(
    db: Session,
) -> dict:
    today = datetime.now(
        timezone.utc
    ).date()

    first_day_of_month = date(
        today.year,
        today.month,
        1,
    )

    total = (
        db.query(
            func.count(
                ExecutiveAction.id
            )
        )
        .scalar()
        or 0
    )

    open_count = (
        db.query(
            func.count(
                ExecutiveAction.id
            )
        )
        .filter(
            ExecutiveAction.status == "open"
        )
        .scalar()
        or 0
    )

    in_progress_count = (
        db.query(
            func.count(
                ExecutiveAction.id
            )
        )
        .filter(
            ExecutiveAction.status
            == "in_progress"
        )
        .scalar()
        or 0
    )

    completed_count = (
        db.query(
            func.count(
                ExecutiveAction.id
            )
        )
        .filter(
            ExecutiveAction.status
            == "completed"
        )
        .scalar()
        or 0
    )

    blocked_count = (
        db.query(
            func.count(
                ExecutiveAction.id
            )
        )
        .filter(
            ExecutiveAction.status
            == "blocked"
        )
        .scalar()
        or 0
    )

    due_today_count = (
        db.query(
            func.count(
                ExecutiveAction.id
            )
        )
        .filter(
            ExecutiveAction.due_date
            == today,
            ExecutiveAction.status.in_(
                ACTIVE_STATUSES
            ),
        )
        .scalar()
        or 0
    )

    overdue_count = (
        db.query(
            func.count(
                ExecutiveAction.id
            )
        )
        .filter(
            ExecutiveAction.due_date
            < today,
            ExecutiveAction.status.in_(
                ACTIVE_STATUSES
            ),
        )
        .scalar()
        or 0
    )

    high_priority_count = (
        db.query(
            func.count(
                ExecutiveAction.id
            )
        )
        .filter(
            ExecutiveAction.priority.in_(
                HIGH_PRIORITIES
            ),
            ExecutiveAction.status.in_(
                ACTIVE_STATUSES
            ),
        )
        .scalar()
        or 0
    )

    completed_this_month_count = (
        db.query(
            func.count(
                ExecutiveAction.id
            )
        )
        .filter(
            ExecutiveAction.status
            == "completed",
            ExecutiveAction.completed_at
            >= first_day_of_month,
        )
        .scalar()
        or 0
    )

    completed_actions = (
        db.query(
            ExecutiveAction
        )
        .filter(
            ExecutiveAction.status
            == "completed",
            ExecutiveAction.completed_at.isnot(
                None
            ),
            ExecutiveAction.created_at.isnot(
                None
            ),
        )
        .all()
    )

    average_days_to_close = (
        calculate_average_days_to_close(
            completed_actions
        )
    )

    completion_percentage = (
        round(
            (
                completed_count
                / total
            )
            * 100,
            1,
        )
        if total > 0
        else 0.0
    )

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress_count,
        "completed": completed_count,
        "blocked": blocked_count,
        "completion_percentage":
            completion_percentage,

        "due_today":
            due_today_count,

        "overdue":
            overdue_count,

        "high_priority":
            high_priority_count,

        "completed_this_month":
            completed_this_month_count,

        "average_days_to_close":
            average_days_to_close,
    }


def get_action_analytics(
    db: Session,
) -> dict:
    today = datetime.now(
        timezone.utc
    ).date()

    status_rows = (
        db.query(
            ExecutiveAction.status,
            func.count(
                ExecutiveAction.id
            ).label("count"),
        )
        .group_by(
            ExecutiveAction.status
        )
        .all()
    )

    actions_by_status = {
        "open": 0,
        "in_progress": 0,
        "completed": 0,
        "blocked": 0,
    }

    for status_value, count_value in status_rows:
        if status_value in actions_by_status:
            actions_by_status[status_value] = int(
                count_value or 0
            )

    priority_rows = (
        db.query(
            ExecutiveAction.priority,
            func.count(
                ExecutiveAction.id
            ).label("count"),
        )
        .group_by(
            ExecutiveAction.priority
        )
        .all()
    )

    actions_by_priority = {
        "low": 0,
        "medium": 0,
        "high": 0,
        "critical": 0,
    }

    for priority_value, count_value in priority_rows:
        if priority_value in actions_by_priority:
            actions_by_priority[priority_value] = int(
                count_value or 0
            )

    total_actions = sum(
        actions_by_status.values()
    )

    completed_actions_count = (
        actions_by_status["completed"]
    )

    active_actions = sum(
        actions_by_status[status_value]
        for status_value in ACTIVE_STATUSES
    )

    blocked_actions = (
        actions_by_status["blocked"]
    )

    critical_actions = (
        db.query(
            func.count(
                ExecutiveAction.id
            )
        )
        .filter(
            ExecutiveAction.priority
            == "critical",
            ExecutiveAction.status.in_(
                ACTIVE_STATUSES
            ),
        )
        .scalar()
        or 0
    )

    overdue_actions = (
        db.query(
            func.count(
                ExecutiveAction.id
            )
        )
        .filter(
            ExecutiveAction.due_date
            < today,
            ExecutiveAction.status.in_(
                ACTIVE_STATUSES
            ),
        )
        .scalar()
        or 0
    )

    completion_rate = (
        round(
            (
                completed_actions_count
                / total_actions
            )
            * 100,
            1,
        )
        if total_actions > 0
        else 0.0
    )

    overdue_percentage = (
        round(
            (
                overdue_actions
                / active_actions
            )
            * 100,
            1,
        )
        if active_actions > 0
        else 0.0
    )

    completed_actions = (
        db.query(
            ExecutiveAction
        )
        .filter(
            ExecutiveAction.status
            == "completed",
            ExecutiveAction.created_at.isnot(
                None
            ),
            ExecutiveAction.completed_at.isnot(
                None
            ),
        )
        .all()
    )

    average_days_to_close = (
        calculate_average_days_to_close(
            completed_actions
        )
    )

    owner_rows = (
        db.query(
            ExecutiveAction.owner,
            func.count(
                ExecutiveAction.id
            ).label("count"),
            func.sum(
                case(
                    (
                        ExecutiveAction.status.in_(
                            ACTIVE_STATUSES
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("active_count"),
        )
        .filter(
            ExecutiveAction.owner.isnot(
                None
            ),
            func.trim(
                ExecutiveAction.owner
            ) != "",
        )
        .group_by(
            ExecutiveAction.owner
        )
        .all()
    )

    def normalize_owner_name(
        owner_value: Optional[str],
    ) -> str:
        owner_text = str(
            owner_value or ""
        ).strip()

        if not owner_text:
            return ""

        normalized = (
            owner_text
            .lower()
            .replace("-", " ")
        )

        normalized = " ".join(
            normalized.split()
        )

        owner_alias_map = {
            "operations":
                "Operations",

            "үйл ажиллагаа":
                "Operations",

            "operations team":
                "Operations Team",

            "үйл ажиллагааны баг":
                "Operations Team",

            "operations manager":
                "Operations Manager",

            "үйл ажиллагааны менежер":
                "Operations Manager",

            "operations superintendent":
                "Operations Superintendent",

            "үйл ажиллагааны ахлах менежер":
                "Operations Superintendent",

            "mining operations":
                "Mining Operations",

            "mine operations":
                "Mining Operations",

            "уурхайн үйл ажиллагаа":
                "Mining Operations",

            "dispatch & control room":
                "Dispatch & Control Room",

            "dispatch and control room":
                "Dispatch & Control Room",

            "диспетчер ба хяналтын өрөө":
                "Dispatch & Control Room",

            "dispatch":
                "Dispatch",

            "диспетчер":
                "Dispatch",

            "mobile maintenance":
                "Mobile Maintenance",

            "явуулын засвар":
                "Mobile Maintenance",

            "maintenance":
                "Maintenance",

            "засвар үйлчилгээ":
                "Maintenance",

            "maintenance manager":
                "Maintenance Manager",

            "засварын менежер":
                "Maintenance Manager",

            "maintenance superintendent":
                "Maintenance Superintendent",

            "засварын ахлах менежер":
                "Maintenance Superintendent",

            "mine manager":
                "Mine Manager",

            "уурхайн менежер":
                "Mine Manager",

            "production superintendent":
                "Production Superintendent",

            "үйлдвэрлэлийн ахлах менежер":
                "Production Superintendent",

            "processing operations":
                "Processing Operations",

            "боловсруулах үйлдвэрлэл":
                "Processing Operations",

            "hse and operations":
                "HSE and Operations",

            "хабэа ба үйл ажиллагаа":
                "HSE and Operations",

            "mine management team":
                "Mine Management Team",

            "уурхайн удирдлагын баг":
                "Mine Management Team",

            "data and reporting team":
                "Data and Reporting Team",

            "өгөгдөл ба тайлагналын баг":
                "Data and Reporting Team",

            "maintenance and dispatch":
                "Maintenance and Dispatch",

            "засвар ба диспетчер":
                "Maintenance and Dispatch",
        }

        return (
            owner_alias_map.get(
                normalized
            )
            or owner_text
        )

    owner_totals: dict[
        str,
        dict[str, int],
    ] = {}

    for (
        owner,
        count_value,
        active_count,
    ) in owner_rows:
        canonical_owner = (
            normalize_owner_name(
                owner
            )
        )

        if not canonical_owner:
            continue

        if (
            canonical_owner
            not in owner_totals
        ):
            owner_totals[
                canonical_owner
            ] = {
                "count": 0,
                "active_count": 0,
            }

        owner_totals[
            canonical_owner
        ]["count"] += int(
            count_value or 0
        )

        owner_totals[
            canonical_owner
        ]["active_count"] += int(
            active_count or 0
        )

    top_owners = [
        {
            "owner": owner_name,
            "count": values[
                "count"
            ],
            "active_count": values[
                "active_count"
            ],
        }
        for (
            owner_name,
            values,
        ) in sorted(
            owner_totals.items(),
            key=lambda item: (
                -item[1]["count"],
                item[0].lower(),
            ),
        )[:5]
    ]

    kpi_rows = (
        db.query(
            ExecutiveAction.kpi_key,
            ExecutiveAction.kpi_name,
            func.count(
                ExecutiveAction.id
            ).label("count"),
            func.sum(
                case(
                    (
                        ExecutiveAction.status.in_(
                            ACTIVE_STATUSES
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("active_count"),
        )
        .filter(
            ExecutiveAction.kpi_key.isnot(
                None
            ),
            func.trim(
                ExecutiveAction.kpi_key
            ) != "",
        )
        .group_by(
            ExecutiveAction.kpi_key,
            ExecutiveAction.kpi_name,
        )
        .order_by(
            func.count(
                ExecutiveAction.id
            ).desc(),
            ExecutiveAction.kpi_key.asc(),
        )
        .limit(5)
        .all()
    )

    top_kpis = [
        {
            "kpi_key": kpi_key,
            "kpi_name": (
                kpi_name
                or kpi_key
            ),
            "count": int(
                count_value or 0
            ),
            "active_count": int(
                active_count or 0
            ),
        }
        for (
            kpi_key,
            kpi_name,
            count_value,
            active_count,
        ) in kpi_rows
    ]

    return {
        "completion_rate":
            completion_rate,

        "average_days_to_close":
            average_days_to_close,

        "overdue_percentage":
            overdue_percentage,

        "active_actions":
            int(active_actions),

        "critical_actions":
            int(critical_actions),

        "blocked_actions":
            int(blocked_actions),

        "actions_by_priority":
            actions_by_priority,

        "actions_by_status":
            actions_by_status,

        "top_owners":
            top_owners,

        "top_kpis":
            top_kpis,
    }
