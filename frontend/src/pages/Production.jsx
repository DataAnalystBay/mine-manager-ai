import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  FiActivity,
  FiArrowDownRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiMinus,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiTruck,
} from "react-icons/fi";

import ProductionTrendChart
  from "../components/ProductionTrendChart";

import {
  getProductionTrend,
  getTodayProduction,
} from "../api/productionApi";

import {
  useLanguage,
} from "../context/LanguageContext";

import "./Production.css";


/* ============================================================
   Constants
   ============================================================ */

const PRODUCTION_RANGES = [
  "30D",
  "90D",
  "1Y",
  "3Y",
  "5Y",
];


/* ============================================================
   Formatting helpers
   ============================================================ */

function formatNumber(value) {
  const number = Number(value || 0);

  return number.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}


function getDefaultProductionUnit(language) {
  return language === "MN"
    ? "тн"
    : "t";
}


function resolveDisplayUnit(
  unit,
  language
) {
  const normalized = String(
    unit || ""
  ).trim();

  if (!normalized) {
    return getDefaultProductionUnit(
      language
    );
  }

  if (
    language === "MN" &&
    normalized.toLowerCase() === "t"
  ) {
    return "тн";
  }

  return normalized;
}


function formatProductionValue(
  value,
  language,
  unit
) {
  return `${formatNumber(value)} ${resolveDisplayUnit(
    unit,
    language
  )}`;
}


function formatSignedProductionValue(
  value,
  language,
  unit
) {
  const number =
    Number(value || 0);

  const resolvedUnit =
    resolveDisplayUnit(
      unit,
      language
    );

  if (number > 0) {
    return `+${formatNumber(number)} ${resolvedUnit}`;
  }

  if (number < 0) {
    return `${formatNumber(number)} ${resolvedUnit}`;
  }

  return `0 ${resolvedUnit}`;
}


function formatSignedPercent(value) {
  const number =
    Number(value || 0);

  if (number > 0) {
    return `+${number.toFixed(1)}%`;
  }

  if (number < 0) {
    return `${number.toFixed(1)}%`;
  }

  return "0.0%";
}


