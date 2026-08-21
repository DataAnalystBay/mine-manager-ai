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
import { useLanguage } from "../../context/LanguageContext";
import { translateDynamicKpiName } from "../../i18n/dynamicTranslations";

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

function formatDate(dateValue, language) {
  if (!dateValue) {
    return "—";
  }

  const rawValue = String(dateValue).trim();

  const isoDateMatch = rawValue.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (
    language === "MN" &&
    isoDateMatch
  ) {
    const month = Number(
      isoDateMatch[2]
    );

    const day = Number(
      isoDateMatch[3]
    );

    return `${month}-р сарын ${day}`;
  }

  const date = new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return rawValue;
  }

  if (language === "MN") {
    return `${
      date.getMonth() + 1
    }-р сарын ${date.getDate()}`;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
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

function translateTemplate(t, key, variables = {}) {
  let value = t(key);

  Object.entries(variables).forEach(([name, replacement]) => {
    value = String(value).replaceAll(
      `{${name}}`,
      String(replacement ?? "")
    );
  });

  return value;
}

function getKpiStatus(data, t) {
  const currentValue = Number(data?.current_value);
  const target = Number(data?.target);

  if (!Number.isFinite(currentValue) || !Number.isFinite(target)) {
    return {
      level: "neutral",
      label: t("executiveKpiDetail.status.unavailable"),
      headline: t("executiveKpiDetail.status.unavailableHeadline"),
      description: t("executiveKpiDetail.status.unavailableDescription"),
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
      label: t("executiveKpiDetail.status.aboveTarget"),
      headline: t("executiveKpiDetail.status.aboveTargetHeadline"),
      description: translateTemplate(
        t,
        "executiveKpiDetail.status.aboveTargetDescription",
        { gap: Math.abs(performanceGap).toFixed(1) }
      ),
    };
  }

  if (performanceGap <= -nearTargetThreshold) {
    return {
      level: "negative",
      label: t("executiveKpiDetail.status.belowTarget"),
      headline: t("executiveKpiDetail.status.belowTargetHeadline"),
      description: translateTemplate(
        t,
        "executiveKpiDetail.status.belowTargetDescription",
        { gap: Math.abs(performanceGap).toFixed(1) }
      ),
    };
  }

  return {
    level: "warning",
    label: t("executiveKpiDetail.status.nearTarget"),
    headline: t("executiveKpiDetail.status.nearTargetHeadline"),
    description: translateTemplate(
      t,
      "executiveKpiDetail.status.nearTargetDescription",
      { threshold: nearTargetThreshold }
    ),
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

function getDriverItems(data, t) {
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
    name: translateDynamicKpiName(
      driver.name ??
        driver.driver_name ??
        driver.title ??
        driver.label ??
        translateTemplate(
          t,
          "executiveKpiDetail.operationalDriverFallback",
          { number: index + 1 }
        ),
      t
    ),
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
      t("executiveKpiDetail.medium"),
  }));
}

