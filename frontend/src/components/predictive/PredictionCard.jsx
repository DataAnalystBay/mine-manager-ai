import {
  FiActivity,
  FiArrowDownRight,
  FiArrowRight,
  FiArrowUpRight,
  FiClock,
} from "react-icons/fi";

import { useLanguage } from "../../context/LanguageContext";
import { translateDynamicKpiName } from "../../i18n/dynamicTranslations";
import PredictionRecommendation from "./PredictionRecommendation";
import PredictionSparkline from "./PredictionSparkline";

import "./PredictionCard.css";


function toDisplayValue(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return Number(value).toFixed(1);
}


function translateTemplate(t, key, variables = {}) {
  let text = t(key);

  Object.entries(variables).forEach(
    ([name, value]) => {
      text = String(text).replaceAll(
        `{${name}}`,
        String(value ?? ""),
      );
    },
  );

  return text;
}


function getTrendConfig(trend, t) {
  const normalizedTrend = String(
    trend || "",
  )
    .trim()
    .toLowerCase();

  if (normalizedTrend === "improving") {
    return {
      label: t(
        "predictionCard.trend.improving",
      ),
      className: "improving",
      icon: <FiArrowUpRight />,
    };
  }

  if (normalizedTrend === "declining") {
    return {
      label: t(
        "predictionCard.trend.declining",
      ),
      className: "declining",
      icon: <FiArrowDownRight />,
    };
  }

  if (normalizedTrend === "stable") {
    return {
      label: t(
        "predictionCard.trend.stable",
      ),
      className: "stable",
      icon: <FiArrowRight />,
    };
  }

  return {
    label: t(
      "predictionCard.trend.unavailable",
    ),
    className: "unavailable",
    icon: <FiActivity />,
  };
}


function getConfidenceClass(confidence) {
  if (confidence >= 95) {
    return "excellent";
  }

  if (confidence >= 85) {
    return "high";
  }

  if (confidence >= 70) {
    return "medium";
  }

  return "low";
}


function getRibbonConfig({
  isAvailable,
  isExecutiveFocus,
  trend,
  varianceShift3,
  t,
}) {
  if (!isAvailable) {
    return {
      label: t(
        "predictionCard.ribbon.unavailable",
      ),
      className: "unavailable",
    };
  }

  if (isExecutiveFocus) {
    return {
      label: t(
        "predictionCard.ribbon.executiveFocus",
      ),
      className: "focus",
    };
  }

  const normalizedTrend = String(
    trend || "",
  )
    .trim()
    .toLowerCase();

  if (normalizedTrend === "declining") {
    return {
      label: t(
        "predictionCard.ribbon.criticalForecast",
      ),
      className: "critical",
    };
  }

  if (normalizedTrend === "improving") {
    return {
      label: t(
        "predictionCard.ribbon.improving",
      ),
      className: "improving",
    };
  }

  if (
    normalizedTrend === "stable" &&
    Number.isFinite(varianceShift3) &&
    varianceShift3 < 0
  ) {
    return {
      label: t(
        "predictionCard.ribbon.watchList",
      ),
      className: "watch",
    };
  }

  return null;
}


function getHealthStatus(prediction, t) {
  if (
    prediction?.data_status !== "Available"
  ) {
    return {
      label: t(
        "predictionCard.health.unavailable",
      ),
      className: "unavailable",
    };
  }

  const forecastValue = Number(
    prediction?.forecast_shift_3,
  );

  if (!Number.isFinite(forecastValue)) {
    return {
      label: t(
        "predictionCard.health.unavailable",
      ),
      className: "unavailable",
    };
  }

  if (forecastValue >= 98) {
    return {
      label: t(
        "predictionCard.health.healthy",
      ),
      className: "healthy",
    };
  }

  if (forecastValue >= 94) {
    return {
      label: t(
        "predictionCard.health.watch",
      ),
      className: "watch",
    };
  }

  return {
    label: t(
      "predictionCard.health.critical",
    ),
    className: "critical",
  };
}


