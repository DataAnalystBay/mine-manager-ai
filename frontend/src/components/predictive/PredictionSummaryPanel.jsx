import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
} from "react-icons/fi";

import {
  getPredictionSummary,
} from "../../api/predictionsApi";

import ExecutiveForecastRiskStrip from "./ExecutiveForecastRiskStrip";
import PredictionCard from "./PredictionCard";

import "./PredictionSummaryPanel.css";


const PREDICTION_ORDER = [
  "mine_health",
  "ore_production",
  "waste_movement",
  "fleet_performance",
  "plant_performance",
  "safety_performance",
];


function getOutlookConfig(outlook) {
  const normalizedOutlook = String(
    outlook || "",
  )
    .trim()
    .toLowerCase();

  if (normalizedOutlook === "improving") {
    return {
      label: "Improving",
      className: "improving",
      icon: <FiCheckCircle />,
    };
  }

  if (
    normalizedOutlook ===
    "attention required"
  ) {
    return {
      label: "Attention Required",
      className: "attention",
      icon: <FiAlertTriangle />,
    };
  }

  if (normalizedOutlook === "stable") {
    return {
      label: "Stable",
      className: "stable",
      icon: <FiActivity />,
    };
  }

  return {
    label: outlook || "Unavailable",
    className: "unavailable",
    icon: <FiActivity />,
  };
}


function formatGeneratedAt(value) {
  if (!(value instanceof Date)) {
    return "Not generated";
  }

  return value.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}


function getPredictionPriority(
  prediction,
) {
  if (
    prediction?.data_status !==
    "Available"
  ) {
    return 6;
  }

  const trend = String(
    prediction?.trend || "",
  )
    .trim()
    .toLowerCase();

  const variance = Number(
    prediction?.variance_shift_3,
  );

  const safeVariance =
    Number.isFinite(variance)
      ? variance
      : 0;

  if (
    trend === "declining" &&
    safeVariance <= -1.5
  ) {
    return 1;
  }

  if (trend === "declining") {
    return 2;
  }

  if (
    trend === "stable" &&
    safeVariance < 0
  ) {
    return 3;
  }

  if (trend === "stable") {
    return 4;
  }

  if (trend === "improving") {
    return 5;
  }

  return 6;
}


