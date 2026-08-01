from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
)

from app.services.executive_pdf.executive_pdf_sections import (
    build_ai_executive_insight,
    build_executive_action_plan,
    build_executive_kpi_summary,
    build_historical_analysis,
    build_root_cause_analysis,
)
from app.services.executive_pdf.executive_pdf_styles import (
    NAVY,
    create_executive_pdf_styles,
)

from app.services.executive_recommendation.recommendation_engine import (
    generate_executive_recommendation,
)
from app.services.executive_pdf.sections.benchmark_section import (
    build_benchmark_section,
)
from app.services.executive_pdf.sections.decision_banner_section import (
    build_decision_banner,
)

from app.services.executive_pdf.sections.executive_recommendation_section import (
    build_executive_recommendation,
)


PAGE_WIDTH, PAGE_HEIGHT = A4

BORDER_GRAY = colors.HexColor("#D7DEE8")
MUTED_TEXT = colors.HexColor("#64748B")
HEADER_BACKGROUND = colors.HexColor("#F8FAFC")
WHITE = colors.white


# ==================================================
# Logo path helpers
# ==================================================


def _backend_directory() -> Path:
    """
    Return the backend project directory.

    Current service location:
        backend/app/services/executive_pdf/executive_pdf_service.py
    """

    service_file = Path(__file__).resolve()
    return service_file.parents[3]


def _app_directory() -> Path:
    """Return the backend/app directory."""

    service_file = Path(__file__).resolve()
    return service_file.parents[2]


def _normalise_logo_path(
    logo_path: Optional[str],
) -> Optional[str]:
    """
    Convert a supplied logo path or static URL into a local file path.

    Supported examples:
        /static/logos/company-logo.png
        static/logos/company-logo.png
        app/static/logos/company-logo.png
        /Users/Booboo/.../company-logo.png

    Remote HTTP/HTTPS URLs are intentionally not downloaded here.
    """

    if not logo_path:
        return None

    raw_path = str(logo_path).strip()

    if not raw_path:
        return None

    if raw_path.startswith(("http://", "https://")):
        return None

    backend_directory = _backend_directory()
    app_directory = _app_directory()

    supplied_path = Path(raw_path).expanduser()

    candidates: List[Path] = []

    # Absolute local filesystem path
    if supplied_path.is_absolute():
        candidates.append(supplied_path)

    # Example: /static/logos/logo.png
    if raw_path.startswith("/static/"):
        relative_static_path = raw_path.removeprefix("/static/")
        candidates.append(
            app_directory / "static" / relative_static_path
        )

    # Example: static/logos/logo.png
    if raw_path.startswith("static/"):
        relative_static_path = raw_path.removeprefix("static/")
        candidates.append(
            app_directory / "static" / relative_static_path
        )

    # Example: app/static/logos/logo.png
    if raw_path.startswith("app/"):
        candidates.append(
            backend_directory / raw_path
        )

    # General relative locations
    candidates.extend(
        [
            backend_directory / raw_path,
            app_directory / raw_path,
        ]
    )

    for candidate in candidates:
        resolved_candidate = candidate.resolve()

        if resolved_candidate.exists() and resolved_candidate.is_file():
            return str(resolved_candidate)

    return None


def resolve_default_logo_path() -> Optional[str]:
    """
    Find the first available company logo from common backend locations.
    """

    app_directory = _app_directory()
    backend_directory = _backend_directory()

    candidate_paths = [
        app_directory / "static" / "logos" / "logo.png",
        app_directory / "static" / "logos" / "logo.jpg",
        app_directory / "static" / "logos" / "logo.jpeg",
        app_directory / "static" / "logos" / "company-logo.png",
        app_directory / "static" / "logos" / "company_logo.png",
        app_directory / "static" / "logos" / "mine-manager-ai.png",
        app_directory / "static" / "images" / "logo.png",
        backend_directory / "static" / "logos" / "logo.png",
        backend_directory / "static" / "images" / "logo.png",
    ]

    for candidate in candidate_paths:
        if candidate.exists() and candidate.is_file():
            return str(candidate.resolve())

    return None


