import {
  FiActivity,
  FiArrowDownRight,
  FiArrowRight,
  FiArrowUpRight,
  FiClock,
} from "react-icons/fi";

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


function getTrendConfig(trend) {
  const normalizedTrend = String(
    trend || "",
  )
    .trim()
    .toLowerCase();

  if (normalizedTrend === "improving") {
    return {
      label: "Improving",
      className: "improving",
      icon: <FiArrowUpRight />,
    };
  }

  if (normalizedTrend === "declining") {
    return {
      label: "Declining",
      className: "declining",
      icon: <FiArrowDownRight />,
    };
  }

  if (normalizedTrend === "stable") {
    return {
      label: "Stable",
      className: "stable",
      icon: <FiArrowRight />,
    };
  }

  return {
    label: "Unavailable",
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
}) {
  if (!isAvailable) {
    return {
      label: "Unavailable",
      className: "unavailable",
    };
  }

  if (isExecutiveFocus) {
    return {
      label: "Executive Focus",
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
      label: "Critical Forecast",
      className: "critical",
    };
  }

  if (normalizedTrend === "improving") {
    return {
      label: "Improving",
      className: "improving",
    };
  }

  if (
    normalizedTrend === "stable" &&
    Number.isFinite(varianceShift3) &&
    varianceShift3 < 0
  ) {
    return {
      label: "Watch List",
      className: "watch",
    };
  }

  return null;
}


function getHealthStatus(prediction) {
  if (
    prediction?.data_status !== "Available"
  ) {
    return {
      label: "Unavailable",
      className: "unavailable",
    };
  }

  const forecastValue = Number(
    prediction?.forecast_shift_3,
  );

  if (!Number.isFinite(forecastValue)) {
    return {
      label: "Unavailable",
      className: "unavailable",
    };
  }

  if (forecastValue >= 98) {
    return {
      label: "Healthy",
      className: "healthy",
    };
  }

  if (forecastValue >= 94) {
    return {
      label: "Watch",
      className: "watch",
    };
  }

  return {
    label: "Critical",
    className: "critical",
  };
}


function PredictionCard({
  prediction,
  isExecutiveFocus = false,
}) {
  const safePrediction =
    prediction || {};

  const isAvailable =
    safePrediction.data_status === "Available";

  const trendConfig = getTrendConfig(
    safePrediction.trend,
  );

  const healthStatus = getHealthStatus(
    safePrediction,
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

  return (
    <article className={cardClassName}>
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
            {safePrediction.kpi_name ||
              "Operational KPI"}
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
                Current
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
                3-shift change
              </span>

              <strong>
                {variancePrefix}
                {toDisplayValue(
                  safePrediction.variance_shift_3,
                )}{" "}
                pp
              </strong>
            </div>
          </section>

          <section className="prediction-card__forecast-grid">
            <div className="prediction-card__forecast-item">
              <span>
                <FiClock />
                Next shift
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
                Shift +2
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
                Shift +3
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
                Forecast confidence
              </span>

              <strong>
                {confidence}%
              </strong>
            </div>

            <div
              className="prediction-card__confidence-track"
              aria-label={`Forecast confidence ${confidence}%`}
            >
              <div
                className={`prediction-card__confidence-fill prediction-card__confidence-fill--${confidenceClass}`}
                style={{
                  width: `${safeConfidence}%`,
                }}
              />
            </div>

            <span className="prediction-card__history">
              Based on{" "}
              {safePrediction.history_points || 0}{" "}
              historical points
            </span>
          </footer>
        </>
      ) : (
        <>
          <div className="prediction-card__empty">
            <FiActivity />

            <strong>
              Forecast unavailable
            </strong>

            <p>
              Additional historical KPI data is
              required before a forecast can be
              generated.
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