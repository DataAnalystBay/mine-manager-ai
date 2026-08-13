from datetime import datetime

from reportlab.lib.units import mm

from app.services.chart_service import (
    create_bar_chart,
    create_line_chart,
)

from app.services.pdf_template_service import (
    BLUE_COLOR,
    PRIMARY_COLOR,
    build_pdf,
    create_body_paragraph,
    create_bullet_list,
    create_chart_image,
    create_kpi_callouts,
    create_report_header,
    create_section_heading,
    create_standard_table,
    create_vertical_space,
)


def generate_daily_executive_pdf(
    live_kpis: dict,
):
    """
    Generate the Daily Executive Report from the latest
    operational KPI values supplied by live_kpi_service.
    """
    report_name = "Daily Executive Report"

    generated_at = datetime.now()

    mine_name = str(
        live_kpis.get(
            "mine_name",
            "Oyu Tolgoi Surface",
        )
        or "Oyu Tolgoi Surface"
    )

    report_period = str(
        live_kpis.get("report_date")
        or generated_at.strftime("%Y-%m-%d")
    )

    health = float(
        live_kpis.get("health", 0) or 0
    )
    ore = float(
        live_kpis.get("ore", 0) or 0
    )
    waste = float(
        live_kpis.get("waste", 0) or 0
    )
    fleet = float(
        live_kpis.get("fleet", 0) or 0
    )
    availability = float(
        live_kpis.get("availability", 0) or 0
    )
    utilization = float(
        live_kpis.get("utilization", 0) or 0
    )
    plant = float(
        live_kpis.get("plant", 0) or 0
    )
    throughput = float(
        live_kpis.get("throughput", 0) or 0
    )
    recovery = float(
        live_kpis.get("recovery", 0) or 0
    )
    incidents = int(
        live_kpis.get("safety", 0) or 0
    )
    safety_score = float(
        live_kpis.get("safety_score", 0) or 0
    )
    near_misses = int(
        live_kpis.get("near_misses", 0) or 0
    )
    critical_risks = int(
        live_kpis.get("critical_risks", 0) or 0
    )

    production_status = (
        "Stable"
        if ore >= 100
        else "Watch"
    )

    fleet_status = (
        "Stable"
        if fleet >= 90
        else "Watch"
    )

    plant_status = (
        "Stable"
        if plant >= 95
        else "Watch"
    )

    safety_status = (
        "Stable"
        if incidents == 0
        and critical_risks == 0
        and safety_score >= 95
        else "Watch"
    )

    story = []

    story.extend(
        create_report_header(
            report_title=report_name,
            mine_name=mine_name,
            company_name="Mine Manager AI",
            report_period=report_period,
            generated_at=generated_at,
        )
    )

    story.append(
        create_section_heading(
            "Executive Summary"
        )
    )

    story.append(
        create_body_paragraph(
            (
                f"{mine_name} reported a Mine Health score of "
                f"{health:.1f} for {report_period}. "
                f"Ore achievement was {ore:.1f}% of plan, "
                f"waste achievement was {waste:.1f}% of plan, "
                f"fleet performance was {fleet:.1f}%, and "
                f"plant performance was {plant:.1f}%. "
                f"The latest safety result recorded {incidents} "
                f"incident(s), {near_misses} near miss(es), and "
                f"{critical_risks} critical risk(s)."
            )
        )
    )

    story.append(
        create_vertical_space(10)
    )

    story.append(
        create_kpi_callouts(
            [
                {
                    "label": "Mine Health",
                    "value": f"{health:.1f}",
                },
                {
                    "label": "Ore",
                    "value": f"{ore:.1f}%",
                },
                {
                    "label": "Fleet",
                    "value": f"{fleet:.1f}%",
                },
                {
                    "label": "Safety Score",
                    "value": f"{safety_score:.1f}%",
                },
            ]
        )
    )

    story.append(
        create_vertical_space(16)
    )

    story.append(
        create_section_heading(
            "Operational Performance"
        )
    )

    kpi_data = [
        [
            "Area",
            "Status",
            "Performance",
            "Management Commentary",
        ],
        [
            "Production",
            production_status,
            (
                f"Ore {ore:.1f}% | "
                f"Waste {waste:.1f}%"
            ),
            (
                "Latest uploaded production data shows "
                f"ore at {ore:.1f}% and waste at "
                f"{waste:.1f}% of plan."
            ),
        ],
        [
            "Fleet",
            fleet_status,
            (
                f"{fleet:.1f}% performance | "
                f"{availability:.1f}% availability"
            ),
            (
                f"Fleet utilization is {utilization:.1f}%. "
                "Review operating and maintenance constraints "
                "if performance remains below target."
            ),
        ],
        [
            "Plant",
            plant_status,
            (
                f"{plant:.1f}% performance | "
                f"{throughput:.1f}% throughput"
            ),
            (
                f"Plant recovery is {recovery:.1f}%. "
                "Continue monitoring throughput and recovery "
                "against operating targets."
            ),
        ],
        [
            "Safety",
            safety_status,
            (
                f"{incidents} incidents | "
                f"{safety_score:.1f}% score"
            ),
            (
                f"{near_misses} near miss(es) and "
                f"{critical_risks} critical risk(s) were "
                "reported in the latest uploaded data."
            ),
        ],
    ]

    story.append(
        create_standard_table(
            data=kpi_data,
            column_widths=[
                28 * mm,
                25 * mm,
                45 * mm,
                61 * mm,
            ],
            header_color=PRIMARY_COLOR,
        )
    )

    story.append(
        create_vertical_space(16)
    )

    story.append(
        create_section_heading(
            "Key Risks"
        )
    )

    risk_data = [
        [
            "Risk",
            "Level",
            "Operational Impact",
            "Required Response",
        ],
    ]

    if fleet < 90:
        risk_data.append(
            [
                "Fleet performance below target",
                "Medium",
                (
                    "Lower fleet effectiveness may constrain "
                    "production delivery."
                ),
                (
                    "Review availability, utilization, delays, "
                    "and maintenance priorities."
                ),
            ]
        )

    if ore < 100:
        risk_data.append(
            [
                "Ore production below plan",
                "Medium",
                (
                    "Below-plan ore movement may affect "
                    "daily production delivery."
                ),
                (
                    "Review production constraints and confirm "
                    "the recovery plan."
                ),
            ]
        )

    if plant < 95:
        risk_data.append(
            [
                "Plant performance below target",
                "Medium",
                (
                    "Plant constraints may reduce processing "
                    "performance."
                ),
                (
                    "Review throughput and recovery constraints "
                    "with the processing team."
                ),
            ]
        )

    if (
        incidents > 0
        or critical_risks > 0
        or safety_score < 95
    ):
        risk_data.append(
            [
                "Safety exposure requires attention",
                (
                    "High"
                    if incidents > 0
                    or critical_risks > 0
                    else "Medium"
                ),
                (
                    f"{incidents} incident(s), "
                    f"{near_misses} near miss(es), and "
                    f"{critical_risks} critical risk(s) "
                    "are reflected in the latest data."
                ),
                (
                    "Verify critical controls and close "
                    "required safety actions."
                ),
            ]
        )

    if len(risk_data) == 1:
        risk_data.append(
            [
                "No major KPI exception detected",
                "Low",
                (
                    "Latest operational KPIs are within "
                    "the current report thresholds."
                ),
                (
                    "Maintain controls and continue routine "
                    "performance monitoring."
                ),
            ]
        )

    story.append(
        create_standard_table(
            data=risk_data,
            column_widths=[
                43 * mm,
                21 * mm,
                47 * mm,
                48 * mm,
            ],
            header_color=BLUE_COLOR,
        )
    )

    story.append(
        create_vertical_space(16)
    )

    story.append(
        create_section_heading(
            "Priority Actions"
        )
    )

    priority_actions = []

    if fleet < 90:
        priority_actions.append(
            (
                "Review fleet availability and utilization "
                f"performance ({availability:.1f}% / "
                f"{utilization:.1f}%) with operations and "
                "maintenance."
            )
        )

    if ore < 100:
        priority_actions.append(
            (
                f"Confirm the production recovery plan for ore "
                f"achievement currently at {ore:.1f}% of plan."
            )
        )

    if plant < 95:
        priority_actions.append(
            (
                f"Review plant throughput ({throughput:.1f}%) "
                f"and recovery ({recovery:.1f}%) constraints."
            )
        )

    if (
        incidents > 0
        or near_misses > 0
        or critical_risks > 0
        or safety_score < 95
    ):
        priority_actions.append(
            (
                "Review the latest safety indicators and verify "
                "critical controls before the next shift "
                "handover."
            )
        )

    if not priority_actions:
        priority_actions.append(
            (
                "Maintain current operating controls and "
                "continue monitoring KPI performance against "
                "plan."
            )
        )

    priority_actions.append(
        (
            "Use the latest uploaded operational data for the "
            "daily management review and confirm accountable "
            "owners for any exceptions."
        )
    )

    story.extend(
        create_bullet_list(
            priority_actions
        )
    )

    story.append(
        create_vertical_space(14)
    )

    story.append(
        create_section_heading(
            "Management Commentary"
        )
    )

    attention_areas = []

    if fleet < 90:
        attention_areas.append("fleet performance")
    if ore < 100:
        attention_areas.append("ore production")
    if plant < 95:
        attention_areas.append("plant performance")
    if (
        incidents > 0
        or critical_risks > 0
        or safety_score < 95
    ):
        attention_areas.append("safety controls")

    if attention_areas:
        focus_text = ", ".join(attention_areas)
        commentary = (
            f"Leadership attention should focus on {focus_text}. "
            f"Mine Health is {health:.1f}, with ore at "
            f"{ore:.1f}% of plan, fleet at {fleet:.1f}%, "
            f"and plant at {plant:.1f}%. The management team "
            "should verify corrective actions against the "
            "latest uploaded operational data."
        )
    else:
        commentary = (
            f"Overall performance is stable. Mine Health is "
            f"{health:.1f}, ore achievement is {ore:.1f}%, "
            f"fleet performance is {fleet:.1f}%, and plant "
            f"performance is {plant:.1f}%. Continue routine "
            "monitoring and sustain current operating controls."
        )

    story.append(
        create_body_paragraph(
            commentary
        )
    )

    return build_pdf(
        story=story,
        report_name=report_name,
    )


