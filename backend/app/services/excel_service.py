from __future__ import annotations

from datetime import date, datetime
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from openpyxl import Workbook
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import (
    Alignment,
    Border,
    Font,
    PatternFill,
    Side,
)
from openpyxl.utils import get_column_letter
from openpyxl.drawing.image import Image as OpenpyxlImage

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.report_branding_service import (
    ReportBranding,
    get_report_branding,
    resolve_report_branding,
)
from app.services.report_localization import (
    localize_report_label,
    normalize_report_language,
)


# ============================================================
# FIXED SUPPORTING COLORS
# ============================================================

BLUE_COLOR = "2563EB"
AMBER_COLOR = "D97706"
RED_COLOR = "DC2626"

LIGHT_BACKGROUND = "F8FAFC"
BORDER_COLOR = "CBD5E1"
WHITE_COLOR = "FFFFFF"
TEXT_COLOR = "0F172A"
MUTED_TEXT_COLOR = "64748B"

GREEN_COLOR = "16A34A"

GREEN_LIGHT = "DCFCE7"
AMBER_LIGHT = "FEF3C7"
RED_LIGHT = "FEE2E2"


# ============================================================
# OPERATION PROFILE
# ============================================================

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
    """
    Normalize operation profile into a stable internal value.
    """

    normalized = (
        str(
            operation_profile
            or "standard_mine"
        )
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
    return (
        _normalize_operation_profile(
            operation_profile
        )
        == "sxew_copper"
    )


# ============================================================
# DATABASE HELPERS
# ============================================================

def _tenant_params(
    company_id: int,
    mine_id: int,
) -> Dict[str, int]:
    """
    Build authoritative tenant parameters.
    """

    if company_id is None:
        raise ValueError(
            "company_id is required"
        )

    if mine_id is None:
        raise ValueError(
            "mine_id is required"
        )

    return {
        "company_id": int(company_id),
        "mine_id": int(mine_id),
    }


def _fetch_rows(
    db: Session,
    query: str,
    params: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Execute a tenant-scoped read-only query.
    """

    result = db.execute(
        text(query),
        params,
    )

    return [
        dict(row._mapping)
        for row in result
    ]



def _fetch_production_data(
    db: Session,
    company_id: int,
    mine_id: int,
    reporting_days: int = 7,
) -> List[Dict[str, Any]]:
    """
    Return production records for a consistent executive-reporting window.

    The latest production report date is treated as the authoritative
    reporting calendar for the workbook. This keeps Production/Cathode,
    Plant, Safety, and Fleet aligned to the same reporting period.
    """

    normalized_days = max(
        1,
        int(reporting_days or 7),
    )

    return _fetch_rows(
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
          AND report_date >= (
              SELECT MAX(report_date)
              FROM public.production_daily
              WHERE company_id = :company_id
                AND mine_id = :mine_id
          ) - (:reporting_days - 1)
        ORDER BY report_date ASC
        """,
        {
            **_tenant_params(
                company_id,
                mine_id,
            ),
            "reporting_days":
                normalized_days,
        },
    )


def _fetch_fleet_data(
    db: Session,
    company_id: int,
    mine_id: int,
    reporting_days: int = 7,
) -> List[Dict[str, Any]]:
    """
    Return fleet records aligned to the current executive-reporting window.

    Fleet is only used for operation profiles where it is applicable.
    """

    normalized_days = max(
        1,
        int(reporting_days or 7),
    )

    return _fetch_rows(
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
          AND report_date >= (
              SELECT MAX(report_date)
              FROM public.production_daily
              WHERE company_id = :company_id
                AND mine_id = :mine_id
          ) - (:reporting_days - 1)
        ORDER BY report_date ASC
        """,
        {
            **_tenant_params(
                company_id,
                mine_id,
            ),
            "reporting_days":
                normalized_days,
        },
    )


def _fetch_plant_data(
    db: Session,
    company_id: int,
    mine_id: int,
    reporting_days: int = 7,
) -> List[Dict[str, Any]]:
    """
    Return plant records aligned to the current executive-reporting window.
    """

    normalized_days = max(
        1,
        int(reporting_days or 7),
    )

    return _fetch_rows(
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
          AND report_date >= (
              SELECT MAX(report_date)
              FROM public.production_daily
              WHERE company_id = :company_id
                AND mine_id = :mine_id
          ) - (:reporting_days - 1)
        ORDER BY report_date ASC
        """,
        {
            **_tenant_params(
                company_id,
                mine_id,
            ),
            "reporting_days":
                normalized_days,
        },
    )


def _fetch_safety_data(
    db: Session,
    company_id: int,
    mine_id: int,
    reporting_days: int = 7,
) -> List[Dict[str, Any]]:
    """
    Return safety records aligned to the current executive-reporting window.
    """

    normalized_days = max(
        1,
        int(reporting_days or 7),
    )

    return _fetch_rows(
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
          AND report_date >= (
              SELECT MAX(report_date)
              FROM public.production_daily
              WHERE company_id = :company_id
                AND mine_id = :mine_id
          ) - (:reporting_days - 1)
        ORDER BY report_date ASC
        """,
        {
            **_tenant_params(
                company_id,
                mine_id,
            ),
            "reporting_days":
                normalized_days,
        },
    )

def _number(
    value: Any,
) -> float:
    if value is None:
        return 0.0

    try:
        return float(value)

    except (
        TypeError,
        ValueError,
    ):
        return 0.0


def _safe_ratio(
    numerator: Any,
    denominator: Any,
) -> Optional[float]:
    denominator_value = _number(
        denominator
    )

    if denominator_value == 0:
        return None

    return (
        _number(numerator)
        / denominator_value
    )


def _average(
    values: Iterable[Any],
) -> Optional[float]:
    cleaned_values = [
        _number(value)
        for value in values
        if value is not None
    ]

    if not cleaned_values:
        return None

    return (
        sum(cleaned_values)
        / len(cleaned_values)
    )


def _latest_row(
    rows: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    return (
        rows[-1]
        if rows
        else None
    )


def _latest_report_date(
    datasets: Iterable[
        List[Dict[str, Any]]
    ],
) -> Optional[date]:
    dates: List[date] = []

    for rows in datasets:
        for row in rows:
            value = row.get(
                "report_date"
            )

            if isinstance(
                value,
                datetime,
            ):
                dates.append(
                    value.date()
                )

            elif isinstance(
                value,
                date,
            ):
                dates.append(
                    value
                )

    return (
        max(dates)
        if dates
        else None
    )


def _display_value(
    value: Optional[float],
    suffix: str = "",
    language: str = "en",
) -> str:
    if value is None:
        return localize_report_label(
            "no_data",
            language,
        )

    if suffix == "%":
        return f"{value:.1f}%"

    return f"{value:,.1f}{suffix}"


# ============================================================
# STYLE HELPERS
# ============================================================

def _build_styles(
    branding: ReportBranding,
    language: str = "en",
) -> Dict[str, Any]:
    primary = (
        branding
        .primary_color_excel
        or "0F172A"
    )

    secondary = (
        branding
        .secondary_color_excel
        or "020617"
    )

    thin_border = Border(
        left=Side(
            style="thin",
            color=BORDER_COLOR,
        ),
        right=Side(
            style="thin",
            color=BORDER_COLOR,
        ),
        top=Side(
            style="thin",
            color=BORDER_COLOR,
        ),
        bottom=Side(
            style="thin",
            color=BORDER_COLOR,
        ),
    )

    font_name = (
        "Arial"
        if normalize_report_language(language) == "mn"
        else None
    )
    font_kwargs = (
        {"name": font_name}
        if font_name
        else {}
    )

    return {
        "primary_fill":
            PatternFill(
                "solid",
                fgColor=primary,
            ),

        "secondary_fill":
            PatternFill(
                "solid",
                fgColor=secondary,
            ),

        "header_fill":
            PatternFill(
                "solid",
                fgColor=primary,
            ),

        "section_fill":
            PatternFill(
                "solid",
                fgColor=LIGHT_BACKGROUND,
            ),

        "green_fill":
            PatternFill(
                "solid",
                fgColor=GREEN_LIGHT,
            ),

        "amber_fill":
            PatternFill(
                "solid",
                fgColor=AMBER_LIGHT,
            ),

        "red_fill":
            PatternFill(
                "solid",
                fgColor=RED_LIGHT,
            ),

        "white_font":
            Font(
                color=WHITE_COLOR,
                bold=True,
                **font_kwargs,
            ),

        "title_font":
            Font(
                color=WHITE_COLOR,
                bold=True,
                size=20,
                **font_kwargs,
            ),

        "subtitle_font":
            Font(
                color=WHITE_COLOR,
                size=10,
                **font_kwargs,
            ),

        "section_font":
            Font(
                color=TEXT_COLOR,
                bold=True,
                size=12,
                **font_kwargs,
            ),

        "header_font":
            Font(
                color=WHITE_COLOR,
                bold=True,
                **font_kwargs,
            ),

        "body_font":
            Font(
                color=TEXT_COLOR,
                size=10,
                **font_kwargs,
            ),

        "muted_font":
            Font(
                color=MUTED_TEXT_COLOR,
                size=9,
                **font_kwargs,
            ),

        "border":
            thin_border,

        "is_mongolian":
            normalize_report_language(language)
            == "mn",
    }


def _set_sheet_view(
    worksheet,
) -> None:
    worksheet.sheet_view.showGridLines = False


def _set_column_widths(
    worksheet,
    widths: Dict[str, float],
) -> None:
    for column, width in widths.items():
        worksheet.column_dimensions[
            column
        ].width = width


def _add_logo(
    worksheet,
    branding: ReportBranding,
) -> None:
    """
    Add configured company logo when available.
    """

    if not branding.logo_path:
        return

    logo_path = Path(
        branding.logo_path
    )

    if not logo_path.exists():
        return

    try:
        image = OpenpyxlImage(
            str(logo_path)
        )

        image.height = 42
        image.width = 120

        worksheet.add_image(
            image,
            "F1",
        )

    except Exception:
        # Report generation should never fail only because
        # a logo cannot be rendered.
        return


def _style_title(
    worksheet,
    title: str,
    subtitle: str,
    styles: Dict[str, Any],
    total_columns: int,
) -> int:
    """
    Create workbook-sheet title and subtitle area.

    Returns the row number to use for the next table header.
    """

    worksheet.merge_cells(
        start_row=1,
        start_column=1,
        end_row=1,
        end_column=total_columns,
    )

    title_cell = worksheet.cell(
        row=1,
        column=1,
        value=title,
    )

    title_cell.fill = styles[
        "primary_fill"
    ]
    title_cell.font = styles[
        "title_font"
    ]
    title_cell.alignment = Alignment(
        vertical="center",
    )

    worksheet.row_dimensions[
        1
    ].height = 30

    worksheet.merge_cells(
        start_row=2,
        start_column=1,
        end_row=2,
        end_column=total_columns,
    )

    subtitle_cell = worksheet.cell(
        row=2,
        column=1,
        value=subtitle,
    )

    subtitle_cell.fill = styles[
        "primary_fill"
    ]
    subtitle_cell.font = styles[
        "subtitle_font"
    ]
    if styles.get(
        "is_mongolian"
    ):
        subtitle_cell.alignment = Alignment(
            vertical="center",
            wrap_text=True,
        )

    worksheet.row_dimensions[
        2
    ].height = (
        28
        if styles.get(
            "is_mongolian"
        )
        else 20
    )

    return 4


def _style_section_heading(
    worksheet,
    row: int,
    title: str,
    styles: Dict[str, Any],
    total_columns: int,
) -> None:
    worksheet.merge_cells(
        start_row=row,
        start_column=1,
        end_row=row,
        end_column=total_columns,
    )

    cell = worksheet.cell(
        row=row,
        column=1,
        value=title,
    )

    cell.fill = styles[
        "section_fill"
    ]
    cell.font = styles[
        "section_font"
    ]
    cell.alignment = Alignment(
        vertical="center",
    )


def _style_table_header(
    worksheet,
    row: int,
    headers: List[str],
    styles: Dict[str, Any],
) -> None:
    for index, header in enumerate(
        headers,
        start=1,
    ):
        cell = worksheet.cell(
            row=row,
            column=index,
            value=header,
        )

        cell.fill = styles[
            "header_fill"
        ]
        cell.font = styles[
            "header_font"
        ]
        cell.border = styles[
            "border"
        ]
        cell.alignment = Alignment(
            horizontal="center",
            vertical="center",
            wrap_text=True,
        )


def _style_data_row(
    worksheet,
    row: int,
    total_columns: int,
    styles: Dict[str, Any],
) -> None:
    for column in range(
        1,
        total_columns + 1,
    ):
        cell = worksheet.cell(
            row=row,
            column=column,
        )

        cell.font = styles[
            "body_font"
        ]
        cell.border = styles[
            "border"
        ]
        cell.alignment = Alignment(
            vertical="center",
            wrap_text=True,
        )


def _apply_date_format(
    cell,
) -> None:
    cell.number_format = (
        "yyyy-mm-dd"
    )


def _apply_datetime_format(
    cell,
) -> None:
    cell.number_format = (
        "yyyy-mm-dd hh:mm"
    )


def _apply_number_format(
    cell,
    decimals: int = 1,
) -> None:
    cell.number_format = (
        "#,##0"
        if decimals == 0
        else "#,##0.0"
    )


def _apply_percentage_format(
    cell,
    decimals: int = 1,
) -> None:
    cell.number_format = (
        "0%"
        if decimals == 0
        else "0.0%"
    )


def _add_autofilter(
    worksheet,
    header_row: int,
    last_row: int,
    total_columns: int,
) -> None:
    if last_row <= header_row:
        return

    last_column = get_column_letter(
        total_columns
    )

    worksheet.auto_filter.ref = (
        f"A{header_row}:"
        f"{last_column}{last_row}"
    )


# ============================================================
# EXECUTIVE SUMMARY
# ============================================================

def _create_executive_summary_sheet(
    workbook: Workbook,
    branding: ReportBranding,
    styles: Dict[str, Any],
    production_rows: List[
        Dict[str, Any]
    ],
    fleet_rows: List[
        Dict[str, Any]
    ],
    plant_rows: List[
        Dict[str, Any]
    ],
    safety_rows: List[
        Dict[str, Any]
    ],
    operation_profile: str,
    language: str = "en",
) -> None:
    worksheet = workbook.active
    worksheet.title = (
        localize_report_label(
            "excel_sheet_executive_summary",
            language,
        )
    )

    _set_sheet_view(
        worksheet
    )

    is_sxew = _is_sxew_operation(
        operation_profile
    )
    display_mine_name = branding.mine_name

    subtitle = (
        f"{branding.company_name} | "
        f"{display_mine_name} | "
        f"{localize_report_label('executive_operations_export', language)}"
    )

    _style_title(
        worksheet,
        localize_report_label(
            "executive_operations_summary",
            language,
        ),
        subtitle,
        styles,
        6,
    )

    _add_logo(
        worksheet,
        branding,
    )

    latest_report_date = (
        _latest_report_date(
            [
                production_rows,
                fleet_rows,
                plant_rows,
                safety_rows,
            ]
        )
    )

    metadata = [
        (
            localize_report_label(
                "company",
                language,
            ),
            branding.company_name,
        ),
        (
            localize_report_label(
                "operation",
                language,
            ),
            display_mine_name,
        ),
        (
            localize_report_label(
                "operation_profile",
                language,
            ),
            (
                localize_report_label(
                    "sxew_copper",
                    language,
                )
                if is_sxew
                else localize_report_label(
                    "standard_mine",
                    language,
                )
            ),
        ),
        (
            localize_report_label(
                "latest_report_date",
                language,
            ),
            (
                latest_report_date
                if latest_report_date
                else localize_report_label(
                    "no_data",
                    language,
                )
            ),
        ),
    ]

    start_row = 4

    for offset, (
        label,
        value,
    ) in enumerate(
        metadata
    ):
        row = (
            start_row
            + offset
        )

        worksheet.cell(
            row=row,
            column=1,
            value=label,
        )

        worksheet.cell(
            row=row,
            column=2,
            value=value,
        )

        worksheet.merge_cells(
            start_row=row,
            start_column=2,
            end_row=row,
            end_column=6,
        )

        _style_data_row(
            worksheet,
            row,
            6,
            styles,
        )

    section_row = (
        start_row
        + len(metadata)
        + 1
    )

    _style_section_heading(
        worksheet,
        section_row,
        localize_report_label(
            "latest_kpi_position",
            language,
        ),
        styles,
        6,
    )

    latest_production = (
        _latest_row(
            production_rows
        )
    )

    latest_fleet = (
        _latest_row(
            fleet_rows
        )
    )

    latest_plant = (
        _latest_row(
            plant_rows
        )
    )

    latest_safety = (
        _latest_row(
            safety_rows
        )
    )

    ore_achievement = (
        _safe_ratio(
            latest_production.get(
                "ore_actual"
            ),
            latest_production.get(
                "ore_plan"
            ),
        )
        if latest_production
        else None
    )

    waste_achievement = (
        _safe_ratio(
            latest_production.get(
                "waste_actual"
            ),
            latest_production.get(
                "waste_plan"
            ),
        )
        if (
            latest_production
            and not is_sxew
        )
        else None
    )

    plant_achievement = (
        _safe_ratio(
            latest_plant.get(
                "throughput_actual"
            ),
            latest_plant.get(
                "throughput_plan"
            ),
        )
        if latest_plant
        else None
    )

    if is_sxew:
        kpis = [
            (
                localize_report_label(
                    "cathode_production_achievement",
                    language,
                ),
                _display_value(
                    (
                        ore_achievement * 100
                        if ore_achievement
                        is not None
                        else None
                    ),
                    "%",
                    language,
                ),
                ore_achievement,
            ),
            (
                localize_report_label(
                    "plant_throughput_achievement",
                    language,
                ),
                _display_value(
                    (
                        plant_achievement * 100
                        if plant_achievement
                        is not None
                        else None
                    ),
                    "%",
                    language,
                ),
                plant_achievement,
            ),
            (
                localize_report_label(
                    "excel_safety_score_summary",
                    language,
                ),
                _display_value(
                    (
                        _number(
                            latest_safety.get(
                                "safety_score"
                            )
                        )
                        if latest_safety
                        else None
                    ),
                    "%",
                    language,
                ),
                (
                    _number(
                        latest_safety.get(
                            "safety_score"
                        )
                    )
                    / 100
                    if latest_safety
                    else None
                ),
            ),
        ]

    else:
        kpis = [
            (
                localize_report_label(
                    "ore_plan_achievement",
                    language,
                ),
                _display_value(
                    (
                        ore_achievement * 100
                        if ore_achievement
                        is not None
                        else None
                    ),
                    "%",
                    language,
                ),
                ore_achievement,
            ),
            (
                localize_report_label(
                    "waste_plan_achievement",
                    language,
                ),
                _display_value(
                    (
                        waste_achievement * 100
                        if waste_achievement
                        is not None
                        else None
                    ),
                    "%",
                    language,
                ),
                waste_achievement,
            ),
            (
                localize_report_label(
                    "fleet_availability",
                    language,
                ),
                _display_value(
                    (
                        _number(
                            latest_fleet.get(
                                "availability"
                            )
                        )
                        if latest_fleet
                        else None
                    ),
                    "%",
                    language,
                ),
                (
                    _number(
                        latest_fleet.get(
                            "availability"
                        )
                    )
                    / 100
                    if latest_fleet
                    else None
                ),
            ),
            (
                localize_report_label(
                    "fleet_utilization",
                    language,
                ),
                _display_value(
                    (
                        _number(
                            latest_fleet.get(
                                "utilization"
                            )
                        )
                        if latest_fleet
                        else None
                    ),
                    "%",
                    language,
                ),
                (
                    _number(
                        latest_fleet.get(
                            "utilization"
                        )
                    )
                    / 100
                    if latest_fleet
                    else None
                ),
            ),
            (
                localize_report_label(
                    "plant_throughput_achievement",
                    language,
                ),
                _display_value(
                    (
                        plant_achievement * 100
                        if plant_achievement
                        is not None
                        else None
                    ),
                    "%",
                    language,
                ),
                plant_achievement,
            ),
            (
                localize_report_label(
                    "excel_safety_score_summary",
                    language,
                ),
                _display_value(
                    (
                        _number(
                            latest_safety.get(
                                "safety_score"
                            )
                        )
                        if latest_safety
                        else None
                    ),
                    "%",
                    language,
                ),
                (
                    _number(
                        latest_safety.get(
                            "safety_score"
                        )
                    )
                    / 100
                    if latest_safety
                    else None
                ),
            ),
        ]

    header_row = (
        section_row
        + 1
    )

    _style_table_header(
        worksheet,
        header_row,
        [
            "KPI",
            localize_report_label(
                "current_value",
                language,
            ),
            localize_report_label(
                "status",
                language,
            ),
        ],
        styles,
    )

    for index, (
        kpi_name,
        display_value,
        ratio_value,
    ) in enumerate(
        kpis,
        start=header_row + 1,
    ):
        status_key = (
            "no_data"
        )

        if ratio_value is not None:
            if ratio_value >= 1:
                status_key = (
                    "on_or_above_target"
                )

            elif ratio_value >= 0.9:
                status_key = (
                    "watch"
                )

            else:
                status_key = (
                    "below_target"
                )

        status_text = localize_report_label(
            (
                "excel_below_target"
                if status_key == "below_target"
                else status_key
            ),
            language,
        )

        worksheet.cell(
            row=index,
            column=1,
            value=kpi_name,
        )

        worksheet.cell(
            row=index,
            column=2,
            value=display_value,
        )

        worksheet.cell(
            row=index,
            column=3,
            value=status_text,
        )

        worksheet.merge_cells(
            start_row=index,
            start_column=3,
            end_row=index,
            end_column=6,
        )

        _style_data_row(
            worksheet,
            index,
            6,
            styles,
        )

        status_cell = (
            worksheet.cell(
                row=index,
                column=3,
            )
        )

        if (
            status_key
            == "on_or_above_target"
        ):
            status_cell.fill = (
                styles[
                    "green_fill"
                ]
            )

        elif (
            status_key
            == "watch"
        ):
            status_cell.fill = (
                styles[
                    "amber_fill"
                ]
            )

        elif (
            status_key
            == "below_target"
        ):
            status_cell.fill = (
                styles[
                    "red_fill"
                ]
            )

    data_row = (
        header_row
        + len(kpis)
        + 2
    )

    _style_section_heading(
        worksheet,
        data_row,
        localize_report_label(
            "data_coverage",
            language,
        ),
        styles,
        6,
    )

    if is_sxew:
        coverage = [
            (
                localize_report_label(
                    "cathode_production_records",
                    language,
                ),
                len(production_rows),
            ),
            (
                localize_report_label(
                    "plant_records",
                    language,
                ),
                len(plant_rows),
            ),
            (
                localize_report_label(
                    "safety_records",
                    language,
                ),
                len(safety_rows),
            ),
        ]

    else:
        coverage = [
            (
                localize_report_label(
                    "production_records",
                    language,
                ),
                len(production_rows),
            ),
            (
                localize_report_label(
                    "fleet_records",
                    language,
                ),
                len(fleet_rows),
            ),
            (
                localize_report_label(
                    "plant_records",
                    language,
                ),
                len(plant_rows),
            ),
            (
                localize_report_label(
                    "safety_records",
                    language,
                ),
                len(safety_rows),
            ),
        ]

    for offset, (
        label,
        count,
    ) in enumerate(
        coverage,
        start=1,
    ):
        row = (
            data_row
            + offset
        )

        worksheet.cell(
            row=row,
            column=1,
            value=label,
        )

        worksheet.cell(
            row=row,
            column=2,
            value=count,
        )

        worksheet.merge_cells(
            start_row=row,
            start_column=2,
            end_row=row,
            end_column=6,
        )

        _style_data_row(
            worksheet,
            row,
            6,
            styles,
        )

    _set_column_widths(
        worksheet,
        {
            "A": 38 if normalize_report_language(language) == "mn" else 32,
            "B": 24 if normalize_report_language(language) == "mn" else 20,
            "C": 28 if normalize_report_language(language) == "mn" else 22,
            "D": 16,
            "E": 16,
            "F": 16,
        },
    )

    worksheet.freeze_panes = (
        "A5"
    )


# ============================================================
# PRODUCTION / CATHODE SHEET
# ============================================================

def _create_production_sheet(
    workbook: Workbook,
    branding: ReportBranding,
    styles: Dict[str, Any],
    rows: List[
        Dict[str, Any]
    ],
    operation_profile: str,
    language: str = "en",
) -> None:
    is_sxew = _is_sxew_operation(
        operation_profile
    )

    worksheet = workbook.create_sheet(
        (
            localize_report_label(
                "excel_sheet_cathode_production",
                language,
            )
            if is_sxew
            else localize_report_label(
                "excel_sheet_production",
                language,
            )
        )
    )

    _set_sheet_view(
        worksheet
    )

    if is_sxew:
        title = (
            localize_report_label(
                "cathode_production_performance",
                language,
            )
        )

        subtitle = (
            f"{branding.company_name} | "
            f"{branding.mine_name} | "
            f"{localize_report_label('daily_cathode_production_performance', language)}"
        )

        headers = [
            localize_report_label("report_date", language),
            localize_report_label("operation", language),
            localize_report_label("production_plan", language),
            localize_report_label("production_actual", language),
            localize_report_label("variance", language),
            localize_report_label("achievement", language),
            localize_report_label("created_at", language),
        ]

        total_columns = 7

    else:
        title = (
            localize_report_label(
                "production_performance",
                language,
            )
        )

        subtitle = (
            f"{branding.company_name} | "
            f"{branding.mine_name} | "
            f"{localize_report_label('daily_mining_production_performance', language)}"
        )

        headers = [
            localize_report_label("report_date", language),
            localize_report_label("mine", language),
            localize_report_label("ore_plan", language),
            localize_report_label("ore_actual", language),
            localize_report_label("ore_variance", language),
            localize_report_label("ore_achievement", language),
            localize_report_label("waste_plan", language),
            localize_report_label("waste_actual", language),
            localize_report_label("waste_variance", language),
            localize_report_label("created_at", language),
        ]

        total_columns = 10

    header_row = _style_title(
        worksheet,
        title,
        subtitle,
        styles,
        total_columns,
    )

    _add_logo(
        worksheet,
        branding,
    )

    _style_table_header(
        worksheet,
        header_row,
        headers,
        styles,
    )

    for row_index, record in enumerate(
        rows,
        start=header_row + 1,
    ):
        ore_plan = _number(
            record.get(
                "ore_plan"
            )
        )

        ore_actual = _number(
            record.get(
                "ore_actual"
            )
        )

        if is_sxew:
            values = [
                record.get(
                    "report_date"
                ),
                (
                    branding.mine_name
                ),
                ore_plan,
                ore_actual,
                ore_actual
                - ore_plan,
                _safe_ratio(
                    ore_actual,
                    ore_plan,
                ),
                record.get(
                    "created_at"
                ),
            ]

        else:
            waste_plan = _number(
                record.get(
                    "waste_plan"
                )
            )

            waste_actual = _number(
                record.get(
                    "waste_actual"
                )
            )

            values = [
                record.get(
                    "report_date"
                ),
                (
                    branding.mine_name
                ),
                ore_plan,
                ore_actual,
                ore_actual
                - ore_plan,
                _safe_ratio(
                    ore_actual,
                    ore_plan,
                ),
                waste_plan,
                waste_actual,
                waste_actual
                - waste_plan,
                record.get(
                    "created_at"
                ),
            ]

        for column_index, value in enumerate(
            values,
            start=1,
        ):
            worksheet.cell(
                row=row_index,
                column=column_index,
                value=value,
            )

        _style_data_row(
            worksheet,
            row_index,
            len(headers),
            styles,
        )

        _apply_date_format(
            worksheet.cell(
                row=row_index,
                column=1,
            )
        )

        if is_sxew:
            for column_index in [
                3,
                4,
                5,
            ]:
                _apply_number_format(
                    worksheet.cell(
                        row=row_index,
                        column=column_index,
                    )
                )

            _apply_percentage_format(
                worksheet.cell(
                    row=row_index,
                    column=6,
                )
            )

            _apply_datetime_format(
                worksheet.cell(
                    row=row_index,
                    column=7,
                )
            )

        else:
            for column_index in [
                3,
                4,
                5,
                7,
                8,
                9,
            ]:
                _apply_number_format(
                    worksheet.cell(
                        row=row_index,
                        column=column_index,
                    )
                )

            _apply_percentage_format(
                worksheet.cell(
                    row=row_index,
                    column=6,
                )
            )

            _apply_datetime_format(
                worksheet.cell(
                    row=row_index,
                    column=10,
                )
            )

    last_row = (
        header_row
        + len(rows)
    )

    _add_autofilter(
        worksheet,
        header_row,
        last_row,
        len(headers),
    )

    if last_row > header_row:
        achievement_range = (
            f"F{header_row + 1}:"
            f"F{last_row}"
        )

        worksheet.conditional_formatting.add(
            achievement_range,
            CellIsRule(
                operator="lessThan",
                formula=[
                    "0.90"
                ],
                fill=styles[
                    "red_fill"
                ],
            ),
        )

        worksheet.conditional_formatting.add(
            achievement_range,
            CellIsRule(
                operator="between",
                formula=[
                    "0.90",
                    "0.999999",
                ],
                fill=styles[
                    "amber_fill"
                ],
            ),
        )

        worksheet.conditional_formatting.add(
            achievement_range,
            CellIsRule(
                operator=(
                    "greaterThanOrEqual"
                ),
                formula=[
                    "1.00"
                ],
                fill=styles[
                    "green_fill"
                ],
            ),
        )

    if is_sxew:
        widths = {
            "A": 14,
            "B": 38 if normalize_report_language(language) == "mn" else 34,
            "C": 23 if normalize_report_language(language) == "mn" else 18,
            "D": 23 if normalize_report_language(language) == "mn" else 18,
            "E": 16,
            "F": 19 if normalize_report_language(language) == "mn" else 17,
            "G": 20,
        }

    else:
        widths = {
            "A": 14,
            "B": 26,
            "C": 15,
            "D": 15,
            "E": 15,
            "F": 17,
            "G": 15,
            "H": 15,
            "I": 15,
            "J": 20,
        }

    _set_column_widths(
        worksheet,
        widths,
    )

    worksheet.freeze_panes = (
        f"A{header_row + 1}"
    )


# ============================================================
# FLEET SHEET
# ============================================================

def _create_fleet_sheet(
    workbook: Workbook,
    branding: ReportBranding,
    styles: Dict[str, Any],
    rows: List[
        Dict[str, Any]
    ],
    language: str = "en",
) -> None:
    worksheet = workbook.create_sheet(
        localize_report_label(
            "excel_sheet_fleet",
            language,
        )
    )

    _set_sheet_view(
        worksheet
    )

    subtitle = (
        f"{branding.company_name} | "
        f"{branding.mine_name} | "
        f"{localize_report_label('fleet_availability_and_utilization', language)}"
    )

    header_row = _style_title(
        worksheet,
        localize_report_label(
            "fleet_performance_title",
            language,
        ),
        subtitle,
        styles,
        5,
    )

    _add_logo(
        worksheet,
        branding,
    )

    headers = [
        localize_report_label("report_date", language),
        localize_report_label("mine", language),
        localize_report_label("availability", language),
        localize_report_label("utilization", language),
        localize_report_label("created_at", language),
    ]

    _style_table_header(
        worksheet,
        header_row,
        headers,
        styles,
    )

    for row_index, record in enumerate(
        rows,
        start=header_row + 1,
    ):
        availability = _number(
            record.get(
                "availability"
            )
        )

        utilization = _number(
            record.get(
                "utilization"
            )
        )

        values = [
            record.get(
                "report_date"
            ),
            (
                branding.mine_name
            ),
            availability
            / 100,
            utilization
            / 100,
            record.get(
                "created_at"
            ),
        ]

        for column_index, value in enumerate(
            values,
            start=1,
        ):
            worksheet.cell(
                row=row_index,
                column=column_index,
                value=value,
            )

        _style_data_row(
            worksheet,
            row_index,
            len(headers),
            styles,
        )

        _apply_date_format(
            worksheet.cell(
                row=row_index,
                column=1,
            )
        )

        _apply_percentage_format(
            worksheet.cell(
                row=row_index,
                column=3,
            )
        )

        _apply_percentage_format(
            worksheet.cell(
                row=row_index,
                column=4,
            )
        )

        _apply_datetime_format(
            worksheet.cell(
                row=row_index,
                column=5,
            )
        )

    last_row = (
        header_row
        + len(rows)
    )

    _add_autofilter(
        worksheet,
        header_row,
        last_row,
        len(headers),
    )

    _set_column_widths(
        worksheet,
        {
            "A": 14,
            "B": 26,
            "C": 18,
            "D": 18,
            "E": 20,
        },
    )

    worksheet.freeze_panes = (
        f"A{header_row + 1}"
    )


# ============================================================
# PLANT SHEET
# ============================================================

def _create_plant_sheet(
    workbook: Workbook,
    branding: ReportBranding,
    styles: Dict[str, Any],
    rows: List[
        Dict[str, Any]
    ],
    language: str = "en",
) -> None:
    worksheet = workbook.create_sheet(
        localize_report_label(
            "excel_sheet_plant",
            language,
        )
    )

    _set_sheet_view(
        worksheet
    )

    subtitle = (
        f"{branding.company_name} | "
        f"{branding.mine_name} | "
        f"{localize_report_label('plant_throughput_and_recovery', language)}"
    )

    header_row = _style_title(
        worksheet,
        localize_report_label(
            "plant_performance_title",
            language,
        ),
        subtitle,
        styles,
        8,
    )

    _add_logo(
        worksheet,
        branding,
    )

    headers = [
        localize_report_label("report_date", language),
        localize_report_label("operation", language),
        localize_report_label("throughput_plan", language),
        localize_report_label("throughput_actual", language),
        localize_report_label("variance", language),
        localize_report_label("achievement", language),
        localize_report_label("recovery", language),
        localize_report_label("created_at", language),
    ]

    _style_table_header(
        worksheet,
        header_row,
        headers,
        styles,
    )

    for row_index, record in enumerate(
        rows,
        start=header_row + 1,
    ):
        plan = _number(
            record.get(
                "throughput_plan"
            )
        )

        actual = _number(
            record.get(
                "throughput_actual"
            )
        )

        recovery = _number(
            record.get(
                "recovery"
            )
        )

        values = [
            record.get(
                "report_date"
            ),
            (
                branding.mine_name
            ),
            plan,
            actual,
            actual - plan,
            _safe_ratio(
                actual,
                plan,
            ),
            recovery / 100,
            record.get(
                "created_at"
            ),
        ]

        for column_index, value in enumerate(
            values,
            start=1,
        ):
            worksheet.cell(
                row=row_index,
                column=column_index,
                value=value,
            )

        _style_data_row(
            worksheet,
            row_index,
            len(headers),
            styles,
        )

        _apply_date_format(
            worksheet.cell(
                row=row_index,
                column=1,
            )
        )

        for column_index in [
            3,
            4,
            5,
        ]:
            _apply_number_format(
                worksheet.cell(
                    row=row_index,
                    column=column_index,
                )
            )

        _apply_percentage_format(
            worksheet.cell(
                row=row_index,
                column=6,
            )
        )

        _apply_percentage_format(
            worksheet.cell(
                row=row_index,
                column=7,
            )
        )

        _apply_datetime_format(
            worksheet.cell(
                row=row_index,
                column=8,
            )
        )

    last_row = (
        header_row
        + len(rows)
    )

    _add_autofilter(
        worksheet,
        header_row,
        last_row,
        len(headers),
    )

    _set_column_widths(
        worksheet,
        {
            "A": 14,
            "B": 38 if normalize_report_language(language) == "mn" else 32,
            "C": 25 if normalize_report_language(language) == "mn" else 19,
            "D": 25 if normalize_report_language(language) == "mn" else 19,
            "E": 15,
            "F": 19 if normalize_report_language(language) == "mn" else 16,
            "G": 18 if normalize_report_language(language) == "mn" else 15,
            "H": 20,
        },
    )

    worksheet.freeze_panes = (
        f"A{header_row + 1}"
    )


# ============================================================
# SAFETY SHEET
# ============================================================

def _create_safety_sheet(
    workbook: Workbook,
    branding: ReportBranding,
    styles: Dict[str, Any],
    rows: List[
        Dict[str, Any]
    ],
    language: str = "en",
) -> None:
    worksheet = workbook.create_sheet(
        localize_report_label(
            "excel_sheet_safety",
            language,
        )
    )

    _set_sheet_view(
        worksheet
    )

    subtitle = (
        f"{branding.company_name} | "
        f"{branding.mine_name} | "
        f"{localize_report_label('safety_performance_and_critical_risk_indicators', language)}"
    )

    header_row = _style_title(
        worksheet,
        localize_report_label(
            "safety_performance_title",
            language,
        ),
        subtitle,
        styles,
        7,
    )

    _add_logo(
        worksheet,
        branding,
    )

    headers = [
        localize_report_label("report_date", language),
        localize_report_label("operation", language),
        localize_report_label("incidents", language),
        localize_report_label("near_misses", language),
        localize_report_label("critical_risks", language),
        localize_report_label("safety_score", language),
        localize_report_label("created_at", language),
    ]

    _style_table_header(
        worksheet,
        header_row,
        headers,
        styles,
    )

    for row_index, record in enumerate(
        rows,
        start=header_row + 1,
    ):
        values = [
            record.get(
                "report_date"
            ),
            (
                branding.mine_name
            ),
            int(
                _number(
                    record.get(
                        "incidents"
                    )
                )
            ),
            int(
                _number(
                    record.get(
                        "near_misses"
                    )
                )
            ),
            int(
                _number(
                    record.get(
                        "critical_risks"
                    )
                )
            ),
            (
                _number(
                    record.get(
                        "safety_score"
                    )
                )
                / 100
            ),
            record.get(
                "created_at"
            ),
        ]

        for column_index, value in enumerate(
            values,
            start=1,
        ):
            worksheet.cell(
                row=row_index,
                column=column_index,
                value=value,
            )

        _style_data_row(
            worksheet,
            row_index,
            len(headers),
            styles,
        )

        _apply_date_format(
            worksheet.cell(
                row=row_index,
                column=1,
            )
        )

        _apply_percentage_format(
            worksheet.cell(
                row=row_index,
                column=6,
            )
        )

        _apply_datetime_format(
            worksheet.cell(
                row=row_index,
                column=7,
            )
        )

    last_row = (
        header_row
        + len(rows)
    )

    _add_autofilter(
        worksheet,
        header_row,
        last_row,
        len(headers),
    )

    _set_column_widths(
        worksheet,
        {
            "A": 14,
            "B": 38 if normalize_report_language(language) == "mn" else 32,
            "C": 14,
            "D": 24 if normalize_report_language(language) == "mn" else 16,
            "E": 20 if normalize_report_language(language) == "mn" else 16,
            "F": 22 if normalize_report_language(language) == "mn" else 16,
            "G": 20,
        },
    )

    worksheet.freeze_panes = (
        f"A{header_row + 1}"
    )


# ============================================================
# KPI DEFINITIONS
# ============================================================

def _create_kpi_definitions_sheet(
    workbook: Workbook,
    branding: ReportBranding,
    styles: Dict[str, Any],
    operation_profile: str,
    language: str = "en",
) -> None:
    worksheet = workbook.create_sheet(
        localize_report_label(
            "excel_sheet_kpi_definitions",
            language,
        )
    )

    _set_sheet_view(
        worksheet
    )

    is_sxew = _is_sxew_operation(
        operation_profile
    )

    subtitle = (
        f"{branding.company_name} | "
        f"{branding.mine_name} | "
        f"{localize_report_label('definitions_used_in_workbook', language)}"
    )

    header_row = _style_title(
        worksheet,
        localize_report_label(
            "excel_sheet_kpi_definitions",
            language,
        ),
        subtitle,
        styles,
        5,
    )

    _add_logo(
        worksheet,
        branding,
    )

    headers = [
        localize_report_label("category", language),
        "KPI",
        localize_report_label("definition", language),
        localize_report_label("calculation", language),
        localize_report_label("interpretation", language),
    ]

    _style_table_header(
        worksheet,
        header_row,
        headers,
        styles,
    )

    if is_sxew:
        definitions = [
            (
                localize_report_label("production", language),
                localize_report_label("cathode_production_achievement_definition_name", language),
                localize_report_label("cathode_production_achievement_definition", language),
                localize_report_label("cathode_production_achievement_calculation", language),
                localize_report_label("plan_achieved_interpretation", language),
            ),
            (
                localize_report_label("plant", language),
                localize_report_label("throughput_achievement", language),
                localize_report_label("throughput_achievement_definition", language),
                localize_report_label("throughput_achievement_calculation", language),
                localize_report_label("plan_achieved_interpretation", language),
            ),
            (
                localize_report_label("plant", language),
                localize_report_label("recovery", language),
                localize_report_label("recovery_definition", language),
                localize_report_label("recovery_calculation", language),
                localize_report_label("higher_is_better", language),
            ),
            (
                localize_report_label("safety", language),
                localize_report_label("incidents", language),
                localize_report_label("incidents_definition", language),
                localize_report_label("count", language),
                localize_report_label("zero_is_preferred", language),
            ),
            (
                localize_report_label("safety", language),
                localize_report_label("near_misses", language),
                localize_report_label("near_misses_definition", language),
                localize_report_label("count", language),
                localize_report_label("requires_review_follow_up", language),
            ),
            (
                localize_report_label("safety", language),
                localize_report_label("critical_risks", language),
                localize_report_label("critical_risks_definition", language),
                localize_report_label("count", language),
                localize_report_label("zero_unresolved_critical_exposures", language),
            ),
            (
                localize_report_label("safety", language),
                localize_report_label("safety_score", language),
                localize_report_label("safety_score_definition", language),
                localize_report_label("safety_score_calculation", language),
                localize_report_label("higher_is_better", language),
            ),
        ]

    else:
        definitions = [
            (
                localize_report_label("production", language),
                localize_report_label("ore_plan_achievement", language),
                localize_report_label("ore_plan_achievement_definition", language),
                localize_report_label("ore_plan_achievement_calculation", language),
                localize_report_label("plan_achieved_interpretation", language),
            ),
            (
                localize_report_label("production", language),
                localize_report_label("waste_plan_achievement", language),
                localize_report_label("waste_plan_achievement_definition", language),
                localize_report_label("waste_plan_achievement_calculation", language),
                localize_report_label("plan_achieved_interpretation", language),
            ),
            (
                localize_report_label("fleet", language),
                localize_report_label("availability", language),
                localize_report_label("availability_definition", language),
                localize_report_label("availability_calculation", language),
                localize_report_label("higher_is_better", language),
            ),
            (
                localize_report_label("fleet", language),
                localize_report_label("utilization", language),
                localize_report_label("utilization_definition", language),
                localize_report_label("utilization_calculation", language),
                localize_report_label("higher_is_better", language),
            ),
            (
                localize_report_label("plant", language),
                localize_report_label("throughput_achievement", language),
                localize_report_label("throughput_achievement_definition", language),
                localize_report_label("throughput_achievement_calculation", language),
                localize_report_label("plan_achieved_interpretation", language),
            ),
            (
                localize_report_label("plant", language),
                localize_report_label("recovery", language),
                localize_report_label("recovery_definition", language),
                localize_report_label("recovery_calculation", language),
                localize_report_label("higher_is_better", language),
            ),
            (
                localize_report_label("safety", language),
                localize_report_label("incidents", language),
                localize_report_label("incidents_definition", language),
                localize_report_label("count", language),
                localize_report_label("zero_is_preferred", language),
            ),
            (
                localize_report_label("safety", language),
                localize_report_label("near_misses", language),
                localize_report_label("near_misses_definition", language),
                localize_report_label("count", language),
                localize_report_label("requires_review_follow_up", language),
            ),
            (
                localize_report_label("safety", language),
                localize_report_label("critical_risks", language),
                localize_report_label("critical_risks_definition", language),
                localize_report_label("count", language),
                localize_report_label("zero_unresolved_critical_exposures", language),
            ),
            (
                localize_report_label("safety", language),
                localize_report_label("safety_score", language),
                localize_report_label("safety_score_definition", language),
                localize_report_label("safety_score_calculation", language),
                localize_report_label("higher_is_better", language),
            ),
        ]

    for row_index, definition in enumerate(
        definitions,
        start=header_row + 1,
    ):
        for column_index, value in enumerate(
            definition,
            start=1,
        ):
            worksheet.cell(
                row=row_index,
                column=column_index,
                value=value,
            )

        _style_data_row(
            worksheet,
            row_index,
            len(headers),
            styles,
        )

        for column_index in range(
            1,
            len(headers) + 1,
        ):
            worksheet.cell(
                row=row_index,
                column=column_index,
            ).alignment = Alignment(
                vertical="top",
                wrap_text=True,
            )

    _set_column_widths(
        worksheet,
        {
            "A": 24 if normalize_report_language(language) == "mn" else 17,
            "B": 36 if normalize_report_language(language) == "mn" else 30,
            "C": 55 if normalize_report_language(language) == "mn" else 48,
            "D": 44 if normalize_report_language(language) == "mn" else 34,
            "E": 50 if normalize_report_language(language) == "mn" else 43,
        },
    )

    if normalize_report_language(language) == "mn":
        for row_index in range(
            header_row + 1,
            header_row + len(definitions) + 1,
        ):
            worksheet.row_dimensions[
                row_index
            ].height = 42

    worksheet.freeze_panes = (
        f"A{header_row + 1}"
    )

    worksheet.auto_filter.ref = (
        f"A{header_row}:"
        f"E{header_row + len(definitions)}"
    )


# ============================================================
# WORKBOOK METADATA
# ============================================================

def _set_workbook_properties(
    workbook: Workbook,
    branding: ReportBranding,
    operation_profile: str,
    language: str = "en",
) -> None:
    is_sxew = _is_sxew_operation(
        operation_profile
    )

    workbook.properties.title = (
        f"{branding.company_name} "
        f"{localize_report_label('executive_operations_export', language)}"
    )

    workbook.properties.subject = (
        (
            "Үйл ажиллагааны KPI ажлын ном: "
            f"{branding.mine_name}"
        )
        if normalize_report_language(language) == "mn"
        else (
            f"Operational KPI workbook for "
            f"{branding.mine_name}"
        )
    )

    workbook.properties.creator = (
        "Mine Manager AI"
    )

    workbook.properties.company = (
        branding.company_name
    )

    workbook.properties.description = (
        (
            (
                "Катодын үйлдвэрлэл, боловсруулах үйлдвэр болон аюулгүй "
                "ажиллагааны өгөгдлөөс үүсгэсэн удирдлагын үйл ажиллагааны "
                "ажлын ном."
            )
            if normalize_report_language(language) == "mn"
            else (
                "Executive operations workbook generated "
                "from cathode production, plant, and "
                "safety data."
            )
        )
        if is_sxew
        else (
            (
                "Үйлдвэрлэл, техникийн парк, боловсруулах үйлдвэр болон "
                "аюулгүй ажиллагааны өгөгдлөөс үүсгэсэн удирдлагын үйл "
                "ажиллагааны ажлын ном."
            )
            if normalize_report_language(language) == "mn"
            else (
                "Executive operations workbook generated "
                "from production, fleet, plant, and "
                "safety data."
            )
        )
    )

    workbook.properties.created = (
        datetime.now()
    )

    workbook.properties.modified = (
        datetime.now()
    )


# ============================================================
# PUBLIC EXPORT
# ============================================================

def generate_executive_excel_export(
    *,
    db: Session,
    company_id: int,
    mine_id: int,
    operation_profile: str = "standard_mine",
    language: str = "en",
) -> BytesIO:
    """
    Generate a tenant-isolated, operation-aware executive
    Excel workbook.

    Security boundary:
        company_id + mine_id

    These IDs must come from authenticated tenant context.

    Standard mine workbook:
        1. Executive Summary
        2. Production
        3. Fleet
        4. Plant
        5. Safety
        6. KPI Definitions

    SX-EW workbook:
        1. Executive Summary
        2. Cathode Production
        3. Plant
        4. Safety
        5. KPI Definitions
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
    report_language = normalize_report_language(
        language
    )

    is_sxew = _is_sxew_operation(
        normalized_operation_profile
    )

    branding = get_report_branding(
        db=db,
        company_id=int(
            company_id
        ),
        mine_id=int(
            mine_id
        ),
    )
    branding = resolve_report_branding(
        branding,
        report_language,
    )

    styles = _build_styles(
        branding,
        report_language,
    )

    production_rows = (
        _fetch_production_data(
            db=db,
            company_id=company_id,
            mine_id=mine_id,
        )
    )

    plant_rows = (
        _fetch_plant_data(
            db=db,
            company_id=company_id,
            mine_id=mine_id,
        )
    )

    safety_rows = (
        _fetch_safety_data(
            db=db,
            company_id=company_id,
            mine_id=mine_id,
        )
    )

    if is_sxew:
        fleet_rows: List[
            Dict[str, Any]
        ] = []

    else:
        fleet_rows = (
            _fetch_fleet_data(
                db=db,
                company_id=company_id,
                mine_id=mine_id,
            )
        )

    workbook = Workbook()

    _set_workbook_properties(
        workbook=workbook,
        branding=branding,
        operation_profile=(
            normalized_operation_profile
        ),
        language=report_language,
    )

    _create_executive_summary_sheet(
        workbook=workbook,
        branding=branding,
        styles=styles,
        production_rows=(
            production_rows
        ),
        fleet_rows=(
            fleet_rows
        ),
        plant_rows=(
            plant_rows
        ),
        safety_rows=(
            safety_rows
        ),
        operation_profile=(
            normalized_operation_profile
        ),
        language=report_language,
    )

    _create_production_sheet(
        workbook=workbook,
        branding=branding,
        styles=styles,
        rows=production_rows,
        operation_profile=(
            normalized_operation_profile
        ),
        language=report_language,
    )
    if not is_sxew:
        _create_fleet_sheet(
            workbook=workbook,
            branding=branding,
            styles=styles,
            rows=fleet_rows,
            language=report_language,
        )

    _create_plant_sheet(
        workbook=workbook,
        branding=branding,
        styles=styles,
        rows=plant_rows,
        language=report_language,
    )

    _create_safety_sheet(
        workbook=workbook,
        branding=branding,
        styles=styles,
        rows=safety_rows,
        language=report_language,
    )

    _create_kpi_definitions_sheet(
        workbook=workbook,
        branding=branding,
        styles=styles,
        operation_profile=(
            normalized_operation_profile
        ),
        language=report_language,
    )

    buffer = BytesIO()

    workbook.save(
        buffer
    )

    buffer.seek(0)

    return buffer
