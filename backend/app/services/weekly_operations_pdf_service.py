from datetime import datetime
from html import escape
from io import BytesIO

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from app.services.pdf_template_service import (
    AMBER_COLOR,
    BORDER_COLOR,
    LIGHT_BACKGROUND,
    MUTED_TEXT_COLOR,
    PRIMARY_COLOR,
    RED_COLOR,
    TEXT_COLOR,
    WHITE_COLOR,
    build_pdf,
    get_report_styles,
)
from app.services.report_branding_service import (
    resolve_customer_display_identity,
)
from app.services.report_localization import (
    ensure_report_pdf_fonts,
    format_report_date,
    get_report_display_name,
    localize_report_label,
    normalize_report_language,
    pluralize_report_count,
)


NAVY = colors.HexColor("#162033")
BLUE = colors.HexColor("#2563EB")
GREEN_TINT = colors.HexColor("#F0FDF4")
AMBER_TINT = colors.HexColor("#FFF7ED")
RED_TINT = colors.HexColor("#FEF2F2")
NEUTRAL_TINT = colors.HexColor("#F8FAFC")


def _safe(value) -> str:
    return escape(str(value or ""))


def _number(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _parsed_date(value):
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value or "").strip())
    except ValueError:
        return None


def _display_date(value, language: str = "en") -> str:
    raw = str(value or "").strip()
    parsed = _parsed_date(value)
    if parsed:
        return format_report_date(parsed, language, "reporting_period_date")
    return raw or ("Байхгүй" if normalize_report_language(language) == "mn" else "Not available")


def _display_period(start, end, language: str = "en") -> str:
    start_text = _display_date(start, language)
    end_text = _display_date(end, language)
    return start_text if start_text == end_text else f"{start_text} - {end_text}"


def _status_palette(status: str):
    normalized = str(status or "").strip().lower()

    if normalized in {"stable", "healthy", "on track", "improving"}:
        return PRIMARY_COLOR, GREEN_TINT
    if normalized in {"watch", "attention", "medium", "declining"}:
        return AMBER_COLOR, AMBER_TINT
    if normalized in {"critical", "high", "overdue"}:
        return RED_COLOR, RED_TINT

    return MUTED_TEXT_COLOR, NEUTRAL_TINT


def _count_phrase(count: int, singular: str, plural: str | None = None) -> str:
    noun = singular if count == 1 else (plural or f"{singular}s")
    return f"{count} {noun}"


def _event_phrase(
    count: int,
    singular: str,
    plural: str | None = None,
    language: str = "en",
) -> str:
    if normalize_report_language(language) == "mn":
        labels = {
            "incident": ("осол", "осол бүртгэгдээгүй"),
            "near miss": ("осолд дөхсөн тохиолдол", "осолд дөхсөн тохиолдол бүртгэгдээгүй"),
            "critical risk": ("ноцтой эрсдэл", "ноцтой эрсдэл бүртгэгдээгүй"),
        }
        label, none_label = labels.get(singular, (singular, f"{singular} бүртгэгдээгүй"))
        return none_label if count == 0 else f"{count} {label}"
    noun = singular if count == 1 else (plural or f"{singular}s")
    return f"no {noun}" if count == 0 else f"{count} {noun}"


