from io import BytesIO
from typing import Any, Dict, List, Optional

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter


PRIMARY_GREEN = "#16A34A"
NAVY = "#0F172A"
MUTED_TEXT = "#64748B"
BORDER_GRAY = "#E2E8F0"
LIGHT_BACKGROUND = "#F8FAFC"
TARGET_COLOR = "#F59E0B"


def _format_axis_value(value: float, _position: int) -> str:
    """
    Format large values for the chart axis.
    """

    absolute_value = abs(value)

    if absolute_value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"

    if absolute_value >= 1_000:
        return f"{value / 1_000:.0f}K"

    return f"{value:,.0f}"


def generate_kpi_trend_chart(
    historical_data: List[Dict[str, Any]],
    target_value: Optional[float] = None,
    chart_title: str = "Historical KPI Performance",
    value_label: str = "KPI Value",
) -> BytesIO:
    """
    Generate a professional KPI trend chart for the executive PDF.

    Expected historical_data format:

    [
        {
            "period": "01 Jul",
            "value": 46500
        },
        {
            "period": "02 Jul",
            "value": 47200
        }
    ]
    """

    if not historical_data:
        raise ValueError(
            "historical_data must contain at least one record."
        )

    periods = []
    values = []

    for item in historical_data:
        period = str(item.get("period", ""))
        value = item.get("value")

        if value is None:
            continue

        try:
            numeric_value = float(value)
        except (TypeError, ValueError):
            continue

        periods.append(period)
        values.append(numeric_value)

    if not values:
        raise ValueError(
            "historical_data does not contain valid numeric values."
        )

    figure, axis = plt.subplots(
        figsize=(10, 4.8),
        dpi=160,
    )

    figure.patch.set_facecolor("white")
    axis.set_facecolor(LIGHT_BACKGROUND)

    axis.plot(
        periods,
        values,
        linewidth=2.6,
        marker="o",
        markersize=5.5,
        color=PRIMARY_GREEN,
        markerfacecolor="white",
        markeredgecolor=PRIMARY_GREEN,
        markeredgewidth=1.8,
        label=value_label,
        zorder=3,
    )

    axis.fill_between(
        periods,
        values,
        alpha=0.08,
        color=PRIMARY_GREEN,
        zorder=1,
    )

    if target_value is not None:
        try:
            numeric_target = float(target_value)

            axis.axhline(
                y=numeric_target,
                linewidth=1.7,
                linestyle="--",
                color=TARGET_COLOR,
                label=f"Target: {_format_axis_value(numeric_target, 0)}",
                zorder=2,
            )

        except (TypeError, ValueError):
            pass

    axis.set_title(
        chart_title,
        fontsize=14,
        fontweight="bold",
        color=NAVY,
        loc="left",
        pad=14,
    )

    axis.set_ylabel(
        value_label,
        fontsize=9,
        color=MUTED_TEXT,
        labelpad=10,
    )

    axis.tick_params(
        axis="x",
        labelsize=8,
        colors=MUTED_TEXT,
        rotation=0,
    )

    axis.tick_params(
        axis="y",
        labelsize=8,
        colors=MUTED_TEXT,
    )

    axis.yaxis.set_major_formatter(
        FuncFormatter(_format_axis_value)
    )

    axis.grid(
        axis="y",
        linestyle="-",
        linewidth=0.6,
        alpha=0.7,
        color=BORDER_GRAY,
        zorder=0,
    )

    axis.grid(
        axis="x",
        visible=False,
    )

    for spine in axis.spines.values():
        spine.set_visible(False)

    if len(periods) > 8:
        step = max(1, len(periods) // 7)

        for index, label in enumerate(axis.get_xticklabels()):
            label.set_visible(index % step == 0 or index == len(periods) - 1)

    axis.legend(
        loc="upper left",
        frameon=False,
        fontsize=8,
        ncol=2,
    )

    axis.margins(
        x=0.03,
        y=0.15,
    )

    figure.tight_layout()

    image_buffer = BytesIO()

    figure.savefig(
        image_buffer,
        format="png",
        dpi=160,
        bbox_inches="tight",
        facecolor=figure.get_facecolor(),
    )

    plt.close(figure)

    image_buffer.seek(0)

    return image_buffer