function formatReportingDate(
  value,
  language,
  t
) {
  if (!value) {
    return t(
      "common.notAvailable"
    );
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    language === "MN"
      ? "mn-MN"
      : "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function formatShortDate(
  value,
  language,
  aggregation = "daily"
) {
  if (!value) {
    return "—";
  }

  const text =
    String(value);

  const date =
    new Date(
      text.length === 10
        ? `${text}T00:00:00`
        : text
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return text;
  }

  if (
    aggregation === "monthly"
  ) {
    return date.toLocaleDateString(
      language === "MN"
        ? "mn-MN"
        : "en-US",
      {
        month: "short",
        year: "numeric",
      }
    );
  }

  return date.toLocaleDateString(
    language === "MN"
      ? "mn-MN"
      : "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
}


/* ============================================================
   Performance helpers
   ============================================================ */

function calculatePerformance(
  actual,
  plan
) {
  const normalizedActual =
    Number(actual || 0);

  const normalizedPlan =
    Number(plan || 0);

  if (normalizedPlan <= 0) {
    return 0;
  }

  return (
    normalizedActual /
    normalizedPlan
  ) * 100;
}


function calculateCombinedPerformance({
  oreActual,
  orePlan,
  wasteActual,
  wastePlan,
}) {
  const totalActual =
    Number(oreActual || 0) +
    Number(wasteActual || 0);

  const totalPlan =
    Number(orePlan || 0) +
    Number(wastePlan || 0);

  if (totalPlan <= 0) {
    return 0;
  }

  return (
    totalActual /
    totalPlan
  ) * 100;
}


function getPerformanceTone(
  performance
) {
  if (performance >= 100) {
    return "positive";
  }

  if (performance >= 95) {
    return "warning";
  }

  return "negative";
}


function getPerformanceStatus(
  performance,
  t
) {
  if (performance >= 100) {
    return t(
      "production.abovePlan"
    );
  }

  if (performance >= 95) {
    return t(
      "production.nearPlan"
    );
  }

  return t(
    "production.belowPlan"
  );
}


function getVarianceIcon(
  variance
) {
  if (variance > 0) {
    return <FiArrowUpRight />;
  }

  if (variance < 0) {
    return <FiArrowDownRight />;
  }

  return <FiMinus />;
}


/* ============================================================
   Trend helpers
   ============================================================ */

function firstFiniteNumber(
  row,
  keys
) {
  for (const key of keys) {
    const value =
      Number(
        row?.[key]
      );

    if (
      Number.isFinite(
        value
      )
    ) {
      return value;
    }
  }

  return null;
}


function getTrendDate(row) {
  return (
    row?.report_date ||
    row?.date ||
    row?.production_date ||
    row?.day ||
    ""
  );
}


function getOreActual(row) {
  return firstFiniteNumber(
    row,
    [
      "ore_actual",
      "oreActual",
      "actual_ore",
      "ore",
      "actual",
    ]
  );
}


function getOrePlan(row) {
  return firstFiniteNumber(
    row,
    [
      "ore_plan",
      "orePlan",
      "planned_ore",
      "ore_target",
      "plan",
      "target",
    ]
  );
}


function normalizeTrendRows(
  trend
) {
  if (
    Array.isArray(
      trend
    )
  ) {
    return trend;
  }

  if (
    Array.isArray(
      trend?.data
    )
  ) {
    return trend.data;
  }

  if (
    Array.isArray(
      trend?.items
    )
  ) {
    return trend.items;
  }

  if (
    Array.isArray(
      trend?.results
    )
  ) {
    return trend.results;
  }

  return [];
}


function getTrendAggregation(
  trend,
  selectedRange
) {
  const rows =
    normalizeTrendRows(
      trend
    );

  const aggregation =
    rows?.[0]
      ?.aggregation;

  if (
    aggregation === "daily" ||
    aggregation === "weekly" ||
    aggregation === "monthly"
  ) {
    return aggregation;
  }

  if (
    selectedRange === "30D" ||
    selectedRange === "90D"
  ) {
    return "daily";
  }

  if (
    selectedRange === "1Y"
  ) {
    return "weekly";
  }

  return "monthly";
}


function calculateTrendSummary(
  trend,
  language,
  aggregation
) {
  const validRows =
    normalizeTrendRows(
      trend
    )
      .map(
        (row) => ({
          actual:
            getOreActual(
              row
            ),

          plan:
            getOrePlan(
              row
            ),

          date:
            getTrendDate(
              row
            ),
        })
      )
      .filter(
        (item) =>
          Number.isFinite(
            item.actual
          ) &&
          Number.isFinite(
            item.plan
          ) &&
          item.plan > 0
      );

  if (
    !validRows.length
  ) {
    return {
      totalPeriods: 0,
      abovePlanPeriods: 0,
      belowPlanPeriods: 0,
      averageActual: null,
      averagePlan: null,
      averagePerformance: null,
      highest: null,
      lowest: null,
      recentTrendPercent: null,
      recentTrendTone:
        "neutral",
    };
  }

  const totalPeriods =
    validRows.length;

  const abovePlanPeriods =
    validRows.filter(
      (item) =>
        item.actual >=
        item.plan
    ).length;

  const belowPlanPeriods =
    totalPeriods -
    abovePlanPeriods;

  /*
   * For aggregated historical periods, ore_actual and
   * ore_plan are totals for each returned period.
   *
   * Average actual/plan is still useful as the average
   * production total per displayed reporting period.
   */

  const averageActual =
    validRows.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.actual,
      0
    ) /
    totalPeriods;

  const averagePlan =
    validRows.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.plan,
      0
    ) /
    totalPeriods;

  /*
   * Performance should be calculated from total actual /
   * total plan rather than averaging percentages.
   */

  const totalActual =
    validRows.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.actual,
      0
    );

  const totalPlan =
    validRows.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.plan,
      0
    );

  const averagePerformance =
    totalPlan > 0
      ? (
          totalActual /
          totalPlan
        ) * 100
      : null;

  const highest =
    validRows.reduce(
      (
        best,
        item
      ) =>
        !best ||
        item.actual >
          best.actual
          ? item
          : best,
      null
    );

  const lowest =
    validRows.reduce(
      (
        best,
        item
      ) =>
        !best ||
        item.actual <
          best.actual
          ? item
          : best,
      null
    );


  /*
   * Recent trend:
   *
   * Daily   -> latest 7 days vs previous 7
   * Weekly  -> latest 4 weeks vs previous 4
   * Monthly -> latest 3 months vs previous 3
   */

  const comparisonSize =
    aggregation === "daily"
      ? 7
      : aggregation === "weekly"
        ? 4
        : 3;

  const averageActualFor =
    (items) => {
      if (
        !items.length
      ) {
        return null;
      }

      return (
        items.reduce(
          (
            sum,
            item
          ) =>
            sum +
            item.actual,
          0
        ) /
        items.length
      );
    };

  const recentPeriods =
    validRows.slice(
      -comparisonSize
    );

  const previousPeriods =
    validRows.slice(
      Math.max(
        0,
        totalPeriods -
          (
            comparisonSize *
            2
          )
      ),
      Math.max(
        0,
        totalPeriods -
          comparisonSize
      )
    );

  const recentAverage =
    averageActualFor(
      recentPeriods
    );

  const previousAverage =
    averageActualFor(
      previousPeriods
    );

  const recentTrendPercent =
    recentAverage !== null &&
    previousAverage !== null &&
    previousAverage > 0
      ? (
          (
            recentAverage -
            previousAverage
          ) /
          previousAverage
        ) * 100
      : null;

  const recentTrendTone =
    recentTrendPercent ===
    null
      ? "neutral"
      : recentTrendPercent >
        0.25
        ? "positive"
        : recentTrendPercent <
          -0.25
          ? "negative"
          : "neutral";

  return {
    totalPeriods,
    abovePlanPeriods,
    belowPlanPeriods,
    averageActual,
    averagePlan,
    averagePerformance,

    highest:
      highest
        ? {
            ...highest,

            formattedDate:
              formatShortDate(
                highest.date,
                language,
                aggregation
              ),
          }
        : null,

    lowest:
      lowest
        ? {
            ...lowest,

            formattedDate:
              formatShortDate(
                lowest.date,
                language,
                aggregation
              ),
          }
        : null,

    recentTrendPercent,
    recentTrendTone,
  };
}


/* ============================================================
   Range helpers
   ============================================================ */

function getRangeLabel(
  range,
  language
) {
  if (
    language !== "MN"
  ) {
    return range;
  }

  const labels = {
    "30D": "30Х",
    "90D": "90Х",
    "1Y": "1Ж",
    "3Y": "3Ж",
    "5Y": "5Ж",
  };

  return (
    labels[range] ||
    range
  );
}


function getRangeTitle(
  range,
  language
) {
  const en = {
    "30D":
      "30-Day Summary",

    "90D":
      "90-Day Summary",

    "1Y":
      "1-Year Summary",

    "3Y":
      "3-Year Summary",

    "5Y":
      "5-Year Summary",
  };

  const mn = {
    "30D":
      "30 хоногийн дүгнэлт",

    "90D":
      "90 хоногийн дүгнэлт",

    "1Y":
      "1 жилийн дүгнэлт",

    "3Y":
      "3 жилийн дүгнэлт",

    "5Y":
      "5 жилийн дүгнэлт",
  };

  return (
    language === "MN"
      ? mn[range]
      : en[range]
  ) || range;
}


function getRangeAverageLabel(
  range,
  language
) {
  const en = {
    "30D":
      "30-Day Average",

    "90D":
      "90-Day Average",

    "1Y":
      "1-Year Average",

    "3Y":
      "3-Year Average",

    "5Y":
      "5-Year Average",
  };

  const mn = {
    "30D":
      "30 хоногийн дундаж",

    "90D":
      "90 хоногийн дундаж",

    "1Y":
      "1 жилийн дундаж",

    "3Y":
      "3 жилийн дундаж",

    "5Y":
      "5 жилийн дундаж",
  };

  return (
    language === "MN"
      ? mn[range]
      : en[range]
  ) || range;
}


