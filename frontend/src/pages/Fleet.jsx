import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  FiActivity, FiArrowDownRight, FiArrowLeft, FiArrowRight, FiArrowUpRight,
  FiCalendar, FiCheck, FiClock, FiMinus, FiRefreshCw, FiShield, FiSlash,
  FiTarget, FiTrendingUp, FiTruck,
} from "react-icons/fi";

import FleetTrendChart from "../components/FleetTrendChart";
import ExecutiveActionDialog from "../components/executive/ExecutiveActionDialog";
import { getFleetTrend, getTodayFleet } from "../api/fleetApi";
import { createExecutiveAction, getExecutiveActions } from "../api/executiveActionsApi";
import { useLanguage } from "../context/LanguageContext";
import { useConfig } from "../context/ConfigContext";
import "./Plant.css";

const FLEET_RANGES = ["30D", "90D", "1Y", "3Y", "5Y"];

function getTone(value, target) {
  if (!Number.isFinite(target) || target <= 0) return "warning";
  const attainment = target > 0 ? (Number(value || 0) / target) * 100 : 0;
  if (attainment >= 100) return "positive";
  if (attainment >= 95) return "warning";
  return "negative";
}

function getStatus(value, target) {
  const attainment = target > 0 ? (Number(value || 0) / target) * 100 : 0;
  if (attainment >= 100) return "healthy";
  if (attainment >= 95) return "attentionRequired";
  return "critical";
}

function normalizeTargetName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((part) => ![
      "kpi",
      "target",
      "percentage",
      "percent",
      "pct",
    ].includes(part))
    .join(" ")
    .trim();
}

