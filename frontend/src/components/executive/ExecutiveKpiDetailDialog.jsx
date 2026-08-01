import React, { useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";

import { exportExecutiveKpiPdf } from "../../api/executivePdfApi";
import { useConfig } from "../../context/ConfigContext";

import ExecutiveAiInsightCard from "./ExecutiveAiInsightCard";
import ExecutiveKpiSkeleton from "./ExecutiveKpiSkeleton";
import ExecutiveRecommendationCard from "./ExecutiveRecommendationCard";
import ExecutiveRootCauseCard from "./ExecutiveRootCauseCard";
import HistoricalAnalysisCard from "./HistoricalAnalysisCard";
import OperationalDriversGrid from "./OperationalDriversGrid";
import RelatedExecutiveActions from "./RelatedExecutiveActions";
import SupportingDataTable from "./SupportingDataTable";
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

  const parsed = Number(String(confidence).replace("%", "").trim());

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const percentage = parsed > 0 && parsed <= 1 ? parsed * 100 : parsed;

  return Math.min(Math.max(percentage, 0), 100);
}

function getKpiStatus(data) {
  const currentValue = Number(data?.current_value);
  const target = Number(data?.target);

  if (!Number.isFinite(currentValue) || !Number.isFinite(target)) {
    return {
      level: "neutral",
      label: "Status unavailable",
      headline: "Performance status cannot be calculated",
      description:
        "Current performance or target information is unavailable.",
    };
  }

  const higherIsBetter = data?.higher_is_better !== false;

  const targetGap =
    target === 0
      ? currentValue - target
      : ((currentValue - target) / Math.abs(target)) * 100;

  const performanceGap = higherIsBetter ? targetGap : -targetGap;
  const nearTargetThreshold = 3;

  if (performanceGap >= nearTargetThreshold) {
    return {
      level: "positive",
      label: "Above target",
      headline: "Current performance is above target",
      description: `Performance is ${Math.abs(performanceGap).toFixed(
        1
      )}% better than the configured target.`,
    };
  }

  if (performanceGap <= -nearTargetThreshold) {
    return {
      level: "negative",
      label: "Below target",
      headline: "Current performance is below target",
      description: `Performance is ${Math.abs(performanceGap).toFixed(
        1
      )}% behind the configured target.`,
    };
  }

  return {
    level: "warning",
    label: "Near target",
    headline: "Current performance is close to target",
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

  if (level === "warning" || level === "negative") {
    return <FiAlertCircle />;
  }

  return <FiTarget />;
}

function getDriverItems(data) {
  const candidates =
    data?.operational_drivers ??
    data?.drivers ??
    data?.linked_operational_drivers ??
    data?.top_drivers ??
    [];

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.slice(0, 5).map((driver, index) => ({
    id: driver.id ?? driver.driver_key ?? `${driver.name ?? "driver"}-${index}`,
    name:
      driver.name ??
      driver.driver_name ??
      driver.title ??
      driver.label ??
      `Operational Driver ${index + 1}`,
    value:
      driver.value ??
      driver.current_value ??
      driver.metric_value ??
      driver.score ??
      null,
    unit: driver.unit ?? "",
    change:
      driver.change ??
      driver.change_percent ??
      driver.variance ??
      driver.delta ??
      null,
    direction: driver.direction ?? null,
    impact:
      driver.impact ??
      driver.impact_level ??
      driver.severity ??
      "Medium",
  }));
}

function getSupportingRows(data, dailyValues) {
  const candidates =
    data?.supporting_data ??
    data?.supporting_rows ??
    data?.evidence ??
    dailyValues;

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.slice(0, 7).map((row, index) => {
    const actual = row.actual ?? row.value ?? row.current_value ?? null;
    const plan = row.plan ?? row.target ?? data?.target ?? null;

    const numericActual = Number(actual);
    const numericPlan = Number(plan);

    const variance =
      row.variance ??
      (Number.isFinite(numericActual) && Number.isFinite(numericPlan)
        ? numericActual - numericPlan
        : null);

    const percentOfPlan =
      row.percent_of_plan ??
      row.plan_attainment ??
      (Number.isFinite(numericActual) &&
      Number.isFinite(numericPlan) &&
      numericPlan !== 0
        ? (numericActual / numericPlan) * 100
        : null);

    return {
      id: row.id ?? row.date ?? `supporting-row-${index}`,
      date: row.date ?? row.report_date ?? row.label ?? `Day ${index + 1}`,
      actual,
      plan,
      variance,
      percentOfPlan,
    };
  });
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
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportSuccess, setExportSuccess] = useState("");

  const { company, mine } = useConfig();

  const configuredCompanyName =
    company?.company_name ||
    data?.company_name ||
    "Mine Manager AI";

  const configuredMineName =
    mine?.mine_name ||
    data?.mine_name ||
    "Configured Mine";

  const handleExportPdf = async () => {
    const selectedKpiKey = kpiKey || data?.kpi_key;

    if (!selectedKpiKey || exportingPdf) {
      return;
    }

    setExportingPdf(true);
    setExportError("");
    setExportSuccess("");

    try {
      const { blob, filename } = await exportExecutiveKpiPdf({
        kpiKey: selectedKpiKey,
        mineName: configuredMineName,
        companyName: configuredCompanyName,
        days: 14,
        actionLimit: 5,
        includeCompletedActions: true,
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = filename;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setExportSuccess(
        "Executive KPI Analysis PDF downloaded successfully."
      );

      window.setTimeout(() => {
        setExportSuccess("");
      }, 4000);
    } catch (exportException) {
      setExportSuccess("");

      console.error(
        "Unable to export Executive KPI PDF:",
        exportException
      );

      const responseData = exportException?.response?.data;

      if (responseData instanceof Blob) {
        try {
          const errorText = await responseData.text();
          const parsedError = JSON.parse(errorText);

          setExportError(
            parsedError?.detail ||
              "Unable to generate the Executive KPI PDF."
          );
        } catch {
          setExportError(
            "Unable to generate the Executive KPI PDF."
          );
        }
      } else {
        setExportError(
          responseData?.detail ||
            "Unable to generate the Executive KPI PDF."
        );
      }
    } finally {
      setExportingPdf(false);
    }
  };
  if (!open) {
    return null;
  }

  const dailyValues = Array.isArray(data?.daily_values)
    ? data.daily_values
    : [];

  const rootCauses = Array.isArray(data?.root_causes)
    ? data.root_causes
    : Array.isArray(data?.top_drivers)
      ? data.top_drivers
      : [];

  const recommendations = Array.isArray(data?.recommendations)
    ? data.recommendations
    : [];

  const chartPoints = buildChartPoints(dailyValues);
  const kpiStatus = getKpiStatus(data);

  const changeClass = getChangeClass(data?.direction, data?.change);

  const confidenceRaw =
    data?.confidence ??
    data?.confidence_level ??
    data?.ai_confidence ??
    null;

  const confidence = normalizeConfidence(confidenceRaw);

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

  const previousValue =
    data?.previous_value ??
    data?.previous_period_value ??
    data?.prior_value ??
    data?.last_period_value ??
    null;

  const operationalDrivers = getDriverItems(data);
  const supportingRows = getSupportingRows(data, dailyValues);

  const numericChange = Number(data?.change);
  const changePrefix = numericChange > 0 ? "+" : "";

  return (
    <div className="kpi-dialog-backdrop" onMouseDown={onClose}>
      <div
        className="kpi-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kpi-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="kpi-dialog-header">
          <div className="kpi-dialog-header-copy">
            <span className="kpi-dialog-label">
              Executive KPI Analysis
            </span>

            <div className="kpi-dialog-title-row">
              <h2 id="kpi-dialog-title">
                {data?.kpi_name || "KPI Detail"}
              </h2>

              <span className="kpi-live-status">
                <span aria-hidden="true" />
                Live Data
              </span>
            </div>

            <p>{data?.period_label || "Last 7 Days"}</p>
          </div>

          <div className="kpi-dialog-header-actions">
            <span className={`kpi-header-status ${kpiStatus.level}`}>
              {kpiStatus.label}
            </span>

            <button
              type="button"
              className="kpi-export-pdf-button"
              onClick={handleExportPdf}
              disabled={
                exportingPdf ||
                loading ||
                Boolean(error) ||
                !data ||
                !(kpiKey || data?.kpi_key)
              }
            >
              <FiDownload />
              <span>
                {exportingPdf ? "Generating..." : "Export PDF"}
              </span>
            </button>

            <button
              type="button"
              className="kpi-dialog-close"
              onClick={onClose}
              aria-label="Close KPI detail"
            >
              <FiX />
            </button>
          </div>
        </header>

        {exportSuccess && (
          <div className="kpi-export-success" role="status">
            <FiCheckCircle />

            <span>{exportSuccess}</span>

            <button
              type="button"
              onClick={() => setExportSuccess("")}
              aria-label="Dismiss export success message"
            >
              <FiX />
            </button>
          </div>
        )}

        {exportError && (
          <div className="kpi-export-error" role="alert">
            <FiAlertCircle />
            <span>{exportError}</span>

            <button
              type="button"
              onClick={() => setExportError("")}
              aria-label="Dismiss export error"
            >
              <FiX />
            </button>
          </div>
        )}

        {loading && (
          <div className="kpi-dialog-content">
            <ExecutiveKpiSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="kpi-dialog-state error">
            <FiAlertCircle />

            <div>
              <h3>Unable to load KPI analysis</h3>
              <p>{error}</p>
            </div>

            {onRetry && (
              <button type="button" onClick={onRetry}>
                Retry
              </button>
            )}
          </div>
        )}

        {!loading && !error && data && (
          <div className="kpi-dialog-content">
            <section className="kpi-dialog-summary kpi-dialog-summary-four">
              <div>
                <span>Current Value</span>
                <strong>
                  {formatValue(data.current_value)}
                  <small>{data.unit || ""}</small>
                </strong>
                <small className="kpi-summary-caption">Current period</small>
              </div>

              <div>
                <span>Target</span>
                <strong>
                  {formatValue(data.target)}
                  <small>{data.unit || ""}</small>
                </strong>
                <small className="kpi-summary-caption">Configured plan</small>
              </div>

              <div>
                <span>Change</span>
                <strong className={changeClass}>
                  {changePrefix}
                  {formatValue(data.change)}
                  <small>{data.unit || ""}</small>
                </strong>

                <small className={`kpi-summary-caption ${changeClass}`}>
                  {changeClass === "negative" ? (
                    <FiTrendingDown />
                  ) : (
                    <FiTrendingUp />
                  )}
                  Versus previous period
                </small>
              </div>

              <div>
                <span>Confidence</span>
                <strong>
                  {confidence !== null ? Math.round(confidence) : "—"}
                  <small>{confidence !== null ? "%" : ""}</small>
                </strong>
                <small className="kpi-summary-caption">
                  AI analysis confidence
                </small>
              </div>
            </section>

            <div className="kpi-analysis-grid">
              <section className="performance-card kpi-analysis-panel">
                <div className="kpi-dialog-section-heading">
                  <div>
                    <h3>Performance Trend</h3>
                    <p>Daily values for the selected period</p>
                  </div>

                  <span>
                    {Number(data.change_percent) > 0 ? "+" : ""}
                    {formatValue(data.change_percent)}%
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
                      <line x1="0" y1="90" x2="100" y2="90" />
                      <line x1="0" y1="55" x2="100" y2="55" />
                      <line x1="0" y1="20" x2="100" y2="20" />
                      <polyline points={chartPoints} />
                    </svg>
                  ) : (
                    <p>No trend values available.</p>
                  )}
                </div>

                {dailyValues.length > 0 && (
                  <div className="kpi-dialog-daily-values">
                    {dailyValues.map((item, index) => (
                      <div
                        key={
                          item.date ||
                          `${item.value}-${index}`
                        }
                      >
                        <span>{formatDate(item.date)}</span>
                        <strong>
                          {formatValue(item.value)}
                          {data.unit || ""}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="insight-card kpi-analysis-panel">
                <ExecutiveAiInsightCard
                  summary={aiSummary}
                  forecast={aiForecast}
                  riskLevel={aiRiskLevel}
                  confidence={confidence}
                />
              </section>

              <section className="historical-card kpi-analysis-panel">
                <HistoricalAnalysisCard
                  dailyValues={dailyValues}
                  currentValue={data.current_value}
                  previousValue={previousValue}
                  unit={data.unit || ""}
                  title="Historical Analysis"
                />
              </section>

              <section className="rootcause-card kpi-analysis-panel">
                <ExecutiveRootCauseCard causes={rootCauses} />
              </section>

              <section className="recommendation-card kpi-analysis-panel">
                <ExecutiveRecommendationCard
                  recommendations={recommendations}
                />
              </section>

              <section className="drivers-card kpi-analysis-panel">
                <OperationalDriversGrid
                  drivers={operationalDrivers}
                  title="Operational Drivers"
                  subtitle="Linked operating conditions influencing this KPI"
                />
              </section>

              <section className="actions-card kpi-analysis-panel">
                <RelatedExecutiveActions
                  kpiKey={kpiKey || data?.kpi_key || ""}
                  onOpenActionCenter={onOpenActionCenter}
                />
              </section>

              <section className="supporting-card kpi-analysis-panel">
                <SupportingDataTable
                  rows={supportingRows}
                  unit={data.unit || ""}
                  title="Supporting Data"
                  subtitle="Evidence used in the KPI analysis"
                />
              </section>
            </div>

            <section
              className={`kpi-status-banner kpi-status-banner-compact ${kpiStatus.level}`}
              aria-label={`KPI status: ${kpiStatus.label}`}
            >
              <div className="kpi-status-icon">
                {renderStatusIcon(kpiStatus.level)}
              </div>

              <div className="kpi-status-content">
                <div className="kpi-status-topline">
                  <span className="kpi-status-eyebrow">
                    Executive Status
                  </span>

                  <span
                    className={`kpi-status-pill ${kpiStatus.level}`}
                  >
                    {kpiStatus.label}
                  </span>
                </div>

                <h3>{kpiStatus.headline}</h3>
                <p>{kpiStatus.description}</p>
              </div>
            </section>
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
