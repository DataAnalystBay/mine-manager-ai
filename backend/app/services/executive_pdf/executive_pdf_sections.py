from html import escape
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple
 
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics.shapes import Drawing, String
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
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
 
 
# ==================================================
# Shared helpers
# ==================================================
 
 
def _escape_text(value: Any, fallback: str = "") -> str:
    """Convert values into safe ReportLab paragraph text."""
 
    if value is None:
        value = fallback
 
    text = str(value).strip()
 
    if not text:
        text = fallback
 
    return escape(text).replace("\n", "<br/>")
 
 
def _safe_float(value: Any, default: Optional[float] = None) -> Optional[float]:
    """Convert a value to float without raising an exception."""
 
    if value is None:
        return default
 
    try:
        return float(value)
    except (TypeError, ValueError):
        return default
 
 
def _get_style(styles, name: str, fallback: ParagraphStyle) -> ParagraphStyle:
    """Return a named style from a dictionary or StyleSheet-like object."""
 
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
    font_size: float = 9,
    leading: float = 12,
    text_color=NAVY,
    alignment: int = TA_LEFT,
    space_after: float = 0,
) -> ParagraphStyle:
    """Create a conservative fallback paragraph style."""
 
    return ParagraphStyle(
        name=name,
        fontName=font_name,
        fontSize=font_size,
        leading=leading,
        textColor=text_color,
        alignment=alignment,
        spaceAfter=space_after,
    )
 
 
def _format_value(value: Any, unit: str = "", decimals: int = 1) -> str:
    """Format a KPI value for display."""
 
    number = _safe_float(value)
 
    if number is None:
        return "N/A"
 
    formatted = f"{number:,.{decimals}f}"
 
    if decimals > 0:
        formatted = formatted.rstrip("0").rstrip(".")
 
    return f"{formatted}{unit}"
 
 
def _truncate(value: Any, max_chars: int, fallback: str = "Not specified") -> str:
    """Limit long executive text so the PDF remains compact."""
 
    text = str(value or fallback).strip()
 
    if len(text) <= max_chars:
        return text
 
    return f"{text[: max_chars - 1].rstrip()}..."
 
 
def _normalise_status(value: Any) -> str:
    return str(value or "").strip().lower()
 
 
def _status_colors(status: Any) -> Tuple[Any, Any]:
    normalized = _normalise_status(status)
 
    if normalized in {"on target", "good", "healthy", "green", "achieved"}:
        return SUCCESS_GREEN, SUCCESS_BACKGROUND
 
    if normalized in {
        "critical",
        "off target",
        "high risk",
        "red",
        "below target",
    }:
        return CRITICAL_RED, CRITICAL_BACKGROUND
 
    return WARNING_AMBER, WARNING_BACKGROUND
 
 
def _priority_colors(priority: Any) -> Tuple[Any, Any]:
    normalized = _normalise_status(priority)
 
    if normalized in {"critical", "urgent"}:
        return CRITICAL_RED, CRITICAL_BACKGROUND
 
    if normalized == "high":
        return HexColor("#C2410C"), HexColor("#FFEDD5")
 
    if normalized == "medium":
        return HexColor("#A16207"), HexColor("#FEF3C7")
 
    if normalized == "low":
        return SUCCESS_GREEN, SUCCESS_BACKGROUND
 
    return HexColor("#334155"), HexColor("#E2E8F0")
 
 
def _action_status_colors(status: Any) -> Tuple[Any, Any]:
    normalized = _normalise_status(status)
 
    if normalized in {"completed", "closed", "done"}:
        return SUCCESS_GREEN, SUCCESS_BACKGROUND
 
    if normalized in {"in progress", "active", "underway"}:
        return INFO_BLUE, INFO_BACKGROUND
 
    if normalized in {"blocked", "overdue"}:
        return CRITICAL_RED, CRITICAL_BACKGROUND
 
    if normalized == "planned":
        return HexColor("#7C3AED"), HexColor("#EDE9FE")
 
    return HexColor("#475569"), HexColor("#F1F5F9")
 
 
