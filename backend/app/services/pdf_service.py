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

    The report adapts its executive KPI structure to the
    active operation profile.

    Standard mine:
        - Mine Health
        - Ore / Waste
        - Fleet
        - Plant
        - Safety

    SX-EW copper:
        - Mine Health
        - Cathode Production
        - Plant
        - Safety

    Non-applicable KPIs are excluded rather than displayed
    as artificial zero-performance values.
    """

    report_name = "Daily Executive Report"
    generated_at = datetime.now()

    mine_name = str(
        live_kpis.get(
            "mine_name",
            "Mine Operation",
        )
        or "Mine Operation"
    )

    operation_profile = str(
        live_kpis.get(
            "operation_profile",
            "standard_mine",
        )
        or "standard_mine"
    ).strip().lower()

    is_sxew = (
        operation_profile
        == "sxew_copper"
    )

    waste_applicable = bool(
        live_kpis.get(
            "waste_applicable",
            not is_sxew,
        )
    )

    fleet_applicable = bool(
        live_kpis.get(
            "fleet_applicable",
            not is_sxew,
        )
    )

    production_label = str(
        live_kpis.get(
            "production_label",
            (
                "Cathode Production"
                if is_sxew
                else "Ore Production"
            ),
        )
        or (
            "Cathode Production"
            if is_sxew
            else "Ore Production"
        )
    )

    production_short_label = (
        "Cathode"
        if is_sxew
        else "Ore"
    )

    report_period = str(
        live_kpis.get(
            "report_date"
        )
        or generated_at.strftime(
            "%Y-%m-%d"
        )
    )

    health = float(
        live_kpis.get(
            "health",
            0,
        )
        or 0
    )

    ore = float(
        live_kpis.get(
            "ore",
            0,
        )
        or 0
    )

    waste = float(
        live_kpis.get(
            "waste",
            0,
        )
        or 0
    )

    fleet = float(
        live_kpis.get(
            "fleet",
            0,
        )
        or 0
    )

    availability = float(
        live_kpis.get(
            "availability",
            0,
        )
        or 0
    )

    utilization = float(
        live_kpis.get(
            "utilization",
            0,
        )
        or 0
    )

    plant = float(
        live_kpis.get(
            "plant",
            0,
        )
        or 0
    )

    throughput = float(
        live_kpis.get(
            "throughput",
            0,
        )
        or 0
    )

    recovery = float(
        live_kpis.get(
            "recovery",
            0,
        )
        or 0
    )

    incidents = int(
        live_kpis.get(
            "safety",
            0,
        )
        or 0
    )

    safety_score = float(
        live_kpis.get(
            "safety_score",
            0,
        )
        or 0
    )

    near_misses = int(
        live_kpis.get(
            "near_misses",
            0,
        )
        or 0
    )

    critical_risks = int(
        live_kpis.get(
            "critical_risks",
            0,
        )
        or 0
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
        if (
            incidents == 0
            and critical_risks == 0
            and safety_score >= 95
        )
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

    # ==================================================
    # EXECUTIVE SUMMARY
    # ==================================================

    story.append(
        create_section_heading(
            "Executive Summary"
        )
    )

    if is_sxew:
        executive_summary = (
            f"{mine_name} reported a Mine Health score of "
            f"{health:.1f} for {report_period}. "
            f"Cathode production achievement was "
            f"{ore:.1f}% of plan, while plant performance "
            f"was {plant:.1f}%. "
            f"The latest safety result recorded "
            f"{incidents} incident(s), "
            f"{near_misses} near miss(es), and "
            f"{critical_risks} critical risk(s)."
        )
    else:
        performance_parts = [
            (
                f"Ore achievement was "
                f"{ore:.1f}% of plan"
            )
        ]

        if waste_applicable:
            performance_parts.append(
                (
                    f"waste achievement was "
                    f"{waste:.1f}% of plan"
                )
            )

        if fleet_applicable:
            performance_parts.append(
                (
                    f"fleet performance was "
                    f"{fleet:.1f}%"
                )
            )

        performance_parts.append(
            (
                f"plant performance was "
                f"{plant:.1f}%"
            )
        )

        executive_summary = (
            f"{mine_name} reported a Mine Health score of "
            f"{health:.1f} for {report_period}. "
            f"{', '.join(performance_parts)}. "
            f"The latest safety result recorded "
            f"{incidents} incident(s), "
            f"{near_misses} near miss(es), and "
            f"{critical_risks} critical risk(s)."
        )

    story.append(
        create_body_paragraph(
            executive_summary
        )
    )

    story.append(
        create_vertical_space(
            10
        )
    )

    # ==================================================
    # KPI CALLOUTS
    # ==================================================

    kpi_callouts = [
        {
            "label": "Mine Health",
            "value": (
                f"{health:.1f}"
            ),
        },
        {
            "label": production_short_label,
            "value": (
                f"{ore:.1f}%"
            ),
        },
    ]

    if fleet_applicable:
        kpi_callouts.append(
            {
                "label": "Fleet",
                "value": (
                    f"{fleet:.1f}%"
                ),
            }
        )
    else:
        kpi_callouts.append(
            {
                "label": "Plant",
                "value": (
                    f"{plant:.1f}%"
                ),
            }
        )

    kpi_callouts.append(
        {
            "label": "Safety Score",
            "value": (
                f"{safety_score:.1f}%"
            ),
        }
    )

    story.append(
        create_kpi_callouts(
            kpi_callouts
        )
    )

    story.append(
        create_vertical_space(
            16
        )
    )

    # ==================================================
    # OPERATIONAL PERFORMANCE
    # ==================================================

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
    ]

    if is_sxew:
        kpi_data.append(
            [
                production_label,
                production_status,
                (
                    f"{ore:.1f}% of plan"
                ),
                (
                    "Latest uploaded production data "
                    "shows cathode production at "
                    f"{ore:.1f}% of plan."
                ),
            ]
        )
    else:
        if waste_applicable:
            production_performance = (
                f"Ore {ore:.1f}% | "
                f"Waste {waste:.1f}%"
            )

            production_commentary = (
                "Latest uploaded production data "
                f"shows ore at {ore:.1f}% and waste "
                f"at {waste:.1f}% of plan."
            )
        else:
            production_performance = (
                f"Ore {ore:.1f}%"
            )

            production_commentary = (
                "Latest uploaded production data "
                f"shows ore at {ore:.1f}% of plan."
            )

        kpi_data.append(
            [
                "Production",
                production_status,
                production_performance,
                production_commentary,
            ]
        )

    if fleet_applicable:
        kpi_data.append(
            [
                "Fleet",
                fleet_status,
                (
                    f"{fleet:.1f}% performance | "
                    f"{availability:.1f}% availability"
                ),
                (
                    f"Fleet utilization is "
                    f"{utilization:.1f}%. "
                    "Review operating and maintenance "
                    "constraints if performance remains "
                    "below target."
                ),
            ]
        )

    kpi_data.append(
        [
            "Plant",
            plant_status,
            (
                f"{plant:.1f}% performance | "
                f"{throughput:.1f}% throughput"
            ),
            (
                f"Plant recovery is "
                f"{recovery:.1f}%. "
                "Continue monitoring throughput and "
                "recovery against operating targets."
            ),
        ]
    )

    kpi_data.append(
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
                "were reported in the latest "
                "uploaded data."
            ),
        ]
    )

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
        create_vertical_space(
            16
        )
    )

    # ==================================================
    # KEY RISKS
    # ==================================================

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

    if (
        fleet_applicable
        and fleet < 90
    ):
        risk_data.append(
            [
                "Fleet performance below target",
                "Medium",
                (
                    "Lower fleet effectiveness may "
                    "constrain production delivery."
                ),
                (
                    "Review availability, utilization, "
                    "delays, and maintenance priorities."
                ),
            ]
        )

    if ore < 100:
        if is_sxew:
            risk_data.append(
                [
                    "Cathode production below plan",
                    "Medium",
                    (
                        "Below-plan cathode production "
                        "may affect daily metal delivery."
                    ),
                    (
                        "Review leach, SX and EW "
                        "constraints and confirm the "
                        "production recovery plan."
                    ),
                ]
            )
        else:
            risk_data.append(
                [
                    "Ore production below plan",
                    "Medium",
                    (
                        "Below-plan ore movement may "
                        "affect daily production delivery."
                    ),
                    (
                        "Review production constraints "
                        "and confirm the recovery plan."
                    ),
                ]
            )

    if plant < 95:
        risk_data.append(
            [
                "Plant performance below target",
                "Medium",
                (
                    "Plant constraints may reduce "
                    "processing performance."
                ),
                (
                    "Review throughput and recovery "
                    "constraints with the processing "
                    "team."
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
                    if (
                        incidents > 0
                        or critical_risks > 0
                    )
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

    if len(
        risk_data
    ) == 1:
        risk_data.append(
            [
                "No major KPI exception detected",
                "Low",
                (
                    "Latest operational KPIs are within "
                    "the current report thresholds."
                ),
                (
                    "Maintain controls and continue "
                    "routine performance monitoring."
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
        create_vertical_space(
            16
        )
    )

    # ==================================================
    # PRIORITY ACTIONS
    # ==================================================

    story.append(
        create_section_heading(
            "Priority Actions"
        )
    )

    priority_actions = []

    if (
        fleet_applicable
        and fleet < 90
    ):
        priority_actions.append(
            (
                "Review fleet availability and "
                "utilization performance "
                f"({availability:.1f}% / "
                f"{utilization:.1f}%) with operations "
                "and maintenance."
            )
        )

    if ore < 100:
        if is_sxew:
            priority_actions.append(
                (
                    "Confirm the cathode production "
                    "recovery plan for achievement "
                    f"currently at {ore:.1f}% of plan "
                    "and review leach, SX and EW "
                    "constraints."
                )
            )
        else:
            priority_actions.append(
                (
                    "Confirm the production recovery "
                    "plan for ore achievement currently "
                    f"at {ore:.1f}% of plan."
                )
            )

    if plant < 95:
        priority_actions.append(
            (
                f"Review plant throughput "
                f"({throughput:.1f}%) and recovery "
                f"({recovery:.1f}%) constraints."
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
                "Review the latest safety indicators "
                "and verify critical controls before "
                "the next shift handover."
            )
        )

    if not priority_actions:
        priority_actions.append(
            (
                "Maintain current operating controls "
                "and continue monitoring KPI "
                "performance against plan."
            )
        )

    priority_actions.append(
        (
            "Use the latest uploaded operational data "
            "for the daily management review and "
            "confirm accountable owners for any "
            "exceptions."
        )
    )

    story.extend(
        create_bullet_list(
            priority_actions
        )
    )

    story.append(
        create_vertical_space(
            14
        )
    )

    # ==================================================
    # MANAGEMENT COMMENTARY
    # ==================================================

    story.append(
        create_section_heading(
            "Management Commentary"
        )
    )

    attention_areas = []

    if (
        fleet_applicable
        and fleet < 90
    ):
        attention_areas.append(
            "fleet performance"
        )

    if ore < 100:
        attention_areas.append(
            (
                "cathode production"
                if is_sxew
                else "ore production"
            )
        )

    if plant < 95:
        attention_areas.append(
            "plant performance"
        )

    if (
        incidents > 0
        or critical_risks > 0
        or safety_score < 95
    ):
        attention_areas.append(
            "safety controls"
        )

    if is_sxew:
        if attention_areas:
            focus_text = ", ".join(
                attention_areas
            )

            commentary = (
                "Leadership attention should focus on "
                f"{focus_text}. "
                f"Mine Health is {health:.1f}, "
                f"cathode production is {ore:.1f}% "
                f"of plan, and plant performance is "
                f"{plant:.1f}%. "
                "The management team should verify "
                "corrective actions against the latest "
                "uploaded operational data."
            )
        else:
            commentary = (
                "Overall performance is stable. "
                f"Mine Health is {health:.1f}, "
                f"cathode production achievement is "
                f"{ore:.1f}%, and plant performance "
                f"is {plant:.1f}%. "
                "Continue routine monitoring and "
                "sustain current operating controls."
            )
    else:
        if attention_areas:
            focus_text = ", ".join(
                attention_areas
            )

            if fleet_applicable:
                performance_text = (
                    f"Mine Health is {health:.1f}, "
                    f"with ore at {ore:.1f}% of plan, "
                    f"fleet at {fleet:.1f}%, and plant "
                    f"at {plant:.1f}%."
                )
            else:
                performance_text = (
                    f"Mine Health is {health:.1f}, "
                    f"with ore at {ore:.1f}% of plan "
                    f"and plant at {plant:.1f}%."
                )

            commentary = (
                "Leadership attention should focus on "
                f"{focus_text}. "
                f"{performance_text} "
                "The management team should verify "
                "corrective actions against the latest "
                "uploaded operational data."
            )
        else:
            if fleet_applicable:
                commentary = (
                    "Overall performance is stable. "
                    f"Mine Health is {health:.1f}, "
                    f"ore achievement is {ore:.1f}%, "
                    f"fleet performance is "
                    f"{fleet:.1f}%, and plant "
                    f"performance is {plant:.1f}%. "
                    "Continue routine monitoring and "
                    "sustain current operating controls."
                )
            else:
                commentary = (
                    "Overall performance is stable. "
                    f"Mine Health is {health:.1f}, "
                    f"ore achievement is {ore:.1f}%, "
                    f"and plant performance is "
                    f"{plant:.1f}%. "
                    "Continue routine monitoring and "
                    "sustain current operating controls."
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
    reporting days supplied by weekly_kpi_service.

    The report adapts its executive KPI structure to the active
    operation profile.

    Standard mine:
        - Mine Health
        - Ore / Waste
        - Fleet
        - Plant
        - Safety

    SX-EW copper:
        - Mine Health
        - Cathode Production
        - Plant Throughput
        - Plant Recovery
        - Safety

    Non-applicable KPIs are excluded rather than displayed as
    artificial zero-performance values.
    """

    report_name = "Weekly Operations Report"
    generated_at = datetime.now()

    mine_name = str(
        weekly_kpis.get("mine_name")
        or "Configured Operation"
    ).strip()

    operation_profile = str(
        weekly_kpis.get(
            "operation_profile",
            "standard_mine",
        )
        or "standard_mine"
    ).strip().lower()

    operation_profile = (
        operation_profile
        .replace("-", "_")
        .replace(" ", "_")
    )

    is_sxew = (
        operation_profile
        in {
            "sxew",
            "sx_ew",
            "sxew_copper",
            "copper_sxew",
            "copper_cathode",
            "cathode",
        }
    )

    production_label = str(
        weekly_kpis.get("production_label")
        or (
            "Cathode Production"
            if is_sxew
            else "Ore Production"
        )
    )

    production_short_label = (
        "Cathode"
        if is_sxew
        else "Ore"
    )

    waste_applicable = bool(
        weekly_kpis.get(
            "waste_applicable",
            not is_sxew,
        )
    )

    fleet_applicable = bool(
        weekly_kpis.get(
            "fleet_applicable",
            not is_sxew,
        )
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
        weekly_kpis.get("health", 0)
        or 0
    )

    production = float(
        weekly_kpis.get("ore", 0)
        or 0
    )

    waste = float(
        weekly_kpis.get("waste", 0)
        or 0
    )

    fleet = float(
        weekly_kpis.get("fleet", 0)
        or 0
    )

    availability = float(
        weekly_kpis.get("availability", 0)
        or 0
    )

    utilization = float(
        weekly_kpis.get("utilization", 0)
        or 0
    )

    plant = float(
        weekly_kpis.get("plant", 0)
        or 0
    )

    throughput = float(
        weekly_kpis.get("throughput", 0)
        or 0
    )

    recovery = float(
        weekly_kpis.get("recovery", 0)
        or 0
    )

    incidents = int(
        weekly_kpis.get("safety", 0)
        or 0
    )

    safety_score = float(
        weekly_kpis.get("safety_score", 0)
        or 0
    )

    near_misses = int(
        weekly_kpis.get("near_misses", 0)
        or 0
    )

    critical_risks = int(
        weekly_kpis.get("critical_risks", 0)
        or 0
    )

    days = list(
        weekly_kpis.get("days")
        or []
    )

    production_status = (
        "Stable"
        if production >= 100
        else "Watch"
    )

    waste_status = (
        "Stable"
        if waste >= 100
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

    throughput_status = (
        "Stable"
        if throughput >= 100
        else "Watch"
    )

    recovery_status = (
        "Stable"
        if recovery >= 90
        else "Watch"
    )

    safety_status = (
        "Stable"
        if (
            incidents == 0
            and critical_risks == 0
            and safety_score >= 95
        )
        else "Watch"
    )

    labels = [
        str(
            item.get(
                "report_date",
                "",
            )
        )[5:]
        for item in days
    ]

    production_values = [
        float(
            item.get(
                "ore",
                0,
            )
            or 0
        )
        for item in days
    ]

    fleet_values = [
        float(
            item.get(
                "availability",
                0,
            )
            or 0
        )
        for item in days
    ]

    plant_values = [
        float(
            item.get(
                "throughput",
                0,
            )
            or 0
        )
        for item in days
    ]

    recovery_values = [
        float(
            item.get(
                "recovery",
                0,
            )
            or 0
        )
        for item in days
    ]

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

    if is_sxew:
        executive_summary = (
            f"{mine_name} recorded a weekly Mine Health score "
            f"of {health:.1f} for {period_start} to {period_end}. "
            f"Average cathode production achievement was "
            f"{production:.1f}% of plan. "
            f"Plant throughput averaged {throughput:.1f}% of target "
            f"and metallurgical recovery averaged {recovery:.1f}%. "
            f"The period recorded {incidents} incident(s), "
            f"{near_misses} near miss(es), and "
            f"{critical_risks} critical risk(s)."
        )
    else:
        performance_parts = [
            (
                f"Average ore achievement was "
                f"{production:.1f}% of plan"
            )
        ]

        if waste_applicable:
            performance_parts.append(
                (
                    f"waste achievement was "
                    f"{waste:.1f}%"
                )
            )

        if fleet_applicable:
            performance_parts.append(
                (
                    f"fleet performance was "
                    f"{fleet:.1f}%"
                )
            )

        performance_parts.append(
            (
                f"plant performance was "
                f"{plant:.1f}%"
            )
        )

        executive_summary = (
            f"{mine_name} recorded a weekly Mine Health score "
            f"of {health:.1f} for {period_start} to {period_end}. "
            f"{', '.join(performance_parts)}. "
            f"The period recorded {incidents} incident(s), "
            f"{near_misses} near miss(es), and "
            f"{critical_risks} critical risk(s)."
        )

    story.append(
        create_body_paragraph(
            executive_summary
        )
    )

    story.append(
        create_vertical_space(10)
    )

    if is_sxew:
        kpi_callouts = [
            {
                "label": "Mine Health",
                "value": f"{health:.1f}",
            },
            {
                "label": "Cathode",
                "value": f"{production:.1f}%",
            },
            {
                "label": "Plant Throughput",
                "value": f"{throughput:.1f}%",
            },
            {
                "label": "Safety Score",
                "value": f"{safety_score:.1f}%",
            },
        ]
    else:
        kpi_callouts = [
            {
                "label": "Mine Health",
                "value": f"{health:.1f}",
            },
            {
                "label": production_short_label,
                "value": f"{production:.1f}%",
            },
        ]

        if fleet_applicable:
            kpi_callouts.append(
                {
                    "label": "Fleet",
                    "value": f"{fleet:.1f}%",
                }
            )
        else:
            kpi_callouts.append(
                {
                    "label": "Plant",
                    "value": f"{plant:.1f}%",
                }
            )

        kpi_callouts.append(
            {
                "label": "Safety Score",
                "value": f"{safety_score:.1f}%",
            }
        )

    story.append(
        create_kpi_callouts(
            kpi_callouts
        )
    )

    if labels:
        story.append(
            create_vertical_space(16)
        )

        story.append(
            create_section_heading(
                (
                    "Cathode Production Trend"
                    if is_sxew
                    else "Production Performance Trend"
                )
            )
        )

        story.append(
            create_chart_image(
                create_line_chart(
                    labels=labels,
                    values=production_values,
                    title=(
                        "Daily Cathode Achievement"
                        if is_sxew
                        else "Daily Ore Achievement"
                    ),
                    y_axis_label="% of Plan",
                    target_value=100,
                )
            )
        )

        if fleet_applicable:
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

        if is_sxew and recovery_values:
            story.append(
                create_vertical_space(16)
            )

            story.append(
                create_section_heading(
                    "Plant Recovery Performance"
                )
            )

            story.append(
                create_chart_image(
                    create_line_chart(
                        labels=labels,
                        values=recovery_values,
                        title="Daily Plant Recovery",
                        y_axis_label="Recovery (%)",
                        target_value=90,
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
    ]

    if is_sxew:
        weekly_data.extend(
            [
                [
                    "Cathode Production",
                    production_status,
                    f"{production:.1f}% of plan",
                    (
                        "Average cathode production achievement "
                        f"for the period was {production:.1f}% of plan."
                    ),
                ],
                [
                    "Plant Throughput",
                    throughput_status,
                    f"{throughput:.1f}% of target",
                    (
                        "Average plant throughput achievement "
                        f"for the period was {throughput:.1f}%."
                    ),
                ],
                [
                    "Plant Recovery",
                    recovery_status,
                    f"{recovery:.1f}%",
                    (
                        "Average metallurgical recovery for the period "
                        f"was {recovery:.1f}%."
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
        )
    else:
        weekly_data.append(
            [
                "Ore Production",
                production_status,
                f"{production:.1f}% of plan",
                (
                    "Average ore achievement for the period was "
                    f"{production:.1f}% of plan."
                ),
            ]
        )

        if waste_applicable:
            weekly_data.append(
                [
                    "Waste Movement",
                    waste_status,
                    f"{waste:.1f}% of plan",
                    (
                        "Average waste achievement for the period was "
                        f"{waste:.1f}% of plan."
                    ),
                ]
            )

        if fleet_applicable:
            weekly_data.append(
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
                ]
            )

        weekly_data.extend(
            [
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
        )

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

    if is_sxew:
        if production < 100:
            recommendations.append(
                (
                    "Review cathode production constraints and confirm "
                    f"a recovery plan for weekly achievement of "
                    f"{production:.1f}% of plan. Review leach, SX and "
                    "EW constraints."
                )
            )

        if throughput < 100:
            recommendations.append(
                (
                    f"Review plant throughput ({throughput:.1f}%) and "
                    "confirm actions across leach, SX and EW to recover "
                    "processing performance."
                )
            )

        if recovery < 90:
            recommendations.append(
                (
                    f"Review metallurgical recovery ({recovery:.1f}%) "
                    "and confirm improvement actions across leach, "
                    "solvent extraction and electrowinning."
                )
            )
        else:
            recommendations.append(
                (
                    f"Maintain metallurgical recovery controls with "
                    f"weekly recovery at {recovery:.1f}%."
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
                    "controls, investigate near misses, and close "
                    "identified corrective actions."
                )
            )
        else:
            recommendations.append(
                (
                    "Maintain current safety controls and continue "
                    "proactive verification of critical SX-EW "
                    "operating risks."
                )
            )

    else:
        if production < 100:
            recommendations.append(
                (
                    "Review ore production constraints and confirm "
                    f"a recovery plan for weekly achievement of "
                    f"{production:.1f}%."
                )
            )

        if (
            waste_applicable
            and waste < 100
        ):
            recommendations.append(
                (
                    "Review waste movement constraints and sequence "
                    f"delivery with weekly achievement of {waste:.1f}%."
                )
            )

        if (
            fleet_applicable
            and fleet < 90
        ):
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

    if production < 100:
        focus_areas.append(
            (
                "cathode production"
                if is_sxew
                else "ore production"
            )
        )

    if (
        not is_sxew
        and waste_applicable
        and waste < 100
    ):
        focus_areas.append(
            "waste movement"
        )

    if (
        not is_sxew
        and fleet_applicable
        and fleet < 90
    ):
        focus_areas.append(
            "fleet performance"
        )

    if is_sxew:
        if throughput < 100:
            focus_areas.append(
                "plant throughput"
            )
    elif plant < 95:
        focus_areas.append(
            "plant performance"
        )

    if (
        incidents > 0
        or critical_risks > 0
        or safety_score < 95
    ):
        focus_areas.append(
            "safety controls"
        )

    if is_sxew:
        if focus_areas:
            leadership_text = (
                "Leadership attention should remain focused on "
                + " and ".join(focus_areas)
                + ". "
                + f"Weekly Mine Health was {health:.1f}, "
                + f"cathode production was {production:.1f}% of plan, "
                + f"plant throughput was {throughput:.1f}%, recovery "
                + f"was {recovery:.1f}%, and safety score was "
                + f"{safety_score:.1f}%."
            )
        else:
            leadership_text = (
                f"Overall weekly performance remained stable. "
                f"Mine Health was {health:.1f}, cathode production "
                f"achievement was {production:.1f}%, plant throughput "
                f"was {throughput:.1f}%, recovery was {recovery:.1f}%, "
                f"and safety score was {safety_score:.1f}%."
            )
    else:
        if focus_areas:
            leadership_text = (
                "Leadership attention should remain focused on "
                + ", ".join(focus_areas)
                + ". "
                + f"Weekly Mine Health was {health:.1f}, with ore "
                + f"at {production:.1f}% of plan"
                + (
                    f", fleet performance at {fleet:.1f}%"
                    if fleet_applicable
                    else ""
                )
                + f", and plant performance at {plant:.1f}%."
            )
        else:
            leadership_text = (
                f"Overall weekly performance remained stable. "
                f"Mine Health was {health:.1f}, ore achievement was "
                f"{production:.1f}%"
                + (
                    f", fleet performance was {fleet:.1f}%"
                    if fleet_applicable
                    else ""
                )
                + f", and plant performance was {plant:.1f}%."
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
    Generate the Monthly KPI Pack from the latest available
    reporting days supplied by monthly_kpi_service.

    The report adapts its executive KPI structure to the active
    operation profile.

    Standard mine:
        - Mine Health
        - Ore / Waste
        - Fleet
        - Plant
        - Safety

    SX-EW copper:
        - Mine Health
        - Cathode Production
        - Plant Throughput
        - Plant Recovery
        - Safety

    Non-applicable KPIs are excluded rather than displayed as
    artificial zero-performance values.
    """

    report_name = "Monthly KPI Pack"
    generated_at = datetime.now()

    # =========================================================
    # TENANT / OPERATION CONTEXT
    # =========================================================

    mine_name = str(
        monthly_kpis.get("mine_name")
        or "Configured Operation"
    ).strip()

    operation_profile = str(
        monthly_kpis.get(
            "operation_profile",
            "standard_mine",
        )
        or "standard_mine"
    ).strip().lower()

    operation_profile = (
        operation_profile
        .replace("-", "_")
        .replace(" ", "_")
    )

    is_sxew = (
        operation_profile
        in {
            "sxew",
            "sx_ew",
            "sxew_copper",
            "copper_sxew",
            "copper_cathode",
            "cathode",
        }
    )

    production_label = str(
        monthly_kpis.get("production_label")
        or (
            "Cathode Production"
            if is_sxew
            else "Ore Production"
        )
    )

    production_short_label = (
        "Cathode"
        if is_sxew
        else "Ore"
    )

    waste_applicable = bool(
        monthly_kpis.get(
            "waste_applicable",
            not is_sxew,
        )
    )

    fleet_applicable = bool(
        monthly_kpis.get(
            "fleet_applicable",
            not is_sxew,
        )
    )

    # =========================================================
    # REPORT PERIOD
    # =========================================================

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

    # =========================================================
    # KPI VALUES
    # =========================================================

    health = float(
        monthly_kpis.get("health", 0)
        or 0
    )

    production = float(
        monthly_kpis.get("ore", 0)
        or 0
    )

    waste = float(
        monthly_kpis.get("waste", 0)
        or 0
    )

    production_plan = float(
        monthly_kpis.get("ore_plan", 0)
        or 0
    )

    production_actual = float(
        monthly_kpis.get("ore_actual", 0)
        or 0
    )

    waste_plan = float(
        monthly_kpis.get("waste_plan", 0)
        or 0
    )

    waste_actual = float(
        monthly_kpis.get("waste_actual", 0)
        or 0
    )

    fleet = float(
        monthly_kpis.get("fleet", 0)
        or 0
    )

    availability = float(
        monthly_kpis.get("availability", 0)
        or 0
    )

    utilization = float(
        monthly_kpis.get("utilization", 0)
        or 0
    )

    plant = float(
        monthly_kpis.get("plant", 0)
        or 0
    )

    throughput = float(
        monthly_kpis.get("throughput", 0)
        or 0
    )

    recovery = float(
        monthly_kpis.get("recovery", 0)
        or 0
    )

    incidents = int(
        monthly_kpis.get("safety", 0)
        or 0
    )

    safety_score = float(
        monthly_kpis.get("safety_score", 0)
        or 0
    )

    near_misses = int(
        monthly_kpis.get("near_misses", 0)
        or 0
    )

    critical_risks = int(
        monthly_kpis.get("critical_risks", 0)
        or 0
    )

    # =========================================================
    # TARGETS / STATUS
    # =========================================================

    health_target = 85.0
    production_target = 100.0
    waste_target = 100.0
    availability_target = 90.0
    throughput_target = 100.0
    recovery_target = 90.0
    safety_score_target = 95.0

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

    production_status = status_label(
        production,
        production_target,
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

    throughput_status = status_label(
        throughput,
        throughput_target,
    )

    recovery_status = status_label(
        recovery,
        recovery_target,
        strong_margin=2.0,
    )

    plant_status = (
        "Stable"
        if plant >= 95
        else "Watch"
    )

    safety_status = (
        "On Track"
        if (
            incidents == 0
            and critical_risks == 0
            and safety_score >= safety_score_target
        )
        else "Watch"
    )

    # =========================================================
    # DOCUMENT
    # =========================================================

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

    # =========================================================
    # EXECUTIVE SUMMARY
    # =========================================================

    story.append(
        create_section_heading(
            "Executive Summary"
        )
    )

    if is_sxew:
        executive_summary = (
            f"{mine_name} recorded a monthly Mine Health score "
            f"of {health:.1f} for {period_start} to {period_end}. "
            f"Cathode production achievement was "
            f"{production:.1f}% of plan. Plant throughput "
            f"averaged {throughput:.1f}% of target and "
            f"metallurgical recovery averaged {recovery:.1f}%. "
            f"The period recorded {incidents} incident(s), "
            f"{near_misses} near miss(es), and "
            f"{critical_risks} critical risk(s)."
        )
    else:
        performance_parts = [
            (
                f"Ore achievement was "
                f"{production:.1f}% of plan"
            )
        ]

        if waste_applicable:
            performance_parts.append(
                (
                    f"waste achievement was "
                    f"{waste:.1f}%"
                )
            )

        if fleet_applicable:
            performance_parts.append(
                (
                    f"fleet performance averaged "
                    f"{fleet:.1f}%"
                )
            )

        performance_parts.append(
            (
                f"plant performance averaged "
                f"{plant:.1f}%"
            )
        )

        executive_summary = (
            f"{mine_name} recorded a monthly Mine Health score "
            f"of {health:.1f} for {period_start} to {period_end}. "
            f"{', '.join(performance_parts)}. "
            f"The period recorded {incidents} incident(s), "
            f"{near_misses} near miss(es), and "
            f"{critical_risks} critical risk(s)."
        )

    story.append(
        create_body_paragraph(
            executive_summary
        )
    )

    story.append(
        create_vertical_space(10)
    )

    # =========================================================
    # KPI CALLOUTS
    # =========================================================

    if is_sxew:
        kpi_callouts = [
            {
                "label": "Mine Health",
                "value": f"{health:.1f}",
            },
            {
                "label": "Cathode",
                "value": f"{production:.1f}%",
            },
            {
                "label": "Plant Throughput",
                "value": f"{throughput:.1f}%",
            },
            {
                "label": "Safety Score",
                "value": f"{safety_score:.1f}%",
            },
        ]
    else:
        kpi_callouts = [
            {
                "label": "Mine Health",
                "value": f"{health:.1f}",
            },
            {
                "label": "Ore Achievement",
                "value": f"{production:.1f}%",
            },
        ]

        if waste_applicable:
            kpi_callouts.append(
                {
                    "label": "Waste Achievement",
                    "value": f"{waste:.1f}%",
                }
            )
        elif fleet_applicable:
            kpi_callouts.append(
                {
                    "label": "Fleet",
                    "value": f"{fleet:.1f}%",
                }
            )
        else:
            kpi_callouts.append(
                {
                    "label": "Plant",
                    "value": f"{plant:.1f}%",
                }
            )

        kpi_callouts.append(
            {
                "label": "Safety Events",
                "value": str(incidents),
            }
        )

    story.append(
        create_kpi_callouts(
            kpi_callouts
        )
    )

    story.append(
        create_vertical_space(16)
    )

    # =========================================================
    # MONTHLY KPI SUMMARY
    # =========================================================

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
    ]

    if is_sxew:
        monthly_kpi_data.extend(
            [
                [
                    "Cathode Production",
                    f"{production_target:.0f}%",
                    f"{production:.1f}%",
                    f"{production - production_target:+.1f}%",
                    production_status,
                ],
                [
                    "Plant Throughput",
                    f"{throughput_target:.0f}%",
                    f"{throughput:.1f}%",
                    f"{throughput - throughput_target:+.1f}%",
                    throughput_status,
                ],
                [
                    "Plant Recovery",
                    f"{recovery_target:.0f}%",
                    f"{recovery:.1f}%",
                    f"{recovery - recovery_target:+.1f}%",
                    recovery_status,
                ],
                [
                    "Safety Score",
                    f"{safety_score_target:.0f}%",
                    f"{safety_score:.1f}%",
                    f"{safety_score - safety_score_target:+.1f}%",
                    safety_status,
                ],
            ]
        )
    else:
        monthly_kpi_data.append(
            [
                "Ore Achievement",
                f"{production_target:.0f}%",
                f"{production:.1f}%",
                f"{production - production_target:+.1f}%",
                production_status,
            ]
        )

        if waste_applicable:
            monthly_kpi_data.append(
                [
                    "Waste Achievement",
                    f"{waste_target:.0f}%",
                    f"{waste:.1f}%",
                    f"{waste - waste_target:+.1f}%",
                    waste_status,
                ]
            )

        if fleet_applicable:
            monthly_kpi_data.append(
                [
                    "Fleet Availability",
                    f"{availability_target:.0f}%",
                    f"{availability:.1f}%",
                    f"{availability - availability_target:+.1f}%",
                    fleet_status,
                ]
            )

        monthly_kpi_data.extend(
            [
                [
                    "Plant Throughput",
                    f"{throughput_target:.0f}%",
                    f"{throughput:.1f}%",
                    f"{throughput - throughput_target:+.1f}%",
                    throughput_status,
                ],
                [
                    "Safety Events",
                    "0",
                    str(incidents),
                    f"{incidents:+d}",
                    safety_status,
                ],
            ]
        )

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

    # =========================================================
    # PRODUCTION PERFORMANCE
    # =========================================================

    story.append(
        create_section_heading(
            (
                "Cathode Production Performance"
                if is_sxew
                else "Production Performance"
            )
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
    ]

    if is_sxew:
        production_data.append(
            [
                "Cathode Production",
                f"{production_plan:,.1f} t",
                f"{production_actual:,.1f} t",
                f"{production:.1f}%",
                (
                    "Cathode production was "
                    + (
                        "at or above"
                        if production >= 100
                        else "below"
                    )
                    + " the period plan."
                ),
            ]
        )
    else:
        production_data.append(
            [
                "Ore Movement",
                f"{production_plan:,.0f} t",
                f"{production_actual:,.0f} t",
                f"{production:.1f}%",
                (
                    "Ore movement was "
                    + (
                        "at or above"
                        if production >= 100
                        else "below"
                    )
                    + " the monthly plan."
                ),
            ]
        )

        if waste_applicable:
            production_data.append(
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
                ]
            )

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

    # =========================================================
    # DEPARTMENT / FUNCTION PERFORMANCE
    # =========================================================

    story.append(
        create_section_heading(
            (
                "Processing and Safety Performance"
                if is_sxew
                else "Department Performance"
            )
        )
    )

    department_data = [
        [
            "Area",
            "Performance",
            "Status",
            "Executive Commentary",
        ],
    ]

    if is_sxew:
        department_data.extend(
            [
                [
                    "Cathode Production",
                    f"{production:.1f}%",
                    production_status,
                    (
                        "Cathode production achievement was "
                        f"{production:.1f}% of plan for the period."
                    ),
                ],
                [
                    "Processing Plant",
                    f"{plant:.1f}%",
                    plant_status,
                    (
                        f"Throughput averaged {throughput:.1f}% "
                        f"of target and recovery averaged "
                        f"{recovery:.1f}%."
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
        )
    else:
        if waste_applicable:
            mining_performance = round(
                (production + waste) / 2,
                1,
            )
            mining_commentary = (
                f"Ore achievement was {production:.1f}% and "
                f"waste achievement was {waste:.1f}% for the month."
            )
        else:
            mining_performance = production
            mining_commentary = (
                f"Ore achievement was {production:.1f}% "
                "for the month."
            )

        department_data.append(
            [
                "Mining",
                f"{mining_performance:.1f}%",
                (
                    "Stable"
                    if mining_performance >= 100
                    else "Watch"
                ),
                mining_commentary,
            ]
        )

        if fleet_applicable:
            department_data.append(
                [
                    "Fleet",
                    f"{fleet:.1f}%",
                    (
                        "Stable"
                        if fleet >= 90
                        else "Watch"
                    ),
                    (
                        f"Availability averaged {availability:.1f}% "
                        f"and utilization averaged {utilization:.1f}%."
                    ),
                ]
            )

        department_data.extend(
            [
                [
                    "Plant",
                    f"{plant:.1f}%",
                    plant_status,
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
        )

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

    # =========================================================
    # KEY RISKS AND OPPORTUNITIES
    # =========================================================

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

    if production < 100:
        if is_sxew:
            risk_data.append(
                [
                    "Cathode production below plan",
                    "Medium",
                    (
                        f"Cathode production achievement of "
                        f"{production:.1f}% may affect monthly "
                        "metal delivery."
                    ),
                    (
                        "Review leach, SX and EW constraints and "
                        "confirm the next-period recovery plan."
                    ),
                ]
            )
        else:
            risk_data.append(
                [
                    "Ore production below plan",
                    "Medium",
                    (
                        f"Monthly ore achievement of {production:.1f}% "
                        "may constrain production delivery."
                    ),
                    (
                        "Review production constraints and confirm "
                        "the next-month recovery plan."
                    ),
                ]
            )

    if (
        not is_sxew
        and waste_applicable
        and waste < 100
    ):
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

    if (
        not is_sxew
        and fleet_applicable
        and (
            fleet < 90
            or utilization < 85
        )
    ):
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

    if is_sxew:
        if throughput < 100:
            risk_data.append(
                [
                    "Plant throughput below target",
                    "Medium",
                    (
                        f"Plant throughput averaged {throughput:.1f}% "
                        "of target and may constrain cathode output."
                    ),
                    (
                        "Review throughput constraints across leach, "
                        "SX and EW operating stages."
                    ),
                ]
            )

        if recovery < recovery_target:
            risk_data.append(
                [
                    "Plant recovery below target",
                    "Medium",
                    (
                        f"Metallurgical recovery averaged "
                        f"{recovery:.1f}%, below the current "
                        f"{recovery_target:.0f}% threshold."
                    ),
                    (
                        "Review solution chemistry, extraction and "
                        "electrowinning recovery constraints."
                    ),
                ]
            )
    else:
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

    if (
        incidents > 0
        or critical_risks > 0
        or near_misses > 0
        or safety_score < safety_score_target
    ):
        risk_data.append(
            [
                "Safety exposure requires attention",
                (
                    "High"
                    if (
                        incidents > 0
                        or critical_risks > 0
                    )
                    else "Medium"
                ),
                (
                    f"The period recorded {incidents} incident(s), "
                    f"{near_misses} near miss(es), and "
                    f"{critical_risks} critical risk(s)."
                ),
                (
                    "Verify critical controls, investigate events "
                    "and near misses, and close corrective actions."
                ),
            ]
        )

    if len(risk_data) == 1:
        risk_data.append(
            [
                "No major monthly KPI exception",
                "Low",
                (
                    "Key applicable operational KPIs remained "
                    "within current monthly thresholds."
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

    # =========================================================
    # MANAGEMENT ACTIONS
    # =========================================================

    story.append(
        create_section_heading(
            "Management Actions"
        )
    )

    management_actions = []

    if production < 100:
        if is_sxew:
            management_actions.append(
                (
                    "Confirm the next-period cathode production "
                    f"recovery plan following achievement of "
                    f"{production:.1f}% and review leach, SX and "
                    "EW constraints."
                )
            )
        else:
            management_actions.append(
                (
                    "Confirm the next-month ore production recovery "
                    f"plan following monthly achievement of "
                    f"{production:.1f}%."
                )
            )

    if (
        not is_sxew
        and waste_applicable
        and waste < 100
    ):
        management_actions.append(
            (
                "Review waste movement sequence and equipment "
                f"allocation following achievement of {waste:.1f}%."
            )
        )

    if (
        not is_sxew
        and fleet_applicable
        and (
            fleet < 90
            or utilization < 85
        )
    ):
        management_actions.append(
            (
                f"Review fleet availability ({availability:.1f}%) "
                f"and utilization ({utilization:.1f}%) with "
                "operations and maintenance."
            )
        )

    if is_sxew:
        if throughput < 100:
            management_actions.append(
                (
                    f"Review plant throughput ({throughput:.1f}%) "
                    "and confirm actions across leach, SX and EW "
                    "to recover processing performance."
                )
            )

        if recovery < recovery_target:
            management_actions.append(
                (
                    f"Review metallurgical recovery ({recovery:.1f}%) "
                    "and confirm solution chemistry, extraction and "
                    "electrowinning improvement actions."
                )
            )
        else:
            management_actions.append(
                (
                    "Maintain metallurgical recovery controls with "
                    f"monthly recovery at {recovery:.1f}%."
                )
            )
    elif plant < 95 or throughput < 100:
        management_actions.append(
            (
                f"Review plant throughput ({throughput:.1f}%) "
                f"and recovery ({recovery:.1f}%) constraints."
            )
        )

    if (
        incidents > 0
        or near_misses > 0
        or critical_risks > 0
        or safety_score < safety_score_target
    ):
        management_actions.append(
            (
                "Review monthly safety performance, verify critical "
                "controls, investigate near misses, and close all "
                "required corrective actions."
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
            "Prepare updated KPI commentary, accountable owners "
            "and due dates for the monthly leadership review."
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

    # =========================================================
    # EXECUTIVE COMMENTARY
    # =========================================================

    story.append(
        create_section_heading(
            "Executive Commentary"
        )
    )

    attention_areas = []

    if production < 100:
        attention_areas.append(
            (
                "cathode production"
                if is_sxew
                else "ore production"
            )
        )

    if (
        not is_sxew
        and waste_applicable
        and waste < 100
    ):
        attention_areas.append(
            "waste movement"
        )

    if (
        not is_sxew
        and fleet_applicable
        and (
            fleet < 90
            or utilization < 85
        )
    ):
        attention_areas.append(
            "fleet performance"
        )

    if is_sxew:
        if throughput < 100:
            attention_areas.append(
                "plant throughput"
            )
        if recovery < recovery_target:
            attention_areas.append(
                "plant recovery"
            )
    elif plant < 95 or throughput < 100:
        attention_areas.append(
            "plant performance"
        )

    if (
        incidents > 0
        or critical_risks > 0
        or safety_score < safety_score_target
    ):
        attention_areas.append(
            "safety controls"
        )

    if is_sxew:
        if attention_areas:
            commentary = (
                "Leadership attention should remain focused on "
                + " and ".join(attention_areas)
                + ". "
                + f"Monthly Mine Health was {health:.1f}, cathode "
                  f"production achievement was {production:.1f}%, "
                  f"plant throughput was {throughput:.1f}%, "
                  f"recovery was {recovery:.1f}%, and safety score "
                  f"was {safety_score:.1f}%."
            )
        else:
            commentary = (
                f"Overall monthly SX-EW performance remained stable. "
                f"Mine Health was {health:.1f}, cathode production "
                f"achievement was {production:.1f}%, plant throughput "
                f"was {throughput:.1f}%, recovery was {recovery:.1f}%, "
                f"and safety score was {safety_score:.1f}%. Continue "
                "routine monitoring of leach, SX, EW and critical "
                "safety controls."
            )
    else:
        if attention_areas:
            performance_parts = [
                f"Monthly Mine Health was {health:.1f}",
                f"ore achievement was {production:.1f}%",
            ]

            if fleet_applicable:
                performance_parts.append(
                    f"fleet performance was {fleet:.1f}%"
                )

            performance_parts.append(
                f"plant performance was {plant:.1f}%"
            )

            commentary = (
                "Leadership attention should remain focused on "
                + ", ".join(attention_areas)
                + ". "
                + ", ".join(performance_parts)
                + "."
            )
        else:
            commentary = (
                f"Overall monthly performance remained stable. "
                f"Mine Health was {health:.1f}, ore achievement "
                f"was {production:.1f}%, plant performance was "
                f"{plant:.1f}%. Continue routine operating controls."
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
