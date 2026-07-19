from io import BytesIO
from typing import Optional, Sequence

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt


def _validate_chart_data(
    labels: Sequence[str],
    values: Sequence[float],
) -> None:
    """
    Validate shared chart inputs.
    """

    if not labels:
        raise ValueError("Chart labels cannot be empty.")

    if not values:
        raise ValueError("Chart values cannot be empty.")

    if len(labels) != len(values):
        raise ValueError(
            "Chart labels and values must have the same length."
        )


def create_line_chart(
    labels: Sequence[str],
    values: Sequence[float],
    title: str,
    y_axis_label: str,
    target_value: Optional[float] = None,
) -> BytesIO:
    """
    Create a reusable executive line chart.

    Returns:
        BytesIO: PNG image buffer ready for ReportLab.
    """

    _validate_chart_data(
        labels=labels,
        values=values,
    )

    buffer = BytesIO()

    figure, axis = plt.subplots(
        figsize=(8, 3.2)
    )

    axis.plot(
        labels,
        values,
        marker="o",
        linewidth=2,
    )

    if target_value is not None:
        axis.axhline(
            y=target_value,
            linestyle="--",
            linewidth=1.5,
            label=f"Target: {target_value}",
        )

    axis.set_title(
        title,
        fontsize=14,
        fontweight="bold",
        pad=14,
    )

    axis.set_ylabel(
        y_axis_label
    )

    axis.grid(
        visible=True,
        axis="y",
        alpha=0.25,
    )

    axis.spines["top"].set_visible(False)
    axis.spines["right"].set_visible(False)

    axis.tick_params(
        axis="x",
        rotation=30,
        labelsize=8,
    )

    axis.tick_params(
        axis="y",
        labelsize=8,
    )

    if target_value is not None:
        axis.legend(
            loc="best",
            frameon=False,
            fontsize=8,
        )

    figure.tight_layout()

    figure.savefig(
        buffer,
        format="png",
        dpi=160,
        bbox_inches="tight",
    )

    plt.close(figure)

    buffer.seek(0)

    return buffer


def create_bar_chart(
    labels: Sequence[str],
    values: Sequence[float],
    title: str,
    y_axis_label: str,
    target_value: Optional[float] = None,
) -> BytesIO:
    """
    Create a reusable executive bar chart.

    Returns:
        BytesIO: PNG image buffer ready for ReportLab.
    """

    _validate_chart_data(
        labels=labels,
        values=values,
    )

    buffer = BytesIO()

    figure, axis = plt.subplots(
        figsize=(8, 3.2)
    )

    axis.bar(
        labels,
        values,
    )

    if target_value is not None:
        axis.axhline(
            y=target_value,
            linestyle="--",
            linewidth=1.5,
            label=f"Target: {target_value}",
        )

    axis.set_title(
        title,
        fontsize=14,
        fontweight="bold",
        pad=14,
    )

    axis.set_ylabel(
        y_axis_label
    )

    axis.grid(
        visible=True,
        axis="y",
        alpha=0.25,
    )

    axis.set_axisbelow(True)

    axis.spines["top"].set_visible(False)
    axis.spines["right"].set_visible(False)

    axis.tick_params(
        axis="x",
        rotation=30,
        labelsize=8,
    )

    axis.tick_params(
        axis="y",
        labelsize=8,
    )

    if target_value is not None:
        axis.legend(
            loc="best",
            frameon=False,
            fontsize=8,
        )

    figure.tight_layout()

    figure.savefig(
        buffer,
        format="png",
        dpi=160,
        bbox_inches="tight",
    )

    plt.close(figure)

    buffer.seek(0)

    return buffer


def create_demo_production_chart() -> BytesIO:
    """
    Generate a demo production trend chart for the
    Weekly Operations Report.
    """

    return create_line_chart(
        labels=[
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun",
        ],
        values=[
            93,
            95,
            94,
            97,
            96,
            99,
            98,
        ],
        title="Daily Production Performance",
        y_axis_label="% of Plan",
        target_value=100,
    )


def create_demo_fleet_chart() -> BytesIO:
    """
    Generate a demo fleet availability trend chart.
    """

    return create_line_chart(
        labels=[
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun",
        ],
        values=[
            88,
            90,
            91,
            89,
            92,
            93,
            94,
        ],
        title="Fleet Availability",
        y_axis_label="Availability (%)",
        target_value=90,
    )


def create_demo_plant_chart() -> BytesIO:
    """
    Generate a demo plant throughput chart.
    """

    return create_bar_chart(
        labels=[
            "Week 1",
            "Week 2",
            "Week 3",
            "Week 4",
        ],
        values=[
            104,
            101,
            99,
            106,
        ],
        title="Plant Throughput",
        y_axis_label="% of Target",
        target_value=100,
    )