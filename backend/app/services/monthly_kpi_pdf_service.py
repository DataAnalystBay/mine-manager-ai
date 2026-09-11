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
GREEN_TINT = colors.HexColor("#F0FDF4")
AMBER_TINT = colors.HexColor("#FFF7ED")
RED_TINT = colors.HexColor("#FEF2F2")
NEUTRAL_TINT = colors.HexColor("#F8FAFC")

HEALTH_TARGET = 85.0
PRODUCTION_TARGET = 100.0
THROUGHPUT_TARGET = 100.0
RECOVERY_TARGET = 90.0
SAFETY_TARGET = 95.0


def _safe(value) -> str:
    return escape(str(value or ""))


def _number(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _display_date(value, language="en") -> str:
    raw = str(value or "").strip()
    try:
        return format_report_date(
            datetime.fromisoformat(raw), language, "reporting_period_date"
        )
    except ValueError:
        return raw or ("Байхгүй" if normalize_report_language(language) == "mn" else "Not available")


def _display_period(start, end, language="en") -> str:
    start_text = _display_date(start, language)
    end_text = _display_date(end, language)
    return start_text if start_text == end_text else f"{start_text} - {end_text}"


def _status_palette(status: str):
    normalized = str(status or "").strip().lower()
    if normalized in {"stable", "healthy", "on track", "above target", "improving"}:
        return PRIMARY_COLOR, GREEN_TINT
    if normalized in {"watch", "attention", "medium", "declining"}:
        return AMBER_COLOR, AMBER_TINT
    if normalized in {"critical", "high", "overdue"}:
        return RED_COLOR, RED_TINT
    return MUTED_TEXT_COLOR, NEUTRAL_TINT


def _count_phrase(count: int, singular: str, plural: str | None = None) -> str:
    noun = singular if count == 1 else (plural or f"{singular}s")
    return f"{count} {noun}"


def _event_phrase(count: int, singular: str, plural: str | None = None, language="en") -> str:
    if normalize_report_language(language) == "mn":
        labels = {
            "incident": "осол",
            "near miss": "осолд дөхсөн тохиолдол",
            "critical risk": "ноцтой эрсдэл",
        }
        return f"{count} {labels.get(singular, singular)}"
    noun = singular if count == 1 else (plural or f"{singular}s")
    return f"no {noun}" if count == 0 else f"{count} {noun}"


def _status_label(value: float, target: float, strong_margin: float = 3.0) -> str:
    if value >= target + strong_margin:
        return "Above Target"
    if value >= target:
        return "On Track"
    return "Watch"


def _monthly_safety_status(incidents, critical_risks, safety_score):
    return (
        "On Track"
        if incidents == 0 and critical_risks == 0 and safety_score >= SAFETY_TARGET
        else "Watch"
    )


def _monthly_safety_requires_attention(
    incidents, near_misses, critical_risks, safety_score
):
    return (
        incidents > 0
        or near_misses > 0
        or critical_risks > 0
        or safety_score < SAFETY_TARGET
    )


def _monthly_mn_safety_action(
    incidents, near_misses, critical_risks, *, safety_exception=True
):
    """Compose a truthful MN action from the Safety event types present."""

    if not safety_exception:
        return None

    control_text = (
        "Ноцтой эрсдэлийн хяналтыг баталгаажуулж"
        if critical_risks > 0
        else "Аюулгүй ажиллагааны эрсдэлийн хяналтыг баталгаажуулж"
    )
    event_objects = []
    if incidents > 0:
        event_objects.append(
            "бүртгэгдсэн ослыг" if incidents == 1 else "бүртгэгдсэн ослуудыг"
        )
    if near_misses > 0:
        event_objects.append(
            "осолд дөхсөн тохиолдлыг"
            if near_misses == 1
            else "осолд дөхсөн тохиолдлуудыг"
        )
    if critical_risks > 0:
        event_objects.append(
            "бүртгэгдсэн ноцтой эрсдэлийг"
            if critical_risks == 1
            else "бүртгэгдсэн ноцтой эрсдэлүүдийг"
        )

    if event_objects:
        joined_events = (
            event_objects[0]
            if len(event_objects) == 1
            else ", ".join(event_objects[:-1]) + f" болон {event_objects[-1]}"
        )
        return (
            f"{control_text}, {joined_events} шалган, шаардлагатай залруулах "
            "арга хэмжээг хэрэгжүүлнэ."
        )

    return f"{control_text}, шаардлагатай залруулах арга хэмжээг хэрэгжүүлнэ."


def _monthly_mn_safety_outlook(safety_exception, critical_risks):
    if not safety_exception:
        return "Аюулгүй ажиллагааны хяналтыг тогтвортой үргэлжлүүлэх"
    if critical_risks > 0:
        return "Ноцтой эрсдэлийн арга хэмжээг хааж, хяналтыг баталгаажуулах"
    return (
        "Аюулгүй ажиллагааны залруулах арга хэмжээг хэрэгжүүлж, эрсдэлийн "
        "хяналтыг баталгаажуулах"
    )


def _monthly_styles(language="en"):
    base = get_report_styles()
    fonts = ensure_report_pdf_fonts(language)
    regular_font = fonts["regular"]
    bold_font = fonts["bold"]
    is_mongolian = normalize_report_language(language) == "mn"
    return {
        "brand": ParagraphStyle(
            "MonthlyV2Brand", parent=base["Normal"], fontName=bold_font,
            fontSize=9.5, leading=12, textColor=PRIMARY_COLOR,
        ),
        "report_title": ParagraphStyle(
            "MonthlyV2ReportTitle", parent=base["Normal"], fontName=bold_font,
            fontSize=(9 if is_mongolian else 11),
            leading=(11 if is_mongolian else 13), textColor=NAVY, alignment=TA_RIGHT,
        ),
        "mine": ParagraphStyle(
            "MonthlyV2Mine", parent=base["Normal"], fontName=bold_font,
            fontSize=(14 if is_mongolian else 16),
            leading=(16 if is_mongolian else 19), textColor=NAVY,
        ),
        "continuation_mine": ParagraphStyle(
            "MonthlyV2ContinuationMine", parent=base["Normal"], fontName=bold_font,
            fontSize=(8.2 if is_mongolian else 9),
            leading=(10 if is_mongolian else 11), textColor=NAVY,
        ),
        "meta": ParagraphStyle(
            "MonthlyV2Meta", parent=base["Normal"], fontName=regular_font,
            fontSize=(7 if is_mongolian else 8),
            leading=(8.5 if is_mongolian else 10), textColor=MUTED_TEXT_COLOR,
        ),
        "meta_right": ParagraphStyle(
            "MonthlyV2MetaRight", parent=base["Normal"], fontName=regular_font,
            fontSize=(7 if is_mongolian else 8),
            leading=(8.5 if is_mongolian else 10), textColor=MUTED_TEXT_COLOR, alignment=TA_RIGHT,
        ),
        "section": ParagraphStyle(
            "MonthlyV2Section", parent=base["Normal"], fontName=bold_font,
            fontSize=(9.2 if is_mongolian else 10.5),
            leading=(11 if is_mongolian else 13), textColor=NAVY,
        ),
        "section_count": ParagraphStyle(
            "MonthlyV2SectionCount", parent=base["Normal"], fontName=bold_font,
            fontSize=(6.2 if is_mongolian else 7),
            leading=(8 if is_mongolian else 9), textColor=MUTED_TEXT_COLOR, alignment=TA_RIGHT,
        ),
        "health_label": ParagraphStyle(
            "MonthlyV2HealthLabel", parent=base["Normal"], fontName=bold_font,
            fontSize=(7 if is_mongolian else 8),
            leading=(8.5 if is_mongolian else 10), textColor=MUTED_TEXT_COLOR,
        ),
        "health_context": ParagraphStyle(
            "MonthlyV2HealthContext", parent=base["Normal"], fontName=regular_font,
            fontSize=(7.5 if is_mongolian else 8.5),
            leading=(9 if is_mongolian else 11), textColor=TEXT_COLOR,
        ),
        "health_value": ParagraphStyle(
            "MonthlyV2HealthValue", parent=base["Normal"], fontName=bold_font,
            fontSize=27, leading=29, textColor=NAVY, alignment=TA_CENTER,
        ),
        "card_label": ParagraphStyle(
            "MonthlyV2CardLabel", parent=base["Normal"], fontName=bold_font,
            fontSize=(5.8 if is_mongolian else 6.8),
            leading=(7 if is_mongolian else 8), textColor=MUTED_TEXT_COLOR, alignment=TA_CENTER,
        ),
        "card_value": ParagraphStyle(
            "MonthlyV2CardValue", parent=base["Normal"], fontName=bold_font,
            fontSize=(16 if is_mongolian else 18),
            leading=(18 if is_mongolian else 21), textColor=NAVY, alignment=TA_CENTER,
        ),
        "card_context": ParagraphStyle(
            "MonthlyV2CardContext", parent=base["Normal"], fontName=regular_font,
            fontSize=(6.1 if is_mongolian else 7),
            leading=(7.4 if is_mongolian else 8.5), textColor=TEXT_COLOR, alignment=TA_CENTER,
        ),
        "body": ParagraphStyle(
            "MonthlyV2Body", parent=base["Normal"], fontName=regular_font,
            fontSize=(7.5 if is_mongolian else 8.5),
            leading=(10 if is_mongolian else 11.5), textColor=TEXT_COLOR,
        ),
        "body_small": ParagraphStyle(
            "MonthlyV2BodySmall", parent=base["Normal"], fontName=regular_font,
            fontSize=(6.3 if is_mongolian else 7.7),
            leading=(7.7 if is_mongolian else 9.5), textColor=TEXT_COLOR,
        ),
        "attention_label": ParagraphStyle(
            "MonthlyV2AttentionLabel", parent=base["Normal"], fontName=bold_font,
            fontSize=6.5, leading=8, textColor=NAVY,
        ),
        "attention_impact_label": ParagraphStyle(
            "MonthlyV2AttentionImpactLabel", parent=base["Normal"], fontName=bold_font,
            fontSize=(6.6 if is_mongolian else 6.5), leading=8, textColor=NAVY,
        ),
        "attention_action_label": ParagraphStyle(
            "MonthlyV2AttentionActionLabel", parent=base["Normal"], fontName=bold_font,
            fontSize=(6.6 if is_mongolian else 6.5), leading=8,
            textColor=(PRIMARY_COLOR if is_mongolian else NAVY),
        ),
        "attention_title": ParagraphStyle(
            "MonthlyV2AttentionTitle", parent=base["Normal"], fontName=bold_font,
            fontSize=(6.9 if is_mongolian else 8.6),
            leading=(8.3 if is_mongolian else 10), textColor=NAVY,
        ),
        "number": ParagraphStyle(
            "MonthlyV2Number", parent=base["Normal"], fontName=bold_font,
            fontSize=(7.5 if is_mongolian else 8.2),
            leading=(10 if is_mongolian else 11), textColor=PRIMARY_COLOR, alignment=TA_CENTER,
        ),
        "status_label": ParagraphStyle(
            "MonthlyV2StatusLabel", parent=base["Normal"], fontName=bold_font,
            fontSize=(6.2 if is_mongolian else 7),
            leading=(8 if is_mongolian else 9), textColor=MUTED_TEXT_COLOR,
        ),
        "table_header": ParagraphStyle(
            "MonthlyV2TableHeader", parent=base["Normal"], fontName=bold_font,
            fontSize=(6.1 if is_mongolian else 7),
            leading=(7.5 if is_mongolian else 8.5), textColor=WHITE_COLOR,
        ),
        "table_body": ParagraphStyle(
            "MonthlyV2TableBody", parent=base["Normal"], fontName=regular_font,
            fontSize=(6.8 if is_mongolian else 7.7),
            leading=(8.3 if is_mongolian else 9.5), textColor=TEXT_COLOR,
        ),
        "metric_label": ParagraphStyle(
            "MonthlyV2MetricLabel", parent=base["Normal"], fontName=bold_font,
            fontSize=(5.7 if is_mongolian else 6.1),
            leading=(7 if is_mongolian else 7.5), textColor=MUTED_TEXT_COLOR,
        ),
        "metric_value": ParagraphStyle(
            "MonthlyV2MetricValue", parent=base["Normal"], fontName=bold_font,
            fontSize=(6.6 if is_mongolian else 7.8),
            leading=(8 if is_mongolian else 9.5), textColor=NAVY,
        ),
        "trend_note": ParagraphStyle(
            "MonthlyV2TrendNote", parent=base["Normal"], fontName=regular_font,
            fontSize=(5.8 if is_mongolian else 6.7),
            leading=(7 if is_mongolian else 8), textColor=MUTED_TEXT_COLOR, alignment=TA_CENTER,
        ),
    }


def _section_heading(title, styles, count_text=None):
    table = Table([[
        Paragraph(_safe(str(title).upper()), styles["section"]),
        Paragraph(_safe(str(count_text or "").upper()), styles["section_count"]),
    ]], colWidths=[124 * mm, 35 * mm])
    table.setStyle(TableStyle([
        ("LINEBEFORE", (0, 0), (0, 0), 3, PRIMARY_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return table


def _report_header(mine_name, period_start, period_end, generated_at, styles, language="en"):
    top = Table([[
        Paragraph("Mine Manager AI" if language == "mn" else "MINE MANAGER AI", styles["brand"]),
        Paragraph(_safe(localize_report_label("monthly_report", language).upper()), styles["report_title"]),
    ]], colWidths=[79.5 * mm, 79.5 * mm])
    top.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 1.2, PRIMARY_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    metadata = Table([
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
    ], colWidths=[100 * mm, 59 * mm])
    metadata.setStyle(TableStyle([
        ("SPAN", (0, 0), (1, 0)),
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    return KeepTogether([top, Spacer(1, 6), metadata, Spacer(1, 7)])


def _continuation_header(mine_name, period_start, period_end, styles, language="en"):
    top = Table([[
        Paragraph("Mine Manager AI" if language == "mn" else "MINE MANAGER AI", styles["brand"]),
        Paragraph(_safe(localize_report_label("monthly_report", language).upper()), styles["report_title"]),
    ]], colWidths=[79.5 * mm, 79.5 * mm])
    top.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 1.2, PRIMARY_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    context = Table([[
        Paragraph(_safe(mine_name), styles["continuation_mine"]),
        Paragraph(_safe(_display_period(period_start, period_end, language)), styles["meta_right"]),
    ]], colWidths=[105 * mm, 54 * mm])
    context.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return [top, context, Spacer(1, 8)]


def _status_badge(status, styles, name, width=25 * mm, language="en"):
    color, background = _status_palette(status)
    style = ParagraphStyle(
        name, parent=styles["section_count"], textColor=color, alignment=TA_CENTER,
    )
    table = Table([[
        Paragraph(_safe(localize_report_label(status, language).upper()), style)
    ]], colWidths=[width])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.45, color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
    ]))
    return table


def _monthly_health(value, status, styles, language="en"):
    _, background = _status_palette(status)
    table = Table([[
        [
            Paragraph(_safe(localize_report_label("monthly_mine_health", language).upper()), styles["health_label"]),
            Spacer(1, 1),
            Paragraph(_safe(localize_report_label("overall_monthly_operating_condition", language)), styles["health_context"]),
        ],
        Paragraph(f"{value:.1f}", styles["health_value"]),
        _status_badge(status, styles, "MonthlyV2HealthStatus", language=language),
    ]], colWidths=[77 * mm, 47 * mm, 35 * mm])
    table.setStyle(TableStyle([
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
    return KeepTogether([table, Spacer(1, 7)])


def _glance_card(card, styles, index, language="en"):
    status_color, _ = _status_palette(card["status"])
    status_style = ParagraphStyle(
        f"MonthlyV2CardStatus{index}", parent=styles["card_label"], textColor=status_color,
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
    table = Table(
        [[_glance_card(card, styles, index, language) for index, card in enumerate(cards)]],
        colWidths=[39.75 * mm] * 4,
    )
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
        _section_heading(localize_report_label("monthly_performance_at_a_glance", language), styles),
        Spacer(1, 4), table, Spacer(1, 7),
    ])


def _trend_direction(values):
    valid = [_number(value) for value in values if value is not None]
    if len(valid) < 2:
        return "No data"
    if valid[-1] > valid[0]:
        return "Improving"
    if valid[-1] < valid[0]:
        return "Declining"
    return "Stable"


def _chart_value(item, chart_key, fallback_key):
    raw = item[chart_key] if chart_key in item else item.get(fallback_key)
    return None if raw is None else _number(raw)


def _chart_buffer(labels, values, target, language="en"):
    buffer = BytesIO()
    rc = {"font.family": "DejaVu Sans"} if normalize_report_language(language) == "mn" else {}
    with plt.rc_context(rc):
        figure, axis = plt.subplots(figsize=(3.05, 1.75))
        x_values = list(range(len(values)))
        axis.plot(
            x_values, values, color="#2563EB", marker="o", markersize=2.7,
            linewidth=1.5,
        )
        axis.axhline(
            y=target, color="#64748B", linestyle=(0, (4, 3)), linewidth=1.0,
        )
        if x_values:
            tick_step = max(1, len(x_values) // 5)
            tick_positions = list(range(0, len(x_values), tick_step))
            if tick_positions[-1] != x_values[-1]:
                tick_positions.append(x_values[-1])
            axis.set_xticks(tick_positions)
            axis.set_xticklabels([labels[index] for index in tick_positions], fontsize=6.1)
        axis.tick_params(axis="x", length=0, pad=3)
        axis.tick_params(axis="y", labelsize=6.2, length=0, pad=2)
        axis.grid(axis="y", color="#CBD5E1", linewidth=0.45, alpha=0.7)
        axis.set_axisbelow(True)
        axis.spines["top"].set_visible(False)
        axis.spines["right"].set_visible(False)
        axis.spines["left"].set_color("#CBD5E1")
        axis.spines["bottom"].set_color("#CBD5E1")
        axis.margins(x=0.03)
        figure.tight_layout(pad=0.35)
        figure.savefig(buffer, format="png", dpi=170, bbox_inches="tight", facecolor="white")
        plt.close(figure)
    buffer.seek(0)
    return buffer


def _trend_panel(metric, labels, values, target, styles, index, language="en"):
    direction = _trend_direction(values)
    color, background = _status_palette(direction)
    direction_style = ParagraphStyle(
        f"MonthlyV2TrendDirection{index}", parent=styles["card_label"], textColor=color,
    )
    content = [Paragraph(_safe(metric.upper()), styles["card_label"]), Spacer(1, 2)]
    if any(value is not None for value in values):
        content.append(Image(_chart_buffer(labels, values, target, language), width=47 * mm, height=27 * mm))
    else:
        content.extend([Spacer(1, 26 * mm), Paragraph(
            "Хандлагын өгөгдөлгүй" if language == "mn" else "No trend data",
            styles["card_context"],
        )])
    badge = Table([[
        Paragraph(_safe(localize_report_label(direction, language).upper()), direction_style)
    ]], colWidths=[31 * mm])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.35, color),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    content.extend([Spacer(1, 2), badge])
    return content


def _performance_trends(trends, styles, language="en"):
    panels = [
        _trend_panel(
            trend["metric"], trend["labels"], trend["values"], trend["target"], styles, index, language,
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
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return KeepTogether([
        _section_heading(localize_report_label("monthly_trends", language), styles),
        Spacer(1, 1),
        Paragraph(_safe(localize_report_label(
            "daily_performance_across_reporting_period", language
        ).upper()), styles["trend_note"]),
        Spacer(1, 3), table, Spacer(1, 6),
    ])


def _metric_cell(label, value, styles):
    return [
        Paragraph(_safe(label.upper()), styles["metric_label"]),
        Paragraph(_safe(value), styles["metric_value"]),
    ]


def _attention_item(item, styles, index, language="en"):
    is_mongolian = normalize_report_language(language) == "mn"
    color, background = _status_palette(item["level"])
    level_style = ParagraphStyle(
        f"MonthlyV2AttentionLevel{index}", parent=styles["section_count"], textColor=color,
    )
    header = Table([[
        Paragraph(
            f"{index:02d}&nbsp;&nbsp; {_safe(item['area'].upper())}", styles["attention_title"],
        ),
        Paragraph(_safe(localize_report_label(item["level"], language).upper()), level_style),
    ]], colWidths=[132 * mm, 16 * mm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (1, 0), (1, 0), background),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    if item.get("safety"):
        metrics = [
            _metric_cell(localize_report_label("score", language), item["result"], styles),
            _metric_cell(
                localize_report_label("status", language),
                localize_report_label(item["status"], language).upper(),
                styles,
            ),
            _metric_cell(localize_report_label("events", language), item["events"], styles),
        ]
    else:
        metrics = [
            _metric_cell(localize_report_label("result", language), item["result"], styles),
            _metric_cell(localize_report_label("variance", language), item["variance"], styles),
            _metric_cell(
                localize_report_label("trend", language),
                localize_report_label(item["trend"], language).upper(),
                styles,
            ),
        ]
    metric_table = Table([metrics], colWidths=[49.3 * mm] * 3)
    metric_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return [
        header, Spacer(1, 2), metric_table, Spacer(1, 2.5 if is_mongolian else 4.5),
        Paragraph(_safe(localize_report_label("impact", language).upper()), styles["attention_impact_label"]),
        Paragraph(_safe(item["impact"]), styles["body_small"]),
        Spacer(1, 2.5 if is_mongolian else 4.5),
        Paragraph(_safe(localize_report_label("action", language).upper()), styles["attention_action_label"]),
        Paragraph(_safe(item["action"]), styles["body_small"]),
    ]


def _management_attention(items, styles, language="en"):
    is_mongolian = normalize_report_language(language) == "mn"
    rows = [[_section_heading(
        localize_report_label("management_attention", language), styles,
        pluralize_report_count(
            len(items), language=language, singular="item", mongolian_label="асуудал"
        ),
    )]]
    if not items:
        rows.append([Paragraph(
            "Тайлант хугацаанд удирдлагын анхаарал шаардах ноцтой KPI зөрүү алга."
            if is_mongolian
            else "No material current-period KPI exception requires management attention.",
            styles["body"],
        )])
    else:
        rows.extend([[_attention_item(item, styles, index, language)]] for index, item in enumerate(items, 1))
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
        ("TOPPADDING", (0, 1), (-1, -1), 2.5 if is_mongolian else 3.5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 2.5 if is_mongolian else 3.5),
    ]))
    return table


def _executive_brief(text, styles, language="en"):
    content = Table([[Paragraph(_safe(text), styles["body"])]], colWidths=[159 * mm])
    content.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BACKGROUND),
        ("BOX", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return KeepTogether([
        _section_heading(localize_report_label("executive_brief", language), styles),
        Spacer(1, 5), content, Spacer(1, 16),
    ])


def _strategic_actions(actions, styles, language="en"):
    rows = [
        [Paragraph(f"{index:02d}", styles["number"]), Paragraph(_safe(action), styles["body"])]
        for index, action in enumerate(actions, 1)
    ]
    if not rows:
        rows = [["", Paragraph(
            "Ирэх хугацаанд зөрүүтэй холбоотой стратегийн тусгай арга хэмжээ шаардлагагүй."
            if language == "mn"
            else "No exception-specific strategic action is required for the next period.",
            styles["body"],
        )]]
    table = Table(rows, colWidths=[13 * mm, 146 * mm], splitByRow=1)
    table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 8.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8.5),
    ]))
    return [
        _section_heading(
            localize_report_label("strategic_actions", language), styles,
            pluralize_report_count(
                len(actions), language=language, singular="action", mongolian_label="арга хэмжээ"
            ),
        ),
        Spacer(1, 5), table, Spacer(1, 16),
    ]


def _simple_table_section(
    title, headers, rows, widths, styles, status_column=None,
    row_padding=6, spacing_after=12, language="en",
):
    data = [[Paragraph(_safe(header), styles["table_header"]) for header in headers]]
    data.extend([
        [
            Paragraph(
                _safe(
                    localize_report_label(value, language)
                    if status_column is not None and column_index == status_column
                    else value
                ),
                styles["table_body"],
            )
            for column_index, value in enumerate(row)
        ]
        for row in rows
    ])
    table = Table(data, colWidths=widths, repeatRows=1)
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), row_padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), row_padding),
    ]
    for row_index, row in enumerate(rows, 1):
        if row_index % 2 == 1:
            commands.append(("BACKGROUND", (0, row_index), (-1, row_index), LIGHT_BACKGROUND))
        if status_column is not None:
            color, background = _status_palette(row[status_column])
            commands.append(("BACKGROUND", (status_column, row_index), (status_column, row_index), background))
            commands.append(("TEXTCOLOR", (status_column, row_index), (status_column, row_index), color))
            commands.append((
                "FONTNAME", (status_column, row_index), (status_column, row_index),
                styles["table_header"].fontName,
            ))
            commands.append(("ALIGN", (status_column, row_index), (status_column, row_index), "CENTER"))
    table.setStyle(TableStyle(commands))
    return KeepTogether([
        _section_heading(title, styles), Spacer(1, 5), table, Spacer(1, spacing_after),
    ])


