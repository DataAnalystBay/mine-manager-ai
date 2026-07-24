import React from "react";

import {
  FiArrowDownRight,
  FiArrowRight,
  FiArrowUpRight,
  FiChevronRight,
} from "react-icons/fi";

import "./KpiTrendCard.css";

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, maximumFractionDigits = 1) {
  const number = toFiniteNumber(value);

  if (number === null) {
    return "—";
  }

  return number.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 1,
    maximumFractionDigits,
  });
}

function normalizeTrendValues(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (typeof item === "number") {
        return Number.isFinite(item) ? item : null;
      }

      if (typeof item === "string") {
        return toFiniteNumber(item);
      }

      if (item && typeof item === "object") {
        return (
          toFiniteNumber(item.value) ??
          toFiniteNumber(item.current_value) ??
          toFiniteNumber(item.actual) ??
          null
        );
      }

      return null;
    })
    .filter((value) => value !== null);
}

function buildSparklinePoints(values) {
  const normalizedValues = normalizeTrendValues(values);

  if (normalizedValues.length === 0) {
    return "";
  }

  if (normalizedValues.length === 1) {
    return "50,50";
  }

  const minimum = Math.min(...normalizedValues);
  const maximum = Math.max(...normalizedValues);
  const range = maximum - minimum || 1;

  const horizontalPadding = 4;
  const verticalPadding = 14;

  const chartWidth = 100 - horizontalPadding * 2;
  const chartHeight = 100 - verticalPadding * 2;

  return normalizedValues
    .map((value, index) => {
      const x =
        horizontalPadding +
        (index / (normalizedValues.length - 1)) * chartWidth;

      const normalizedValue = (value - minimum) / range;

      const y =
        verticalPadding +
        chartHeight -
        normalizedValue * chartHeight;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function normalizeDirection(direction, change) {
  const normalizedDirection = String(direction || "")
    .trim()
    .toLowerCase();

  if (
    ["up", "positive", "improving", "increase"].includes(
      normalizedDirection
    )
  ) {
    return "positive";
  }

  if (
    ["down", "negative", "declining", "decrease"].includes(
      normalizedDirection
    )
  ) {
    return "negative";
  }

  const numericChange = toFiniteNumber(change);

  if (numericChange > 0) {
    return "positive";
  }

  if (numericChange < 0) {
    return "negative";
  }

  return "neutral";
}

function getDirectionMeta(direction, change) {
  const normalizedDirection = normalizeDirection(direction, change);

  if (normalizedDirection === "positive") {
    return {
      className: "positive",
      icon: <FiArrowUpRight aria-hidden="true" />,
      label: "Improving",
    };
  }

  if (normalizedDirection === "negative") {
    return {
      className: "negative",
      icon: <FiArrowDownRight aria-hidden="true" />,
      label: "Declining",
    };
  }

  return {
    className: "neutral",
    icon: <FiArrowRight aria-hidden="true" />,
    label: "Stable",
  };
}

export default function KpiTrendCard({
  title = "KPI",
  subtitle = "",
  value,
  unit = "",
  change = 0,
  changePercent,
  direction = "flat",
  values,
  trend,
  periodLabel = "Last 7 Days",
  footerText = "View detailed analysis",
  clickable = false,
  onClick,
  disabled = false,
}) {
  const chartValues = Array.isArray(values)
    ? values
    : Array.isArray(trend)
    ? trend
    : [];

  const sparklinePoints = buildSparklinePoints(chartValues);

  const effectiveChange =
    toFiniteNumber(changePercent) ?? toFiniteNumber(change) ?? 0;

  const directionMeta = getDirectionMeta(
    direction,
    effectiveChange
  );

  const formattedChange =
    toFiniteNumber(effectiveChange) === null
      ? "—"
      : `${effectiveChange > 0 ? "+" : ""}${formatNumber(
          effectiveChange
        )}`;

  const canInteract =
    clickable && typeof onClick === "function" && !disabled;

  const handleClick = () => {
    if (canInteract) {
      onClick();
    }
  };

  const handleKeyDown = (event) => {
    if (!canInteract) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  const cardClassName = [
    "kpi-trend-card",
    canInteract ? "clickable" : "",
    disabled ? "disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClassName}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={canInteract ? "button" : undefined}
      tabIndex={canInteract ? 0 : undefined}
      aria-label={
        canInteract
          ? `Open detailed analysis for ${title}`
          : undefined
      }
      aria-disabled={disabled || undefined}
    >
      <div className="kpi-trend-card__header">
        <div className="kpi-trend-card__heading">
          <p className="kpi-trend-card__eyebrow">{title}</p>

          {subtitle && (
            <p className="kpi-trend-card__subtitle">
              {subtitle}
            </p>
          )}
        </div>

        <span className="kpi-trend-card__period">
          {periodLabel}
        </span>
      </div>

      <div className="kpi-trend-card__value-row">
        <span className="kpi-trend-card__value">
          {formatNumber(value)}
        </span>

        {unit && (
          <span className="kpi-trend-card__unit">{unit}</span>
        )}
      </div>

      <div className="kpi-trend-card__trend-meta">
        <span
          className={`kpi-trend-card__change kpi-trend-card__change--${directionMeta.className}`}
        >
          {directionMeta.icon}

          <span>
            {formattedChange}
            {unit === "%" ? "%" : ""}
          </span>
        </span>

        <span className="kpi-trend-card__status-label">
          {directionMeta.label}
        </span>
      </div>

      <div
        className={`kpi-trend-card__chart kpi-trend-card__chart--${directionMeta.className}`}
      >
        {sparklinePoints ? (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${title} trend for ${periodLabel}`}
          >
            <line
              x1="4"
              y1="84"
              x2="96"
              y2="84"
              className="kpi-trend-card__grid-line"
            />

            <polyline
              points={sparklinePoints}
              className="kpi-trend-card__sparkline"
            />
          </svg>
        ) : (
          <div className="kpi-trend-card__empty-chart">
            No trend data available
          </div>
        )}
      </div>

      <div className="kpi-trend-card__footer">
        <span>{periodLabel}</span>

        {canInteract && footerText && (
          <span className="kpi-trend-card__action">
            {footerText}
            <FiChevronRight aria-hidden="true" />
          </span>
        )}
      </div>
    </article>
  );
}