def resolve_logo_path(
    logo_path: Optional[str],
) -> Optional[str]:
    """
    Resolve a caller-supplied company logo first.

    Fall back to a default application logo when the supplied path
    is missing or invalid.
    """

    supplied_logo = _normalise_logo_path(logo_path)

    if supplied_logo:
        return supplied_logo

    return resolve_default_logo_path()


# ==================================================
# Logo drawing
# ==================================================


def _draw_company_logo(
    canvas,
    logo_path: Optional[str],
    x: float,
    y: float,
    max_width: float,
    max_height: float,
) -> bool:
    """
    Draw the company logo while preserving its aspect ratio.

    Returns True when the logo is successfully rendered.
    Returns False when no usable logo is available.
    """

    if not logo_path:
        return False

    try:
        image_reader = ImageReader(logo_path)
        image_width, image_height = image_reader.getSize()

        if not image_width or not image_height:
            return False

        width_scale = max_width / float(image_width)
        height_scale = max_height / float(image_height)
        scale = min(width_scale, height_scale)

        draw_width = image_width * scale
        draw_height = image_height * scale

        draw_x = x + ((max_width - draw_width) / 2)
        draw_y = y + ((max_height - draw_height) / 2)

        canvas.drawImage(
            image_reader,
            draw_x,
            draw_y,
            width=draw_width,
            height=draw_height,
            preserveAspectRatio=True,
            mask="auto",
        )

        return True

    except Exception:
        # PDF generation should continue even if the logo is damaged
        # or uses an unsupported image format.
        return False


def _draw_logo_fallback(
    canvas,
    company_name: str,
    x: float,
    y: float,
    width: float,
    height: float,
) -> None:
    """
    Draw a professional initial-based fallback when no logo exists.
    """

    company_initial = (
        str(company_name).strip()[:1].upper()
        if company_name
        else "M"
    )

    canvas.setFillColor(NAVY)
    canvas.roundRect(
        x,
        y,
        width,
        height,
        3 * mm,
        stroke=0,
        fill=1,
    )

    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 18)

    canvas.drawCentredString(
        x + (width / 2),
        y + (height / 2) - 2.3 * mm,
        company_initial,
    )


# ==================================================
# Branded page header and footer
# ==================================================


