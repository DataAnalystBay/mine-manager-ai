import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link, useNavigate } from "react-router-dom";

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
  FiAlertCircle,
  FiArrowDownRight,
  FiArrowLeft,
  FiArrowRight,
  FiArrowUpRight,
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

import PlantTrendChart from "../components/PlantTrendChart";
import ExecutiveActionDialog from "../components/executive/ExecutiveActionDialog";
import { getPlantTrend, getTodayPlant } from "../api/plantApi";
import {
  createExecutiveAction,
  getExecutiveActions,
} from "../api/executiveActionsApi";
import { useLanguage } from "../context/LanguageContext";
import { useConfig } from "../context/ConfigContext";

import "./Plant.css";


const LEGACY_THROUGHPUT_TARGET = 100;
const LEGACY_RECOVERY_TARGET = 90;
const LEGACY_PLANT_TARGET = 95;

const PLANT_RANGES = [
  "30D",
  "90D",
  "1Y",
  "3Y",
  "5Y",
];


function getStatus(value, target = 100) {
  const attainment = target > 0 ? (value / target) * 100 : 0;
  if (attainment >= 100) return "Healthy";
  if (attainment >= 95) return "Attention Required";
  return "Critical";
}


function getTone(value, target = 100) {
  const attainment = target > 0 ? (value / target) * 100 : 0;
  if (attainment >= 100) return "positive";
  if (attainment >= 95) return "warning";
  return "negative";
}


function toFiniteMetric(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}


function normalizeTargetName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((part) => !["kpi", "target", "percentage", "percent", "pct"].includes(part))
    .join(" ")
    .trim();
}


function findPlantTarget(kpiTargets, names) {
  const accepted = new Set(names.map(normalizeTargetName));
  const match = (Array.isArray(kpiTargets) ? kpiTargets : []).find((item) => {
    const candidates = [item?.kpi_name, item?.key, item?.name, item?.code]
      .map(normalizeTargetName)
      .filter(Boolean);
    const category = normalizeTargetName(item?.kpi_category || item?.category);
    return category === "plant" && candidates.some((candidate) => accepted.has(candidate));
  });
  const value = Number(match?.target_value);
  return Number.isFinite(value) && value > 0 ? value : null;
}


function formatSignedPercent(value) {
  const number = Number(value || 0);
  return number > 0
    ? `+${number.toFixed(1)}%`
    : `${number.toFixed(1)}%`;
}


function formatReportingDate(value, language, t) {
  if (!value) return t("plant.unavailable");

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(
    language === "MN" ? "mn-MN" : "en-US",
    { day: "2-digit", month: "short", year: "numeric" }
  );
}


function getVarianceIcon(value) {
  if (value > 0) return <FiArrowUpRight />;
  if (value < 0) return <FiArrowDownRight />;
  return <FiMinus />;
}


function SummaryRow({ dotClass, label, value, secondary }) {
  return (
    <div className="plant-summary-row">
      <div className="plant-summary-row-label">
        {dotClass && <span className={`plant-summary-dot ${dotClass}`} />}
        <span>{label}</span>
      </div>

      <div className="plant-summary-row-value">
        <strong>{value}</strong>
        {secondary && <small>{secondary}</small>}
      </div>
    </div>
  );
}


function getTrendAggregation(trend, selectedRange) {
  const aggregation = trend?.[0]?.aggregation;

  if (["daily", "weekly", "monthly"].includes(aggregation)) {
    return aggregation;
  }

  if (selectedRange === "1Y") return "weekly";
  if (selectedRange === "3Y" || selectedRange === "5Y") return "monthly";
  return "daily";
}


function formatPeriodSummaryValue(count, percent, aggregation, language, t) {
  const singular = Number(count) === 1;
  const unitKey = aggregation === "weekly"
    ? singular ? "week" : "weeks"
    : aggregation === "monthly"
      ? singular ? "month" : "months"
      : singular ? "day" : "days";
  const unit = language === "MN"
    ? t(`plant.${aggregation === "weekly" ? "week" : aggregation === "monthly" ? "month" : "day"}`)
    : t(`plant.${unitKey}`);

  return `${count} ${unit} (${percent.toFixed(0)}%)`;
}