function getPeriodUnitLabel(
  aggregation,
  language
) {
  if (
    aggregation === "weekly"
  ) {
    return language === "MN"
      ? "7 хоног"
      : "weeks";
  }

  if (
    aggregation === "monthly"
  ) {
    return language === "MN"
      ? "сар"
      : "months";
  }

  return language === "MN"
    ? "өдөр"
    : "days";
}


function getPeriodsAboveLabel(
  aggregation,
  language
) {
  if (
    aggregation === "weekly"
  ) {
    return language === "MN"
      ? "Төлөвлөгөө биелүүлсэн 7 хоног"
      : "Weeks at or above plan";
  }

  if (
    aggregation === "monthly"
  ) {
    return language === "MN"
      ? "Төлөвлөгөө биелүүлсэн сар"
      : "Months at or above plan";
  }

  return language === "MN"
    ? "Төлөвлөгөө биелүүлсэн өдөр"
    : "Days at or above plan";
}


function getPeriodsBelowLabel(
  aggregation,
  language
) {
  if (
    aggregation === "weekly"
  ) {
    return language === "MN"
      ? "Төлөвлөгөөнөөс доогуур 7 хоног"
      : "Weeks below plan";
  }

  if (
    aggregation === "monthly"
  ) {
    return language === "MN"
      ? "Төлөвлөгөөнөөс доогуур сар"
      : "Months below plan";
  }

  return language === "MN"
    ? "Төлөвлөгөөнөөс доогуур өдөр"
    : "Days below plan";
}


function getRecentTrendCopy(
  aggregation,
  language
) {
  if (
    aggregation === "weekly"
  ) {
    return {
      title:
        language === "MN"
          ? "Сүүлийн 4 долоо хоногийн чиг хандлага"
          : "Last 4-Week Trend",

      description:
        language === "MN"
          ? "Сүүлийн 4 долоо хоногийн дундаж үйлдвэрлэлийг өмнөх 4 долоо хоногтой харьцуулсан өөрчлөлт."
          : "Change in average production across the latest four weeks versus the previous four.",
    };
  }

  if (
    aggregation === "monthly"
  ) {
    return {
      title:
        language === "MN"
          ? "Сүүлийн 3 сарын чиг хандлага"
          : "Last 3-Month Trend",

      description:
        language === "MN"
          ? "Сүүлийн 3 сарын дундаж үйлдвэрлэлийг өмнөх 3 сартай харьцуулсан өөрчлөлт."
          : "Change in average production across the latest three months versus the previous three.",
    };
  }

  return {
    title:
      language === "MN"
        ? "Сүүлийн 7 хоногийн чиг хандлага"
        : "Last 7-Day Trend",

    description:
      language === "MN"
        ? "Сүүлийн 7 хоногийн дундаж үйлдвэрлэлийг өмнөх 7 хоногтой харьцуулсан өөрчлөлт."
        : "Change in average production across the latest seven days versus the previous seven.",
  };
}


/* ============================================================
   Small UI components
   ============================================================ */

function PerformanceBadge({
  performance,
  t,
}) {
  const tone =
    getPerformanceTone(
      performance
    );

  return (
    <span
      className={
        `production-status-badge ` +
        `production-status-badge--${tone}`
      }
    >
      <span
        className="production-status-dot"
      />

      {getPerformanceStatus(
        performance,
        t
      )}
    </span>
  );
}


function DailyMetric({
  eyebrow,
  title,
  actual,
  plan,
  variance,
  performance,
  icon,
  accent,
  language,
  targetLabel,
  unit,
}) {
  const tone =
    getPerformanceTone(
      performance
    );

  const percentageVariance =
    performance -
    100;

  return (
    <div
      className={
        `production-daily-metric ` +
        `production-daily-metric--${accent}`
      }
    >
      <div className="production-daily-metric-main">
        <div
          className={
            `production-daily-icon ` +
            `production-daily-icon--${accent}`
          }
        >
          {icon}
        </div>

        <div className="production-daily-copy">
          <div className="production-daily-eyebrow">
            {eyebrow}
          </div>

          <div className="production-daily-title">
            {title}
          </div>

          <div className="production-daily-value">
            {formatProductionValue(
              actual,
              language,
              unit
            )}
          </div>

          <div className="production-daily-plan">
            {targetLabel}:{" "}

            <strong>
              {formatProductionValue(
                plan,
                language,
                unit
              )}
            </strong>
          </div>
        </div>
      </div>


      <div
        className={
          `production-daily-variance ` +
          `production-daily-variance--${tone}`
        }
      >
        <span>
          {getVarianceIcon(
            Number(
              variance || 0
            )
          )}

          {formatSignedProductionValue(
            variance,
            language,
            unit
          )}
        </span>

        <strong>
          {formatSignedPercent(
            percentageVariance
          )}
        </strong>
      </div>
    </div>
  );
}


function CompletionMetric({
  performance,
  completionLabel,
  title,
  targetLabel,
}) {
  const tone =
    getPerformanceTone(
      performance
    );

  const variance =
    performance -
    100;

  return (
    <div className="production-daily-metric production-daily-metric--blue">
      <div className="production-daily-metric-main">
        <div className="production-daily-icon production-daily-icon--blue">
          <FiTarget />
        </div>

        <div className="production-daily-copy">
          <div className="production-daily-eyebrow">
            {completionLabel}
          </div>

          <div className="production-daily-title">
            {title}
          </div>

          <div className="production-daily-value">
            {performance.toFixed(
              1
            )}%
          </div>

          <div className="production-daily-plan">
            {targetLabel}:{" "}
            <strong>
              100.0%
            </strong>
          </div>
        </div>
      </div>


      <div
        className={
          `production-daily-variance ` +
          `production-daily-variance--${tone}`
        }
      >
        <span>
          {getVarianceIcon(
            variance
          )}

          {formatSignedPercent(
            variance
          )}
        </span>
      </div>
    </div>
  );
}


function SummaryRow({
  dotClass,
  label,
  value,
  secondary,
}) {
  return (
    <div className="production-summary-row">
      <div className="production-summary-row-label">
        {dotClass && (
          <span
            className={
              `production-summary-dot ` +
              dotClass
            }
          />
        )}

        <span>
          {label}
        </span>
      </div>

      <div className="production-summary-row-value">
        <strong>
          {value}
        </strong>

        {secondary && (
          <small>
            {secondary}
          </small>
        )}
      </div>
    </div>
  );
}


