import {
  useCallback,
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

import { useLanguage } from "../../context/LanguageContext";
import ExecutiveForecastRiskStrip from "./ExecutiveForecastRiskStrip";
import PredictionCard from "./PredictionCard";

import "./PredictionSummaryPanel.css";


const STANDARD_PREDICTION_ORDER = [
  "mine_health",
  "production",
  "ore_production",
  "waste_movement",
  "fleet_performance",
  "plant_performance",
  "safety_performance",
];

const SXEW_PREDICTION_ORDER = [
  "mine_health",
  "production",
  "plant_performance",
  "cu_recovery",
  "safety_performance",
];


function resolveOperationProfile(
  predictionData,
  mineName,
) {
  const backendProfile = String(
    predictionData?.operation_profile ||
      predictionData?.operationProfile ||
      "",
  )
    .trim()
    .toLowerCase();

  if (backendProfile) {
    return backendProfile;
  }

  const normalizedMineName = String(
    mineName || "",
  )
    .trim()
    .toLowerCase();

  if (
    normalizedMineName.includes("achit-ikht") ||
    normalizedMineName.includes("achit ikht") ||
    normalizedMineName.includes("copper cathode")
  ) {
    return "sxew_copper";
  }

  return "standard_mine";
}


function getPredictionOrder(
  operationProfile,
) {
  if (operationProfile === "sxew_copper") {
    return SXEW_PREDICTION_ORDER;
  }

  return STANDARD_PREDICTION_ORDER;
}


function getOutlookConfig(outlook, t) {
  const normalizedOutlook = String(
    outlook || "",
  )
    .trim()
    .toLowerCase();

  if (normalizedOutlook === "improving") {
    return {
      label: t(
        "predictionSummary.outlook.improving",
      ),
      className: "improving",
      icon: <FiCheckCircle />,
    };
  }

  if (
    normalizedOutlook ===
    "attention required"
  ) {
    return {
      label: t(
        "predictionSummary.outlook.attentionRequired",
      ),
      className: "attention",
      icon: <FiAlertTriangle />,
    };
  }

  if (normalizedOutlook === "stable") {
    return {
      label: t(
        "predictionSummary.outlook.stable",
      ),
      className: "stable",
      icon: <FiActivity />,
    };
  }

  return {
    label:
      outlook ||
      t(
        "predictionSummary.outlook.unavailable",
      ),
    className: "unavailable",
    icon: <FiActivity />,
  };
}


function formatGeneratedAt(
  value,
  language,
  fallbackLabel,
) {
  if (!(value instanceof Date)) {
    return fallbackLabel;
  }

  return value.toLocaleString(
    language === "MN"
      ? "mn-MN"
      : "en-GB",
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
  const {
    language: uiLanguage,
    t,
  } = useLanguage();

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

  const loadPredictions =
    useCallback(async () => {
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
        console.error(
          "Prediction summary load failed:",
          requestError,
        );

        setError(
          t(
            "predictionSummary.loadError",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    }, [mineName, t]);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  const operationProfile = useMemo(
    () =>
      resolveOperationProfile(
        predictionData,
        mineName,
      ),
    [
      predictionData,
      mineName,
    ],
  );

  const isSxewOperation =
    operationProfile === "sxew_copper";


  const operationProfileLabel = useMemo(() => {
    if (!isSxewOperation) {
      return "";
    }

    return uiLanguage === "MN"
      ? "SX-EW зэсийн үйл ажиллагаа"
      : "SX-EW Copper Operation";
  }, [
    isSxewOperation,
    uiLanguage,
  ]);


  const orderedPredictions = useMemo(() => {
    const predictionMap =
      predictionData?.predictions || {};

    const predictionOrder =
      getPredictionOrder(
        operationProfile,
      );

    const orderedByProfile =
      predictionOrder
        .map(
          (predictionKey) =>
            predictionMap?.[
              predictionKey
            ],
        )
        .filter(Boolean);

    const knownPredictionObjects =
      new Set(orderedByProfile);

    const extraPredictions =
      Object.values(
        predictionMap,
      ).filter(
        (prediction) =>
          prediction &&
          !knownPredictionObjects.has(
            prediction,
          ),
      );

    const predictions = [
      ...orderedByProfile,
      ...extraPredictions,
    ];

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
  }, [
    predictionData,
    operationProfile,
  ]);

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

  const outlookConfig = useMemo(
    () =>
      getOutlookConfig(
        predictionData?.overall_outlook,
        t,
      ),
    [
      predictionData?.overall_outlook,
      t,
    ],
  );

  const overallConfidence = Number(
    predictionData?.overall_confidence || 0,
  );

  const availableCount = Number(
    predictionData?.available_prediction_count ??
      predictionData?.data_quality
        ?.available_count ??
      0,
  );

  const unavailableCount = Number(
    predictionData?.data_quality
      ?.unavailable_count ?? 0,
  );

  const applicableForecastCount = Number(
    predictionData?.applicable_prediction_count ??
      predictionData?.data_quality
        ?.applicable_count ??
      availableCount + unavailableCount,
  );

  const totalForecastCount =
    applicableForecastCount > 0
      ? applicableForecastCount
      : availableCount + unavailableCount;

  const generatedAtLabel = useMemo(
    () =>
      formatGeneratedAt(
        generatedAt,
        uiLanguage,
        t(
          "predictionSummary.notGenerated",
        ),
      ),
    [
      generatedAt,
      uiLanguage,
      t,
    ],
  );

  const dataQualityLabel = useMemo(() => {
    const rawStatus = String(
      predictionData?.data_quality
        ?.data_quality_status || "",
    )
      .trim()
      .toLowerCase();

    const statusKeys = {
      good:
        "predictionSummary.dataQualityStatus.good",
      fair:
        "predictionSummary.dataQualityStatus.fair",
      poor:
        "predictionSummary.dataQualityStatus.poor",
      complete:
        "predictionSummary.dataQualityStatus.complete",
      partial:
        "predictionSummary.dataQualityStatus.partial",
      limited:
        "predictionSummary.dataQualityStatus.limited",
      unknown:
        "predictionSummary.dataQualityStatus.unknown",
    };

    if (!rawStatus) {
      return t(
        "predictionSummary.dataQualityStatus.unknown",
      );
    }

    return statusKeys[rawStatus]
      ? t(statusKeys[rawStatus])
      : predictionData?.data_quality
          ?.data_quality_status;
  }, [
    predictionData?.data_quality
      ?.data_quality_status,
    t,
  ]);

  return (
    <section
      className="prediction-summary"
      aria-label={t(
        "predictionSummary.ariaLabel",
      )}
    >
      <header className="prediction-summary__header">
        <div>
          <p className="prediction-summary__eyebrow">
            {t(
              "predictionSummary.sprintLabel",
            )}
          </p>

          <h2 className="prediction-summary__title">
            {t(
              "predictionSummary.title",
            )}
          </h2>

          <p className="prediction-summary__subtitle">
            {t(
              "predictionSummary.subtitle",
            )}
          </p>

          {operationProfileLabel ? (
            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {operationProfileLabel}
            </p>
          ) : null}
        </div>

        <div className="prediction-summary__header-actions">
          <div className="prediction-summary__generated">
            <span>
              {t(
                "predictionSummary.forecastGenerated",
              )}
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
            aria-label={
              isLoading
                ? t(
                    "predictionSummary.refreshing",
                  )
                : t(
                    "predictionSummary.refreshForecasts",
                  )
            }
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
                ? t(
                    "predictionSummary.refreshing",
                  )
                : t(
                    "predictionSummary.refreshForecasts",
                  )}
            </span>
          </button>
        </div>
      </header>

      {isLoading && !predictionData ? (
        <div
          className="prediction-summary__state"
          role="status"
          aria-live="polite"
        >
          <div className="prediction-summary__loader" />

          <strong>
            {t(
              "predictionSummary.loadingTitle",
            )}
          </strong>

          <p>
            {t(
              "predictionSummary.loadingMessage",
            )}
          </p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div
          className="prediction-summary__state prediction-summary__state--error"
          role="alert"
        >
          <FiAlertTriangle />

          <strong>
            {t(
              "predictionSummary.errorTitle",
            )}
          </strong>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={loadPredictions}
          >
            {t(
              "predictionSummary.tryAgain",
            )}
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
                  {t(
                    "predictionSummary.executiveForecast",
                  )}
                </span>
              </div>

              <h3>
                {t(
                  "predictionSummary.executiveForecastOutlook",
                )}
              </h3>

              <p className="prediction-summary__overview-message">
                {predictionData.executive_message}
              </p>

              <div className="prediction-summary__overview-note">
                {t(
                  "predictionSummary.forecastHorizon",
                )}
              </div>
            </div>

            <div className="prediction-summary__metrics">
              <div className="prediction-summary__metric">
                <span>
                  {t(
                    "predictionSummary.overallConfidence",
                  )}
                </span>

                <strong>
                  {overallConfidence}%
                </strong>
              </div>

              <div className="prediction-summary__metric">
                <span>
                  {t(
                    "predictionSummary.availableForecasts",
                  )}
                </span>

                <strong>
                  {availableCount}/
                  {totalForecastCount}
                </strong>
              </div>

              <div className="prediction-summary__metric">
                <span>
                  {t(
                    "predictionSummary.dataQuality",
                  )}
                </span>

                <strong>
                  {dataQualityLabel}
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