function findFleetTarget(kpiTargets, names) {
  const accepted = new Set(names.map(normalizeTargetName));
  const match = (Array.isArray(kpiTargets) ? kpiTargets : []).find((item) => {
    const candidates = [
      item?.kpi_name,
      item?.key,
      item?.name,
      item?.code,
    ]
      .map(normalizeTargetName)
      .filter(Boolean);
    const category = normalizeTargetName(item?.kpi_category || item?.category);
    const isFleetTarget = category === "fleet" ||
      candidates.some((candidate) => candidate.includes("fleet"));
    return isFleetTarget &&
      candidates.some((candidate) => accepted.has(candidate));
  });
  const value = Number(match?.target_value);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function toFiniteMetric(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function signedPercent(value) {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : ""}${number.toFixed(1)}%`;
}

function reportingDate(value, language, t) {
  if (!value) return t("fleet.unavailable");
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(language === "MN" ? "mn-MN" : "en-US", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function SummaryRow({ dotClass, label, value }) {
  return (
    <div className="plant-summary-row">
      <div className="plant-summary-row-label">
        <span className={`plant-summary-dot ${dotClass}`} /><span>{label}</span>
      </div>
      <div className="plant-summary-row-value"><strong>{value}</strong></div>
    </div>
  );
}

function periodValue(count, percent, aggregation, language, t) {
  const singular = count === 1;
  const unitKey = aggregation === "weekly"
    ? singular ? "week" : "weeks"
    : aggregation === "monthly"
      ? singular ? "month" : "months"
      : singular ? "day" : "days";
  const unit = language === "MN"
    ? t(`fleet.${aggregation === "weekly" ? "week" : aggregation === "monthly" ? "month" : "day"}`)
    : t(`fleet.${unitKey}`);
  return `${count} ${unit} (${percent.toFixed(0)}%)`;
}

function metricSummary(rows, key, target) {
  if (!Number.isFinite(target) || target <= 0) {
    return { total: 0, atOrAbove: 0, below: 0, percent: 0, average: null };
  }
  const values = rows
    .map((row) => row?.[key])
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(Number)
    .filter(Number.isFinite);
  const attainment = values.map((value) => (value / target) * 100);
  const atOrAbove = attainment.filter((value) => value >= 100).length;
  const total = attainment.length;
  return {
    total,
    atOrAbove,
    below: total - atOrAbove,
    percent: total ? (atOrAbove / total) * 100 : 0,
    average: total
      ? attainment.reduce((sum, value) => sum + value, 0) / total
      : null,
  };
}

function normalizeFleetTrend(rows) {
  if (!Array.isArray(rows)) return [];
  return [...rows].sort((left, right) => {
    const leftTime = new Date(left?.report_date).getTime();
    const rightTime = new Date(right?.report_date).getTime();
    if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return 0;
    return leftTime - rightTime;
  });
}

function getTrendAggregation(rows, selectedRange) {
  const aggregation = rows?.[0]?.aggregation;
  if (["daily", "weekly", "monthly"].includes(aggregation)) return aggregation;
  if (selectedRange === "1Y") return "weekly";
  if (selectedRange === "3Y" || selectedRange === "5Y") return "monthly";
  return "daily";
}

function summarizeFleet(rows, targets, aggregation) {
  const ordered = normalizeFleetTrend(rows);
  const performance = ordered
    .map((row) => row?.fleet_performance)
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(Number)
    .filter(Number.isFinite);
  const average = (values) => values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
  const comparisonSize = aggregation === "daily" ? 7 : aggregation === "weekly" ? 4 : 3;
  const recent = average(performance.slice(-comparisonSize));
  const previous = average(performance.slice(-comparisonSize * 2, -comparisonSize));
  const trend = recent !== null && previous > 0
    ? ((recent - previous) / previous) * 100
    : null;
  return {
    availability: metricSummary(ordered, "availability", targets.availability),
    utilization: metricSummary(ordered, "utilization", targets.utilization),
    trend,
    tone: trend === null ? "neutral" : trend > 0.25
      ? "positive" : trend < -0.25 ? "negative" : "neutral",
  };
}

function Fleet() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { company, mine, kpi_targets: kpiTargets } = useConfig();
  const initialTranslation = useRef(t);
  const [today, setToday] = useState(null);
  const [trend, setTrend] = useState([]);
  const [selectedRange, setSelectedRange] = useState("30D");
  const [selectedMetric, setSelectedMetric] = useState("availability");
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState("");
  const [trendError, setTrendError] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [current, history] = await Promise.all([
          getTodayFleet(), getFleetTrend("30D"),
        ]);
        setToday(current);
        setTrend(normalizeFleetTrend(history));
      } catch (requestError) {
        console.error("Fleet page load failed:", requestError);
        setError(requestError?.message || initialTranslation.current("fleet.unableToLoad"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadRange = useCallback(async (range) => {
    if (!FLEET_RANGES.includes(range)) return;
    setTrendLoading(true);
    setTrendError("");
    setTrend([]);
    try {
      const history = await getFleetTrend(range);
      setTrend(normalizeFleetTrend(history));
    } catch (requestError) {
      console.error("Fleet trend load failed:", requestError);
      setTrend([]);
      setTrendError(requestError?.message || t("fleet.unableToLoadTrend"));
    } finally {
      setTrendLoading(false);
    }
  }, [t]);

  const changeRange = useCallback(async (range) => {
    if (range === selectedRange || trendLoading) return;
    setSelectedRange(range);
    await loadRange(range);
  }, [loadRange, selectedRange, trendLoading]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [current, history] = await Promise.all([
        getTodayFleet(),
        getFleetTrend(selectedRange),
      ]);
      setToday(current);
      setTrend(normalizeFleetTrend(history));
    } catch (requestError) {
      console.error("Fleet refresh failed:", requestError);
      setError(requestError?.message || t("fleet.unableToLoad"));
    } finally {
      setLoading(false);
    }
  }, [selectedRange, t]);

  const profile = String(today?.operation_profile || "").trim().toLowerCase();
  const applicable = today?.fleet_applicable !== false && profile !== "sxew_copper";
  const targets = useMemo(() => {
    const availabilityTarget = findFleetTarget(kpiTargets, [
      "Fleet Availability",
      "Fleet Availability Target",
      "Availability",
    ]);
    const utilizationTarget = findFleetTarget(kpiTargets, [
      "Fleet Utilization",
      "Fleet Utilization Target",
      "Utilization",
    ]);
    const configuredPerformanceTarget = findFleetTarget(kpiTargets, [
      "Fleet Performance",
      "Fleet Performance Target",
      "Performance",
    ]);
    return {
      availability: availabilityTarget,
      utilization: utilizationTarget,
      performance: configuredPerformanceTarget ?? (
        availabilityTarget !== null && utilizationTarget !== null
          ? (availabilityTarget + utilizationTarget) / 2
          : null
      ),
    };
  }, [kpiTargets]);
  const targetsReady = targets.availability !== null &&
    targets.utilization !== null && targets.performance !== null;
  const availability = toFiniteMetric(today?.availability);
  const utilization = toFiniteMetric(today?.utilization);
  const reportedPerformance = toFiniteMetric(today?.fleet_performance);
  const performance = reportedPerformance ?? (
    availability !== null && utilization !== null
      ? (availability + utilization) / 2
      : null
  );
  const metricsReady = availability !== null &&
    utilization !== null && performance !== null;
  const availabilityGap = targetsReady && metricsReady
    ? availability - targets.availability : 0;
  const utilizationGap = targetsReady && metricsReady
    ? utilization - targets.utilization : 0;
  const performanceGap = targetsReady && metricsReady
    ? performance - targets.performance : 0;
  const overallTone = getTone(performance, targets.performance);
  const trendAggregation = getTrendAggregation(trend, selectedRange);
  const summary = useMemo(
    () => summarizeFleet(trend, targets, trendAggregation),
    [targets, trend, trendAggregation]
  );
  const priorityTone = availabilityGap < -10 || utilizationGap < -10
    ? "high" : availabilityGap < 0 || utilizationGap < 0 ? "medium" : "normal";

  const actions = useMemo(() => {
    const result = [];
    if (availabilityGap < 0) result.push({
      id: "availability_loss", canonical: "Investigate fleet availability losses",
      title: t("fleet.actionAvailabilityTitle"), text: t("fleet.actionAvailabilityText"),
      priorityValue: "High", priority: t("fleet.priorityHigh"), tone: "high",
    });
    if (utilizationGap < 0) result.push({
      id: "utilization_constraints", canonical: "Review fleet utilization constraints",
      title: t("fleet.actionUtilizationTitle"), text: t("fleet.actionUtilizationText"),
      priorityValue: utilizationGap < -10 ? "High" : "Medium",
      priority: utilizationGap < -10 ? t("fleet.priorityHigh") : t("fleet.priorityMedium"),
      tone: utilizationGap < -10 ? "high" : "medium",
    });
    result.push({
      id: "operating_constraints", canonical: "Verify fleet operating constraints",
      title: t("fleet.actionConstraintsTitle"), text: t("fleet.actionConstraintsText"),
      priorityValue: result.length ? "Medium" : "Low",
      priority: result.length ? t("fleet.priorityMedium") : t("fleet.priorityNormal"),
      tone: result.length ? "medium" : "normal",
    });
    if (result.length < 3) result.push({
      id: "stable_conditions", canonical: "Preserve stable fleet operating conditions",
      title: t("fleet.actionStabilityTitle"), text: t("fleet.actionStabilityText"),
      priorityValue: "Low", priority: t("fleet.priorityNormal"), tone: "normal",
    });
    return result.slice(0, 3);
  }, [availabilityGap, t, utilizationGap]);

  const actionKey = useCallback((item) =>
    ["fleet_ai", today?.report_date || "unknown_date", item?.id].join("_"),
  [today?.report_date]);

  const findRelatedAction = useCallback((item) => related.find((action) => {
    const key = String(action?.action_key || "");
    const title = String(action?.title || action?.action_title || "").trim();
    const isLegacyMatch = key.startsWith("manual_action_") &&
      title === item.canonical;
    return key === actionKey(item) || isLegacyMatch;
  }), [actionKey, related]);

  const loadRelated = useCallback(async () => {
    if (!today?.report_date) return;
    setRelatedLoading(true);
    setRelatedError("");
    try {
      const response = await getExecutiveActions({ skip: 0, limit: 100 });
      const all = Array.isArray(response)
        ? response : response?.items || response?.actions || response?.data || [];
      const prefix = `fleet_ai_${today.report_date}_`;
      const titles = new Set(actions.map((item) => item.canonical));
      setRelated(all.filter((item) => {
        const key = String(item?.action_key || "");
        return key.startsWith(prefix) || (
          key.startsWith("manual_action_") &&
          titles.has(String(item?.title || item?.action_title || "").trim())
        );
      }));
    } catch (requestError) {
      console.error("Unable to load related Fleet actions:", requestError);
      setRelated([]);
      setRelatedError(requestError?.message || t("fleet.relatedActionsLoadError"));
    } finally {
      setRelatedLoading(false);
    }
  }, [actions, t, today]);

  useEffect(() => {
    if (!today?.report_date) return undefined;
    const id = window.setTimeout(loadRelated, 0);
    return () => window.clearTimeout(id);
  }, [loadRelated, today?.report_date]);

  const actionStats = useMemo(() => {
    const status = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
    const count = (value) => related.filter((item) => status(item?.status) === value).length;
    const completed = count("completed");
    return {
      open: count("open"), inProgress: count("in_progress"), completed,
      blocked: count("blocked"), total: related.length,
      completion: related.length ? (completed / related.length) * 100 : 0,
    };
  }, [related]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setRecommendation(null);
  }, []);

  const saveAction = useCallback(async (payload) => {
    if (!recommendation) return;
    const key = actionKey(recommendation);
    if (findRelatedAction(recommendation)) {
      closeDialog();
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await createExecutiveAction({
        ...payload,
        action_key: key,
        kpi_key: "fleet",
        source: "AI",
        category: "Fleet",
      });
      await loadRelated();
      closeDialog();
    } catch (requestError) {
      if (requestError?.response?.status === 409) {
        await loadRelated();
        closeDialog();
        return;
      }
      console.error("Unable to create Fleet executive action:", requestError);
      setSaveError(requestError?.message || t("fleet.actionCreateError"));
    } finally {
      setSaving(false);
    }
  }, [actionKey, closeDialog, findRelatedAction, loadRelated, recommendation, t]);

  if (loading) return (
    <Box className="plant-loading"><Stack spacing={2} alignItems="center">
      <CircularProgress /><Typography>{t("fleet.loadingFleetIntelligence")}</Typography>
    </Stack></Box>
  );

  if (!error && !applicable) return (
    <Box className="plant-page">
      <header className="plant-page-header">
        <div className="plant-heading-copy">
          <Typography component="h1" className="plant-page-title">{t("fleet.analytics")}</Typography>
          <Typography className="plant-page-context">{t("fleet.notPartOfKpiModel")}</Typography>
        </div>
        <button type="button" className="plant-refresh-button" onClick={refresh}><FiRefreshCw /></button>
      </header>
      <Alert severity="info" sx={{ mt: 2 }}>
        {today?.mine_name || mine?.mine_name || t("fleet.unavailable")} · {today?.company_name || company?.company_name || t("fleet.unavailable")} — {today?.not_applicable_reason || t("fleet.noDatasetConfigured")}
      </Alert>
    </Box>
  );

  const renderMetric = (metric) => <>
    <SummaryRow dotClass="plant-summary-dot--positive" label={t(`fleet.${metric.atOrAboveLabel}`)}
      value={periodValue(metric.atOrAbove, metric.percent, trendAggregation, language, t)} />
    <SummaryRow dotClass="plant-summary-dot--negative" label={t(`fleet.${metric.belowLabel}`)}
      value={periodValue(metric.below, 100 - metric.percent, trendAggregation, language, t)} />
    <SummaryRow dotClass="plant-summary-dot--neutral" label={t("fleet.averageAttainment")}
      value={metric.average === null ? "—" : `${metric.average.toFixed(1)}%`} />
  </>;

  const draft = recommendation ? {
    action_title: recommendation.title, description: recommendation.text,
    priority: recommendation.priorityValue, status: "Open", category: "Fleet",
    source: "AI", owner_name: "", due_date: "",
  } : null;
  const trendLabel = summary.tone === "positive" ? t("fleet.improving")
    : summary.tone === "negative" ? t("fleet.declining") : t("fleet.stable");
  const summaryKey = {
    "30D": "thirtyDaySummary", "90D": "ninetyDaySummary", "1Y": "oneYearSummary",
    "3Y": "threeYearSummary", "5Y": "fiveYearSummary",
  }[selectedRange];
  const chartKey = {
    "30D": "chartActualAgainstTarget", "90D": "chartActualAgainstTarget90",
    "1Y": "chartActualAgainstTarget1Y", "3Y": "chartActualAgainstTarget3Y",
    "5Y": "chartActualAgainstTarget5Y",
  }[selectedRange];
  const atOrAboveKey = trendAggregation === "weekly" ? "weeksAtOrAboveTarget"
    : trendAggregation === "monthly" ? "monthsAtOrAboveTarget" : "daysAtOrAboveTarget";
  const belowKey = trendAggregation === "weekly" ? "weeksBelowTarget"
    : trendAggregation === "monthly" ? "monthsBelowTarget" : "daysBelowTarget";
  const trendTitleKey = trendAggregation === "weekly" ? "lastFourWeekTrend"
    : trendAggregation === "monthly" ? "lastThreeMonthTrend" : "lastSevenDayTrend";
  const trendComparisonKey = trendAggregation === "weekly" ? "comparedPreviousFourWeeks"
    : trendAggregation === "monthly" ? "comparedPreviousThreeMonths" : "comparedPreviousSevenDays";
  const hasSummaryData = summary.availability.total > 0 || summary.utilization.total > 0;

  return (
    <Box className="plant-page">
      <Box className="plant-page-header">
        <Box className="plant-heading-copy">
          <Typography component="h1" className="plant-page-title">{t("fleet.title")}</Typography>
          <Typography className="plant-page-context">{today?.mine_name || mine?.mine_name || t("fleet.unavailable")}</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" className="plant-header-controls">
          <button type="button" className="plant-back-button" onClick={() => navigate("/")} aria-label={t("fleet.backToDashboard")}><FiArrowLeft /><span>{t("fleet.backToDashboard")}</span></button>
          <Box className="plant-reporting-date"><FiCalendar /><Box><span className="plant-reporting-date-label">{t("fleet.reportingDate")}</span><strong>{reportingDate(today?.report_date, language, t)}</strong></Box></Box>
          <button type="button" className="plant-refresh-button" onClick={refresh} title={t("fleet.refreshFleet")} aria-label={t("fleet.refreshFleet")}><FiRefreshCw /></button>
        </Stack>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {!error && today?.data_status === "No Data" && <Alert severity="info">{t("fleet.noDatasetAvailable")}</Alert>}
      {!error && today?.data_status !== "No Data" && !targetsReady && <Alert severity="warning">{t("fleet.targetsUnavailable")}</Alert>}
      {!error && today?.data_status !== "No Data" && targetsReady && !metricsReady && <Alert severity="warning">{t("fleet.metricsUnavailable")}</Alert>}
      {!error && today?.data_status !== "No Data" && targetsReady && metricsReady && <>
        <section className={`plant-kpi-overview plant-kpi-overview--${overallTone}`}>
          {[
            [FiTruck, t("fleet.fleetOperatingStatus"), t(`fleet.${getStatus(performance, targets.performance)}`), `${performance.toFixed(1)}% ${t("fleet.combinedPerformance")}`, overallTone],
            [FiActivity, t("fleet.availability"), `${availability.toFixed(1)}%`, `${signedPercent(availabilityGap)} ${t("fleet.vsTarget")}`, getTone(availability, targets.availability)],
            [FiTarget, t("fleet.utilization"), `${utilization.toFixed(1)}%`, `${signedPercent(utilizationGap)} ${t("fleet.vsTarget")}`, getTone(utilization, targets.utilization)],
            [FiTrendingUp, t("fleet.fleetPerformance"), `${performance.toFixed(1)}%`, `${signedPercent(performanceGap)} ${t("fleet.vsTarget")}`, overallTone],
            [FiCheck, t("fleet.aiConfidence"), trend.length ? t("fleet.aiConfidenceHigh") : t("fleet.aiConfidenceModerate"), t("fleet.aiConfidenceSupporting"), "positive"],
          ].map(([Icon, label, value, detail, tone], index) => (
            <div key={label} className={`plant-kpi-cell ${index === 0 ? "plant-kpi-cell--status" : ""} ${index === 4 ? "plant-kpi-cell--confidence" : ""}`}>
              <div className={`plant-kpi-icon plant-kpi-icon--${tone}`}><Icon /></div><div className="plant-kpi-content">
                <span className="plant-kpi-label">{label}</span><div className={`plant-kpi-value plant-kpi-value--${tone}`}>{value}</div>
                <div className="plant-kpi-supporting">{detail}</div></div>
            </div>
          ))}
        </section>
        <section className="plant-trend-layout">
          <div className="plant-trend-card">{trendError && <Alert severity="error">{trendError}</Alert>}
            <div className="plant-trend-chart">{trendLoading ? <Box className="plant-trend-loading"><CircularProgress /></Box> :
              <FleetTrendChart data={trend} targets={targets} aggregation={trendAggregation}
                mode={selectedMetric} onModeChange={setSelectedMetric} periodDescription={t(`fleet.${chartKey}`)}
                headerActions={<Box role="group" aria-label={t("fleet.trendRange")} className="plant-range-control">
                  {FLEET_RANGES.map((range) => <button key={range} type="button" onClick={() => changeRange(range)}
                    aria-pressed={selectedRange === range} className={selectedRange === range ? "is-active" : ""}>{range}</button>)}
                </Box>} />}</div>
          </div>
          <aside className="plant-summary-card">
            <div className="plant-summary-title">{t(`fleet.${summaryKey}`)}</div>
            {!hasSummaryData ? <Alert severity="info">{t("fleet.noHistoricalData")}</Alert> : <>
            <div className="plant-summary-section-label">{t("fleet.availability")}</div><div>{renderMetric({ ...summary.availability, atOrAboveLabel: atOrAboveKey, belowLabel: belowKey })}</div>
            <div className="plant-summary-divider" /><div className="plant-summary-section-label">{t("fleet.utilization")}</div><div>{renderMetric({ ...summary.utilization, atOrAboveLabel: atOrAboveKey, belowLabel: belowKey })}</div>
            <div className={`plant-recent-status plant-recent-status--${summary.tone}`}><div className="plant-recent-status-eyebrow">{t(`fleet.${trendTitleKey}`)}</div>
              <div className="plant-recent-status-body"><div className="plant-recent-status-icon">{summary.tone === "positive" ? <FiArrowUpRight /> : summary.tone === "negative" ? <FiArrowDownRight /> : <FiMinus />}</div>
                <div><strong>{trendLabel}</strong><span>{summary.trend === null ? "—" : signedPercent(summary.trend)}</span><p>{t(`fleet.${trendComparisonKey}`)}</p></div></div>
            </div>
            </>}
          </aside>
        </section>
        <section className="plant-ai-layout">
          <article className="plant-ai-insight-card"><div className="plant-ai-card-header"><div className="plant-ai-card-heading"><div className="plant-ai-heading-icon plant-ai-heading-icon--blue"><FiActivity /></div><div><h2>{t("fleet.aiExecutiveInsight")}</h2><p>{t("fleet.aiInsightDescription")}</p></div></div>
            <span className={`plant-ai-priority-badge plant-ai-priority-badge--${priorityTone}`}>{t("fleet.priorityLabel")}: {t(`fleet.aiPriority.${priorityTone}`)}</span></div>
            <div className="plant-ai-insight-grid">{[
              ["whatsHappening", FiActivity, performance < targets.performance ? `${t("fleet.aiHappeningBelow")} ${performance.toFixed(1)}%.` : `${t("fleet.aiHappeningOnTarget")} ${performance.toFixed(1)}%.`],
              ["whyItMatters", FiShield, t(performance < targets.performance ? "fleet.aiWhyBelow" : "fleet.aiWhyOnTarget")],
              ["likelyContributors", FiTarget, t(availabilityGap < 0 ? "fleet.aiContributorAvailability" : utilizationGap < 0 ? "fleet.aiContributorUtilization" : "fleet.aiContributorConstraints")],
              ["managementPriority", FiCheck, t(availabilityGap < 0 || utilizationGap < 0 ? "fleet.aiManagementPriorityRecovery" : "fleet.aiManagementPriorityMaintain")],
            ].map(([key, Icon, copy]) => <div key={key} className="plant-ai-insight-item"><div className="plant-ai-insight-label"><Icon /><span>{t(`fleet.${key}`)}</span></div><p>{copy}</p></div>)}</div>
            <div className="plant-ai-priority-callout"><div className="plant-ai-priority-callout-icon"><FiTarget /></div><div><span>{t("fleet.recommendedManagementPriority")}</span><strong>{t(availabilityGap < 0 || utilizationGap < 0 ? "fleet.aiManagementPriorityRecovery" : "fleet.aiManagementPriorityMaintain")}</strong></div></div>
          </article>
          <aside className="plant-ai-actions-card"><div className="plant-ai-card-header"><div className="plant-ai-card-heading"><div className="plant-ai-heading-icon plant-ai-heading-icon--green"><FiCheck /></div><div><h2>{t("fleet.aiRecommendedActions")}</h2><p>{t("fleet.aiActionsDescription")}</p></div></div><span className="plant-ai-action-count">{actions.length} {t("fleet.actionsCountLabel")}</span></div>
            <div className="plant-ai-action-list">{actions.map((item, index) => { const existing = findRelatedAction(item); return <div key={item.id} className="plant-ai-action-row">
              <div className="plant-ai-action-number">{index + 1}</div><div className="plant-ai-action-icon">{index === 0 ? <FiActivity /> : index === 1 ? <FiTarget /> : <FiCheck />}</div><p title={item.title}>{item.text}</p><span className={`plant-ai-action-priority plant-ai-action-priority--${item.tone}`}>{item.priority}</span><Box className="plant-ai-action-control">
              {existing ? <Button size="small" onClick={() => navigate(`/executive-actions?action_id=${encodeURIComponent(existing.id || existing.action_id)}`)}>{t("fleet.viewAction")}</Button> : <Button size="small" startIcon={<AddIcon />} onClick={() => { setRecommendation(item); setDialogOpen(true); }}>{t("fleet.createAction")}</Button>}</Box>
            </div>; })}</div>
          </aside>
        </section>
        <section className="plant-related-actions-card"><div className="plant-related-actions-header"><div className="plant-related-actions-heading"><div className="plant-related-actions-heading-icon"><FiCheck /></div><div><h2>{t("fleet.relatedExecutiveActions")}</h2><p>{t("fleet.relatedActionsDescription")}</p></div></div><Link to="/executive-actions" className="plant-related-actions-link">{t("fleet.openActionCenter")} <FiArrowRight /></Link></div>
          {relatedLoading ? <Box className="plant-related-actions-state"><CircularProgress /></Box> : relatedError ? <Alert severity="error">{relatedError}</Alert> : <><div className="plant-related-actions-grid">{[
            ["open", "actionStatusOpen", actionStats.open, "notStarted", FiClock], ["progress", "actionStatusInProgress", actionStats.inProgress, "beingExecuted", FiActivity], ["completed", "actionStatusCompleted", actionStats.completed, "successfullyClosed", FiCheck], ["blocked", "actionStatusBlocked", actionStats.blocked, "requiresIntervention", FiSlash], ["completion", "completion", `${actionStats.completion.toFixed(0)}%`, "overallCompletion", FiTrendingUp],
          ].map(([tone, label, value, support, Icon]) => <div key={tone} className="plant-related-action-metric"><div className={`plant-related-action-icon plant-related-action-icon--${tone}`}><Icon /></div><div><span>{t(`fleet.${label}`)}</span><strong>{value}</strong><small>{t(`fleet.${support}`)}</small></div></div>)}</div>
            <div className="plant-related-actions-progress"><div className="plant-related-actions-progress-copy"><div><span>{t("fleet.executiveActionCompletion")}</span><small>{actionStats.completed} / {actionStats.total} {t("fleet.actionsCompleted")}</small></div><strong>{actionStats.completion.toFixed(0)}%</strong></div><div className="plant-related-actions-progress-track"><span style={{ width: `${actionStats.completion}%` }} /></div></div></>}
        </section>
        {saveError && <Alert severity="error">{saveError}</Alert>}
        <ExecutiveActionDialog open={dialogOpen} action={draft} onClose={closeDialog} onSave={saveAction} saving={saving} primaryColor="#2563eb" />
      </>}
    </Box>
  );
}

export default Fleet;
