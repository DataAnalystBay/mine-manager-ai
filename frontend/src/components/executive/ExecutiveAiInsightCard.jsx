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

import { useLanguage } from "../../context/LanguageContext";

import {
  translateDynamicExecutiveText,
  translateDynamicInsightTitle,
  translateDynamicKpiName,
  translateDynamicPriority,
  translateDynamicSourceType,
} from "../../i18n/dynamicTranslations";

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


function getSeverityContent(value, t) {
  const severity = normalizeSeverity(value);

  const content = {
    critical: {
      className: "critical",
      label: t(
        "executiveAiInsightCard.severity.critical"
      ),
      icon: <FiAlertTriangle />,
    },

    high: {
      className: "high",
      label: t(
        "executiveAiInsightCard.severity.high"
      ),
      icon: <FiAlertTriangle />,
    },

    medium: {
      className: "medium",
      label: t(
        "executiveAiInsightCard.severity.medium"
      ),
      icon: <FiActivity />,
    },

    low: {
      className: "low",
      label: t(
        "executiveAiInsightCard.severity.low"
      ),
      icon: <FiCheckCircle />,
    },

    neutral: {
      className: "neutral",
      label: t(
        "executiveAiInsightCard.severity.unavailable"
      ),
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

  const prefix =
    numericValue > 0
      ? "+"
      : "";

  return `${prefix}${numericValue.toFixed(1)}%`;
}


export default function ExecutiveAiInsightCard({
  insight,
  summary,
  forecast,
  riskLevel,
  confidence,
  title,
}) {
  const { t } = useLanguage();

  const defaultTitle = t(
    "executiveAiInsightCard.defaultTitle"
  );

  const rawTitle =
    getTextValue(insight?.title) ||
    getTextValue(title);

  const cardTitle =
    rawTitle
      ? translateDynamicInsightTitle(
          rawTitle,
          t
        )
      : defaultTitle;

  const rawCardSummary =
    getTextValue(insight?.summary) ||
    getTextValue(summary);

  const cardSummary =
    rawCardSummary
      ? translateDynamicExecutiveText(
          rawCardSummary,
          t
        )
      : "";

  const rawKpiName =
    getTextValue(insight?.kpi_name) ||
    rawTitle ||
    cardTitle;

  const translatedKpiName =
    translateDynamicKpiName(
      rawKpiName,
      t
    ) || cardTitle;

  const severityValue =
    insight?.severity ||
    insight?.risk_level ||
    riskLevel;

  const cardConfidence =
    insight?.confidence ?? confidence;

  const confidencePercent =
    normalizeConfidence(
      cardConfidence
    );

  const severity =
    getSeverityContent(
      severityValue,
      t
    );

  const trendDirection =
    insight?.trend?.direction ||
    insight?.trend_direction ||
    "";

  const rawTrendSummary =
    getTextValue(
      insight?.trend?.summary
    ) ||
    getTextValue(forecast);

  const trendSummary =
    rawTrendSummary
      ? translateDynamicExecutiveText(
          rawTrendSummary,
          t
        )
      : "";

  const rawLikelyDriver =
    getTextValue(
      insight?.likely_driver
    );

  const likelyDriver =
    rawLikelyDriver
      ? translateDynamicExecutiveText(
          rawLikelyDriver,
          t
        )
      : "";

  const rawImpactDescription =
    getTextValue(
      insight?.estimated_impact?.description
    );

  const impactDescription =
    rawImpactDescription
      ? translateDynamicExecutiveText(
          rawImpactDescription,
          t
        )
      : "";

  const rawRecommendation =
    getTextValue(
      insight?.recommended_priority
    );

  const recommendation =
    rawRecommendation
      ? translateDynamicExecutiveText(
          rawRecommendation,
          t
        )
      : "";

  const rawPriority =
    getTextValue(
      insight?.priority
    );

  const priority =
    rawPriority
      ? translateDynamicPriority(
          rawPriority,
          t
        )
      : "";

  const rawConfidenceLabel =
    getTextValue(
      insight?.confidence_label
    );

  const confidenceLabel =
    rawConfidenceLabel
      ? translateDynamicSourceType(
          rawConfidenceLabel,
          t
        )
      : t(
          "executiveAiInsightCard.ruleBasedEstimate"
        );

  const rawSourceType =
    getTextValue(
      insight?.source?.type
    );

  const sourceType =
    rawSourceType
      ? translateDynamicSourceType(
          rawSourceType,
          t
        )
      : "";

  const performancePercent =
    Number(
      insight?.performance_percent
    );

  const variancePercent =
    Number(
      insight?.variance_percent
    );

  const hasPerformance =
    Number.isFinite(
      performancePercent
    );

  const hasVariance =
    Number.isFinite(
      variancePercent
    );

  return (
    <article
      className={
        `executive-ai-insight-card ${severity.className}`
      }
      aria-label={cardTitle}
    >
      {/* ==================================================
          1. CARD HEADER
          KPI identity + severity only.
          ================================================== */}
      <header className="executive-ai-card-header">
        <div className="executive-ai-card-title-group">
          <span
            className="executive-ai-card-kpi-icon"
            aria-hidden="true"
          >
            {getKpiIcon(
              rawKpiName
            )}
          </span>

          <div className="executive-ai-card-heading-copy">
            <span className="executive-ai-card-eyebrow">
              {t("common.appName")}
            </span>

            <h3>
              {cardTitle}
            </h3>

            {translatedKpiName &&
              translatedKpiName !== cardTitle && (
                <p className="executive-ai-card-kpi-name">
                  {translatedKpiName}
                </p>
              )}

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

      {/* ==================================================
          2. EXECUTIVE SUMMARY + PRIMARY KPI METRICS
          Answer "What is happening?" first.
          ================================================== */}
      <div className="executive-ai-card-summary-row">
        <div className="executive-ai-card-summary">
          <span className="executive-ai-card-section-label">
            {t(
              "executiveAiInsightCard.executiveSummary"
            )}
          </span>

          <p className="executive-ai-card-summary-text">
            {cardSummary ||
              t(
                "executiveAiInsightCard.noExecutiveInterpretation"
              )}
          </p>
        </div>

        {(hasPerformance ||
          hasVariance) && (
          <div
            className="executive-ai-card-metrics"
            aria-label={t(
              "executiveAiInsightCard.performance"
            )}
          >
            {hasPerformance && (
              <div className="executive-ai-card-metric">
                <span>
                  {t(
                    "executiveAiInsightCard.performance"
                  )}
                </span>

                <strong>
                  {performancePercent.toFixed(1)}%
                </strong>
              </div>
            )}

            {hasVariance && (
              <div className="executive-ai-card-metric">
                <span>
                  {t(
                    "executiveAiInsightCard.variance"
                  )}
                </span>

                <strong
                  className={
                    variancePercent < 0
                      ? "negative"
                      : variancePercent > 0
                      ? "positive"
                      : ""
                  }
                >
                  {formatVariance(
                    variancePercent
                  )}
                </strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================
          3. MANAGEMENT ACTION
          Deliberately moved above diagnostic detail so an
          executive can see the decision/action immediately.
          ================================================== */}
      <section
        className="executive-ai-card-recommendation executive-ai-card-recommendation--primary"
      >
        <span
          className="executive-ai-card-detail-icon action"
          aria-hidden="true"
        >
          <FiZap />
        </span>

        <div className="executive-ai-card-recommendation-copy">
          <span className="executive-ai-card-section-label">
            {t(
              "executiveAiInsightCard.recommendedPriority"
            )}
          </span>

          <p>
            {recommendation ||
              t(
                "executiveAiInsightCard.continueMonitoring"
              )}
          </p>
        </div>
      </section>

      {/* ==================================================
          4. SUPPORTING ANALYSIS
          Why / trend / likely impact.
          ================================================== */}
      <div className="executive-ai-card-detail-grid executive-ai-card-analysis-grid">
        <section className="executive-ai-card-detail full executive-ai-card-detail--trend">
          <span
            className="executive-ai-card-detail-icon trend"
            aria-hidden="true"
          >
            {getTrendIcon(
              trendDirection
            )}
          </span>

          <div className="executive-ai-card-detail-copy">
            <span className="executive-ai-card-section-label">
              {t(
                "executiveAiInsightCard.performanceTrend"
              )}
            </span>

            <p>
              {trendSummary ||
                t(
                  "executiveAiInsightCard.noTrendInformation"
                )}
            </p>
          </div>
        </section>

        <section className="executive-ai-card-detail executive-ai-card-detail--driver">
          <span
            className="executive-ai-card-detail-icon driver"
            aria-hidden="true"
          >
            <FiActivity />
          </span>

          <div className="executive-ai-card-detail-copy">
            <span className="executive-ai-card-section-label">
              {t(
                "executiveAiInsightCard.likelyDriver"
              )}
            </span>

            <p>
              {likelyDriver ||
                t(
                  "executiveAiInsightCard.noDriverIdentified"
                )}
            </p>
          </div>
        </section>

        <section className="executive-ai-card-detail executive-ai-card-detail--impact">
          <span
            className="executive-ai-card-detail-icon impact"
            aria-hidden="true"
          >
            <FiTarget />
          </span>

          <div className="executive-ai-card-detail-copy">
            <span className="executive-ai-card-section-label">
              {t(
                "executiveAiInsightCard.estimatedImpact"
              )}
            </span>

            <p>
              {impactDescription ||
                t(
                  "executiveAiInsightCard.noNegativeImpact"
                )}
            </p>
          </div>
        </section>
      </div>

      {/* ==================================================
          5. SOURCE + CONFIDENCE
          Secondary evidence, intentionally last.
          ================================================== */}
      <footer className="executive-ai-card-footer">
        <div className="executive-ai-card-source">
          <FiCheckCircle aria-hidden="true" />

          <span>
            {t(
              "executiveAiInsightCard.sourceBase"
            )}

            {sourceType
              ? ` ${t(
                  "executiveAiInsightCard.and"
                )} ${sourceType}`
              : ""}
          </span>
        </div>

        <div className="executive-ai-card-confidence">
          <div className="executive-ai-card-confidence-heading">
            <span>
              {confidenceLabel}
            </span>

            <strong>
              {confidencePercent !== null
                ? `${Math.round(
                    confidencePercent
                  )}%`
                : "—"}
            </strong>
          </div>

          <div
            className="executive-ai-card-confidence-track"
            role="progressbar"
            aria-label={t(
              "executiveAiInsightCard.confidenceAria"
            )}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={
              confidencePercent !== null
                ? Math.round(
                    confidencePercent
                  )
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