def _draw_branded_header_footer(
    canvas,
    doc,
    company_name: str,
    mine_name: str,
    reporting_period: str,
    report_title: str,
    generated_at: str,
    logo_path: Optional[str],
) -> None:
    """
    Draw the company-branded executive header and report footer.

    The branded header is repeated on each report page so that pages
    remain identifiable when printed or shared separately.
    """

    page_number = canvas.getPageNumber()

    canvas.saveState()

    page_left = doc.leftMargin
    page_right = PAGE_WIDTH - doc.rightMargin
    content_width = page_right - page_left

    # --------------------------------------------------
    # Branded header container
    # --------------------------------------------------

    header_height = 35 * mm
    header_top = PAGE_HEIGHT - 10 * mm
    header_bottom = header_top - header_height

    canvas.setFillColor(HEADER_BACKGROUND)
    canvas.setStrokeColor(BORDER_GRAY)
    canvas.setLineWidth(0.7)

    canvas.roundRect(
        page_left,
        header_bottom,
        content_width,
        header_height,
        2.5 * mm,
        stroke=1,
        fill=1,
    )

    # Company accent line
    canvas.setFillColor(NAVY)
    canvas.roundRect(
        page_left,
        header_bottom,
        3 * mm,
        header_height,
        1.5 * mm,
        stroke=0,
        fill=1,
    )

    # --------------------------------------------------
    # Company logo
    # --------------------------------------------------

    logo_x = page_left + 8 * mm
    logo_y = header_bottom + 7 * mm
    logo_width = 29 * mm
    logo_height = 21 * mm

    logo_drawn = _draw_company_logo(
        canvas=canvas,
        logo_path=logo_path,
        x=logo_x,
        y=logo_y,
        max_width=logo_width,
        max_height=logo_height,
    )

    if not logo_drawn:
        fallback_size = 18 * mm

        _draw_logo_fallback(
            canvas=canvas,
            company_name=company_name,
            x=logo_x,
            y=header_bottom + 8.5 * mm,
            width=fallback_size,
            height=fallback_size,
        )

    # --------------------------------------------------
    # Company and report title
    # --------------------------------------------------

    text_x = page_left + 43 * mm

    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica-Bold", 13)

    canvas.drawString(
        text_x,
        header_top - 9 * mm,
        str(company_name),
    )

    canvas.setFont("Helvetica-Bold", 10)

    canvas.drawString(
        text_x,
        header_top - 16 * mm,
        str(report_title),
    )

    # --------------------------------------------------
    # Report metadata
    # --------------------------------------------------

    metadata_y = header_top - 24 * mm

    canvas.setFillColor(MUTED_TEXT)
    canvas.setFont("Helvetica-Bold", 7)

    canvas.drawString(
        text_x,
        metadata_y,
        "MINE",
    )

    canvas.drawString(
        text_x + 60 * mm,
        metadata_y,
        "GENERATED",
    )

    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(NAVY)

    canvas.drawString(
        text_x,
        metadata_y - 4.5 * mm,
        str(mine_name),
    )

    canvas.drawString(
        text_x + 60 * mm,
        metadata_y - 4.5 * mm,
        str(generated_at),
    )

    # Reporting period aligned on the right
    reporting_x = page_right - 43 * mm

    canvas.setFillColor(MUTED_TEXT)
    canvas.setFont("Helvetica-Bold", 7)

    canvas.drawString(
        reporting_x,
        metadata_y,
        "REPORTING PERIOD",
    )

    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica", 7.5)

    canvas.drawString(
        reporting_x,
        metadata_y - 4.5 * mm,
        str(reporting_period),
    )

    # --------------------------------------------------
    # Footer
    # --------------------------------------------------

    footer_y = 11 * mm

    canvas.setStrokeColor(BORDER_GRAY)
    canvas.setLineWidth(0.5)

    canvas.line(
        page_left,
        footer_y + 5 * mm,
        page_right,
        footer_y + 5 * mm,
    )

    canvas.setFillColor(MUTED_TEXT)
    canvas.setFont("Helvetica", 7)

    canvas.drawString(
        page_left,
        footer_y,
        "Confidential — Internal management use only",
    )

    canvas.drawCentredString(
        PAGE_WIDTH / 2,
        footer_y,
        str(company_name),
    )

    canvas.drawRightString(
        page_right,
        footer_y,
        f"Page {page_number}",
    )

    canvas.restoreState()


def _draw_footer_only(
    canvas,
    doc,
    company_name: str,
) -> None:
    """
    Draw a compact footer on later report pages.

    The full branded header is intentionally limited to page 1.
    """

    page_number = canvas.getPageNumber()

    canvas.saveState()

    page_left = doc.leftMargin
    page_right = PAGE_WIDTH - doc.rightMargin

    footer_y = 11 * mm

    canvas.setStrokeColor(BORDER_GRAY)
    canvas.setLineWidth(0.5)

    canvas.line(
        page_left,
        footer_y + 5 * mm,
        page_right,
        footer_y + 5 * mm,
    )

    canvas.setFillColor(MUTED_TEXT)
    canvas.setFont("Helvetica", 7)

    canvas.drawString(
        page_left,
        footer_y,
        "Confidential — Internal management use only",
    )

    canvas.drawCentredString(
        PAGE_WIDTH / 2,
        footer_y,
        str(company_name),
    )

    canvas.drawRightString(
        page_right,
        footer_y,
        f"Page {page_number}",
    )

    canvas.restoreState()


# ==================================================
# Executive KPI PDF generator
# ==================================================


