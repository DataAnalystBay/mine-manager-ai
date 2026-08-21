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
  const number = Number(value || 0);

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
  const number = Number(value || 0);

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
    return t("common.notAvailable");
  }

  const date =
    new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
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
  language
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

  if (Number.isNaN(date.getTime())) {
    return text;
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
    return t("production.abovePlan");
  }

  if (performance >= 95) {
    return t("production.nearPlan");
  }

  return t("production.belowPlan");
}


function getVarianceIcon(variance) {
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
      Number(row?.[key]);

    if (Number.isFinite(value)) {
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
  if (Array.isArray(trend)) {
    return trend;
  }

  if (Array.isArray(trend?.data)) {
    return trend.data;
  }

  if (Array.isArray(trend?.items)) {
    return trend.items;
  }

  if (Array.isArray(trend?.results)) {
    return trend.results;
  }

  return [];
}


function calculateTrendSummary(
  trend,
  language
) {
  const validRows =
    normalizeTrendRows(trend)
      .map((row) => ({
        actual:
          getOreActual(row),

        plan:
          getOrePlan(row),

        date:
          getTrendDate(row),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.actual) &&
          Number.isFinite(item.plan) &&
          item.plan > 0
      );

  if (!validRows.length) {
    return {
      totalDays: 0,
      abovePlanDays: 0,
      belowPlanDays: 0,
      averageActual: null,
      averagePlan: null,
      averagePerformance: null,
      highest: null,
      lowest: null,
      recentTrendPercent: null,
      recentTrendTone: "neutral",
    };
  }

  const totalDays =
    validRows.length;

  const abovePlanDays =
    validRows.filter(
      (item) =>
        item.actual >= item.plan
    ).length;

  const belowPlanDays =
    totalDays -
    abovePlanDays;

  const averageActual =
    validRows.reduce(
      (sum, item) =>
        sum + item.actual,
      0
    ) / totalDays;

  const averagePlan =
    validRows.reduce(
      (sum, item) =>
        sum + item.plan,
      0
    ) / totalDays;

  const averagePerformance =
    averagePlan > 0
      ? (
          averageActual /
          averagePlan
        ) * 100
      : null;

  const highest =
    validRows.reduce(
      (best, item) =>
        !best ||
        item.actual > best.actual
          ? item
          : best,
      null
    );

  const lowest =
    validRows.reduce(
      (best, item) =>
        !best ||
        item.actual < best.actual
          ? item
          : best,
      null
    );

  const averageActualFor =
    (items) => {
      if (!items.length) {
        return null;
      }

      return (
        items.reduce(
          (sum, item) =>
            sum + item.actual,
          0
        ) / items.length
      );
    };

  const recentSeven =
    validRows.slice(-7);

  const previousSeven =
    validRows.slice(
      Math.max(
        0,
        totalDays - 14
      ),
      Math.max(
        0,
        totalDays - 7
      )
    );

  const recentAverage =
    averageActualFor(
      recentSeven
    );

  const previousAverage =
    averageActualFor(
      previousSeven
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
    recentTrendPercent === null
      ? "neutral"
      : recentTrendPercent > 0.25
        ? "positive"
        : recentTrendPercent < -0.25
          ? "negative"
          : "neutral";

  return {
    totalDays,
    abovePlanDays,
    belowPlanDays,
    averageActual,
    averagePlan,
    averagePerformance,

    highest: highest
      ? {
          ...highest,
          formattedDate:
            formatShortDate(
              highest.date,
              language
            ),
        }
      : null,

    lowest: lowest
      ? {
          ...lowest,
          formattedDate:
            formatShortDate(
              lowest.date,
              language
            ),
        }
      : null,

    recentTrendPercent,
    recentTrendTone,
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
      <span className="production-status-dot" />

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
            Number(variance || 0)
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
            {performance.toFixed(1)}%
          </div>

          <div className="production-daily-plan">
            {targetLabel}:{" "}
            <strong>100.0%</strong>
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

        <span>{label}</span>
      </div>

      <div className="production-summary-row-value">
        <strong>{value}</strong>

        {secondary && (
          <small>{secondary}</small>
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

  const [today, setToday] =
    useState(null);

  const [trend, setTrend] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const operationProfile =
    String(
      today?.operation_profile ||
      "standard_mine"
    )
      .trim()
      .toLowerCase();

  const isSxewOperation =
    operationProfile === "sxew_copper";

  const wasteApplicable =
    today?.waste_applicable !== false;

  const productionUnit =
    today?.production_unit ||
    getDefaultProductionUnit(
      language
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

                thirtyDaySummary:
                  "30 хоногийн дүгнэлт",

                abovePlanDays:
                  "Төлөвлөгөө биелүүлсэн өдөр",

                belowPlanDays:
                  "Төлөвлөгөөнөөс доогуур өдөр",

                averageAttainment:
                  "Дундаж биелэлт",

                highestPerformance:
                  "Хамгийн өндөр гүйцэтгэл",

                lowestPerformance:
                  "Хамгийн бага гүйцэтгэл",

                lastSevenTrend:
                  "Сүүлийн 7 хоногийн чиг хандлага",

                improving:
                  "Сайжирч байна",

                declining:
                  "Буурч байна",

                stable:
                  "Тогтвортой",

                recentTrendDescription:
                  "Сүүлийн 7 хоногийн дундаж гүйцэтгэлийг өмнөх 7 хоногтой харьцуулсан өөрчлөлт.",

                thirtyDayAverage:
                  "30 өдрийн дундаж",

                dailyTarget:
                  "Өдрийн зорилт",

                daysAbovePlan:
                  "Төлөвлөгөө давсан өдөр",

                dataSource:
                  "Өгөгдөл: Өдөр бүрийн тайлан",

                lastUpdated:
                  "Сүүлийн шинэчлэлт",

                timezone:
                  "Бүс цаг: Asia/Ulaanbaatar",

                day:
                  "өдөр",

                pageTitle:
                  "Үйлдвэрлэлийн гүйцэтгэл",

                pageSubtitle:
                  "Төлөвлөгөө, бодит гүйцэтгэл, хэлбэлзэл болон чиг хандлагыг хянах.",

                deliveryEyebrow:
                  "Үйлдвэрлэлийн гүйцэтгэл",
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

                thirtyDaySummary:
                  "30-Day Summary",

                abovePlanDays:
                  "Days at or above plan",

                belowPlanDays:
                  "Days below plan",

                averageAttainment:
                  "Average attainment",

                highestPerformance:
                  "Highest performance",

                lowestPerformance:
                  "Lowest performance",

                lastSevenTrend:
                  "Last 7-Day Trend",

                improving:
                  "Improving",

                declining:
                  "Declining",

                stable:
                  "Stable",

                recentTrendDescription:
                  "Change in the latest 7-day average versus the previous 7 days.",

                thirtyDayAverage:
                  "30-Day Average",

                dailyTarget:
                  "Daily Target",

                daysAbovePlan:
                  "Days Above Plan",

                dataSource:
                  "Data: Daily production report",

                lastUpdated:
                  "Last updated",

                timezone:
                  "Timezone: Asia/Ulaanbaatar",

                day:
                  "days",

                pageTitle:
                  "Production Performance",

                pageSubtitle:
                  "Monitor plan, actual performance, variance, and recent production trend.",

                deliveryEyebrow:
                  "Production Delivery",
              };

        if (!isSxewOperation) {
          return baseCopy;
        }

        return {
          ...baseCopy,

          dailyPerformance:
            language === "MN"
              ? "Катодын зэсийн үйлдвэрлэлийн гүйцэтгэл"
              : "Cathode Production Performance",

          oreDelivery:
            today?.production_label ||
            today?.ore_label ||
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

          thirtyDaySummary:
            language === "MN"
              ? "Сүүлийн 30 тайлант үеийн дүгнэлт"
              : "30-Period Production Summary",

          abovePlanDays:
            language === "MN"
              ? "Төлөвлөгөө биелүүлсэн үе"
              : "Periods at or above plan",

          belowPlanDays:
            language === "MN"
              ? "Төлөвлөгөөнөөс доогуур үе"
              : "Periods below plan",

          highestPerformance:
            language === "MN"
              ? "Хамгийн өндөр үйлдвэрлэл"
              : "Highest production",

          lowestPerformance:
            language === "MN"
              ? "Хамгийн бага үйлдвэрлэл"
              : "Lowest production",

          lastSevenTrend:
            language === "MN"
              ? "Сүүлийн 7 үеийн чиг хандлага"
              : "Last 7-Period Trend",

          recentTrendDescription:
            language === "MN"
              ? "Сүүлийн 7 тайлант үеийн дундаж үйлдвэрлэлийг өмнөх 7 үетэй харьцуулсан өөрчлөлт."
              : "Change in average cathode production across the latest seven reporting periods versus the previous seven.",

          thirtyDayAverage:
            language === "MN"
              ? "30 үеийн дундаж"
              : "30-Period Average",

          dailyTarget:
            language === "MN"
              ? "Үйлдвэрлэлийн зорилт"
              : "Production Target",

          daysAbovePlan:
            language === "MN"
              ? "Төлөвлөгөө давсан үе"
              : "Periods Above Plan",

          dataSource:
            language === "MN"
              ? "Өгөгдөл: Катодын зэсийн үйлдвэрлэлийн тайлан"
              : "Data: Cathode production report",

          day:
            language === "MN"
              ? "үе"
              : "periods",

          pageTitle:
            language === "MN"
              ? "Катодын зэсийн үйлдвэрлэл"
              : "Cathode Production",

          pageSubtitle:
            language === "MN"
              ? "Катодын зэсийн үйлдвэрлэлийн төлөвлөгөө, бодит гүйцэтгэл, хэлбэлзэл болон чиг хандлагыг хянах."
              : "Monitor cathode production plan, actual output, variance, and recent performance trend.",

          deliveryEyebrow:
            language === "MN"
              ? "Катодын зэсийн үйлдвэрлэл"
              : "Cathode Production",
        };
      },
      [
        language,
        isSxewOperation,
        today?.production_label,
        today?.ore_label,
      ]
    );


  const loadProduction =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          todayData,
          trendData,
        ] = await Promise.all([
          getTodayProduction(),
          getProductionTrend(),
        ]);

        setToday(
          todayData
        );

        setTrend(
          normalizeTrendRows(
            trendData
          )
        );
      } catch (requestError) {
        console.error(
          "Production page load failed:",
          requestError
        );

        setError(
          requestError?.message ||
            t(
              "production.unableToLoadAnalytics"
            )
        );
      } finally {
        setLoading(false);
      }
    }, [t]);


  useEffect(() => {
    loadProduction();
  }, [loadProduction]);


  const orePerformance =
    useMemo(
      () =>
        calculatePerformance(
          today?.ore_actual,
          today?.ore_plan
        ),
      [
        today?.ore_actual,
        today?.ore_plan,
      ]
    );


  const wastePerformance =
    useMemo(
      () =>
        calculatePerformance(
          today?.waste_actual,
          today?.waste_plan
        ),
      [
        today?.waste_actual,
        today?.waste_plan,
      ]
    );


  const combinedPerformance =
    useMemo(
      () => {
        if (!wasteApplicable) {
          return orePerformance;
        }

        return calculateCombinedPerformance({
          oreActual:
            today?.ore_actual,

          orePlan:
            today?.ore_plan,

          wasteActual:
            today?.waste_actual,

          wastePlan:
            today?.waste_plan,
        });
      },
      [
        wasteApplicable,
        orePerformance,
        today?.ore_actual,
        today?.ore_plan,
        today?.waste_actual,
        today?.waste_plan,
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


  const trendSummary =
    useMemo(
      () =>
        calculateTrendSummary(
          trend,
          language
        ),
      [
        trend,
        language,
      ]
    );


  const daysAbovePercent =
    trendSummary.totalDays > 0
      ? (
          trendSummary.abovePlanDays /
          trendSummary.totalDays
        ) * 100
      : 0;


  const recentTrendTitle =
    trendSummary.recentTrendTone ===
    "positive"
      ? copy.improving
      : trendSummary.recentTrendTone ===
          "negative"
        ? copy.declining
        : copy.stable;


  const statusNarrative =
    isSxewOperation
      ? language === "MN"
        ? combinedPerformance >= 100
          ? `Катодын зэсийн үйлдвэрлэлийн гүйцэтгэл төлөвлөгөөнөөс ${formatSignedPercent(
              combinedVariance
            )}-иар давсан байна.`
          : combinedPerformance >= 95
            ? `Катодын зэсийн үйлдвэрлэлийн гүйцэтгэл төлөвлөгөөний ${combinedPerformance.toFixed(
                1
              )}%-д хүрсэн байна.`
            : `Катодын зэсийн үйлдвэрлэлийн гүйцэтгэл төлөвлөгөөнөөс ${Math.abs(
                combinedVariance
              ).toFixed(1)}%-иар доогуур байна.`
        : combinedPerformance >= 100
          ? `Cathode production performance is ${formatSignedPercent(
              combinedVariance
            )} above plan.`
          : combinedPerformance >= 95
            ? `Cathode production performance is at ${combinedPerformance.toFixed(
                1
              )}% of plan.`
            : `Cathode production performance is ${Math.abs(
                combinedVariance
              ).toFixed(1)}% below plan.`
      : language === "MN"
        ? combinedPerformance >= 100
          ? `Өнөөдрийн нийт олборлолтын гүйцэтгэл төлөвлөгөөнөөс ${formatSignedPercent(
              combinedVariance
            )}-иар давсан байна.`
          : combinedPerformance >= 95
            ? `Өнөөдрийн нийт олборлолтын гүйцэтгэл төлөвлөгөөний ${combinedPerformance.toFixed(
                1
              )}%-д хүрсэн байна.`
            : `Өнөөдрийн нийт олборлолтын гүйцэтгэл төлөвлөгөөнөөс ${Math.abs(
                combinedVariance
              ).toFixed(1)}%-иар доогуур байна.`
        : combinedPerformance >= 100
          ? `Today's total production performance is ${formatSignedPercent(
              combinedVariance
            )} above plan.`
          : combinedPerformance >= 95
            ? `Today's total production performance is at ${combinedPerformance.toFixed(
                1
              )}% of plan.`
            : `Today's total production performance is ${Math.abs(
                combinedVariance
              ).toFixed(1)}% below plan.`;


  if (loading) {
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
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          md: "center",
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
                  marginLeft: 8,
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#0f766e",
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
                  today?.report_date,
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
              loadProduction
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
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}


      {!error &&
        today?.message && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
          >
            {today.message}
          </Alert>
        )}


      {/* ======================================================
          Combined Daily Production Performance
          Target design: one status + KPI card
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
                today?.ore_actual
              }
              plan={
                today?.ore_plan
              }
              variance={
                today?.ore_variance
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
                  today?.waste_label ||
                  copy.wasteDelivery
                }
                actual={
                  today?.waste_actual
                }
                plan={
                  today?.waste_plan
                }
                variance={
                  today?.waste_variance
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
          Trend + 30-day Summary
          ====================================================== */}

      {!error && (
        <section className="production-trend-layout">

          <div className="production-trend-card">
            <div className="production-trend-chart production-trend-chart--final">

              <ProductionTrendChart
                data={trend}
              />

            </div>


            <div className="production-trend-mini-grid">

              <div className="production-trend-mini-card">
                <div className="production-trend-mini-icon production-trend-mini-icon--green">
                  <FiTrendingUp />
                </div>

                <div>
                  <span>
                    {copy.thirtyDayAverage}
                  </span>

                  <strong>
                    {trendSummary.averageActual ===
                    null
                      ? "—"
                      : formatProductionValue(
                          trendSummary.averageActual,
                          language,
                          productionUnit
                        )}
                  </strong>

                  <small
                    className={
                      trendSummary.averagePerformance ===
                      null
                        ? ""
                        : trendSummary.averagePerformance >=
                          100
                          ? "production-text--positive"
                          : "production-text--negative"
                    }
                  >
                    {trendSummary.averagePerformance ===
                    null
                      ? "—"
                      : `${formatSignedPercent(
                          trendSummary.averagePerformance -
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
                    {copy.dailyTarget}
                  </span>

                  <strong>
                    {trendSummary.averagePlan ===
                    null
                      ? formatProductionValue(
                          today?.ore_plan,
                          language,
                          productionUnit
                        )
                      : formatProductionValue(
                          trendSummary.averagePlan,
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
                    {copy.daysAbovePlan}
                  </span>

                  <div className="production-trend-mini-progress-value">
                    <strong>
                      {trendSummary.abovePlanDays}
                      {" / "}
                      {trendSummary.totalDays}
                    </strong>

                    <small>
                      {trendSummary.totalDays > 0
                        ? `${daysAbovePercent.toFixed(
                            0
                          )}%`
                        : "—"}
                    </small>
                  </div>

                  <div
                    className="production-trend-progress-track"
                    aria-label={
                      `${copy.daysAbovePlan}: ${daysAbovePercent.toFixed(
                        0
                      )}%`
                    }
                  >
                    <span
                      style={{
                        width:
                          `${Math.min(
                            Math.max(
                              daysAbovePercent,
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


          <aside className="production-summary-card">

            <div className="production-summary-title">
              {copy.thirtyDaySummary}
            </div>


            <div className="production-summary-primary">
              <SummaryRow
                dotClass="production-summary-dot--green"
                label={
                  copy.abovePlanDays
                }
                value={
                  `${trendSummary.abovePlanDays} ${copy.day}`
                }
                secondary={
                  trendSummary.totalDays > 0
                    ? `${daysAbovePercent.toFixed(
                        0
                      )}%`
                    : null
                }
              />

              <SummaryRow
                dotClass="production-summary-dot--red"
                label={
                  copy.belowPlanDays
                }
                value={
                  `${trendSummary.belowPlanDays} ${copy.day}`
                }
                secondary={
                  trendSummary.totalDays > 0
                    ? `${(
                        100 -
                        daysAbovePercent
                      ).toFixed(0)}%`
                    : null
                }
              />

              <SummaryRow
                dotClass="production-summary-dot--blue"
                label={
                  copy.averageAttainment
                }
                value={
                  trendSummary.averagePerformance ===
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
                        trendSummary.highest.actual,
                        language,
                        productionUnit
                      )
                    : "—"
                }
                secondary={
                  trendSummary.highest
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
                        trendSummary.lowest.actual,
                        language,
                        productionUnit
                      )
                    : "—"
                }
                secondary={
                  trendSummary.lowest
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
                {copy.lastSevenTrend}
              </div>

              <div className="production-recent-trend-body">
                <div className="production-recent-trend-icon">
                  {trendSummary.recentTrendTone ===
                  "positive"
                    ? <FiArrowUpRight />
                    : trendSummary.recentTrendTone ===
                        "negative"
                      ? <FiArrowDownRight />
                      : <FiMinus />}
                </div>

                <div>
                  <strong>
                    {recentTrendTitle}
                  </strong>

                  <p>
                    {copy.recentTrendDescription}
                  </p>

                  <span>
                    {trendSummary.recentTrendPercent ===
                    null
                      ? "—"
                      : formatSignedPercent(
                          trendSummary.recentTrendPercent
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
                today?.report_date,
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
