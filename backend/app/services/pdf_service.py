from datetime import datetime

from reportlab.lib.units import mm

from app.services.chart_service import (
    create_demo_fleet_chart,
    create_demo_plant_chart,
    create_demo_production_chart,
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


def generate_daily_executive_pdf():
    report_name = "Daily Executive Report"

    generated_at = datetime.now()
    report_period = generated_at.strftime("%Y-%m-%d")

    story = []

    story.extend(
        create_report_header(
            report_title=report_name,
            mine_name="OT Surface Operations",
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
            "Mine operations are currently stable. Production performance, "
            "fleet availability, plant status, safety exposure, and priority "
            "actions are summarized below for management review."
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
                    "value": "87",
                },
                {
                    "label": "Production",
                    "value": "96%",
                },
                {
                    "label": "Fleet",
                    "value": "91%",
                },
                {
                    "label": "Safety Events",
                    "value": "0",
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
            "Stable",
            "96% of plan",
            "Ore movement is tracking close to the daily production plan.",
        ],
        [
            "Fleet",
            "Watch",
            "91% availability",
            "Truck utilization requires management attention.",
        ],
        [
            "Plant",
            "Stable",
            "104% throughput",
            "Plant performance is within the expected operating range.",
        ],
        [
            "Safety",
            "Watch",
            "0 recordable events",
            "No major incidents, but active risk exposure remains.",
        ],
    ]

    story.append(
        create_standard_table(
            data=kpi_data,
            column_widths=[
                28 * mm,
                25 * mm,
                35 * mm,
                71 * mm,
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
        [
            "Truck utilization below target",
            "Medium",
            "Potential production loss during the next shift.",
            "Review dispatch allocation and equipment delays.",
        ],
        [
            "Maintenance backlog",
            "Medium",
            "Reduced fleet availability if unresolved.",
            "Escalate high-priority work orders.",
        ],
        [
            "Weather exposure",
            "Low",
            "Possible haul-road and cycle-time impacts.",
            "Continue weather and road-condition monitoring.",
        ],
    ]

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

    priority_actions = [
        "Review fleet utilization variance with dispatch and maintenance teams.",
        "Confirm the production recovery plan for any below-plan mining areas.",
        "Monitor active safety risks before the next shift handover.",
        "Prepare updated performance commentary for the daily operations meeting.",
    ]

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

    story.append(
        create_body_paragraph(
            "Leadership attention should remain focused on fleet utilization "
            "and maintenance execution. Production remains close to plan, and "
            "plant performance is supporting overall operational stability."
        )
    )

    return build_pdf(
        story=story,
        report_name=report_name,
    )


def generate_weekly_operations_pdf():
    report_name = "Weekly Operations Report"

    generated_at = datetime.now()
    report_period = generated_at.strftime(
        "Week ending %Y-%m-%d"
    )

    story = []

    story.extend(
        create_report_header(
            report_title=report_name,
            mine_name="OT Surface Operations",
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
            "This weekly report summarizes operational trends, department "
            "performance, risk movement, and priority recommendations for "
            "mine leadership review."
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
                    "value": "87",
                },
                {
                    "label": "Production",
                    "value": "96%",
                },
                {
                    "label": "Fleet",
                    "value": "91%",
                },
                {
                    "label": "Plant",
                    "value": "104%",
                },
            ]
        )
    )

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
            create_demo_production_chart()
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
            create_demo_fleet_chart()
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
            create_demo_plant_chart()
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
            "Production",
            "Stable",
            "96% of plan",
            "Production performance remained close to the weekly plan.",
        ],
        [
            "Fleet",
            "Watch",
            "91% availability",
            "Fleet utilization showed pressure during the week.",
        ],
        [
            "Plant",
            "Stable",
            "104% throughput",
            "Plant throughput remained within the expected operating range.",
        ],
        [
            "Safety",
            "Watch",
            "0 recordable events",
            "Safety risk exposure requires continued leadership focus.",
        ],
        [
            "Maintenance",
            "Watch",
            "Backlog elevated",
            "Maintenance delays affected equipment availability.",
        ],
    ]

    story.append(
        create_standard_table(
            data=weekly_data,
            column_widths=[
                28 * mm,
                28 * mm,
                36 * mm,
                67 * mm,
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

    recommendations = [
        "Review fleet bottlenecks and improve equipment allocation for the next week.",
        "Confirm weekly production recovery actions with operations and planning teams.",
        "Escalate recurring maintenance delays affecting truck and shovel availability.",
        "Review safety controls for active operational risk areas.",
    ]

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

    story.append(
        create_body_paragraph(
            "The primary focus for the next reporting period should be fleet "
            "utilization, maintenance backlog reduction, and production recovery "
            "actions. Plant performance remains positive and provides an opportunity "
            "to recover mining shortfalls."
        )
    )

    return build_pdf(
        story=story,
        report_name=report_name,
    )

def generate_monthly_kpi_pdf():
    report_name = "Monthly KPI Pack"

    generated_at = datetime.now()
    report_period = generated_at.strftime("%B %Y")

    story = []

    story.extend(
        create_report_header(
            report_title=report_name,
            mine_name="OT Surface Operations",
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
            "This monthly KPI pack provides mine leadership with a consolidated "
            "view of mine health, production performance, fleet effectiveness, "
            "plant performance, safety exposure, key risks, and management actions."
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
                    "value": "87",
                },
                {
                    "label": "Ore Achievement",
                    "value": "100.5%",
                },
                {
                    "label": "Waste Achievement",
                    "value": "100.2%",
                },
                {
                    "label": "Safety Events",
                    "value": "0",
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
            "85",
            "87",
            "+2",
            "On Track",
        ],
        [
            "Ore Achievement",
            "100%",
            "100.5%",
            "+0.5%",
            "On Track",
        ],
        [
            "Waste Achievement",
            "100%",
            "100.2%",
            "+0.2%",
            "On Track",
        ],
        [
            "Fleet Availability",
            "90%",
            "91%",
            "+1.0%",
            "On Track",
        ],
        [
            "Plant Throughput",
            "100%",
            "104%",
            "+4.0%",
            "Above Target",
        ],
        [
            "Safety Events",
            "0",
            "0",
            "0",
            "On Track",
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
            "3,000,000 t",
            "3,015,000 t",
            "100.5%",
            "Ore movement remained slightly above the monthly plan.",
        ],
        [
            "Waste Movement",
            "3,600,000 t",
            "3,607,200 t",
            "100.2%",
            "Waste movement remained aligned with the planned mining sequence.",
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

    department_data = [
        [
            "Department",
            "Performance",
            "Status",
            "Executive Commentary",
        ],
        [
            "Mining",
            "100.4%",
            "Stable",
            "Production delivery remained close to plan during the month.",
        ],
        [
            "Fleet",
            "91%",
            "Watch",
            "Utilization and maintenance delays require continued attention.",
        ],
        [
            "Plant",
            "104%",
            "Strong",
            "Plant throughput supported the overall monthly performance.",
        ],
        [
            "Safety",
            "0 events",
            "Stable",
            "No recordable events, but critical controls must remain active.",
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
        [
            "Fleet utilization below target",
            "Medium",
            "Reduced hauling capacity and lower production flexibility.",
            "Review dispatch allocation and maintenance response time.",
        ],
        [
            "Maintenance backlog",
            "Medium",
            "Potential reduction in equipment availability.",
            "Prioritize critical work orders and confirm resource coverage.",
        ],
        [
            "Strong plant throughput",
            "Opportunity",
            "Potential to recover short-term mining shortfalls.",
            "Align stockpile strategy and plant feed priorities.",
        ],
    ]

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

    management_actions = [
        "Review fleet utilization and equipment-delay trends with operations and maintenance.",
        "Confirm the next-month production sequence and recovery opportunities.",
        "Escalate high-priority maintenance backlog items affecting critical equipment.",
        "Maintain focus on safety-critical controls and leading indicators.",
        "Prepare updated KPI commentary for the monthly leadership review.",
    ]

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

    story.append(
        create_body_paragraph(
            "Overall monthly performance remains stable, with production and plant "
            "delivery meeting or exceeding plan. Leadership attention should remain "
            "focused on fleet utilization, maintenance execution, and sustaining "
            "critical safety controls. The operation is positioned to maintain its "
            "current performance if identified actions are completed."
        )
    )

    return build_pdf(
        story=story,
        report_name=report_name,
    )