def _weekly_styles(language: str = "en"):
    base = get_report_styles()
    fonts = ensure_report_pdf_fonts(language)
    regular_font = fonts["regular"]
    bold_font = fonts["bold"]
    is_mongolian = normalize_report_language(language) == "mn"
    is_mongolian = normalize_report_language(language) == "mn"

    return {
        "brand": ParagraphStyle(
            "WeeklyV2Brand",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=9.5,
            leading=12,
            textColor=PRIMARY_COLOR,
        ),
        "report_title": ParagraphStyle(
            "WeeklyV2ReportTitle",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(9 if is_mongolian else 11),
            leading=(11 if is_mongolian else 13),
            textColor=NAVY,
            alignment=TA_RIGHT,
        ),
        "mine": ParagraphStyle(
            "WeeklyV2Mine",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(14 if is_mongolian else 16),
            leading=(16 if is_mongolian else 19),
            textColor=NAVY,
        ),
        "continuation_mine": ParagraphStyle(
            "WeeklyV2ContinuationMine",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=9,
            leading=11,
            textColor=NAVY,
        ),
        "meta": ParagraphStyle(
            "WeeklyV2Meta",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=(7 if is_mongolian else 8),
            leading=(8.5 if is_mongolian else 10),
            textColor=MUTED_TEXT_COLOR,
        ),
        "meta_right": ParagraphStyle(
            "WeeklyV2MetaRight",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=(7 if is_mongolian else 8),
            leading=(8.5 if is_mongolian else 10),
            textColor=MUTED_TEXT_COLOR,
            alignment=TA_RIGHT,
        ),
        "section": ParagraphStyle(
            "WeeklyV2Section",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(9.2 if is_mongolian else 10.5),
            leading=(11 if is_mongolian else 13),
            textColor=NAVY,
        ),
        "section_count": ParagraphStyle(
            "WeeklyV2SectionCount",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(6.2 if is_mongolian else 7),
            leading=(8 if is_mongolian else 9),
            textColor=MUTED_TEXT_COLOR,
            alignment=TA_RIGHT,
        ),
        "health_label": ParagraphStyle(
            "WeeklyV2HealthLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(6.8 if is_mongolian else 8),
            leading=(8 if is_mongolian else 10),
            textColor=MUTED_TEXT_COLOR,
        ),
        "health_context": ParagraphStyle(
            "WeeklyV2HealthContext",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=(7.5 if is_mongolian else 8.5),
            leading=(9 if is_mongolian else 11),
            textColor=TEXT_COLOR,
        ),
        "health_value": ParagraphStyle(
            "WeeklyV2HealthValue",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=27,
            leading=29,
            textColor=NAVY,
            alignment=TA_CENTER,
        ),
        "card_label": ParagraphStyle(
            "WeeklyV2CardLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(5.8 if is_mongolian else 6.8),
            leading=(7 if is_mongolian else 8),
            textColor=MUTED_TEXT_COLOR,
            alignment=TA_CENTER,
        ),
        "card_value": ParagraphStyle(
            "WeeklyV2CardValue",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(16 if is_mongolian else 18),
            leading=(18 if is_mongolian else 21),
            textColor=NAVY,
            alignment=TA_CENTER,
        ),
        "card_context": ParagraphStyle(
            "WeeklyV2CardContext",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=(6.2 if is_mongolian else 7),
            leading=(7.5 if is_mongolian else 8.5),
            textColor=TEXT_COLOR,
            alignment=TA_CENTER,
        ),
        "body": ParagraphStyle(
            "WeeklyV2Body",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=8.5,
            leading=11.5,
            textColor=TEXT_COLOR,
        ),
        "body_small": ParagraphStyle(
            "WeeklyV2BodySmall",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=(6.4 if is_mongolian else 7.7),
            leading=(7.8 if is_mongolian else 9.5),
            textColor=TEXT_COLOR,
        ),
        "attention_label": ParagraphStyle(
            "WeeklyV2AttentionLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=6.5,
            leading=8,
            textColor=NAVY,
        ),
        "attention_impact_label": ParagraphStyle(
            "WeeklyV2AttentionImpactLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(6.6 if is_mongolian else 6.5),
            leading=8,
            textColor=NAVY,
        ),
        "attention_action_label": ParagraphStyle(
            "WeeklyV2AttentionActionLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(6.6 if is_mongolian else 6.5),
            leading=8,
            textColor=(PRIMARY_COLOR if is_mongolian else NAVY),
        ),
        "attention_title": ParagraphStyle(
            "WeeklyV2AttentionTitle",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(7 if is_mongolian else 8.6),
            leading=(8.5 if is_mongolian else 10),
            textColor=NAVY,
        ),
        "issue_value": ParagraphStyle(
            "WeeklyV2IssueValue",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(6.7 if is_mongolian else 8),
            leading=(8.3 if is_mongolian else 10),
            textColor=NAVY,
            alignment=TA_RIGHT,
        ),
        "number": ParagraphStyle(
            "WeeklyV2Number",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=8.2,
            leading=11,
            textColor=PRIMARY_COLOR,
            alignment=TA_CENTER,
        ),
        "status_label": ParagraphStyle(
            "WeeklyV2StatusLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=7,
            leading=9,
            textColor=MUTED_TEXT_COLOR,
        ),
        "table_header": ParagraphStyle(
            "WeeklyV2TableHeader",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=7,
            leading=8.5,
            textColor=WHITE_COLOR,
        ),
        "table_body": ParagraphStyle(
            "WeeklyV2TableBody",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=7.8,
            leading=10,
            textColor=TEXT_COLOR,
        ),
    }


