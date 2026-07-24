from datetime import datetime
from io import BytesIO
from typing import List, Optional, Sequence

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


# -------------------------------------------------------------------
# Brand configuration
# -------------------------------------------------------------------

BRAND_NAME = "Mine Manager AI"

PRIMARY_COLOR = colors.HexColor("#16A34A")
PRIMARY_DARK_COLOR = colors.HexColor("#15803D")
SECONDARY_COLOR = colors.HexColor("#1E293B")

BLUE_COLOR = colors.HexColor("#2563EB")
AMBER_COLOR = colors.HexColor("#D97706")
RED_COLOR = colors.HexColor("#DC2626")

TEXT_COLOR = colors.HexColor("#0F172A")
MUTED_TEXT_COLOR = colors.HexColor("#64748B")

LIGHT_BACKGROUND = colors.HexColor("#F8FAFC")
BORDER_COLOR = colors.HexColor("#CBD5E1")
WHITE_COLOR = colors.white


# -------------------------------------------------------------------
# Shared PDF styles
# -------------------------------------------------------------------

def get_report_styles():
    """
    Return the standard paragraph styles used by all executive reports.
    """

    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="ReportBrand",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=PRIMARY_COLOR,
            alignment=TA_LEFT,
            spaceAfter=4,
        )
    )

    styles.add(
        ParagraphStyle(
            name="ReportTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=23,
            leading=28,
            textColor=TEXT_COLOR,
            alignment=TA_LEFT,
            spaceAfter=6,
        )
    )

    styles.add(
        ParagraphStyle(
            name="ReportSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=MUTED_TEXT_COLOR,
            alignment=TA_LEFT,
            spaceAfter=3,
        )
    )

    styles.add(
        ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=TEXT_COLOR,
            spaceBefore=6,
            spaceAfter=9,
        )
    )

    styles.add(
        ParagraphStyle(
            name="BodyTextExecutive",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=TEXT_COLOR,
            spaceAfter=6,
        )
    )

    styles.add(
        ParagraphStyle(
            name="BulletTextExecutive",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=TEXT_COLOR,
            leftIndent=12,
            firstLineIndent=-8,
            bulletIndent=0,
            spaceAfter=5,
        )
    )

    styles.add(
        ParagraphStyle(
            name="CalloutValue",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=PRIMARY_COLOR,
            alignment=TA_CENTER,
        )
    )

    styles.add(
        ParagraphStyle(
            name="CalloutLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=MUTED_TEXT_COLOR,
            alignment=TA_CENTER,
        )
    )

    styles.add(
        ParagraphStyle(
            name="FooterText",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9,
            textColor=MUTED_TEXT_COLOR,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="FooterPageNumber",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9,
            textColor=MUTED_TEXT_COLOR,
            alignment=TA_RIGHT,
        )
    )

    return styles


# -------------------------------------------------------------------
# Document creation
# -------------------------------------------------------------------

def create_pdf_document(
    buffer: BytesIO,
    title: str,
    author: str = BRAND_NAME,
):
    """
    Create the standard A4 PDF document used by all reports.
    """

    return SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
        title=title,
        author=author,
        creator=BRAND_NAME,
    )


# -------------------------------------------------------------------
# Header components
# -------------------------------------------------------------------

def create_report_header(
    report_title: str,
    mine_name: str = "Demo Mine",
    company_name: str = BRAND_NAME,
    report_period: Optional[str] = None,
    generated_at: Optional[datetime] = None,
):
    """
    Create a standard report title block.
    """

    styles = get_report_styles()

    if generated_at is None:
        generated_at = datetime.now()

    generated_text = generated_at.strftime("%Y-%m-%d %H:%M")

    metadata_parts = [
        f"<b>Mine:</b> {mine_name}",
        f"<b>Generated:</b> {generated_text}",
    ]

    if report_period:
        metadata_parts.insert(
            1,
            f"<b>Reporting period:</b> {report_period}",
        )

    metadata_text = " &nbsp;&nbsp;|&nbsp;&nbsp; ".join(metadata_parts)

    header_table = Table(
        [
            [
                Paragraph(
                    company_name,
                    styles["ReportBrand"],
                ),
                Paragraph(
                    "Executive Operations Intelligence",
                    styles["ReportSubtitle"],
                ),
            ]
        ],
        colWidths=[
            85 * mm,
            73 * mm,
        ],
    )

    header_table.setStyle(
        TableStyle(
            [
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "ALIGN",
                    (1, 0),
                    (1, 0),
                    "RIGHT",
                ),
                (
                    "LINEBELOW",
                    (0, 0),
                    (-1, -1),
                    1.5,
                    PRIMARY_COLOR,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
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
                    0,
                ),
            ]
        )
    )

    return [
        header_table,
        Spacer(1, 9),
        Paragraph(
            report_title,
            styles["ReportTitle"],
        ),
        Paragraph(
            metadata_text,
            styles["ReportSubtitle"],
        ),
        Spacer(1, 14),
    ]


