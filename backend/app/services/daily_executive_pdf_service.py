from datetime import datetime
from html import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
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


def _safe(value) -> str:
    return escape(str(value or ""))


def _display_date(value, language: str = "en") -> str:
    raw = str(value or "").strip()

    try:
        parsed = datetime.fromisoformat(raw)
        return format_report_date(parsed, language, "full_report_date")
    except ValueError:
        return raw or (
            "Тодорхойгүй"
            if normalize_report_language(language) == "mn"
            else "Not available"
        )


def _status_palette(status: str):
    normalized = str(status or "").strip().lower()

    if normalized in {"stable", "healthy", "on track"}:
        return PRIMARY_COLOR, GREEN_TINT
    if normalized in {"watch", "attention", "medium"}:
        return AMBER_COLOR, AMBER_TINT
    if normalized in {"critical", "high", "overdue"}:
        return RED_COLOR, RED_TINT

    return MUTED_TEXT_COLOR, NEUTRAL_TINT


def _count_phrase(
    count: int,
    singular: str,
    plural: str | None = None,
    *,
    language: str = "en",
    mongolian_label: str | None = None,
) -> str:
    return pluralize_report_count(
        count,
        language=language,
        singular=singular,
        plural=plural,
        mongolian_label=mongolian_label,
    )


def _event_phrase(
    count: int,
    event_type: str,
    language: str = "en",
) -> str:
    normalized_language = normalize_report_language(language)
    labels = {
        "incident": {
            "en": ("incident", "incidents"),
            "mn": "осол",
            "mn_none": "осол бүртгэгдээгүй",
        },
        "near_miss": {
            "en": ("near miss", "near misses"),
            "mn": "осолд дөхсөн тохиолдол",
            "mn_none": "осолд дөхсөн тохиолдол бүртгэгдээгүй",
        },
        "critical_risk": {
            "en": ("critical risk", "critical risks"),
            "mn": "ноцтой эрсдэл",
            "mn_none": "ноцтой эрсдэл бүртгэгдээгүй",
        },
    }
    event_labels = labels[event_type]

    if normalized_language == "mn":
        if count == 0:
            return event_labels["mn_none"]
        return f"{count} {event_labels['mn']}"

    singular, plural = event_labels["en"]
    noun = singular if count == 1 else (plural or f"{singular}s")

    if count == 0:
        return f"no {noun}"

    return f"{count} {noun}"