def _section_heading(title: str, styles, count_text: str | None = None):
    table = Table(
        [[
            Paragraph(_safe(title.upper()), styles["section"]),
            Paragraph(_safe((count_text or "").upper()), styles["section_count"]),
        ]],
        colWidths=[124 * mm, 35 * mm],
    )
    table.setStyle(TableStyle([
        ("LINEBEFORE", (0, 0), (0, 0), 3, PRIMARY_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 7),
        ("RIGHTPADDING", (0, 0), (0, 0), 0),
        ("LEFTPADDING", (1, 0), (1, 0), 0),
        ("RIGHTPADDING", (1, 0), (1, 0), 1),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return table


def _report_header(*, mine_name, period_start, period_end, generated_at, styles, language="en"):
    top = Table(
        [[
            Paragraph("Mine Manager AI" if language == "mn" else "MINE MANAGER AI", styles["brand"]),
            Paragraph(_safe(localize_report_label("weekly_report", language).upper()), styles["report_title"]),
        ]],
        colWidths=[79.5 * mm, 79.5 * mm],
    )
    top.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LINEBELOW", (0, 0), (-1, -1), 1.2, PRIMARY_COLOR),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))

    metadata = Table(
        [
            [Paragraph(_safe(mine_name), styles["mine"]), ""],
            [
                Paragraph(
                    f"{_safe(localize_report_label('reporting_period', language))}: "
                    f"<b>{_safe(_display_period(period_start, period_end, language))}</b>",
                    styles["meta"],
                ),
                Paragraph(
                    f"{_safe(localize_report_label('generated', language))}: "
                    f"<b>{_safe(format_report_date(generated_at, language, 'generated_timestamp'))}</b>",
                    styles["meta_right"],
                ),
            ],
        ],
        colWidths=[100 * mm, 59 * mm],
    )
    metadata.setStyle(TableStyle([
        ("SPAN", (0, 0), (1, 0)),
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))

    return KeepTogether([top, Spacer(1, 6), metadata, Spacer(1, 7)])


def _continuation_header(*, mine_name, period_start, period_end, styles, language="en"):
    top = Table(
        [[
            Paragraph("Mine Manager AI" if language == "mn" else "MINE MANAGER AI", styles["brand"]),
            Paragraph(_safe(localize_report_label("weekly_report", language).upper()), styles["report_title"]),
        ]],
        colWidths=[79.5 * mm, 79.5 * mm],
    )
    top.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 1.2, PRIMARY_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    context = Table(
        [[
            Paragraph(_safe(mine_name), styles["continuation_mine"]),
            Paragraph(_safe(_display_period(period_start, period_end, language)), styles["meta_right"]),
        ]],
        colWidths=[105 * mm, 54 * mm],
    )
    context.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return [top, context, Spacer(1, 8)]


def _status_badge(status: str, styles, name: str, width: float = 25 * mm, language="en"):
    color, background = _status_palette(status)
    style = ParagraphStyle(
        name,
        parent=styles["section_count"],
        textColor=color,
        alignment=TA_CENTER,
    )
    badge = Table([[
        Paragraph(_safe(localize_report_label(status, language).upper()), style)
    ]], colWidths=[width])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.45, color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
    ]))
    return badge


def _weekly_health(value: float, status: str, styles, language="en"):
    _, background = _status_palette(status)
    content = Table(
        [[
            [
                Paragraph(_safe(localize_report_label("weekly_mine_health", language).upper()), styles["health_label"]),
                Spacer(1, 1),
                Paragraph(_safe(localize_report_label("overall_weekly_operating_condition", language)), styles["health_context"]),
            ],
            Paragraph(f"{value:.1f}", styles["health_value"]),
            _status_badge(status, styles, "WeeklyV2HealthStatus", 25 * mm, language),
        ]],
        colWidths=[77 * mm, 47 * mm, 35 * mm],
    )
    content.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.6, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 11),
        ("RIGHTPADDING", (0, 0), (0, 0), 8),
        ("LEFTPADDING", (1, 0), (-1, -1), 5),
        ("RIGHTPADDING", (1, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return KeepTogether([content, Spacer(1, 7)])


def _glance_card(card, styles, index: int, language="en"):
    status_color, _ = _status_palette(card["status"])
    status_style = ParagraphStyle(
        f"WeeklyV2CardStatus{index}",
        parent=styles["card_label"],
        textColor=status_color,
    )
    content = [
        Paragraph(_safe(card["label"].upper()), styles["card_label"]),
        Spacer(1, 2),
        Paragraph(_safe(card["value"]), styles["card_value"]),
        Paragraph(_safe(localize_report_label(card["status"], language).upper()), status_style),
        Spacer(1, 3),
    ]
    content.extend(Paragraph(_safe(line), styles["card_context"]) for line in card["context"])
    return content


def _performance_glance(cards, styles, language="en"):
    cells = [_glance_card(card, styles, index, language) for index, card in enumerate(cards)]
    table = Table([cells], colWidths=[39.75 * mm] * 4)
    commands = [
        ("BOX", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for index, card in enumerate(cards):
        _, background = _status_palette(card["status"])
        commands.append(("BACKGROUND", (index, 0), (index, 0), background))
    table.setStyle(TableStyle(commands))
    return KeepTogether([
        _section_heading(localize_report_label("weekly_performance_at_a_glance", language), styles),
        Spacer(1, 4),
        table,
        Spacer(1, 7),
    ])


def _trend_direction(values) -> str:
    numeric_values = [_number(value) for value in values if value is not None]
    if len(numeric_values) < 2:
        return "No data"
    if numeric_values[-1] > numeric_values[0]:
        return "Improving"
    if numeric_values[-1] < numeric_values[0]:
        return "Declining"
    return "Stable"


def _trend_sentence(direction: str, language: str = "en") -> str:
    if normalize_report_language(language) == "mn":
        return {
            "Improving": "Тайлант хугацаанд гүйцэтгэл сайжирсан.",
            "Declining": "Тайлант хугацаанд гүйцэтгэл буурсан.",
            "Stable": "Тайлант хугацаанд гүйцэтгэл тогтвортой байсан.",
        }.get(direction, "Тайлант хугацааны хандлагын өгөгдөл байхгүй.")
    return {
        "Improving": "Improved during the reporting period",
        "Declining": "Declined during the reporting period",
        "Stable": "Remained stable during the reporting period",
    }.get(direction, "Trend unavailable for the reporting period")


def _chart_buffer(labels, values, target, language="en"):
    buffer = BytesIO()
    rc = {"font.family": "DejaVu Sans"} if normalize_report_language(language) == "mn" else {}
    with plt.rc_context(rc):
        figure, axis = plt.subplots(figsize=(3.05, 1.85))
        x_values = list(range(len(values)))
        axis.plot(
            x_values,
            values,
            color="#2563EB",
            marker="o",
            markersize=3.2,
            linewidth=1.7,
        )
        if target is not None:
            axis.axhline(
                y=target,
                color="#64748B",
                linestyle=(0, (4, 3)),
                linewidth=1.0,
            )
        axis.set_xticks(x_values)
        axis.set_xticklabels(labels, fontsize=6.4)
        axis.tick_params(axis="x", length=0, pad=3)
        axis.tick_params(axis="y", labelsize=6.4, length=0, pad=2)
        axis.grid(axis="y", color="#CBD5E1", linewidth=0.45, alpha=0.7)
        axis.set_axisbelow(True)
        axis.spines["top"].set_visible(False)
        axis.spines["right"].set_visible(False)
        axis.spines["left"].set_color("#CBD5E1")
        axis.spines["bottom"].set_color("#CBD5E1")
        axis.margins(x=0.06)
        figure.tight_layout(pad=0.35)
        figure.savefig(buffer, format="png", dpi=170, bbox_inches="tight", facecolor="white")
        plt.close(figure)
    buffer.seek(0)
    return buffer


def _trend_panel(metric, labels, values, target, styles, index, language="en"):
    direction = _trend_direction(values)
    direction_color, direction_background = _status_palette(direction)
    direction_style = ParagraphStyle(
        f"WeeklyV2TrendDirection{index}",
        parent=styles["card_label"],
        textColor=direction_color,
    )
    content = [Paragraph(_safe(metric.upper()), styles["card_label"]), Spacer(1, 2)]
    if values:
        content.append(Image(_chart_buffer(labels, values, target, language), width=47 * mm, height=29 * mm))
    else:
        content.extend([Spacer(1, 28 * mm), Paragraph(
            "Хандлагын өгөгдөлгүй" if language == "mn" else "No trend data",
            styles["card_context"],
        )])
    direction_table = Table(
        [[Paragraph(_safe(localize_report_label(direction, language).upper()), direction_style)]],
        colWidths=[31 * mm],
    )
    direction_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), direction_background),
        ("BOX", (0, 0), (-1, -1), 0.35, direction_color),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    content.extend([Spacer(1, 2), direction_table])
    return content


def _weekly_trends(trends, styles, language="en"):
    panels = [
        _trend_panel(
            trend["metric"],
            trend["labels"],
            trend["values"],
            trend["target"],
            styles,
            index,
            language,
        )
        for index, trend in enumerate(trends)
    ]
    table = Table([panels], colWidths=[53 * mm] * 3)
    table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return KeepTogether([
        _section_heading(localize_report_label("weekly_trends", language), styles),
        Spacer(1, 4),
        table,
        Spacer(1, 7),
    ])


def _attention_item(item, styles, index: int, language="en"):
    is_mongolian = normalize_report_language(language) == "mn"
    color, background = _status_palette(item["status"])
    status_style = ParagraphStyle(
        f"WeeklyV2AttentionStatus{index}",
        parent=styles["section_count"],
        textColor=color,
    )
    header = Table(
        [[
            Paragraph(
                f"{index:02d}&nbsp;&nbsp; {_safe(item['area'].upper())}",
                styles["attention_title"],
            ),
            Paragraph(_safe(localize_report_label(item["status"], language).upper()), status_style),
        ]],
        colWidths=[132 * mm, 16 * mm],
    )
    header.setStyle(TableStyle([
        ("BACKGROUND", (1, 0), (1, 0), background),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    content = [
        header,
        Table(
            [[
                Paragraph(
                    (
                        f"<b>{_safe(localize_report_label('result', language).upper())}: "
                        f"{_safe(item['performance'])}</b>"
                        if language == "mn"
                        else f"<b>{_safe(item['performance'])}</b>"
                    ),
                    styles["body_small"],
                ),
                Paragraph(
                    _safe(localize_report_label(item["trend"], language).upper()),
                    styles["issue_value"],
                ),
            ]],
            colWidths=[104 * mm, 44 * mm],
            style=TableStyle([
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]),
        ),
        Spacer(1, 1 if is_mongolian else 2),
        Paragraph(_safe(localize_report_label("trend", language).upper()), styles["attention_label"]),
        Paragraph(_safe(_trend_sentence(item["trend"], language)), styles["body_small"]),
        Spacer(1, 2.5 if is_mongolian else 5),
        Paragraph(_safe(localize_report_label("impact", language).upper()), styles["attention_impact_label"]),
        Paragraph(_safe(item["impact"]), styles["body_small"]),
        Spacer(1, 2.5 if is_mongolian else 5),
        Paragraph(_safe(localize_report_label("action", language).upper()), styles["attention_action_label"]),
        Paragraph(_safe(item["action"]), styles["body_small"]),
    ]
    return content


def _management_attention(items, styles, language="en"):
    is_mongolian = normalize_report_language(language) == "mn"
    rows = [[_section_heading(
        localize_report_label("management_attention", language),
        styles,
        pluralize_report_count(
            len(items), language=language, singular="item", mongolian_label="асуудал"
        ),
    )]]
    if not items:
        rows.append([Paragraph(
            "Удирдлагын анхаарал шаардах долоо хоногийн ноцтой зөрүү алга."
            if language == "mn"
            else "No material weekly exception requires management attention.",
            styles["body"],
        )])
    else:
        rows.extend(
            [[_attention_item(item, styles, index, language)]]
            for index, item in enumerate(items, start=1)
        )
    table = Table(rows, colWidths=[159 * mm], repeatRows=1, splitByRow=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 1), (-1, -1), WHITE_COLOR),
        ("BOX", (0, 1), (-1, -1), 0.55, BORDER_COLOR),
        ("LINEBELOW", (0, 1), (-1, -2), 0.45, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, 0), 0),
        ("RIGHTPADDING", (0, 0), (-1, 0), 0),
        ("TOPPADDING", (0, 0), (-1, 0), 0),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("LEFTPADDING", (0, 1), (-1, -1), 8),
        ("RIGHTPADDING", (0, 1), (-1, -1), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 2.5 if is_mongolian else 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 2.5 if is_mongolian else 4),
    ]))
    return table


