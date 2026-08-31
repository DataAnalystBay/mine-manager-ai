import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  FiActivity,
  FiArrowDownRight,
  FiArrowLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiClock,
  FiMinus,
  FiRefreshCw,
  FiShield,
  FiSlash,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";

import AddIcon from "@mui/icons-material/Add";

import ProductionTrendChart
  from "../components/ProductionTrendChart";

import ExecutiveActionDialog
  from "../components/executive/ExecutiveActionDialog";

import {
  getProductionTrend,
  getTodayProduction,
} from "../api/productionApi";

import {
  createExecutiveAction,
  getExecutiveActions,
} from "../api/executiveActionsApi";

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
          ? "Өмнөх 4 долоо хоногтой харьцуулсан."
          : "Compared with previous 4 weeks.",
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
          ? "Өмнөх 3 сартай харьцуулсан."
          : "Compared with previous 3 months.",
    };
  }

  return {
    title:
      language === "MN"
        ? "Сүүлийн 7 хоногийн чиг хандлага"
        : "Last 7-Day Trend",

    description:
      language === "MN"
        ? "Өмнөх 7 хоногтой харьцуулсан."
        : "Compared with previous 7 days.",
  };
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
  const navigate =
    useNavigate();

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
    ,
    setTrendError,
  ] = useState(
    ""
  );

  const initialTranslationRef =
    useRef(
      t
    );


  const [
    selectedAiRecommendation,
    setSelectedAiRecommendation,
  ] = useState(
    null
  );

  const [
    actionDialogOpen,
    setActionDialogOpen,
  ] = useState(
    false
  );


  const [
    savingAction,
    setSavingAction,
  ] = useState(
    false
  );

  const [
    actionSaveError,
    setActionSaveError,
  ] = useState(
    ""
  );


  const [
    relatedExecutiveActions,
    setRelatedExecutiveActions,
  ] = useState(
    []
  );

  const [
    relatedActionsLoading,
    setRelatedActionsLoading,
  ] = useState(
    false
  );

  const [
    relatedActionsError,
    setRelatedActionsError,
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

  useEffect(
    () => {
      const loadInitialProduction =
        async () => {
        try {
          const [
            todayData,
            trendData,
          ] =
            await Promise.all([
              getTodayProduction(),

              getProductionTrend(
                PRODUCTION_RANGES[0]
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
            initialTranslationRef.current(
              "production.unableToLoadAnalytics"
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      };

      loadInitialProduction();
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


  /* ============================================================
     Step 2 — AI Executive Insight + Recommended Actions
     Uses only the production metrics already available on this page.
     Operational causes are presented as items to verify, not confirmed
     root causes.
     ============================================================ */

  const aiPriorityTone =
    combinedPerformance < 95 ||
    trendSummary.recentTrendTone ===
      "negative"
      ? "high"
      : combinedPerformance < 100
        ? "medium"
        : "normal";


  const aiPriorityLabel =
    language === "MN"
      ? aiPriorityTone === "high"
        ? "ӨНДӨР"
        : aiPriorityTone === "medium"
          ? "ДУНД"
          : "ХЭВИЙН"
      : aiPriorityTone === "high"
        ? "HIGH"
        : aiPriorityTone === "medium"
          ? "MEDIUM"
          : "NORMAL";


  const aiInsight =
    useMemo(
      () => {
        const performanceGap =
          combinedPerformance -
          100;

        const recentChange =
          trendSummary
            .recentTrendPercent;

        const happening =
          language === "MN"
            ? combinedPerformance < 100
              ? `${
                  isSxewOperation
                    ? "Катодын зэсийн үйлдвэрлэл"
                    : "Нийт үйлдвэрлэлийн гүйцэтгэл"
                } төлөвлөгөөний ${combinedPerformance.toFixed(
                  1
                )}%-д хүрч, ${Math.abs(
                  performanceGap
                ).toFixed(
                  1
                )}%-ийн зөрүүтэй байна.${
                  recentChange !== null
                    ? ` Сүүлийн хугацааны өөрчлөлт ${formatSignedPercent(
                        recentChange
                      )}.`
                    : ""
                }`
              : `${
                  isSxewOperation
                    ? "Катодын зэсийн үйлдвэрлэл"
                    : "Нийт үйлдвэрлэлийн гүйцэтгэл"
                } төлөвлөгөөний ${combinedPerformance.toFixed(
                  1
                )}%-д хүрсэн байна.${
                  recentChange !== null
                    ? ` Сүүлийн хугацааны өөрчлөлт ${formatSignedPercent(
                        recentChange
                      )}.`
                    : ""
                }`
            : combinedPerformance < 100
              ? `${
                  isSxewOperation
                    ? "Cathode production"
                    : "Total production performance"
                } is at ${combinedPerformance.toFixed(
                  1
                )}% of plan, leaving a ${Math.abs(
                  performanceGap
                ).toFixed(
                  1
                )}% performance gap.${
                  recentChange !== null
                    ? ` Recent production changed ${formatSignedPercent(
                        recentChange
                      )}.`
                    : ""
                }`
              : `${
                  isSxewOperation
                    ? "Cathode production"
                    : "Total production performance"
                } is at ${combinedPerformance.toFixed(
                  1
                )}% of plan.${
                  recentChange !== null
                    ? ` Recent production changed ${formatSignedPercent(
                        recentChange
                      )}.`
                    : ""
                }`;

        const why =
          language === "MN"
            ? combinedPerformance < 100
              ? isSxewOperation
                ? "Төлөвлөгөөнөөс тогтвортой доогуур үйлдвэрлэл нь сарын катодын зэсийн хэмжээг бууруулж, тогтмол зардлыг цөөн тонн бүтээгдэхүүнд хуваарилах эрсдэлтэй."
                : "Төлөвлөгөөнөөс тогтвортой доогуур үйлдвэрлэл нь сарын хүдрийн олборлолт болон хөрс хуулалтын төлөвлөгөөг тасалдуулж, уурхайн дараагийн үе шатны гүйцэтгэлд дарамт үүсгэх эрсдэлтэй."
              : "Төлөвлөгөөний түвшинд тогтвортой ажиллах нь сарын үйлдвэрлэлийн төлөвлөгөө болон зардлын гүйцэтгэлийг хамгаална."
            : combinedPerformance < 100
              ? isSxewOperation
                ? "Sustained production below plan reduces monthly cathode volume and can increase unit-cost pressure when fixed costs are spread across fewer tonnes."
                : "Sustained production below plan puts monthly ore and waste delivery at risk and can constrain downstream mining and processing performance."
              : "Sustaining production at or above plan protects monthly volume delivery and cost performance.";

        const contributors = [
          {
            label:
              language === "MN"
                ? "Төлөвлөгөөтэй харьцуулсан үйлдвэрлэлийн зөрүү"
                : "Production gap versus plan",
            confidence:
              combinedPerformance < 95
                ? (
                    language === "MN"
                      ? "Өндөр"
                      : "High"
                  )
                : (
                    language === "MN"
                      ? "Дунд"
                      : "Medium"
                  ),
            tone:
              combinedPerformance < 95
                ? "high"
                : "medium",
          },
          {
            label:
              language === "MN"
                ? "Сүүлийн үйлдвэрлэлийн чиг хандлага"
                : "Recent production trend",
            confidence:
              trendSummary
                .recentTrendTone ===
              "negative"
                ? (
                    language === "MN"
                      ? "Өндөр"
                      : "High"
                  )
                : (
                    language === "MN"
                      ? "Дунд"
                      : "Medium"
                  ),
            tone:
              trendSummary
                .recentTrendTone ===
              "negative"
                ? "high"
                : "medium",
          },
          {
            label:
              language === "MN"
                ? isSxewOperation
                  ? "Процесс / тоног төхөөрөмжийн хязгаарлалт"
                  : "Олборлолт / тээвэр / тоног төхөөрөмжийн хязгаарлалт"
                : isSxewOperation
                  ? "Process / equipment constraints"
                  : "Mining / haulage / equipment constraints",
            confidence:
              language === "MN"
                ? "Шалгах"
                : "Verify",
            tone:
              "verify",
          },
        ];

        const priority =
          language === "MN"
            ? combinedPerformance < 100
              ? isSxewOperation
                ? "Өдөр тутмын үйлдвэрлэлийг тогтворжуулж, төлөвлөгөөний зөрүү давтагдаж буй шалтгааныг баталгаажуулан сэргээх арга хэмжээг хариуцагчтайгаар хэрэгжүүлэх."
                : "Өдөр тутмын хүдэр болон хөрс хуулалтын гүйцэтгэлийг тогтворжуулж, төлөвлөгөөний зөрүү давтагдаж буй шалтгааныг баталгаажуулан сэргээх арга хэмжээг хариуцагчтайгаар хэрэгжүүлэх."
              : "Төлөвлөгөөний гүйцэтгэлийг хадгалж, сөрөг чиг хандлага үүсэж байгаа эсэхийг үргэлжлүүлэн хянах."
            : combinedPerformance < 100
              ? isSxewOperation
                ? "Stabilize daily cathode output, confirm the recurring causes of the gap to plan, and assign recovery actions before the shortfall compounds."
                : "Stabilize daily ore and waste delivery, confirm the recurring causes of the gap to plan, and assign recovery actions before the shortfall compounds."
              : "Maintain plan performance and continue monitoring for early signs of deterioration.";

        return {
          happening,
          why,
          contributors,
          priority,
        };
      },
      [
        combinedPerformance,
        trendSummary
          .recentTrendPercent,
        trendSummary
          .recentTrendTone,
        isSxewOperation,
        language,
      ]
    );


  const aiRecommendedActions =
    useMemo(
      () => {
        if (
          combinedPerformance <
          100
        ) {
          return [
            {
              id:
                "production_gap",

              canonicalTitle:
                "Investigate production loss versus plan",

              title:
                language === "MN"
                  ? "Үйлдвэрлэлийн зөрүүний шалтгааныг шалгах"
                  : "Investigate production loss versus plan",

              priorityValue:
                "High",

              priority:
                language === "MN"
                  ? "Өндөр"
                  : "High",
              tone:
                "high",
              text:
                language === "MN"
                  ? "Төлөвлөгөөнөөс хамгийн их зөрсөн өдрүүдийг шалгаж, тухайн үеийн үйл ажиллагааны шалтгааныг баталгаажуулах."
                  : "Review the largest daily production losses versus plan and confirm the operational cause for those periods.",
            },
            isSxewOperation
              ? {
                  id:
                    "ew_constraints",

                  canonicalTitle:
                    "Review EW process constraints",

                  title:
                    language === "MN"
                      ? "EW процессын хязгаарлалтыг шалгах"
                      : "Review EW process constraints",

                  priorityValue:
                    "Medium",

                  priority:
                    language === "MN"
                      ? "Дунд"
                      : "Medium",
                  tone:
                    "medium",
                  text:
                    language === "MN"
                      ? "EW availability, current efficiency болон rectifier downtime үзүүлэлтүүдийг зөрүүтэй хугацаанд шалгах."
                      : "Check EW availability, current efficiency, and rectifier downtime across the underperforming periods.",
                }
              : {
                  id:
                    "mining_constraints",

                  canonicalTitle:
                    "Review mining and haulage constraints",

                  title:
                    language === "MN"
                      ? "Олборлолт, тээврийн хязгаарлалтыг шалгах"
                      : "Review mining and haulage constraints",

                  priorityValue:
                    "Medium",

                  priority:
                    language === "MN"
                      ? "Дунд"
                      : "Medium",
                  tone:
                    "medium",
                  text:
                    language === "MN"
                      ? "Төлөвлөгөөнөөс доогуур гүйцэтгэлтэй хугацаанд олборлолтын бүтээмж, автотээврийн бэлэн байдал болон тоног төхөөрөмжийн саатлыг шалгах."
                      : "Check mining productivity, haulage availability, and equipment delays across the underperforming periods.",
                },
            {
              id:
                "production_recovery",

              canonicalTitle:
                "Define production recovery action",

              title:
                language === "MN"
                  ? "Үйлдвэрлэл сэргээх арга хэмжээ тодорхойлох"
                  : "Define production recovery action",

              priorityValue:
                "Medium",

              priority:
                language === "MN"
                  ? "Дунд"
                  : "Medium",
              tone:
                "medium",
              text:
                language === "MN"
                  ? "Дараагийн тайлант хугацааны үйлдвэрлэл сэргээх арга хэмжээ, хариуцагч болон хугацааг тодорхой болгох."
                  : "Assign an owner, recovery action, and due date for the next reporting period.",
            },
          ];
        }

        return [
          {
            id:
              "preserve_conditions",

            canonicalTitle:
              "Confirm plan-attainment conditions",

            title:
              language === "MN"
                ? "Төлөвлөгөө биелүүлэх нөхцөлийг баталгаажуулах"
                : "Confirm plan-attainment conditions",

            priorityValue:
              "Medium",

            priority:
              language === "MN"
                ? "Дунд"
                : "Medium",
            tone:
              "medium",
            text:
              language === "MN"
                ? "Төлөвлөгөөнөөс давсан гүйцэтгэлийг бий болгосон үйл ажиллагааны нөхцөлийг баталгаажуулж, хадгалах."
                : "Confirm the operating conditions supporting plan attainment and preserve them.",
          },
          {
            id:
              "early_negative_trend",

            canonicalTitle:
              "Monitor for early negative trend",

            title:
              language === "MN"
                ? "Сөрөг чиг хандлагыг эрт хянах"
                : "Monitor for early negative trend",

            priorityValue:
              "Medium",

            priority:
              language === "MN"
                ? "Дунд"
                : "Medium",
            tone:
              "medium",
            text:
              language === "MN"
                ? "Сөрөг чиг хандлага эрт үүсэж байгаа эсэхийг өдөр тутмын үйлдвэрлэлийн мэдээллээр хянах."
                : "Monitor daily production for early signs of a negative trend.",
          },
          {
            id:
              "capture_lessons",

            canonicalTitle:
              "Capture stable conditions and lessons",

            title:
              language === "MN"
                ? "Тогтвортой нөхцөл ба сургамжийг тэмдэглэх"
                : "Capture stable conditions and lessons",

            priorityValue:
              "Medium",

            priority:
              language === "MN"
                ? "Хэвийн"
                : "Normal",
            tone:
              "normal",
            text:
              language === "MN"
                ? "Гүйцэтгэлийн хэвийн нөхцөл болон гол сургамжийг дараагийн удирдлагын тоймд тэмдэглэх."
                : "Capture stable operating conditions and key lessons for the next management review.",
          },
        ];
      },
      [
        combinedPerformance,
        isSxewOperation,
        language,
      ]
    );


  const selectedAiActionDraft =
    useMemo(
      () => {
        if (
          !selectedAiRecommendation
        ) {
          return null;
        }

        return {
          action_title:
            selectedAiRecommendation
              .title,

          description:
            selectedAiRecommendation
              .text,

          priority:
            selectedAiRecommendation
              .priorityValue ||
            selectedAiRecommendation
              .priority,

          status:
            "Open",

          category:
            "Production",

          source:
            "AI",

          owner_name:
            "",

          due_date:
            "",
        };
      },
      [
        selectedAiRecommendation,
      ]
    );


  const buildAiActionKey =
    useCallback(
      (
        recommendation
      ) => {
        const reportDate =
          today?.report_date ||
          "unknown_date";

        return [
          "production_ai",
          reportDate,
          recommendation?.id ||
            "recommendation",
        ].join(
          "_"
        );
      },
      [
        today?.report_date,
      ]
    );


  const handleViewExecutiveAction =
    useCallback(
      (
        executiveAction
      ) => {
        const actionId =
          executiveAction?.id ||
          executiveAction?.action_id;

        if (
          actionId
        ) {
          navigate(
            `/executive-actions?action_id=${encodeURIComponent(
              actionId
            )}`
          );

          return;
        }

        navigate(
          "/executive-actions"
        );
      },
      [
        navigate,
      ]
    );


  const relatedActionsReportDate =
    today?.report_date;


  const loadRelatedExecutiveActions =
    useCallback(
      async () => {
        if (
          !relatedActionsReportDate
        ) {
          return;
        }

        setRelatedActionsLoading(
          true
        );

        setRelatedActionsError(
          ""
        );

        try {
          const response =
            await getExecutiveActions({
              skip: 0,
              limit: 100,
            });

          const allActions =
            Array.isArray(
              response
            )
              ? response
              : response?.items ||
                response?.actions ||
                response?.data ||
                [];

          const prefix =
            `production_ai_${relatedActionsReportDate}_`;

          const canonicalTitles =
            new Set(
              aiRecommendedActions.map(
                (
                  recommendation
                ) =>
                  recommendation
                    .canonicalTitle
              )
            );

          const productionActions =
            allActions.filter(
              (
                action
              ) => {
                const actionKey =
                  String(
                    action
                      ?.action_key ||
                    ""
                  );

                if (
                  actionKey.startsWith(
                    prefix
                  )
                ) {
                  return true;
                }

                /*
                 * Backward compatibility for the Step 5 action
                 * created before deterministic action_key support.
                 */
                const source =
                  String(
                    action?.source ||
                    ""
                  )
                    .trim()
                    .toLowerCase();

                const category =
                  String(
                    action?.category ||
                    ""
                  )
                    .trim()
                    .toLowerCase();

                const title =
                  String(
                    action?.title ||
                    action?.action_title ||
                    ""
                  ).trim();

                return (
                  actionKey.startsWith(
                    "manual_action_"
                  ) &&
                  source === "ai" &&
                  category ===
                    "production" &&
                  canonicalTitles.has(
                    title
                  )
                );
              }
            );

          setRelatedExecutiveActions(
            productionActions
          );
        } catch (
          requestError
        ) {
          console.error(
            "Unable to load related executive actions:",
            requestError
          );

          setRelatedExecutiveActions(
            []
          );

          setRelatedActionsError(
            requestError
              ?.userMessage ||
            requestError
              ?.response
              ?.data
              ?.detail ||
            requestError
              ?.message ||
            (
              language === "MN"
                ? "Холбогдох удирдлагын арга хэмжээг ачаалж чадсангүй."
                : "Unable to load related executive actions."
            )
          );
        } finally {
          setRelatedActionsLoading(
            false
          );
        }
      },
      [
        language,
        relatedActionsReportDate,
        aiRecommendedActions,
      ]
    );


  useEffect(
    () => {
      if (
        relatedActionsReportDate
      ) {
        const timeoutId =
          window.setTimeout(
            loadRelatedExecutiveActions,
            0
          );

        return () => {
          window.clearTimeout(
            timeoutId
          );
        };
      }
    },
    [
      relatedActionsReportDate,
      loadRelatedExecutiveActions,
    ]
  );


  useEffect(
    () => {
      const refreshRelatedActions =
        () => {
          if (
            document.visibilityState ===
              "visible" &&
            relatedActionsReportDate
          ) {
            loadRelatedExecutiveActions();
          }
        };

      window.addEventListener(
        "focus",
        refreshRelatedActions
      );

      document.addEventListener(
        "visibilitychange",
        refreshRelatedActions
      );

      return () => {
        window.removeEventListener(
          "focus",
          refreshRelatedActions
        );

        document.removeEventListener(
          "visibilitychange",
          refreshRelatedActions
        );
      };
    },
    [
      relatedActionsReportDate,
      loadRelatedExecutiveActions,
    ]
  );


  const relatedActionSummary =
    useMemo(
      () => {
        const normalizeStatus =
          (
            value
          ) =>
            String(
              value || ""
            )
              .trim()
              .toLowerCase()
              .replace(
                /\s+/g,
                "_"
              );

        const open =
          relatedExecutiveActions.filter(
            (
              action
            ) =>
              normalizeStatus(
                action?.status
              ) === "open"
          ).length;

        const inProgress =
          relatedExecutiveActions.filter(
            (
              action
            ) =>
              normalizeStatus(
                action?.status
              ) ===
                "in_progress"
          ).length;

        const completed =
          relatedExecutiveActions.filter(
            (
              action
            ) =>
              normalizeStatus(
                action?.status
              ) ===
                "completed"
          ).length;

        const blocked =
          relatedExecutiveActions.filter(
            (
              action
            ) =>
              normalizeStatus(
                action?.status
              ) ===
                "blocked"
          ).length;

        const total =
          relatedExecutiveActions.length;

        const completion =
          total > 0
            ? (
                completed /
                total
              ) * 100
            : 0;

        return {
          open,
          inProgress,
          completed,
          blocked,
          total,
          completion,
        };
      },
      [
        relatedExecutiveActions,
      ]
    );


  const handleCreateActionFromRecommendation =
    useCallback(
      (
        recommendation
      ) => {
        setActionSaveError(
          ""
        );

        setSelectedAiRecommendation(
          recommendation
        );

        setActionDialogOpen(
          true
        );
      },
      []
    );


  const handleCloseActionDialog =
    useCallback(
      () => {
        setActionDialogOpen(
          false
        );

        setSelectedAiRecommendation(
          null
        );
      },
      []
    );


  const handleSaveAiAction =
    useCallback(
      async (
        payload
      ) => {
        if (
          !selectedAiRecommendation
        ) {
          return;
        }

        const actionKey =
          buildAiActionKey(
            selectedAiRecommendation
          );

        const alreadyExists =
          relatedExecutiveActions.some(
            (
              action
            ) =>
              action
                ?.action_key ===
                actionKey ||
              (
                String(
                  action?.source ||
                  ""
                )
                  .trim()
                  .toLowerCase() ===
                  "ai" &&
                String(
                  action?.category ||
                  ""
                )
                  .trim()
                  .toLowerCase() ===
                  "production" &&
                String(
                  action?.title ||
                  action?.action_title ||
                  ""
                ).trim() ===
                  selectedAiRecommendation
                    .canonicalTitle
              )
          );

        if (
          alreadyExists
        ) {
          setActionDialogOpen(
            false
          );

          setSelectedAiRecommendation(
            null
          );

          await loadRelatedExecutiveActions();

          return;
        }

        setSavingAction(
          true
        );

        setActionSaveError(
          ""
        );

        try {
          await createExecutiveAction({
              ...payload,

              action_key:
                actionKey,

              source:
                "AI",

              category:
                "Production",
          });

          await loadRelatedExecutiveActions();

          setActionDialogOpen(
            false
          );

          setSelectedAiRecommendation(
            null
          );
        } catch (
          requestError
        ) {
          console.error(
            "Unable to create AI executive action:",
            requestError
          );

          setActionSaveError(
            requestError
              ?.response
              ?.data
              ?.detail ||
            requestError
              ?.message ||
            (
              language === "MN"
                ? "Арга хэмжээг үүсгэж чадсангүй."
                : "Unable to create executive action."
            )
          );
        } finally {
          setSavingAction(
            false
          );
        }
      },
      [
        language,
        selectedAiRecommendation,
        buildAiActionKey,
        relatedExecutiveActions,
        loadRelatedExecutiveActions,
      ]
    );


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

      <Box
        className="production-page-header"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) auto",
          },
          alignItems: "center",
          columnGap: 2,
          rowGap: 1.5,
        }}
      >
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

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent={{
            xs: "flex-start",
            md: "flex-end",
          }}
          className="production-header-controls"
        >
          <button
            type="button"
            className="production-back-button"
            onClick={() =>
              navigate("/")
            }
            aria-label={
              language === "MN"
                ? "Хяналтын самбар руу буцах"
                : "Back to Dashboard"
            }
          >
            <FiArrowLeft />

            <span>
              {language === "MN"
                ? "Хяналтын самбар"
                : "Back to Dashboard"}
            </span>
          </button>

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
      </Box>


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
          Executive KPI Strip
          ====================================================== */}

      {!error && (
        <section
          className={
            `production-kpi-overview ` +
            `production-kpi-overview--${overallTone}`
          }
        >
          {/* Production Status */}
          <div className="production-kpi-cell production-kpi-cell--status">
            <div
              className={
                `production-kpi-icon ` +
                `production-kpi-icon--${overallTone}`
              }
            >
              {combinedPerformance >= 100
                ? <FiArrowUpRight />
                : combinedPerformance >= 95
                  ? <FiMinus />
                  : <FiArrowDownRight />}
            </div>

            <div className="production-kpi-content">
              <div className="production-kpi-label">
                {language === "MN"
                  ? "ҮЙЛДВЭРЛЭЛИЙН ТӨЛӨВ"
                  : "PRODUCTION STATUS"}
              </div>

              <div
                className={
                  `production-kpi-value ` +
                  `production-kpi-value--${overallTone}`
                }
              >
                {overallStatus}
              </div>

              <div className="production-kpi-supporting">
                {language === "MN"
                  ? combinedVariance > 0
                    ? `Төлөвлөгөөнөөс ${Math.abs(
                        combinedVariance
                      ).toFixed(
                        1
                      )}% дээгүүр`
                    : combinedVariance < 0
                      ? `Төлөвлөгөөнөөс ${Math.abs(
                          combinedVariance
                        ).toFixed(
                          1
                        )}% доогуур`
                      : "Төлөвлөгөөтэй тэнцүү"
                  : combinedVariance > 0
                    ? `${Math.abs(
                        combinedVariance
                      ).toFixed(
                        1
                      )}% above plan`
                    : combinedVariance < 0
                      ? `${Math.abs(
                          combinedVariance
                        ).toFixed(
                          1
                        )}% below plan`
                      : "On plan"}
              </div>
            </div>
          </div>


          {/* Cathode / Primary Production */}
          <div className="production-kpi-cell">
            <div className="production-kpi-icon production-kpi-icon--positive">
              <FiActivity />
            </div>

            <div className="production-kpi-content">
              <div className="production-kpi-label">
                {isSxewOperation
                  ? (
                      language === "MN"
                        ? "КАТОДЫН ЗЭСИЙН ҮЙЛДВЭРЛЭЛ"
                        : "CATHODE PRODUCTION"
                    )
                  : (
                      language === "MN"
                        ? "ХҮДРИЙН ҮЙЛДВЭРЛЭЛ"
                        : "ORE PRODUCTION"
                    )}
              </div>

              <div className="production-kpi-value production-kpi-value--neutral">
                {formatProductionValue(
                  today
                    ?.ore_actual,
                  language,
                  productionUnit
                )}
              </div>

              <div className="production-kpi-supporting">
                {copy.target}:{" "}
                <strong>
                  {formatProductionValue(
                    today
                      ?.ore_plan,
                    language,
                    productionUnit
                  )}
                </strong>
              </div>

              <div
                className={
                  `production-kpi-detail ` +
                  `production-kpi-detail--${getPerformanceTone(
                    orePerformance
                  )}`
                }
              >
                {getVarianceIcon(
                  Number(
                    today
                      ?.ore_variance ||
                    0
                  )
                )}

                <span>
                  {formatSignedProductionValue(
                    today
                      ?.ore_variance,
                    language,
                    productionUnit
                  )}
                  {" "}
                  (
                  {formatSignedPercent(
                    orePerformance -
                    100
                  )}
                  )
                </span>
              </div>
            </div>
          </div>


          {/* Plan Attainment */}
          <div className="production-kpi-cell">
            <div
              className={
                `production-kpi-icon ` +
                `production-kpi-icon--${overallTone}`
              }
            >
              <FiTarget />
            </div>

            <div className="production-kpi-content">
              <div className="production-kpi-label">
                {language === "MN"
                  ? "ТӨЛӨВЛӨГӨӨНИЙ БИЕЛЭЛТ"
                  : "PLAN ATTAINMENT"}
              </div>

              <div
                className={
                  `production-kpi-value ` +
                  `production-kpi-value--${overallTone}`
                }
              >
                {combinedPerformance.toFixed(
                  1
                )}%
              </div>

              <div className="production-kpi-supporting">
                {copy.target}:{" "}
                <strong>
                  100.0%
                </strong>
              </div>

              <div
                className={
                  `production-kpi-detail ` +
                  `production-kpi-detail--${overallTone}`
                }
              >
                {getVarianceIcon(
                  combinedVariance
                )}

                <span>
                  {formatSignedPercent(
                    combinedVariance
                  )}
                </span>
              </div>
            </div>
          </div>


          {/* Recent Change */}
          <div className="production-kpi-cell">
            <div
              className={
                `production-kpi-icon ` +
                `production-kpi-icon--${
                  trendSummary
                    .recentTrendTone === "positive"
                    ? "positive"
                    : trendSummary
                        .recentTrendTone === "negative"
                      ? "negative"
                      : "neutral"
                }`
              }
            >
              {trendSummary
                .recentTrendTone === "positive"
                ? <FiArrowUpRight />
                : trendSummary
                    .recentTrendTone === "negative"
                  ? <FiArrowDownRight />
                  : <FiMinus />}
            </div>

            <div className="production-kpi-content">
              <div className="production-kpi-label">
                {trendAggregation === "daily"
                  ? (
                      language === "MN"
                        ? "7 ХОНОГИЙН ӨӨРЧЛӨЛТ"
                        : "7-DAY CHANGE"
                    )
                  : trendAggregation === "weekly"
                    ? (
                        language === "MN"
                          ? "4 ДОЛОО ХОНОГИЙН ӨӨРЧЛӨЛТ"
                          : "4-WEEK CHANGE"
                      )
                    : (
                        language === "MN"
                          ? "3 САРЫН ӨӨРЧЛӨЛТ"
                          : "3-MONTH CHANGE"
                      )}
              </div>

              <div
                className={
                  `production-kpi-value ` +
                  `production-kpi-value--${
                    trendSummary
                      .recentTrendTone === "positive"
                      ? "positive"
                      : trendSummary
                          .recentTrendTone === "negative"
                        ? "negative"
                        : "neutral"
                  }`
                }
              >
                {trendSummary
                  .recentTrendPercent === null
                  ? "—"
                  : formatSignedPercent(
                      trendSummary
                        .recentTrendPercent
                    )}
              </div>

              <div className="production-kpi-supporting">
                {recentTrendTitle}
              </div>
            </div>
          </div>


          {/* AI Confidence */}
          <div className="production-kpi-cell production-kpi-cell--confidence">
            <div className="production-kpi-icon production-kpi-icon--positive">
              <FiShield />
            </div>

            <div className="production-kpi-content production-confidence">
              <div className="production-kpi-label">
                {language === "MN"
                  ? "AI ИТГЭЛЦҮҮР"
                  : "AI CONFIDENCE"}
              </div>

              <div className="production-kpi-value production-kpi-value--positive">
                {language === "MN"
                  ? "Өндөр"
                  : "High"}
              </div>

              <div className="production-kpi-supporting">
                {language === "MN"
                  ? "Боломжит өгөгдөлд үндэслэв"
                  : "Based on available data"}
              </div>
            </div>
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
                Trend chart
                ----------------------------------------------- */}

            <div className="production-trend-chart production-trend-chart--final">

              {trendLoading ? (
                <Box
                  sx={{
                    minHeight:
                      245,

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
                  headerActions={
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
                  }
                />
              )}

            </div>


          </div>


          {/* ==================================================
              Range-aware Summary
              ================================================== */}

          <aside className="production-summary-card">

            <div className="production-summary-title">
              {summaryTitle}
            </div>


            <div className="production-summary-section-label">
              {language === "MN"
                ? "ТӨЛӨВЛӨГӨӨНИЙ ГҮЙЦЭТГЭЛ"
                : "PLAN DELIVERY"}
            </div>

            <div className="production-summary-primary">

              <SummaryRow
                dotClass="production-summary-dot--green"
                label={
                  periodsAboveLabel
                }
                value={
                  trendSummary.totalPeriods >
                  0
                    ? `${trendSummary.abovePlanPeriods} ${periodUnitLabel} (${abovePlanPercent.toFixed(
                        0
                      )}%)`
                    : `${trendSummary.abovePlanPeriods} ${periodUnitLabel}`
                }
              />


              <SummaryRow
                dotClass="production-summary-dot--red"
                label={
                  periodsBelowLabel
                }
                value={
                  trendSummary.totalPeriods >
                  0
                    ? `${trendSummary.belowPlanPeriods} ${periodUnitLabel} (${(
                        100 -
                        abovePlanPercent
                      ).toFixed(
                        0
                      )}%)`
                    : `${trendSummary.belowPlanPeriods} ${periodUnitLabel}`
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

            <div className="production-summary-section-label production-summary-section-label--secondary">
              {language === "MN"
                ? "ХЭЛБЭЛЗЛИЙН ХЯЗГААР"
                : "EXTREMES"}
            </div>

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

                  <p>
                    {recentTrendCopy.description}
                  </p>
                </div>

              </div>
            </div>

          </aside>

        </section>
      )}


      {/* ======================================================
          Step 2 — AI Executive Insight + Recommended Actions
          ====================================================== */}

      {!error && (
        <section className="production-ai-layout">

          <article className="production-ai-insight-card">
            <div className="production-ai-card-header">
              <div className="production-ai-card-heading">
                <div className="production-ai-heading-icon production-ai-heading-icon--blue">
                  <FiActivity />
                </div>

                <div>
                  <h2>
                    {language === "MN"
                      ? "AI УДИРДЛАГЫН ДҮГНЭЛТ"
                      : "AI EXECUTIVE INSIGHT"}
                  </h2>

                  <p>
                    {language === "MN"
                      ? "Боломжит үйлдвэрлэлийн өгөгдөлд үндэслэсэн удирдлагын түвшний дүгнэлт."
                      : "Management-level interpretation based on available production data."}
                  </p>
                </div>
              </div>

              <span
                className={
                  `production-ai-priority-badge ` +
                  `production-ai-priority-badge--${aiPriorityTone}`
                }
              >
                {language === "MN"
                  ? `Анхаарах түвшин: ${aiPriorityLabel}`
                  : `Priority: ${aiPriorityLabel}`}
              </span>
            </div>


            <div className="production-ai-insight-grid">

              <div className="production-ai-insight-item">
                <div className="production-ai-insight-label">
                  <FiBarChart2 />

                  <span>
                    {language === "MN"
                      ? "ЮУ БОЛЖ БАЙНА?"
                      : "WHAT'S HAPPENING?"}
                  </span>
                </div>

                <p>
                  {aiInsight.happening}
                </p>
              </div>


              <div className="production-ai-insight-item">
                <div className="production-ai-insight-label">
                  <FiShield />

                  <span>
                    {language === "MN"
                      ? "ЯАГААД ЧУХАЛ ВЭ?"
                      : "WHY DOES IT MATTER?"}
                  </span>
                </div>

                <p>
                  {aiInsight.why}
                </p>
              </div>


              <div className="production-ai-insight-item">
                <div className="production-ai-insight-label">
                  <FiTarget />

                  <span>
                    {language === "MN"
                      ? "БОЛОМЖИТ НӨЛӨӨЛӨГЧИД"
                      : "LIKELY CONTRIBUTORS"}
                  </span>
                </div>

                <div className="production-ai-contributor-list">
                  {aiInsight
                    .contributors
                    .map(
                      (
                        contributor
                      ) => (
                        <div
                          key={
                            contributor
                              .label
                          }
                          className="production-ai-contributor-row"
                        >
                          <span>
                            {contributor.label}
                          </span>

                          <small
                            className={
                              `production-ai-confidence-tag ` +
                              `production-ai-confidence-tag--${contributor.tone}`
                            }
                          >
                            {contributor
                              .confidence}
                          </small>
                        </div>
                      )
                    )}
                </div>

                <div className="production-ai-evidence-note">
                  {language === "MN"
                    ? "Процесс болон тоног төхөөрөмжийн шалтгааныг холбогдох үйл ажиллагааны өгөгдлөөр баталгаажуулна."
                    : "Process and equipment causes require confirmation from the relevant operational data."}
                </div>
              </div>


              <div className="production-ai-insight-item">
                <div className="production-ai-insight-label">
                  <FiCheck />

                  <span>
                    {language === "MN"
                      ? "УДИРДЛАГЫН ТЭРГҮҮЛЭХ ЧИГЛЭЛ"
                      : "MANAGEMENT PRIORITY"}
                  </span>
                </div>

                <p>
                  {aiInsight.priority}
                </p>
              </div>

            </div>


            <div className="production-ai-priority-callout">
              <div className="production-ai-priority-callout-icon">
                <FiTarget />
              </div>

              <div>
                <span>
                  {language === "MN"
                    ? "ЗӨВЛӨМЖ БОЛГОХ УДИРДЛАГЫН ЧИГЛЭЛ"
                    : "RECOMMENDED MANAGEMENT PRIORITY"}
                </span>

                <strong>
                  {aiInsight.priority}
                </strong>
              </div>
            </div>
          </article>


          <aside className="production-ai-actions-card">
            <div className="production-ai-card-header production-ai-card-header--actions">
              <div className="production-ai-card-heading">
                <div className="production-ai-heading-icon production-ai-heading-icon--green">
                  <FiCheck />
                </div>

                <div>
                  <h2>
                    {language === "MN"
                      ? "AI ЗӨВЛӨМЖИТ АРГА ХЭМЖЭЭ"
                      : "AI RECOMMENDED ACTIONS"}
                  </h2>

                  <p>
                    {language === "MN"
                      ? "Удирдлагын анхаарлыг бодит арга хэмжээ болгон хөрвүүлэх."
                      : "Convert management attention into executable follow-up."}
                  </p>
                </div>
              </div>

              <span className="production-ai-action-count">
                {aiRecommendedActions.length}{" "}
                {language === "MN"
                  ? "арга хэмжээ"
                  : "actions"}
              </span>
            </div>


            <div className="production-ai-action-list">
              {aiRecommendedActions.map(
                (
                  action,
                  index
                ) => {
                  const recommendationActionKey =
                    buildAiActionKey(
                      action
                    );

                  const existingAction =
                    relatedExecutiveActions.find(
                      (
                        executiveAction
                      ) =>
                        executiveAction
                          ?.action_key ===
                          recommendationActionKey ||
                        (
                          String(
                            executiveAction
                              ?.source ||
                            ""
                          )
                            .trim()
                            .toLowerCase() ===
                            "ai" &&
                          String(
                            executiveAction
                              ?.category ||
                            ""
                          )
                            .trim()
                            .toLowerCase() ===
                            "production" &&
                          String(
                            executiveAction
                              ?.title ||
                            executiveAction
                              ?.action_title ||
                            ""
                          ).trim() ===
                            action
                              .canonicalTitle
                        )
                    );

                  const existingActionStatus =
                    String(
                      existingAction
                        ?.status ||
                      "open"
                    )
                      .trim()
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        "_"
                      );

                  const actionStatusConfig = {
                    open: {
                      label:
                        language === "MN"
                          ? "Нээлттэй"
                          : "Open",
                      color:
                        "#64748b",
                    },

                    in_progress: {
                      label:
                        language === "MN"
                          ? "Хэрэгжиж байна"
                          : "In Progress",
                      color:
                        "#2563eb",
                    },

                    completed: {
                      label:
                        language === "MN"
                          ? "Дууссан"
                          : "Completed",
                      color:
                        "#15803d",
                    },

                    blocked: {
                      label:
                        language === "MN"
                          ? "Саатсан"
                          : "Blocked",
                      color:
                        "#dc2626",
                    },
                  };

                  const actionStatus =
                    actionStatusConfig[
                      existingActionStatus
                    ] ||
                    actionStatusConfig.open;

                  return (
                    <div
                      key={
                        action.id
                      }
                      className="production-ai-action-row"
                    >
                      <div className="production-ai-action-number">
                        {index + 1}
                      </div>

                      <div className="production-ai-action-icon">
                        {index === 0
                          ? <FiActivity />
                          : index === 1
                            ? <FiTarget />
                            : <FiCheck />}
                      </div>

                      <p>
                        {action.text}
                      </p>

                      <span
                        className={
                          `production-ai-action-priority ` +
                          `production-ai-action-priority--${action.tone}`
                        }
                      >
                        {action.priority}
                      </span>

                      <Box
                        className="production-ai-action-control"
                      >
                        {existingAction
                          ? (
                              <Box
                                sx={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "flex-end",
                                  gap: 0.5,
                                  flexShrink: 0,
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                <Box
                                  sx={{
                                    display:
                                      "inline-flex",
                                    alignItems:
                                      "center",
                                    gap: 0.4,
                                    color:
                                      actionStatus.color,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  {existingActionStatus ===
                                  "completed" ? (
                                    <FiCheck />
                                  ) : existingActionStatus ===
                                    "blocked" ? (
                                    <FiSlash />
                                  ) : existingActionStatus ===
                                    "in_progress" ? (
                                    <FiTrendingUp />
                                  ) : (
                                    <FiClock />
                                  )}

                                  {actionStatus.label}
                                </Box>

                                <Button
                                  type="button"
                                  variant="text"
                                  size="small"
                                  endIcon={
                                    <FiArrowRight />
                                  }
                                  onClick={() =>
                                    handleViewExecutiveAction(
                                      existingAction
                                    )
                                  }
                                  sx={{
                                    minWidth:
                                      "auto",
                                    px: 0.5,
                                    py: 0.5,
                                    color:
                                      "#2563eb",
                                    fontSize: 11,
                                    fontWeight: 800,
                                    textTransform:
                                      "none",
                                    whiteSpace:
                                      "nowrap",

                                    "&:hover": {
                                      bgcolor:
                                        "#eff6ff",
                                    },
                                  }}
                                >
                                  {language === "MN"
                                    ? "Харах"
                                    : "View Action"}
                                </Button>
                              </Box>
                            )
                          : (
                              <Button
                                type="button"
                                variant="text"
                                size="small"
                                startIcon={
                                  <AddIcon
                                    fontSize="small"
                                  />
                                }
                                disabled={
                                  relatedActionsLoading
                                }
                                onClick={() =>
                                  handleCreateActionFromRecommendation(
                                    action
                                  )
                                }
                                aria-label={
                                  language === "MN"
                                    ? "Арга хэмжээ үүсгэх"
                                    : "Create Action"
                                }
                                sx={{
                                  flexShrink: 0,
                                  minWidth:
                                    "auto",
                                  px: 0.75,
                                  py: 0.5,
                                  borderRadius:
                                    "7px",
                                  color:
                                    "#2563eb",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  textTransform:
                                    "none",
                                  whiteSpace:
                                    "nowrap",

                                  "&:hover": {
                                    bgcolor:
                                      "#eff6ff",
                                  },

                                  "& .MuiButton-startIcon":
                                    {
                                      mr: 0.35,
                                    },
                                }}
                              >
                                {language === "MN"
                                  ? "Арга хэмжээ үүсгэх"
                                  : "Create Action"}
                              </Button>
                            )}
                      </Box>
                    </div>
                  );
                }
              )}
            </div>

          </aside>

        </section>
      )}


      {/* ======================================================
          Step 3 — Related Executive Actions
          ====================================================== */}

      {!error && (
        <section className="production-related-actions-card">

          <div className="production-related-actions-header">
            <div className="production-related-actions-heading">
              <div className="production-related-actions-heading-icon">
                <FiCheck />
              </div>

              <div>
                <h2>
                  {language === "MN"
                    ? "ХОЛБОГДОХ УДИРДЛАГЫН АРГА ХЭМЖЭЭ"
                    : "RELATED EXECUTIVE ACTIONS"}
                </h2>

                <p>
                  {language === "MN"
                    ? "Үйлдвэрлэлийн зөвлөмжөөс үүсгэсэн удирдлагын арга хэмжээний хэрэгжилтийг хянах."
                    : "Track management actions created from production recommendations."}
                </p>
              </div>
            </div>

            <Link
              to="/executive-actions"
              className="production-related-actions-link"
            >
              <span>
                {language === "MN"
                  ? "Action Center нээх"
                  : "Open Action Center"}
              </span>

              <FiArrowRight />
            </Link>
          </div>


          {relatedActionsLoading ? (
            <Box
              sx={{
                minHeight: 150,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Stack
                spacing={1.25}
                alignItems="center"
              >
                <CircularProgress
                  size={28}
                />

                <Typography
                  color="text.secondary"
                  fontSize={13}
                  fontWeight={700}
                >
                  {language === "MN"
                    ? "Холбогдох удирдлагын арга хэмжээг ачаалж байна..."
                    : "Loading related executive actions..."}
                </Typography>
              </Stack>
            </Box>
          ) : relatedActionsError ? (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                borderRadius:
                  "10px",
              }}
            >
              {relatedActionsError}
            </Alert>
          ) : (
            <>
              <div className="production-related-actions-grid">

            <div className="production-related-action-metric">
              <div className="production-related-action-icon production-related-action-icon--open">
                <FiClock />
              </div>

              <div>
                <span>
                  {language === "MN"
                    ? "Нээлттэй"
                    : "Open"}
                </span>

                <strong>
                  {relatedActionSummary.open}
                </strong>

                <small>
                  {language === "MN"
                    ? "Эхлээгүй"
                    : "Not started"}
                </small>
              </div>
            </div>


            <div className="production-related-action-metric">
              <div className="production-related-action-icon production-related-action-icon--progress">
                <FiActivity />
              </div>

              <div>
                <span>
                  {language === "MN"
                    ? "Хэрэгжиж буй"
                    : "In Progress"}
                </span>

                <strong>
                  {relatedActionSummary.inProgress}
                </strong>

                <small>
                  {language === "MN"
                    ? "Хэрэгжүүлж байна"
                    : "Being executed"}
                </small>
              </div>
            </div>


            <div className="production-related-action-metric">
              <div className="production-related-action-icon production-related-action-icon--completed">
                <FiCheck />
              </div>

              <div>
                <span>
                  {language === "MN"
                    ? "Дууссан"
                    : "Completed"}
                </span>

                <strong>
                  {relatedActionSummary.completed}
                </strong>

                <small>
                  {language === "MN"
                    ? "Амжилттай хаасан"
                    : "Successfully closed"}
                </small>
              </div>
            </div>


            <div className="production-related-action-metric">
              <div className="production-related-action-icon production-related-action-icon--blocked">
                <FiSlash />
              </div>

              <div>
                <span>
                  {language === "MN"
                    ? "Саатсан"
                    : "Blocked"}
                </span>

                <strong>
                  {relatedActionSummary.blocked}
                </strong>

                <small>
                  {language === "MN"
                    ? "Анхаарал шаардлагатай"
                    : "Requires intervention"}
                </small>
              </div>
            </div>


            <div className="production-related-action-metric production-related-action-metric--completion">
              <div className="production-related-action-icon production-related-action-icon--completion">
                <FiTrendingUp />
              </div>

              <div>
                <span>
                  {language === "MN"
                    ? "Хэрэгжилт"
                    : "Completion"}
                </span>

                <strong>
                  {`${relatedActionSummary.completion.toFixed(
                    0
                  )}%`}
                </strong>

                <small>
                  {language === "MN"
                    ? "Нийт гүйцэтгэл"
                    : "Overall completion"}
                </small>
              </div>
            </div>

              </div>


              <div className="production-related-actions-progress">
                <div className="production-related-actions-progress-copy">
                  <div>
                    <span>
                      {language === "MN"
                        ? "Удирдлагын арга хэмжээний хэрэгжилт"
                        : "Executive Action Completion"}
                    </span>

                    <small>
                      {language === "MN"
                        ? `${relatedActionSummary.total} арга хэмжээнээс ${relatedActionSummary.completed} дууссан`
                        : `${relatedActionSummary.completed} of ${relatedActionSummary.total} actions completed`}
                    </small>
                  </div>

                  <strong>
                    {`${relatedActionSummary.completion.toFixed(
                      0
                    )}%`}
                  </strong>
                </div>

                <div
                  className="production-related-actions-progress-track"
                  aria-label={
                    language === "MN"
                      ? `Удирдлагын арга хэмжээний хэрэгжилт ${relatedActionSummary.completion.toFixed(
                          0
                        )} хувь`
                      : `Executive action completion ${relatedActionSummary.completion.toFixed(
                          0
                        )} percent`
                  }
                >
                  <span
                    style={{
                      width:
                        `${relatedActionSummary.completion}%`,
                    }}
                  />
                </div>
              </div>
            </>
          )}

        </section>
      )}


      {actionSaveError && (
        <Alert
          severity="error"
          sx={{
            mt: 1.5,
            borderRadius:
              "10px",
          }}
        >
          {actionSaveError}
        </Alert>
      )}


      <ExecutiveActionDialog
        open={
          actionDialogOpen
        }
        action={
          selectedAiActionDraft
        }
        onClose={
          handleCloseActionDialog
        }
        onSave={
          handleSaveAiAction
        }
        saving={
          savingAction
        }
        primaryColor={
          "#2563eb"
        }
      />


    </Box>
  );
}


export default Production;
