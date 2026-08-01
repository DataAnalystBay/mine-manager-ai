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
    INFO_BACKGROUND,
    INFO_BLUE,
    MUTED_TEXT,
    NAVY,
    PRIMARY_GREEN,
    SUCCESS_BACKGROUND,
    SUCCESS_GREEN,
    WARNING_AMBER,
    WARNING_BACKGROUND,
)


CONTENT_WIDTH = 174 * mm


def _escape_text(value: Any, fallback: str = "") -> str:
    """
    Convert a value into safe ReportLab paragraph text.
    """

    if value is None:
        value = fallback

    text = str(value).strip()

    if not text:
        text = fallback

    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>")
    )


def _truncate(
    value: Any,
    max_chars: int,
    fallback: str = "Not specified",
) -> str:
    """
    Limit long text so the recommendation section remains compact.
    """

    text = str(value or fallback).strip()

    if len(text) <= max_chars:
        return text

    return f"{text[: max_chars - 1].rstrip()}..."


def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    """
    Convert a value to float without raising an exception.
    """

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _get_style(
    styles,
    name: str,
    fallback: ParagraphStyle,
) -> ParagraphStyle:
    """
    Return a named style or a conservative fallback.
    """

    try:
        style = styles[name]

        if style is not None:
            return style
    except (KeyError, TypeError):
        pass

    return fallback


def _build_fallback_style(
    name: str,
    font_name: str = "Helvetica",
    font_size: float = 8,
    leading: float = 10,
    text_color=NAVY,
    alignment: int = TA_LEFT,
) -> ParagraphStyle:
    """
    Create a fallback ReportLab paragraph style.
    """

    return ParagraphStyle(
        name=name,
        fontName=font_name,
        fontSize=font_size,
        leading=leading,
        textColor=text_color,
        alignment=alignment,
    )


def _priority_colors(priority: Any):
    """
    Return foreground and background colors for an action priority.
    """

    normalized = str(priority or "").strip().lower()

    if normalized in {"critical", "urgent"}:
        return CRITICAL_RED, CRITICAL_BACKGROUND

    if normalized == "high":
        return HexColor("#C2410C"), HexColor("#FFEDD5")

    if normalized == "medium":
        return WARNING_AMBER, WARNING_BACKGROUND

    if normalized == "low":
        return SUCCESS_GREEN, SUCCESS_BACKGROUND

    return NAVY, HexColor("#E2E8F0")


def _build_priority_badge(
    priority: Any,
    styles,
) -> Table:
    """
    Build a compact priority badge.
    """

    foreground, background = _priority_colors(priority)

    badge_style = _get_style(
        styles,
        "badge",
        _build_fallback_style(
            "RecommendationPriorityBadge",
            font_name="Helvetica-Bold",
            font_size=6.5,
            leading=8,
            text_color=foreground,
            alignment=TA_CENTER,
        ),
    )

    badge = Table(
        [
            [
                Paragraph(
                    _escape_text(str(priority or "Medium").upper()),
                    badge_style,
                )
            ]
        ],
        colWidths=[24 * mm],
    )

    badge.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("TEXTCOLOR", (0, 0), (-1, -1), foreground),
                ("BOX", (0, 0), (-1, -1), 0.5, foreground),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ]
        )
    )

    return badge