def generate_weekly_operations_pdf(
    weekly_kpis: dict,
):
    """
    Generate the Weekly Operations Report from the latest
    seven available reporting days supplied by weekly_kpi_service.
    """
    report_name = "Weekly Operations Report"

    generated_at = datetime.now()

    mine_name = str(
        weekly_kpis.get(
            "mine_name",
            "Oyu Tolgoi Surface",
        )
        or "Oyu Tolgoi Surface"
    )

    period_start = str(
        weekly_kpis.get("period_start")
        or weekly_kpis.get("report_date")
        or generated_at.strftime("%Y-%m-%d")
    )

    period_end = str(
        weekly_kpis.get("period_end")
        or weekly_kpis.get("report_date")
        or generated_at.strftime("%Y-%m-%d")
    )

    report_period = (
        f"{period_start} to {period_end}"
    )

    health = float(
        weekly_kpis.get("health", 0) or 0
    )
    ore = float(
        weekly_kpis.get("ore", 0) or 0
    )
    waste = float(
        weekly_kpis.get("waste", 0) or 0
    )
    fleet = float(
        weekly_kpis.get("fleet", 0) or 0
    )
    availability = float(
        weekly_kpis.get("availability", 0) or 0
    )
    utilization = float(
        weekly_kpis.get("utilization", 0) or 0
    )
    plant = float(
        weekly_kpis.get("plant", 0) or 0
    )
    throughput = float(
        weekly_kpis.get("throughput", 0) or 0
    )
    recovery = float(
        weekly_kpis.get("recovery", 0) or 0
    )
    incidents = int(
        weekly_kpis.get("safety", 0) or 0
    )
    safety_score = float(
        weekly_kpis.get("safety_score", 0) or 0
    )
    near_misses = int(
        weekly_kpis.get("near_misses", 0) or 0
    )
    critical_risks = int(
        weekly_kpis.get("critical_risks", 0) or 0
    )

    days = list(
        weekly_kpis.get("days") or []
    )

    labels = [
        str(item.get("report_date", ""))[5:]
        for item in days
    ]

    production_values = [
        float(item.get("ore", 0) or 0)
        for item in days
    ]

    fleet_values = [
        float(item.get("availability", 0) or 0)
        for item in days
    ]

    plant_values = [
        float(item.get("throughput", 0) or 0)
        for item in days
    ]

    production_status = (
        "Stable"
        if ore >= 100
        else "Watch"
    )

    fleet_status = (
        "Stable"
        if fleet >= 90
        else "Watch"
    )

    plant_status = (
        "Stable"
        if plant >= 95
        else "Watch"
    )

    safety_status = (
        "Stable"
        if incidents == 0
        and critical_risks == 0
        and safety_score >= 95
        else "Watch"
    )

    story = []

    story.extend(
        create_report_header(
            report_title=report_name,
            mine_name=mine_name,
            company_name="Mine Manager AI",
            report_period=report_period,
            generated_at=generated_at,
        )
    )

    story.append(
        create_section_heading(
            "Weekly Executive Summary"
        )
    )

    story.append(
        create_body_paragraph(
            (
                f"{mine_name} recorded a weekly Mine Health score "
                f"of {health:.1f} for {period_start} to {period_end}. "
                f"Average ore achievement was {ore:.1f}% of plan, "
                f"waste achievement was {waste:.1f}%, fleet "
                f"performance was {fleet:.1f}%, and plant "
                f"performance was {plant:.1f}%. "
                f"The period recorded {incidents} incident(s), "
                f"{near_misses} near miss(es), and "
                f"{critical_risks} critical risk(s)."
            )
        )
    )

    story.append(
        create_vertical_space(10)
    )

    story.append(
        create_kpi_callouts(
            [
                {
                    "label": "Mine Health",
                    "value": f"{health:.1f}",
                },
                {
                    "label": "Ore",
                    "value": f"{ore:.1f}%",
                },
                {
                    "label": "Fleet",
                    "value": f"{fleet:.1f}%",
                },
                {
                    "label": "Plant",
                    "value": f"{plant:.1f}%",
                },
            ]
        )
    )

    if labels:
        story.append(
            create_vertical_space(16)
        )

        story.append(
            create_section_heading(
                "Production Performance Trend"
            )
        )

        story.append(
            create_chart_image(
                create_line_chart(
                    labels=labels,
                    values=production_values,
                    title="Daily Ore Achievement",
                    y_axis_label="% of Plan",
                    target_value=100,
                )
            )
        )

        story.append(
            create_vertical_space(16)
        )

        story.append(
            create_section_heading(
                "Fleet Availability Trend"
            )
        )

        story.append(
            create_chart_image(
                create_line_chart(
                    labels=labels,
                    values=fleet_values,
                    title="Fleet Availability",
                    y_axis_label="Availability (%)",
                    target_value=90,
                )
            )
        )

        story.append(
            create_vertical_space(16)
        )

        story.append(
            create_section_heading(
                "Plant Throughput Performance"
            )
        )

        story.append(
            create_chart_image(
                create_bar_chart(
                    labels=labels,
                    values=plant_values,
                    title="Daily Plant Throughput",
                    y_axis_label="% of Target",
                    target_value=100,
                )
            )
        )

    story.append(
        create_vertical_space(16)
    )

    story.append(
        create_section_heading(
            "Weekly KPI Performance"
        )
    )

    weekly_data = [
        [
            "KPI",
            "Weekly Status",
            "Performance",
            "Management Comment",
        ],
        [
            "Ore Production",
            production_status,
            f"{ore:.1f}% of plan",
            (
                f"Average ore achievement for the period was "
                f"{ore:.1f}% of plan."
            ),
        ],
        [
            "Waste Movement",
            (
                "Stable"
                if waste >= 100
                else "Watch"
            ),
            f"{waste:.1f}% of plan",
            (
                f"Average waste achievement for the period was "
                f"{waste:.1f}% of plan."
            ),
        ],
        [
            "Fleet",
            fleet_status,
            (
                f"{fleet:.1f}% performance | "
                f"{availability:.1f}% availability"
            ),
            (
                f"Average utilization was {utilization:.1f}% "
                "for the reporting period."
            ),
        ],
        [
            "Plant",
            plant_status,
            (
                f"{plant:.1f}% performance | "
                f"{throughput:.1f}% throughput"
            ),
            (
                f"Average recovery was {recovery:.1f}% "
                "for the reporting period."
            ),
        ],
        [
            "Safety",
            safety_status,
            (
                f"{incidents} incidents | "
                f"{safety_score:.1f}% score"
            ),
            (
                f"{near_misses} near miss(es) and "
                f"{critical_risks} critical risk(s) "
                "were recorded during the period."
            ),
        ],
    ]

    story.append(
        create_standard_table(
            data=weekly_data,
            column_widths=[
                28 * mm,
                28 * mm,
                43 * mm,
                60 * mm,
            ],
            header_color=BLUE_COLOR,
        )
    )

    story.append(
        create_vertical_space(16)
    )

    story.append(
        create_section_heading(
            "Weekly Recommendations"
        )
    )

    recommendations = []

    if ore < 100:
        recommendations.append(
            (
                f"Review ore production constraints and confirm "
                f"a recovery plan for weekly achievement of "
                f"{ore:.1f}%."
            )
        )

    if waste < 100:
        recommendations.append(
            (
                f"Review waste movement constraints and sequence "
                f"delivery with weekly achievement of {waste:.1f}%."
            )
        )

    if fleet < 90:
        recommendations.append(
            (
                f"Review fleet availability ({availability:.1f}%) "
                f"and utilization ({utilization:.1f}%) with "
                "operations and maintenance."
            )
        )

    if plant < 95:
        recommendations.append(
            (
                f"Review plant throughput ({throughput:.1f}%) "
                f"and recovery ({recovery:.1f}%) constraints."
            )
        )

    if (
        incidents > 0
        or near_misses > 0
        or critical_risks > 0
        or safety_score < 95
    ):
        recommendations.append(
            (
                "Review weekly safety indicators, verify critical "
                "controls, and close identified actions."
            )
        )

    if not recommendations:
        recommendations.append(
            (
                "Maintain current operating controls and continue "
                "weekly KPI monitoring against plan."
            )
        )

    recommendations.append(
        (
            "Confirm accountable owners and due dates for all "
            "material weekly KPI exceptions."
        )
    )

    story.extend(
        create_bullet_list(
            recommendations
        )
    )

    story.append(
        create_vertical_space(14)
    )

    story.append(
        create_section_heading(
            "Leadership Focus"
        )
    )

    focus_areas = []

    if ore < 100:
        focus_areas.append("ore production")
    if waste < 100:
        focus_areas.append("waste movement")
    if fleet < 90:
        focus_areas.append("fleet performance")
    if plant < 95:
        focus_areas.append("plant performance")
    if (
        incidents > 0
        or critical_risks > 0
        or safety_score < 95
    ):
        focus_areas.append("safety controls")

    if focus_areas:
        leadership_text = (
            "Leadership attention should remain focused on "
            + ", ".join(focus_areas)
            + ". "
            + f"Weekly Mine Health was {health:.1f}, with ore "
              f"at {ore:.1f}% of plan, fleet performance at "
              f"{fleet:.1f}%, and plant performance at "
              f"{plant:.1f}%."
        )
    else:
        leadership_text = (
            f"Overall weekly performance remained stable. "
            f"Mine Health was {health:.1f}, ore achievement was "
            f"{ore:.1f}%, fleet performance was {fleet:.1f}%, "
            f"and plant performance was {plant:.1f}%."
        )

    story.append(
        create_body_paragraph(
            leadership_text
        )
    )

    return build_pdf(
        story=story,
        report_name=report_name,
    )


