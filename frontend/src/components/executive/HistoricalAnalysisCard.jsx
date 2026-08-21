import React from "react";
import {
  FiActivity,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
} from "react-icons/fi";

import { useLanguage } from "../../context/LanguageContext";

import "./HistoricalAnalysisCard.css";


function average(values) {
  const numericValues = values
    .map((item) => Number(item.value))
    .filter(Number.isFinite);

  return numericValues.length
    ? numericValues.reduce(
        (sum, value) => sum + value,
        0,
      ) / numericValues.length
    : null;
}


function getVolatilityClass(values) {
  const numericValues = values
    .map((item) => Number(item.value))
    .filter(Number.isFinite);

  if (numericValues.length < 2) {
    return "low";
  }

  const mean = average(values);
  const standardDeviation = Math.sqrt(
    numericValues.reduce(
      (sum, value) =>
        sum + (value - mean) ** 2,
      0,
    ) / numericValues.length,
  );

  const coefficientOfVariation =
    (standardDeviation /
      Math.max(Math.abs(mean), 1)) *
    100;

  if (coefficientOfVariation > 15) {
    return "high";
  }

  if (coefficientOfVariation > 7) {
    return "medium";
  }

  return "low";
}


function getVolatilityLabel(
  volatilityClass,
  t,
) {
  const keys = {
    high:
      "historicalAnalysisCard.volatility.high",
    medium:
      "historicalAnalysisCard.volatility.medium",
    low:
      "historicalAnalysisCard.volatility.low",
  };

  return t(
    keys[volatilityClass] ||
      "historicalAnalysisCard.volatility.low",
  );
}


function getTrendConfig(
  currentValue,
  previousValue,
  t,
) {
  const current = Number(currentValue);
  const previous = Number(previousValue);

  if (
    Number.isFinite(current) &&
    Number.isFinite(previous)
  ) {
    if (current > previous) {
      return {
        label: t(
          "historicalAnalysisCard.trend.improving",
        ),
        icon: FiTrendingUp,
      };
    }

    if (current < previous) {
      return {
        label: t(
          "historicalAnalysisCard.trend.declining",
        ),
        icon: FiTrendingDown,
      };
    }
  }

  return {
    label: t(
      "historicalAnalysisCard.trend.stable",
    ),
    icon: FiMinus,
  };
}


function translateTemplate(
  t,
  key,
  variables = {},
) {
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


export default function HistoricalAnalysisCard({
  dailyValues = [],
  currentValue,
  previousValue,
  unit = "",
  title,
}) {
  const { t } = useLanguage();

  const displayTitle =
    title ||
    t(
      "historicalAnalysisCard.defaultTitle",
    );

  const rollingAverage =
    average(dailyValues);

  const current =
    Number(currentValue);

  const previous =
    Number(previousValue);

  const trendConfig =
    getTrendConfig(
      currentValue,
      previousValue,
      t,
    );

  const TrendIcon =
    trendConfig.icon;

  const change =
    Number.isFinite(current) &&
    Number.isFinite(previous)
      ? current - previous
      : null;

  const volatilityClass =
    getVolatilityClass(
      dailyValues,
    );

  const volatilityLabel =
    getVolatilityLabel(
      volatilityClass,
      t,
    );

  const averageDisplay =
    rollingAverage !== null
      ? rollingAverage.toFixed(1)
      : "—";

  const changeDisplay =
    change !== null
      ? change.toFixed(1)
      : "—";

  return (
    <section
      className="historical-analysis-card"
      aria-label={displayTitle}
    >
      <div className="historical-header">
        <div className="historical-title">
          <FiActivity />
          <h3>{displayTitle}</h3>
        </div>
      </div>

      <div className="historical-grid">
        <div className="metric">
          <span>
            {t(
              "historicalAnalysisCard.trendLabel",
            )}
          </span>

          <strong>
            <TrendIcon />{" "}
            {trendConfig.label}
          </strong>
        </div>

        <div className="metric">
          <span>
            {t(
              "historicalAnalysisCard.rollingAverage",
            )}
          </span>

          <strong>
            {averageDisplay} {unit}
          </strong>
        </div>

        <div className="metric">
          <span>
            {t(
              "historicalAnalysisCard.volatilityLabel",
            )}
          </span>

          <strong>
            {volatilityLabel}
          </strong>
        </div>

        <div className="metric">
          <span>
            {t(
              "historicalAnalysisCard.previous",
            )}
          </span>

          <strong>
            {previousValue ?? "—"} {unit}
          </strong>
        </div>

        <div className="metric">
          <span>
            {t(
              "historicalAnalysisCard.change",
            )}
          </span>

          <strong>
            {changeDisplay} {unit}
          </strong>
        </div>
      </div>

      <div className="historical-summary">
        <h4>
          {t(
            "historicalAnalysisCard.aiTrendSummary",
          )}
        </h4>

        <p>
          {translateTemplate(
            t,
            "historicalAnalysisCard.summary",
            {
              trend:
                trendConfig.label,
              average:
                `${averageDisplay} ${unit}`.trim(),
              volatility:
                volatilityLabel,
            },
          )}
        </p>
      </div>
    </section>
  );
}
