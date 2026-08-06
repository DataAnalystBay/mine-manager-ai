import React from "react";

import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiCpu,
  FiShield,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
  FiTruck,
  FiZap,
} from "react-icons/fi";

import {
  FaIndustry,
  FaMountain,
} from "react-icons/fa";

import "./ExecutiveAiInsightCard.css";


function normalizeSeverity(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (
    normalized === "critical" ||
    normalized === "severe"
  ) {
    return "critical";
  }

  if (normalized === "high") {
    return "high";
  }

  if (
    normalized === "medium" ||
    normalized === "moderate" ||
    normalized === "warning"
  ) {
    return "medium";
  }

  if (
    normalized === "low" ||
    normalized === "normal" ||
    normalized === "stable"
  ) {
    return "low";
  }

  return "neutral";
}


function getSeverityContent(value) {
  const severity = normalizeSeverity(value);

  const content = {
    critical: {
      className: "critical",
      label: "Critical",
      icon: <FiAlertTriangle />,
    },
    high: {
      className: "high",
      label: "High Priority",
      icon: <FiAlertTriangle />,
    },
    medium: {
      className: "medium",
      label: "Medium Priority",
      icon: <FiActivity />,
    },
    low: {
      className: "low",
      label: "Low Priority",
      icon: <FiCheckCircle />,
    },
    neutral: {
      className: "neutral",
      label: "Priority Unavailable",
      icon: <FiActivity />,
    },
  };

  return content[severity] || content.neutral;
}


function normalizeConfidence(confidence) {
  if (
    confidence === null ||
    confidence === undefined
  ) {
    return null;
  }

  if (typeof confidence === "string") {
    const numericValue = Number(
      confidence.replace("%", "").trim()
    );

    if (Number.isFinite(numericValue)) {
      return Math.min(
        Math.max(numericValue, 0),
        100
      );
    }

    return null;
  }

  const numericValue = Number(confidence);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const percentage =
    numericValue > 0 && numericValue <= 1
      ? numericValue * 100
      : numericValue;

  return Math.min(
    Math.max(percentage, 0),
    100
  );
}


function getTrendIcon(direction) {
  const normalized = String(direction || "")
    .trim()
    .toLowerCase();

  if (
    normalized === "declining" ||
    normalized === "down"
  ) {
    return <FiTrendingDown />;
  }

  return <FiTrendingUp />;
}


function getKpiIcon(kpiName) {
  const normalized = String(kpiName || "")
    .trim()
    .toLowerCase();

  if (normalized.includes("ore")) {
    return <FaMountain />;
  }

  if (normalized.includes("waste")) {
    return <FaMountain />;
  }

  if (
    normalized.includes("fleet") ||
    normalized.includes("truck")
  ) {
    return <FiTruck />;
  }

  if (
    normalized.includes("plant") ||
    normalized.includes("throughput") ||
    normalized.includes("recovery")
  ) {
    return <FaIndustry />;
  }

  if (
    normalized.includes("safety") ||
    normalized.includes("incident")
  ) {
    return <FiShield />;
  }

  return <FiCpu />;
}


function getTextValue(value) {
  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value.trim();
  }

  return "";
}


function formatVariance(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  const prefix = numericValue > 0 ? "+" : "";

  return `${prefix}${numericValue.toFixed(1)}%`;
}


