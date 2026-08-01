from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle, StyleSheet1
from reportlab.lib.units import mm


# --------------------------------------------------
# Core Brand Colors
# --------------------------------------------------

NAVY = HexColor("#0F172A")
PRIMARY_GREEN = HexColor("#16A34A")
PRIMARY_GREEN_DARK = HexColor("#15803D")

WHITE = HexColor("#FFFFFF")
BLACK = HexColor("#000000")

MUTED_TEXT = HexColor("#64748B")
SECONDARY_TEXT = HexColor("#475569")

LIGHT_BACKGROUND = HexColor("#F8FAFC")
CARD_BACKGROUND = HexColor("#FFFFFF")
BORDER_GRAY = HexColor("#E2E8F0")
DIVIDER_GRAY = HexColor("#CBD5E1")


# --------------------------------------------------
# Status Colors
# --------------------------------------------------

SUCCESS_GREEN = HexColor("#15803D")
SUCCESS_BACKGROUND = HexColor("#F0FDF4")

WARNING_AMBER = HexColor("#D97706")
WARNING_BACKGROUND = HexColor("#FFFBEB")

CRITICAL_RED = HexColor("#DC2626")
CRITICAL_BACKGROUND = HexColor("#FEF2F2")

INFO_BLUE = HexColor("#2563EB")
INFO_BACKGROUND = HexColor("#EFF6FF")


# --------------------------------------------------
# Typography Defaults
# --------------------------------------------------

FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_ITALIC = "Helvetica-Oblique"