def _compact_badge(
    text: Any,
    styles,
    foreground,
    background,
    width: float,
) -> Table:
    """Build a small status badge suitable for compact executive tables."""
 
    badge_style = _get_style(
        styles,
        "badge",
        _build_fallback_style(
            "CompactBadgeFallback",
            font_name="Helvetica-Bold",
            font_size=6.5,
            leading=8,
            text_color=foreground,
            alignment=TA_CENTER,
        ),
    )
 
    badge = Table(
        [[Paragraph(_escape_text(str(text or "N/A").upper()), badge_style)]],
        colWidths=[width],
    )
 
    badge.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("TEXTCOLOR", (0, 0), (-1, -1), foreground),
                ("BOX", (0, 0), (-1, -1), 0.45, foreground),
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
 
 
# ==================================================
# Cover page - retained for compatibility
# ==================================================
 
 
def build_cover_page(
    styles,
    report_title: str,
    company_name: str,
    mine_name: str,
    period: str,
    generated_at: str,
    prepared_by: str,
    logo_path: Optional[str] = None,
) -> List:
    """
    Build a simple cover page.
 
    The current two-page report service does not use this function, but it is
    retained so older report generators do not break.
    """
 
    title_style = _get_style(
        styles,
        "report_title",
        _build_fallback_style(
            "CoverTitleFallback",
            font_name="Helvetica-Bold",
            font_size=24,
            leading=29,
            text_color=NAVY,
        ),
    )
 
    subtitle_style = _get_style(
        styles,
        "subtitle",
        _build_fallback_style(
            "CoverSubtitleFallback",
            font_size=11,
            leading=15,
            text_color=MUTED_TEXT,
        ),
    )
 
    elements: List = [Spacer(1, 28 * mm)]
 
    if logo_path:
        logo = Path(logo_path)
 
        if logo.exists() and logo.is_file():
            image = Image(str(logo))
            image._restrictSize(45 * mm, 24 * mm)
            elements.extend([image, Spacer(1, 12 * mm)])
 
    elements.extend(
        [
            Paragraph(_escape_text(company_name), subtitle_style),
            Spacer(1, 5 * mm),
            Paragraph(_escape_text(report_title), title_style),
            Spacer(1, 7 * mm),
            Paragraph(_escape_text(mine_name), subtitle_style),
            Spacer(1, 18 * mm),
        ]
    )
 
    details = Table(
        [
            ["Reporting period", period],
            ["Generated", generated_at],
            ["Prepared by", prepared_by],
        ],
        colWidths=[42 * mm, 105 * mm],
    )
 
    details.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), HexColor("#F1F5F9")),
                ("BOX", (0, 0), (-1, -1), 0.7, BORDER_GRAY),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_GRAY),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
 
    elements.append(details)
    return elements
 
 