function PredictionCard({
  prediction,
  isExecutiveFocus = false,
}) {
  const { t } = useLanguage();

  const safePrediction =
    prediction || {};

  const translatedKpiName =
    translateDynamicKpiName(
      safePrediction.kpi_name,
      t,
    ) ||
    t(
      "predictionCard.operationalKpi",
    );

  const isAvailable =
    safePrediction.data_status === "Available";

  const trendConfig = getTrendConfig(
    safePrediction.trend,
    t,
  );

  const healthStatus = getHealthStatus(
    safePrediction,
    t,
  );

  const confidence = Number(
    safePrediction.confidence || 0,
  );

  const safeConfidence = Math.max(
    0,
    Math.min(100, confidence),
  );

  const confidenceClass =
    getConfidenceClass(
      safeConfidence,
    );

  const varianceShift3 = Number(
    safePrediction.variance_shift_3,
  );

  const variancePrefix =
    Number.isFinite(varianceShift3) &&
    varianceShift3 > 0
      ? "+"
      : "";

  const ribbonConfig = getRibbonConfig({
    isAvailable,
    isExecutiveFocus,
    trend: safePrediction.trend,
    varianceShift3,
    t,
  });

  const cardClassName = [
    "prediction-card",
    `prediction-card--${trendConfig.className}`,
    ribbonConfig
      ? "prediction-card--has-ribbon"
      : "",
    isExecutiveFocus
      ? "prediction-card--executive-focus"
      : "",
    !isAvailable
      ? "prediction-card--unavailable"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const confidenceAriaLabel =
    translateTemplate(
      t,
      "predictionCard.confidenceAria",
      {
        confidence,
      },
    );

  const historyLabel = translateTemplate(
    t,
    "predictionCard.historyPoints",
    {
      count:
        safePrediction.history_points || 0,
    },
  );

  return (
    <article
      className={cardClassName}
      aria-label={translatedKpiName}
    >
      {ribbonConfig ? (
        <div
          className={`prediction-card__status-ribbon prediction-card__status-ribbon--${ribbonConfig.className}`}
        >
          {ribbonConfig.label}
        </div>
      ) : null}

      <header className="prediction-card__header">
        <div>
          <div
            className={`prediction-card__health-status prediction-card__health-status--${healthStatus.className}`}
          >
            <span className="prediction-card__health-dot" />

            <span>
              {healthStatus.label}
            </span>
          </div>

          <h3 className="prediction-card__title">
            {translatedKpiName}
          </h3>
        </div>

        <div
          className={`prediction-card__trend prediction-card__trend--${trendConfig.className}`}
        >
          {trendConfig.icon}

          <span>
            {trendConfig.label}
          </span>
        </div>
      </header>

      {isAvailable ? (
        <>
          <section className="prediction-card__current">
            <div>
              <span className="prediction-card__label">
                {t(
                  "predictionCard.current",
                )}
              </span>

              <strong className="prediction-card__current-value">
                {toDisplayValue(
                  safePrediction.current_value,
                )}

                <small>%</small>
              </strong>
            </div>

            <div className="prediction-card__variance">
              <span>
                {t(
                  "predictionCard.threeShiftChange",
                )}
              </span>

              <strong>
                {variancePrefix}
                {toDisplayValue(
                  safePrediction.variance_shift_3,
                )}{" "}
                {t(
                  "predictionCard.percentagePoints",
                )}
              </strong>
            </div>
          </section>

          <section className="prediction-card__forecast-grid">
            <div className="prediction-card__forecast-item">
              <span>
                <FiClock />
                {t(
                  "predictionCard.nextShift",
                )}
              </span>

              <strong>
                {toDisplayValue(
                  safePrediction.forecast_next_shift,
                )}
                %
              </strong>
            </div>

            <div className="prediction-card__forecast-item">
              <span>
                <FiClock />
                {t(
                  "predictionCard.shiftPlus2",
                )}
              </span>

              <strong>
                {toDisplayValue(
                  safePrediction.forecast_shift_2,
                )}
                %
              </strong>
            </div>

            <div className="prediction-card__forecast-item">
              <span>
                <FiClock />
                {t(
                  "predictionCard.shiftPlus3",
                )}
              </span>

              <strong>
                {toDisplayValue(
                  safePrediction.forecast_shift_3,
                )}
                %
              </strong>
            </div>
          </section>

          <PredictionSparkline
            current={
              safePrediction.current_value
            }
            nextShift={
              safePrediction.forecast_next_shift
            }
            shift2={
              safePrediction.forecast_shift_2
            }
            shift3={
              safePrediction.forecast_shift_3
            }
            trend={
              safePrediction.trend
            }
          />

          <PredictionRecommendation
            prediction={safePrediction}
          />

          <footer className="prediction-card__footer">
            <div className="prediction-card__confidence-heading">
              <span>
                {t(
                  "predictionCard.forecastConfidence",
                )}
              </span>

              <strong>
                {confidence}%
              </strong>
            </div>

            <div
              className="prediction-card__confidence-track"
              aria-label={confidenceAriaLabel}
            >
              <div
                className={`prediction-card__confidence-fill prediction-card__confidence-fill--${confidenceClass}`}
                style={{
                  width: `${safeConfidence}%`,
                }}
              />
            </div>

            <span className="prediction-card__history">
              {historyLabel}
            </span>
          </footer>
        </>
      ) : (
        <>
          <div className="prediction-card__empty">
            <FiActivity />

            <strong>
              {t(
                "predictionCard.forecastUnavailable",
              )}
            </strong>

            <p>
              {t(
                "predictionCard.additionalHistoryRequired",
              )}
            </p>
          </div>

          <PredictionRecommendation
            prediction={safePrediction}
          />
        </>
      )}
    </article>
  );
}


export default PredictionCard;
