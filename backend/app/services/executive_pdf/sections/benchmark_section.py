from __future__ import annotations

from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    Flowable,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


def _to_float(
    value: Any,
    default: float = 0.0,
) -> float:
    try:
        if value is None:
            return default

        return float(value)

    except (TypeError, ValueError):
        return default


def _format_value(
    value: Any,
    unit: str = "",
    digits: int = 1,
    show_sign: bool = False,
) -> str:
    if value is None:
        return "No Data"

    numeric_value = _to_float(value)

    if show_sign:
        formatted = f"{numeric_value:+,.{digits}f}"
    else:
        formatted = f"{numeric_value:,.{digits}f}"

    return f"{formatted}{unit}"


def _ordinal_suffix(value: int) -> str:
    if 10 <= value % 100 <= 20:
        suffix = "th"

    else:
        suffix = {
            1: "st",
            2: "nd",
            3: "rd",
        }.get(
            value % 10,
            "th",
        )

    return f"{value}{suffix}"


def _format_percentile(
    value: Any,
) -> str:
    if value is None:
        return "No Data"

    percentile = int(
        round(
            _to_float(value)
        )
    )

    percentile = max(
        0,
        min(
            100,
            percentile,
        ),
    )

    return _ordinal_suffix(
        percentile
    )


def _resolve_variance_color(
    variance: float,
    higher_is_better: bool,
):
    if variance == 0:
        return colors.HexColor("#475569")

    favourable = (
        variance > 0
        if higher_is_better
        else variance < 0
    )

    if favourable:
        return colors.HexColor("#15803D")

    return colors.HexColor("#B91C1C")


def _resolve_benchmark_status(
    current_value: Any,
    target_value: Any,
    percentile: Any,
    higher_is_better: bool,
) -> Dict[str, Any]:
    """
    Return an executive benchmark status label and visual colors.
    """

    current_numeric = (
        _to_float(current_value)
        if current_value is not None
        else None
    )

    target_numeric = (
        _to_float(target_value)
        if target_value is not None
        else None
    )

    percentile_numeric = (
        _to_float(percentile)
        if percentile is not None
        else None
    )

    if current_numeric is None:
        return {
            "label": "NO CURRENT DATA",
            "text_color": colors.HexColor("#475569"),
            "background_color": colors.HexColor("#F1F5F9"),
            "border_color": colors.HexColor("#CBD5E1"),
        }

    if percentile_numeric is not None and percentile_numeric >= 75:
        return {
            "label": "TOP QUARTILE",
            "text_color": colors.HexColor("#166534"),
            "background_color": colors.HexColor("#F0FDF4"),
            "border_color": colors.HexColor("#86EFAC"),
        }

    if target_numeric is not None:
        target_achieved = (
            current_numeric >= target_numeric
            if higher_is_better
            else current_numeric <= target_numeric
        )

        if target_achieved:
            return {
                "label": "TARGET ACHIEVED",
                "text_color": colors.HexColor("#166534"),
                "background_color": colors.HexColor("#F0FDF4"),
                "border_color": colors.HexColor("#86EFAC"),
            }

        return {
            "label": "BELOW TARGET",
            "text_color": colors.HexColor("#991B1B"),
            "background_color": colors.HexColor("#FEF2F2"),
            "border_color": colors.HexColor("#FCA5A5"),
        }

    return {
        "label": "BENCHMARK AVAILABLE",
        "text_color": colors.HexColor("#1D4ED8"),
        "background_color": colors.HexColor("#EFF6FF"),
        "border_color": colors.HexColor("#93C5FD"),
    }


def _metric_card(
    label: str,
    value: str,
    styles: Dict[str, ParagraphStyle],
    value_color=colors.HexColor("#0F172A"),
) -> Table:
    label_paragraph = Paragraph(
        label,
        styles["benchmark_metric_label"],
    )

    value_paragraph = Paragraph(
        value,
        ParagraphStyle(
            name=f"BenchmarkValue_{label}",
            parent=styles["benchmark_metric_value"],
            textColor=value_color,
        ),
    )

    card = Table(
        [
            [label_paragraph],
            [value_paragraph],
        ],
        colWidths=[43 * mm],
        rowHeights=[
            8 * mm,
            12 * mm,
        ],
    )

    card.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor("#F8FAFC"),
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.7,
                    colors.HexColor("#E2E8F0"),
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
            ]
        )
    )

    return card