/* ============================================================
   Production page
   ============================================================ */

function Production() {
  const {
    language,
    t,
  } = useLanguage();


  const [
    today,
    setToday,
  ] = useState(
    null
  );

  const [
    trend,
    setTrend,
  ] = useState(
    []
  );

  const [
    selectedRange,
    setSelectedRange,
  ] = useState(
    "30D"
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    trendLoading,
    setTrendLoading,
  ] = useState(
    false
  );

  const [
    error,
    setError,
  ] = useState(
    ""
  );

  const [
    trendError,
    setTrendError,
  ] = useState(
    ""
  );


  const operationProfile =
    String(
      today
        ?.operation_profile ||
      "standard_mine"
    )
      .trim()
      .toLowerCase();


  const isSxewOperation =
    operationProfile ===
    "sxew_copper";


  const wasteApplicable =
    today
      ?.waste_applicable !==
    false;


  const productionUnit =
    today
      ?.production_unit ||
    getDefaultProductionUnit(
      language
    );


  const trendAggregation =
    useMemo(
      () =>
        getTrendAggregation(
          trend,
          selectedRange
        ),
      [
        trend,
        selectedRange,
      ]
    );


  const periodUnitLabel =
    useMemo(
      () =>
        getPeriodUnitLabel(
          trendAggregation,
          language
        ),
      [
        trendAggregation,
        language,
      ]
    );


  const periodsAboveLabel =
    useMemo(
      () =>
        getPeriodsAboveLabel(
          trendAggregation,
          language
        ),
      [
        trendAggregation,
        language,
      ]
    );


  const periodsBelowLabel =
    useMemo(
      () =>
        getPeriodsBelowLabel(
          trendAggregation,
          language
        ),
      [
        trendAggregation,
        language,
      ]
    );


  const recentTrendCopy =
    useMemo(
      () =>
        getRecentTrendCopy(
          trendAggregation,
          language
        ),
      [
        trendAggregation,
        language,
      ]
    );


  const copy =
    useMemo(
      () => {
        const baseCopy =
          language === "MN"
            ? {
                dailyPerformance:
                  "Өдрийн олборлолтын гүйцэтгэл",

                oreDelivery:
                  "Хүдрийн олборлолт",

                wasteDelivery:
                  "Хөрс хуулалт",

                overallAttainment:
                  "Нийт гүйцэтгэлийн биелэлт",

                planAttainment:
                  "Төлөвлөгөөний биелэлт",

                target:
                  "Зорилт",

                abovePlanDays:
                  "Төлөвлөгөө биелүүлсэн үе",

                belowPlanDays:
                  "Төлөвлөгөөнөөс доогуур үе",

                averageAttainment:
                  "Дундаж биелэлт",

                highestPerformance:
                  "Хамгийн өндөр гүйцэтгэл",

                lowestPerformance:
                  "Хамгийн бага гүйцэтгэл",

                improving:
                  "Сайжирч байна",

                declining:
                  "Буурч байна",

                stable:
                  "Тогтвортой",

                dailyTarget:
                  "Өдрийн зорилт",

                dataSource:
                  "Өгөгдөл: Өдөр бүрийн тайлан",

                lastUpdated:
                  "Сүүлийн шинэчлэлт",

                timezone:
                  "Бүс цаг: Asia/Ulaanbaatar",

                pageTitle:
                  "Үйлдвэрлэлийн гүйцэтгэл",

                pageSubtitle:
                  "Төлөвлөгөө, бодит гүйцэтгэл, хэлбэлзэл болон чиг хандлагыг хянах.",

                deliveryEyebrow:
                  "Үйлдвэрлэлийн гүйцэтгэл",

                trendTitle:
                  "Үйлдвэрлэлийн чиг хандлага",

                trendSubtitle:
                  "Төлөвлөгөө болон бодит үйлдвэрлэлийн гүйцэтгэл",

                loadingHistory:
                  "Түүхэн мэдээлэл ачаалж байна...",
              }
            : {
                dailyPerformance:
                  "Daily Production Performance",

                oreDelivery:
                  "Ore Production",

                wasteDelivery:
                  "Waste Movement",

                overallAttainment:
                  "Overall Performance Attainment",

                planAttainment:
                  "Plan Attainment",

                target:
                  "Target",

                abovePlanDays:
                  "Periods at or above plan",

                belowPlanDays:
                  "Periods below plan",

                averageAttainment:
                  "Average attainment",

                highestPerformance:
                  "Highest performance",

                lowestPerformance:
                  "Lowest performance",

                improving:
                  "Improving",

                declining:
                  "Declining",

                stable:
                  "Stable",

                dailyTarget:
                  "Daily Target",

                dataSource:
                  "Data: Daily production report",

                lastUpdated:
                  "Last updated",

                timezone:
                  "Timezone: Asia/Ulaanbaatar",

                pageTitle:
                  "Production Performance",

                pageSubtitle:
                  "Monitor plan, actual performance, variance, and recent production trend.",

                deliveryEyebrow:
                  "Production Delivery",

                trendTitle:
                  "Production Trend",

                trendSubtitle:
                  "Plan versus actual production performance",

                loadingHistory:
                  "Loading historical data...",
              };


        if (
          !isSxewOperation
        ) {
          return baseCopy;
        }


        return {
          ...baseCopy,

          dailyPerformance:
            language === "MN"
              ? "Катодын зэсийн үйлдвэрлэлийн гүйцэтгэл"
              : "Cathode Production Performance",

          oreDelivery:
            today
              ?.production_label ||
            today
              ?.ore_label ||
            (
              language === "MN"
                ? "Катодын зэсийн үйлдвэрлэл"
                : "Cathode Production"
            ),

          wasteDelivery:
            language === "MN"
              ? "Хамаарахгүй"
              : "Not Applicable",

          overallAttainment:
            language === "MN"
              ? "Үйлдвэрлэлийн төлөвлөгөөний биелэлт"
              : "Production Plan Attainment",

          planAttainment:
            language === "MN"
              ? "Төлөвлөгөөний биелэлт"
              : "Plan Attainment",

          highestPerformance:
            language === "MN"
              ? "Хамгийн өндөр үйлдвэрлэл"
              : "Highest production",

          lowestPerformance:
            language === "MN"
              ? "Хамгийн бага үйлдвэрлэл"
              : "Lowest production",

          dailyTarget:
            language === "MN"
              ? "Үйлдвэрлэлийн зорилт"
              : "Production Target",

          dataSource:
            language === "MN"
              ? "Өгөгдөл: Катодын зэсийн үйлдвэрлэлийн тайлан"
              : "Data: Cathode production report",

          pageTitle:
            language === "MN"
              ? "Катодын зэсийн үйлдвэрлэл"
              : "Cathode Production",

          pageSubtitle:
            language === "MN"
              ? "Катодын зэсийн үйлдвэрлэлийн төлөвлөгөө, бодит гүйцэтгэл, хэлбэлзэл болон чиг хандлагыг хянах."
              : "Monitor cathode production plan, actual output, variance, and historical performance trend.",

          deliveryEyebrow:
            language === "MN"
              ? "Катодын зэсийн үйлдвэрлэл"
              : "Cathode Production",

          trendTitle:
            language === "MN"
              ? "Катодын зэсийн үйлдвэрлэлийн чиг хандлага"
              : "Cathode Production Trend",

          trendSubtitle:
            language === "MN"
              ? "Төлөвлөгөө болон бодит катодын зэсийн үйлдвэрлэлийн гүйцэтгэл"
              : "Plan versus actual cathode production performance",
        };
      },
      [
        language,
        isSxewOperation,
        today
          ?.production_label,
        today
          ?.ore_label,
      ]
    );


  /* ============================================================
     Initial page load
     ============================================================ */

  const loadProduction =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setError(
          ""
        );

        setTrendError(
          ""
        );

        try {
          const [
            todayData,
            trendData,
          ] =
            await Promise.all([
              getTodayProduction(),

              getProductionTrend(
                selectedRange
              ),
            ]);

          setToday(
            todayData
          );

          setTrend(
            normalizeTrendRows(
              trendData
            )
          );
        } catch (
          requestError
        ) {
          console.error(
            "Production page load failed:",
            requestError
          );

          setError(
            requestError
              ?.message ||
            t(
              "production.unableToLoadAnalytics"
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        t,
        selectedRange,
      ]
    );


  /*
   * Initial page load only.
   *
   * Range changes are handled separately so today's
   * KPI cards are not reloaded.
   */

  useEffect(
    () => {
      loadProduction();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    []
  );


  /* ============================================================
     Trend-only loader
     ============================================================ */

  const loadTrendRange =
    useCallback(
      async (
        range
      ) => {
        setTrendLoading(
          true
        );

        setTrendError(
          ""
        );

        try {
          const trendData =
            await getProductionTrend(
              range
            );

          setTrend(
            normalizeTrendRows(
              trendData
            )
          );
        } catch (
          requestError
        ) {
          console.error(
            "Production trend load failed:",
            requestError
          );

          setTrendError(
            requestError
              ?.message ||
            (
              language === "MN"
                ? "Үйлдвэрлэлийн түүхэн мэдээллийг ачаалж чадсангүй."
                : "Unable to load production history."
            )
          );
        } finally {
          setTrendLoading(
            false
          );
        }
      },
      [
        language,
      ]
    );


  const handleRangeChange =
    useCallback(
      async (
        range
      ) => {
        if (
          !PRODUCTION_RANGES.includes(
            range
          ) ||
          range ===
            selectedRange ||
          trendLoading
        ) {
          return;
        }

        setSelectedRange(
          range
        );

        await loadTrendRange(
          range
        );
      },
      [
        selectedRange,
        trendLoading,
        loadTrendRange,
      ]
    );


  const handleRefresh =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setError(
          ""
        );

        setTrendError(
          ""
        );

        try {
          const [
            todayData,
            trendData,
          ] =
            await Promise.all([
              getTodayProduction(),

              getProductionTrend(
                selectedRange
              ),
            ]);

          setToday(
            todayData
          );

          setTrend(
            normalizeTrendRows(
              trendData
            )
          );
        } catch (
          requestError
        ) {
          console.error(
            "Production refresh failed:",
            requestError
          );

          setError(
            requestError
              ?.message ||
            t(
              "production.unableToLoadAnalytics"
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        selectedRange,
        t,
      ]
    );


  /* ============================================================
     Current-day KPI calculations
     ============================================================ */

  const orePerformance =
    useMemo(
      () =>
        calculatePerformance(
          today
            ?.ore_actual,
          today
            ?.ore_plan
        ),
      [
        today
          ?.ore_actual,
        today
          ?.ore_plan,
      ]
    );


  const wastePerformance =
    useMemo(
      () =>
        calculatePerformance(
          today
            ?.waste_actual,
          today
            ?.waste_plan
        ),
      [
        today
          ?.waste_actual,
        today
          ?.waste_plan,
      ]
    );


  const combinedPerformance =
    useMemo(
      () => {
        if (
          !wasteApplicable
        ) {
          return orePerformance;
        }

        return (
          calculateCombinedPerformance(
            {
              oreActual:
                today
                  ?.ore_actual,

              orePlan:
                today
                  ?.ore_plan,

              wasteActual:
                today
                  ?.waste_actual,

              wastePlan:
                today
                  ?.waste_plan,
            }
          )
        );
      },
      [
        wasteApplicable,
        orePerformance,
        today
          ?.ore_actual,
        today
          ?.ore_plan,
        today
          ?.waste_actual,
        today
          ?.waste_plan,
      ]
    );


  const overallTone =
    getPerformanceTone(
      combinedPerformance
    );


  const overallStatus =
    getPerformanceStatus(
      combinedPerformance,
      t
    );


  const combinedVariance =
    combinedPerformance -
    100;


  /* ============================================================
     Trend calculations
     ============================================================ */

  const trendSummary =
    useMemo(
      () =>
        calculateTrendSummary(
          trend,
          language,
          trendAggregation
        ),
      [
        trend,
        language,
        trendAggregation,
      ]
    );


  const abovePlanPercent =
    trendSummary
      .totalPeriods > 0
      ? (
          trendSummary
            .abovePlanPeriods /
          trendSummary
            .totalPeriods
        ) *
        100
      : 0;


  const recentTrendTitle =
    trendSummary
      .recentTrendTone ===
    "positive"
      ? copy.improving
      : trendSummary
          .recentTrendTone ===
        "negative"
        ? copy.declining
        : copy.stable;


  const summaryTitle =
    getRangeTitle(
      selectedRange,
      language
    );


  const averageLabel =
    getRangeAverageLabel(
      selectedRange,
      language
    );


  /* ============================================================
     Status narrative
     ============================================================ */

  const statusNarrative =
    isSxewOperation
      ? language === "MN"
        ? combinedPerformance >=
          100
          ? `Катодын зэсийн үйлдвэрлэлийн гүйцэтгэл төлөвлөгөөнөөс ${formatSignedPercent(
              combinedVariance
            )}-иар давсан байна.`
          : combinedPerformance >=
              95
            ? `Катодын зэсийн үйлдвэрлэлийн гүйцэтгэл төлөвлөгөөний ${combinedPerformance.toFixed(
                1
              )}%-д хүрсэн байна.`
            : `Катодын зэсийн үйлдвэрлэлийн гүйцэтгэл төлөвлөгөөнөөс ${Math.abs(
                combinedVariance
              ).toFixed(
                1
              )}%-иар доогуур байна.`
        : combinedPerformance >=
            100
          ? `Cathode production performance is ${formatSignedPercent(
              combinedVariance
            )} above plan.`
          : combinedPerformance >=
              95
            ? `Cathode production performance is at ${combinedPerformance.toFixed(
                1
              )}% of plan.`
            : `Cathode production performance is ${Math.abs(
                combinedVariance
              ).toFixed(
                1
              )}% below plan.`
      : language === "MN"
        ? combinedPerformance >=
          100
          ? `Өнөөдрийн нийт олборлолтын гүйцэтгэл төлөвлөгөөнөөс ${formatSignedPercent(
              combinedVariance
            )}-иар давсан байна.`
          : combinedPerformance >=
              95
            ? `Өнөөдрийн нийт олборлолтын гүйцэтгэл төлөвлөгөөний ${combinedPerformance.toFixed(
                1
              )}%-д хүрсэн байна.`
            : `Өнөөдрийн нийт олборлолтын гүйцэтгэл төлөвлөгөөнөөс ${Math.abs(
                combinedVariance
              ).toFixed(
                1
              )}%-иар доогуур байна.`
        : combinedPerformance >=
            100
          ? `Today's total production performance is ${formatSignedPercent(
              combinedVariance
            )} above plan.`
          : combinedPerformance >=
              95
            ? `Today's total production performance is at ${combinedPerformance.toFixed(
                1
              )}% of plan.`
            : `Today's total production performance is ${Math.abs(
                combinedVariance
              ).toFixed(
                1
              )}% below plan.`;


  /* ============================================================
     Initial loading state
     ============================================================ */

  if (
    loading
  ) {
    return (
      <Box className="production-loading">
        <Stack
          spacing={2}
          alignItems="center"
        >
          <CircularProgress />

          <Typography
            color="text.secondary"
            fontWeight={700}
          >
            {t(
              "production.loadingProductionIntelligence"
            )}
          </Typography>
        </Stack>
      </Box>
    );
  }


  return (
    <Box className="production-page">

      {/* ======================================================
          Page Header
          ====================================================== */}

      <Stack
        direction={{
          xs:
            "column",
          md:
            "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs:
            "flex-start",
          md:
            "center",
        }}
        spacing={2}
        className="production-page-header"
      >
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            className="production-page-eyebrow"
          >
            <FiBarChart2 />

            <span>
              {t(
                "production.operationalIntelligence"
              )}
            </span>

            {isSxewOperation && (
              <span
                style={{
                  marginLeft:
                    8,

                  fontSize:
                    10,

                  fontWeight:
                    800,

                  color:
                    "#0f766e",
                }}
              >
                SX-EW Copper Operation
              </span>
            )}
          </Stack>


          <Typography
            component="h1"
            className="production-page-title"
          >
            {isSxewOperation
              ? copy.pageTitle
              : t(
                  "production.productionPerformance"
                )}
          </Typography>


          <Typography
            className="production-page-subtitle"
          >
            {isSxewOperation
              ? copy.pageSubtitle
              : t(
                  "production.pageSubtitle"
                )}
          </Typography>
        </Box>


        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Box className="production-reporting-date">
            <FiCalendar />

            <Box>
              <span className="production-reporting-date-label">
                {t(
                  "production.reportingDate"
                )}
              </span>

              <strong>
                {formatReportingDate(
                  today
                    ?.report_date,
                  language,
                  t
                )}
              </strong>
            </Box>
          </Box>


          <button
            type="button"
            className="production-refresh-button"
            onClick={
              handleRefresh
            }
            title={t(
              "production.refreshProductionData"
            )}
            aria-label={t(
              "production.refreshProductionData"
            )}
          >
            <FiRefreshCw />
          </button>
        </Stack>
      </Stack>


      {/* ======================================================
          Errors / API message
          ====================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
          }}
        >
          {error}
        </Alert>
      )}


      {!error &&
        today
          ?.message && (
          <Alert
            severity="info"
            sx={{
              mb: 2,
            }}
          >
            {today.message}
          </Alert>
        )}


      {/* ======================================================
          Combined Daily Production Performance
          ====================================================== */}

      {!error && (
        <section
          className={
            `production-daily-overview ` +
            `production-daily-overview--${overallTone}`
          }
        >
          <div className="production-daily-overview-header">
            <div className="production-daily-status">
              <div
                className={
                  `production-daily-status-icon ` +
                  `production-daily-status-icon--${overallTone}`
                }
              >
                <FiCheck />
              </div>

              <div>
                <div className="production-daily-overview-eyebrow">
                  {copy.dailyPerformance}
                </div>

                <h2>
                  {overallStatus}
                </h2>

                <p>
                  {statusNarrative}
                </p>
              </div>
            </div>


            <PerformanceBadge
              performance={
                combinedPerformance
              }
              t={t}
            />
          </div>


          <div className="production-daily-grid">

            <DailyMetric
              eyebrow={
                isSxewOperation
                  ? copy.deliveryEyebrow
                  : t(
                      "production.productionDelivery"
                    )
              }
              title={
                copy.oreDelivery
              }
              actual={
                today
                  ?.ore_actual
              }
              plan={
                today
                  ?.ore_plan
              }
              variance={
                today
                  ?.ore_variance
              }
              performance={
                orePerformance
              }
              icon={
                <FiActivity />
              }
              accent="green"
              language={
                language
              }
              targetLabel={
                copy.target
              }
              unit={
                productionUnit
              }
            />


            {wasteApplicable && (
              <DailyMetric
                eyebrow={t(
                  "production.materialMovement"
                )}
                title={
                  today
                    ?.waste_label ||
                  copy.wasteDelivery
                }
                actual={
                  today
                    ?.waste_actual
                }
                plan={
                  today
                    ?.waste_plan
                }
                variance={
                  today
                    ?.waste_variance
                }
                performance={
                  wastePerformance
                }
                icon={
                  <FiTruck />
                }
                accent="orange"
                language={
                  language
                }
                targetLabel={
                  copy.target
                }
                unit={
                  productionUnit
                }
              />
            )}


            <CompletionMetric
              performance={
                combinedPerformance
              }
              completionLabel={
                copy.overallAttainment
              }
              title={
                copy.planAttainment
              }
              targetLabel={
                copy.target
              }
            />

          </div>
        </section>
      )}


      {/* ======================================================
          Historical Trend
          ====================================================== */}

      {!error && (
        <section className="production-trend-layout">

          <div className="production-trend-card">

            {/* -----------------------------------------------
                Trend toolbar + historical range selector
                ----------------------------------------------- */}

            <Box
              sx={{
                display:
                  "flex",

                flexDirection: {
                  xs:
                    "column",
                  md:
                    "row",
                },

                alignItems: {
                  xs:
                    "stretch",
                  md:
                    "center",
                },

                justifyContent:
                  "space-between",

                gap:
                  2,

                mb:
                  2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize:
                      "0.95rem",

                    fontWeight:
                      800,

                    color:
                      "#172033",
                  }}
                >
                  {copy.trendTitle}
                </Typography>

                <Typography
                  sx={{
                    mt:
                      0.25,

                    fontSize:
                      "0.78rem",

                    fontWeight:
                      500,

                    color:
                      "#7b8497",
                  }}
                >
                  {copy.trendSubtitle}
                </Typography>
              </Box>


              <Box
                role="group"
                aria-label={
                  language === "MN"
                    ? "Үйлдвэрлэлийн хугацааны сонголт"
                    : "Production trend range"
                }
                sx={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  alignSelf: {
                    xs:
                      "flex-start",
                    md:
                      "center",
                  },

                  gap:
                    "4px",

                  p:
                    "4px",

                  border:
                    "1px solid #e5e9f0",

                  borderRadius:
                    "10px",

                  backgroundColor:
                    "#f7f9fc",
                }}
              >
                {PRODUCTION_RANGES.map(
                  (
                    range
                  ) => {
                    const active =
                      selectedRange ===
                      range;

                    return (
                      <button
                        key={
                          range
                        }
                        type="button"
                        disabled={
                          trendLoading
                        }
                        onClick={() =>
                          handleRangeChange(
                            range
                          )
                        }
                        aria-pressed={
                          active
                        }
                        style={{
                          minWidth:
                            46,

                          height:
                            30,

                          padding:
                            "0 10px",

                          border:
                            "none",

                          borderRadius:
                            7,

                          cursor:
                            trendLoading
                              ? "wait"
                              : "pointer",

                          fontFamily:
                            "inherit",

                          fontSize:
                            12,

                          fontWeight:
                            800,

                          lineHeight:
                            1,

                          color:
                            active
                              ? "#ffffff"
                              : "#667085",

                          background:
                            active
                              ? "#16794a"
                              : "transparent",

                          boxShadow:
                            active
                              ? "0 2px 6px rgba(22, 121, 74, 0.20)"
                              : "none",

                          transition:
                            "all 0.18s ease",

                          opacity:
                            trendLoading &&
                            !active
                              ? 0.65
                              : 1,
                        }}
                      >
                        {getRangeLabel(
                          range,
                          language
                        )}
                      </button>
                    );
                  }
                )}
              </Box>
            </Box>


            {trendError && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                }}
              >
                {trendError}
              </Alert>
            )}


            {/* -----------------------------------------------
                Trend chart
                ----------------------------------------------- */}

            <div className="production-trend-chart production-trend-chart--final">

              {trendLoading ? (
                <Box
                  sx={{
                    minHeight:
                      300,

                    display:
                      "flex",

                    flexDirection:
                      "column",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    gap:
                      1.5,
                  }}
                >
                  <CircularProgress
                    size={
                      28
                    }
                  />

                  <Typography
                    sx={{
                      fontSize:
                        "0.82rem",

                      fontWeight:
                        700,

                      color:
                        "#7b8497",
                    }}
                  >
                    {copy.loadingHistory}
                  </Typography>
                </Box>
              ) : (
                <ProductionTrendChart
                  data={
                    trend
                  }
                />
              )}

            </div>


            {/* -----------------------------------------------
                Trend KPI mini cards
                ----------------------------------------------- */}

            <div className="production-trend-mini-grid">

              <div className="production-trend-mini-card">
                <div className="production-trend-mini-icon production-trend-mini-icon--green">
                  <FiTrendingUp />
                </div>

                <div>
                  <span>
                    {averageLabel}
                  </span>

                  <strong>
                    {trendSummary
                      .averageActual ===
                    null
                      ? "—"
                      : formatProductionValue(
                          trendSummary
                            .averageActual,
                          language,
                          productionUnit
                        )}
                  </strong>

                  <small
                    className={
                      trendSummary
                        .averagePerformance ===
                      null
                        ? ""
                        : trendSummary
                              .averagePerformance >=
                            100
                          ? "production-text--positive"
                          : "production-text--negative"
                    }
                  >
                    {trendSummary
                      .averagePerformance ===
                    null
                      ? "—"
                      : `${formatSignedPercent(
                          trendSummary
                            .averagePerformance -
                            100
                        )} (${copy.planAttainment.toLowerCase()})`}
                  </small>
                </div>
              </div>


              <div className="production-trend-mini-card">
                <div className="production-trend-mini-icon production-trend-mini-icon--blue">
                  <FiTarget />
                </div>

                <div>
                  <span>
                    {language === "MN"
                      ? (
                          trendAggregation ===
                          "daily"
                            ? copy.dailyTarget
                            : trendAggregation ===
                              "weekly"
                              ? "7 хоногийн дундаж зорилт"
                              : "Сарын дундаж зорилт"
                        )
                      : (
                          trendAggregation ===
                          "daily"
                            ? copy.dailyTarget
                            : trendAggregation ===
                              "weekly"
                              ? "Average Weekly Target"
                              : "Average Monthly Target"
                        )}
                  </span>

                  <strong>
                    {trendSummary
                      .averagePlan ===
                    null
                      ? formatProductionValue(
                          today
                            ?.ore_plan,
                          language,
                          productionUnit
                        )
                      : formatProductionValue(
                          trendSummary
                            .averagePlan,
                          language,
                          productionUnit
                        )}
                  </strong>

                  <small>
                    {copy.target}
                  </small>
                </div>
              </div>


              <div className="production-trend-mini-card production-trend-mini-card--progress">
                <div className="production-trend-mini-icon production-trend-mini-icon--purple">
                  <FiCalendar />
                </div>

                <div className="production-trend-mini-progress-copy">
                  <span>
                    {periodsAboveLabel}
                  </span>

                  <div className="production-trend-mini-progress-value">
                    <strong>
                      {trendSummary
                        .abovePlanPeriods}

                      {" / "}

                      {trendSummary
                        .totalPeriods}
                    </strong>

                    <small>
                      {trendSummary
                        .totalPeriods >
                      0
                        ? `${abovePlanPercent.toFixed(
                            0
                          )}%`
                        : "—"}
                    </small>
                  </div>

                  <div
                    className="production-trend-progress-track"
                    aria-label={
                      `${periodsAboveLabel}: ${abovePlanPercent.toFixed(
                        0
                      )}%`
                    }
                  >
                    <span
                      style={{
                        width:
                          `${Math.min(
                            Math.max(
                              abovePlanPercent,
                              0
                            ),
                            100
                          )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>


          {/* ==================================================
              Range-aware Summary
              ================================================== */}

          <aside className="production-summary-card">

            <div className="production-summary-title">
              {summaryTitle}
            </div>


            <div className="production-summary-primary">

              <SummaryRow
                dotClass="production-summary-dot--green"
                label={
                  periodsAboveLabel
                }
                value={
                  `${trendSummary.abovePlanPeriods} ${periodUnitLabel}`
                }
                secondary={
                  trendSummary.totalPeriods >
                  0
                    ? `${abovePlanPercent.toFixed(
                        0
                      )}%`
                    : null
                }
              />


              <SummaryRow
                dotClass="production-summary-dot--red"
                label={
                  periodsBelowLabel
                }
                value={
                  `${trendSummary.belowPlanPeriods} ${periodUnitLabel}`
                }
                secondary={
                  trendSummary.totalPeriods >
                  0
                    ? `${(
                        100 -
                        abovePlanPercent
                      ).toFixed(
                        0
                      )}%`
                    : null
                }
              />


              <SummaryRow
                dotClass="production-summary-dot--blue"
                label={
                  copy.averageAttainment
                }
                value={
                  trendSummary
                    .averagePerformance ===
                  null
                    ? "—"
                    : `${trendSummary.averagePerformance.toFixed(
                        1
                      )}%`
                }
              />

            </div>


            <div className="production-summary-divider" />


            <div className="production-summary-extremes">

              <SummaryRow
                label={
                  copy.highestPerformance
                }
                value={
                  trendSummary.highest
                    ? formatProductionValue(
                        trendSummary
                          .highest
                          .actual,
                        language,
                        productionUnit
                      )
                    : "—"
                }
                secondary={
                  trendSummary
                    .highest
                    ?.formattedDate
                }
              />


              <SummaryRow
                label={
                  copy.lowestPerformance
                }
                value={
                  trendSummary.lowest
                    ? formatProductionValue(
                        trendSummary
                          .lowest
                          .actual,
                        language,
                        productionUnit
                      )
                    : "—"
                }
                secondary={
                  trendSummary
                    .lowest
                    ?.formattedDate
                }
              />

            </div>


            <div
              className={
                `production-recent-trend ` +
                `production-recent-trend--${trendSummary.recentTrendTone}`
              }
            >
              <div className="production-recent-trend-eyebrow">
                {recentTrendCopy.title}
              </div>


              <div className="production-recent-trend-body">

                <div className="production-recent-trend-icon">
                  {trendSummary
                    .recentTrendTone ===
                  "positive"
                    ? (
                        <FiArrowUpRight />
                      )
                    : trendSummary
                          .recentTrendTone ===
                        "negative"
                      ? (
                          <FiArrowDownRight />
                        )
                      : (
                          <FiMinus />
                        )}
                </div>


                <div>
                  <strong>
                    {recentTrendTitle}
                  </strong>

                  <p>
                    {recentTrendCopy.description}
                  </p>

                  <span>
                    {trendSummary
                      .recentTrendPercent ===
                    null
                      ? "—"
                      : formatSignedPercent(
                          trendSummary
                            .recentTrendPercent
                        )}
                  </span>
                </div>

              </div>
            </div>

          </aside>

        </section>
      )}


      {/* ======================================================
          Footer Metadata
          ====================================================== */}

      {!error && (
        <footer className="production-data-footer">
          <div>
            <FiActivity />

            <span>
              {copy.dataSource}
            </span>

            <span className="production-data-footer-separator">
              •
            </span>

            <span>
              {copy.lastUpdated}:{" "}

              {formatReportingDate(
                today
                  ?.report_date,
                language,
                t
              )}
            </span>
          </div>

          <span>
            {copy.timezone}
          </span>
        </footer>
      )}

    </Box>
  );
}


export default Production;