def _executive_brief(text, styles, language="en"):
    content = Table([[Paragraph(_safe(text), styles["body"])]], colWidths=[159 * mm])
    content.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BACKGROUND),
        ("BOX", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return KeepTogether([
        _section_heading(localize_report_label("executive_brief", language), styles),
        Spacer(1, 5),
        content,
        Spacer(1, 14),
    ])


def _next_week_actions(actions, styles, language="en"):
    rows = []
    if actions:
        rows = [
            [
                Paragraph(f"{index:02d}", styles["number"]),
                Paragraph(_safe(action), styles["body"]),
            ]
            for index, action in enumerate(actions, start=1)
        ]
    else:
        rows.append([
            "",
            Paragraph(
                "Ирэх долоо хоногт зөрүүтэй холбоотой тусгай арга хэмжээ шаардлагагүй."
                if language == "mn"
                else "No exception-specific operational action is required for next week.",
                styles["body"],
            ),
        ])
    table = Table(rows, colWidths=[13 * mm, 146 * mm], splitByRow=1)
    table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return [
        _section_heading(
            localize_report_label("next_week_actions", language),
            styles,
            pluralize_report_count(
                len(actions), language=language, singular="action", mongolian_label="арга хэмжээ"
            ),
        ),
        Spacer(1, 5),
        table,
        Spacer(1, 14),
    ]


def _outlook_table(rows, styles, language="en"):
    data = [[
        Paragraph(_safe(localize_report_label("area", language).upper()), styles["table_header"]),
        Paragraph(_safe(localize_report_label("outlook_focus", language).upper()), styles["table_header"]),
    ]]
    data.extend([
        [
            Paragraph(_safe(area), styles["table_body"]),
            Paragraph(_safe(outlook), styles["table_body"]),
        ]
        for area, outlook in rows
    ])
    table = Table(data, colWidths=[45 * mm, 114 * mm], repeatRows=1)
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]
    for row_index in range(1, len(data)):
        if row_index % 2 == 1:
            commands.append(("BACKGROUND", (0, row_index), (-1, row_index), LIGHT_BACKGROUND))
    table.setStyle(TableStyle(commands))
    return KeepTogether([
        _section_heading(localize_report_label("next_week_outlook", language), styles),
        Spacer(1, 5),
        table,
        Spacer(1, 14),
    ])