export default function ExecutiveAiInsightCard({
  insight,
  summary,
  forecast,
  riskLevel,
  confidence,
  title = "AI Executive Insight",
}) {
  const cardTitle =
    getTextValue(insight?.title) ||
    getTextValue(title) ||
    "AI Executive Insight";

  const cardSummary =
    getTextValue(insight?.summary) ||
    getTextValue(summary);

  const kpiName =
    getTextValue(insight?.kpi_name) ||
    cardTitle;

  const severityValue =
    insight?.severity ||
    insight?.risk_level ||
    riskLevel;

  const cardConfidence =
    insight?.confidence ?? confidence;

  const confidencePercent =
    normalizeConfidence(cardConfidence);

  const severity =
    getSeverityContent(severityValue);

  const trendDirection =
    insight?.trend?.direction ||
    insight?.trend_direction ||
    "";

  const trendSummary =
    getTextValue(insight?.trend?.summary) ||
    getTextValue(forecast);

  const likelyDriver =
    getTextValue(insight?.likely_driver);

  const impactDescription =
    getTextValue(
      insight?.estimated_impact?.description
    );

  const recommendation =
    getTextValue(
      insight?.recommended_priority
    );

  const priority =
    getTextValue(insight?.priority);

  const confidenceLabel =
    getTextValue(insight?.confidence_label) ||
    "Rule-based estimate";

  const sourceType =
    getTextValue(insight?.source?.type)
      .replaceAll("_", " ");

  const performancePercent =
    Number(insight?.performance_percent);

  const variancePercent =
    Number(insight?.variance_percent);

  const hasPerformance =
    Number.isFinite(performancePercent);

  const hasVariance =
    Number.isFinite(variancePercent);

  return (
    <article
      className={
        `executive-ai-insight-card ${severity.className}`
      }
      aria-label={cardTitle}
    >
      <header className="executive-ai-card-header">
        <div className="executive-ai-card-title-group">
          <span className="executive-ai-card-kpi-icon">
            {getKpiIcon(kpiName)}
          </span>

          <div className="executive-ai-card-heading-copy">
            <span className="executive-ai-card-eyebrow">
              Mine Manager AI
            </span>

            <h3>{cardTitle}</h3>

            {priority && (
              <p className="executive-ai-card-priority">
                {priority}
              </p>
            )}
          </div>
        </div>

        <span
          className={
            `executive-ai-card-severity ${severity.className}`
          }
        >
          {severity.icon}
          {severity.label}
        </span>
      </header>

      <div className="executive-ai-card-summary-row">
        <div className="executive-ai-card-summary">
          <span className="executive-ai-card-section-label">
            Executive Summary
          </span>

          <p>
            {cardSummary ||
              "Executive interpretation is not currently available for this KPI."}
          </p>
        </div>

        {(hasPerformance || hasVariance) && (
          <div className="executive-ai-card-metrics">
            {hasPerformance && (
              <div>
                <span>Performance</span>
                <strong>
                  {performancePercent.toFixed(1)}%
                </strong>
              </div>
            )}

            {hasVariance && (
              <div>
                <span>Variance</span>
                <strong
                  className={
                    variancePercent < 0
                      ? "negative"
                      : variancePercent > 0
                      ? "positive"
                      : ""
                  }
                >
                  {formatVariance(variancePercent)}
                </strong>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="executive-ai-card-detail-grid">
        <section className="executive-ai-card-detail full">
          <span className="executive-ai-card-detail-icon trend">
            {getTrendIcon(trendDirection)}
          </span>

          <div>
            <span className="executive-ai-card-section-label">
              Performance Trend
            </span>

            <p>
              {trendSummary ||
                "Trend information is not currently available."}
            </p>
          </div>
        </section>

        <section className="executive-ai-card-detail">
          <span className="executive-ai-card-detail-icon driver">
            <FiActivity />
          </span>

          <div>
            <span className="executive-ai-card-section-label">
              Likely Driver
            </span>

            <p>
              {likelyDriver ||
                "No material operating driver identified."}
            </p>
          </div>
        </section>

        <section className="executive-ai-card-detail">
          <span className="executive-ai-card-detail-icon impact">
            <FiTarget />
          </span>

          <div>
            <span className="executive-ai-card-section-label">
              Estimated Impact
            </span>

            <p>
              {impactDescription ||
                "No material negative impact estimated."}
            </p>
          </div>
        </section>
      </div>

      <section className="executive-ai-card-recommendation">
        <span className="executive-ai-card-detail-icon action">
          <FiZap />
        </span>

        <div>
          <span className="executive-ai-card-section-label">
            Recommended Management Priority
          </span>

          <p>
            {recommendation ||
              "Continue monitoring operational performance."}
          </p>
        </div>
      </section>

      <footer className="executive-ai-card-footer">
        <div className="executive-ai-card-source">
          <FiCheckCircle />

          <span>
            Operational KPI trends, configured targets
            {sourceType
              ? ` and ${sourceType}`
              : ""}
          </span>
        </div>

        <div className="executive-ai-card-confidence">
          <div className="executive-ai-card-confidence-heading">
            <span>{confidenceLabel}</span>

            <strong>
              {confidencePercent !== null
                ? `${Math.round(confidencePercent)}%`
                : "—"}
            </strong>
          </div>

          <div
            className="executive-ai-card-confidence-track"
            role="progressbar"
            aria-label="Executive insight confidence"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={
              confidencePercent !== null
                ? Math.round(confidencePercent)
                : 0
            }
          >
            <span
              style={{
                width: `${
                  confidencePercent !== null
                    ? confidencePercent
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </footer>
    </article>
  );
}