def _build_status_badge(
    status_data: Dict[str, Any],
    styles: Dict[str, ParagraphStyle],
) -> Table:
    """
    Build a compact executive status badge.
    """

    badge_style = ParagraphStyle(
        name="BenchmarkStatusBadge",
        parent=styles["benchmark_meta"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        textColor=status_data["text_color"],
        alignment=TA_CENTER,
    )

    badge = Table(
        [
            [
                Paragraph(
                    status_data["label"],
                    badge_style,
                )
            ]
        ],
        colWidths=[35 * mm],
        rowHeights=[8 * mm],
        hAlign="LEFT",
    )

    badge.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    status_data["background_color"],
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.7,
                    status_data["border_color"],
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
            ]
        )
    )

    return badge


def _build_summary_text(
    benchmark_data: Dict[str, Any],
) -> str:
    current_value = benchmark_data.get(
        "current_value"
    )

    target = benchmark_data.get(
        "target"
    )

    average_7 = benchmark_data.get(
        "average_7"
    )

    percentile = benchmark_data.get(
        "percentile"
    )

    unit = str(
        benchmark_data.get(
            "unit",
            "",
        )
        or ""
    )

    higher_is_better = bool(
        benchmark_data.get(
            "higher_is_better",
            True,
        )
    )

    if current_value is None:
        return (
            "Benchmark analysis is unavailable because no current KPI "
            "value was returned for the selected reporting period."
        )

    current_numeric = _to_float(
        current_value
    )

    target_numeric = (
        _to_float(target)
        if target is not None
        else None
    )

    if target_numeric is not None:
        if higher_is_better:
            target_assessment = (
                "above target"
                if current_numeric >= target_numeric
                else "below target"
            )

        else:
            target_assessment = (
                "better than target"
                if current_numeric <= target_numeric
                else "worse than target"
            )

    else:
        target_assessment = (
            "not comparable with target"
        )

    if average_7 is not None:
        average_numeric = _to_float(
            average_7
        )

        if current_numeric > average_numeric:
            average_assessment = (
                "above the recent average"
            )

        elif current_numeric < average_numeric:
            average_assessment = (
                "below the recent average"
            )

        else:
            average_assessment = (
                "equal to the recent average"
            )

    else:
        average_assessment = (
            "not comparable with the recent average"
        )

    percentile_text = (
        _format_percentile(
            percentile
        )
        if percentile is not None
        else "unavailable"
    )

    return (
        f"The current KPI result is "
        f"<b>{_format_value(current_numeric, unit)}</b>, "
        f"which is <b>{target_assessment}</b> and "
        f"<b>{average_assessment}</b>. "
        f"The result is positioned at the "
        f"<b>{percentile_text} percentile</b> within the selected "
        f"historical period."
    )


def create_benchmark_styles(
    base_styles: Dict[str, ParagraphStyle],
) -> Dict[str, ParagraphStyle]:
    # StyleSheet1 is not directly convertible with dict(base_styles).
    # Doing so makes Python request numeric keys such as 0, which causes
    # ReportLab to raise: "Style '0' not found in stylesheet".
    styles: Dict[str, ParagraphStyle] = dict(base_styles.byName)

    styles["benchmark_metric_label"] = ParagraphStyle(
        name="BenchmarkMetricLabel",
        parent=base_styles.get(
            "body"
        ),
        fontName="Helvetica",
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor("#64748B"),
        alignment=TA_LEFT,
        spaceAfter=1,
    )

    styles["benchmark_metric_value"] = ParagraphStyle(
        name="BenchmarkMetricValue",
        parent=base_styles.get(
            "body"
        ),
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=15,
        textColor=colors.HexColor("#0F172A"),
        alignment=TA_LEFT,
    )

    styles["benchmark_summary"] = ParagraphStyle(
        name="BenchmarkSummary",
        parent=base_styles.get(
            "body"
        ),
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
        alignment=TA_LEFT,
    )

    styles["benchmark_meta"] = ParagraphStyle(
        name="BenchmarkMeta",
        parent=base_styles.get(
            "body"
        ),
        fontName="Helvetica",
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor("#64748B"),
        alignment=TA_LEFT,
    )

    return styles