def generate_executive_kpi_pdf(
    kpi_data: Dict[str, Any],
    historical_data: Optional[List[Dict[str, Any]]] = None,
    benchmark_data: Optional[Dict[str, Any]] = None,
    ai_insight_data: Optional[Dict[str, Any]] = None,
    root_cause_data: Optional[List[Dict[str, Any]]] = None,
    recommended_action_data: Optional[List[Dict[str, Any]]] = None,
    recommendation_data: Optional[Dict[str, Any]] = None,
    company_name: str = "Mine Manager AI",
    mine_name: str = "Oyu Tolgoi Surface Operations",
    reporting_period: str = "Current Reporting Period",
    prepared_by: str = "Mine Manager AI",
    logo_path: Optional[str] = None,
    report_title: str = "Executive KPI Analysis Report",
    generated_at: Optional[datetime] = None,
) -> BytesIO:
    """
    Generate a concise branded two-page Executive KPI Decision Brief.

    Page 1:
        1. Executive KPI Summary
        2. Historical KPI Analysis
        3. Executive Benchmark Analysis
        4. AI Executive Insight
        5. Top Root Causes

    Page 2:
        1. Executive Action Plan

    Company branding includes:
        - company logo
        - company name
        - report title
        - mine name
        - generation timestamp
        - reporting period
    """

    # --------------------------------------------------
    # Input validation and defaults
    # --------------------------------------------------

    if not isinstance(kpi_data, dict):
        raise TypeError("kpi_data must be a dictionary.")

    historical_data = historical_data or []
    benchmark_data = benchmark_data or {}
    ai_insight_data = ai_insight_data or {}
    root_cause_data = root_cause_data or []
    recommended_action_data = recommended_action_data or []
    recommendation_data = recommendation_data or {}

    if not isinstance(historical_data, list):
        raise TypeError("historical_data must be a list.")

    if not isinstance(benchmark_data, dict):
        raise TypeError("benchmark_data must be a dictionary.")

    if not isinstance(ai_insight_data, dict):
        raise TypeError("ai_insight_data must be a dictionary.")

    if not isinstance(root_cause_data, list):
        raise TypeError("root_cause_data must be a list.")

    if not isinstance(recommended_action_data, list):
        raise TypeError(
            "recommended_action_data must be a list."
        )

    if not isinstance(recommendation_data, dict):
        raise TypeError(
            "recommendation_data must be a dictionary."
        )

    company_name = (
        str(company_name).strip()
        or "Mine Manager AI"
    )

    mine_name = (
        str(mine_name).strip()
        or "Mine Operations"
    )

    reporting_period = (
        str(reporting_period).strip()
        or "Current Reporting Period"
    )

    report_title = (
        str(report_title).strip()
        or "Executive KPI Analysis Report"
    )

    # --------------------------------------------------
    # Executive content limits
    # --------------------------------------------------

    historical_data = historical_data[-14:]
    root_cause_data = root_cause_data[:3]
    recommended_action_data = recommended_action_data[:5]

    # --------------------------------------------------
    # AI Executive Recommendation
    # --------------------------------------------------

    if not recommendation_data:
        operational_context = (
            kpi_data.get("operational_context")
            or kpi_data.get("context")
            or {}
        )

        recommendation_data = generate_executive_recommendation(
            kpi_key=str(
                kpi_data.get("kpi_key")
                or "executive_kpi"
            ),
            kpi_name=str(
                kpi_data.get("kpi_name")
                or "Executive KPI"
            ),
            current_value=kpi_data.get("current_value"),
            target_value=kpi_data.get("target_value"),
            context=operational_context,
        )

    generated_priority_actions = (
        recommendation_data.get("priority_actions")
        or []
    )

    # Use generated recommendations as the action-plan source
    # when no separate action data was supplied.
    if not recommended_action_data and generated_priority_actions:
        recommended_action_data = generated_priority_actions[:5]

    resolved_logo_path = resolve_logo_path(logo_path)

    generation_datetime = generated_at or datetime.now()

    generated_at_text = generation_datetime.strftime(
        "%Y-%m-%d %H:%M"
    )

    # --------------------------------------------------
    # PDF buffer and document
    # --------------------------------------------------

    buffer = BytesIO()

    left_margin = 18 * mm
    right_margin = 18 * mm
    first_page_top_margin = 51 * mm
    later_page_top_margin = 12 * mm
    bottom_margin = 20 * mm

    document = BaseDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=right_margin,
        leftMargin=left_margin,
        topMargin=first_page_top_margin,
        bottomMargin=bottom_margin,
        title=report_title,
        author=prepared_by,
        subject=(
            f"{report_title} for {mine_name} — "
            f"{reporting_period}"
        ),
        creator="Mine Manager AI",
    )

    content_width = PAGE_WIDTH - left_margin - right_margin

    first_page_frame = Frame(
        left_margin,
        bottom_margin,
        content_width,
        PAGE_HEIGHT - first_page_top_margin - bottom_margin,
        id="first_page_frame",
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )

    later_page_frame = Frame(
        left_margin,
        bottom_margin,
        content_width,
        PAGE_HEIGHT - later_page_top_margin - bottom_margin,
        id="later_page_frame",
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )

    styles = create_executive_pdf_styles()
    story = []

    # --------------------------------------------------
    # Page 1 — Executive decision summary
    # --------------------------------------------------

    story.extend(
        build_executive_kpi_summary(
            styles=styles,
            kpi_data=kpi_data,
        )
    )

    kpi_name = (
        kpi_data.get("kpi_name")
        or "Executive KPI"
    )

    target_value = kpi_data.get("target_value")
    unit = str(kpi_data.get("unit") or "").strip()

    value_label = (
        f"{kpi_name} ({unit})"
        if unit
        else kpi_name
    )

    story.extend(
        build_historical_analysis(
            styles=styles,
            historical_data=historical_data,
            target_value=target_value,
            kpi_name=kpi_name,
            value_label=value_label,
        )
    )

    story.extend(
        build_benchmark_section(
            benchmark_data=benchmark_data,
            styles=styles,
        )
    )

    story.extend(
        build_ai_executive_insight(
            styles=styles,
            ai_insight_data=ai_insight_data,
        )
    )

    # --------------------------------------------------
    # Page 2 — Executive decision summary
    #
    # The heading flows naturally after Page 1 content. ReportLab
    # starts Page 2 automatically when the remaining space is not
    # sufficient, while keeping the total report at two pages.
    # --------------------------------------------------

    story.append(
        Paragraph(
            "Executive Decision Summary",
            styles["section_title"],
        )
    )
    story.append(Spacer(1, 3 * mm))

    story.extend(
        build_decision_banner(
            styles=styles,
            kpi_data=kpi_data,
            ai_insight_data=ai_insight_data,
            root_cause_data=root_cause_data,
        )
    )

    story.extend(
        build_root_cause_analysis(
            styles=styles,
            root_cause_data=root_cause_data,
        )
    )

    story.append(Spacer(1, 4 * mm))

    story.extend(
        build_executive_recommendation(
            styles=styles,
            recommendation_data=recommendation_data,
        )
    )

    # --------------------------------------------------
    # Executive action plan
    #
    # No forced PageBreak is used here. Root causes, actions, and
    # expected benefits flow together as one executive decision page.
    # --------------------------------------------------

    story.extend(
        build_executive_action_plan(
            styles=styles,
            recommended_action_data=recommended_action_data,
        )
    )

    story.append(Spacer(1, 3 * mm))

    # --------------------------------------------------
    # Build PDF
    # --------------------------------------------------

    def draw_first_page(canvas, doc):
        _draw_branded_header_footer(
            canvas=canvas,
            doc=doc,
            company_name=company_name,
            mine_name=mine_name,
            reporting_period=reporting_period,
            report_title=report_title,
            generated_at=generated_at_text,
            logo_path=resolved_logo_path,
        )

    def draw_later_pages(canvas, doc):
        _draw_footer_only(
            canvas=canvas,
            doc=doc,
            company_name=company_name,
        )

    first_page_template = PageTemplate(
        id="FirstPage",
        frames=[first_page_frame],
        onPage=draw_first_page,
        autoNextPageTemplate="LaterPages",
    )

    later_pages_template = PageTemplate(
        id="LaterPages",
        frames=[later_page_frame],
        onPage=draw_later_pages,
    )

    document.addPageTemplates(
        [
            first_page_template,
            later_pages_template,
        ]
    )

    document.build(story)

    buffer.seek(0)
    return buffer