function calculatePlantPeriodSummary(trend, aggregation, recoveryTarget) {
  const rows = Array.isArray(trend) ? trend : [];

  const throughputRows = rows
    .map((row) => ({
      actual: toFiniteMetric(row?.throughput_actual),
      target: toFiniteMetric(row?.throughput_plan),
    }))
    .filter((row) =>
      Number.isFinite(row.actual) &&
      Number.isFinite(row.target) &&
      row.target > 0
    );

  const recoveryRows = rows
    .map((row) => toFiniteMetric(row?.recovery))
    .filter((value) => value !== null);

  const summarize = (values) => {
    const total = values.length;
    const atOrAbove = values.filter((value) => value >= 100).length;

    return {
      total,
      atOrAbove,
      below: total - atOrAbove,
      atOrAbovePercent: total > 0 ? (atOrAbove / total) * 100 : 0,
      average: total > 0
        ? values.reduce((sum, value) => sum + value, 0) / total
        : null,
    };
  };

  const throughputTotalActual = throughputRows.reduce(
    (sum, row) => sum + row.actual,
    0
  );
  const throughputTotalTarget = throughputRows.reduce(
    (sum, row) => sum + row.target,
    0
  );
  const throughput = summarize(
    throughputRows.map((row) => (row.actual / row.target) * 100)
  );

  throughput.average = throughputTotalTarget > 0
    ? (throughputTotalActual / throughputTotalTarget) * 100
    : null;

  const recovery = summarize(
    recoveryRows.map((value) => (value / recoveryTarget) * 100)
  );

  const performanceValues = rows
    .map((row) => toFiniteMetric(row?.plant_performance))
    .filter((value) => value !== null);
  const comparisonSize = aggregation === "daily"
    ? 7
    : aggregation === "weekly"
      ? 4
      : 3;
  const recent = performanceValues.slice(-comparisonSize);
  const previous = performanceValues.slice(-comparisonSize * 2, -comparisonSize);
  const average = (values) => values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
  const recentAverage = average(recent);
  const previousAverage = average(previous);
  const recentTrendPercent =
    recentAverage !== null && previousAverage !== null && previousAverage > 0
      ? ((recentAverage - previousAverage) / previousAverage) * 100
      : null;
  const recentTrendTone = recentTrendPercent === null
    ? "neutral"
    : recentTrendPercent > 0.25
      ? "positive"
      : recentTrendPercent < -0.25
        ? "negative"
        : "neutral";

  return {
    throughput,
    recovery,
    recentTrendPercent,
    recentTrendTone,
  };
}