def _kpi_detail(rows, styles, language="en"):
    data = [[
        Paragraph("KPI", styles["table_header"]),
        Paragraph(_safe(localize_report_label("performance", language).upper()), styles["table_header"]),
        Paragraph(_safe(localize_report_label("status", language).upper()), styles["table_header"]),
    ]]
    for index, row in enumerate(rows):
        status_color, status_background = _status_palette(row["status"])
        status_style = ParagraphStyle(
            f"WeeklyV2KpiStatus{index}",
            parent=styles["table_body"],
            fontName=styles["table_header"].fontName,
            textColor=status_color,
            alignment=TA_CENTER,
        )
        data.append([
            Paragraph(_safe(row["kpi"]), styles["table_body"]),
            Paragraph(_safe(row["performance"]), styles["table_body"]),
            Paragraph(_safe(localize_report_label(row["status"], language).upper()), status_style),
        ])
    table = Table(data, colWidths=[57 * mm, 68 * mm, 34 * mm], repeatRows=1)
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (2, 1), (2, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]
    for row_index, row in enumerate(rows, start=1):
        _, background = _status_palette(row["status"])
        commands.append(("BACKGROUND", (2, row_index), (2, row_index), background))
        if row_index % 2 == 1:
            commands.append(("BACKGROUND", (0, row_index), (1, row_index), LIGHT_BACKGROUND))
    table.setStyle(TableStyle(commands))
    return KeepTogether([
        _section_heading(localize_report_label("weekly_kpi_detail", language), styles),
        Spacer(1, 5),
        table,
        Spacer(1, 14),
    ])


def _operating_status(statuses, styles, language="en"):
    cells = [Paragraph(
        _safe(localize_report_label("weekly_operating_status", language).upper()),
        styles["status_label"],
    )]
    for index, item in enumerate(statuses):
        color, _ = _status_palette(item["status"])
        style = ParagraphStyle(
            f"WeeklyV2StripStatus{index}",
            parent=styles["status_label"],
            textColor=color,
            alignment=TA_CENTER,
        )
        cells.append([
            Paragraph(_safe(item["area"]), styles["card_context"]),
            Paragraph(_safe(localize_report_label(item["status"], language).upper()), style),
        ])
    table = Table([cells], colWidths=[43 * mm, 29 * mm, 29 * mm, 29 * mm, 29 * mm])
    commands = [
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_COLOR),
        ("BACKGROUND", (0, 0), (0, 0), LIGHT_BACKGROUND),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for index, item in enumerate(statuses, start=1):
        _, background = _status_palette(item["status"])
        commands.append(("BACKGROUND", (index, 0), (index, 0), background))
    table.setStyle(TableStyle(commands))
    return table


