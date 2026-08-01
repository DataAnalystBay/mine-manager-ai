from html import escape
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from app.services.executive_pdf.executive_pdf_styles import (
    BORDER_GRAY,
    CRITICAL_BACKGROUND,
    CRITICAL_RED,
    MUTED_TEXT,
    NAVY,
    SUCCESS_BACKGROUND,
    SUCCESS_GREEN,
    WARNING_AMBER,
    WARNING_BACKGROUND,
)


CONTENT_WIDTH = 174 * mm


def _escape_text(value: Any, fallback: str = "") -> str:
    """
    Safely convert a value into ReportLab paragraph text.
    """

    if value is None:
        value = fallback

    text = str(value).strip()

    if not text:
        text = fallback

    return escape(text).replace("\n", "<br/>")


def _normalise_status(value: Any) -> str:
    """
    Convert status text into a comparable lowercase value.
    """

    return str(value or "").strip().lower()


def _build_fallback_style(
    name: str,
    font_name: str = "Helvetica",
    font_size: float = 8,
    leading: float = 10,
    text_color=NAVY,
    alignment: int = TA_LEFT,
) -> ParagraphStyle:
    """
    Create a lightweight fallback paragraph style.
    """

    return ParagraphStyle(
        name=name,
        fontName=font_name,
        fontSize=font_size,
        leading=leading,
        textColor=text_color,
        alignment=alignment,
    )


def _get_style(
    styles,
    name: str,
    fallback: ParagraphStyle,
) -> ParagraphStyle:
    """
    Return a named style when available, otherwise use a fallback.
    """

    try:
        style = styles[name]

        if style is not None:
            return style

    except (KeyError, TypeError):
        pass

    return fallback


def _resolve_overall_status(
    kpi_data: Dict[str, Any],
    ai_insight_data: Dict[str, Any],
) -> str:
    """
    Resolve an executive-friendly overall KPI status.
    """

    status = (
        ai_insight_data.get("risk_level")
        or kpi_data.get("status")
        or "Review"
    )

    normalized = _normalise_status(status)

    if normalized in {
        "critical",
        "off target",
        "high risk",
        "red",
        "below target",
    }:
        return "CRITICAL"

    if normalized in {
        "warning",
        "watch",
        "at risk",
        "medium risk",
        "amber",
        "review",
    }:
        return "AT RISK"

    if normalized in {
        "on target",
        "good",
        "healthy",
        "green",
        "achieved",
    }:
        return "ON TARGET"

    return str(status).upper()


def _status_colors(status: str):
    """
    Return foreground and background colors for status badges.
    """

    normalized = _normalise_status(status)

    if normalized == "critical":
        return CRITICAL_RED, CRITICAL_BACKGROUND

    if normalized == "on target":
        return SUCCESS_GREEN, SUCCESS_BACKGROUND

    return WARNING_AMBER, WARNING_BACKGROUND


def _resolve_primary_concern(
    kpi_data: Dict[str, Any],
    ai_insight_data: Dict[str, Any],
    root_cause_data: List[Dict[str, Any]],
) -> str:
    """
    Resolve the primary operational concern for the decision banner.
    """

    if root_cause_data:
        top_cause = root_cause_data[0]

        concern = (
            top_cause.get("cause")
            or top_cause.get("title")
            or top_cause.get("description")
            or top_cause.get("category")
        )

        if concern:
            return str(concern)

    concern = (
        ai_insight_data.get("business_implication")
        or ai_insight_data.get("summary")
        or kpi_data.get("executive_interpretation")
        or kpi_data.get("executive_summary")
        or kpi_data.get("summary")
    )

    return str(
        concern
        or "Performance requires continued executive monitoring."
    )


def _resolve_management_priority(
    ai_insight_data: Dict[str, Any],
) -> str:
    """
    Resolve the immediate management priority.
    """

    priority = (
        ai_insight_data.get("management_priority")
        or ai_insight_data.get("priority")
        or ai_insight_data.get("recommended_focus")
        or ai_insight_data.get("management_attention")
    )

    return str(
        priority
        or (
            "Confirm accountable ownership and monitor recovery "
            "against the KPI target."
        )
    )


def _resolve_decision_urgency(
    overall_status: str,
    ai_insight_data: Dict[str, Any],
) -> str:
    """
    Resolve decision urgency from explicit data or overall status.
    """

    explicit_urgency = ai_insight_data.get("decision_urgency")

    if explicit_urgency:
        return str(explicit_urgency).upper()

    normalized = _normalise_status(overall_status)

    if normalized == "critical":
        return "HIGH"

    if normalized == "at risk":
        return "MEDIUM"

    return "LOW"


def _resolve_business_implication(
    kpi_data: Dict[str, Any],
    ai_insight_data: Dict[str, Any],
) -> str:
    """
    Resolve the concise 'Why This Matters' explanation.
    """

    implication = (
        ai_insight_data.get("business_implication")
        or ai_insight_data.get("summary")
        or kpi_data.get("executive_interpretation")
        or kpi_data.get("executive_summary")
    )

    return str(
        implication
        or (
            "Continued underperformance may affect the reporting-period "
            "target and require additional management intervention."
        )
    )