function Plant() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { company, mine, kpi_targets: kpiTargets } = useConfig();

  const [today, setToday] = useState(null);
  const [trend, setTrend] = useState([]);
  const [selectedRange, setSelectedRange] = useState("30D");
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState("");
  const [trendError, setTrendError] = useState("");
  const [selectedAiRecommendation, setSelectedAiRecommendation] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [actionSaveError, setActionSaveError] = useState("");
  const [relatedExecutiveActions, setRelatedExecutiveActions] = useState([]);
  const [relatedActionsLoading, setRelatedActionsLoading] = useState(false);
  const [relatedActionsError, setRelatedActionsError] = useState("");

  const initialTranslationRef = useRef(t);


  useEffect(() => {
    const loadInitialPlant = async () => {
      try {
        const [todayData, trendData] = await Promise.all([
          getTodayPlant(),
          getPlantTrend(PLANT_RANGES[0]),
        ]);

        setToday(todayData);
        setTrend(Array.isArray(trendData) ? trendData : []);
      } catch (requestError) {
        console.error("Plant page load failed:", requestError);
        setError(
          requestError?.message ||
            initialTranslationRef.current("plant.unableToLoad")
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialPlant();
  }, []);


  const loadTrendRange = useCallback(
    async (range) => {
      if (!PLANT_RANGES.includes(range)) return;

      setTrendLoading(true);
      setTrendError("");
      setTrend([]);

      try {
        const trendData = await getPlantTrend(range);
        setTrend(Array.isArray(trendData) ? trendData : []);
      } catch (requestError) {
        console.error("Plant trend load failed:", requestError);
        setTrend([]);
        setTrendError(
          requestError?.message || t("plant.unableToLoadTrend")
        );
      } finally {
        setTrendLoading(false);
      }
    },
    [t]
  );


  const handleRangeChange = useCallback(
    async (range) => {
      if (range === selectedRange || trendLoading) return;
      setSelectedRange(range);
      await loadTrendRange(range);
    },
    [loadTrendRange, selectedRange, trendLoading]
  );


  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError("");
    setTrendError("");

    try {
      const [todayData, trendData] = await Promise.all([
        getTodayPlant(),
        getPlantTrend(selectedRange),
      ]);

      setToday(todayData);
      setTrend(Array.isArray(trendData) ? trendData : []);
    } catch (requestError) {
      console.error("Plant refresh failed:", requestError);
      setError(requestError?.message || t("plant.unableToLoad"));
    } finally {
      setLoading(false);
    }
  }, [selectedRange, t]);


  const throughputTarget = findPlantTarget(
    kpiTargets,
    ["Throughput Performance", "Plant Throughput Performance"]
  ) || LEGACY_THROUGHPUT_TARGET;
  const recoveryTarget = findPlantTarget(
    kpiTargets,
    ["Recovery", "Plant Recovery", "Cu Recovery"]
  ) || LEGACY_RECOVERY_TARGET;
  const plantTarget = findPlantTarget(
    kpiTargets,
    ["Plant Performance", "Process Plant Performance"]
  ) || LEGACY_PLANT_TARGET;
  const throughputMetric = toFiniteMetric(today?.throughput_performance);
  const recoveryMetric = toFiniteMetric(today?.recovery);
  const plantMetric = toFiniteMetric(today?.plant_performance);
  const metricsReady = throughputMetric !== null && recoveryMetric !== null && plantMetric !== null;
  const throughputPerformance = throughputMetric ?? 0;
  const recovery = recoveryMetric ?? 0;
  const plantPerformance = plantMetric ?? 0;

  const plantStatus = getStatus(plantPerformance, plantTarget);
  const overallTone = getTone(plantPerformance, plantTarget);
  const plantGap = plantPerformance - plantTarget;
  const throughputGap = throughputPerformance - throughputTarget;
  const recoveryGap = recovery - recoveryTarget;

  const localizedStatus =
    plantStatus === "Healthy"
      ? t("plant.healthy")
      : plantStatus === "Attention Required"
        ? t("plant.attentionRequired")
        : t("plant.critical");

  const focusAreas = useMemo(() => {
    const result = [];

    if (throughputPerformance < throughputTarget) {
      result.push(t("plant.throughputPerformance"));
    }

    if (recovery < recoveryTarget) {
      result.push(t("plant.recovery"));
    }

    return result;
  }, [recovery, recoveryTarget, t, throughputPerformance, throughputTarget]);

  const trendAggregation = getTrendAggregation(trend, selectedRange);
  const periodSummary = useMemo(
    () => calculatePlantPeriodSummary(trend, trendAggregation, recoveryTarget),
    [recoveryTarget, trend, trendAggregation]
  );
  const summaryKeyByRange = {
    "30D": "thirtyDaySummary",
    "90D": "ninetyDaySummary",
    "1Y": "oneYearSummary",
    "3Y": "threeYearSummary",
    "5Y": "fiveYearSummary",
  };
  const chartKeyByRange = {
    "30D": "chartActualAgainstTarget",
    "90D": "chartActualAgainstTarget90",
    "1Y": "chartActualAgainstTarget1Y",
    "3Y": "chartActualAgainstTarget3Y",
    "5Y": "chartActualAgainstTarget5Y",
  };
  const periodAtOrAboveLabel = trendAggregation === "weekly"
    ? t("plant.weeksAtOrAboveTarget")
    : trendAggregation === "monthly"
      ? t("plant.monthsAtOrAboveTarget")
      : t("plant.daysAtOrAboveTarget");
  const periodBelowLabel = trendAggregation === "weekly"
    ? t("plant.weeksBelowTarget")
    : trendAggregation === "monthly"
      ? t("plant.monthsBelowTarget")
      : t("plant.daysBelowTarget");
  const trendWindowCopy = trendAggregation === "weekly"
    ? {
        title: t("plant.lastFourWeekTrend"),
        description: t("plant.comparedPreviousFourWeeks"),
      }
    : trendAggregation === "monthly"
      ? {
          title: t("plant.lastThreeMonthTrend"),
          description: t("plant.comparedPreviousThreeMonths"),
        }
      : {
          title: t("plant.lastSevenDayTrend"),
          description: t("plant.comparedPreviousSevenDays"),
        };
  const rangeCopy = {
    summary: t(`plant.${summaryKeyByRange[selectedRange]}`),
    chart: t(`plant.${chartKeyByRange[selectedRange]}`),
  };
  const recentTrendLabel = periodSummary.recentTrendTone === "positive"
    ? t("plant.improving")
    : periodSummary.recentTrendTone === "negative"
      ? t("plant.declining")
      : t("plant.stable");

  const aiPriorityTone =
    plantPerformance < 85 || throughputGap < -10 || recoveryGap < -5
      ? "high"
      : plantPerformance < plantTarget || focusAreas.length > 0
        ? "medium"
        : "normal";

  const aiPriorityLabel = t(`plant.aiPriority.${aiPriorityTone}`);
  const aiConfidenceLabel = trend.length > 0
    ? t("plant.aiConfidenceHigh")
    : t("plant.aiConfidenceModerate");

  const aiInsight = useMemo(() => {
    const contributors = [];

    if (throughputGap < 0) {
      contributors.push({
        label: t("plant.aiContributorThroughput"),
        confidence: t("plant.aiConfidenceHigh"),
        tone: "high",
      });
    }

    if (recoveryGap < 0) {
      contributors.push({
        label: t("plant.aiContributorRecovery"),
        confidence: t("plant.aiConfidenceHigh"),
        tone: "high",
      });
    }

    contributors.push({
      label: t("plant.aiContributorConstraints"),
      confidence: t("plant.aiVerify"),
      tone: "verify",
    });

    return {
      happening:
        plantPerformance < plantTarget
          ? `${t("plant.aiHappeningBelow")} ${plantPerformance.toFixed(1)}%.`
          : `${t("plant.aiHappeningOnTarget")} ${plantPerformance.toFixed(1)}%.`,
      why:
        plantPerformance < plantTarget
          ? t("plant.aiWhyBelow")
          : t("plant.aiWhyOnTarget"),
      contributors,
      priority:
        focusAreas.length > 0
          ? t("plant.aiManagementPriorityRecovery")
          : t("plant.aiManagementPriorityMaintain"),
    };
  }, [focusAreas.length, plantPerformance, plantTarget, recoveryGap, t, throughputGap]);

  const aiRecommendedActions = useMemo(() => {
    const actions = [];

    if (throughputGap < 0) {
      actions.push({
        id: "throughput_loss",
        canonicalTitle: "Investigate plant throughput loss",
        title: t("plant.actionThroughputTitle"),
        text: t("plant.actionThroughputText"),
        priorityValue: "High",
        priority: t("plant.priorityHigh"),
        tone: "high",
      });
    }

    if (recoveryGap < 0) {
      actions.push({
        id: "recovery_drivers",
        canonicalTitle: "Review plant recovery drivers",
        title: t("plant.actionRecoveryTitle"),
        text: t("plant.actionRecoveryText"),
        priorityValue: recoveryGap < -5 ? "High" : "Medium",
        priority: recoveryGap < -5
          ? t("plant.priorityHigh")
          : t("plant.priorityMedium"),
        tone: recoveryGap < -5 ? "high" : "medium",
      });
    }

    actions.push({
      id: "plant_constraints",
      canonicalTitle: "Verify plant operating constraints",
      title: t("plant.actionConstraintsTitle"),
      text: t("plant.actionConstraintsText"),
      priorityValue: focusAreas.length > 0 ? "Medium" : "Low",
      priority: focusAreas.length > 0
        ? t("plant.priorityMedium")
        : t("plant.priorityNormal"),
      tone: focusAreas.length > 0 ? "medium" : "normal",
    });

    if (actions.length < 3) {
      actions.push({
        id: "plant_stability",
        canonicalTitle: "Preserve stable plant operating conditions",
        title: t("plant.actionStabilityTitle"),
        text: t("plant.actionStabilityText"),
        priorityValue: "Low",
        priority: t("plant.priorityNormal"),
        tone: "normal",
      });
    }

    return actions.slice(0, 3);
  }, [focusAreas.length, recoveryGap, t, throughputGap]);

  const selectedAiActionDraft = useMemo(() => {
    if (!selectedAiRecommendation) return null;

    return {
      action_title: selectedAiRecommendation.title,
      description: selectedAiRecommendation.text,
      priority:
        selectedAiRecommendation.priorityValue ||
        selectedAiRecommendation.priority,
      status: "Open",
      category: "Plant",
      source: "AI",
      owner_name: "",
      due_date: "",
    };
  }, [selectedAiRecommendation]);

  const buildAiActionKey = useCallback(
    (recommendation) => [
      "plant_ai",
      today?.report_date || "unknown_date",
      recommendation?.id || "recommendation",
    ].join("_"),
    [today?.report_date]
  );

  const relatedActionsReportDate = today?.report_date;

  const findRelatedPlantAction = useCallback(
    (recommendation) => {
      const actionKey = buildAiActionKey(recommendation);
      return relatedExecutiveActions.find((action) => {
        const existingKey = String(action?.action_key || "");
        if (existingKey === actionKey) return true;

        return existingKey.startsWith("manual_action_") &&
          String(action?.title || action?.action_title || "").trim() ===
            recommendation?.canonicalTitle;
      });
    },
    [buildAiActionKey, relatedExecutiveActions]
  );

  const loadRelatedExecutiveActions = useCallback(async () => {
    if (!relatedActionsReportDate) return;

    setRelatedActionsLoading(true);
    setRelatedActionsError("");

    try {
      const response = await getExecutiveActions({ skip: 0, limit: 100 });
      const allActions = Array.isArray(response)
        ? response
        : response?.items || response?.actions || response?.data || [];
      const prefix = `plant_ai_${relatedActionsReportDate}_`;
      const canonicalTitles = new Set(
        aiRecommendedActions.map((recommendation) => recommendation.canonicalTitle)
      );

      setRelatedExecutiveActions(
        allActions.filter((action) => {
          const actionKey = String(action?.action_key || "");
          if (actionKey.startsWith(prefix)) return true;

          return (
            actionKey.startsWith("manual_action_") &&
            canonicalTitles.has(
              String(action?.title || action?.action_title || "").trim()
            )
          );
        })
      );
    } catch (requestError) {
      console.error("Unable to load related Plant actions:", requestError);
      setRelatedExecutiveActions([]);
      setRelatedActionsError(
        requestError?.userMessage ||
          requestError?.response?.data?.detail ||
          requestError?.message ||
          t("plant.relatedActionsLoadError")
      );
    } finally {
      setRelatedActionsLoading(false);
    }
  }, [aiRecommendedActions, relatedActionsReportDate, t]);

  useEffect(() => {
    if (!relatedActionsReportDate) return undefined;

    const timeoutId = window.setTimeout(loadRelatedExecutiveActions, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRelatedExecutiveActions, relatedActionsReportDate]);

  const relatedActionSummary = useMemo(() => {
    const normalizeStatus = (value) =>
      String(value || "").trim().toLowerCase().replace(/\s+/g, "_");

    const count = (status) => relatedExecutiveActions.filter(
      (action) => normalizeStatus(action?.status) === status
    ).length;

    const total = relatedExecutiveActions.length;
    const completed = count("completed");

    return {
      open: count("open"),
      inProgress: count("in_progress"),
      completed,
      blocked: count("blocked"),
      total,
      completion: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [relatedExecutiveActions]);

  const handleViewExecutiveAction = useCallback(
    (executiveAction) => {
      const actionId = executiveAction?.id || executiveAction?.action_id;
      navigate(
        actionId
          ? `/executive-actions?action_id=${encodeURIComponent(actionId)}`
          : "/executive-actions"
      );
    },
    [navigate]
  );

  const handleCreateActionFromRecommendation = useCallback((recommendation) => {
    setActionSaveError("");
    setSelectedAiRecommendation(recommendation);
    setActionDialogOpen(true);
  }, []);

  const handleCloseActionDialog = useCallback(() => {
    setActionDialogOpen(false);
    setSelectedAiRecommendation(null);
  }, []);

  const handleSaveAiAction = useCallback(async (payload) => {
    if (!selectedAiRecommendation) return;

    const actionKey = buildAiActionKey(selectedAiRecommendation);
    const alreadyExists = findRelatedPlantAction(selectedAiRecommendation);

    if (alreadyExists) {
      handleCloseActionDialog();
      await loadRelatedExecutiveActions();
      return;
    }

    setSavingAction(true);
    setActionSaveError("");

    try {
      await createExecutiveAction({
        ...payload,
        action_key: actionKey,
        kpi_key: "plant",
        source: "AI",
        category: "Plant",
      });

      await loadRelatedExecutiveActions();
      handleCloseActionDialog();
    } catch (requestError) {
      console.error("Unable to create Plant executive action:", requestError);
      if (requestError?.response?.status === 409) {
        await loadRelatedExecutiveActions();
        handleCloseActionDialog();
        return;
      }
      setActionSaveError(
        requestError?.response?.data?.detail ||
          requestError?.message ||
          t("plant.actionCreateError")
      );
    } finally {
      setSavingAction(false);
    }
  }, [
    buildAiActionKey,
    findRelatedPlantAction,
    handleCloseActionDialog,
    loadRelatedExecutiveActions,
    selectedAiRecommendation,
    t,
  ]);


  if (loading) {
    return (
      <Box className="plant-loading">
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary" fontWeight={700}>
            {t("plant.loadingPlantIntelligence")}
          </Typography>
        </Stack>
      </Box>
    );
  }


  return (
    <Box className="plant-page">
      <Box className="plant-page-header">
        <Box className="plant-heading-copy">
          <Typography component="h1" className="plant-page-title">
            {t("plant.title")}
          </Typography>
          <Typography className="plant-page-context">
            {today?.mine_name || mine?.mine_name || t("plant.operationFallback")}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" className="plant-header-controls">
          <button
            type="button"
            className="plant-back-button"
            onClick={() => navigate("/")}
            aria-label={t("plant.backToDashboard")}
          >
            <FiArrowLeft />
            <span>{t("plant.backToDashboard")}</span>
          </button>

          <Box className="plant-reporting-date">
            <FiCalendar />
            <Box>
              <span className="plant-reporting-date-label">
                {t("plant.reportingDate")}
              </span>
              <strong>
                {formatReportingDate(today?.report_date, language, t)}
              </strong>
            </Box>
          </Box>

          <button
            type="button"
            className="plant-refresh-button"
            onClick={handleRefresh}
            title={t("plant.refreshPlantData")}
            aria-label={t("plant.refreshPlantData")}
          >
            <FiRefreshCw />
          </button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!error && today?.data_status === "No Data" && (
        <Alert severity="info" sx={{ mb: 2 }}>{t("plant.noDatasetAvailable")}</Alert>
      )}

      {!error && today?.data_status !== "No Data" && !metricsReady && (
        <Alert severity="warning" sx={{ mb: 2 }}>{t("plant.metricsUnavailable")}</Alert>
      )}

      {!error && metricsReady && (
        <section className={`plant-kpi-overview plant-kpi-overview--${overallTone}`}>
          <div className="plant-kpi-cell plant-kpi-cell--status">
            <div className={`plant-kpi-icon plant-kpi-icon--${overallTone}`}>
              {plantPerformance >= plantTarget ? <FiTrendingUp /> : <FiAlertCircle />}
            </div>
            <div className="plant-kpi-content">
              <div className="plant-kpi-label">{t("plant.plantOperatingStatus")}</div>
              <div className={`plant-kpi-value plant-kpi-value--${overallTone}`}>
                {localizedStatus}
              </div>
              <div className="plant-kpi-supporting">
                {plantGap < 0
                  ? `${Math.abs(plantGap).toFixed(1)}% ${t("plant.belowTarget").toLowerCase()}`
                  : t("plant.operatingWithinTargetRange")}
              </div>
            </div>
          </div>

          <div className="plant-kpi-cell">
            <div className={`plant-kpi-icon plant-kpi-icon--${getTone(throughputPerformance, throughputTarget)}`}>
              <FiActivity />
            </div>
            <div className="plant-kpi-content">
              <div className="plant-kpi-label">{t("plant.throughputPerformance")}</div>
              <div className={`plant-kpi-value plant-kpi-value--${getTone(throughputPerformance, throughputTarget)}`}>
                {throughputPerformance.toFixed(1)}%
              </div>
              <div className="plant-kpi-supporting">
                {t("plant.target")}: <strong>{throughputTarget.toFixed(1)}%</strong>
              </div>
              <div className={`plant-kpi-detail plant-kpi-detail--${getTone(throughputPerformance, throughputTarget)}`}>
                {getVarianceIcon(throughputGap)}
                <span>{formatSignedPercent(throughputGap)}</span>
              </div>
            </div>
          </div>

          <div className="plant-kpi-cell">
            <div className={`plant-kpi-icon plant-kpi-icon--${getTone(recovery, recoveryTarget)}`}>
              <FiTarget />
            </div>
            <div className="plant-kpi-content">
              <div className="plant-kpi-label">{t("plant.recovery")}</div>
              <div className={`plant-kpi-value plant-kpi-value--${getTone(recovery, recoveryTarget)}`}>
                {recovery.toFixed(1)}%
              </div>
              <div className="plant-kpi-supporting">
                {t("plant.target")}: <strong>{recoveryTarget.toFixed(1)}%</strong>
              </div>
              <div className={`plant-kpi-detail plant-kpi-detail--${getTone(recovery, recoveryTarget)}`}>
                {getVarianceIcon(recoveryGap)}
                <span>{formatSignedPercent(recoveryGap)}</span>
              </div>
            </div>
          </div>

          <div className="plant-kpi-cell">
            <div className={`plant-kpi-icon plant-kpi-icon--${overallTone}`}>
              <FiTrendingUp />
            </div>
            <div className="plant-kpi-content">
              <div className="plant-kpi-label">{t("plant.plantPerformance")}</div>
              <div className={`plant-kpi-value plant-kpi-value--${overallTone}`}>
                {plantPerformance.toFixed(1)}%
              </div>
              <div className="plant-kpi-supporting">
                {t("plant.target")}: <strong>{plantTarget.toFixed(1)}%</strong>
              </div>
              <div className={`plant-kpi-detail plant-kpi-detail--${overallTone}`}>
                {getVarianceIcon(plantGap)}
                <span>{formatSignedPercent(plantGap)}</span>
              </div>
            </div>
          </div>

          <div className="plant-kpi-cell plant-kpi-cell--confidence">
            <div className="plant-kpi-icon plant-kpi-icon--positive">
              <FiShield />
            </div>
            <div className="plant-kpi-content">
              <div className="plant-kpi-label">{t("plant.aiConfidence")}</div>
              <div className="plant-kpi-value plant-kpi-value--positive">
                {aiConfidenceLabel}
              </div>
              <div className="plant-kpi-supporting">
                {t("plant.aiConfidenceSupporting")}
              </div>
            </div>
          </div>
        </section>
      )}

      {!error && metricsReady && (
        <section className="plant-trend-layout">
          <div className="plant-trend-card">
            {trendError && <Alert severity="error" sx={{ mx: 1.5, mt: 1 }}>{trendError}</Alert>}

            <div className="plant-trend-chart">
              {trendLoading ? (
                <Box className="plant-trend-loading">
                  <CircularProgress size={28} />
                  <Typography color="text.secondary" fontWeight={700}>
                    {t("plant.loadingHistory")}
                  </Typography>
                </Box>
              ) : (
                <PlantTrendChart
                  data={trend}
                  recoveryTarget={recoveryTarget}
                  aggregation={trendAggregation}
                  periodDescription={rangeCopy.chart}
                  headerActions={
                    <Box
                      role="group"
                      aria-label={t("plant.trendRange")}
                      className="plant-range-control"
                    >
                      {PLANT_RANGES.map((range) => {
                        const active = selectedRange === range;

                        return (
                          <button
                            key={range}
                            type="button"
                            disabled={trendLoading}
                            onClick={() => handleRangeChange(range)}
                            aria-pressed={active}
                            className={active ? "is-active" : ""}
                          >
                            {range}
                          </button>
                        );
                      })}
                    </Box>
                  }
                />
              )}
            </div>
          </div>

          <aside className="plant-summary-card">
            <div className="plant-summary-title">{rangeCopy.summary}</div>
            <div className="plant-summary-section-label">{t("plant.throughput")}</div>

            <div className="plant-summary-primary">
              <SummaryRow
                dotClass="plant-summary-dot--positive"
                label={periodAtOrAboveLabel}
                value={formatPeriodSummaryValue(
                  periodSummary.throughput.atOrAbove,
                  periodSummary.throughput.atOrAbovePercent,
                  trendAggregation,
                  language,
                  t
                )}
              />
              <SummaryRow
                dotClass="plant-summary-dot--negative"
                label={periodBelowLabel}
                value={formatPeriodSummaryValue(
                  periodSummary.throughput.below,
                  100 - periodSummary.throughput.atOrAbovePercent,
                  trendAggregation,
                  language,
                  t
                )}
              />
              <SummaryRow
                dotClass="plant-summary-dot--neutral"
                label={t("plant.averageAttainment")}
                value={periodSummary.throughput.average === null
                  ? "—"
                  : `${periodSummary.throughput.average.toFixed(1)}%`}
              />
            </div>

            <div className="plant-summary-divider" />
            <div className="plant-summary-section-label">{t("plant.recovery")}</div>

            <div className="plant-summary-primary">
              <SummaryRow
                dotClass="plant-summary-dot--positive"
                label={periodAtOrAboveLabel}
                value={formatPeriodSummaryValue(
                  periodSummary.recovery.atOrAbove,
                  periodSummary.recovery.atOrAbovePercent,
                  trendAggregation,
                  language,
                  t
                )}
              />
              <SummaryRow
                dotClass="plant-summary-dot--negative"
                label={periodBelowLabel}
                value={formatPeriodSummaryValue(
                  periodSummary.recovery.below,
                  100 - periodSummary.recovery.atOrAbovePercent,
                  trendAggregation,
                  language,
                  t
                )}
              />
              <SummaryRow
                dotClass="plant-summary-dot--neutral"
                label={t("plant.averageAttainment")}
                value={periodSummary.recovery.average === null
                  ? "—"
                  : `${periodSummary.recovery.average.toFixed(1)}%`}
              />
            </div>

            <div className={`plant-recent-status plant-recent-status--${periodSummary.recentTrendTone}`}>
              <div className="plant-recent-status-eyebrow">{trendWindowCopy.title}</div>
              <div className="plant-recent-status-body">
                <div className="plant-recent-status-icon">
                  {periodSummary.recentTrendTone === "positive"
                    ? <FiArrowUpRight />
                    : periodSummary.recentTrendTone === "negative"
                      ? <FiArrowDownRight />
                      : <FiMinus />}
                </div>
                <div>
                  <strong>{recentTrendLabel}</strong>
                  <span>{periodSummary.recentTrendPercent === null
                    ? "—"
                    : formatSignedPercent(periodSummary.recentTrendPercent)}</span>
                  <p>{trendWindowCopy.description}</p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      )}

      {!error && metricsReady && (
        <section className="plant-ai-layout">
          <article className="plant-ai-insight-card">
            <div className="plant-ai-card-header">
              <div className="plant-ai-card-heading">
                <div className="plant-ai-heading-icon plant-ai-heading-icon--blue">
                  <FiActivity />
                </div>
                <div>
                  <h2>{t("plant.aiExecutiveInsight")}</h2>
                  <p>{t("plant.aiInsightDescription")}</p>
                </div>
              </div>

              <span className={`plant-ai-priority-badge plant-ai-priority-badge--${aiPriorityTone}`}>
                {t("plant.priorityLabel")}: {aiPriorityLabel}
              </span>
            </div>

            <div className="plant-ai-insight-grid">
              <div className="plant-ai-insight-item">
                <div className="plant-ai-insight-label">
                  <FiActivity />
                  <span>{t("plant.whatsHappening")}</span>
                </div>
                <p>{aiInsight.happening}</p>
              </div>

              <div className="plant-ai-insight-item">
                <div className="plant-ai-insight-label">
                  <FiShield />
                  <span>{t("plant.whyItMatters")}</span>
                </div>
                <p>{aiInsight.why}</p>
              </div>

              <div className="plant-ai-insight-item">
                <div className="plant-ai-insight-label">
                  <FiTarget />
                  <span>{t("plant.likelyContributors")}</span>
                </div>
                <div className="plant-ai-contributor-list">
                  {aiInsight.contributors.map((contributor) => (
                    <div key={contributor.label} className="plant-ai-contributor-row">
                      <span>{contributor.label}</span>
                      <small className={`plant-ai-confidence-tag plant-ai-confidence-tag--${contributor.tone}`}>
                        {contributor.confidence}
                      </small>
                    </div>
                  ))}
                </div>
                <div className="plant-ai-evidence-note">
                  {t("plant.aiEvidenceNote")}
                </div>
              </div>

              <div className="plant-ai-insight-item">
                <div className="plant-ai-insight-label">
                  <FiCheck />
                  <span>{t("plant.managementPriority")}</span>
                </div>
                <p>{aiInsight.priority}</p>
              </div>
            </div>

            <div className="plant-ai-priority-callout">
              <div className="plant-ai-priority-callout-icon"><FiTarget /></div>
              <div>
                <span>{t("plant.recommendedManagementPriority")}</span>
                <strong>{aiInsight.priority}</strong>
              </div>
            </div>
          </article>

          <aside className="plant-ai-actions-card">
            <div className="plant-ai-card-header plant-ai-card-header--actions">
              <div className="plant-ai-card-heading">
                <div className="plant-ai-heading-icon plant-ai-heading-icon--green">
                  <FiCheck />
                </div>
                <div>
                  <h2>{t("plant.aiRecommendedActions")}</h2>
                  <p>{t("plant.aiActionsDescription")}</p>
                </div>
              </div>
              <span className="plant-ai-action-count">
                {aiRecommendedActions.length} {t("plant.actionsCountLabel")}
              </span>
            </div>

            <div className="plant-ai-action-list">
              {aiRecommendedActions.map((action, index) => {
                const existingAction = findRelatedPlantAction(action);
                const status = String(existingAction?.status || "open")
                  .trim().toLowerCase().replace(/\s+/g, "_");
                const statusConfig = {
                  open: { label: t("plant.actionStatusOpen"), icon: <FiClock /> },
                  in_progress: { label: t("plant.actionStatusInProgress"), icon: <FiActivity /> },
                  completed: { label: t("plant.actionStatusCompleted"), icon: <FiCheck /> },
                  blocked: { label: t("plant.actionStatusBlocked"), icon: <FiSlash /> },
                }[status] || { label: t("plant.actionStatusOpen"), icon: <FiClock /> };

                return (
                  <div key={action.id} className="plant-ai-action-row">
                    <div className="plant-ai-action-number">{index + 1}</div>
                    <div className="plant-ai-action-icon">
                      {index === 0 ? <FiActivity /> : index === 1 ? <FiTarget /> : <FiCheck />}
                    </div>
                    <p>{action.text}</p>
                    <span className={`plant-ai-action-priority plant-ai-action-priority--${action.tone}`}>
                      {action.priority}
                    </span>
                    <Box className="plant-ai-action-control">
                      {existingAction ? (
                        <Box className={`plant-ai-existing-status plant-ai-existing-status--${status}`}>
                          <span>{statusConfig.icon}{statusConfig.label}</span>
                          <Button
                            type="button"
                            variant="text"
                            size="small"
                            onClick={() => handleViewExecutiveAction(existingAction)}
                          >
                            {t("plant.viewAction")}
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          type="button"
                          variant="text"
                          size="small"
                          startIcon={<AddIcon fontSize="small" />}
                          disabled={relatedActionsLoading}
                          onClick={() => handleCreateActionFromRecommendation(action)}
                          aria-label={t("plant.createAction")}
                        >
                          {t("plant.createAction")}
                        </Button>
                      )}
                    </Box>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>
      )}

      {!error && metricsReady && (
        <section className="plant-related-actions-card">
          <div className="plant-related-actions-header">
            <div className="plant-related-actions-heading">
              <div className="plant-related-actions-heading-icon"><FiCheck /></div>
              <div>
                <h2>{t("plant.relatedExecutiveActions")}</h2>
                <p>{t("plant.relatedActionsDescription")}</p>
              </div>
            </div>

            <Link to="/executive-actions" className="plant-related-actions-link">
              <span>{t("plant.openActionCenter")}</span>
              <FiArrowRight />
            </Link>
          </div>

          {relatedActionsLoading ? (
            <Box className="plant-related-actions-state">
              <CircularProgress size={28} />
              <Typography>{t("plant.loadingRelatedActions")}</Typography>
            </Box>
          ) : relatedActionsError ? (
            <Alert severity="error" sx={{ mt: 1 }}>{relatedActionsError}</Alert>
          ) : (
            <>
              <div className="plant-related-actions-grid">
                {[
                  ["open", t("plant.actionStatusOpen"), relatedActionSummary.open, t("plant.notStarted"), <FiClock />],
                  ["progress", t("plant.actionStatusInProgress"), relatedActionSummary.inProgress, t("plant.beingExecuted"), <FiActivity />],
                  ["completed", t("plant.actionStatusCompleted"), relatedActionSummary.completed, t("plant.successfullyClosed"), <FiCheck />],
                  ["blocked", t("plant.actionStatusBlocked"), relatedActionSummary.blocked, t("plant.requiresIntervention"), <FiSlash />],
                  ["completion", t("plant.completion"), `${relatedActionSummary.completion.toFixed(0)}%`, t("plant.overallCompletion"), <FiTrendingUp />],
                ].map(([tone, label, value, supporting, icon]) => (
                  <div key={tone} className="plant-related-action-metric">
                    <div className={`plant-related-action-icon plant-related-action-icon--${tone}`}>{icon}</div>
                    <div>
                      <span>{label}</span>
                      <strong>{value}</strong>
                      <small>{supporting}</small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="plant-related-actions-progress">
                <div className="plant-related-actions-progress-copy">
                  <div>
                    <span>{t("plant.executiveActionCompletion")}</span>
                    <small>
                      {relatedActionSummary.completed} / {relatedActionSummary.total} {t("plant.actionsCompleted")}
                    </small>
                  </div>
                  <strong>{relatedActionSummary.completion.toFixed(0)}%</strong>
                </div>
                <div
                  className="plant-related-actions-progress-track"
                  aria-label={`${t("plant.executiveActionCompletion")} ${relatedActionSummary.completion.toFixed(0)}%`}
                >
                  <span style={{ width: `${relatedActionSummary.completion}%` }} />
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {actionSaveError && <Alert severity="error" sx={{ mt: 1.5 }}>{actionSaveError}</Alert>}

      <ExecutiveActionDialog
        open={actionDialogOpen}
        action={selectedAiActionDraft}
        onClose={handleCloseActionDialog}
        onSave={handleSaveAiAction}
        saving={savingAction}
        primaryColor="#2563eb"
      />

      {!error && (
        <footer className="plant-footer">
          <span>
            {t("plant.dataSource")} · {t("plant.lastUpdated")}: {formatReportingDate(today?.report_date, language, t)}
          </span>
          <span>
            {t("plant.timezone")}: {company?.timezone || t("plant.unavailable")}
          </span>
        </footer>
      )}
    </Box>
  );
}


export default Plant;