def generate_monthly_kpi_pdf(
    monthly_kpis: dict,
):
    """
    Generate the Monthly KPI Pack from the latest
    30 available reporting days supplied by monthly_kpi_service.
    """
    report_name = "Monthly KPI Pack"

    generated_at = datetime.now()

    mine_name = str(
        monthly_kpis.get(
            "mine_name",
            "Oyu Tolgoi Surface",
        )
        or "Oyu Tolgoi Surface"
    )

    period_start = str(
        monthly_kpis.get("period_start")
        or monthly_kpis.get("report_date")
        or generated_at.strftime("%Y-%m-%d")
    )

    period_end = str(
        monthly_kpis.get("period_end")
        or monthly_kpis.get("report_date")
        or generated_at.strftime("%Y-%m-%d")
    )

    report_period = (
        f"{period_start} to {period_end}"
    )

    health = float(
        monthly_kpis.get("health", 0) or 0
    )
    ore = float(
        monthly_kpis.get("ore", 0) or 0
    )
    waste = float(
        monthly_kpis.get("waste", 0) or 0
    )

    ore_plan = float(
        monthly_kpis.get("ore_plan", 0) or 0
    )
    ore_actual = float(
        monthly_kpis.get("ore_actual", 0) or 0
    )
    waste_plan = float(
        monthly_kpis.get("waste_plan", 0) or 0
    )
    waste_actual = float(
        monthly_kpis.get("waste_actual", 0) or 0
    )

    fleet = float(
        monthly_kpis.get("fleet", 0) or 0
    )
    availability = float(
        monthly_kpis.get("availability", 0) or 0
    )
    utilization = float(
        monthly_kpis.get("utilization", 0) or 0
    )

    plant = float(
        monthly_kpis.get("plant", 0) or 0
    )
    throughput = float(
        monthly_kpis.get("throughput", 0) or 0
    )
    recovery = float(
        monthly_kpis.get("recovery", 0) or 0
    )

    incidents = int(
        monthly_kpis.get("safety", 0) or 0
    )
    safety_score = float(
        monthly_kpis.get("safety_score", 0) or 0
    )
    near_misses = int(
        monthly_kpis.get("near_misses", 0) or 0
    )
    critical_risks = int(
        monthly_kpis.get("critical_risks", 0) or 0
    )

    health_target = 85.0
    ore_target = 100.0
    waste_target = 100.0
    availability_target = 90.0
    throughput_target = 100.0

    def status_label(
        value: float,
        target: float,
        strong_margin: float = 3.0,
    ) -> str:
        if value >= target + strong_margin:
            return "Above Target"
        if value >= target:
            return "On Track"
        return "Watch"

    health_status = (
        "On Track"
        if health >= health_target
        else "Watch"
    )
    ore_status = status_label(
        ore,
        ore_target,
    )
    waste_status = status_label(
        waste,
        waste_target,
    )
    fleet_status = (
        "On Track"
        if availability >= availability_target
        else "Watch"
    )
    plant_status = status_label(
        throughput,
        throughput_target,
    )
    safety_status = (
        "On Track"
        if incidents == 0
        and critical_risks == 0
        else "Watch"
    )

    story = []

    story.extend(
        create_report_header(
            report_title=report_name,
            mine_name=mine_name,
            company_name="Mine Manager AI",
            report_period=report_period,
            generated_at=generated_at,
        )
    )

    story.append(
        create_section_heading(
            "Executive Summary"
        )
    )

    story.append(
        create_body_paragraph(
            (
                f"{mine_name} recorded a monthly Mine Health score "
                f"of {health:.1f} for {period_start} to {period_end}. "
                f"Ore achievement was {ore:.1f}% of plan and waste "
                f"achievement was {waste:.1f}%. Fleet performance "
                f"averaged {fleet:.1f}%, while plant performance "
                f"averaged {plant:.1f}%. The period recorded "
                f"{incidents} incident(s), {near_misses} near "
                f"miss(es), and {critical_risks} critical risk(s)."
            )
        )
    )

    story.append(
        create_vertical_space(10)
    )

    story.append(
        create_kpi_callouts(
            [
                {
                    "label": "Mine Health",
                    "value": f"{health:.1f}",
                },
                {
                    "label": "Ore Achievement",
                    "value": f"{ore:.1f}%",
                },
                {
                    "label": "Waste Achievement",
                    "value": f"{waste:.1f}%",
                },
                {
                    "label": "Safety Events",
                    "value": str(incidents),
                },
            ]
        )
    )

    story.append(
        create_vertical_space(16)
    )

    story.append(
        create_section_heading(
            "Monthly KPI Summary"
        )
    )

    monthly_kpi_data = [
        [
            "KPI",
            "Target",
            "Actual",
            "Variance",
            "Status",
        ],
        [
            "Mine Health Score",
            f"{health_target:.0f}",
            f"{health:.1f}",
            f"{health - health_target:+.1f}",
            health_status,
        ],
        [
            "Ore Achievement",
            f"{ore_target:.0f}%",
            f"{ore:.1f}%",
            f"{ore - ore_target:+.1f}%",
            ore_status,
        ],
        [
            "Waste Achievement",
            f"{waste_target:.0f}%",
            f"{waste:.1f}%",
            f"{waste - waste_target:+.1f}%",
            waste_status,
        ],
        [
            "Fleet Availability",
            f"{availability_target:.0f}%",
            f"{availability:.1f}%",
            f"{availability - availability_target:+.1f}%",
            fleet_status,
        ],
        [
            "Plant Throughput",
            f"{throughput_target:.0f}%",
            f"{throughput:.1f}%",
            f"{throughput - throughput_target:+.1f}%",
            plant_status,
        ],
        [
            "Safety Events",
            "0",
            str(incidents),
            f"{incidents:+d}",
            safety_status,
        ],
    ]

    story.append(
        create_standard_table(
            data=monthly_kpi_data,
            column_widths=[
                47 * mm,
                27 * mm,
                27 * mm,
                27 * mm,
                31 * mm,
            ],
            header_color=PRIMARY_COLOR,
        )
    )

    story.append(
        create_vertical_space(16)
    )

    story.append(
        create_section_heading(
            "Production Performance"
        )
    )

    production_data = [
        [
            "Metric",
            "Monthly Plan",
            "Monthly Actual",
            "Achievement",
            "Management Commentary",
        ],
        [
            "Ore Movement",
            f"{ore_plan:,.0f} t",
            f"{ore_actual:,.0f} t",
            f"{ore:.1f}%",
            (
                "Ore movement was "
                + (
                    "at or above"
                    if ore >= 100
                    else "below"
                )
                + " the monthly plan."
            ),
        ],
        [
            "Waste Movement",
            f"{waste_plan:,.0f} t",
            f"{waste_actual:,.0f} t",
            f"{waste:.1f}%",
            (
                "Waste movement was "
                + (
                    "at or above"
                    if waste >= 100
                    else "below"
                )
                + " the monthly plan."
            ),
        ],
    ]

    story.append(
        create_standard_table(
            data=production_data,
            column_widths=[
                31 * mm,
                31 * mm,
                31 * mm,
                27 * mm,
                39 * mm,
            ],
            header_color=BLUE_COLOR,
        )
    )

    story.append(
        create_vertical_space(16)
    )

    story.append(
        create_section_heading(
            "Department Performance"
        )
    )

    mining_performance = round(
        (ore + waste) / 2,
        1,
    )

    department_data = [
        [
            "Department",
            "Performance",
            "Status",
            "Executive Commentary",
        ],
        [
            "Mining",
            f"{mining_performance:.1f}%",
            (
                "Stable"
                if mining_performance >= 100
                else "Watch"
            ),
            (
                f"Ore achievement was {ore:.1f}% and waste "
                f"achievement was {waste:.1f}% for the month."
            ),
        ],
        [
            "Fleet",
            f"{fleet:.1f}%",
            (
                "Stable"
                if fleet >= 90
                else "Watch"
            ),
            (
                f"Availability averaged {availability:.1f}% and "
                f"utilization averaged {utilization:.1f}%."
            ),
        ],
        [
            "Plant",
            f"{plant:.1f}%",
            (
                "Stable"
                if plant >= 95
                else "Watch"
            ),
            (
                f"Throughput averaged {throughput:.1f}% and "
                f"recovery averaged {recovery:.1f}%."
            ),
        ],
        [
            "Safety",
            f"{incidents} event(s)",
            safety_status,
            (
                f"Safety score averaged {safety_score:.1f}%, "
                f"with {near_misses} near miss(es) and "
                f"{critical_risks} critical risk(s)."
            ),
        ],
    ]

    story.append(
        create_standard_table(
            data=department_data,
            column_widths=[
                32 * mm,
                31 * mm,
                27 * mm,
                69 * mm,
            ],
            header_color=PRIMARY_COLOR,
        )
    )

    story.append(
        create_vertical_space(16)
    )

    story.append(
        create_section_heading(
            "Key Risks and Opportunities"
        )
    )

    risk_data = [
        [
            "Item",
            "Level",
            "Potential Impact",
            "Management Response",
        ],
    ]

    if ore < 100:
        risk_data.append(
            [
                "Ore production below plan",
                "Medium",
                (
                    f"Monthly ore achievement of {ore:.1f}% "
                    "may constrain production delivery."
                ),
                (
                    "Review production constraints and confirm "
                    "the next-month recovery plan."
                ),
            ]
        )

    if waste < 100:
        risk_data.append(
            [
                "Waste movement below plan",
                "Medium",
                (
                    f"Monthly waste achievement of {waste:.1f}% "
                    "may affect mining sequence flexibility."
                ),
                (
                    "Review waste sequence constraints and "
                    "equipment allocation."
                ),
            ]
        )

    if fleet < 90 or utilization < 85:
        risk_data.append(
            [
                "Fleet performance below target",
                "Medium",
                (
                    f"Fleet performance averaged {fleet:.1f}% "
                    f"with utilization at {utilization:.1f}%."
                ),
                (
                    "Review availability, utilization, dispatch "
                    "and maintenance constraints."
                ),
            ]
        )

    if plant < 95 or throughput < 100:
        risk_data.append(
            [
                "Plant performance below target",
                "Medium",
                (
                    f"Plant performance averaged {plant:.1f}% "
                    f"with throughput at {throughput:.1f}%."
                ),
                (
                    "Review throughput and recovery constraints "
                    "with processing leadership."
                ),
            ]
        )

    if incidents > 0 or critical_risks > 0:
        risk_data.append(
            [
                "Safety exposure requires action",
                "High",
                (
                    f"The month recorded {incidents} incident(s), "
                    f"{near_misses} near miss(es), and "
                    f"{critical_risks} critical risk(s)."
                ),
                (
                    "Verify critical controls, investigate "
                    "events, and close corrective actions."
                ),
            ]
        )

    if len(risk_data) == 1:
        risk_data.append(
            [
                "No major monthly KPI exception",
                "Low",
                (
                    "Key operational KPIs remained within "
                    "current monthly thresholds."
                ),
                (
                    "Maintain operating controls and continue "
                    "routine KPI monitoring."
                ),
            ]
        )

    story.append(
        create_standard_table(
            data=risk_data,
            column_widths=[
                42 * mm,
                27 * mm,
                45 * mm,
                45 * mm,
            ],
            header_color=BLUE_COLOR,
        )
    )

    story.append(
        create_vertical_space(16)
    )

    story.append(
        create_section_heading(
            "Management Actions"
        )
    )

    management_actions = []

    if ore < 100:
        management_actions.append(
            (
                f"Confirm the next-month ore production recovery "
                f"plan following monthly achievement of {ore:.1f}%."
            )
        )

    if waste < 100:
        management_actions.append(
            (
                f"Review waste movement sequence and equipment "
                f"allocation following achievement of {waste:.1f}%."
            )
        )

    if fleet < 90 or utilization < 85:
        management_actions.append(
            (
                f"Review fleet availability ({availability:.1f}%) "
                f"and utilization ({utilization:.1f}%) with "
                "operations and maintenance."
            )
        )

    if plant < 95 or throughput < 100:
        management_actions.append(
            (
                f"Review plant throughput ({throughput:.1f}%) "
                f"and recovery ({recovery:.1f}%) constraints."
            )
        )

    if incidents > 0 or near_misses > 0 or critical_risks > 0:
        management_actions.append(
            (
                "Review monthly safety performance, verify "
                "critical controls, and close all required "
                "corrective actions."
            )
        )

    if not management_actions:
        management_actions.append(
            (
                "Maintain current operating controls and continue "
                "monthly KPI monitoring against plan."
            )
        )

    management_actions.append(
        (
            "Prepare updated KPI commentary and accountable "
            "actions for the monthly leadership review."
        )
    )

    story.extend(
        create_bullet_list(
            management_actions
        )
    )

    story.append(
        create_vertical_space(14)
    )

    story.append(
        create_section_heading(
            "Executive Commentary"
        )
    )

    attention_areas = []

    if ore < 100:
        attention_areas.append("ore production")
    if waste < 100:
        attention_areas.append("waste movement")
    if fleet < 90 or utilization < 85:
        attention_areas.append("fleet performance")
    if plant < 95 or throughput < 100:
        attention_areas.append("plant performance")
    if incidents > 0 or critical_risks > 0:
        attention_areas.append("safety controls")

    if attention_areas:
        commentary = (
            "Leadership attention should remain focused on "
            + ", ".join(attention_areas)
            + ". "
            + f"Monthly Mine Health was {health:.1f}, ore "
              f"achievement was {ore:.1f}%, fleet performance "
              f"was {fleet:.1f}%, and plant performance was "
              f"{plant:.1f}%."
        )
    else:
        commentary = (
            f"Overall monthly performance remained stable. "
            f"Mine Health was {health:.1f}, ore achievement "
            f"was {ore:.1f}%, fleet performance was "
            f"{fleet:.1f}%, and plant performance was "
            f"{plant:.1f}%."
        )

    story.append(
        create_body_paragraph(
            commentary
        )
    )

    return build_pdf(
        story=story,
        report_name=report_name,
    )