# ==================================================
# Executive KPI summary
# ==================================================
 
 
def build_executive_kpi_summary(
    styles,
    kpi_data: Dict[str, Any],
) -> List:
    """
    Build a premium executive KPI summary block.
 
    The summary contains the KPI name, current result, target, variance,
    trend, status, and executive interpretation. The current KPI receives
    the strongest visual emphasis while all existing report integrations
    remain compatible.
    """
 
    # --------------------------------------------------
    # Reusable paragraph styles
    # --------------------------------------------------
 
    section_title_style = _get_style(
        styles,
        "section_title",
        _build_fallback_style(
            "KpiSectionTitleFallback",
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
            "KpiBodyFallback",
            font_name="Helvetica",
            font_size=8.5,
            leading=11,
            text_color=MUTED_TEXT,
        ),
    )
 
    metric_label_style = _build_fallback_style(
        "KpiMetricLabel",
        font_name="Helvetica-Bold",
        font_size=7.5,
        leading=9,
        text_color=MUTED_TEXT,
        alignment=TA_CENTER,
    )
 
    metric_value_style = _build_fallback_style(
        "KpiMetricValue",
        font_name="Helvetica-Bold",
        font_size=14,
        leading=17,
        text_color=NAVY,
        alignment=TA_CENTER,
    )
 
    hero_value_style = _build_fallback_style(
        "KpiHeroValue",
        font_name="Helvetica-Bold",
        font_size=30,
        leading=34,
        text_color=NAVY,
        alignment=TA_CENTER,
    )
 
    supporting_label_style = _build_fallback_style(
        "KpiSupportingLabel",
        font_name="Helvetica",
        font_size=6.5,
        leading=8,
        text_color=MUTED_TEXT,
        alignment=TA_CENTER,
    )
 
    positive_value_style = _build_fallback_style(
        "KpiPositiveValue",
        font_name="Helvetica-Bold",
        font_size=14,
        leading=17,
        text_color=SUCCESS_GREEN,
        alignment=TA_CENTER,
    )
 
    negative_value_style = _build_fallback_style(
        "KpiNegativeValue",
        font_name="Helvetica-Bold",
        font_size=14,
        leading=17,
        text_color=CRITICAL_RED,
        alignment=TA_CENTER,
    )
 
    warning_value_style = _build_fallback_style(
        "KpiWarningValue",
        font_name="Helvetica-Bold",
        font_size=14,
        leading=17,
        text_color=WARNING_AMBER,
        alignment=TA_CENTER,
    )
 
    # --------------------------------------------------
    # KPI values
    # --------------------------------------------------
 
    kpi_name = kpi_data.get("kpi_name") or "Executive KPI"
    unit = str(kpi_data.get("unit") or "").strip()
    current_value = kpi_data.get("current_value")
    target_value = kpi_data.get("target_value")
    variance = kpi_data.get("variance")
    status = kpi_data.get("status") or "Review"
 
    trend_direction = (
        kpi_data.get("trend_direction")
        or kpi_data.get("trend")
        or "Stable"
    )
 
    trend_percentage = kpi_data.get(
        "trend_percentage",
        kpi_data.get("trend_change"),
    )
 
    executive_summary = (
        kpi_data.get("executive_interpretation")
        or kpi_data.get("executive_summary")
        or kpi_data.get("summary")
        or "Current KPI performance is shown against the configured target."
    )
 
    higher_is_better = bool(
        kpi_data.get(
            "higher_is_better",
            True,
        )
    )
 
    # --------------------------------------------------
    # Status and value formatting
    # --------------------------------------------------
 
    status_color, status_background = _status_colors(status)
    current_text = _format_value(current_value, unit)
    target_text = _format_value(target_value, unit)
 
    variance_number = _safe_float(variance)
 
    if variance_number is None:
        variance_text = "N/A"
        variance_style = metric_value_style
        variance_supporting_text = "No comparison"
    else:
        variance_sign = "+" if variance_number > 0 else ""
        variance_text = (
            f"{variance_sign}"
            f"{_format_value(variance_number, unit)}"
        )
 
        if variance_number == 0:
            variance_style = metric_value_style
            variance_supporting_text = "At target"
        else:
            favorable_variance = (
                variance_number > 0
                if higher_is_better
                else variance_number < 0
            )
 
            if favorable_variance:
                variance_style = positive_value_style
                variance_supporting_text = "Favorable"
            else:
                variance_style = negative_value_style
                variance_supporting_text = "Unfavorable"
 
    trend_number = _safe_float(trend_percentage)
    normalized_trend_direction = str(trend_direction).strip().lower()
 
    if trend_number is None:
        trend_text = str(trend_direction or "Stable")
    else:
        trend_sign = "+" if trend_number > 0 else ""
        trend_text = f"{trend_sign}{trend_number:.1f}%"
 
    if normalized_trend_direction in {
        "up",
        "improving",
        "increase",
        "increasing",
    }:
        trend_supporting_text = "Improving"
        trend_style = (
            positive_value_style
            if higher_is_better
            else warning_value_style
        )
    elif normalized_trend_direction in {
        "down",
        "declining",
        "decrease",
        "decreasing",
    }:
        trend_supporting_text = "Declining"
        trend_style = (
            warning_value_style
            if higher_is_better
            else positive_value_style
        )
    elif normalized_trend_direction in {
        "no data",
        "no_data",
    }:
        trend_supporting_text = "No history"
        trend_style = metric_value_style
    else:
        trend_supporting_text = "Stable"
        trend_style = metric_value_style
 
    current_supporting_text = "Latest result"
    target_supporting_text = "Configured target"
 
    normalized_status = str(status).strip().lower()
 
    if normalized_status in {
        "on target",
        "healthy",
        "good",
        "achieved",
        "green",
    }:
        status_supporting_text = "Healthy"
    elif normalized_status in {
        "watch",
        "warning",
        "at risk",
        "below target",
        "amber",
    }:
        status_supporting_text = "Attention"
    elif normalized_status in {
        "critical",
        "off target",
        "high risk",
        "red",
    }:
        status_supporting_text = "Action required"
    else:
        status_supporting_text = "Management review"
 
    # --------------------------------------------------
    # Section title row
    # --------------------------------------------------
 
    title_row = Table(
        [
            [
                Paragraph(
                    "Executive KPI Analysis",
                    section_title_style,
                ),
                Paragraph(
                    _escape_text(kpi_name),
                    section_title_style,
                ),
            ]
        ],
        colWidths=[
            CONTENT_WIDTH / 2,
            CONTENT_WIDTH / 2,
        ],
    )
 
    title_row.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (0, 0), "LEFT"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
 
    # --------------------------------------------------
    # KPI hero table
    # --------------------------------------------------
 
    status_badge = _compact_badge(
        status,
        styles,
        status_color,
        status_background,
        30 * mm,
    )
 
    hero_table = Table(
        [
            [
                Paragraph("CURRENT", metric_label_style),
                Paragraph("TARGET", metric_label_style),
                Paragraph("VARIANCE", metric_label_style),
                Paragraph("TREND", metric_label_style),
                Paragraph("STATUS", metric_label_style),
            ],
            [
                Paragraph(current_text, hero_value_style),
                Paragraph(target_text, metric_value_style),
                Paragraph(variance_text, variance_style),
                Paragraph(_escape_text(trend_text), trend_style),
                status_badge,
            ],
            [
                Paragraph(
                    current_supporting_text,
                    supporting_label_style,
                ),
                Paragraph(
                    target_supporting_text,
                    supporting_label_style,
                ),
                Paragraph(
                    variance_supporting_text,
                    supporting_label_style,
                ),
                Paragraph(
                    trend_supporting_text,
                    supporting_label_style,
                ),
                Paragraph(
                    status_supporting_text,
                    supporting_label_style,
                ),
            ],
        ],
        colWidths=[
            40 * mm,
            29 * mm,
            29 * mm,
            43 * mm,
            33 * mm,
        ],
        rowHeights=[
            8 * mm,
            18 * mm,
            8 * mm,
        ],
    )
 
    hero_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    HexColor("#F8FAFC"),
                ),
                (
                    "BACKGROUND",
                    (0, 1),
                    (0, 2),
                    HexColor("#DCFCE7"),
                ),
                (
                    "BACKGROUND",
                    (4, 1),
                    (4, 2),
                    status_background,
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.8,
                    BORDER_GRAY,
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.4,
                    BORDER_GRAY,
                ),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
 
    # --------------------------------------------------
    # Executive interpretation
    # --------------------------------------------------
 
    summary_table = Table(
        [
            [
                Paragraph(
                    _escape_text(
                        _truncate(
                            executive_summary,
                            380,
                        )
                    ),
                    body_style,
                )
            ]
        ],
        colWidths=[CONTENT_WIDTH],
    )
 
    summary_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    HexColor("#FFFFFF"),
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.6,
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
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
 
    return [
        title_row,
        Spacer(1, 3 * mm),
        hero_table,
        Spacer(1, 3 * mm),
        summary_table,
        Spacer(1, 4 * mm),
    ]
 
 