def _operating_status(statuses, styles, language="en"):
    cells = [Paragraph(
        _safe(localize_report_label("monthly_operating_status", language).upper()),
        styles["status_label"],
    )]
    for index, item in enumerate(statuses):
        color, _ = _status_palette(item["status"])
        style = ParagraphStyle(
            f"MonthlyV2StripStatus{index}", parent=styles["status_label"],
            textColor=color, alignment=TA_CENTER,
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
    for index, item in enumerate(statuses, 1):
        _, background = _status_palette(item["status"])
        commands.append(("BACKGROUND", (index, 0), (index, 0), background))
    table.setStyle(TableStyle(commands))
    return table


def _join_names(names):
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    return ", ".join(names[:-1]) + f" and {names[-1]}"


def _monthly_mn_executive_brief(attention_areas, health_status="Stable"):
    """Compose natural Mongolian prose from semantic Monthly attention areas."""

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
    if not recognized:
        return (
            "Сарын үйл ажиллагааны ерөнхий нөхцөл тогтвортой байлаа. "
            "Удирдлагын түвшинд шилжүүлэх үндсэн KPI зөрүү алга."
            if health_status == "Stable"
            else "Сарын үйл ажиллагааны ерөнхий нөхцөлд удирдлагын хяналт шаардлагатай байна."
        )

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
    if "safety" in recognized:
        brief += " Аюулгүй ажиллагааны эрсдэлийн хяналтыг идэвхтэй үргэлжлүүлэх шаардлагатай."
    return brief


def generate_monthly_kpi_pdf(
    monthly_kpis: dict,
    language: str = "en",
):
    """Generate the customer-facing Monthly KPI Pack UX V2."""

    report_language = normalize_report_language(language)
    is_mongolian = report_language == "mn"
    ensure_report_pdf_fonts(report_language)
    report_name = get_report_display_name("monthly_pdf", report_language)
    generated_at = datetime.now()
    styles = _monthly_styles(report_language)

    mine_name = resolve_customer_display_identity(
        monthly_kpis,
        report_language,
    ).operation_name
    operation_profile = str(monthly_kpis.get("operation_profile") or "standard_mine").strip().lower()
    operation_profile = operation_profile.replace("-", "_").replace(" ", "_")
    is_sxew = operation_profile in {
        "sxew", "sx_ew", "sxew_copper", "copper_sxew", "copper_cathode", "cathode",
    }
    source_production_label = str(
        monthly_kpis.get("production_label")
        or ("Cathode Production" if is_sxew else "Ore Production")
    )
    production_label = (
        localize_report_label(
            "cathode_production" if is_sxew else "ore_production", report_language
        )
        if is_mongolian else source_production_label
    )
    period_start = monthly_kpis.get("period_start") or monthly_kpis.get("report_date") or generated_at.date()
    period_end = monthly_kpis.get("period_end") or monthly_kpis.get("report_date") or generated_at.date()

    health = _number(monthly_kpis.get("health"))
    production = _number(monthly_kpis.get("ore"))
    throughput = _number(monthly_kpis.get("throughput"))
    recovery = _number(monthly_kpis.get("recovery"))
    incidents = int(_number(monthly_kpis.get("safety")))
    safety_score = _number(monthly_kpis.get("safety_score"))
    near_misses = int(_number(monthly_kpis.get("near_misses")))
    critical_risks = int(_number(monthly_kpis.get("critical_risks")))
    days = list(monthly_kpis.get("days") or [])

    health_status = "Stable" if health >= HEALTH_TARGET else "Watch"
    production_status = _status_label(production, PRODUCTION_TARGET)
    throughput_status = _status_label(throughput, THROUGHPUT_TARGET)
    recovery_status = _status_label(recovery, RECOVERY_TARGET, strong_margin=2.0)
    safety_status = _monthly_safety_status(incidents, critical_risks, safety_score)

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
        throughput_values.append(_chart_value(item, "throughput_chart", "throughput"))
        recovery_values.append(_chart_value(item, "recovery_chart", "recovery"))

    production_trend = _trend_direction(production_values)
    throughput_trend = _trend_direction(throughput_values)
    recovery_trend = _trend_direction(recovery_values)

    safety_events = [
        phrase
        for count, phrase in [
            (incidents, _event_phrase(incidents, "incident", language=report_language)),
            (near_misses, _event_phrase(near_misses, "near miss", "near misses", report_language)),
            (critical_risks, _event_phrase(critical_risks, "critical risk", language=report_language)),
        ]
        if count > 0
    ]
    safety_reason = " | ".join(safety_events)
    if safety_status == "Watch" and not safety_reason:
        safety_reason = "Аюулгүй ажиллагааны үнэлгээ зорилтоос доогуур" if is_mongolian else "Below safety score target"

    if critical_risks > 0:
        safety_glance_events = []
        if incidents > 0:
            safety_glance_events.append(_event_phrase(incidents, "incident", language=report_language))
        safety_glance_events.append(_event_phrase(critical_risks, "critical risk", language=report_language))
    else:
        safety_glance_events = [
            phrase
            for count, phrase in [
                (incidents, _event_phrase(incidents, "incident", language=report_language)),
                (near_misses, _event_phrase(near_misses, "near miss", "near misses", report_language)),
            ]
            if count > 0
        ]
    safety_glance_reason = " • ".join(safety_glance_events)
    if safety_status == "Watch" and not safety_glance_reason:
        safety_glance_reason = "Аюулгүй ажиллагааны үнэлгээ зорилтоос доогуур" if is_mongolian else "Below safety score target"

    glance_cards = [
        {
            "label": localize_report_label("production", report_language),
            "value": f"{production:.1f}%", "status": production_status,
            "context": [
                f"Төлөвлөгөөтэй харьцуулахад {production - PRODUCTION_TARGET:+.1f}%"
                if is_mongolian else f"{production - PRODUCTION_TARGET:+.1f}% vs plan"
            ],
        },
        {
            "label": localize_report_label("plant_throughput", report_language),
            "value": f"{throughput:.1f}%", "status": throughput_status,
            "context": [
                f"Зорилттой харьцуулахад {throughput - THROUGHPUT_TARGET:+.1f}%"
                if is_mongolian else f"{throughput - THROUGHPUT_TARGET:+.1f}% vs target"
            ],
        },
        {
            "label": localize_report_label("plant_recovery", report_language),
            "value": f"{recovery:.1f}%", "status": recovery_status,
            "context": [
                f"Зорилттой харьцуулахад {recovery - RECOVERY_TARGET:+.1f}%"
                if is_mongolian else f"{recovery - RECOVERY_TARGET:+.1f}% vs target"
            ],
        },
        {
            "label": localize_report_label("safety", report_language),
            "value": f"{safety_score:.1f}%", "status": safety_status,
            "context": [
                f"Зорилттой харьцуулахад {safety_score - SAFETY_TARGET:+.1f}%"
                if is_mongolian else f"{safety_score - SAFETY_TARGET:+.1f}% vs target"
            ]
            + ([safety_glance_reason] if safety_glance_reason else []),
        },
    ]

    attention_items = []
    attention_area_codes = []
    if production < PRODUCTION_TARGET:
        attention_area_codes.append("production")
        attention_items.append({
            "area": localize_report_label("production", report_language), "level": "Medium",
            "result": f"Төлөвлөгөөний {production:.1f}%" if is_mongolian else f"{production:.1f}% of plan",
            "variance": f"{production - PRODUCTION_TARGET:+.1f}%",
            "trend": production_trend,
            "impact": (
                ("Тайлант хугацааны металлын гарцад нөлөөлж болзошгүй."
                 if is_sxew else "Тайлант хугацааны хүдрийн гарцад нөлөөлж болзошгүй.")
                if is_mongolian
                else ("Current-period metal delivery may be affected." if is_sxew else "Current-period ore delivery may be affected.")
            ),
            "action": (
                ("Уусгалт, SX болон EW-ийн боломжит хязгаарлалтыг хянаж, ирэх хугацааны үйлдвэрлэлийг сэргээх төлөвлөгөөг баталгаажуулна."
                 if is_sxew else "Үйлдвэрлэлийн боломжит хязгаарлалтыг хянаж, ирэх хугацааны сэргээх төлөвлөгөөг баталгаажуулна.")
                if is_mongolian
                else ("Review leach, SX and EW constraints and confirm the next-period recovery plan."
                      if is_sxew else "Review production constraints and confirm the next-period recovery plan.")
            ),
        })
    if throughput < THROUGHPUT_TARGET:
        attention_area_codes.append("plant_throughput")
        attention_items.append({
            "area": localize_report_label("plant_throughput", report_language), "level": "Medium",
            "result": f"Зорилтын {throughput:.1f}%" if is_mongolian else f"{throughput:.1f}% of target",
            "variance": f"{throughput - THROUGHPUT_TARGET:+.1f}%",
            "trend": throughput_trend,
            "impact": "Боловсруулалтын гүйцэтгэл үйлдвэрлэлийн гарцыг хязгаарлаж болзошгүй." if is_mongolian else "Processing performance may constrain production delivery.",
            "action": (
                ("Уусгалт, SX болон EW-ийн үе шатны нэвтрүүлэх чадварын боломжит хязгаарлалтыг хянана."
                 if is_sxew else "Нэвтрүүлэх чадварын боломжит хязгаарлалтыг боловсруулах үйлдвэрийн удирдлагатай хамтран хянана.")
                if is_mongolian
                else ("Review throughput constraints across leach, SX and EW operating stages." if is_sxew else "Review plant throughput constraints with processing leadership.")
            ),
        })
    if recovery < RECOVERY_TARGET:
        attention_area_codes.append("plant_recovery")
        attention_items.append({
            "area": localize_report_label("plant_recovery", report_language), "level": "Medium",
            "result": f"{recovery:.1f}%", "variance": f"{recovery - RECOVERY_TARGET:+.1f}%",
            "trend": recovery_trend,
            "impact": "Металл авалт одоогийн үйл ажиллагааны босгоос доогуур байна." if is_mongolian else "Metallurgical recovery remains below the current operating threshold.",
            "action": (
                ("Уусмалын химийн найрлага, хандлалт болон электролизийн металл авалтын боломжит хязгаарлалтыг хянана."
                 if is_sxew else "Металл авалтын боломжит хязгаарлалтыг боловсруулах үйлдвэрийн удирдлагатай хамтран хянана.")
                if is_mongolian
                else ("Review solution chemistry, extraction and electrowinning recovery constraints."
                      if is_sxew else "Review metallurgical recovery constraints with processing leadership.")
            ),
        })
    safety_exception = _monthly_safety_requires_attention(
        incidents, near_misses, critical_risks, safety_score
    )
    if safety_exception:
        attention_area_codes.append("safety")
        attention_items.append({
            "area": localize_report_label("safety", report_language),
            "level": "High" if incidents > 0 or critical_risks > 0 else "Medium",
            "result": f"{safety_score:.1f}%", "status": safety_status,
            "events": safety_reason or ("Бүртгэгдсэн үйл явдалгүй" if is_mongolian else "No reported events"),
            "safety": True,
            "impact": "Аюулгүй ажиллагааны эрсдэлд удирдлагын анхаарал шаардлагатай." if is_mongolian else "Safety exposure requires management attention.",
            "action": (
                _monthly_mn_safety_action(
                    incidents,
                    near_misses,
                    critical_risks,
                    safety_exception=safety_exception,
                )
                if is_mongolian
                else "Verify critical controls, investigate events and close corrective actions."
            ),
        })

    actions = [item["action"] for item in attention_items]
    condition = "stable" if health >= HEALTH_TARGET else "under pressure"
    below_target_names = [
        name
        for name, is_below_target in [
            ("Production", production < PRODUCTION_TARGET),
            ("Plant Throughput", throughput < THROUGHPUT_TARGET),
            ("Plant Recovery", recovery < RECOVERY_TARGET),
        ]
        if is_below_target
    ]
    if is_mongolian:
        executive_brief = _monthly_mn_executive_brief(
            attention_area_codes, health_status=health_status
        )
    else:
        executive_brief = f"Overall monthly operating condition remained {condition}."
        if below_target_names:
            verb = "remains" if len(below_target_names) == 1 else "remain"
            executive_brief += f" {_join_names(below_target_names)} {verb} below target"
            if safety_exception:
                executive_brief += ", while Safety requires management attention"
            else:
                executive_brief += "."
        elif safety_exception:
            executive_brief += " Safety requires management attention"
        else:
            executive_brief += " No material headline KPI exception requires escalation."

        if safety_exception:
            if critical_risks > 0:
                executive_brief += " due to recorded critical-risk exposure."
            else:
                executive_brief += " due to recorded safety exposure."
        elif below_target_names:
            executive_brief += " Safety remained on track across the reporting period."

    outlook_rows = [
        [
            localize_report_label("production", report_language),
            ("Гүйцэтгэлийг төлөвлөгөөний түвшинд хадгалах" if production_status != "Watch" else "Гүйцэтгэлийг төлөвлөгөөнд хүргэх")
            if is_mongolian else ("Sustain performance against plan" if production_status != "Watch" else "Restore performance toward plan"),
        ],
        [
            localize_report_label("plant_throughput", report_language),
            ("Боловсруулалтын гүйцэтгэлийг хадгалах" if throughput_status != "Watch" else "Боловсруулалтын гүйцэтгэлийг сэргээх")
            if is_mongolian else ("Sustain processing performance" if throughput_status != "Watch" else "Recover processing performance"),
        ],
        [
            localize_report_label("plant_recovery", report_language),
            ("Металл авалтыг босгоос дээгүүр хадгалах" if recovery_status != "Watch" else "Металл авалтыг босгоос дээгүүр сэргээх")
            if is_mongolian else ("Maintain recovery above threshold" if recovery_status != "Watch" else "Restore recovery above threshold"),
        ],
        [
            localize_report_label("safety", report_language),
            _monthly_mn_safety_outlook(safety_exception, critical_risks)
            if is_mongolian
            else (
                "Maintain current controls"
                if not safety_exception
                else (
                    "Close critical-risk actions and verify controls"
                    if critical_risks > 0
                    else "Close safety actions and verify controls"
                )
            ),
        ],
    ]
    kpi_rows = [
        [production_label, f"{PRODUCTION_TARGET:.0f}%", f"{production:.1f}%", f"{production - PRODUCTION_TARGET:+.1f}%", production_status],
        [localize_report_label("plant_throughput", report_language), f"{THROUGHPUT_TARGET:.0f}%", f"{throughput:.1f}%", f"{throughput - THROUGHPUT_TARGET:+.1f}%", throughput_status],
        [localize_report_label("plant_recovery", report_language), f"{RECOVERY_TARGET:.0f}%", f"{recovery:.1f}%", f"{recovery - RECOVERY_TARGET:+.1f}%", recovery_status],
        [localize_report_label("safety_score", report_language), f"{SAFETY_TARGET:.0f}%", f"{safety_score:.1f}%", f"{safety_score - SAFETY_TARGET:+.1f}%", safety_status],
    ]
    operating_statuses = [
        {"area": localize_report_label("production", report_language), "status": production_status},
        {"area": localize_report_label("throughput", report_language), "status": throughput_status},
        {"area": localize_report_label("recovery", report_language), "status": recovery_status},
        {"area": localize_report_label("safety", report_language), "status": safety_status},
    ]

    story = [
        _report_header(mine_name, period_start, period_end, generated_at, styles, report_language),
        _monthly_health(health, health_status, styles, report_language),
        _performance_glance(glance_cards, styles, report_language),
        _performance_trends([
            {"metric": production_label, "labels": labels, "values": production_values, "target": PRODUCTION_TARGET},
            {"metric": localize_report_label("throughput", report_language) if is_mongolian else "Plant Throughput", "labels": labels, "values": throughput_values, "target": THROUGHPUT_TARGET},
            {"metric": localize_report_label("plant_recovery", report_language), "labels": labels, "values": recovery_values, "target": RECOVERY_TARGET},
        ], styles, report_language),
        _management_attention(attention_items, styles, report_language),
        PageBreak(),
    ]
    story.extend(_continuation_header(mine_name, period_start, period_end, styles, report_language))
    story.append(_executive_brief(executive_brief, styles, report_language))
    story.extend(_strategic_actions(actions, styles, report_language))
    story.extend([
        _simple_table_section(
            localize_report_label("next_month_outlook", report_language),
            [localize_report_label("area", report_language).upper(), localize_report_label("outlook_focus", report_language).upper()],
            outlook_rows, [45 * mm, 114 * mm], styles,
            row_padding=7.5, spacing_after=16, language=report_language,
        ),
        _simple_table_section(
            localize_report_label("monthly_kpi_detail", report_language),
            [
                "KPI",
                localize_report_label("target", report_language).upper(),
                localize_report_label("actual", report_language).upper(),
                localize_report_label("variance", report_language).upper(),
                localize_report_label("status", report_language).upper(),
            ],
            kpi_rows, [47 * mm, 24 * mm, 24 * mm, 29 * mm, 35 * mm], styles,
            status_column=4, row_padding=7, spacing_after=18, language=report_language,
        ),
        _operating_status(operating_statuses, styles, report_language),
    ])
    return build_pdf(story=story, report_name=report_name, language=report_language)