def build_executive_recommendation(
    styles,
    recommendation_data: Dict[str, Any],
) -> List:
    """
    Build the AI Executive Recommendation section.

    Expected recommendation_data keys:
        recommendation_title
        situation
        primary_cause
        priority_actions
        expected_result
        decision_window
        monitoring_frequency
    """

    section_title_style = _get_style(
        styles,
        "section_title",
        _build_fallback_style(
            "ExecutiveRecommendationTitleFallback",
            font_name="Helvetica-Bold",
            font_size=15,
            leading=18,
            text_color=NAVY,
        ),
    )

    body_style = _get_style(
        styles,
        "body",
        _build_fallback_style(
            "ExecutiveRecommendationBodyFallback",
            font_size=8,
            leading=10,
            text_color=MUTED_TEXT,
        ),
    )

    recommendation_title_style = _build_fallback_style(
        "ExecutiveRecommendationHeadline",
        font_name="Helvetica-Bold",
        font_size=11,
        leading=14,
        text_color=NAVY,
    )

    recommendation_body_style = _build_fallback_style(
        "ExecutiveRecommendationBody",
        font_size=8,
        leading=10.5,
        text_color=NAVY,
    )

    label_style = _build_fallback_style(
        "ExecutiveRecommendationLabel",
        font_name="Helvetica-Bold",
        font_size=6.5,
        leading=8,
        text_color=MUTED_TEXT,
        alignment=TA_CENTER,
    )

    value_style = _build_fallback_style(
        "ExecutiveRecommendationValue",
        font_name="Helvetica-Bold",
        font_size=9,
        leading=11,
        text_color=NAVY,
        alignment=TA_CENTER,
    )

    action_title_style = _build_fallback_style(
        "ExecutiveRecommendationActionTitle",
        font_name="Helvetica-Bold",
        font_size=8,
        leading=10,
        text_color=NAVY,
    )

    action_detail_style = _build_fallback_style(
        "ExecutiveRecommendationActionDetail",
        font_size=7,
        leading=9,
        text_color=MUTED_TEXT,
    )

    if not recommendation_data:
        return [
            Paragraph(
                "Executive Recommendation",
                section_title_style,
            ),
            Spacer(1, 1.5 * mm),
            Paragraph(
                "No executive recommendation is currently available.",
                body_style,
            ),
            Spacer(1, 3 * mm),
        ]

    recommendation_title = (
        recommendation_data.get("recommendation_title")
        or "Executive management action is required."
    )

    situation = (
        recommendation_data.get("situation")
        or "Current performance requires management review."
    )

    primary_cause = (
        recommendation_data.get("primary_cause")
        or "Primary cause not specified"
    )

    decision_window = (
        recommendation_data.get("decision_window")
        or "Next operating review"
    )

    monitoring_frequency = (
        recommendation_data.get("monitoring_frequency")
        or "To be confirmed"
    )

    priority_actions = (
        recommendation_data.get("priority_actions")
        or []
    )

    expected_result = (
        recommendation_data.get("expected_result")
        or {}
    )

    estimated_recovery = (
        expected_result.get("estimated_recovery")
        or "N/A"
    )

    backlog_outlook = (
        expected_result.get("backlog_outlook")
        or "To be confirmed"
    )

    schedule_risk_change = (
        expected_result.get("schedule_risk_change")
        or "To be confirmed"
    )

    recommendation_banner = Table(
        [
            [
                Paragraph(
                    _escape_text(
                        _truncate(
                            recommendation_title,
                            180,
                        )
                    ),
                    recommendation_title_style,
                ),
                Paragraph(
                    (
                        "<b>Primary cause:</b><br/>"
                        + _escape_text(
                            _truncate(
                                primary_cause,
                                85,
                            )
                        )
                    ),
                    recommendation_body_style,
                ),
            ],
            [
                Paragraph(
                    (
                        "<b>Situation:</b> "
                        + _escape_text(
                            _truncate(
                                situation,
                                260,
                            )
                        )
                    ),
                    recommendation_body_style,
                ),
                Paragraph(
                    (
                        "<b>Decision window:</b> "
                        + _escape_text(decision_window)
                        + "<br/>"
                        + "<b>Monitoring:</b> "
                        + _escape_text(monitoring_frequency)
                    ),
                    recommendation_body_style,
                ),
            ],
        ],
        colWidths=[116 * mm, 58 * mm],
    )

    recommendation_banner.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#F8FAFC")),
                ("BACKGROUND", (1, 0), (1, -1), INFO_BACKGROUND),
                ("BOX", (0, 0), (-1, -1), 0.7, BORDER_GRAY),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_GRAY),
                ("LINEBEFORE", (0, 0), (0, -1), 3, PRIMARY_GREEN),
                ("LINEBEFORE", (1, 0), (1, -1), 3, INFO_BLUE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    result_table = Table(
        [
            [
                Paragraph("ESTIMATED RECOVERY", label_style),
                Paragraph("BACKLOG OUTLOOK", label_style),
                Paragraph("SCHEDULE RISK", label_style),
            ],
            [
                Paragraph(
                    _escape_text(estimated_recovery),
                    value_style,
                ),
                Paragraph(
                    _escape_text(backlog_outlook),
                    value_style,
                ),
                Paragraph(
                    _escape_text(schedule_risk_change),
                    value_style,
                ),
            ],
        ],
        colWidths=[
            58 * mm,
            58 * mm,
            58 * mm,
        ],
        rowHeights=[
            7 * mm,
            12 * mm,
        ],
    )

    result_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#F1F5F9")),
                ("BACKGROUND", (0, 1), (0, 1), SUCCESS_BACKGROUND),
                ("BACKGROUND", (1, 1), (1, 1), INFO_BACKGROUND),
                ("BACKGROUND", (2, 1), (2, 1), WARNING_BACKGROUND),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER_GRAY),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_GRAY),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )

    action_elements: List = []

    sorted_actions = sorted(
        priority_actions,
        key=lambda action: action.get("rank", 999),
    )[:5]

    if sorted_actions:
        for index, action in enumerate(sorted_actions, start=1):
            rank = action.get("rank", index)
            title = action.get("title") or "Management action"
            priority = action.get("priority") or "Medium"
            owner = action.get("owner") or "Action owner"
            timing = action.get("timing") or "To be confirmed"

            action_row = Table(
                [
                    [
                        Paragraph(
                            str(rank),
                            value_style,
                        ),
                        Paragraph(
                            _escape_text(
                                _truncate(
                                    title,
                                    105,
                                    "Management action",
                                )
                            ),
                            action_title_style,
                        ),
                        _build_priority_badge(
                            priority,
                            styles,
                        ),
                        Paragraph(
                            (
                                f"<b>Owner:</b> "
                                f"{_escape_text(_truncate(owner, 42))}"
                                f"<br/><b>Timing:</b> "
                                f"{_escape_text(_truncate(timing, 42))}"
                            ),
                            action_detail_style,
                        ),
                    ]
                ],
                colWidths=[
                    10 * mm,
                    82 * mm,
                    27 * mm,
                    55 * mm,
                ],
            )

            row_background = (
                colors.white
                if index % 2
                else HexColor("#F8FAFC")
            )

            action_row.setStyle(
                TableStyle(
                    [
                        (
                            "BACKGROUND",
                            (0, 0),
                            (-1, -1),
                            row_background,
                        ),
                        ("BOX", (0, 0), (-1, -1), 0.45, BORDER_GRAY),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("ALIGN", (0, 0), (0, -1), "CENTER"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 4),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ]
                )
            )

            action_elements.extend(
                [
                    action_row,
                    Spacer(1, 1.5 * mm),
                ]
            )
    else:
        action_elements.append(
            Paragraph(
                "No priority actions are currently available.",
                body_style,
            )
        )

    recommendation_block = [
        Paragraph(
            "AI Executive Recommendation",
            section_title_style,
        ),
        Spacer(1, 1.5 * mm),
        recommendation_banner,
        Spacer(1, 3 * mm),
        Paragraph(
            "Priority Actions",
            section_title_style,
        ),
        Spacer(1, 1.5 * mm),
        *action_elements,
        Spacer(1, 1.5 * mm),
        Paragraph(
            "Expected Result",
            section_title_style,
        ),
        Spacer(1, 1.5 * mm),
        result_table,
    ]

    return [
        KeepTogether(recommendation_block),
        Spacer(1, 4 * mm),
    ]