function getSupportingRows(data, dailyValues, t) {
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
      date:
        row.date ??
        row.report_date ??
        row.label ??
        translateTemplate(
          t,
          "executiveKpiDetail.dayFallback",
          { number: index + 1 }
        ),
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
  const {
    language: uiLanguage,
    t,
  } = useLanguage();

  const configuredCompanyName =
    company?.company_name ||
    data?.company_name ||
    "Mine Manager AI";

  const configuredMineName =
    mine?.mine_name ||
    data?.mine_name ||
    t("executiveKpiDetail.configuredMine");

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
        t("executiveKpiDetail.exportSuccess")
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
              t("executiveKpiDetail.exportError")
          );
        } catch {
          setExportError(
            t("executiveKpiDetail.exportError")
          );
        }
      } else {
        setExportError(
          responseData?.detail ||
            t("executiveKpiDetail.exportError")
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
  const kpiStatus = getKpiStatus(data, t);

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

  const operationalDrivers = getDriverItems(data, t);
  const supportingRows = getSupportingRows(data, dailyValues, t);

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
              {t("executiveKpiDetail.title")}
            </span>

            <div className="kpi-dialog-title-row">
              <h2 id="kpi-dialog-title">
                {data?.kpi_name
                  ? translateDynamicKpiName(data.kpi_name, t)
                  : t("executiveKpiDetail.kpiDetail")}
              </h2>

              <span className="kpi-live-status">
                <span aria-hidden="true" />
                {t("executiveKpiDetail.liveData")}
              </span>
            </div>

            <p>
              {uiLanguage === "MN"
                ? t("executiveKpiDetail.last7Days")
                : data?.period_label || t("executiveKpiDetail.last7Days")}
            </p>
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
                {exportingPdf
                  ? t("executiveKpiDetail.generating")
                  : t("executiveKpiDetail.exportPdf")}
              </span>
            </button>

            <button
              type="button"
              className="kpi-dialog-close"
              onClick={onClose}
              aria-label={t("executiveKpiDetail.closeAria")}
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
              aria-label={t("executiveKpiDetail.dismissExportSuccess")}
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
              aria-label={t("executiveKpiDetail.dismissExportError")}
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
              <h3>{t("executiveKpiDetail.loadErrorTitle")}</h3>
              <p>{error}</p>
            </div>

            {onRetry && (
              <button type="button" onClick={onRetry}>
                {t("executiveKpiDetail.retry")}
              </button>
            )}
          </div>
        )}

        {!loading && !error && data && (
          <div className="kpi-dialog-content">
            <section className="kpi-dialog-summary kpi-dialog-summary-four">
              <div>
                <span>{t("executiveKpiDetail.currentValue")}</span>
                <strong>
                  {formatValue(data.current_value)}
                  <small>{data.unit || ""}</small>
                </strong>
                <small className="kpi-summary-caption">{t("executiveKpiDetail.currentPeriod")}</small>
              </div>

              <div>
                <span>{t("executiveKpiDetail.target")}</span>
                <strong>
                  {formatValue(data.target)}
                  <small>
                    {data.unit || ""}</small>
                </strong>
                <small className="kpi-summary-caption">{t("executiveKpiDetail.configuredPlan")}</small>
              </div>

              <div>
                <span>{t("executiveKpiDetail.change")}</span>
                <strong className={changeClass}>
                  {changePrefix}
                  {formatValue(data.change)}
                  <small>
                    {data.unit === "%" ? " pp" : data.unit || ""}
                  </small>
                </strong>

                <small className={`kpi-summary-caption ${changeClass}`}>
                  {changeClass === "negative" ? (
                    <FiTrendingDown />
                  ) : (
                    <FiTrendingUp />
                  )}
                  {t("executiveKpiDetail.versusPreviousPeriod")}
                </small>
              </div>

              <div>
                <span>{t("executiveKpiDetail.confidence")}</span>
                <strong>
                  {confidence !== null ? Math.round(confidence) : "—"}
                  <small>{confidence !== null ? "%" : ""}</small>
                </strong>
                <small className="kpi-summary-caption">
                  {t("executiveKpiDetail.aiAnalysisConfidence")}
                </small>
              </div>
            </section>

            <div className="kpi-analysis-grid">
              <section className="performance-card kpi-analysis-panel">
                <div className="kpi-dialog-section-heading">
                  <div>
                    <h3>{t("executiveKpiDetail.performanceTrend")}</h3>
                    <p>{t("executiveKpiDetail.dailyValuesSubtitle")}</p>
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
                      aria-label={t("executiveKpiDetail.trendChartAria")}
                    >
                      <line x1="0" y1="90" x2="100" y2="90" />
                      <line x1="0" y1="55" x2="100" y2="55" />
                      <line x1="0" y1="20" x2="100" y2="20" />
                      <polyline points={chartPoints} />
                    </svg>
                  ) : (
                    <p>{t("executiveKpiDetail.noTrendValues")}</p>
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
                        <span>{formatDate(item.date, uiLanguage)}</span>
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
                  title={t("executiveKpiDetail.historicalAnalysis")}
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
                  title={t("executiveKpiDetail.operationalDrivers")}
                  subtitle={t("executiveKpiDetail.operationalDriversSubtitle")}
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
                  title={t("executiveKpiDetail.supportingData")}
                  subtitle={t("executiveKpiDetail.supportingDataSubtitle")}
                />
              </section>
            </div>

            <section
              className={`kpi-status-banner kpi-status-banner-compact ${kpiStatus.level}`}
              aria-label={translateTemplate(t, "executiveKpiDetail.statusAria", { status: kpiStatus.label })}
            >
              <div className="kpi-status-icon">
                {renderStatusIcon(kpiStatus.level)}
              </div>

              <div className="kpi-status-content">
                <div className="kpi-status-topline">
                  <span className="kpi-status-eyebrow">
                    {t("executiveKpiDetail.executiveStatus")}
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
            {t("executiveKpiDetail.noAnalysis")}
          </div>
        )}
      </div>
    </div>
  );
}
