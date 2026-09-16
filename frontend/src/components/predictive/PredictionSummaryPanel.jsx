import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { useConfig } from "../../context/ConfigContext";
import { dashboardCache } from "../../services/dashboardCache";
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


function translateExecutiveMessage(
  value,
  uiLanguage,
  isSxewOperation,
  isCoalOperation,
) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  if (uiLanguage !== "MN") {
    if (!isSxewOperation) {
      return text;
    }

    return text
      .replaceAll(
        "Ore Production",
        "Cathode Production",
      )
      .replaceAll(
        "Plant Performance",
        "Process Plant Performance",
      );
  }

  const kpiReplacements = isCoalOperation
    ? [
        [/ROM Coal Production/gi, "ROM нүүрсний олборлолт"],
        [/CHPP Performance/gi, "Нүүрс боловсруулах үйлдвэрийн гүйцэтгэл"],
        [/Waste Movement/gi, "Хөрс хуулалт"],
        [/Fleet Performance/gi, "Техникийн гүйцэтгэл"],
        [/Safety Performance/gi, "Аюулгүй ажиллагааны гүйцэтгэл"],
        [/Mine Health Score/gi, "Уурхайн нэгдсэн төлөвийн үнэлгээ"],
        [/Mine Health/gi, "Уурхайн нэгдсэн төлөв"],
      ]
    : isSxewOperation
    ? [
        [/Cathode Production/gi, "Катодын зэсийн үйлдвэрлэл"],
        [/Ore Production/gi, "Катодын зэсийн үйлдвэрлэл"],
        [/Process Plant Performance/gi, "Үйлдвэрийн гүйцэтгэл"],
        [/Plant Performance/gi, "Үйлдвэрийн гүйцэтгэл"],
        [/Cu Recovery/gi, "Зэс авалт"],
        [/Copper Recovery/gi, "Зэс авалт"],
        [/Safety Performance/gi, "Аюулгүй ажиллагааны гүйцэтгэл"],
        [/Safety/gi, "Аюулгүй ажиллагаа"],
        [/Mine Health Score/gi, "Уурхайн нэгдсэн төлөвийн үнэлгээ"],
        [/Mine Health/gi, "Уурхайн нэгдсэн төлөв"],
      ]
    : [
        [/Ore Production/gi, "Хүдрийн олборлолт"],
        [/Waste Movement/gi, "Хөрс хуулалт"],
        [/Fleet Performance/gi, "Техникийн гүйцэтгэл"],
        [/Plant Performance/gi, "Үйлдвэрийн гүйцэтгэл"],
        [/Safety Performance/gi, "Аюулгүй ажиллагааны гүйцэтгэл"],
        [/Safety/gi, "Аюулгүй ажиллагаа"],
        [/Mine Health Score/gi, "Уурхайн нэгдсэн төлөвийн үнэлгээ"],
        [/Mine Health/gi, "Уурхайн нэгдсэн төлөв"],
      ];

  let translated = text;

  kpiReplacements.forEach(
    ([pattern, replacement]) => {
      translated = translated.replace(
        pattern,
        replacement,
      );
    },
  );

  translated = translated
    .replace(
      /\s+(?:is|are) forecast to decline over the next three shifts based on recent performance\./i,
      " сүүлийн үеийн гүйцэтгэлд үндэслэн дараагийн 3 ээлжид буурах төлөвтэй байна.",
    )
    .replace(
      /\s+(?:is|are) forecast to improve over the next three shifts based on recent performance\./i,
      " сүүлийн үеийн гүйцэтгэлд үндэслэн дараагийн 3 ээлжид сайжрах төлөвтэй байна.",
    )
    .replace(
      /^Available KPI performance is forecast to remain broadly stable over the next three shifts\.$/i,
      "Боломжит KPI үзүүлэлтүүдийн гүйцэтгэл дараагийн 3 ээлжид ерөнхийдөө тогтвортой байх төлөвтэй байна.",
    )
    .replace(
      /^No significant KPI movement is forecast over the next three shifts\.$/i,
      "Дараагийн 3 ээлжид KPI үзүүлэлтүүдэд мэдэгдэхүйц өөрчлөлт гарах төлөвгүй байна.",
    )
    .replace(
      /^Not enough historical KPI data is available to generate a reliable forecast\.$/i,
      "Найдвартай урьдчилсан төлөв гаргахад түүхэн KPI өгөгдөл хангалтгүй байна.",
    )
    .replace(/\band\b/gi, "болон");

  return translated;
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

  if (
    normalizedOutlook === "insufficient data" ||
    normalizedOutlook === "unavailable"
  ) {
    return {
      label: t(
        normalizedOutlook === "insufficient data"
          ? "predictionSummary.outlook.insufficientData"
          : "predictionSummary.outlook.unavailable",
      ),
      className: "unavailable",
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

  if (language === "MN") {
    const year = value.getFullYear();
    const month = String(
      value.getMonth() + 1,
    ).padStart(2, "0");
    const day = String(
      value.getDate(),
    ).padStart(2, "0");
    const hour = String(
      value.getHours(),
    ).padStart(2, "0");
    const minute = String(
      value.getMinutes(),
    ).padStart(2, "0");

    return `${year}.${month}.${day} ${hour}:${minute}`;
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
  const { dashboardScope } = useConfig();
  const {
    language: uiLanguage,
    t,
  } = useLanguage();

  const cacheKey = useMemo(
    () => `predictions:${String(mineName || "").trim()}`,
    [mineName],
  );
  const initialCache = dashboardCache.getResource(dashboardScope, cacheKey);

  const [
    predictionData,
    setPredictionData,
  ] = useState(() => initialCache.data);

  const [
    isLoading,
    setIsLoading,
  ] = useState(() => !initialCache.data);

  const [
    error,
    setError,
  ] = useState("");

  const [
    generatedAt,
    setGeneratedAt,
  ] = useState(() => initialCache.updatedAt
    ? new Date(initialCache.updatedAt)
    : null);
  const loadRequestIdRef = useRef(0);

  const loadPredictions =
    useCallback(async (force = false) => {
      if (!force && dashboardCache.isFresh(dashboardScope, cacheKey)) {
        return;
      }
      const requestId = ++loadRequestIdRef.current;
      setIsLoading(true);
      setError("");

      try {
        const load = () => getPredictionSummary(mineName);
        const loaded = await (force
          ? dashboardCache.refresh(dashboardScope, cacheKey, load)
          : dashboardCache.ensure(dashboardScope, cacheKey, load));
        const cached = dashboardCache.getResource(dashboardScope, cacheKey);

        if (loadRequestIdRef.current !== requestId) return;

        if (!loaded && !cached.data) {
          throw cached.error || new Error("Prediction summary load failed");
        }

        setPredictionData(cached.data);
        setGeneratedAt(new Date());
      } catch (requestError) {
        if (loadRequestIdRef.current !== requestId) return;
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
        if (loadRequestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }, [dashboardScope, cacheKey, mineName, t]);

  useEffect(() => {
    // The async loader owns the request lifecycle state for this mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPredictions(false);
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
  const isCoalOperation = operationProfile === "coal_surface_v1";


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
      unavailable:
        "predictionSummary.dataQualityStatus.unavailable",
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
            onClick={() => loadPredictions(true)}
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
            onClick={() => loadPredictions(true)}
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
                {translateExecutiveMessage(
                  predictionData.executive_message,
                  uiLanguage,
                  isSxewOperation,
                  isCoalOperation,
                )}
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