# ==================================================
# Historical analysis
# ==================================================
 
 
def _prepare_history(
    historical_data: Sequence[Dict[str, Any]],
) -> List[Tuple[str, float]]:
    """Return valid period/value pairs while preserving input order."""
 
    points: List[Tuple[str, float]] = []
 
    for item in historical_data:
        value = _safe_float(item.get("value"))
 
        if value is None:
            continue
 
        period = str(
            item.get("period")
            or item.get("date")
            or item.get("label")
            or len(points) + 1
        )
 
        points.append((period, value))
 
    return points
 
 
def _build_trend_chart(
    points: Sequence[Tuple[str, float]],
    target_value: Optional[float],
    value_label: str,
) -> Drawing:
    """Create a small executive trend chart."""
 
    width = 174 * mm
    height = 48 * mm
    drawing = Drawing(width, height)
 
    chart = LinePlot()
    chart.x = 12 * mm
    chart.y = 10 * mm
    chart.width = width - 25 * mm
    chart.height = height - 18 * mm
 
    values = [value for _, value in points]
    x_values = list(range(1, len(points) + 1))
 
    series = [(x, value) for x, value in zip(x_values, values)]
    data = [series]
 
    target = _safe_float(target_value)
 
    if target is not None and points:
        data.append([(1, target), (len(points), target)])
 
    chart.data = data
    chart.lines[0].strokeColor = PRIMARY_GREEN
    chart.lines[0].strokeWidth = 2
    chart.lines[0].symbol = None
 
    if len(data) > 1:
        chart.lines[1].strokeColor = WARNING_AMBER
        chart.lines[1].strokeWidth = 1
        chart.lines[1].strokeDashArray = [4, 3]
        chart.lines[1].symbol = None
 
    minimum = min(values + ([target] if target is not None else []))
    maximum = max(values + ([target] if target is not None else []))
    span = maximum - minimum
    padding = max(span * 0.18, abs(maximum) * 0.03, 1)
 
    y_min = minimum - padding
    y_max = maximum + padding
    y_interval = (y_max - y_min) / 4
 
    chart.yValueAxis.valueMin = y_min
    chart.yValueAxis.valueMax = y_max
    chart.yValueAxis.valueSteps = [
        y_min,
        y_min + y_interval,
        y_min + (2 * y_interval),
        y_min + (3 * y_interval),
        y_max,
    ]
    chart.yValueAxis.labelTextFormat = "%0.1f"
    chart.yValueAxis.labels.fontName = "Helvetica"
    chart.yValueAxis.labels.fontSize = 6.5
    chart.yValueAxis.strokeColor = BORDER_GRAY
    chart.yValueAxis.gridStrokeColor = HexColor("#E2E8F0")
    chart.yValueAxis.visibleGrid = 1
 
    chart.xValueAxis.valueMin = 1
    chart.xValueAxis.valueMax = max(len(points), 2)
 
    if len(points) <= 7:
        chart.xValueAxis.valueSteps = list(
            range(1, len(points) + 1)
        )
    else:
        middle_index = max(1, len(points) // 2)
        chart.xValueAxis.valueSteps = sorted(
            {
                1,
                middle_index,
                len(points),
            }
        )
 
    chart.xValueAxis.labels.fontName = "Helvetica"
    chart.xValueAxis.labels.fontSize = 6
    chart.xValueAxis.labels.angle = 0
    chart.xValueAxis.strokeColor = BORDER_GRAY
 
    drawing.add(chart)
 
    if points:
        drawing.add(
            String(
                12 * mm,
                3 * mm,
                points[0][0],
                fontName="Helvetica",
                fontSize=6,
                fillColor=MUTED_TEXT,
            )
        )
        drawing.add(
            String(
                width - 13 * mm,
                3 * mm,
                points[-1][0],
                fontName="Helvetica",
                fontSize=6,
                textAnchor="end",
                fillColor=MUTED_TEXT,
            )
        )
 
    drawing.add(
        String(
            width - 3 * mm,
            height - 5 * mm,
            value_label,
            fontName="Helvetica",
            fontSize=6.5,
            textAnchor="end",
            fillColor=MUTED_TEXT,
        )
    )
 
    return drawing
 
 
def build_historical_analysis(
    styles,
    historical_data: List[Dict[str, Any]],
    target_value: Any = None,
    kpi_name: str = "Executive KPI",
    value_label: Optional[str] = None,
) -> List:
    """Build a compact historical KPI trend section."""
 
    title_style = _get_style(
        styles,
        "section_title",
        _build_fallback_style(
            "HistoryTitleFallback",
            font_name="Helvetica-Bold",
            font_size=13,
            leading=16,
            text_color=NAVY,
        ),
    )
 
    body_style = _get_style(
        styles,
        "body",
        _build_fallback_style(
            "HistoryBodyFallback",
            font_size=8,
            leading=10,
            text_color=MUTED_TEXT,
        ),
    )
 
    points = _prepare_history(historical_data)
 
    elements = [
        Paragraph("Historical Trend", title_style),
        Spacer(1, 1.5 * mm),
    ]
 
    if len(points) < 2:
        elements.append(
            Paragraph(
                "Insufficient historical data is available to display a trend.",
                body_style,
            )
        )
        elements.append(Spacer(1, 3 * mm))
        return elements
 
    chart = _build_trend_chart(
        points=points,
        target_value=_safe_float(target_value),
        value_label=value_label or kpi_name,
    )
 
    start_value = points[0][1]
    end_value = points[-1][1]
    change = end_value - start_value
    change_pct = (change / start_value * 100) if start_value else None
 
    if change_pct is None:
        trend_summary = (
            f"{kpi_name} moved from {start_value:,.1f} to "
            f"{end_value:,.1f} during the selected period."
        )
    else:
        direction = "increased" if change > 0 else "decreased" if change < 0 else "remained stable"
        trend_summary = (
            f"{kpi_name} {direction} from {start_value:,.1f} to "
            f"{end_value:,.1f} ({change_pct:+.1f}%)."
        )
 
    elements.extend(
        [
            chart,
            Paragraph(_escape_text(trend_summary), body_style),
            Spacer(1, 3 * mm),
        ]
    )
 
    return elements
 
 
# ==================================================
# AI executive insight
# ==================================================
 
 
def build_ai_executive_insight(
    styles,
    ai_insight_data: Dict[str, Any],
) -> List:
    """Build a compact AI executive insight block."""
 
    section_title_style = _get_style(
        styles,
        "section_title",
        _build_fallback_style(
            "AiInsightTitleFallback",
            font_name="Helvetica-Bold",
            font_size=13,
            leading=16,
            text_color=NAVY,
        ),
    )
 
    body_style = _get_style(
        styles,
        "body",
        _build_fallback_style(
            "AiInsightBodyFallback",
            font_size=8,
            leading=10,
            text_color=MUTED_TEXT,
        ),
    )
 
    insight_style = _build_fallback_style(
        "AiInsightBody",
        font_size=8,
        leading=10.5,
        text_color=NAVY,
    )
 
    summary = (
        ai_insight_data.get("summary")
        or ai_insight_data.get("analysis_summary")
        or "No AI executive insight is currently available."
    )
 
    business_implication = (
        ai_insight_data.get("business_implication")
        or ai_insight_data.get("implication")
        or "Management should continue monitoring this KPI against its target."
    )
 
    risk_level = ai_insight_data.get("risk_level") or "Review"
    confidence = ai_insight_data.get("confidence")
    priority = ai_insight_data.get("priority") or "Monitor"
 
    confidence_value = _safe_float(confidence)
 
    if confidence_value is None:
        confidence_text = "N/A"
    else:
        confidence_text = f"{confidence_value:.0f}%"
 
    risk_color, risk_background = _status_colors(risk_level)
 
    metrics_table = Table(
        [
            [
                Paragraph("RISK", body_style),
                Paragraph("CONFIDENCE", body_style),
                Paragraph("MANAGEMENT FOCUS", body_style),
            ],
            [
                _compact_badge(
                    risk_level,
                    styles,
                    risk_color,
                    risk_background,
                    30 * mm,
                ),
                Paragraph(confidence_text, insight_style),
                Paragraph(_escape_text(_truncate(priority, 70)), insight_style),
            ],
        ],
        colWidths=[40 * mm, 38 * mm, 96 * mm],
        rowHeights=[6 * mm, 10 * mm],
    )
 
    metrics_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER_GRAY),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_GRAY),
                ("ALIGN", (0, 0), (1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
 
    insight_table = Table(
        [
            [
                Paragraph(
                    "<b>AI Analysis:</b> "
                    + _escape_text(_truncate(summary, 260)),
                    insight_style,
                ),
                Paragraph(
                    "<b>Business implication:</b> "
                    + _escape_text(_truncate(business_implication, 220)),
                    insight_style,
                ),
            ]
        ],
        colWidths=[87 * mm, 87 * mm],
    )
 
    insight_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), HexColor("#F8FAFC")),
                ("BACKGROUND", (1, 0), (1, 0), WARNING_BACKGROUND),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER_GRAY),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_GRAY),
                ("LINEBEFORE", (1, 0), (1, 0), 3, WARNING_AMBER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
 
    return [
        Paragraph("AI Executive Insight", section_title_style),
        Spacer(1, 1.5 * mm),
        metrics_table,
        Spacer(1, 2 * mm),
        insight_table,
        Spacer(1, 3 * mm),
    ]
 
 
# ==================================================
# Compact root cause analysis
# ==================================================
 
 
def build_root_cause_analysis(
    styles,
    root_cause_data: List[Dict[str, Any]],
) -> List:
    """
    Build a compact executive root-cause summary table.
 
    Detailed evidence and operational-effect narratives remain available in
    the application. The PDF shows only decision-relevant information.
    """
 
    section_title_style = _get_style(
        styles,
        "section_title",
        _build_fallback_style(
            "RootCauseTitleFallback",
            font_name="Helvetica-Bold",
            font_size=13,
            leading=16,
            text_color=NAVY,
        ),
    )
 
    body_style = _get_style(
        styles,
        "body",
        _build_fallback_style(
            "RootCauseBodyFallback",
            font_size=8,
            leading=10,
            text_color=MUTED_TEXT,
        ),
    )
 
    table_header_style = _get_style(
        styles,
        "table_header",
        _build_fallback_style(
            "RootCauseHeaderFallback",
            font_name="Helvetica-Bold",
            font_size=7,
            leading=8,
            text_color=colors.white,
            alignment=TA_CENTER,
        ),
    )
 
    table_cell_style = _get_style(
        styles,
        "table_cell",
        _build_fallback_style(
            "RootCauseCellFallback",
            font_size=7.5,
            leading=9.5,
            text_color=NAVY,
        ),
    )
 
    table_center_style = _get_style(
        styles,
        "table_cell_center",
        _build_fallback_style(
            "RootCauseCenterFallback",
            font_size=7.5,
            leading=9.5,
            text_color=NAVY,
            alignment=TA_CENTER,
        ),
    )
 
    elements = [
        Paragraph("Top Root Causes", section_title_style),
        Spacer(1, 1.5 * mm),
    ]
 
    if not root_cause_data:
        elements.append(
            Paragraph(
                "No root-cause data is available for this report.",
                body_style,
            )
        )
        return elements
 
    sorted_causes = sorted(
        root_cause_data,
        key=lambda item: item.get("rank", 999),
    )[:3]
 
    table_data = [
        [
            Paragraph("Rank", table_header_style),
            Paragraph("Root Cause", table_header_style),
            Paragraph("Category", table_header_style),
            Paragraph("Impact", table_header_style),
            Paragraph("Confidence", table_header_style),
        ]
    ]
 
    for index, cause_data in enumerate(sorted_causes, start=1):
        confidence = _safe_float(cause_data.get("confidence"))
        confidence_text = (
            f"{confidence:.0f}%"
            if confidence is not None
            else "N/A"
        )
 
        table_data.append(
            [
                Paragraph(
                    str(cause_data.get("rank", index)),
                    table_center_style,
                ),
                Paragraph(
                    _escape_text(
                        _truncate(
                            cause_data.get("cause"),
                            95,
                            "Unspecified operational cause",
                        )
                    ),
                    table_cell_style,
                ),
                Paragraph(
                    _escape_text(
                        _truncate(
                            cause_data.get("category"),
                            35,
                            "General",
                        )
                    ),
                    table_center_style,
                ),
                Paragraph(
                    _escape_text(cause_data.get("impact") or "Medium"),
                    table_center_style,
                ),
                Paragraph(confidence_text, table_center_style),
            ]
        )
 
    root_cause_table = Table(
        table_data,
        colWidths=[
            14 * mm,
            83 * mm,
            31 * mm,
            23 * mm,
            23 * mm,
        ],
        repeatRows=1,
    )
 
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER_GRAY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (2, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
 
    for row_index, cause in enumerate(sorted_causes, start=1):
        row_background = (
            colors.white
            if row_index % 2
            else HexColor("#F8FAFC")
        )
 
        commands.append(
            (
                "BACKGROUND",
                (0, row_index),
                (-1, row_index),
                row_background,
            )
        )
 
        impact = _normalise_status(cause.get("impact"))
 
        if impact == "high":
            impact_background = CRITICAL_BACKGROUND
            impact_color = CRITICAL_RED
        elif impact == "medium":
            impact_background = WARNING_BACKGROUND
            impact_color = WARNING_AMBER
        else:
            impact_background = SUCCESS_BACKGROUND
            impact_color = SUCCESS_GREEN
 
        commands.extend(
            [
                (
                    "BACKGROUND",
                    (3, row_index),
                    (3, row_index),
                    impact_background,
                ),
                (
                    "TEXTCOLOR",
                    (3, row_index),
                    (3, row_index),
                    impact_color,
                ),
            ]
        )
 
    root_cause_table.setStyle(TableStyle(commands))
 
    root_cause_note = Paragraph(
        (
            "Detailed evidence and operational effects are available "
            "in the Executive KPI Analysis screen."
        ),
        body_style,
    )
 
    return [
        KeepTogether(
            [
                Paragraph("Top Root Causes", section_title_style),
                Spacer(1, 1.5 * mm),
                root_cause_table,
            ]
        ),
        Spacer(1, 2 * mm),
        root_cause_note,
    ]
 
 
# ==================================================
# Detailed recommended actions - retained for compatibility
# ==================================================
 
 
def build_recommended_actions(
    styles,
    recommended_action_data,
) -> List:
    """
    Build compact recommended-action cards.
 
    The current two-page service does not call this function because the
    Executive Action Plan already provides the required management view.
    It remains available for other report variants.
    """
 
    section_title_style = _get_style(
        styles,
        "section_title",
        _build_fallback_style(
            "RecommendedActionTitleFallback",
            font_name="Helvetica-Bold",
            font_size=13,
            leading=16,
            text_color=NAVY,
        ),
    )
 
    body_style = _get_style(
        styles,
        "body",
        _build_fallback_style(
            "RecommendedActionBodyFallback",
            font_size=8,
            leading=10,
            text_color=MUTED_TEXT,
        ),
    )
 
    action_title_style = _get_style(
        styles,
        "action_title",
        _build_fallback_style(
            "RecommendedActionCardTitleFallback",
            font_name="Helvetica-Bold",
            font_size=9,
            leading=11,
            text_color=NAVY,
        ),
    )
 
    action_value_style = _get_style(
        styles,
        "action_value",
        _build_fallback_style(
            "RecommendedActionValueFallback",
            font_size=7.5,
            leading=9.5,
            text_color=NAVY,
        ),
    )
 
    elements = [
        Paragraph("Recommended Actions", section_title_style),
        Spacer(1, 2 * mm),
    ]
 
    if not recommended_action_data:
        elements.append(
            Paragraph(
                "No recommended actions are currently available.",
                body_style,
            )
        )
        return elements
 
    sorted_actions = sorted(
        recommended_action_data,
        key=lambda action: action.get("rank", 999),
    )[:3]
 
    for index, action in enumerate(sorted_actions, start=1):
        priority = action.get("priority") or "Medium"
        priority_color, priority_background = _priority_colors(priority)
 
        card = Table(
            [
                [
                    Paragraph(
                        f"<b>{index}. {_escape_text(_truncate(action.get('title'), 85, 'Management Action'))}</b>",
                        action_title_style,
                    ),
                    _compact_badge(
                        priority,
                        styles,
                        priority_color,
                        priority_background,
                        26 * mm,
                    ),
                ],
                [
                    Paragraph(
                        _escape_text(
                            _truncate(
                                action.get("description"),
                                180,
                                "No action description provided.",
                            )
                        ),
                        action_value_style,
                    ),
                    Paragraph(
                        (
                            f"<b>Owner:</b> "
                            f"{_escape_text(_truncate(action.get('owner'), 35, 'Action owner'))}<br/>"
                            f"<b>Timing:</b> "
                            f"{_escape_text(_truncate(action.get('timing'), 35, 'To be confirmed'))}"
                        ),
                        action_value_style,
                    ),
                ],
            ],
            colWidths=[126 * mm, 48 * mm],
        )
 
        card.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                    ("BOX", (0, 0), (-1, -1), 0.6, BORDER_GRAY),
                    ("LINEBEFORE", (0, 0), (0, -1), 3, priority_color),
                    ("SPAN", (0, 0), (0, 0)),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
 
        elements.extend([KeepTogether(card), Spacer(1, 2.5 * mm)])
 
    return elements
 
 
# ==================================================
# Executive action plan
# ==================================================
 
 
def build_executive_action_plan(
    styles,
    recommended_action_data,
) -> List:
    """
    Build a concise execution and accountability table.
 
    Strategic recommendations are shown in the AI Executive Recommendation
    section. This table focuses only on ownership, timing, status, and
    expected operational benefit.
    """
 
    section_title_style = _get_style(
        styles,
        "section_title",
        _build_fallback_style(
            "ActionPlanTitleFallback",
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
            "ActionPlanBodyFallback",
            font_size=8,
            leading=10,
            text_color=MUTED_TEXT,
        ),
    )
 
    small_body_style = _get_style(
        styles,
        "small_body",
        _build_fallback_style(
            "ActionPlanSmallBodyFallback",
            font_size=7,
            leading=9,
            text_color=MUTED_TEXT,
        ),
    )
 
    table_header_style = _get_style(
        styles,
        "table_header",
        _build_fallback_style(
            "ActionPlanHeaderFallback",
            font_name="Helvetica-Bold",
            font_size=6.5,
            leading=8,
            text_color=colors.white,
            alignment=TA_CENTER,
        ),
    )
 
    table_cell_style = _get_style(
        styles,
        "table_cell",
        _build_fallback_style(
            "ActionPlanCellFallback",
            font_size=7,
            leading=8.5,
            text_color=NAVY,
        ),
    )
 
    table_center_style = _get_style(
        styles,
        "table_cell_center",
        _build_fallback_style(
            "ActionPlanCenterFallback",
            font_size=7,
            leading=8.5,
            text_color=NAVY,
            alignment=TA_CENTER,
        ),
    )
 
    if not recommended_action_data:
        empty_table = Table(
            [
                [
                    Paragraph(
                        "No accountable actions are currently available.",
                        table_cell_style,
                    )
                ]
            ],
            colWidths=[CONTENT_WIDTH],
        )
 
        empty_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), HexColor("#F8FAFC")),
                    ("BOX", (0, 0), (-1, -1), 0.7, BORDER_GRAY),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        )
 
        return [
            KeepTogether(
                [
                    Paragraph(
                        "Execution & Accountability",
                        section_title_style,
                    ),
                    Spacer(1, 1.5 * mm),
                    Paragraph(
                        (
                            "Owners, timing, status, and expected operational "
                            "benefit for executive follow-up."
                        ),
                        body_style,
                    ),
                    Spacer(1, 3 * mm),
                    empty_table,
                ]
            )
        ]
 
    sorted_actions = sorted(
        recommended_action_data,
        key=lambda action: action.get("rank", 999),
    )[:5]
 
    table_data = [
        [
            Paragraph("#", table_header_style),
            Paragraph("Owner", table_header_style),
            Paragraph("Timing", table_header_style),
            Paragraph("Status", table_header_style),
            Paragraph("Expected Benefit", table_header_style),
        ]
    ]
 
    for index, action in enumerate(sorted_actions, start=1):
        table_data.append(
            [
                Paragraph(
                    str(action.get("rank", index)),
                    table_center_style,
                ),
                Paragraph(
                    _escape_text(
                        _truncate(
                            action.get("owner"),
                            42,
                            "Action owner",
                        )
                    ),
                    table_cell_style,
                ),
                Paragraph(
                    _escape_text(
                        _truncate(
                            action.get("timing"),
                            40,
                            "To be confirmed",
                        )
                    ),
                    table_cell_style,
                ),
                Paragraph(
                    _escape_text(action.get("status") or "Open"),
                    table_center_style,
                ),
                Paragraph(
                    _escape_text(
                        _truncate(
                            action.get("expected_benefit"),
                            130,
                            "Benefit to be confirmed.",
                        )
                    ),
                    table_cell_style,
                ),
            ]
        )
 
    action_table = Table(
        table_data,
        colWidths=[
            10 * mm,
            42 * mm,
            34 * mm,
            26 * mm,
            62 * mm,
        ],
        repeatRows=1,
    )
 
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (3, 0), (3, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER_GRAY),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
 
    for row_index, action in enumerate(sorted_actions, start=1):
        row_background = (
            colors.white
            if row_index % 2
            else HexColor("#F8FAFC")
        )
 
        commands.append(
            (
                "BACKGROUND",
                (0, row_index),
                (-1, row_index),
                row_background,
            )
        )
 
        status_text, status_background = _action_status_colors(
            action.get("status")
        )
 
        commands.extend(
            [
                (
                    "BACKGROUND",
                    (3, row_index),
                    (3, row_index),
                    status_background,
                ),
                (
                    "TEXTCOLOR",
                    (3, row_index),
                    (3, row_index),
                    status_text,
                ),
            ]
        )
 
    action_table.setStyle(TableStyle(commands))
 
    note = Paragraph(
        (
            "Management note: owners should update progress, constraints, "
            "and completion evidence before the next executive review."
        ),
        small_body_style,
    )
 
    return [
        KeepTogether(
            [
                Paragraph(
                    "Execution & Accountability",
                    section_title_style,
                ),
                Spacer(1, 1.5 * mm),
                Paragraph(
                    (
                        "Owners, timing, status, and expected operational "
                        "benefit for executive follow-up."
                    ),
                    body_style,
                ),
                Spacer(1, 3 * mm),
                action_table,
                Spacer(1, 3 * mm),
                note,
            ]
        )
    ]
