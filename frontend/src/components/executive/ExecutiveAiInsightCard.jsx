import React from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiCpu,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";

import "./ExecutiveAiInsightCard.css";

function normalizeRiskLevel(riskLevel) {
  const normalized = String(riskLevel || "")
    .trim()
    .toLowerCase();

  if (
    normalized === "high" ||
    normalized === "critical" ||
    normalized === "severe"
  ) {
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

function getRiskContent(riskLevel) {
  const normalizedRisk = normalizeRiskLevel(riskLevel);

  if (normalizedRisk === "high") {
    return {
      className: "high",
      label: "High Risk",
      icon: <FiAlertTriangle />,
    };
  }

  if (normalizedRisk === "medium") {
    return {
      className: "medium",
      label: "Moderate Risk",
      icon: <FiAlertTriangle />,
    };
  }

  if (normalizedRisk === "low") {
    return {
      className: "low",
      label: "Low Risk",
      icon: <FiShield />,
    };
  }

  return {
    className: "neutral",
    label: "Risk Unavailable",
    icon: <FiShield />,
  };
}

function normalizeConfidence(confidence) {
  if (confidence === null || confidence === undefined) {
    return null;
  }

  if (typeof confidence === "string") {
    const numericValue = Number(
      confidence.replace("%", "").trim()
    );

    if (Number.isFinite(numericValue)) {
      return Math.min(Math.max(numericValue, 0), 100);
    }

    return null;
  }

  const numericValue = Number(confidence);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  /*
   * Supports confidence values in either format:
   * 0.92 or 92
   */
  const percentage =
    numericValue > 0 && numericValue <= 1
      ? numericValue * 100
      : numericValue;

  return Math.min(Math.max(percentage, 0), 100);
}

export default function ExecutiveAiInsightCard({
  summary,
  forecast,
  riskLevel,
  confidence,
  title = "AI Executive Insight",
}) {
  const risk = getRiskContent(riskLevel);
  const confidencePercent = normalizeConfidence(confidence);

  const hasSummary =
    typeof summary === "string" &&
    summary.trim().length > 0;

  const hasForecast =
    typeof forecast === "string" &&
    forecast.trim().length > 0;

  return (
    <section
      className="executive-ai-insight"
      aria-label={title}
    >
      <div className="executive-ai-insight-header">
        <div className="executive-ai-insight-title">
          <span className="executive-ai-insight-icon">
            <FiCpu />
          </span>

          <div>
            <span className="executive-ai-insight-eyebrow">
              Mine Manager AI
            </span>

            <h3>{title}</h3>
          </div>
        </div>

        <span
          className={`executive-ai-risk-badge ${risk.className}`}
        >
          {risk.icon}
          {risk.label}
        </span>
      </div>

      <div className="executive-ai-insight-body">
        {hasSummary ? (
          <p className="executive-ai-summary">
            {summary}
          </p>
        ) : (
          <p className="executive-ai-summary empty">
            AI interpretation is not currently available for
            this KPI.
          </p>
        )}

        {hasForecast && (
          <div className="executive-ai-forecast">
            <span>
              <FiTrendingUp />
            </span>

            <div>
              <small>Forward Outlook</small>
              <p>{forecast}</p>
            </div>
          </div>
        )}
      </div>

      <footer className="executive-ai-insight-footer">
        <div className="executive-ai-model-status">
          <FiCheckCircle />

          <span>
            Generated from operational KPI trends and configured
            targets
          </span>
        </div>

        <div className="executive-ai-confidence">
          <div className="executive-ai-confidence-heading">
            <span>AI Confidence</span>

            <strong>
              {confidencePercent !== null
                ? `${Math.round(confidencePercent)}%`
                : "—"}
            </strong>
          </div>

          <div
            className="executive-ai-confidence-track"
            role="progressbar"
            aria-label="AI confidence"
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
    </section>
  );
}