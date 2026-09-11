from __future__ import annotations

from datetime import date, datetime
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.report_branding_service import (
    ReportBranding,
    get_report_branding,
    resolve_report_branding,
)
from app.services.report_localization import (
    format_report_date,
    localize_report_label,
    normalize_report_language,
)


# -------------------------------------------------------------------
# Presentation dimensions
# -------------------------------------------------------------------

SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)

# -------------------------------------------------------------------
# Fixed supporting colors
# -------------------------------------------------------------------

WHITE = "FFFFFF"
TEXT_DARK = "0F172A"
TEXT_MUTED = "64748B"
BACKGROUND = "F8FAFC"
BORDER = "E2E8F0"

GREEN = "16A34A"
GREEN_LIGHT = "DCFCE7"
AMBER = "D97706"
AMBER_LIGHT = "FEF3C7"
RED = "DC2626"
RED_LIGHT = "FEE2E2"
BLUE = "2563EB"
BLUE_LIGHT = "DBEAFE"


# -------------------------------------------------------------------
# Operation profile helpers
# -------------------------------------------------------------------

SXEW_OPERATION_PROFILES = {
    "sxew",
    "sx_ew",
    "sxew_copper",
    "copper_sxew",
    "copper_cathode",
    "cathode",
}


def _normalize_operation_profile(
    operation_profile: str,
) -> str:
    """Normalize an operation profile into a stable internal value."""

    normalized = (
        str(operation_profile or "standard_mine")
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )

    if normalized in SXEW_OPERATION_PROFILES:
        return "sxew_copper"

    return normalized or "standard_mine"


def _is_sxew_operation(
    operation_profile: str,
) -> bool:
    return _normalize_operation_profile(operation_profile) == "sxew_copper"


# -------------------------------------------------------------------
# Database helpers
# -------------------------------------------------------------------