def create_executive_pdf_styles() -> StyleSheet1:
    """
    Create and return the reusable style system for Executive KPI PDFs.

    The returned object behaves like a dictionary and supports calls such as:

        styles["cover_title"]
        styles["section_title"]
        styles["body"]
        styles["kpi_name"]

    Returns:
        StyleSheet1 containing all reusable paragraph styles.
    """

    styles = StyleSheet1()

    # --------------------------------------------------
    # Cover Page Styles
    # --------------------------------------------------

    styles.add(
        ParagraphStyle(
            name="cover_title",
            fontName=FONT_BOLD,
            fontSize=26,
            leading=32,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=4 * mm,
        )
    )

    styles.add(
        ParagraphStyle(
            name="cover_company",
            fontName=FONT_BOLD,
            fontSize=15,
            leading=19,
            textColor=PRIMARY_GREEN,
            alignment=TA_CENTER,
        )
    )

    styles.add(
        ParagraphStyle(
            name="cover_mine",
            fontName=FONT_REGULAR,
            fontSize=11,
            leading=15,
            textColor=MUTED_TEXT,
            alignment=TA_CENTER,
        )
    )

    styles.add(
        ParagraphStyle(
            name="metadata_label",
            fontName=FONT_BOLD,
            fontSize=8,
            leading=10,
            textColor=MUTED_TEXT,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="metadata_value",
            fontName=FONT_REGULAR,
            fontSize=9,
            leading=12,
            textColor=NAVY,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="confidential",
            fontName=FONT_BOLD,
            fontSize=8,
            leading=11,
            textColor=CRITICAL_RED,
            alignment=TA_CENTER,
        )
    )

    # --------------------------------------------------
    # Section Styles
    # --------------------------------------------------

    styles.add(
        ParagraphStyle(
            name="section_title",
            fontName=FONT_BOLD,
            fontSize=16,
            leading=20,
            textColor=NAVY,
            alignment=TA_LEFT,
            spaceAfter=1 * mm,
        )
    )

    styles.add(
        ParagraphStyle(
            name="section_subtitle",
            fontName=FONT_BOLD,
            fontSize=11,
            leading=14,
            textColor=SECONDARY_TEXT,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="body",
            fontName=FONT_REGULAR,
            fontSize=9,
            leading=13,
            textColor=MUTED_TEXT,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="body_dark",
            fontName=FONT_REGULAR,
            fontSize=9,
            leading=13,
            textColor=NAVY,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="small_body",
            fontName=FONT_REGULAR,
            fontSize=8,
            leading=11,
            textColor=MUTED_TEXT,
            alignment=TA_LEFT,
        )
    )

    # --------------------------------------------------
    # KPI Styles
    # --------------------------------------------------

    styles.add(
        ParagraphStyle(
            name="kpi_name",
            fontName=FONT_BOLD,
            fontSize=17,
            leading=21,
            textColor=NAVY,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="kpi_label",
            fontName=FONT_BOLD,
            fontSize=7,
            leading=9,
            textColor=MUTED_TEXT,
            alignment=TA_CENTER,
        )
    )

    styles.add(
        ParagraphStyle(
            name="kpi_metric",
            fontName=FONT_BOLD,
            fontSize=11,
            leading=14,
            textColor=NAVY,
            alignment=TA_CENTER,
        )
    )

    styles.add(
        ParagraphStyle(
            name="kpi_metric_large",
            fontName=FONT_BOLD,
            fontSize=18,
            leading=22,
            textColor=NAVY,
            alignment=TA_CENTER,
        )
    )

    styles.add(
        ParagraphStyle(
            name="status",
            fontName=FONT_BOLD,
            fontSize=8,
            leading=10,
            textColor=NAVY,
            alignment=TA_CENTER,
        )
    )

    # --------------------------------------------------
    # Interpretation and Insight Styles
    # --------------------------------------------------

    styles.add(
        ParagraphStyle(
            name="interpretation_title",
            fontName=FONT_BOLD,
            fontSize=9,
            leading=12,
            textColor=NAVY,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="interpretation_body",
            fontName=FONT_REGULAR,
            fontSize=9,
            leading=13,
            textColor=NAVY,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="insight_headline",
            fontName=FONT_BOLD,
            fontSize=15,
            leading=19,
            textColor=NAVY,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="insight_label",
            fontName=FONT_BOLD,
            fontSize=7,
            leading=9,
            textColor=MUTED_TEXT,
            alignment=TA_CENTER,
        )
    )

    styles.add(
        ParagraphStyle(
            name="insight_value",
            fontName=FONT_BOLD,
            fontSize=10,
            leading=13,
            textColor=NAVY,
            alignment=TA_CENTER,
        )
    )

    # --------------------------------------------------
    # Root Cause Styles
    # --------------------------------------------------

    styles.add(
        ParagraphStyle(
            name="root_cause_title",
            fontName=FONT_BOLD,
            fontSize=11,
            leading=14,
            textColor=NAVY,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="root_cause_label",
            fontName=FONT_BOLD,
            fontSize=8,
            leading=10,
            textColor=MUTED_TEXT,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="root_cause_detail",
            fontName=FONT_REGULAR,
            fontSize=9,
            leading=13,
            textColor=NAVY,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="badge",
            fontName=FONT_BOLD,
            fontSize=7,
            leading=9,
            textColor=NAVY,
            alignment=TA_CENTER,
        )
    )

    # --------------------------------------------------
    # Footer and Utility Styles
    # --------------------------------------------------

    styles.add(
        ParagraphStyle(
            name="footer",
            fontName=FONT_REGULAR,
            fontSize=7,
            leading=9,
            textColor=MUTED_TEXT,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="footer_center",
            fontName=FONT_REGULAR,
            fontSize=7,
            leading=9,
            textColor=MUTED_TEXT,
            alignment=TA_CENTER,
        )
    )

    styles.add(
        ParagraphStyle(
            name="table_header",
            fontName=FONT_BOLD,
            fontSize=8,
            leading=10,
            textColor=WHITE,
            alignment=TA_CENTER,
        )
    )

    styles.add(
        ParagraphStyle(
            name="table_cell",
            fontName=FONT_REGULAR,
            fontSize=8,
            leading=11,
            textColor=NAVY,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="table_cell_center",
            fontName=FONT_REGULAR,
            fontSize=8,
            leading=11,
            textColor=NAVY,
            alignment=TA_CENTER,
        )
    )


    # --------------------------------------------------
    # Phase 5 — Recommended Action Styles
    # --------------------------------------------------

    styles.add(
        ParagraphStyle(
            name="action_title",
            fontName=FONT_BOLD,
            fontSize=11,
            leading=14,
            textColor=NAVY,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="action_label",
            fontName=FONT_BOLD,
            fontSize=7,
            leading=9,
            textColor=MUTED_TEXT,
            alignment=TA_LEFT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="action_value",
            fontName=FONT_REGULAR,
            fontSize=8,
            leading=11,
            textColor=NAVY,
            alignment=TA_LEFT,
        )
    )

    return styles


# --------------------------------------------------
# Backward-Compatible Aliases
# --------------------------------------------------


def get_executive_pdf_styles() -> StyleSheet1:
    """
    Backward-compatible alias for older service versions.
    """

    return create_executive_pdf_styles()


def build_executive_pdf_styles() -> StyleSheet1:
    """
    Backward-compatible alias for older service versions.
    """

    return create_executive_pdf_styles()


def get_pdf_styles() -> StyleSheet1:
    """
    Backward-compatible alias for older service versions.
    """

    return create_executive_pdf_styles()
