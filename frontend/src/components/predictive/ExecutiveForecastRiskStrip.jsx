import {
  FiAlertTriangle,
  FiArrowUpRight,
  FiEye,
  FiShield,
} from "react-icons/fi";

import { useLanguage } from "../../context/LanguageContext";
import { translateDynamicKpiName } from "../../i18n/dynamicTranslations";

import "./ExecutiveForecastRiskStrip.css";


function normalizePredictions(
  predictions,
) {
  if (!Array.isArray(predictions)) {
    return [];
  }

  return predictions.filter(
    (prediction) =>
      prediction &&
      prediction.data_status === "Available",
  );
}


function getTrendValue(prediction) {
  return String(
    prediction?.trend || "",
  ).trim().toLowerCase();
}


function getVarianceValue(prediction) {
  const variance = Number(
    prediction?.variance_shift_3,
  );

  return Number.isFinite(variance)
    ? variance
    : 0;
}


function ExecutiveForecastRiskStrip({
  predictions = [],
  overallConfidence = 0,
}) {
  const { t } = useLanguage();

  const availablePredictions =
    normalizePredictions(predictions);

  const atRiskPredictions =
    availablePredictions.filter(
      (prediction) =>
        getTrendValue(prediction) ===
        "declining",
    );

  const improvingPredictions =
    availablePredictions.filter(
      (prediction) =>
        getTrendValue(prediction) ===
        "improving",
    );

  const watchPredictions =
    availablePredictions.filter(
      (prediction) => {
        const trend =
          getTrendValue(prediction);

        return (
          trend === "stable" ||
          (
            trend !== "declining" &&
            trend !== "improving"
          )
        );
      },
    );

  const primaryRisks = [
    ...availablePredictions,
  ]
    .filter(
      (prediction) =>
        getVarianceValue(prediction) < 0,
    )
    .sort(
      (firstPrediction, secondPrediction) =>
        getVarianceValue(firstPrediction) -
        getVarianceValue(secondPrediction),
    )
    .slice(0, 2);

  const safeConfidence = Math.max(
    0,
    Math.min(
      100,
      Number(overallConfidence) || 0,
    ),
  );

  const hasRisk =
    atRiskPredictions.length > 0;

  return (
    <section
      className={`executive-risk-strip ${
        hasRisk
          ? "executive-risk-strip--attention"
          : "executive-risk-strip--healthy"
      }`}
      aria-label={t(
        "executiveForecastRiskStrip.ariaLabel",
      )}
    >
      <div className="executive-risk-strip__heading">
        <div className="executive-risk-strip__heading-icon">
          {hasRisk ? (
            <FiAlertTriangle />
          ) : (
            <FiShield />
          )}
        </div>

        <div>
          <p className="executive-risk-strip__eyebrow">
            {t(
              "executiveForecastRiskStrip.eyebrow",
            )}
          </p>

          <h3 className="executive-risk-strip__title">
            {hasRisk
              ? t(
                  "executiveForecastRiskStrip.attentionRequired",
                )
              : t(
                  "executiveForecastRiskStrip.stablePosition",
                )}
          </h3>
        </div>
      </div>

      <div className="executive-risk-strip__metrics">
        <div className="executive-risk-strip__metric executive-risk-strip__metric--risk">
          <FiAlertTriangle />

          <div>
            <strong>
              {atRiskPredictions.length}
            </strong>

            <span>
              {t(
                "executiveForecastRiskStrip.kpisAtRisk",
              )}
            </span>
          </div>
        </div>

        <div className="executive-risk-strip__metric executive-risk-strip__metric--watch">
          <FiEye />

          <div>
            <strong>
              {watchPredictions.length}
            </strong>

            <span>
              {t(
                "executiveForecastRiskStrip.onWatch",
              )}
            </span>
          </div>
        </div>

        <div className="executive-risk-strip__metric executive-risk-strip__metric--improving">
          <FiArrowUpRight />

          <div>
            <strong>
              {improvingPredictions.length}
            </strong>

            <span>
              {t(
                "executiveForecastRiskStrip.improving",
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="executive-risk-strip__focus">
        <span className="executive-risk-strip__focus-label">
          {t(
            "executiveForecastRiskStrip.primaryRisks",
          )}
        </span>

        {primaryRisks.length ? (
          <div className="executive-risk-strip__risk-list">
            {primaryRisks.map(
              (prediction) => (
                <span
                  key={
                    prediction.kpi_name
                  }
                  className="executive-risk-strip__risk-chip"
                >
                  {translateDynamicKpiName(
                    prediction.kpi_name,
                    t,
                  )}

                  <strong>
                    {getVarianceValue(
                      prediction,
                    ).toFixed(1)}
                    {" "}
                    {t(
                      "executiveForecastRiskStrip.percentagePoints",
                    )}
                  </strong>
                </span>
              ),
            )}
          </div>
        ) : (
          <span className="executive-risk-strip__no-risk">
            {t(
              "executiveForecastRiskStrip.noNegativeForecast",
            )}
          </span>
        )}
      </div>

      <div className="executive-risk-strip__confidence">
        <div className="executive-risk-strip__confidence-heading">
          <span>
            {t(
              "executiveForecastRiskStrip.overallConfidence",
            )}
          </span>

          <strong>
            {safeConfidence}%
          </strong>
        </div>

        <div
          className="executive-risk-strip__confidence-track"
          role="progressbar"
          aria-label={t(
            "executiveForecastRiskStrip.confidenceAria",
          )}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={Math.round(
            safeConfidence,
          )}
        >
          <div
            className="executive-risk-strip__confidence-fill"
            style={{
              width: `${safeConfidence}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}


export default ExecutiveForecastRiskStrip;