def _join_names(names) -> str:
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    return ", ".join(names[:-1]) + f" and {names[-1]}"


def _weekly_mn_executive_brief(attention_areas: list[str]) -> str:
    """Compose natural Mongolian prose from semantic Weekly attention areas."""

    grammatical_forms = {
        "production": ("үйлдвэрлэл", "үйлдвэрлэлд"),
        "plant_throughput": (
            "боловсруулах үйлдвэрийн нэвтрүүлэх чадвар",
            "боловсруулах үйлдвэрийн нэвтрүүлэх чадварт",
        ),
        "plant_recovery": ("металл авалт", "металл авалтад"),
        "safety": ("аюулгүй ажиллагаа", "аюулгүй ажиллагаанд"),
    }
    recognized = [area for area in attention_areas if area in grammatical_forms]

    if recognized:
        base_names = [grammatical_forms[area][0] for area in recognized[:-1]]
        final_name = grammatical_forms[recognized[-1]][1]
        joined_names = final_name if not base_names else (
            f"{base_names[0]} болон {final_name}"
            if len(base_names) == 1
            else f"{', '.join(base_names)} болон {final_name}"
        )
        brief = (
            f"{joined_names[0].upper()}{joined_names[1:]} удирдлагын анхаарал "
            "шаардлагатай байна."
        )
    else:
        brief = (
            "Долоо хоногийн үйл ажиллагааны гүйцэтгэл үндсэн KPI "
            "үзүүлэлтүүдээр тогтвортой байлаа."
        )

    if "safety" in recognized:
        brief += (
            " Аюулгүй ажиллагааны хяналтыг ирэх долоо хоногт идэвхтэй "
            "үргэлжлүүлэх шаардлагатай."
        )

    return brief


def _outlook_for(status: str, _direction: str, stable_text: str, watch_text: str) -> str:
    if status == "Stable":
        return stable_text
    return watch_text