# -------------------------------------------------------------------
# Section components
# -------------------------------------------------------------------

def create_section_heading(title: str):
    """
    Create a consistent section heading with a green indicator bar.
    """

    styles = get_report_styles()

    heading_table = Table(
        [
            [
                "",
                Paragraph(
                    title,
                    styles["SectionHeading"],
                ),
            ]
        ],
        colWidths=[
            3 * mm,
            155 * mm,
        ],
    )

    heading_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, 0),
                    PRIMARY_COLOR,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (0, 0),
                    0,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (0, 0),
                    0,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (0, 0),
                    3,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (0, 0),
                    3,
                ),
                (
                    "LEFTPADDING",
                    (1, 0),
                    (1, 0),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (1, 0),
                    (1, 0),
                    0,
                ),
                (
                    "TOPPADDING",
                    (1, 0),
                    (1, 0),
                    0,
                ),
                (
                    "BOTTOMPADDING",
                    (1, 0),
                    (1, 0),
                    0,
                ),
            ]
        )
    )

    return KeepTogether(
        [
            Spacer(1, 5),
            heading_table,
            Spacer(1, 4),
        ]
    )


def create_body_paragraph(text: str):
    """
    Create a standard executive body paragraph.
    """

    styles = get_report_styles()

    return Paragraph(
        text,
        styles["BodyTextExecutive"],
    )


def create_bullet_list(items: Sequence[str]):
    """
    Convert a sequence of strings into PDF bullet paragraphs.
    """

    styles = get_report_styles()
    flowables = []

    for item in items:
        flowables.append(
            Paragraph(
                f"• {item}",
                styles["BulletTextExecutive"],
            )
        )

    return flowables


# -------------------------------------------------------------------
# Table components
# -------------------------------------------------------------------

def _convert_table_cells_to_paragraphs(
    data: Sequence[Sequence],
    header_style,
    body_style,
):
    """
    Convert table values to wrapped ReportLab Paragraph objects.
    """

    formatted_data = []

    for row_index, row in enumerate(data):
        formatted_row = []

        for cell in row:
            cell_text = "" if cell is None else str(cell)
            style = header_style if row_index == 0 else body_style

            formatted_row.append(
                Paragraph(
                    cell_text,
                    style,
                )
            )

        formatted_data.append(formatted_row)

    return formatted_data


def create_standard_table(
    data: Sequence[Sequence],
    column_widths: Optional[List[float]] = None,
    header_color=PRIMARY_COLOR,
    alternate_rows: bool = True,
):
    """
    Create a standard executive report table.

    The first row is treated as the table header.
    """

    if not data:
        return Spacer(1, 1)

    styles = get_report_styles()

    header_cell_style = ParagraphStyle(
        name="ReusableTableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=WHITE_COLOR,
        alignment=TA_LEFT,
    )

    body_cell_style = ParagraphStyle(
        name="ReusableTableBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=TEXT_COLOR,
        alignment=TA_LEFT,
    )

    formatted_data = _convert_table_cells_to_paragraphs(
        data=data,
        header_style=header_cell_style,
        body_style=body_cell_style,
    )

    table = Table(
        formatted_data,
        colWidths=column_widths,
        repeatRows=1,
        hAlign="LEFT",
    )

    table_commands = [
        (
            "BACKGROUND",
            (0, 0),
            (-1, 0),
            header_color,
        ),
        (
            "TEXTCOLOR",
            (0, 0),
            (-1, 0),
            WHITE_COLOR,
        ),
        (
            "FONTNAME",
            (0, 0),
            (-1, 0),
            "Helvetica-Bold",
        ),
        (
            "GRID",
            (0, 0),
            (-1, -1),
            0.4,
            BORDER_COLOR,
        ),
        (
            "VALIGN",
            (0, 0),
            (-1, -1),
            "TOP",
        ),
        (
            "LEFTPADDING",
            (0, 0),
            (-1, -1),
            7,
        ),
        (
            "RIGHTPADDING",
            (0, 0),
            (-1, -1),
            7,
        ),
        (
            "TOPPADDING",
            (0, 0),
            (-1, -1),
            7,
        ),
        (
            "BOTTOMPADDING",
            (0, 0),
            (-1, -1),
            7,
        ),
    ]

    if alternate_rows:
        for row_index in range(1, len(data)):
            if row_index % 2 == 1:
                table_commands.append(
                    (
                        "BACKGROUND",
                        (0, row_index),
                        (-1, row_index),
                        LIGHT_BACKGROUND,
                    )
                )

    table.setStyle(
        TableStyle(table_commands)
    )

    return table


