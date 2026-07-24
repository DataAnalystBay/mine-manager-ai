import React from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiTarget,
  FiX,
} from "react-icons/fi";

import ExecutiveAiInsightCard from "./ExecutiveAiInsightCard";
import ExecutiveKpiSkeleton from "./ExecutiveKpiSkeleton";
import ExecutiveRecommendationCard from "./ExecutiveRecommendationCard";
import ExecutiveRootCauseCard from "./ExecutiveRootCauseCard";
import RelatedExecutiveActions from "./RelatedExecutiveActions";
import "./ExecutiveKpiDetailDialog.css";

function buildChartPoints(values) {
  if (!values?.length) {
    return "";
  }

  const numbers = values
    .map((item) => Number(item.value))
    .filter((value) => Number.isFinite(value));

  if (!numbers.length) {
    return "";
  }

  const minimum = Math.min(...numbers);
  const maximum = Math.max(...numbers);
  const range = maximum - minimum || 1;

  return numbers
    .map((value, index) => {
      const x =
        numbers.length === 1
          ? 50
          : (index / (numbers.length - 1)) * 100;

      const normalized = (value - minimum) / range;
      const y = 90 - normalized * 70;

      return `${x},${y}`;
    })
    .join(" ");
}

function formatValue(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return Number.isInteger(number)
    ? number.toLocaleString()
    : number.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function normalizeConfidence(confidence) {
  if (confidence === null || confidence === undefined) {
    return null;
  }

  const parsed = Number(
    String(confidence).replace("%", "").trim()
  );

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const percentage =
    parsed > 0 && parsed <= 1
      ? parsed * 100
      : parsed;

  return Math.min(Math.max(percentage, 0), 100);
}

function getKpiStatus(data) {
  const currentValue = Number(data?.current_value);
  const target = Number(data?.target);

  if (
    !Number.isFinite(currentValue) ||
    !Number.isFinite(target)
  ) {
    return {
      level: "neutral",
      label: "Status unavailable",
      headline:
        "Performance status cannot be calculated",
      description:
        "Current performance or target information is unavailable.",
    };
  }

  const higherIsBetter =
    data?.higher_is_better !== false;

  const targetGap =
    target === 0
      ? currentValue - target
      : ((currentValue - target) /
          Math.abs(target)) *
        100;

  const performanceGap = higherIsBetter
    ? targetGap
    : -targetGap;

  const nearTargetThreshold = 3;

  if (performanceGap >= nearTargetThreshold) {
    return {
      level: "positive",
      label: "Above target",
      headline:
        "Current performance is above target",
      description: `Performance is ${Math.abs(
        performanceGap
      ).toFixed(
        1
      )}% better than the configured target.`,
    };
  }

  if (performanceGap <= -nearTargetThreshold) {
    return {
      level: "negative",
      label: "Below target",
      headline:
        "Current performance is below target",
      description: `Performance is ${Math.abs(
        performanceGap
      ).toFixed(
        1
      )}% behind the configured target.`,
    };
  }

  return {
    level: "warning",
    label: "Near target",
    headline:
      "Current performance is close to target",
    description: `Performance is within ${nearTargetThreshold}% of the configured target.`,
  };
}

function getChangeClass(direction, change) {
  if (direction === "down") {
    return "negative";
  }

  if (direction === "up") {
    return "positive";
  }

  const numericChange = Number(change);

  if (numericChange > 0) {
    return "positive";
  }

  if (numericChange < 0) {
    return "negative";
  }

  return "";
}

function renderStatusIcon(level) {
  if (level === "positive") {
    return <FiCheckCircle />;
  }

  if (
    level === "warning" ||
    level === "negative"
  ) {
    return <FiAlertCircle />;
  }

  return <FiTarget />;
}

export default function ExecutiveKpiDetailDialog({
  open,
  loading = false,
  error = "",
  data = null,
  kpiKey = "",
  onClose,
  onRetry,
  onOpenActionCenter,
}) {
  if (!open) {
    return null;
  }

  const dailyValues = Array.isArray(
    data?.daily_values
  )
    ? data.daily_values
    : [];

  const rootCauses = Array.isArray(
    data?.root_causes
  )
    ? data.root_causes
    : Array.isArray(data?.top_drivers)
      ? data.top_drivers
      : [];

  const recommendations = Array.isArray(
    data?.recommendations
  )
    ? data.recommendations
    : [];

  const chartPoints =
    buildChartPoints(dailyValues);

  const kpiStatus = getKpiStatus(data);

  const changeClass = getChangeClass(
    data?.direction,
    data?.change
  );

  const confidenceRaw =
    data?.confidence ??
    data?.confidence_level ??
    data?.ai_confidence ??
    null;

  const confidence =
    normalizeConfidence(confidenceRaw);

  const aiSummary =
    data?.executive_insight ??
    data?.ai_summary ??
    data?.insight ??
    data?.summary ??
    "";

  const aiForecast =
    data?.forecast ??
    data?.forward_outlook ??
    data?.outlook ??
    "";

  const aiRiskLevel =
    data?.risk_level ??
    data?.risk_status ??
    data?.operational_risk ??
    "neutral";

  return (
    <div
      className="kpi-dialog-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="kpi-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kpi-dialog-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="kpi-dialog-header">
          <div>
            <span className="kpi-dialog-label">
              Executive KPI Analysis
            </span>

            <h2 id="kpi-dialog-title">
              {data?.kpi_name || "KPI Detail"}
            </h2>

            <p>
              {data?.period_label ||
                "Last 7 Days"}
            </p>
          </div>

          <button
            type="button"
            className="kpi-dialog-close"
            onClick={onClose}
            aria-label="Close KPI detail"
          >
            <FiX />
          </button>
        </header>

        {loading && (
          <div className="kpi-dialog-content">
            <ExecutiveKpiSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="kpi-dialog-state error">
            <FiAlertCircle />

            <div>
              <h3>
                Unable to load KPI analysis
              </h3>
              <p>{error}</p>
            </div>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {!loading && !error && data && (
          <div className="kpi-dialog-content">
            <section
              className={`kpi-status-banner ${kpiStatus.level}`}
              aria-label={`KPI status: ${kpiStatus.label}`}
            >
              <div className="kpi-status-icon">
                {renderStatusIcon(
                  kpiStatus.level
                )}
              </div>

              <div className="kpi-status-content">
                <div className="kpi-status-topline">
                  <span className="kpi-status-eyebrow">
                    KPI Status
                  </span>

                  <span
                    className={`kpi-status-pill ${kpiStatus.level}`}
                  >
                    {kpiStatus.label}
                  </span>
                </div>

                <h3>{kpiStatus.headline}</h3>

                <p>
                  {kpiStatus.description}
                </p>

                <div className="kpi-status-metadata">
                  <span>
                    Current:
                    <strong>
                      {formatValue(
                        data.current_value
                      )}
                      {data.unit || ""}
                    </strong>
                  </span>

                  <span>
                    Target:
                    <strong>
                      {formatValue(
                        data.target
                      )}
                      {data.unit || ""}
                    </strong>
                  </span>

                  {confidence !== null && (
                    <span>
                      Confidence:
                      <strong>
                        {Math.round(
                          confidence
                        )}
                        %
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="kpi-dialog-summary">
              <div>
                <span>Current Value</span>

                <strong>
                  {formatValue(
                    data.current_value
                  )}
                  <small>
                    {data.unit || ""}
                  </small>
                </strong>
              </div>

              <div>
                <span>Target</span>

                <strong>
                  {formatValue(data.target)}
                  <small>
                    {data.unit || ""}
                  </small>
                </strong>
              </div>

              <div>
                <span>Change</span>

                <strong
                  className={changeClass}
                >
                  {Number(data.change) > 0
                    ? "+"
                    : ""}
                  {formatValue(data.change)}
                  <small>
                    {data.unit || ""}
                  </small>
                </strong>
              </div>
            </section>

            <section className="kpi-dialog-chart-section">
              <div className="kpi-dialog-section-heading">
                <div>
                  <h3>
                    Performance Trend
                  </h3>

                  <p>
                    Daily values for the
                    selected period
                  </p>
                </div>

                <span>
                  {Number(
                    data.change_percent
                  ) > 0
                    ? "+"
                    : ""}
                  {formatValue(
                    data.change_percent
                  )}
                  %
                </span>
              </div>

              <div className="kpi-dialog-chart">
                {chartPoints ? (
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="KPI trend chart"
                  >
                    <line
                      x1="0"
                      y1="90"
                      x2="100"
                      y2="90"
                    />

                    <line
                      x1="0"
                      y1="55"
                      x2="100"
                      y2="55"
                    />

                    <line
                      x1="0"
                      y1="20"
                      x2="100"
                      y2="20"
                    />

                    <polyline
                      points={chartPoints}
                    />
                  </svg>
                ) : (
                  <p>
                    No trend values available.
                  </p>
                )}
              </div>

              {dailyValues.length > 0 && (
                <div className="kpi-dialog-daily-values">
                  {dailyValues.map(
                    (item, index) => (
                      <div
                        key={
                          item.date ||
                          `${item.value}-${index}`
                        }
                      >
                        <span>
                          {formatDate(
                            item.date
                          )}
                        </span>

                        <strong>
                          {formatValue(
                            item.value
                          )}
                          {data.unit || ""}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            <ExecutiveAiInsightCard
              summary={aiSummary}
              forecast={aiForecast}
              riskLevel={aiRiskLevel}
              confidence={confidence}
            />

            <ExecutiveRootCauseCard
              causes={rootCauses}
            />

            <ExecutiveRecommendationCard
              recommendations={
                recommendations
              }
            />

            <RelatedExecutiveActions
              kpiKey={
                kpiKey ||
                data?.kpi_key ||
                ""
              }
              onOpenActionCenter={
                onOpenActionCenter
              }
            />
          </div>
        )}

        {!loading && !error && !data && (
          <div className="kpi-dialog-state">
            No KPI analysis is available.
          </div>
        )}
      </div>
    </div>
  );
}