def _fetch_rows(
    db: Session,
    query: str,
    params: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Execute a read-only tenant-scoped SQL query.

    Optional operational datasets return an empty list when unavailable so
    board-pack generation can continue without mixing tenant data.
    """

    try:
        result = db.execute(
            text(query),
            params or {},
        )
        return [
            dict(row._mapping)
            for row in result
        ]
    except Exception:
        return []

def _fetch_production_data(
    db: Session,
    company_id: int,
    mine_id: int,
    limit: int = 30,
) -> List[Dict[str, Any]]:
    rows = _fetch_rows(
        db,
        """
        SELECT
            report_date,
            mine_name,
            ore_plan,
            ore_actual,
            waste_plan,
            waste_actual,
            created_at
        FROM public.production_daily
        WHERE company_id = :company_id
          AND mine_id = :mine_id
        ORDER BY report_date DESC
        LIMIT :limit
        """,
        {
            "company_id": int(company_id),
            "mine_id": int(mine_id),
            "limit": int(limit),
        },
    )
    return rows[::-1]

def _fetch_fleet_data(
    db: Session,
    company_id: int,
    mine_id: int,
    limit: int = 30,
) -> List[Dict[str, Any]]:
    rows = _fetch_rows(
        db,
        """
        SELECT
            report_date,
            mine_name,
            availability,
            utilization,
            created_at
        FROM public.fleet_daily
        WHERE company_id = :company_id
          AND mine_id = :mine_id
        ORDER BY report_date DESC
        LIMIT :limit
        """,
        {
            "company_id": int(company_id),
            "mine_id": int(mine_id),
            "limit": int(limit),
        },
    )
    return rows[::-1]

def _fetch_plant_data(
    db: Session,
    company_id: int,
    mine_id: int,
    limit: int = 30,
) -> List[Dict[str, Any]]:
    rows = _fetch_rows(
        db,
        """
        SELECT
            report_date,
            mine_name,
            throughput_plan,
            throughput_actual,
            recovery,
            created_at
        FROM public.plant_daily
        WHERE company_id = :company_id
          AND mine_id = :mine_id
        ORDER BY report_date DESC
        LIMIT :limit
        """,
        {
            "company_id": int(company_id),
            "mine_id": int(mine_id),
            "limit": int(limit),
        },
    )
    return rows[::-1]

def _fetch_safety_data(
    db: Session,
    company_id: int,
    mine_id: int,
    limit: int = 30,
) -> List[Dict[str, Any]]:
    rows = _fetch_rows(
        db,
        """
        SELECT
            report_date,
            mine_name,
            incidents,
            near_misses,
            critical_risks,
            safety_score,
            created_at
        FROM public.safety_daily
        WHERE company_id = :company_id
          AND mine_id = :mine_id
        ORDER BY report_date DESC
        LIMIT :limit
        """,
        {
            "company_id": int(company_id),
            "mine_id": int(mine_id),
            "limit": int(limit),
        },
    )
    return rows[::-1]

def _fetch_executive_actions(
    db: Session,
    company_id: int,
    mine_id: int,
    limit: int = 8,
) -> List[Dict[str, Any]]:
    return _fetch_rows(
        db,
        """
        SELECT
            title,
            priority,
            owner,
            timing,
            expected_benefit,
            status,
            linked_cause
        FROM public.executive_actions
        WHERE company_id = :company_id
          AND mine_id = :mine_id
        ORDER BY
            CASE LOWER(COALESCE(priority, ''))
                WHEN 'critical' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
                ELSE 5
            END,
            id DESC
        LIMIT :limit
        """,
        {
            "company_id": int(company_id),
            "mine_id": int(mine_id),
            "limit": int(limit),
        },
    )

def _number(value: Any) -> float:
    if value is None:
        return 0.0

    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _safe_ratio(numerator: Any, denominator: Any) -> Optional[float]:
    denominator_value = _number(denominator)

    if denominator_value == 0:
        return None

    return _number(numerator) / denominator_value


def _average(values: Iterable[Any]) -> Optional[float]:
    cleaned = [_number(value) for value in values if value is not None]

    if not cleaned:
        return None

    return sum(cleaned) / len(cleaned)


def _latest(rows: Sequence[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    return rows[-1] if rows else None


def _reporting_period_bounds(
    *row_groups: Sequence[Dict[str, Any]],
) -> Tuple[Optional[date], Optional[date]]:
    dates = [
        value.date() if isinstance(value, datetime) else value
        for rows in row_groups
        for row in rows
        for value in [row.get("report_date")]
        if isinstance(value, (date, datetime))
    ]
    if not dates:
        return None, None
    return min(dates), max(dates)


def _format_date(value: Any, language: str = "en") -> str:
    if isinstance(value, datetime):
        return format_report_date(value, language, "short_chart_date")
    if isinstance(value, date):
        return format_report_date(value, language, "short_chart_date")
    return str(value or "")


def _format_number(
    value: Optional[float],
    decimals: int = 0,
    language: str = "en",
) -> str:
    if value is None:
        return localize_report_label("no_data", language)

    return f"{value:,.{decimals}f}"


def _format_percent(
    value: Optional[float],
    decimals: int = 1,
    language: str = "en",
) -> str:
    if value is None:
        return localize_report_label("no_data", language)

    return f"{value:.{decimals}f}%"


def _achievement_status(value: Optional[float]) -> Tuple[str, str, str]:
    """
    Return status label, foreground color, and light background color.

    Input is expected as a ratio, for example 0.96 or 1.04.
    """

    if value is None:
        return "No data", TEXT_MUTED, BACKGROUND

    if value >= 1.0:
        return "On / above target", GREEN, GREEN_LIGHT

    if value >= 0.9:
        return "Watch", AMBER, AMBER_LIGHT

    return "Below target", RED, RED_LIGHT


def _localized_achievement_status(
    value: Optional[float],
    language: str,
) -> Tuple[str, str, str]:
    """Localize an achievement display after semantic threshold evaluation."""

    _, foreground, background = _achievement_status(value)
    if value is None:
        key = "no_data"
    elif value >= 1.0:
        key = "on_or_above_target_status"
    elif value >= 0.9:
        key = "watch"
    else:
        key = "below_target_status"
    return localize_report_label(key, language), foreground, background


def _localized_semantic_value(
    value: Any,
    language: str,
    *,
    fallback_key: str,
) -> str:
    """Localize known semantic codes while preserving customer-entered text."""

    semantic_value = getattr(value, "value", value)
    source = str(semantic_value or "").strip()
    if not source:
        return localize_report_label(fallback_key, language)

    normalized = source.lower().replace("-", " ").replace("_", " ")
    key = "_".join(normalized.split())
    known_keys = {
        "critical",
        "high",
        "medium",
        "low",
        "open",
        "in_progress",
        "not_started",
        "completed",
        "overdue",
        "unassigned",
        "not_set",
    }
    if key in known_keys:
        return localize_report_label(key, language)
    return source


_MN_ACTION_TITLE_DISPLAY_MAPPINGS = {
    "Review the lowest-performing operational KPI": (
        "Хамгийн сул гүйцэтгэлтэй үйл ажиллагааны KPI-г хянан үзэх"
    ),
    "Investigate production loss versus plan": (
        "Үйлдвэрлэлийн төлөвлөгөөний зөрүүний шалтгааныг судлах"
    ),
}

_MN_ACTION_OWNER_DISPLAY_MAPPINGS = {
    "Operations": "Үйл ажиллагаа",
    "Processing Operations": "Боловсруулах үйлдвэрийн үйл ажиллагаа",
}


def _localized_action_title(value: Any, language: str) -> str:
    """Localize curated action titles for PowerPoint display only."""

    source = str(value or "").strip()
    if normalize_report_language(language) != "mn":
        return source
    return _MN_ACTION_TITLE_DISPLAY_MAPPINGS.get(source, source)


def _localized_action_owner(value: Any, language: str) -> str:
    """Localize curated organizational owners for PowerPoint display only."""

    source = str(value or "").strip()
    if normalize_report_language(language) != "mn":
        return source
    return _MN_ACTION_OWNER_DISPLAY_MAPPINGS.get(source, source)


def _hex_to_rgb(value: str) -> RGBColor:
    cleaned = value.strip().replace("#", "")

    if len(cleaned) != 6:
        cleaned = TEXT_DARK

    return RGBColor(
        int(cleaned[0:2], 16),
        int(cleaned[2:4], 16),
        int(cleaned[4:6], 16),
    )


# -------------------------------------------------------------------
# Shape helpers
# -------------------------------------------------------------------

def _set_slide_background(slide, color: str = BACKGROUND) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = _hex_to_rgb(color)


def _add_text(
    slide,
    text_value: str,
    left: float,
    top: float,
    width: float,
    height: float,
    font_size: float = 18,
    color: str = TEXT_DARK,
    bold: bool = False,
    alignment: PP_ALIGN = PP_ALIGN.LEFT,
    vertical_anchor: MSO_ANCHOR = MSO_ANCHOR.MIDDLE,
    font_name: Optional[str] = None,
    language: str = "en",
    word_wrap: bool = True,
) -> Any:
    box = slide.shapes.add_textbox(
        Inches(left),
        Inches(top),
        Inches(width),
        Inches(height),
    )

    frame = box.text_frame
    frame.clear()
    frame.word_wrap = word_wrap
    frame.vertical_anchor = vertical_anchor
    frame.margin_left = 0
    frame.margin_right = 0
    frame.margin_top = 0
    frame.margin_bottom = 0

    paragraph = frame.paragraphs[0]
    paragraph.alignment = alignment

    run = paragraph.add_run()
    run.text = str(text_value)
    run.font.name = font_name or ("Arial" if language == "mn" else "Aptos")
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.color.rgb = _hex_to_rgb(color)

    return box


def _add_rounded_rectangle(
    slide,
    left: float,
    top: float,
    width: float,
    height: float,
    fill_color: str = WHITE,
    line_color: str = BORDER,
    radius_shape: MSO_AUTO_SHAPE_TYPE = (
        MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE
    ),
) -> Any:
    shape = slide.shapes.add_shape(
        radius_shape,
        Inches(left),
        Inches(top),
        Inches(width),
        Inches(height),
    )

    shape.fill.solid()
    shape.fill.fore_color.rgb = _hex_to_rgb(fill_color)
    shape.line.color.rgb = _hex_to_rgb(line_color)
    shape.line.width = Pt(0.8)

    return shape


def _add_divider(
    slide,
    left: float,
    top: float,
    width: float,
    color: str = BORDER,
) -> None:
    line = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE,
        Inches(left),
        Inches(top),
        Inches(width),
        Inches(0.015),
    )
    line.fill.solid()
    line.fill.fore_color.rgb = _hex_to_rgb(color)
    line.line.fill.background()


def _add_slide_number(slide, number: int, language: str = "en") -> None:
    _add_text(
        slide,
        str(number),
        12.65,
        7.05,
        0.35,
        0.2,
        font_size=9,
        color=TEXT_MUTED,
        alignment=PP_ALIGN.RIGHT,
        language=language,
    )


def _add_logo(
    slide,
    branding: ReportBranding,
    left: float,
    top: float,
    width: float,
) -> bool:
    if not branding.logo_path:
        return False

    logo_path = Path(branding.logo_path)

    if not logo_path.exists():
        return False

    try:
        slide.shapes.add_picture(
            str(logo_path),
            Inches(left),
            Inches(top),
            width=Inches(width),
        )
        return True
    except Exception:
        return False


def _add_standard_header(
    slide,
    branding: ReportBranding,
    title: str,
    subtitle: Optional[str],
    slide_number: int,
    language: str = "en",
) -> None:
    primary = branding.primary_color_excel

    accent = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE,
        Inches(0),
        Inches(0),
        Inches(0.12),
        SLIDE_HEIGHT,
    )
    accent.fill.solid()
    accent.fill.fore_color.rgb = _hex_to_rgb(primary)
    accent.line.fill.background()

    _add_text(
        slide,
        branding.company_name,
        0.55,
        0.28,
        7.5,
        0.3,
        font_size=11,
        color=primary,
        bold=True,
        language=language,
    )

    _add_text(
        slide,
        title,
        0.55,
        0.62 if language == "mn" else 0.68,
        10.7,
        0.7 if language == "mn" else 0.55,
        font_size=24 if language == "mn" else 27,
        color=TEXT_DARK,
        bold=True,
        language=language,
        word_wrap=False,
    )

    if subtitle:
        _add_text(
            slide,
            subtitle,
            0.55,
            1.25,
            10.7,
            0.35,
            font_size=10.5 if language == "mn" else 11,
            color=TEXT_MUTED,
            language=language,
            word_wrap=False,
        )

    logo_added = _add_logo(
        slide,
        branding,
        left=11.55,
        top=0.25,
        width=1.15,
    )

    if not logo_added:
        _add_text(
            slide,
            branding.mine_name,
            10.1,
            0.35,
            2.55,
            0.35,
            font_size=10,
            color=TEXT_MUTED,
            alignment=PP_ALIGN.RIGHT,
            language=language,
        )

    _add_divider(slide, 0.55, 1.72, 12.1)
    _add_slide_number(slide, slide_number, language)


def _add_kpi_card(
    slide,
    title: str,
    value: str,
    status: str,
    left: float,
    top: float,
    width: float,
    height: float,
    status_color: str,
    status_background: str,
    note: Optional[str] = None,
    language: str = "en",
) -> None:
    _add_rounded_rectangle(
        slide,
        left,
        top,
        width,
        height,
        fill_color=WHITE,
    )

    _add_text(
        slide,
        title,
        left + 0.25,
        top + 0.18,
        width - 0.5,
        0.35,
        font_size=10,
        color=TEXT_MUTED,
        bold=True,
        language=language,
    )

    _add_text(
        slide,
        value,
        left + 0.25,
        top + 0.64,
        width - 0.5,
        0.55,
        font_size=25,
        color=TEXT_DARK,
        bold=True,
        language=language,
    )

    is_mongolian = language == "mn"
    badge_width = min(
        max(1.1, len(status) * (0.064 if is_mongolian else 0.075)),
        width - 0.5,
    )
    badge_top = top + (1.24 if is_mongolian else 1.37)
    badge_height = 0.31 if is_mongolian else 0.34

    _add_rounded_rectangle(
        slide,
        left + 0.25,
        badge_top,
        badge_width,
        badge_height,
        fill_color=status_background,
        line_color=status_background,
    )

    _add_text(
        slide,
        status,
        left + 0.34,
        badge_top + (0.035 if is_mongolian else 0.035),
        badge_width - 0.18,
        0.24,
        font_size=7.2 if is_mongolian else 8.5,
        color=status_color,
        bold=True,
        language=language,
    )

    if note:
        _add_text(
            slide,
            note,
            left + 0.25,
            top + height - (0.34 if is_mongolian else 0.48),
            width - 0.5,
            0.24 if is_mongolian else 0.28,
            font_size=7.4 if is_mongolian else 8.5,
            color=TEXT_MUTED,
            language=language,
        )


def _add_bullet_list(
    slide,
    items: Sequence[str],
    left: float,
    top: float,
    width: float,
    height: float,
    font_size: float = 14,
    color: str = TEXT_DARK,
    bullet_color: Optional[str] = None,
    language: str = "en",
) -> None:
    box = slide.shapes.add_textbox(
        Inches(left),
        Inches(top),
        Inches(width),
        Inches(height),
    )

    frame = box.text_frame
    frame.clear()
    frame.word_wrap = True
    frame.margin_left = 0
    frame.margin_right = 0
    frame.margin_top = 0
    frame.margin_bottom = 0

    for index, item in enumerate(items):
        paragraph = (
            frame.paragraphs[0]
            if index == 0
            else frame.add_paragraph()
        )
        paragraph.text = f"•  {item}"
        paragraph.font.name = "Arial" if language == "mn" else "Aptos"
        paragraph.font.size = Pt(font_size)
        paragraph.font.color.rgb = _hex_to_rgb(
            bullet_color or color
        )
        paragraph.space_after = Pt(9)
        paragraph.level = 0


# -------------------------------------------------------------------
# Chart helpers
# -------------------------------------------------------------------

def _add_line_chart(
    slide,
    categories: Sequence[str],
    series: Sequence[Tuple[str, Sequence[float], str]],
    left: float,
    top: float,
    width: float,
    height: float,
    title: Optional[str] = None,
    percentage_axis: bool = False,
    language: str = "en",
) -> None:
    if not categories or not series:
        _add_rounded_rectangle(
            slide,
            left,
            top,
            width,
            height,
            fill_color=WHITE,
        )
        _add_text(
            slide,
            localize_report_label("no_trend_data_available", language),
            left + 0.3,
            top + height / 2 - 0.2,
            width - 0.6,
            0.4,
            font_size=13,
            color=TEXT_MUTED,
            alignment=PP_ALIGN.CENTER,
            language=language,
        )
        return

    chart_data = CategoryChartData()
    chart_data.categories = list(categories)

    for name, values, _ in series:
        chart_data.add_series(name, list(values))

    chart = slide.shapes.add_chart(
        XL_CHART_TYPE.LINE_MARKERS,
        Inches(left),
        Inches(top),
        Inches(width),
        Inches(height),
        chart_data,
    ).chart

    chart.has_legend = len(series) > 1

    if chart.has_legend and chart.legend is not None:
        chart.legend.position = XL_LEGEND_POSITION.BOTTOM
        chart.legend.include_in_layout = False
        chart.legend.font.size = Pt(9)
        chart.legend.font.name = "Arial" if language == "mn" else "Aptos"

    chart.has_title = bool(title)

    if title:
        chart.chart_title.text_frame.text = title
        chart.chart_title.text_frame.paragraphs[0].font.size = Pt(12)
        chart.chart_title.text_frame.paragraphs[0].font.bold = True
        chart.chart_title.text_frame.paragraphs[0].font.name = (
            "Arial" if language == "mn" else "Aptos"
        )

    chart.value_axis.has_major_gridlines = True
    chart.value_axis.major_gridlines.format.line.color.rgb = (
        _hex_to_rgb(BORDER)
    )
    chart.value_axis.tick_labels.font.size = Pt(8)
    chart.category_axis.tick_labels.font.size = Pt(8)
    chart.value_axis.tick_labels.font.name = "Arial" if language == "mn" else "Aptos"
    chart.category_axis.tick_labels.font.name = "Arial" if language == "mn" else "Aptos"

    if percentage_axis:
        chart.value_axis.tick_labels.number_format = "0%"
        chart.value_axis.maximum_scale = 1.2
        chart.value_axis.minimum_scale = 0

    plot = chart.plots[0]

    for index, (_, _, color) in enumerate(series):
        plot.series[index].format.line.color.rgb = _hex_to_rgb(color)
        plot.series[index].format.line.width = Pt(2)
        plot.series[index].marker.format.fill.solid()
        plot.series[index].marker.format.fill.fore_color.rgb = (
            _hex_to_rgb(color)
        )
        plot.series[index].marker.format.line.color.rgb = (
            _hex_to_rgb(color)
        )


# -------------------------------------------------------------------
# Slide builders
# -------------------------------------------------------------------

def _build_cover_slide(
    presentation: Presentation,
    branding: ReportBranding,
    language: str,
    reporting_period: Tuple[Optional[date], Optional[date]],
) -> None:
    slide = presentation.slides.add_slide(
        presentation.slide_layouts[6]
    )
    _set_slide_background(slide, branding.secondary_color_excel)

    primary = branding.primary_color_excel

    accent = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE,
        Inches(0),
        Inches(0),
        Inches(0.24),
        SLIDE_HEIGHT,
    )
    accent.fill.solid()
    accent.fill.fore_color.rgb = _hex_to_rgb(primary)
    accent.line.fill.background()

    _add_text(
        slide,
        branding.company_name,
        0.85,
        0.7,
        8.5,
        0.45,
        font_size=16,
        color=primary,
        bold=True,
        language=language,
    )

    _add_text(
        slide,
        localize_report_label("executive_operations_board_pack_cover", language),
        0.85,
        1.65,
        8.7,
        1.75,
        font_size=36,
        color=WHITE,
        bold=True,
        vertical_anchor=MSO_ANCHOR.TOP,
        language=language,
    )

    _add_text(
        slide,
        branding.mine_name,
        0.85,
        3.72,
        8.5,
        0.5,
        font_size=18,
        color=WHITE,
        language=language,
    )

    _add_divider(
        slide,
        0.85,
        4.55,
        4.8,
        color=primary,
    )

    generated_at = datetime.now()
    generated = (
        format_report_date(generated_at, language, "generated_timestamp")
        if language == "mn"
        else generated_at.strftime("%d %B %Y, %H:%M")
    )
    period_start, period_end = reporting_period
    metadata_lines = []
    if period_start is not None and period_end is not None:
        metadata_lines.append(
            f"{localize_report_label('reporting_period', language)}: "
            f"{format_report_date(period_start, language, 'reporting_period_date')} – "
            f"{format_report_date(period_end, language, 'reporting_period_date')}"
        )
    metadata_lines.extend(
        (
            f"{localize_report_label('generated_metadata', language)}: {generated}",
            f"{localize_report_label('timezone', language)}: {branding.timezone}",
        )
    )

    _add_text(
        slide,
        "\n".join(metadata_lines),
        0.85,
        4.85,
        5.2,
        1.1,
        font_size=10 if language == "mn" else 11,
        color="CBD5E1",
        vertical_anchor=MSO_ANCHOR.TOP,
        language=language,
    )

    logo_added = _add_logo(
        slide,
        branding,
        left=10.1,
        top=0.85,
        width=2.1,
    )

    if not logo_added:
        _add_rounded_rectangle(
            slide,
            9.85,
            0.85,
            2.3,
            1.2,
            fill_color=primary,
            line_color=primary,
        )
        _add_text(
            slide,
            branding.company_name,
            10.05,
            1.08,
            1.9,
            0.65,
            font_size=14,
            color=WHITE,
            bold=True,
            alignment=PP_ALIGN.CENTER,
            language=language,
        )

    _add_text(
        slide,
        "Mine Manager AI",
        10.0,
        6.75,
        2.15,
        0.25,
        font_size=9,
        color="94A3B8",
        alignment=PP_ALIGN.RIGHT,
        language=language,
    )


def _build_kpi_summary_slide(
    presentation: Presentation,
    branding: ReportBranding,
    production_rows: List[Dict[str, Any]],
    fleet_rows: List[Dict[str, Any]],
    plant_rows: List[Dict[str, Any]],
    safety_rows: List[Dict[str, Any]],
    operation_profile: str,
    language: str,
) -> None:
    slide = presentation.slides.add_slide(
        presentation.slide_layouts[6]
    )
    _set_slide_background(slide)

    is_sxew = _is_sxew_operation(operation_profile)

    subtitle = (
        localize_report_label("current_position_sxew", language)
        if is_sxew
        else localize_report_label("current_position_standard", language)
    )

    _add_standard_header(
        slide,
        branding,
        localize_report_label("executive_kpi_summary", language),
        subtitle,
        2,
        language,
    )

    latest_production = _latest(production_rows)
    latest_fleet = _latest(fleet_rows)
    latest_plant = _latest(plant_rows)
    latest_safety = _latest(safety_rows)

    production_achievement = (
        _safe_ratio(
            latest_production.get("ore_actual"),
            latest_production.get("ore_plan"),
        )
        if latest_production
        else None
    )

    plant_achievement = (
        _safe_ratio(
            latest_plant.get("throughput_actual"),
            latest_plant.get("throughput_plan"),
        )
        if latest_plant
        else None
    )

    safety_score = (
        _number(latest_safety.get("safety_score"))
        if latest_safety
        else None
    )

    incidents = (
        int(_number(latest_safety.get("incidents")))
        if latest_safety
        else None
    )

    card_width = 3.82
    card_height = 2.05
    positions = [
        (0.55, 2.05),
        (4.52, 2.05),
        (8.49, 2.05),
        (0.55, 4.38),
        (4.52, 4.38),
        (8.49, 4.38),
    ]

    production_status = _localized_achievement_status(
        production_achievement,
        language,
    )
    _add_kpi_card(
        slide,
        (
            localize_report_label("cathode_production_achievement", language)
            if is_sxew
            else localize_report_label("ore_plan_achievement", language)
        ),
        _format_percent(
            production_achievement * 100
            if production_achievement is not None
            else None,
            language=language,
        ),
        production_status[0],
        *positions[0],
        card_width,
        card_height,
        production_status[1],
        production_status[2],
        note=(
            localize_report_label("cathode_actual_vs_plan", language)
            if is_sxew
            else localize_report_label("ore_actual_vs_plan", language)
        ),
        language=language,
    )

    plant_status = _localized_achievement_status(
        plant_achievement,
        language,
    )
    plant_position = positions[1] if is_sxew else positions[3]
    _add_kpi_card(
        slide,
        localize_report_label("plant_throughput_achievement", language),
        _format_percent(
            plant_achievement * 100
            if plant_achievement is not None
            else None,
            language=language,
        ),
        plant_status[0],
        *plant_position,
        card_width,
        card_height,
        plant_status[1],
        plant_status[2],
        note=localize_report_label("throughput_actual_vs_plan", language),
        language=language,
    )

    safety_ratio = (
        safety_score / 100
        if safety_score is not None
        else None
    )
    safety_status = _localized_achievement_status(safety_ratio, language)
    safety_position = positions[2] if is_sxew else positions[4]
    _add_kpi_card(
        slide,
        localize_report_label("powerpoint_safety_score", language),
        _format_percent(safety_score, language=language),
        safety_status[0],
        *safety_position,
        card_width,
        card_height,
        safety_status[1],
        safety_status[2],
        note=localize_report_label("latest_composite_safety_score", language),
        language=language,
    )

    incident_status = (
        (localize_report_label("no_incidents", language), GREEN, GREEN_LIGHT)
        if incidents == 0
        else (
            (localize_report_label("review_required", language), RED, RED_LIGHT)
            if incidents is not None
            else (localize_report_label("no_data", language), TEXT_MUTED, BACKGROUND)
        )
    )
    incident_position = positions[3] if is_sxew else positions[5]
    _add_kpi_card(
        slide,
        localize_report_label("safety_incidents", language),
        str(incidents) if incidents is not None else localize_report_label("no_data", language),
        incident_status[0],
        *incident_position,
        card_width,
        card_height,
        incident_status[1],
        incident_status[2],
        note=localize_report_label("latest_reporting_date", language),
        language=language,
    )

    if not is_sxew:
        fleet_availability = (
            _number(latest_fleet.get("availability"))
            if latest_fleet
            else None
        )
        fleet_utilization = (
            _number(latest_fleet.get("utilization"))
            if latest_fleet
            else None
        )

        availability_ratio = (
            fleet_availability / 100
            if fleet_availability is not None
            else None
        )
        availability_status = _localized_achievement_status(
            availability_ratio,
            language,
        )
        _add_kpi_card(
            slide,
            localize_report_label("fleet_availability", language),
            _format_percent(fleet_availability, language=language),
            availability_status[0],
            *positions[1],
            card_width,
            card_height,
            availability_status[1],
            availability_status[2],
            note=localize_report_label("latest_available_fleet_record", language),
            language=language,
        )

        utilization_ratio = (
            fleet_utilization / 100
            if fleet_utilization is not None
            else None
        )
        utilization_status = _localized_achievement_status(
            utilization_ratio,
            language,
        )
        _add_kpi_card(
            slide,
            localize_report_label("fleet_utilization", language),
            _format_percent(fleet_utilization, language=language),
            utilization_status[0],
            *positions[2],
            card_width,
            card_height,
            utilization_status[1],
            utilization_status[2],
            note=localize_report_label("latest_available_fleet_record", language),
            language=language,
        )

def _build_production_slide(
    presentation: Presentation,
    branding: ReportBranding,
    production_rows: List[Dict[str, Any]],
    operation_profile: str,
    language: str,
) -> None:
    slide = presentation.slides.add_slide(
        presentation.slide_layouts[6]
    )
    _set_slide_background(slide)

    is_sxew = _is_sxew_operation(operation_profile)

    _add_standard_header(
        slide,
        branding,
        (
            localize_report_label("cathode_production_trend", language)
            if is_sxew
            else localize_report_label("production_trend", language)
        ),
        (
            localize_report_label("cathode_plan_vs_actual_performance", language)
            if is_sxew
            else localize_report_label("ore_plan_vs_actual_performance", language)
        ),
        3,
        language,
    )

    trend_rows = production_rows[-14:]
    categories = [
        _format_date(row.get("report_date"), language)
        for row in trend_rows
    ]

    plan_values = [
        _number(row.get("ore_plan"))
        for row in trend_rows
    ]
    actual_values = [
        _number(row.get("ore_actual"))
        for row in trend_rows
    ]

    _add_line_chart(
        slide,
        categories,
        [
            (
                localize_report_label("cathode_plan", language)
                if is_sxew
                else localize_report_label("ore_plan", language),
                plan_values,
                TEXT_MUTED,
            ),
            (
                localize_report_label("cathode_actual", language)
                if is_sxew
                else localize_report_label("ore_actual", language),
                actual_values,
                branding.primary_color_excel,
            ),
        ],
        0.55,
        2.0,
        8.35,
        4.6,
        title=localize_report_label("recent_reporting_periods", language),
        language=language,
    )

    latest_production = _latest(production_rows)

    if latest_production:
        production_plan = _number(
            latest_production.get("ore_plan")
        )
        production_actual = _number(
            latest_production.get("ore_actual")
        )
        achievement = _safe_ratio(
            production_actual,
            production_plan,
        )
        variance = (
            production_actual
            - production_plan
        )
    else:
        production_plan = None
        production_actual = None
        achievement = None
        variance = None

    status = _localized_achievement_status(achievement, language)

    _add_rounded_rectangle(
        slide,
        9.2,
        2.0,
        3.55,
        4.6,
        fill_color=WHITE,
    )

    _add_text(
        slide,
        localize_report_label("latest_position", language),
        9.5,
        2.28,
        2.9,
        0.35,
        font_size=12,
        color=TEXT_DARK,
        bold=True,
        language=language,
    )

    items = [
        (
            localize_report_label("cathode_plan_label", language)
            if is_sxew else localize_report_label("ore_plan", language),
            _format_number(production_plan, language=language),
        ),
        (
            localize_report_label("cathode_actual_label", language)
            if is_sxew else localize_report_label("ore_actual", language),
            _format_number(production_actual, language=language),
        ),
        (
            localize_report_label("variance", language),
            _format_number(variance, language=language),
        ),
        (
            localize_report_label("achievement", language),
            _format_percent(
                achievement * 100
                if achievement is not None
                else None,
                language=language,
            ),
        ),
    ]

    for index, (label, value) in enumerate(items):
        row_top = 2.9 + index * 0.68

        _add_text(
            slide,
            label,
            9.5,
            row_top,
            1.45,
            0.3,
            font_size=10,
            color=TEXT_MUTED,
            language=language,
        )
        _add_text(
            slide,
            value,
            10.85,
            row_top,
            1.55,
            0.3,
            font_size=13,
            color=TEXT_DARK,
            bold=True,
            alignment=PP_ALIGN.RIGHT,
            language=language,
        )
        _add_divider(
            slide,
            9.5,
            row_top + 0.42,
            2.9,
        )

    _add_rounded_rectangle(
        slide,
        9.5,
        5.72,
        2.9,
        0.5,
        fill_color=status[2],
        line_color=status[2],
    )
    _add_text(
        slide,
        status[0],
        9.7,
        5.82,
        2.5,
        0.25,
        font_size=10,
        color=status[1],
        bold=True,
        alignment=PP_ALIGN.CENTER,
        language=language,
    )

def _build_operations_overview_slide(
    presentation: Presentation,
    branding: ReportBranding,
    fleet_rows: List[Dict[str, Any]],
    plant_rows: List[Dict[str, Any]],
    safety_rows: List[Dict[str, Any]],
    operation_profile: str,
    language: str,
) -> None:
    slide = presentation.slides.add_slide(
        presentation.slide_layouts[6]
    )
    _set_slide_background(slide)

    is_sxew = _is_sxew_operation(operation_profile)

    _add_standard_header(
        slide,
        branding,
        (
            localize_report_label("plant_and_safety_overview", language)
            if is_sxew
            else localize_report_label("fleet_plant_and_safety_overview", language)
        ),
        (
            localize_report_label("recent_processing_and_safety", language)
            if is_sxew
            else localize_report_label("recent_supporting_value_streams", language)
        ),
        4,
        language,
    )

    plant_trend = plant_rows[-10:]
    plant_categories = [
        _format_date(row.get("report_date"), language)
        for row in plant_trend
    ]
    plant_achievement = [
        _safe_ratio(
            row.get("throughput_actual"),
            row.get("throughput_plan"),
        )
        or 0
        for row in plant_trend
    ]

    if is_sxew:
        _add_line_chart(
            slide,
            plant_categories,
            [
                (
                    localize_report_label("throughput_achievement", language),
                    plant_achievement,
                    branding.primary_color_excel,
                )
            ],
            0.55,
            2.02,
            12.2,
            2.1,
            title=localize_report_label("plant_throughput_achievement", language),
            percentage_axis=True,
            language=language,
        )
    else:
        fleet_trend = fleet_rows[-10:]
        fleet_categories = [
            _format_date(row.get("report_date"), language)
            for row in fleet_trend
        ]
        fleet_availability = [
            _number(row.get("availability")) / 100
            for row in fleet_trend
        ]
        fleet_utilization = [
            _number(row.get("utilization")) / 100
            for row in fleet_trend
        ]

        _add_line_chart(
            slide,
            fleet_categories,
            [
                (
                    localize_report_label("availability", language),
                    fleet_availability,
                    BLUE,
                ),
                (
                    localize_report_label("utilization", language),
                    fleet_utilization,
                    branding.primary_color_excel,
                ),
            ],
            0.55,
            2.02,
            5.95,
            2.1,
            title=localize_report_label("fleet_performance", language),
            percentage_axis=True,
            language=language,
        )

        _add_line_chart(
            slide,
            plant_categories,
            [
                (
                    localize_report_label("throughput_achievement", language),
                    plant_achievement,
                    GREEN,
                )
            ],
            6.8,
            2.02,
            5.95,
            2.1,
            title=localize_report_label("plant_throughput_achievement", language),
            percentage_axis=True,
            language=language,
        )

    _add_rounded_rectangle(
        slide,
        0.55,
        4.43,
        12.2,
        1.95,
        fill_color=WHITE,
    )

    latest_safety = _latest(safety_rows)

    safety_metrics = [
        (
            localize_report_label("incidents", language),
            str(
                int(
                    _number(
                        latest_safety.get("incidents")
                    )
                )
            )
            if latest_safety
            else localize_report_label("no_data", language),
        ),
        (
            localize_report_label("powerpoint_near_misses", language),
            str(
                int(
                    _number(
                        latest_safety.get("near_misses")
                    )
                )
            )
            if latest_safety
            else localize_report_label("no_data", language),
        ),
        (
            localize_report_label("powerpoint_critical_risks", language),
            str(
                int(
                    _number(
                        latest_safety.get("critical_risks")
                    )
                )
            )
            if latest_safety
            else localize_report_label("no_data", language),
        ),
        (
            localize_report_label("powerpoint_safety_score", language),
            _format_percent(
                _number(
                    latest_safety.get("safety_score")
                )
                if latest_safety
                else None,
                language=language,
            ),
        ),
    ]

    _add_text(
        slide,
        localize_report_label("latest_safety_position", language),
        0.85,
        4.7,
        2.5,
        0.35,
        font_size=12,
        color=TEXT_DARK,
        bold=True,
        language=language,
    )

    for index, (label, value) in enumerate(
        safety_metrics
    ):
        left = 0.85 + index * 2.9

        _add_text(
            slide,
            label,
            left,
            5.25,
            2.2,
            0.3,
            font_size=9.5,
            color=TEXT_MUTED,
            language=language,
        )
        _add_text(
            slide,
            value,
            left,
            5.62,
            2.2,
            0.42,
            font_size=22,
            color=TEXT_DARK,
            bold=True,
            language=language,
        )

def _build_risk_slide(
    presentation: Presentation,
    branding: ReportBranding,
    production_rows: List[Dict[str, Any]],
    fleet_rows: List[Dict[str, Any]],
    plant_rows: List[Dict[str, Any]],
    safety_rows: List[Dict[str, Any]],
    operation_profile: str,
    language: str,
) -> None:
    slide = presentation.slides.add_slide(
        presentation.slide_layouts[6]
    )
    _set_slide_background(slide)

    is_sxew = _is_sxew_operation(operation_profile)

    _add_standard_header(
        slide,
        branding,
        localize_report_label("key_operational_risks", language),
        localize_report_label("automated_risk_observations", language),
        5,
        language,
    )

    latest_production = _latest(production_rows)
    latest_fleet = _latest(fleet_rows)
    latest_plant = _latest(plant_rows)
    latest_safety = _latest(safety_rows)

    risks: List[Tuple[str, str, str]] = []

    if latest_production:
        production_achievement = _safe_ratio(
            latest_production.get("ore_actual"),
            latest_production.get("ore_plan"),
        )

        if (
            production_achievement is not None
            and production_achievement < 0.9
        ):
            risks.append(
                (
                    "High",
                    localize_report_label(
                        "cathode_materially_below_plan"
                        if is_sxew else "ore_materially_below_plan",
                        language,
                    ),
                    localize_report_label(
                        "latest_achievement_sentence", language
                    ).format(value=f"{production_achievement * 100:.1f}"),
                )
            )
        elif (
            production_achievement is not None
            and production_achievement < 1.0
        ):
            risks.append(
                (
                    "Medium",
                    localize_report_label(
                        "cathode_below_plan" if is_sxew else "ore_below_plan",
                        language,
                    ),
                    localize_report_label(
                        "latest_achievement_sentence", language
                    ).format(value=f"{production_achievement * 100:.1f}"),
                )
            )

    if latest_fleet and not is_sxew:
        availability = _number(
            latest_fleet.get("availability")
        )
        utilization = _number(
            latest_fleet.get("utilization")
        )

        if availability < 80:
            risks.append(
                (
                    "High",
                    localize_report_label("fleet_availability_constraint", language),
                    localize_report_label(
                        "latest_availability_sentence", language
                    ).format(value=f"{availability:.1f}"),
                )
            )
        elif availability < 90:
            risks.append(
                (
                    "Medium",
                    localize_report_label("fleet_availability_below_target", language),
                    localize_report_label(
                        "latest_availability_sentence", language
                    ).format(value=f"{availability:.1f}"),
                )
            )

        if utilization < 75:
            risks.append(
                (
                    "High",
                    localize_report_label("fleet_utilization_constraint", language),
                    localize_report_label(
                        "latest_utilization_sentence", language
                    ).format(value=f"{utilization:.1f}"),
                )
            )
        elif utilization < 90:
            risks.append(
                (
                    "Medium",
                    localize_report_label("fleet_utilization_below_target", language),
                    localize_report_label(
                        "latest_utilization_sentence", language
                    ).format(value=f"{utilization:.1f}"),
                )
            )

    if latest_plant:
        plant_achievement = _safe_ratio(
            latest_plant.get("throughput_actual"),
            latest_plant.get("throughput_plan"),
        )

        if (
            plant_achievement is not None
            and plant_achievement < 0.9
        ):
            risks.append(
                (
                    "High",
                    localize_report_label("plant_throughput_materially_below_plan", language),
                    localize_report_label(
                        "latest_achievement_sentence", language
                    ).format(value=f"{plant_achievement * 100:.1f}"),
                )
            )
        elif (
            plant_achievement is not None
            and plant_achievement < 1.0
        ):
            risks.append(
                (
                    "Medium",
                    localize_report_label("plant_throughput_below_plan", language),
                    localize_report_label(
                        "latest_achievement_sentence", language
                    ).format(value=f"{plant_achievement * 100:.1f}"),
                )
            )

    if latest_safety:
        incidents = int(
            _number(
                latest_safety.get("incidents")
            )
        )
        critical_risks = int(
            _number(
                latest_safety.get("critical_risks")
            )
        )

        if incidents > 0:
            risks.append(
                (
                    "Critical",
                    localize_report_label("safety_incident_recorded", language),
                    localize_report_label(
                        "incident_latest_record_sentence", language
                    ).format(count=incidents),
                )
            )

        if critical_risks > 0:
            risks.append(
                (
                    "High",
                    localize_report_label("open_critical_safety_risks", language),
                    localize_report_label(
                        "critical_exposure_review_sentence", language
                    ).format(count=critical_risks),
                )
            )

    if not risks:
        risks.append(
            (
                "Low",
                localize_report_label("no_material_threshold_exception", language),
                localize_report_label("screening_threshold_sentence", language),
            )
        )

    risks = risks[:5]

    color_map = {
        "Critical": (RED, RED_LIGHT),
        "High": (RED, RED_LIGHT),
        "Medium": (AMBER, AMBER_LIGHT),
        "Low": (GREEN, GREEN_LIGHT),
    }

    for index, (level, title, description) in enumerate(
        risks
    ):
        top = 2.05 + index * 0.92
        level_color, level_background = (
            color_map[level]
        )

        _add_rounded_rectangle(
            slide,
            0.55,
            top,
            12.2,
            0.72,
            fill_color=WHITE,
        )

        _add_rounded_rectangle(
            slide,
            0.78,
            top + 0.17,
            1.05,
            0.36,
            fill_color=level_background,
            line_color=level_background,
        )
        _add_text(
            slide,
            localize_report_label(level, language),
            0.88,
            top + 0.22,
            0.85,
            0.23,
            font_size=8.5,
            color=level_color,
            bold=True,
            alignment=PP_ALIGN.CENTER,
            language=language,
        )

        _add_text(
            slide,
            title,
            2.05,
            top + 0.12,
            4.55,
            0.28,
            font_size=11,
            color=TEXT_DARK,
            bold=True,
            language=language,
        )

        _add_text(
            slide,
            description,
            6.45,
            top + 0.12,
            5.95,
            0.4,
            font_size=9.5,
            color=TEXT_MUTED,
            language=language,
        )

def _build_actions_slide(
    presentation: Presentation,
    branding: ReportBranding,
    actions: List[Dict[str, Any]],
    language: str,
) -> None:
    slide = presentation.slides.add_slide(
        presentation.slide_layouts[6]
    )
    _set_slide_background(slide)

    _add_standard_header(
        slide,
        branding,
        localize_report_label("management_action_register", language),
        localize_report_label("priority_actions_subtitle", language),
        6,
        language,
    )

    visible_actions = actions[:5]

    if not visible_actions:
        _add_rounded_rectangle(
            slide,
            0.55,
            2.1,
            12.2,
            3.9,
            fill_color=WHITE,
        )
        _add_text(
            slide,
            localize_report_label("no_executive_actions", language),
            1.0,
            3.4,
            11.3,
            0.5,
            font_size=18,
            color=TEXT_MUTED,
            alignment=PP_ALIGN.CENTER,
            language=language,
        )
        return

    headers = [
        (localize_report_label("priority", language), 0.7),
        (localize_report_label("action", language), 1.85),
        (localize_report_label("owner", language), 7.7),
        (localize_report_label("timing", language), 9.5),
        (localize_report_label("status", language), 11.05),
    ]

    for label, left in headers:
        _add_text(
            slide,
            label,
            left,
            2.0,
            1.3,
            0.3,
            font_size=9.5,
            color=TEXT_MUTED,
            bold=True,
            language=language,
        )

    for index, action in enumerate(visible_actions):
        top = 2.46 + index * 0.82
        priority_value = getattr(action.get("priority"), "value", action.get("priority"))
        priority = str(priority_value or "Medium").title()
        priority_display = _localized_semantic_value(
            action.get("priority"), language, fallback_key="medium"
        )
        status = _localized_semantic_value(
            action.get("status"), language, fallback_key="open"
        )

        priority_colors = {
            "Critical": (RED, RED_LIGHT),
            "High": (RED, RED_LIGHT),
            "Medium": (AMBER, AMBER_LIGHT),
            "Low": (GREEN, GREEN_LIGHT),
        }
        priority_color, priority_background = priority_colors.get(
            priority,
            (TEXT_MUTED, BACKGROUND),
        )

        _add_rounded_rectangle(
            slide,
            0.55,
            top,
            12.2,
            0.64,
            fill_color=WHITE,
        )

        _add_rounded_rectangle(
            slide,
            0.72,
            top + 0.15,
            0.95,
            0.34,
            fill_color=priority_background,
            line_color=priority_background,
        )

        _add_text(
            slide,
            priority_display,
            0.79,
            top + 0.205,
            0.8,
            0.21,
            font_size=8,
            color=priority_color,
            bold=True,
            alignment=PP_ALIGN.CENTER,
            language=language,
        )

        action_title = _localized_action_title(action.get("title"), language)
        action_owner = _localized_action_owner(action.get("owner"), language)

        _add_text(
            slide,
            action_title or localize_report_label("untitled_action", language),
            1.85,
            top + (0.08 if language == "mn" else 0.12),
            5.55,
            0.48 if language == "mn" else 0.42,
            font_size=8.6 if language == "mn" else 10,
            color=TEXT_DARK,
            bold=True,
            language=language,
        )

        _add_text(
            slide,
            action_owner or localize_report_label("unassigned", language),
            7.7,
            top + (0.08 if language == "mn" else 0.12),
            1.55,
            0.48 if language == "mn" else 0.4,
            font_size=7.2 if language == "mn" else 9,
            color=TEXT_MUTED,
            language=language,
        )

        _add_text(
            slide,
            (
                format_report_date(action.get("timing"), language, "reporting_period_date")
                if isinstance(action.get("timing"), (date, datetime))
                else _localized_semantic_value(
                    action.get("timing"), language, fallback_key="not_set"
                )
            ),
            9.5,
            top + 0.12,
            1.3,
            0.4,
            font_size=9,
            color=TEXT_MUTED,
            language=language,
        )

        _add_text(
            slide,
            status,
            11.05,
            top + 0.12,
            1.35,
            0.4,
            font_size=9,
            color=TEXT_DARK,
            bold=True,
            language=language,
        )


def _build_recommendation_slide(
    presentation: Presentation,
    branding: ReportBranding,
    production_rows: List[Dict[str, Any]],
    fleet_rows: List[Dict[str, Any]],
    plant_rows: List[Dict[str, Any]],
    safety_rows: List[Dict[str, Any]],
    operation_profile: str,
    language: str,
) -> None:
    slide = presentation.slides.add_slide(
        presentation.slide_layouts[6]
    )
    _set_slide_background(slide)

    is_sxew = _is_sxew_operation(operation_profile)

    _add_standard_header(
        slide,
        branding,
        localize_report_label("executive_recommendations", language),
        localize_report_label("recommendations_subtitle", language),
        7,
        language,
    )

    recommendations: List[str] = []

    latest_production = _latest(production_rows)
    latest_fleet = _latest(fleet_rows)
    latest_plant = _latest(plant_rows)
    latest_safety = _latest(safety_rows)

    if latest_safety:
        incidents = int(
            _number(
                latest_safety.get("incidents")
            )
        )
        critical_risks = int(
            _number(
                latest_safety.get("critical_risks")
            )
        )

        if incidents > 0 or critical_risks > 0:
            recommendations.append(
                localize_report_label("recommend_safety_controls", language)
            )

    if latest_production:
        production_achievement = _safe_ratio(
            latest_production.get("ore_actual"),
            latest_production.get("ore_plan"),
        )

        if (
            production_achievement is not None
            and production_achievement < 1
        ):
            recommendations.append(
                (
                    localize_report_label("recommend_cathode_recovery_plan", language)
                )
                if is_sxew
                else (
                    localize_report_label("recommend_ore_recovery_plan", language)
                )
            )

    if latest_fleet and not is_sxew:
        availability = _number(
            latest_fleet.get("availability")
        )
        utilization = _number(
            latest_fleet.get("utilization")
        )

        if availability < 85:
            recommendations.append(
                localize_report_label("recommend_availability_actions", language)
            )

        if utilization < 80:
            recommendations.append(
                localize_report_label("recommend_utilization_actions", language)
            )

    if latest_plant:
        plant_achievement = _safe_ratio(
            latest_plant.get("throughput_actual"),
            latest_plant.get("throughput_plan"),
        )

        if (
            plant_achievement is not None
            and plant_achievement < 1
        ):
            recommendations.append(
                (
                    localize_report_label("recommend_sxew_throughput", language)
                )
                if is_sxew
                else (
                    localize_report_label("recommend_standard_throughput", language)
                )
            )

    default_recommendations = [
        localize_report_label("recommend_accountable_owner", language),
        localize_report_label("recommend_daily_exceptions", language),
        localize_report_label("recommend_data_quality", language),
    ]

    for recommendation in default_recommendations:
        if len(recommendations) >= 5:
            break
        recommendations.append(
            recommendation
        )

    _add_rounded_rectangle(
        slide,
        0.55,
        2.05,
        8.2,
        4.65,
        fill_color=WHITE,
    )

    _add_text(
        slide,
        localize_report_label("recommended_next_actions", language),
        0.9,
        2.35,
        4.8,
        0.4,
        font_size=15,
        color=TEXT_DARK,
        bold=True,
        language=language,
    )

    _add_bullet_list(
        slide,
        recommendations[:5],
        0.9,
        3.0,
        7.45,
        3.1,
        font_size=11.5 if language == "mn" else 13,
        color=TEXT_DARK,
        language=language,
    )

    primary = branding.primary_color_excel

    _add_rounded_rectangle(
        slide,
        9.05,
        2.05,
        3.7,
        4.65,
        fill_color=branding.secondary_color_excel,
        line_color=branding.secondary_color_excel,
    )

    _add_text(
        slide,
        localize_report_label("executive_focus", language),
        9.45,
        2.45,
        2.9,
        0.35,
        font_size=13,
        color=primary,
        bold=True,
        language=language,
    )

    _add_text(
        slide,
        localize_report_label("executive_focus_statement", language),
        9.45,
        3.25,
        2.85,
        1.8,
        font_size=20 if language == "mn" else 24,
        color=WHITE,
        bold=True,
        vertical_anchor=MSO_ANCHOR.TOP,
        language=language,
    )

    _add_text(
        slide,
        localize_report_label("board_pack_disclaimer", language),
        9.45,
        5.75,
        2.85,
        0.55,
        font_size=8.5 if language == "mn" else 9,
        color="CBD5E1",
        vertical_anchor=MSO_ANCHOR.TOP,
        language=language,
    )

def generate_executive_powerpoint(
    *,
    db: Session,
    company_id: int,
    mine_id: int,
    operation_profile: str = "standard_mine",
    language: str = "en",
) -> BytesIO:
    """
    Generate a tenant-isolated, operation-aware Executive Operations Board Pack.

    Standard mine slides:
        1. Cover
        2. Executive KPI Summary
        3. Production Trend
        4. Fleet, Plant and Safety Overview
        5. Key Operational Risks
        6. Management Action Register
        7. Executive Recommendations

    SX-EW slides:
        1. Cover
        2. Executive KPI Summary
        3. Cathode Production Trend
        4. Plant and Safety Overview
        5. Key Operational Risks
        6. Management Action Register
        7. Executive Recommendations
    """

    if company_id is None:
        raise ValueError(
            "company_id is required"
        )

    if mine_id is None:
        raise ValueError(
            "mine_id is required"
        )

    normalized_operation_profile = (
        _normalize_operation_profile(
            operation_profile
        )
    )
    is_sxew = _is_sxew_operation(
        normalized_operation_profile
    )
    report_language = normalize_report_language(language)

    branding = get_report_branding(
        db=db,
        company_id=int(company_id),
        mine_id=int(mine_id),
    )

    production_rows = _fetch_production_data(
        db=db,
        company_id=company_id,
        mine_id=mine_id,
    )

    if is_sxew:
        fleet_rows: List[
            Dict[str, Any]
        ] = []
    else:
        fleet_rows = _fetch_fleet_data(
            db=db,
            company_id=company_id,
            mine_id=mine_id,
        )

    plant_rows = _fetch_plant_data(
        db=db,
        company_id=company_id,
        mine_id=mine_id,
    )
    safety_rows = _fetch_safety_data(
        db=db,
        company_id=company_id,
        mine_id=mine_id,
    )
    executive_actions = _fetch_executive_actions(
        db=db,
        company_id=company_id,
        mine_id=mine_id,
    )
    branding = resolve_report_branding(
        branding,
        report_language,
    )
    reporting_period = _reporting_period_bounds(
        production_rows,
        fleet_rows,
        plant_rows,
        safety_rows,
    )

    presentation = Presentation()
    presentation.slide_width = SLIDE_WIDTH
    presentation.slide_height = SLIDE_HEIGHT

    presentation.core_properties.title = (
        f"{branding.company_name} "
        f"{localize_report_label('executive_operations_board_pack', report_language)}"
    )
    presentation.core_properties.subject = (
        f"{localize_report_label('executive_operations_board_pack', report_language)} — "
        f"{branding.mine_name}"
    )
    presentation.core_properties.author = "Mine Manager AI"
    presentation.core_properties.company = branding.company_name
    presentation.core_properties.comments = (
        localize_report_label("board_pack_disclaimer", report_language)
    )
    presentation.core_properties.created = datetime.now()
    presentation.core_properties.modified = datetime.now()

    _build_cover_slide(
        presentation,
        branding,
        report_language,
        reporting_period,
    )

    _build_kpi_summary_slide(
        presentation,
        branding,
        production_rows,
        fleet_rows,
        plant_rows,
        safety_rows,
        normalized_operation_profile,
        report_language,
    )

    _build_production_slide(
        presentation,
        branding,
        production_rows,
        normalized_operation_profile,
        report_language,
    )

    _build_operations_overview_slide(
        presentation,
        branding,
        fleet_rows,
        plant_rows,
        safety_rows,
        normalized_operation_profile,
        report_language,
    )

    _build_risk_slide(
        presentation,
        branding,
        production_rows,
        fleet_rows,
        plant_rows,
        safety_rows,
        normalized_operation_profile,
        report_language,
    )

    _build_actions_slide(
        presentation,
        branding,
        executive_actions,
        report_language,
    )

    _build_recommendation_slide(
        presentation,
        branding,
        production_rows,
        fleet_rows,
        plant_rows,
        safety_rows,
        normalized_operation_profile,
        report_language,
    )

    buffer = BytesIO()
    presentation.save(buffer)
    buffer.seek(0)

    return buffer