# -------------------------------------------------------------------
# KPI callout components
# -------------------------------------------------------------------

def create_kpi_callouts(kpis: Sequence[dict]):
    """
    Create KPI summary cards.

    Expected format:

    [
        {"label": "Mine Health", "value": "87"},
        {"label": "Production", "value": "96%"},
    ]
    """

    if not kpis:
        return Spacer(1, 1)

    styles = get_report_styles()
    cells = []

    for kpi in kpis:
        value = str(
            kpi.get(
                "value",
                "-",
            )
        )

        label = str(
            kpi.get(
                "label",
                "KPI",
            )
        )

        cell_content = [
            Paragraph(
                value,
                styles["CalloutValue"],
            ),
            Spacer(1, 3),
            Paragraph(
                label,
                styles["CalloutLabel"],
            ),
        ]

        cells.append(cell_content)

    available_width = 159 * mm
    column_width = available_width / len(cells)

    table = Table(
        [cells],
        colWidths=[column_width] * len(cells),
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    LIGHT_BACKGROUND,
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.6,
                    BORDER_COLOR,
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.6,
                    BORDER_COLOR,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "ALIGN",
                    (0, 0),
                    (-1, -1),
                    "CENTER",
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
                    12,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    12,
                ),
            ]
        )
    )

    return table


# -------------------------------------------------------------------
# Chart components
# -------------------------------------------------------------------

def create_chart_image(
    image_buffer: BytesIO,
    width: float = 155 * mm,
    height: float = 65 * mm,
):
    """
    Convert an in-memory PNG chart into a ReportLab Image.

    Args:
        image_buffer:
            BytesIO buffer containing the PNG chart.

        width:
            Display width of the chart in the PDF.

        height:
            Display height of the chart in the PDF.

    Returns:
        ReportLab Image flowable ready to add to the PDF story.
    """

    if image_buffer is None:
        raise ValueError(
            "Chart image buffer cannot be None."
        )

    if not hasattr(image_buffer, "seek"):
        raise TypeError(
            "Chart image must be provided as a BytesIO-compatible buffer."
        )

    image_buffer.seek(0)

    chart_image = Image(
        image_buffer,
        width=width,
        height=height,
    )

    chart_image.hAlign = "CENTER"

    return chart_image


# -------------------------------------------------------------------
# Page footer
# -------------------------------------------------------------------

def draw_page_footer(
    canvas: Canvas,
    document,
    report_name: str,
):
    """
    Draw the standard footer and page number on every page.
    """

    canvas.saveState()

    page_width, _ = A4
    footer_y = 10 * mm

    canvas.setStrokeColor(BORDER_COLOR)
    canvas.setLineWidth(0.5)

    canvas.line(
        document.leftMargin,
        footer_y + 5 * mm,
        page_width - document.rightMargin,
        footer_y + 5 * mm,
    )

    canvas.setFont(
        "Helvetica",
        7.5,
    )

    canvas.setFillColor(
        MUTED_TEXT_COLOR
    )

    canvas.drawString(
        document.leftMargin,
        footer_y,
        f"{report_name} | Generated by {BRAND_NAME}",
    )

    canvas.drawRightString(
        page_width - document.rightMargin,
        footer_y,
        f"Page {document.page}",
    )

    canvas.restoreState()


# -------------------------------------------------------------------
# Final document builder
# -------------------------------------------------------------------

def build_pdf(
    story: list,
    report_name: str,
):
    """
    Build and return a completed PDF as an in-memory BytesIO buffer.
    """

    buffer = BytesIO()

    document = create_pdf_document(
        buffer=buffer,
        title=report_name,
    )

    def footer_callback(canvas, doc):
        draw_page_footer(
            canvas=canvas,
            document=doc,
            report_name=report_name,
        )

    document.build(
        story,
        onFirstPage=footer_callback,
        onLaterPages=footer_callback,
    )

    buffer.seek(0)

    return buffer


# -------------------------------------------------------------------
# Optional shared utilities
# -------------------------------------------------------------------

def create_page_break():
    """
    Create a PDF page break.
    """

    return PageBreak()


def create_vertical_space(
    height: float = 10,
):
    """
    Create vertical spacing between report elements.
    """

    return Spacer(
        1,
        height,
    )