def generate_weekly_operations_pdf(
    weekly_kpis: dict,
    language: str = "en",
):
    """Generate the customer-facing Weekly Operations Report UX V2."""

    report_language = normalize_report_language(language)
    is_mongolian = report_language == "mn"
    ensure_report_pdf_fonts(report_language)

    report_name = get_report_display_name("weekly_pdf", report_language)
    generated_at = datetime.now()
    styles = _weekly_styles(report_language)

    mine_name = resolve_customer_display_identity(
        weekly_kpis,
        report_language,
    ).operation_name
    operation_profile = str(weekly_kpis.get("operation_profile") or "standard_mine").strip().lower()
    operation_profile = operation_profile.replace("-", "_").replace(" ", "_")
    is_sxew = operation_profile in {
        "sxew", "sx_ew", "sxew_copper", "copper_sxew", "copper_cathode", "cathode",
    }
    source_production_label = str(
        weekly_kpis.get("production_label")
        or ("Cathode Production" if is_sxew else "Ore Production")
    )
    production_label = (
        localize_report_label(
            "cathode_production" if is_sxew else "ore_production",
            report_language,
        )
        if is_mongolian
        else source_production_label
    )
    period_start = weekly_kpis.get("period_start") or weekly_kpis.get("report_date") or generated_at.date()
    period_end = weekly_kpis.get("period_end") or weekly_kpis.get("report_date") or generated_at.date()

    health = _number(weekly_kpis.get("health"))
    production = _number(weekly_kpis.get("ore"))
    throughput = _number(weekly_kpis.get("throughput"))
    recovery = _number(weekly_kpis.get("recovery"))
    incidents = int(_number(weekly_kpis.get("safety")))
    safety_score = _number(weekly_kpis.get("safety_score"))
    near_misses = int(_number(weekly_kpis.get("near_misses")))
    critical_risks = int(_number(weekly_kpis.get("critical_risks")))
    days = list(weekly_kpis.get("days") or [])

    health_status = "Stable" if health >= 85 else "Watch" if health >= 75 else "Critical"
    production_status = "Stable" if production >= 100 else "Watch"
    throughput_status = "Stable" if throughput >= 100 else "Watch"
    recovery_status = "Stable" if recovery >= 90 else "Watch"
    safety_status = (
        "Stable"
        if incidents == 0 and critical_risks == 0 and safety_score >= 95
        else "Watch"
    )

    labels = []
    production_values = []
    throughput_values = []
    recovery_values = []
    for item in days:
        raw_date = str(item.get("report_date") or "")
        try:
            parsed_date = datetime.fromisoformat(raw_date)
            label = (
                f"{parsed_date.month:02d}/{parsed_date.day:02d}"
                if is_mongolian
                else format_report_date(parsed_date, report_language, "short_chart_date")
            )
        except ValueError:
            label = raw_date[5:] if len(raw_date) >= 10 else raw_date
        labels.append(label)
        production_values.append(_number(item.get("ore")))
        throughput_values.append(_number(item.get("throughput")))
        recovery_values.append(_number(item.get("recovery")))

    production_trend = _trend_direction(production_values)
    throughput_trend = _trend_direction(throughput_values)
    recovery_trend = _trend_direction(recovery_values)

    glance_cards = [
        {
            "label": localize_report_label("production", report_language),
            "value": f"{production:.1f}%",
            "status": production_status,
            "context": [
                (
                    f"Төлөвлөгөөнөөс {100 - production:.1f}% доогуур"
                    if production < 100
                    else "Төлөвлөгөөний түвшинд буюу дээгүүр"
                )
                if is_mongolian
                else (f"{100 - production:.1f}% below plan" if production < 100 else "At or above plan")
            ],
        },
        {
            "label": localize_report_label("plant_throughput", report_language),
            "value": f"{throughput:.1f}%",
            "status": throughput_status,
            "context": [
                (
                    f"Зорилтоос {100 - throughput:.1f}% доогуур"
                    if throughput < 100
                    else "Зорилтын түвшинд буюу дээгүүр"
                )
                if is_mongolian
                else (f"{100 - throughput:.1f}% below target" if throughput < 100 else "At or above target")
            ],
        },
        {
            "label": localize_report_label("plant_recovery", report_language),
            "value": f"{recovery:.1f}%",
            "status": recovery_status,
            "context": [],
        },
        {
            "label": localize_report_label("safety", report_language),
            "value": f"{safety_score:.1f}%",
            "status": safety_status,
            "context": [
                _event_phrase(incidents, "incident", language=report_language),
                _event_phrase(near_misses, "near miss", "near misses", report_language),
                _event_phrase(critical_risks, "critical risk", language=report_language),
            ],
        },
    ]

    attention_items = []
    attention_area_codes = []
    if production_status != "Stable":
        attention_area_codes.append("production")
        attention_items.append({
            "area": localize_report_label("production", report_language),
            "status": production_status,
            "performance": (
                f"Долоо хоногийн төлөвлөгөөний {production:.1f}%"
                if is_mongolian else f"{production:.1f}% of weekly plan"
            ),
            "trend": production_trend,
            "impact": (
                (
                    "Долоо хоногийн катодын үйлдвэрлэлийн зорилт тасалдах эрсдэлтэй."
                    if is_sxew
                    else "Долоо хоногийн хүдрийн үйлдвэрлэлийн гүйцэтгэл тасалдах эрсдэлтэй."
                )
                if is_mongolian
                else (
                    "Weekly cathode target remains at risk."
                    if is_sxew
                    else "Weekly ore production delivery remains at risk."
                )
            ),
            "action": (
                (
                    "Үйлдвэрлэлийг сэргээх төлөвлөгөөг баталгаажуулж, уусгалт, SX болон EW-ийн хязгаарлалтыг хянана."
                    if is_sxew
                    else "Үйлдвэрлэлийг сэргээх төлөвлөгөөг баталгаажуулж, хүдрийн үйлдвэрлэлийн хязгаарлалтыг хянана."
                )
                if is_mongolian
                else (
                    "Confirm the production recovery plan and review leach, SX and EW constraints."
                    if is_sxew
                    else "Confirm the production recovery plan and review ore production constraints."
                )
            ),
        })
    if throughput_status != "Stable":
        attention_area_codes.append("plant_throughput")
        attention_items.append({
            "area": localize_report_label("plant_throughput", report_language),
            "status": throughput_status,
            "performance": f"Зорилтын {throughput:.1f}%" if is_mongolian else f"{throughput:.1f}% of target",
            "trend": throughput_trend,
            "impact": (
                "Боловсруулах үйлдвэрийн гүйцэтгэл зорилтоос доогуур хэвээр байна."
                if is_mongolian else "Processing performance remains below target."
            ),
            "action": (
                ("Уусгалт, SX болон EW-ийн нэвтрүүлэх чадварыг сэргээх арга хэмжээг баталгаажуулна."
                 if is_sxew else "Боловсруулах үйлдвэрийн нэвтрүүлэх чадварыг сэргээх арга хэмжээг баталгаажуулна.")
                if is_mongolian
                else ("Confirm throughput recovery actions across leach, SX and EW." if is_sxew else "Confirm plant throughput recovery actions.")
            ),
        })
    if recovery_status != "Stable":
        attention_area_codes.append("plant_recovery")
        attention_items.append({
            "area": localize_report_label("plant_recovery", report_language),
            "status": recovery_status,
            "performance": f"{recovery:.1f}%",
            "trend": recovery_trend,
            "impact": (
                "Металл авалт үйл ажиллагааны босгоос доогуур хэвээр байна."
                if is_mongolian else "Metallurgical recovery remains below the operating threshold."
            ),
            "action": (
                ("Уусгалт, шингэнээр хандлах болон электролизийн хэсгүүдийн металл авалтыг сайжруулах арга хэмжээг баталгаажуулна."
                 if is_sxew else "Металл авалтыг сайжруулах арга хэмжээг баталгаажуулна.")
                if is_mongolian
                else ("Confirm recovery improvement actions across leach, solvent extraction and electrowinning."
                      if is_sxew else "Confirm metallurgical recovery improvement actions.")
            ),
        })
    safety_exception = incidents > 0 or near_misses > 0 or critical_risks > 0 or safety_score < 95
    if safety_exception:
        attention_area_codes.append("safety")
        attention_items.append({
            "area": localize_report_label("safety", report_language),
            "status": "Watch",
            "performance": f"{safety_score:.1f}% үнэлгээ" if is_mongolian else f"{safety_score:.1f}% score",
            "trend": "No data",
            "impact": (
                (f"Тайлант хугацаанд {_event_phrase(incidents, 'incident', language=report_language)}, "
                 f"{_event_phrase(near_misses, 'near miss', 'near misses', report_language)} болон "
                 f"{_event_phrase(critical_risks, 'critical risk', language=report_language)} байна.")
                if is_mongolian
                else (f"The period recorded {_event_phrase(incidents, 'incident')}, "
                      f"{_event_phrase(near_misses, 'near miss', 'near misses')} and "
                      f"{_event_phrase(critical_risks, 'critical risk')}.")
            ),
            "action": (
                "Ноцтой эрсдэлийн хяналтыг баталгаажуулж, тодорхойлсон аюулгүй ажиллагааны арга хэмжээг хаана."
                if is_mongolian else "Verify critical controls and close identified safety actions."
            ),
        })

    actions = [item["action"] for item in attention_items]
    attention_names = [item["area"] for item in attention_items]
    if is_mongolian:
        executive_brief = _weekly_mn_executive_brief(attention_area_codes)
    else:
        if attention_names:
            executive_brief = f"{_join_names(attention_names)} require management attention."
        else:
            executive_brief = "Weekly operating performance remained stable across the headline KPIs."
        executive_brief += (
            " Safety remained stable throughout the reporting period."
            if not safety_exception
            else " Safety indicators require active management follow-through."
        )

    outlook_rows = [
        (
            localize_report_label("production", report_language),
            _outlook_for(
                production_status,
                production_trend,
                "Төлөвлөгөөний түвшинд буюу дээгүүр гүйцэтгэлийг хадгалах" if is_mongolian else "Sustain delivery at or above plan",
                "Гүйцэтгэлийг төлөвлөгөөний түвшинд сэргээх" if is_mongolian else "Restore performance toward plan",
            ),
        ),
        (
            localize_report_label("plant_throughput", report_language),
            _outlook_for(
                throughput_status,
                throughput_trend,
                "Боловсруулах үйлдвэрийн гүйцэтгэлийг хадгалах" if is_mongolian else "Sustain processing performance",
                "Боловсруулах үйлдвэрийн гүйцэтгэлийг сэргээх" if is_mongolian else "Recover processing performance",
            ),
        ),
        (
            localize_report_label("plant_recovery", report_language),
            _outlook_for(
                recovery_status,
                recovery_trend,
                "Металл авалтын хяналтыг хадгалах" if is_mongolian else "Maintain metallurgical recovery controls",
                "Металл авалтыг сайжруулах" if is_mongolian else "Improve metallurgical recovery",
            ),
        ),
        (
            localize_report_label("safety", report_language),
            (
                "Одоогийн хяналтыг хэвээр хадгалах"
                if not safety_exception
                else "Ноцтой эрсдэлийн хяналтыг баталгаажуулж, аюулгүй ажиллагааны арга хэмжээг хаах"
            )
            if is_mongolian
            else ("Maintain current controls" if not safety_exception else "Verify critical controls and close safety actions"),
        ),
    ]

    kpi_rows = [
        {"kpi": production_label, "performance": f"Төлөвлөгөөний {production:.1f}%" if is_mongolian else f"{production:.1f}% of plan", "status": production_status},
        {"kpi": localize_report_label("plant_throughput", report_language), "performance": f"Зорилтын {throughput:.1f}%" if is_mongolian else f"{throughput:.1f}% of target", "status": throughput_status},
        {"kpi": localize_report_label("plant_recovery", report_language), "performance": f"{recovery:.1f}%", "status": recovery_status},
        {
            "kpi": localize_report_label("safety", report_language),
            "performance": f"{safety_score:.1f}% / {_event_phrase(incidents, 'incident', language=report_language)}",
            "status": safety_status,
        },
    ]
    operating_statuses = [
        {"area": localize_report_label("production", report_language), "status": production_status},
        {"area": localize_report_label("throughput", report_language), "status": throughput_status},
        {"area": localize_report_label("recovery", report_language), "status": recovery_status},
        {"area": localize_report_label("safety", report_language), "status": safety_status},
    ]

    story = [
        _report_header(
            mine_name=mine_name,
            period_start=period_start,
            period_end=period_end,
            generated_at=generated_at,
            styles=styles,
            language=report_language,
        ),
        _weekly_health(health, health_status, styles, report_language),
        _performance_glance(glance_cards, styles, report_language),
        _weekly_trends([
            {
                "metric": production_label,
                "labels": labels,
                "values": production_values,
                "target": 100,
            },
            {
                "metric": localize_report_label("plant_throughput", report_language),
                "labels": labels,
                "values": throughput_values,
                "target": 100,
            },
            {
                "metric": localize_report_label("plant_recovery", report_language),
                "labels": labels,
                "values": recovery_values,
                "target": 90,
            },
        ], styles, report_language),
        _management_attention(attention_items, styles, report_language),
        PageBreak(),
    ]
    story.extend(_continuation_header(
        mine_name=mine_name,
        period_start=period_start,
        period_end=period_end,
        styles=styles,
        language=report_language,
    ))
    story.append(_executive_brief(executive_brief, styles, report_language))
    story.extend(_next_week_actions(actions, styles, report_language))
    story.extend([
        _outlook_table(outlook_rows, styles, report_language),
        _kpi_detail(kpi_rows, styles, report_language),
        _operating_status(operating_statuses, styles, report_language),
    ])

    return build_pdf(story=story, report_name=report_name, language=report_language)