def build_benchmark_section(
    benchmark_data: Dict[str, Any],
    styles: Dict[str, ParagraphStyle],
) -> List[Flowable]:
    """
    Build the reusable Executive Benchmark Analysis PDF section.
    """

    if not benchmark_data:
        return []

    local_styles = create_benchmark_styles(
        styles
    )

    unit = str(
        benchmark_data.get(
            "unit",
            "",
        )
        or ""
    )

    higher_is_better = bool(
        benchmark_data.get(
            "higher_is_better",
            True,
        )
    )

    status_data = _resolve_benchmark_status(
        current_value=benchmark_data.get("current_value"),
        target_value=benchmark_data.get("target"),
        percentile=benchmark_data.get("percentile"),
        higher_is_better=higher_is_better,
    )

    status_badge = _build_status_badge(
        status_data=status_data,
        styles=local_styles,
    )

    variance = _to_float(
        benchmark_data.get(
            "variance"
        )
    )

    variance_color = _resolve_variance_color(
        variance=variance,
        higher_is_better=higher_is_better,
    )

    cards = [
        _metric_card(
            label="Current",
            value=_format_value(
                benchmark_data.get(
                    "current_value"
                ),
                unit,
            ),
            styles=local_styles,
        ),
        _metric_card(
            label="Target",
            value=_format_value(
                benchmark_data.get(
                    "target"
                ),
                unit,
            ),
            styles=local_styles,
        ),
        _metric_card(
            label="Variance",
            value=_format_value(
                benchmark_data.get(
                    "variance"
                ),
                unit,
                show_sign=True,
            ),
            styles=local_styles,
            value_color=variance_color,
        ),
        _metric_card(
            label="7-Day Average",
            value=_format_value(
                benchmark_data.get(
                    "average_7"
                ),
                unit,
            ),
            styles=local_styles,
        ),
        _metric_card(
            label="30-Day Average",
            value=_format_value(
                benchmark_data.get(
                    "average_30"
                ),
                unit,
            ),
            styles=local_styles,
        ),
        _metric_card(
            label="Best",
            value=_format_value(
                benchmark_data.get(
                    "best"
                ),
                unit,
            ),
            styles=local_styles,
        ),
        _metric_card(
            label="Worst",
            value=_format_value(
                benchmark_data.get(
                    "worst"
                ),
                unit,
            ),
            styles=local_styles,
        ),
        _metric_card(
            label="Percentile",
            value=_format_percentile(
                benchmark_data.get(
                    "percentile"
                )
            ),
            styles=local_styles,
        ),
    ]

    metric_grid = Table(
        [
            cards[0:4],
            cards[4:8],
        ],
        colWidths=[
            44.5 * mm,
            44.5 * mm,
            44.5 * mm,
            44.5 * mm,
        ],
        hAlign="LEFT",
    )

    metric_grid.setStyle(
        TableStyle(
            [
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    0,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    3,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    3,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
            ]
        )
    )

    summary_text = _build_summary_text(
        benchmark_data
    )

    observation_count = int(
        _to_float(
            benchmark_data.get(
                "observation_count"
            )
        )
    )

    reporting_period = str(
        benchmark_data.get(
            "reporting_period",
            "",
        )
        or ""
    )

    metadata_parts = [
        f"Observations: {observation_count}",
    ]

    if reporting_period:
        metadata_parts.append(
            f"Period: {reporting_period}"
        )

    metadata_text = "  |  ".join(
        metadata_parts
    )

    section: List[Flowable] = [
        Paragraph(
            "Executive Benchmark Analysis",
            local_styles["section_title"],
        ),
        Spacer(
            1,
            1.5 * mm,
        ),
        status_badge,
        Spacer(
            1,
            2.5 * mm,
        ),
        metric_grid,
        Spacer(
            1,
            3 * mm,
        ),
        Table(
            [
                [
                    Paragraph(
                        summary_text,
                        local_styles[
                            "benchmark_summary"
                        ],
                    )
                ]
            ],
            colWidths=[
                178 * mm
            ],
            style=TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        colors.HexColor(
                            "#F8FAFC"
                        ),
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.7,
                        colors.HexColor(
                            "#CBD5E1"
                        ),
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                ]
            ),
        ),
        Spacer(
            1,
            2 * mm,
        ),
        Paragraph(
            metadata_text,
            local_styles["benchmark_meta"],
        ),
        Spacer(
            1,
            6 * mm,
        ),
    ]

    return section
