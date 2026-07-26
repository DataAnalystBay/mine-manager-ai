import React from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowDownRight,
  FiArrowRight,
  FiArrowUpRight,
} from "react-icons/fi";

import "./OperationalDriversGrid.css";

function formatValue(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return Number.isInteger(numericValue)
    ? numericValue.toLocaleString()
    : numericValue.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
}

function normalizeDirection(direction, change) {
  const normalizedDirection = String(direction || "")
    .trim()
    .toLowerCase();

  if (
    normalizedDirection === "up" ||
    normalizedDirection === "increase" ||
    normalizedDirection === "improving"
  ) {
    return "positive";
  }

  if (
    normalizedDirection === "down" ||
    normalizedDirection === "decrease" ||
    normalizedDirection === "declining"
  ) {
    return "negative";
  }

  const numericChange = Number(change);

  if (numericChange > 0) {
    return "positive";
  }

  if (numericChange < 0) {
    return "negative";
  }

  return "neutral";
}

function normalizeImpact(impact) {
  const normalizedImpact = String(impact || "")
    .trim()
    .toLowerCase();

  if (
    normalizedImpact === "critical" ||
    normalizedImpact === "severe"
  ) {
    return {
      className: "critical",
      label: "Critical",
    };
  }

  if (normalizedImpact === "high") {
    return {
      className: "high",
      label: "High",
    };
  }

  if (
    normalizedImpact === "medium" ||
    normalizedImpact === "moderate"
  ) {
    return {
      className: "medium",
      label: "Medium",
    };
  }

  if (normalizedImpact === "low") {
    return {
      className: "low",
      label: "Low",
    };
  }

  return {
    className: "neutral",
    label: "Unrated",
  };
}

function getTrendIcon(direction) {
  if (direction === "positive") {
    return <FiArrowUpRight />;
  }

  if (direction === "negative") {
    return <FiArrowDownRight />;
  }

  return <FiArrowRight />;
}

function normalizeDrivers(drivers) {
  if (!Array.isArray(drivers)) {
    return [];
  }

  return drivers.map((driver, index) => ({
    id:
      driver?.id ??
      driver?.driver_key ??
      driver?.key ??
      `${driver?.name || driver?.title || "driver"}-${index}`,
    name:
      driver?.name ??
      driver?.driver_name ??
      driver?.title ??
      driver?.label ??
      `Operational Driver ${index + 1}`,
    value:
      driver?.value ??
      driver?.current_value ??
      driver?.metric_value ??
      driver?.score ??
      null,
    unit: driver?.unit ?? driver?.suffix ?? "",
    change:
      driver?.change ??
      driver?.change_percent ??
      driver?.variance ??
      driver?.delta ??
      null,
    direction: driver?.direction ?? driver?.trend ?? null,
    impact:
      driver?.impact ??
      driver?.impact_level ??
      driver?.severity ??
      "Unrated",
    description:
      driver?.description ??
      driver?.insight ??
      driver?.commentary ??
      "",
  }));
}

export default function OperationalDriversGrid({
  drivers = [],
  title = "Operational Drivers",
  subtitle = "Linked operating conditions influencing this KPI",
  loading = false,
  emptyMessage = "Operational driver data is not available for this KPI.",
  onDriverClick,
}) {
  const normalizedDrivers = normalizeDrivers(drivers);

  if (loading) {
    return (
      <section
        className="operational-drivers"
        aria-label={`${title} loading`}
      >
        <div className="operational-drivers-header">
          <div className="operational-drivers-heading">
            <span className="operational-drivers-heading-icon">
              <FiActivity />
            </span>

            <div>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="operational-drivers-grid">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="operational-driver-skeleton"
              key={`driver-skeleton-${index}`}
              aria-hidden="true"
            >
              <span />
              <strong />
              <small />
              <em />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="operational-drivers" aria-label={title}>
      <div className="operational-drivers-header">
        <div className="operational-drivers-heading">
          <span className="operational-drivers-heading-icon">
            <FiActivity />
          </span>

          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>

        {normalizedDrivers.length > 0 && (
          <span className="operational-drivers-count">
            {normalizedDrivers.length} driver
            {normalizedDrivers.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {normalizedDrivers.length === 0 ? (
        <div className="operational-drivers-empty">
          <FiAlertTriangle />
          <div>
            <strong>No driver analysis available</strong>
            <p>{emptyMessage}</p>
          </div>
        </div>
      ) : (
        <div className="operational-drivers-grid">
          {normalizedDrivers.map((driver) => {
            const direction = normalizeDirection(
              driver.direction,
              driver.change
            );

            const impact = normalizeImpact(driver.impact);
            const numericChange = Number(driver.change);
            const hasChange = Number.isFinite(numericChange);

            const cardContent = (
              <>
                <div className="operational-driver-card-top">
                  <span className="operational-driver-name">
                    {driver.name}
                  </span>

                  <span
                    className={`operational-driver-impact ${impact.className}`}
                  >
                    {impact.label}
                  </span>
                </div>

                <div className="operational-driver-value">
                  <strong>{formatValue(driver.value)}</strong>
                  {driver.unit && <span>{driver.unit}</span>}
                </div>

                <div
                  className={`operational-driver-trend ${direction}`}
                >
                  {getTrendIcon(direction)}

                  <span>
                    {hasChange ? (
                      <>
                        {numericChange > 0 ? "+" : ""}
                        {formatValue(driver.change)}%
                      </>
                    ) : (
                      "No change data"
                    )}
                  </span>
                </div>

                {driver.description && (
                  <p className="operational-driver-description">
                    {driver.description}
                  </p>
                )}

                {onDriverClick && (
                  <span className="operational-driver-drilldown">
                    View driver details
                    <FiArrowRight />
                  </span>
                )}
              </>
            );

            if (onDriverClick) {
              return (
                <button
                  type="button"
                  className="operational-driver-card clickable"
                  key={driver.id}
                  onClick={() => onDriverClick(driver)}
                  aria-label={`Open ${driver.name} details`}
                >
                  {cardContent}
                </button>
              );
            }

            return (
              <article
                className="operational-driver-card"
                key={driver.id}
              >
                {cardContent}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