def _daily_styles(language: str = "en"):
    base = get_report_styles()
    fonts = ensure_report_pdf_fonts(language)
    regular_font = fonts["regular"]
    bold_font = fonts["bold"]
    is_mongolian = normalize_report_language(language) == "mn"

    return {
        "brand": ParagraphStyle(
            "DailyV2Brand",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=9.5,
            leading=12,
            textColor=PRIMARY_COLOR,
        ),
        "report_title": ParagraphStyle(
            "DailyV2ReportTitle",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=11,
            leading=13,
            textColor=NAVY,
            alignment=TA_RIGHT,
        ),
        "mine": ParagraphStyle(
            "DailyV2Mine",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=16,
            leading=19,
            textColor=NAVY,
        ),
        "meta": ParagraphStyle(
            "DailyV2Meta",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=8,
            leading=10,
            textColor=MUTED_TEXT_COLOR,
        ),
        "meta_right": ParagraphStyle(
            "DailyV2MetaRight",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=8,
            leading=10,
            textColor=MUTED_TEXT_COLOR,
            alignment=TA_RIGHT,
        ),
        "section": ParagraphStyle(
            "DailyV2Section",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=10.5,
            leading=13,
            textColor=NAVY,
        ),
        "section_count": ParagraphStyle(
            "DailyV2SectionCount",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=7,
            leading=9,
            textColor=MUTED_TEXT_COLOR,
            alignment=TA_RIGHT,
        ),
        "health_label": ParagraphStyle(
            "DailyV2HealthLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=8,
            leading=10,
            textColor=MUTED_TEXT_COLOR,
        ),
        "health_context": ParagraphStyle(
            "DailyV2HealthContext",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=8.5,
            leading=11,
            textColor=TEXT_COLOR,
        ),
        "health_value": ParagraphStyle(
            "DailyV2HealthValue",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=29,
            leading=31,
            textColor=NAVY,
            alignment=TA_CENTER,
        ),
        "card_label": ParagraphStyle(
            "DailyV2CardLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=7.2,
            leading=9,
            textColor=MUTED_TEXT_COLOR,
            alignment=TA_CENTER,
        ),
        "card_value": ParagraphStyle(
            "DailyV2CardValue",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=22,
            leading=25,
            textColor=NAVY,
            alignment=TA_CENTER,
        ),
        "card_context": ParagraphStyle(
            "DailyV2CardContext",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=7.6,
            leading=10,
            textColor=TEXT_COLOR,
            alignment=TA_CENTER,
        ),
        "body": ParagraphStyle(
            "DailyV2Body",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=8.6,
            leading=12,
            textColor=TEXT_COLOR,
        ),
        "body_small": ParagraphStyle(
            "DailyV2BodySmall",
            parent=base["Normal"],
            fontName=regular_font,
            fontSize=8,
            leading=10.5,
            textColor=TEXT_COLOR,
        ),
        "micro_label": ParagraphStyle(
            "DailyV2MicroLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=6.4,
            leading=8,
            textColor=MUTED_TEXT_COLOR,
        ),
        "attention_impact_label": ParagraphStyle(
            "DailyV2AttentionImpactLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(8.3 if is_mongolian else 6.7),
            leading=(10 if is_mongolian else 8),
            textColor=NAVY,
        ),
        "attention_action_label": ParagraphStyle(
            "DailyV2AttentionActionLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=(8.3 if is_mongolian else 6.7),
            leading=(10 if is_mongolian else 8),
            textColor=(PRIMARY_COLOR if is_mongolian else NAVY),
        ),
        "attention_title": ParagraphStyle(
            "DailyV2AttentionTitle",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=8.8,
            leading=11,
            textColor=NAVY,
        ),
        "issue_value": ParagraphStyle(
            "DailyV2IssueValue",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=8.2,
            leading=10,
            textColor=NAVY,
            alignment=TA_RIGHT,
        ),
        "number": ParagraphStyle(
            "DailyV2Number",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=8.2,
            leading=11,
            textColor=PRIMARY_COLOR,
            alignment=TA_CENTER,
        ),
        "status_label": ParagraphStyle(
            "DailyV2StatusLabel",
            parent=base["Normal"],
            fontName=bold_font,
            fontSize=7,
            leading=9,
            textColor=MUTED_TEXT_COLOR,
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


def _report_header(
    *,
    mine_name: str,
    report_period: str,
    generated_at: datetime,
    styles,
    language: str = "en",
):
    report_language = normalize_report_language(language)
    top = Table(
        [[
            Paragraph(
                "Mine Manager AI" if report_language == "mn" else "MINE MANAGER AI",
                styles["brand"],
            ),
            Paragraph(
                _safe(localize_report_label("daily_report", report_language).upper()),
                styles["report_title"],
            ),
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
                    (
                        f"{_safe(localize_report_label('reporting_period', report_language))}: "
                        f"<b>{_safe(_display_date(report_period, report_language))}</b>"
                    ),
                    styles["meta"],
                ),
                Paragraph(
                    (
                        f"{_safe(localize_report_label('generated', report_language))}: "
                        f"<b>{_safe(format_report_date(generated_at, report_language, 'generated_timestamp'))}</b>"
                    ),
                    styles["meta_right"],
                ),
            ],
        ],
        colWidths=[95 * mm, 64 * mm],
    )
    metadata.setStyle(TableStyle([
        ("SPAN", (0, 0), (1, 0)),
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))

    return KeepTogether([top, Spacer(1, 6), metadata, Spacer(1, 8)])


def _status_badge(
    status: str,
    styles,
    name: str,
    language: str = "en",
):
    color, background = _status_palette(status)
    style = ParagraphStyle(
        name,
        parent=styles["section_count"],
        textColor=color,
        alignment=TA_CENTER,
    )
    badge = Table(
        [[Paragraph(
            _safe(localize_report_label(status, language).upper()),
            style,
        )]],
        colWidths=[25 * mm],
    )
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.45, color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return badge


def _mine_health_headline(
    value: float,
    status: str,
    styles,
    language: str = "en",
):
    _, background = _status_palette(status)
    content = Table(
        [[
            [
                Paragraph(
                    _safe(localize_report_label("mine_health", language).upper()),
                    styles["health_label"],
                ),
                Spacer(1, 2),
                Paragraph(
                    _safe(localize_report_label("overall_operating_condition", language)),
                    styles["health_context"],
                ),
            ],
            Paragraph(f"{value:.1f}", styles["health_value"]),
            _status_badge(
                status,
                styles,
                "DailyV2HealthStatus",
                language,
            ),
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
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return KeepTogether([content, Spacer(1, 8)])


def _glance_card(card, styles, index: int, language: str = "en"):
    status_color, _ = _status_palette(card["status"])
    status_style = ParagraphStyle(
        f"DailyV2GlanceStatus{index}",
        parent=styles["card_label"],
        textColor=status_color,
    )
    content = [
        Paragraph(_safe(card["label"].upper()), styles["card_label"]),
        Spacer(1, 3),
        Paragraph(_safe(card["value"]), styles["card_value"]),
        Spacer(1, 1),
        Paragraph(
            _safe(localize_report_label(card["status"], language).upper()),
            status_style,
        ),
        Spacer(1, 5),
    ]
    content.extend(
        Paragraph(_safe(line), styles["card_context"])
        for line in card["context"]
    )
    return content


def _today_at_a_glance(cards, styles, language: str = "en"):
    cells = [
        _glance_card(card, styles, index, language)
        for index, card in enumerate(cards)
    ]
    table = Table([cells], colWidths=[53 * mm] * 3)
    commands = [
        ("BOX", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]

    for index, card in enumerate(cards):
        _, background = _status_palette(card["status"])
        commands.append(("BACKGROUND", (index, 0), (index, 0), background))

    table.setStyle(TableStyle(commands))
    return KeepTogether([
        _section_heading(
            localize_report_label("today_at_a_glance", language),
            styles,
        ),
        Spacer(1, 5),
        table,
        Spacer(1, 8),
    ])


def _attention_item(item, styles, index: int, language: str = "en"):
    level_color, level_background = _status_palette(item["level"])
    level_style = ParagraphStyle(
        f"DailyV2RiskLevel{index}",
        parent=styles["section_count"],
        textColor=level_color,
    )
    header = Table(
        [[
            Paragraph(
                f"{index:02d}&nbsp;&nbsp; {_safe(item['area'].upper())}",
                styles["attention_title"],
            ),
            Paragraph(
                _safe(localize_report_label(item["level"], language).upper()),
                level_style,
            ),
        ]],
        colWidths=[132 * mm, 16 * mm],
    )
    header.setStyle(TableStyle([
        ("BACKGROUND", (1, 0), (1, 0), level_background),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))

    issue = Table(
        [[
            Paragraph(f"<b>{_safe(item['issue_label'])}</b>", styles["body"]),
            Paragraph(_safe(item["issue_value"].upper()), styles["issue_value"]),
        ]],
        colWidths=[103 * mm, 45 * mm],
    )
    issue.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    content = [header, Spacer(1, 3), issue]

    for detail in item.get("details", []):
        content.append(Paragraph(_safe(detail), styles["body_small"]))

    if normalize_report_language(language) == "mn":
        content.extend([
            Spacer(1, 5),
            Paragraph(
                _safe(localize_report_label("impact", language).upper()),
                styles["attention_impact_label"],
            ),
            Spacer(1, 1.5),
            Paragraph(_safe(item["impact"]), styles["body_small"]),
            Spacer(1, 5.5),
            Paragraph(
                _safe(localize_report_label("action", language).upper()),
                styles["attention_action_label"],
            ),
            Spacer(1, 1.5),
            Paragraph(_safe(item["action"]), styles["body_small"]),
        ])
    else:
        content.extend([
            Spacer(1, 4),
            Paragraph(
                _safe(localize_report_label("impact", language).upper()),
                styles["attention_impact_label"],
            ),
            Paragraph(_safe(item["impact"]), styles["body_small"]),
            Spacer(1, 3),
            Paragraph(
                _safe(localize_report_label("action", language).upper()),
                styles["attention_action_label"],
            ),
            Paragraph(_safe(item["action"]), styles["body_small"]),
        ])
    return content


def _management_attention(items, styles, language: str = "en"):
    is_mongolian = normalize_report_language(language) == "mn"
    item_vertical_padding = 3 if is_mongolian else 6
    rows = [[_section_heading(
        localize_report_label("management_attention", language),
        styles,
        _count_phrase(
            len(items),
            "item",
            language=language,
            mongolian_label="асуудал",
        ),
    )]]

    if not items:
        rows.append([Paragraph(
            (
                "Удирдлагын анхаарал шаардах үйл ажиллагааны зөрүү одоогоор алга."
                if normalize_report_language(language) == "mn"
                else "No current operational exception requires management attention."
            ),
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
        ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ("LEFTPADDING", (0, 1), (-1, -1), 9),
        ("RIGHTPADDING", (0, 1), (-1, -1), 9),
        ("TOPPADDING", (0, 1), (-1, -1), item_vertical_padding),
        ("BOTTOMPADDING", (0, 1), (-1, -1), item_vertical_padding),
    ]))
    return [table, Spacer(1, 8)]


def _executive_brief(text: str, styles, language: str = "en"):
    content = Table(
        [[Paragraph(_safe(text), styles["body"])]],
        colWidths=[159 * mm],
    )
    content.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BACKGROUND),
        ("BOX", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return KeepTogether([
        _section_heading(
            localize_report_label("executive_brief", language),
            styles,
        ),
        Spacer(1, 5),
        content,
        Spacer(1, 8),
    ])


def _todays_actions(actions, styles, language: str = "en"):
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
                (
                    "Өнөөдөр зөрүүтэй холбоотой удирдлагын арга хэмжээ шаардлагагүй."
                    if normalize_report_language(language) == "mn"
                    else "No exception-specific management actions are required today."
                ),
                styles["body"],
            ),
        ])

    table = Table(
        rows,
        colWidths=[13 * mm, 146 * mm],
        splitByRow=1,
    )
    table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return [
        _section_heading(
            localize_report_label("todays_actions", language),
            styles,
            _count_phrase(
                len(actions),
                "action",
                language=language,
                mongolian_label="арга хэмжээ",
            ),
        ),
        Spacer(1, 5),
        table,
        Spacer(1, 8),
    ]


def _operation_status_strip(statuses, styles, language: str = "en"):
    cells = [Paragraph(
        _safe(localize_report_label("operation_status", language).upper()),
        styles["status_label"],
    )]

    for index, item in enumerate(statuses):
        color, background = _status_palette(item["status"])
        style = ParagraphStyle(
            f"DailyV2StripStatus{index}",
            parent=styles["status_label"],
            textColor=color,
            alignment=TA_CENTER,
        )
        cells.append([
            Paragraph(_safe(item["area"]), styles["card_context"]),
            Paragraph(
                _safe(localize_report_label(item["status"], language).upper()),
                style,
            ),
        ])

    table = Table(
        [cells],
        colWidths=[42 * mm, 39 * mm, 39 * mm, 39 * mm],
    )
    commands = [
        ("BACKGROUND", (0, 0), (0, 0), NEUTRAL_TINT),
        ("BOX", (0, 0), (-1, -1), 0.55, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 9),
        ("RIGHTPADDING", (0, 0), (0, 0), 7),
        ("LEFTPADDING", (1, 0), (-1, -1), 5),
        ("RIGHTPADDING", (1, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]

    for index, item in enumerate(statuses, start=1):
        _, background = _status_palette(item["status"])
        commands.append(("BACKGROUND", (index, 0), (index, 0), background))

    table.setStyle(TableStyle(commands))
    return KeepTogether([table])


def _daily_executive_brief(
    attention_names,
    *,
    safety_status: str,
    incidents: int,
    near_misses: int,
    critical_risks: int,
    language: str = "en",
) -> str:
    report_language = normalize_report_language(language)

    if report_language == "en":
        if attention_names:
            if len(attention_names) == 1:
                focus = attention_names[0]
                brief = f"{focus} requires management attention today."
            else:
                focus = ", ".join(attention_names[:-1]) + f" and {attention_names[-1]}"
                brief = f"{focus} require management attention today."
        else:
            brief = "No current operational exception requires management attention today."

        safety_sentence = (
            "Safety remains stable with no reported incidents or critical risks."
            if safety_status == "Stable"
            else (
                f"Latest safety data records {_event_phrase(incidents, 'incident')}, "
                f"{_event_phrase(near_misses, 'near_miss')} and "
                f"{_event_phrase(critical_risks, 'critical_risk')}."
            )
        )
        return f"{brief} {safety_sentence}"

    if attention_names:
        attention_phrases = {
            "Техникийн Парк": (
                "техникийн паркийн гүйцэтгэл",
                "техникийн паркийн гүйцэтгэлд",
            ),
            "Үйлдвэрлэл": ("үйлдвэрлэл", "үйлдвэрлэлд"),
            "Боловсруулах Үйлдвэр": (
                "боловсруулах үйлдвэрийн гүйцэтгэл",
                "боловсруулах үйлдвэрийн гүйцэтгэлд",
            ),
            "Аюулгүй Ажиллагаа": (
                "аюулгүй ажиллагаа",
                "аюулгүй ажиллагаанд",
            ),
        }

        def focus_phrase(name: str, *, dative: bool = False) -> str:
            known_phrase = attention_phrases.get(name)
            if known_phrase:
                return known_phrase[1 if dative else 0]
            normalized_name = str(name or "").strip()
            normalized_name = normalized_name[:1].lower() + normalized_name[1:]
            return f"{normalized_name} чиглэлд" if dative else normalized_name

        if len(attention_names) == 1:
            focus = focus_phrase(attention_names[0], dative=True)
        else:
            leading_names = [
                focus_phrase(name)
                for name in attention_names[:-1]
            ]
            focus = ", ".join(leading_names) + (
                f" болон {focus_phrase(attention_names[-1], dative=True)}"
            )
        brief = f"Өнөөдөр {focus} удирдлагын анхаарал шаардлагатай байна."
    else:
        brief = "Өнөөдөр удирдлагын анхаарал шаардах үйл ажиллагааны зөрүү алга."

    safety_sentence = (
        "Аюулгүй ажиллагаа тогтвортой бөгөөд осол болон ноцтой эрсдэл бүртгэгдээгүй."
        if safety_status == "Stable"
        else (
            "Аюулгүй ажиллагааны сүүлийн мэдээлэлд "
            f"{_event_phrase(incidents, 'incident', report_language)}, "
            f"{_event_phrase(near_misses, 'near_miss', report_language)} болон "
            f"{_event_phrase(critical_risks, 'critical_risk', report_language)} байна."
        )
    )
    return f"{brief} {safety_sentence}"


def generate_daily_executive_pdf(
    live_kpis: dict,
    language: str = "en",
):
    """Generate the localized customer-facing Daily Executive Report UX V2."""

    report_language = normalize_report_language(language)
    is_mongolian = report_language == "mn"
    ensure_report_pdf_fonts(report_language)

    report_name = get_report_display_name("daily_pdf", report_language)
    generated_at = datetime.now()
    styles = _daily_styles(report_language)

    mine_name = resolve_customer_display_identity(
        live_kpis,
        report_language,
    ).operation_name
    operation_profile = str(
        live_kpis.get("operation_profile") or "standard_mine"
    ).strip().lower()
    is_sxew = operation_profile == "sxew_copper"
    fleet_applicable = bool(live_kpis.get("fleet_applicable", not is_sxew))
    source_production_label = str(
        live_kpis.get("production_label")
        or ("Cathode Production" if is_sxew else "Ore Production")
    )
    known_production_labels = {
        "cathode production": "cathode_production",
        "ore production": "ore_production",
    }
    production_label_key = known_production_labels.get(
        source_production_label.strip().lower()
    )
    production_label = (
        localize_report_label(production_label_key, report_language)
        if production_label_key
        else source_production_label
    )
    if operation_profile == "coal_surface_v1":
        production_label = "ROM нүүрсний олборлолт" if is_mongolian else "ROM Coal Production"
    report_period = str(live_kpis.get("report_date") or generated_at.date())

    health = float(live_kpis.get("health") or 0)
    production = float(live_kpis.get("ore") or 0)
    fleet = float(live_kpis.get("fleet") or 0)
    availability = float(live_kpis.get("availability") or 0)
    utilization = float(live_kpis.get("utilization") or 0)
    plant = float(live_kpis.get("plant") or 0)
    throughput = float(live_kpis.get("throughput") or 0)
    recovery = float(live_kpis.get("recovery") or 0)
    incidents = int(live_kpis.get("safety") or 0)
    safety_score = float(live_kpis.get("safety_score") or 0)
    near_misses = int(live_kpis.get("near_misses") or 0)
    critical_risks = int(live_kpis.get("critical_risks") or 0)

    health_status = "Stable" if health >= 85 else "Watch" if health >= 75 else "Critical"
    production_status = "Stable" if production >= 100 else "Watch"
    fleet_status = "Stable" if fleet >= 90 else "Watch"
    plant_status = "Stable" if plant >= 95 else "Watch"
    safety_status = (
        "Stable"
        if incidents == 0 and critical_risks == 0 and safety_score >= 95
        else "Watch"
    )

    attention_items = []

    if fleet_applicable and fleet < 90:
        attention_items.append({
            "area": localize_report_label("fleet", report_language),
            "level": "Medium",
            "issue_label": localize_report_label("fleet_performance", report_language),
            "issue_value": f"{fleet:.1f}%",
            "details": [
                f"{localize_report_label('availability', report_language)} {availability:.1f}%",
                f"{localize_report_label('utilization', report_language)} {utilization:.1f}%",
            ],
            "impact": (
                "Техникийн паркийн үр ашиг буурах нь үйлдвэрлэлийн гүйцэтгэлийг "
                "хязгаарлаж болзошгүй."
                if is_mongolian
                else "Lower fleet effectiveness may constrain production delivery."
            ),
            "action": (
                "Бэлэн байдал, ашиглалт, саатал болон засвар үйлчилгээний эрэмбийг хянана."
                if is_mongolian
                else "Review availability, utilization, delays, and maintenance priorities."
            ),
            "today_action": (
                "Техникийн паркийн бэлэн байдал, ашиглалт, саатал болон засвар "
                "үйлчилгээний эрэмбийг хянана."
                if is_mongolian
                else "Review fleet availability, utilization, delays, and maintenance priorities."
            ),
        })

    if production < 100:
        attention_items.append({
            "area": localize_report_label("production", report_language),
            "level": "Medium",
            "issue_label": production_label,
            "issue_value": (
                f"Төлөвлөгөөний {production:.1f}%"
                if is_mongolian
                else f"{production:.1f}% of plan"
            ),
            "details": [],
            "impact": (
                (
                    "Төлөвлөгөөнөөс доогуур катодын үйлдвэрлэл нь өдрийн металлын "
                    "гарцад нөлөөлж болзошгүй."
                    if is_sxew
                    else (
                        "Төлөвлөгөөнөөс доогуур хүдрийн хөдөлгөөн нь өдрийн "
                        "үйлдвэрлэлийн гүйцэтгэлд нөлөөлж болзошгүй."
                    )
                )
                if is_mongolian
                else (
                    "Below-plan cathode production may affect daily metal delivery."
                    if is_sxew
                    else "Below-plan ore movement may affect daily production delivery."
                )
            ),
            "action": (
                (
                    "Үйлдвэрлэлийг сэргээх төлөвлөгөөг баталгаажуулж, уусгалт, SX "
                    "болон EW-ийн хязгаарлалтыг хянана."
                    if is_sxew
                    else (
                        "Үйлдвэрлэлийн хязгаарлалтыг хянаж, сэргээх төлөвлөгөөг "
                        "баталгаажуулна."
                    )
                )
                if is_mongolian
                else (
                    "Confirm the production recovery plan and review leach, SX and EW constraints."
                    if is_sxew
                    else "Review production constraints and confirm the recovery plan."
                )
            ),
            "today_action": (
                (
                    "Үйлдвэрлэлийг сэргээх төлөвлөгөөг баталгаажуулж, уусгалт, SX "
                    "болон EW-ийн хязгаарлалтыг хянана."
                    if is_sxew
                    else (
                        "Үйлдвэрлэлийг сэргээх төлөвлөгөөг баталгаажуулж, "
                        "үйлдвэрлэлийн хязгаарлалтыг хянана."
                    )
                )
                if is_mongolian
                else (
                    "Confirm the production recovery plan; review leach, SX and EW constraints."
                    if is_sxew
                    else "Confirm the production recovery plan and review production constraints."
                )
            ),
        })

    if plant < 95:
        attention_items.append({
            "area": localize_report_label("plant", report_language),
            "level": "Medium",
            "issue_label": localize_report_label("plant_performance", report_language),
            "issue_value": f"{plant:.1f}%",
            "details": [
                f"{localize_report_label('throughput', report_language)} {throughput:.1f}%",
                f"{localize_report_label('recovery', report_language)} {recovery:.1f}%",
            ],
            "impact": (
                "Боловсруулах үйлдвэрийн хязгаарлалт нь боловсруулалтын гүйцэтгэлийг "
                "бууруулж болзошгүй."
                if is_mongolian
                else "Plant constraints may reduce processing performance."
            ),
            "action": (
                "Нэвтрүүлэх чадвар болон металл авалтын хязгаарлалтыг боловсруулах "
                "үйлдвэрийн багтай хамтран хянана."
                if is_mongolian
                else "Review throughput and recovery constraints with the processing team."
            ),
            "today_action": (
                "Боловсруулах үйлдвэрийн нэвтрүүлэх чадвар болон металл авалтын "
                "хязгаарлалтыг хянана."
                if is_mongolian
                else "Review plant throughput and recovery constraints."
            ),
        })

    if incidents > 0 or critical_risks > 0 or safety_score < 95:
        attention_items.append({
            "area": localize_report_label("safety", report_language),
            "level": "High" if incidents > 0 or critical_risks > 0 else "Medium",
            "issue_label": localize_report_label("safety_exposure", report_language),
            "issue_value": (
                f"{safety_score:.1f}% үнэлгээ"
                if is_mongolian
                else f"{safety_score:.1f}% score"
            ),
            "details": [
                " | ".join([
                    _event_phrase(incidents, "incident", report_language),
                    _event_phrase(near_misses, "near_miss", report_language),
                    _event_phrase(critical_risks, "critical_risk", report_language),
                ])
            ],
            "impact": (
                (
                    "Сүүлийн мэдээлэлд "
                    f"{_event_phrase(incidents, 'incident', report_language)}, "
                    f"{_event_phrase(near_misses, 'near_miss', report_language)} болон "
                    f"{_event_phrase(critical_risks, 'critical_risk', report_language)} байна."
                )
                if is_mongolian
                else (
                    f"The latest data records {_event_phrase(incidents, 'incident')}, "
                    f"{_event_phrase(near_misses, 'near_miss')} and "
                    f"{_event_phrase(critical_risks, 'critical_risk')}."
                )
            ),
            "action": (
                "Ноцтой эрсдэлийн хяналтыг баталгаажуулж, шаардлагатай аюулгүй "
                "ажиллагааны арга хэмжээг хаана."
                if is_mongolian
                else "Verify critical controls and close required safety actions."
            ),
            "today_action": (
                "Ноцтой эрсдэлийн хяналтыг баталгаажуулж, шаардлагатай аюулгүй "
                "ажиллагааны арга хэмжээг хаана."
                if is_mongolian
                else "Verify critical controls and close required safety actions."
            ),
        })

    actions = [item["today_action"] for item in attention_items]

    attention_names = [item["area"] for item in attention_items]
    brief = _daily_executive_brief(
        attention_names,
        safety_status=safety_status,
        incidents=incidents,
        near_misses=near_misses,
        critical_risks=critical_risks,
        language=report_language,
    )
    if operation_profile == "coal_surface_v1" and live_kpis.get("coal_quality"):
        quality = live_kpis["coal_quality"]
        measurements = []
        if quality.get("ash") is not None:
            measurements.append(
                (f"үнслэг {quality['ash']:.1f}%" if is_mongolian
                 else f"ash {quality['ash']:.1f}%")
            )
        if quality.get("moisture") is not None:
            measurements.append(
                (f"чийглэг {quality['moisture']:.1f}%" if is_mongolian
                 else f"moisture {quality['moisture']:.1f}%")
            )
        if quality.get("calorific_value") is not None:
            measurements.append(
                (f"илчлэг {quality['calorific_value']:.0f} kcal/kg" if is_mongolian
                 else f"calorific value {quality['calorific_value']:.0f} kcal/kg")
            )
        if measurements:
            label = " Нүүрсний чанарын үзүүлэлтүүд: " if is_mongolian else " Available coal quality measurements: "
            brief += label + ", ".join(measurements) + "."

    production_context = (
        (
            f"Төлөвлөгөөнөөс {100 - production:.1f}% доогуур"
            if is_mongolian
            else f"{100 - production:.1f}% below plan"
        )
        if production < 100
        else (
            "Төлөвлөгөөнд хүрсэн буюу давсан"
            if is_mongolian
            else "At or above plan"
        )
    )
    glance_cards = [
        {
            "label": localize_report_label("production", report_language),
            "value": f"{production:.1f}%",
            "status": production_status,
            "context": [production_context],
        },
        {
            "label": localize_report_label("plant", report_language),
            "value": f"{plant:.1f}%",
            "status": plant_status,
            "context": [
                f"{localize_report_label('throughput', report_language)} {throughput:.1f}%",
                f"{localize_report_label('recovery', report_language)} {recovery:.1f}%",
            ],
        },
        {
            "label": localize_report_label("safety", report_language),
            "value": f"{safety_score:.1f}%",
            "status": safety_status,
            "context": [
                _event_phrase(incidents, "incident", report_language),
                _event_phrase(near_misses, "near_miss", report_language),
                _event_phrase(critical_risks, "critical_risk", report_language),
            ],
        },
    ]

    operation_statuses = [
        {
            "area": localize_report_label("production", report_language),
            "status": production_status,
        },
        {
            "area": localize_report_label("plant", report_language),
            "status": plant_status,
        },
        {
            "area": localize_report_label("safety", report_language),
            "status": safety_status,
        },
    ]

    story = [
        _report_header(
            mine_name=mine_name,
            report_period=report_period,
            generated_at=generated_at,
            styles=styles,
            language=report_language,
        ),
        _mine_health_headline(health, health_status, styles, report_language),
        _today_at_a_glance(glance_cards, styles, report_language),
    ]
    story.extend(_management_attention(attention_items, styles, report_language))
    story.append(_executive_brief(brief, styles, report_language))
    story.extend(_todays_actions(actions, styles, report_language))
    story.append(_operation_status_strip(operation_statuses, styles, report_language))

    return build_pdf(
        story=story,
        report_name=report_name,
        language=report_language,
    )