def _build_badge(
    text: str,
    foreground,
    background,
    width: float,
) -> Table:
    """
    Build a compact status badge.
    """

    badge_style = _build_fallback_style(
        "DecisionBannerBadge",
        font_name="Helvetica-Bold",
        font_size=7,
        leading=8,
        text_color=foreground,
        alignment=TA_CENTER,
    )

    badge = Table(
        [
            [
                Paragraph(
                    _escape_text(text),
                    badge_style,
                )
            ]
        ],
        colWidths=[width],
    )

    badge.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("TEXTCOLOR", (0, 0), (-1, -1), foreground),
                ("BOX", (0, 0), (-1, -1), 0.6, foreground),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )

    return badge


def build_decision_banner(
    styles,
    kpi_data: Dict[str, Any],
    ai_insight_data: Dict[str, Any],
    root_cause_data: List[Dict[str, Any]],
) -> List:
    """
    Build the executive decision banner for Page 2.

    The section summarizes:
        - overall KPI status
        - decision urgency
        - primary operational concern
        - immediate management priority
        - why the issue matters to the business
    """

    kpi_data = kpi_data or {}
    ai_insight_data = ai_insight_data or {}
    root_cause_data = root_cause_data or []

    label_style = _build_fallback_style(
        "DecisionBannerLabel",
        font_name="Helvetica-Bold",
        font_size=6.5,
        leading=8,
        text_color=MUTED_TEXT,
    )

    value_style = _get_style(
        styles,
        "body",
        _build_fallback_style(
            "DecisionBannerValue",
            font_size=8,
            leading=10,
            text_color=NAVY,
        ),
    )

    concern_style = _build_fallback_style(
        "DecisionBannerConcern",
        font_name="Helvetica-Bold",
        font_size=8.5,
        leading=11,
        text_color=NAVY,
    )

    why_it_matters_label_style = _build_fallback_style(
        "DecisionBannerWhyLabel",
        font_name="Helvetica-Bold",
        font_size=7,
        leading=9,
        text_color=MUTED_TEXT,
    )

    why_it_matters_value_style = _build_fallback_style(
        "DecisionBannerWhyValue",
        font_name="Helvetica",
        font_size=8,
        leading=10,
        text_color=NAVY,
    )

    overall_status = _resolve_overall_status(
        kpi_data=kpi_data,
        ai_insight_data=ai_insight_data,
    )

    status_color, status_background = _status_colors(
        overall_status
    )

    primary_concern = _resolve_primary_concern(
        kpi_data=kpi_data,
        ai_insight_data=ai_insight_data,
        root_cause_data=root_cause_data,
    )

    management_priority = _resolve_management_priority(
        ai_insight_data=ai_insight_data,
    )

    decision_urgency = _resolve_decision_urgency(
        overall_status=overall_status,
        ai_insight_data=ai_insight_data,
    )

    urgency_color, urgency_background = _status_colors(
        "critical"
        if decision_urgency == "HIGH"
        else "at risk"
        if decision_urgency == "MEDIUM"
        else "on target"
    )

    business_implication = _resolve_business_implication(
        kpi_data=kpi_data,
        ai_insight_data=ai_insight_data,
    )

    banner_table = Table(
        [
            [
                Paragraph(
                    "OVERALL STATUS",
                    label_style,
                ),
                Paragraph(
                    "DECISION URGENCY",
                    label_style,
                ),
            ],
            [
                _build_badge(
                    overall_status,
                    status_color,
                    status_background,
                    38 * mm,
                ),
                _build_badge(
                    decision_urgency,
                    urgency_color,
                    urgency_background,
                    32 * mm,
                ),
            ],
            [
                Paragraph(
                    "PRIMARY CONCERN",
                    label_style,
                ),
                Paragraph(
                    "MANAGEMENT PRIORITY",
                    label_style,
                ),
            ],
            [
                Paragraph(
                    _escape_text(primary_concern),
                    concern_style,
                ),
                Paragraph(
                    _escape_text(management_priority),
                    value_style,
                ),
            ],
        ],
        colWidths=[87 * mm, 87 * mm],
    )

    banner_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 1),
                    HexColor("#F8FAFC"),
                ),
                ("BOX", (0, 0), (-1, -1), 0.8, BORDER_GRAY),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.4,
                    BORDER_GRAY,
                ),
                (
                    "LINEBEFORE",
                    (0, 0),
                    (0, -1),
                    3,
                    status_color,
                ),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    why_it_matters_table = Table(
        [
            [
                Paragraph(
                    "WHY THIS MATTERS",
                    why_it_matters_label_style,
                )
            ],
            [
                Paragraph(
                    _escape_text(business_implication),
                    why_it_matters_value_style,
                )
            ],
        ],
        colWidths=[CONTENT_WIDTH],
    )

    why_it_matters_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    HexColor("#F8FAFC"),
                ),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER_GRAY),
                (
                    "LINEBEFORE",
                    (0, 0),
                    (0, -1),
                    2,
                    status_color,
                ),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )

    return [
        KeepTogether(
            [
                banner_table,
                Spacer(1, 2 * mm),
                why_it_matters_table,
                Spacer(1, 4 * mm),
            ]
        )
    ]
