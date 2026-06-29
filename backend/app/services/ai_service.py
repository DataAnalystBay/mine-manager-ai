def generate_briefing(kpi_data):

    return f"""
Mine Manager AI Daily Operations Briefing

Overall Status:
{kpi_data['status']}

Production Performance:
{kpi_data['production_score']}%

Waste Performance:
{kpi_data['waste_score']}%

Overall Operational Score:
{kpi_data['overall_score']}%

Recommendation:
Operations are performing within expected limits.
Continue monitoring production and waste movement.
"""