function PredictionSummaryPanel({
  mineName = "Oyu Tolgoi Surface",
}) {
  const [
    predictionData,
    setPredictionData,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    generatedAt,
    setGeneratedAt,
  ] = useState(null);

  const loadPredictions = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result =
        await getPredictionSummary(
          mineName,
        );

      setPredictionData(result);
      setGeneratedAt(new Date());
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Unable to load Predictive Intelligence.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, [mineName]);

  const orderedPredictions = useMemo(() => {
    const predictions =
      PREDICTION_ORDER.map(
        (predictionKey) =>
          predictionData?.predictions?.[
            predictionKey
          ],
      ).filter(Boolean);

    return [...predictions].sort(
      (
        firstPrediction,
        secondPrediction,
      ) => {
        const priorityDifference =
          getPredictionPriority(
            firstPrediction,
          ) -
          getPredictionPriority(
            secondPrediction,
          );

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        const firstVariance = Number(
          firstPrediction
            ?.variance_shift_3,
        );

        const secondVariance = Number(
          secondPrediction
            ?.variance_shift_3,
        );

        const safeFirstVariance =
          Number.isFinite(firstVariance)
            ? firstVariance
            : 0;

        const safeSecondVariance =
          Number.isFinite(secondVariance)
            ? secondVariance
            : 0;

        return (
          safeFirstVariance -
          safeSecondVariance
        );
      },
    );
  }, [predictionData]);

  const highestRiskKpiName = useMemo(() => {
    const availablePredictions =
      orderedPredictions.filter(
        (prediction) =>
          prediction?.data_status ===
            "Available" &&
          Number.isFinite(
            Number(
              prediction?.variance_shift_3,
            ),
          ),
      );

    if (!availablePredictions.length) {
      return null;
    }

    const highestRiskPrediction =
      availablePredictions.reduce(
        (
          currentHighestRisk,
          prediction,
        ) => {
          const currentVariance = Number(
            currentHighestRisk
              ?.variance_shift_3 ?? 0,
          );

          const predictionVariance = Number(
            prediction
              ?.variance_shift_3 ?? 0,
          );

          return predictionVariance <
            currentVariance
            ? prediction
            : currentHighestRisk;
        },
        availablePredictions[0],
      );

    const highestRiskVariance = Number(
      highestRiskPrediction
        ?.variance_shift_3,
    );

    if (
      !Number.isFinite(
        highestRiskVariance,
      ) ||
      highestRiskVariance >= 0
    ) {
      return null;
    }

    return highestRiskPrediction.kpi_name;
  }, [orderedPredictions]);

  const outlookConfig =
    getOutlookConfig(
      predictionData?.overall_outlook,
    );

  const overallConfidence = Number(
    predictionData?.overall_confidence || 0,
  );

  const availableCount = Number(
    predictionData?.data_quality
      ?.available_count || 0,
  );

  const unavailableCount = Number(
    predictionData?.data_quality
      ?.unavailable_count || 0,
  );

  const totalForecastCount =
    availableCount + unavailableCount;

  const generatedAtLabel =
    formatGeneratedAt(generatedAt);

  return (
    <section className="prediction-summary">
      <header className="prediction-summary__header">
        <div>
          <p className="prediction-summary__eyebrow">
            Sprint 10.19
          </p>

          <h2 className="prediction-summary__title">
            Predictive Intelligence
          </h2>

          <p className="prediction-summary__subtitle">
            Short-term operational forecasts
            for the next three shifts.
          </p>
        </div>

        <div className="prediction-summary__header-actions">
          <div className="prediction-summary__generated">
            <span>
              Forecast generated
            </span>

            <strong>
              {generatedAtLabel}
            </strong>
          </div>

          <button
            type="button"
            className="prediction-summary__refresh"
            onClick={loadPredictions}
            disabled={isLoading}
          >
            <FiRefreshCw
              className={
                isLoading
                  ? "prediction-summary__refresh-icon--spinning"
                  : ""
              }
            />

            <span>
              {isLoading
                ? "Refreshing"
                : "Refresh forecasts"}
            </span>
          </button>
        </div>
      </header>

      {isLoading && !predictionData ? (
        <div className="prediction-summary__state">
          <div className="prediction-summary__loader" />

          <strong>
            Loading Predictive Intelligence
          </strong>

          <p>
            Analysing recent KPI performance
            and generating three-shift
            forecasts.
          </p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="prediction-summary__state prediction-summary__state--error">
          <FiAlertTriangle />

          <strong>
            Forecasts could not be loaded
          </strong>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={loadPredictions}
          >
            Try again
          </button>
        </div>
      ) : null}

      {predictionData ? (
        <>
          <section className="prediction-summary__overview">
            <div className="prediction-summary__overview-main">
              <div className="prediction-summary__overview-heading">
                <div
                  className={`prediction-summary__outlook prediction-summary__outlook--${outlookConfig.className}`}
                >
                  {outlookConfig.icon}

                  <span>
                    {outlookConfig.label}
                  </span>
                </div>

                <span className="prediction-summary__overview-label">
                  Executive Forecast
                </span>
              </div>

              <h3>
                Executive Forecast Outlook
              </h3>

              <p className="prediction-summary__overview-message">
                {
                  predictionData.executive_message
                }
              </p>

              <div className="prediction-summary__overview-note">
                Forecast horizon: next three
                operational shifts
              </div>
            </div>

            <div className="prediction-summary__metrics">
              <div className="prediction-summary__metric">
                <span>
                  Overall confidence
                </span>

                <strong>
                  {overallConfidence}%
                </strong>
              </div>

              <div className="prediction-summary__metric">
                <span>
                  Available forecasts
                </span>

                <strong>
                  {availableCount}/
                  {totalForecastCount}
                </strong>
              </div>

              <div className="prediction-summary__metric">
                <span>
                  Data quality
                </span>

                <strong>
                  {predictionData
                    ?.data_quality
                    ?.data_quality_status ||
                    "Unknown"}
                </strong>
              </div>
            </div>
          </section>

          <ExecutiveForecastRiskStrip
            predictions={orderedPredictions}
            overallConfidence={
              overallConfidence
            }
          />

          <div className="prediction-summary__grid">
            {orderedPredictions.map(
              (prediction) => (
                <PredictionCard
                  key={
                    prediction.kpi_name
                  }
                  prediction={
                    prediction
                  }
                  isExecutiveFocus={
                    prediction.kpi_name ===
                    highestRiskKpiName
                  }
                />
              ),
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}


export default PredictionSummaryPanel;