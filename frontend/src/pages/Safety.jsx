import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowDownRight,
  FiArrowLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiShield,
  FiSlash,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";

import { createExecutiveAction, getExecutiveActions } from "../api/executiveActionsApi";
import { getSafetyTrend, getTodaySafety } from "../api/safetyApi";
import SafetyTrendChart from "../components/SafetyTrendChart";
import ExecutiveActionDialog from "../components/executive/ExecutiveActionDialog";
import { useLanguage } from "../context/LanguageContext";
import "./Plant.css";

const SAFETY_SCORE_TARGET = 95;
const SAFETY_RANGES = ["30D", "90D", "1Y", "3Y", "5Y"];

function toFiniteMetric(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function translate(t, key, fallback) {
  try {
    const translated = t(key);
    return translated && translated !== key ? translated : fallback;
  } catch {
    return fallback;
  }
}

function formatTranslation(t, key, values) {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    t(key)
  );
}

function formatDate(dateValue, language, t) {
  if (!dateValue) return t("safety.unavailable");
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString(language === "MN" ? "mn-MN" : "en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function normalizeTrend(rows) {
  if (!Array.isArray(rows)) return [];
  return [...rows].sort((left, right) => {
    const leftTime = new Date(left?.report_date).getTime();
    const rightTime = new Date(right?.report_date).getTime();
    if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return 0;
    return leftTime - rightTime;
  });
}

function getTrendScore(item) {
  return toFiniteMetric(
    item?.safety_score ?? item?.score ?? item?.safetyScore ?? item?.value
  );
}

function getSafetyStatus({ safetyScore, incidents, criticalRisks, t }) {
  if (incidents > 0 || criticalRisks > 0) {
    return {
      label: translate(t, "safety.attentionRequired", "Attention Required"),
      description: translate(
        t,
        "safety.statusDescriptionAttention",
        "A recordable incident or critical risk requires management attention."
      ),
    };
  }
  if (safetyScore >= SAFETY_SCORE_TARGET) {
    return {
      label: translate(t, "safety.controlled", "Controlled"),
      description: translate(
        t,
        "safety.statusDescriptionControlled",
        "Safety performance is at or above target."
      ),
    };
  }
  return {
    label: translate(t, "safety.monitor", "Monitor"),
    description: translate(
      t,
      "safety.statusDescriptionMonitor",
      "Safety performance is below target and should be monitored."
    ),
  };
}

function SummaryRow({ dotClass, label, value }) {
  return (
    <div className="plant-summary-row">
      <div className="plant-summary-row-label">
        <span className={`plant-summary-dot ${dotClass}`} />
        <span>{label}</span>
      </div>
      <div className="plant-summary-row-value"><strong>{value}</strong></div>
    </div>
  );
}

function periodSummaryValue(count, total, t) {
  const percent = total ? (count / total) * 100 : 0;
  return formatTranslation(
    t,
    count === 1 ? "safety.periodValueSingular" : "safety.periodValue",
    { count, percent: percent.toFixed(0) }
  );
}

function normalizeActionStatus(value) {
  const status = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["to_do", "todo", "not_started"].includes(status)) return "open";
  if (["done", "closed"].includes(status)) return "completed";
  return status || "open";
}

function Safety() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [today, setToday] = useState(null);
  const [trend, setTrend] = useState([]);
  const [selectedRange, setSelectedRange] = useState(SAFETY_RANGES[0]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [actionSaveError, setActionSaveError] = useState("");
  const [relatedActions, setRelatedActions] = useState([]);
  const [relatedActionsLoading, setRelatedActionsLoading] = useState(false);
  const [relatedActionsError, setRelatedActionsError] = useState("");

  const loadSafety = useCallback(async (range = SAFETY_RANGES[0]) => {
    setLoading(true);
    setError("");
    setTrendError("");
    try {
      const [todayData, trendData] = await Promise.all([
        getTodaySafety(),
        getSafetyTrend(range),
      ]);
      setToday(todayData);
      setTrend(normalizeTrend(
        Array.isArray(trendData) ? trendData : trendData?.data || trendData?.items || []
      ));
    } catch (requestError) {
      console.error("Safety page load failed:", requestError);
      setError(requestError?.message || translate(t, "safety.unableToLoad", "Unable to load safety data."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadTrendRange = useCallback(async (range) => {
    if (!SAFETY_RANGES.includes(range)) return;
    setTrendLoading(true);
    setTrendError("");
    setTrend([]);
    try {
      setTrend(normalizeTrend(await getSafetyTrend(range)));
    } catch (requestError) {
      console.error("Safety trend load failed:", requestError);
      setTrend([]);
      setTrendError(requestError?.message || t("safety.unableToLoadTrend"));
    } finally {
      setTrendLoading(false);
    }
  }, [t]);

  const handleRangeChange = useCallback(async (range) => {
    if ((range === selectedRange && !trendError) || trendLoading) return;
    setSelectedRange(range);
    await loadTrendRange(range);
  }, [loadTrendRange, selectedRange, trendError, trendLoading]);

  const handleRefresh = useCallback(() => {
    loadSafety(selectedRange);
  }, [loadSafety, selectedRange]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => loadSafety(SAFETY_RANGES[0]), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSafety]);

  const safetyScoreMetric = toFiniteMetric(today?.safety_score);
  const incidentsMetric = toFiniteMetric(today?.incidents);
  const nearMissesMetric = toFiniteMetric(today?.near_misses);
  const criticalRisksMetric = toFiniteMetric(today?.critical_risks);
  const metricsReady = [
    safetyScoreMetric,
    incidentsMetric,
    nearMissesMetric,
    criticalRisksMetric,
  ].every((value) => value !== null);
  const safetyScore = safetyScoreMetric ?? 0;
  const incidents = incidentsMetric ?? 0;
  const nearMisses = nearMissesMetric ?? 0;
  const criticalRisks = criticalRisksMetric ?? 0;

  const status = useMemo(
    () => getSafetyStatus({ safetyScore, incidents, criticalRisks, t }),
    [criticalRisks, incidents, safetyScore, t]
  );

  const trendAggregation = trend?.[0]?.aggregation || (
    selectedRange === "1Y" ? "weekly" :
      selectedRange === "3Y" || selectedRange === "5Y" ? "monthly" : "daily"
  );

  const trendSummary = useMemo(() => {
    const values = trend.map(getTrendScore).filter((value) => value !== null);
    if (!values.length) {
      return {
        atOrAboveTarget: 0,
        belowTarget: 0,
        total: 0,
        average: null,
        highest: null,
        lowest: null,
        recentChange: null,
        improving: null,
      };
    }
    const atOrAboveTarget = values.filter((value) => value >= SAFETY_SCORE_TARGET).length;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const comparisonSize = trendAggregation === "daily" ? 7 : trendAggregation === "weekly" ? 4 : 3;
    const averageOf = (items) => items.length
      ? items.reduce((sum, value) => sum + value, 0) / items.length
      : null;
    const latestAverage = averageOf(values.slice(-comparisonSize));
    const previousAverage = averageOf(values.slice(-comparisonSize * 2, -comparisonSize));
    const recentChange = latestAverage !== null && previousAverage !== null
      ? latestAverage - previousAverage
      : null;
    return {
      atOrAboveTarget,
      belowTarget: values.length - atOrAboveTarget,
      total: values.length,
      average,
      highest: Math.max(...values),
      lowest: Math.min(...values),
      recentChange,
      improving: recentChange === null ? null : recentChange >= 0,
    };
  }, [trend, trendAggregation]);

  const summaryKeyByRange = {
    "30D": "thirtyDaySummary",
    "90D": "ninetyDaySummary",
    "1Y": "oneYearSummary",
    "3Y": "threeYearSummary",
    "5Y": "fiveYearSummary",
  };
  const chartKeyByRange = {
    "30D": "chartActualAgainstTarget30D",
    "90D": "chartActualAgainstTarget90D",
    "1Y": "chartActualAgainstTarget1Y",
    "3Y": "chartActualAgainstTarget3Y",
    "5Y": "chartActualAgainstTarget5Y",
  };
  const recentTrendTone = trendSummary.improving === null
    ? "neutral" : trendSummary.improving ? "positive" : "negative";
  const recentTrendCopy = trendAggregation === "daily"
    ? { title: t("safety.lastSevenDayTrend"), description: t("safety.previousSevenDaysComparison") }
    : trendAggregation === "weekly"
      ? { title: t("safety.lastFourWeekTrend"), description: t("safety.previousFourWeeksComparison") }
      : { title: t("safety.lastThreeMonthTrend"), description: t("safety.previousThreeMonthsComparison") };

  const safetyRecommendedActions = useMemo(() => [
    {
      id: "critical_risk_review",
      canonicalTitle: "Review outstanding critical risk",
      title: t("safety.reviewCriticalRisk"),
      description: t("safety.reviewCriticalRiskDescription"),
      priorityValue: "High",
      priority: t("safety.highPriority"),
      tone: "high",
      icon: <FiAlertTriangle />,
    },
    {
      id: "near_miss_pattern",
      canonicalTitle: "Investigate near-miss pattern",
      title: t("safety.investigateNearMiss"),
      description: t("safety.investigateNearMissDescription"),
      priorityValue: "Medium",
      priority: t("safety.mediumPriority"),
      tone: "medium",
      icon: <FiActivity />,
    },
    {
      id: "critical_control_verification",
      canonicalTitle: "Verify critical controls",
      title: t("safety.verifyCriticalControls"),
      description: t("safety.verifyCriticalControlsDescription"),
      priorityValue: "Low",
      priority: t("safety.verification"),
      tone: "normal",
      icon: <FiCheckCircle />,
    },
  ], [t]);

  const safetyInsight = useMemo(() => ({
    happening: status.description,
    why: criticalRisks > 0
      ? t("safety.aiWhyCriticalRisk")
      : incidents > 0
        ? t("safety.aiWhyIncident")
        : safetyScore < SAFETY_SCORE_TARGET
          ? t("safety.aiWhyBelowTarget")
          : t("safety.aiWhyControlled"),
    contributors: [
      ...(criticalRisks > 0 ? [t("safety.criticalRisks")] : []),
      ...(incidents > 0 ? [t("safety.recordableIncidents")] : []),
      ...(nearMisses > 0 ? [t("safety.nearMisses")] : []),
      ...(safetyScore < SAFETY_SCORE_TARGET ? [t("safety.safetyScore")] : []),
    ],
    priority: criticalRisks > 0
      ? t("safety.reviewCriticalRisk")
      : nearMisses > 0 || incidents > 0
        ? t("safety.investigateNearMiss")
        : t("safety.verifyCriticalControls"),
  }), [criticalRisks, incidents, nearMisses, safetyScore, status.description, t]);

  const buildActionKey = useCallback((recommendation) => [
    "safety_ai",
    today?.report_date || "unknown_date",
    recommendation?.id || "recommendation",
  ].join("_"), [today?.report_date]);

  const isSafetyAction = useCallback((action) => {
    const actionKey = String(action?.action_key || "").trim().toLowerCase();
    const kpiKey = String(action?.kpi_key || "").trim().toLowerCase();
    const title = String(action?.title || action?.action_title || "").trim();
    const recognizedTitles = new Set(
      safetyRecommendedActions.flatMap((item) => [item.canonicalTitle, item.title])
    );
    return kpiKey === "safety" || actionKey.startsWith("safety_ai_") || (
      actionKey.startsWith("manual_action_") && recognizedTitles.has(title)
    );
  }, [safetyRecommendedActions]);

  const findRelatedAction = useCallback((recommendation) => {
    const expectedKey = buildActionKey(recommendation);
    const recognizedTitles = new Set([recommendation?.canonicalTitle, recommendation?.title]);
    return relatedActions.find((action) => {
      const actionKey = String(action?.action_key || "").trim().toLowerCase();
      const title = String(action?.title || action?.action_title || "").trim();
      return actionKey === expectedKey || (isSafetyAction(action) && recognizedTitles.has(title));
    });
  }, [buildActionKey, isSafetyAction, relatedActions]);

  const loadRelatedActions = useCallback(async () => {
    if (!today?.report_date) return;
    setRelatedActionsLoading(true);
    setRelatedActionsError("");
    try {
      const response = await getExecutiveActions({ skip: 0, limit: 100 });
      const allActions = Array.isArray(response)
        ? response
        : response?.items || response?.actions || response?.data || [];
      setRelatedActions(allActions.filter(isSafetyAction));
    } catch (requestError) {
      console.error("Unable to load related Safety actions:", requestError);
      setRelatedActions([]);
      setRelatedActionsError(
        requestError?.userMessage ||
        requestError?.response?.data?.detail ||
        requestError?.message ||
        t("safety.relatedActionsLoadError")
      );
    } finally {
      setRelatedActionsLoading(false);
    }
  }, [isSafetyAction, t, today?.report_date]);

  useEffect(() => {
    if (!today?.report_date) return undefined;
    const timeoutId = window.setTimeout(loadRelatedActions, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRelatedActions, today?.report_date]);

  const relatedActionSummary = useMemo(() => {
    const count = (status) => relatedActions.filter(
      (action) => normalizeActionStatus(action?.status) === status
    ).length;
    const total = relatedActions.length;
    const completed = count("completed");
    return {
      open: count("open"),
      inProgress: count("in_progress"),
      completed,
      blocked: count("blocked"),
      total,
      completion: total ? (completed / total) * 100 : 0,
    };
  }, [relatedActions]);

  const selectedActionDraft = useMemo(() => selectedRecommendation ? {
    action_title: selectedRecommendation.title,
    description: selectedRecommendation.description,
    priority: selectedRecommendation.priorityValue,
    status: "Open",
    category: "Safety",
    source: "AI",
    owner_name: "",
    due_date: "",
  } : null, [selectedRecommendation]);

  const handleCreateAction = useCallback((recommendation) => {
    setActionSaveError("");
    setSelectedRecommendation(recommendation);
    setActionDialogOpen(true);
  }, []);

  const handleCloseActionDialog = useCallback(() => {
    setActionDialogOpen(false);
    setSelectedRecommendation(null);
  }, []);

  const handleViewAction = useCallback((action) => {
    const actionId = action?.id || action?.action_id;
    navigate(actionId
      ? `/executive-actions?action_id=${encodeURIComponent(actionId)}`
      : "/executive-actions");
  }, [navigate]);

  const handleSaveAction = useCallback(async (payload) => {
    if (!selectedRecommendation) return;
    if (findRelatedAction(selectedRecommendation)) {
      handleCloseActionDialog();
      await loadRelatedActions();
      return;
    }
    setSavingAction(true);
    setActionSaveError("");
    try {
      await createExecutiveAction({
        ...payload,
        action_key: buildActionKey(selectedRecommendation),
        kpi_key: "safety",
        source: "AI",
        category: "Safety",
      });
      await loadRelatedActions();
      handleCloseActionDialog();
    } catch (requestError) {
      if (requestError?.response?.status === 409) {
        await loadRelatedActions();
        handleCloseActionDialog();
        return;
      }
      console.error("Unable to create Safety executive action:", requestError);
      setActionSaveError(
        requestError?.response?.data?.detail ||
        requestError?.message ||
        t("safety.actionCreateError")
      );
    } finally {
      setSavingAction(false);
    }
  }, [
    buildActionKey,
    findRelatedAction,
    handleCloseActionDialog,
    loadRelatedActions,
    selectedRecommendation,
    t,
  ]);

  if (loading) {
    return (
      <Box className="plant-loading">
        <Stack alignItems="center" spacing={1.5}>
          <CircularProgress size={32} />
          <Typography sx={{ color: "#64748b", fontSize: 11, fontWeight: 600 }}>
            {t("safety.loadingPerformance")}
          </Typography>
        </Stack>
      </Box>
    );
  }

  const statusTone = criticalRisks > 0 || incidents > 0
    ? "negative" : safetyScore >= SAFETY_SCORE_TARGET ? "positive" : "warning";

  return (
    <Box className="plant-page">
      <header className="plant-page-header">
        <Box className="plant-heading-copy">
          <Typography component="h1" className="plant-page-title">
            {translate(t, "safety.safetyPerformance", "Safety Performance")}
          </Typography>
          <Typography className="plant-page-context">{t("safety.pageDescription")}</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" className="plant-header-controls">
          <button
            type="button"
            className="plant-back-button"
            onClick={() => navigate("/")}
            aria-label={t("safety.backToDashboard")}
          >
            <FiArrowLeft /><span>{t("safety.backToDashboard")}</span>
          </button>
          <Box className="plant-reporting-date">
            <FiCalendar />
            <div>
              <span className="plant-reporting-date-label">{t("safety.reportingDate")}</span>
              <strong>{formatDate(today?.report_date, language, t)}</strong>
            </div>
          </Box>
          <button
            type="button"
            className="plant-refresh-button"
            onClick={handleRefresh}
            aria-label={t("safety.refreshSafetyData")}
          >
            <FiRefreshCw />
          </button>
        </Stack>
      </header>

      {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{error}</Alert>}
      {!error && today?.data_status === "No Data" && (
        <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>{t("safety.noDatasetAvailable")}</Alert>
      )}
      {!error && today?.data_status !== "No Data" && !metricsReady && (
        <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>{t("safety.metricsUnavailable")}</Alert>
      )}

      {!error && metricsReady && (
        <>
          <section className={`plant-kpi-overview plant-kpi-overview--${statusTone}`}>
            {[
              {
                label: t("safety.safetyOperatingStatus"), value: status.label,
                supporting: status.description,
                icon: criticalRisks > 0 ? <FiAlertTriangle /> : <FiShield />,
                tone: statusTone, status: true,
              },
              {
                label: t("safety.safetyScore"), value: `${safetyScore.toFixed(1)}%`,
                supporting: formatTranslation(t, "safety.targetValue", { value: SAFETY_SCORE_TARGET }),
                icon: <FiTarget />, tone: safetyScore >= SAFETY_SCORE_TARGET ? "positive" : "warning",
              },
              {
                label: t("safety.incidents"), value: incidents,
                supporting: incidents === 0 ? t("safety.noRecordableIncidents") : t("safety.managementReviewRequired"),
                icon: incidents === 0 ? <FiCheckCircle /> : <FiAlertTriangle />,
                tone: incidents === 0 ? "positive" : "negative",
              },
              {
                label: t("safety.nearMisses"), value: nearMisses,
                supporting: nearMisses === 0 ? t("safety.noNearMissesReported") : t("safety.reviewAndLearn"),
                icon: <FiActivity />, tone: nearMisses === 0 ? "positive" : "warning",
              },
              {
                label: t("safety.criticalRisks"), value: criticalRisks,
                supporting: criticalRisks === 0 ? t("safety.noOpenCriticalRisks") : t("safety.immediateAttentionRequired"),
                icon: criticalRisks === 0 ? <FiShield /> : <FiAlertTriangle />,
                tone: criticalRisks === 0 ? "positive" : "negative",
              },
            ].map((item) => (
              <div key={item.label} className={`plant-kpi-cell${item.status ? " plant-kpi-cell--status" : ""}`}>
                <div className={`plant-kpi-icon plant-kpi-icon--${item.tone}`}>{item.icon}</div>
                <div className="plant-kpi-content">
                  <div className="plant-kpi-label">{item.label}</div>
                  <div className={`plant-kpi-value plant-kpi-value--${item.tone}`}>{item.value}</div>
                  <div className="plant-kpi-supporting">{item.supporting}</div>
                </div>
              </div>
            ))}
          </section>

          <section className="plant-trend-layout">
            <div className="plant-trend-card">
              {trendError && <Alert severity="error" sx={{ mx: 1.5, mt: 1 }}>{trendError}</Alert>}
              <div className="plant-trend-chart">
                <SafetyTrendChart
                  data={trend}
                  safetyScoreTarget={SAFETY_SCORE_TARGET}
                  aggregation={trendAggregation}
                  periodDescription={t(`safety.${chartKeyByRange[selectedRange]}`)}
                  loading={trendLoading}
                  headerActions={(
                    <Box role="group" aria-label={t("safety.trendRange")} className="plant-range-control">
                      {SAFETY_RANGES.map((range) => (
                        <button
                          key={range}
                          type="button"
                          disabled={trendLoading}
                          aria-pressed={selectedRange === range}
                          onClick={() => handleRangeChange(range)}
                          className={selectedRange === range ? "is-active" : ""}
                        >
                          {range}
                        </button>
                      ))}
                    </Box>
                  )}
                  t={t}
                />
              </div>
            </div>

            <aside className="plant-summary-card">
              <div className="plant-summary-title">{t(`safety.${summaryKeyByRange[selectedRange]}`)}</div>
              <div className="plant-summary-section-label">{t("safety.safetyScore")}</div>
              <div className="plant-summary-primary">
                <SummaryRow
                  dotClass="plant-summary-dot--positive"
                  label={t("safety.periodsAtOrAboveTarget")}
                  value={periodSummaryValue(trendSummary.atOrAboveTarget, trendSummary.total, t)}
                />
                <SummaryRow
                  dotClass="plant-summary-dot--negative"
                  label={t("safety.periodsBelowTarget")}
                  value={periodSummaryValue(trendSummary.belowTarget, trendSummary.total, t)}
                />
                <SummaryRow
                  dotClass="plant-summary-dot--neutral"
                  label={t("safety.averageSafetyScore")}
                  value={trendSummary.average === null ? "—" : `${trendSummary.average.toFixed(1)}%`}
                />
              </div>

              <div className="plant-summary-divider" />
              <div className="plant-summary-section-label">{t("safety.rangeSection")}</div>
              <div className="plant-summary-primary">
                <SummaryRow
                  dotClass="plant-summary-dot--neutral"
                  label={t("safety.highestScore")}
                  value={trendSummary.highest === null ? "—" : `${trendSummary.highest.toFixed(1)}%`}
                />
                <SummaryRow
                  dotClass="plant-summary-dot--neutral"
                  label={t("safety.lowestScore")}
                  value={trendSummary.lowest === null ? "—" : `${trendSummary.lowest.toFixed(1)}%`}
                />
              </div>

              <div className="plant-summary-divider" />
              <div className={`plant-recent-status plant-recent-status--${recentTrendTone}`}>
                <div className="plant-recent-status-eyebrow">{recentTrendCopy.title}</div>
                <div className="plant-recent-status-body">
                  <div className="plant-recent-status-icon">
                    {recentTrendTone === "positive"
                      ? <FiArrowUpRight />
                      : recentTrendTone === "negative"
                        ? <FiArrowDownRight />
                        : <span>—</span>}
                  </div>
                  <div>
                    <strong>{trendSummary.improving === null ? t("safety.unavailable") : trendSummary.improving ? t("safety.improving") : t("safety.declining")}</strong>
                    <span>{trendSummary.recentChange === null ? "—" : formatTranslation(t, "safety.pointsValue", { value: `${trendSummary.recentChange >= 0 ? "+" : ""}${trendSummary.recentChange.toFixed(1)}` })}</span>
                    <p>{recentTrendCopy.description}</p>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <section className="plant-ai-layout">
            <article className="plant-ai-insight-card">
              <div className="plant-ai-card-header">
                <div className="plant-ai-card-heading">
                  <div className="plant-ai-heading-icon plant-ai-heading-icon--blue"><FiShield /></div>
                  <div><h2>{t("safety.aiExecutiveInsight")}</h2><p>{t("safety.aiInsightDescription")}</p></div>
                </div>
                <span className={`plant-ai-priority-badge plant-ai-priority-badge--${criticalRisks > 0 ? "high" : incidents > 0 || safetyScore < SAFETY_SCORE_TARGET ? "medium" : "normal"}`}>
                  {t("safety.priorityLabel")}: {criticalRisks > 0 ? t("safety.highPriority") : incidents > 0 ? t("safety.mediumPriority") : t("safety.verification")}
                </span>
              </div>
              <div className="plant-ai-insight-grid">
                <div className="plant-ai-insight-item">
                  <div className="plant-ai-insight-label"><FiActivity /><span>{t("safety.whatsHappening")}</span></div>
                  <p>{safetyInsight.happening}</p>
                </div>
                <div className="plant-ai-insight-item">
                  <div className="plant-ai-insight-label"><FiShield /><span>{t("safety.whyItMatters")}</span></div>
                  <p>{safetyInsight.why}</p>
                </div>
                <div className="plant-ai-insight-item">
                  <div className="plant-ai-insight-label"><FiTarget /><span>{t("safety.likelyContributors")}</span></div>
                  <div className="plant-ai-contributor-list">
                    {(safetyInsight.contributors.length ? safetyInsight.contributors : [t("safety.noCurrentSafetyExceptions")]).map((contributor) => (
                      <div key={contributor} className="plant-ai-contributor-row">
                        <span>{contributor}</span>
                        <small className="plant-ai-confidence-tag plant-ai-confidence-tag--verify">{t("safety.currentPeriod")}</small>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="plant-ai-insight-item">
                  <div className="plant-ai-insight-label"><FiCheck /><span>{t("safety.managementPriority")}</span></div>
                  <p>{safetyInsight.priority}</p>
                </div>
              </div>
              <div className="plant-ai-priority-callout">
                <div className="plant-ai-priority-callout-icon"><FiTarget /></div>
                <div><span>{t("safety.recommendedManagementPriority")}</span><strong>{safetyInsight.priority}</strong></div>
              </div>
            </article>

            <aside className="plant-ai-actions-card">
              <div className="plant-ai-card-header plant-ai-card-header--actions">
                <div className="plant-ai-card-heading">
                  <div className="plant-ai-heading-icon plant-ai-heading-icon--green"><FiCheckCircle /></div>
                  <div><h2>{t("safety.aiRecommendedActions")}</h2><p>{t("safety.aiActionsDescription")}</p></div>
                </div>
                <span className="plant-ai-action-count">{safetyRecommendedActions.length} {t("safety.actionsCountLabel")}</span>
              </div>
              <div className="plant-ai-action-list">
                {safetyRecommendedActions.map((action, index) => {
                  const existingAction = findRelatedAction(action);
                  const actionStatus = normalizeActionStatus(existingAction?.status);
                  const statusConfig = {
                    open: { label: t("safety.actionStatusOpen"), icon: <FiClock /> },
                    in_progress: { label: t("safety.actionStatusInProgress"), icon: <FiActivity /> },
                    completed: { label: t("safety.actionStatusCompleted"), icon: <FiCheck /> },
                    blocked: { label: t("safety.actionStatusBlocked"), icon: <FiSlash /> },
                  }[actionStatus] || { label: t("safety.actionStatusOpen"), icon: <FiClock /> };
                  return (
                    <div key={action.id} className="plant-ai-action-row">
                      <div className="plant-ai-action-number">{index + 1}</div>
                      <div className="plant-ai-action-icon">{action.icon}</div>
                      <p>{action.description}</p>
                      <span className={`plant-ai-action-priority plant-ai-action-priority--${action.tone}`}>{action.priority}</span>
                      <Box className="plant-ai-action-control">
                        {existingAction ? (
                          <Box className={`plant-ai-existing-status plant-ai-existing-status--${actionStatus}`}>
                            <span>{statusConfig.icon}{statusConfig.label}</span>
                            <Button type="button" variant="text" size="small" onClick={() => handleViewAction(existingAction)}>
                              {t("safety.viewAction")}
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            type="button"
                            variant="text"
                            size="small"
                            startIcon={<AddIcon fontSize="small" />}
                            disabled={relatedActionsLoading || !today?.report_date}
                            onClick={() => handleCreateAction(action)}
                            aria-label={t("safety.createAction")}
                          >
                            {t("safety.createAction")}
                          </Button>
                        )}
                      </Box>
                    </div>
                  );
                })}
              </div>
            </aside>
          </section>

          <section className="plant-related-actions-card">
            <div className="plant-related-actions-header">
              <div className="plant-related-actions-heading">
                <div className="plant-related-actions-heading-icon"><FiCheck /></div>
                <div><h2>{t("safety.relatedExecutiveActions")}</h2><p>{t("safety.relatedActionsDescription")}</p></div>
              </div>
              <Link to="/executive-actions" className="plant-related-actions-link">
                <span>{t("safety.openActionCenter")}</span><FiArrowRight />
              </Link>
            </div>

            {relatedActionsLoading ? (
              <Box className="plant-related-actions-state">
                <CircularProgress size={28} />
                <Typography>{t("safety.loadingRelatedActions")}</Typography>
              </Box>
            ) : relatedActionsError ? (
              <Alert severity="error" action={<Button color="inherit" size="small" onClick={loadRelatedActions}>{t("safety.retry")}</Button>}>
                {relatedActionsError}
              </Alert>
            ) : (
              <>
                <div className="plant-related-actions-grid">
                  {[
                    ["open", t("safety.actionStatusOpen"), relatedActionSummary.open, t("safety.notStarted"), <FiClock />],
                    ["progress", t("safety.actionStatusInProgress"), relatedActionSummary.inProgress, t("safety.beingExecuted"), <FiActivity />],
                    ["completed", t("safety.actionStatusCompleted"), relatedActionSummary.completed, t("safety.successfullyClosed"), <FiCheck />],
                    ["blocked", t("safety.actionStatusBlocked"), relatedActionSummary.blocked, t("safety.requiresIntervention"), <FiSlash />],
                    ["completion", t("safety.completion"), `${relatedActionSummary.completion.toFixed(0)}%`, t("safety.overallCompletion"), <FiTrendingUp />],
                  ].map(([tone, label, value, supporting, icon]) => (
                    <div key={tone} className="plant-related-action-metric">
                      <div className={`plant-related-action-icon plant-related-action-icon--${tone}`}>{icon}</div>
                      <div><span>{label}</span><strong>{value}</strong><small>{supporting}</small></div>
                    </div>
                  ))}
                </div>
                <div className="plant-related-actions-progress">
                  <div className="plant-related-actions-progress-copy">
                    <div>
                      <span>{t("safety.executiveActionCompletion")}</span>
                      <small>{relatedActionSummary.completed} / {relatedActionSummary.total} {t("safety.actionsCompleted")}</small>
                    </div>
                    <strong>{relatedActionSummary.completion.toFixed(0)}%</strong>
                  </div>
                  <div className="plant-related-actions-progress-track" aria-label={`${t("safety.executiveActionCompletion")} ${relatedActionSummary.completion.toFixed(0)}%`}>
                    <span style={{ width: `${relatedActionSummary.completion}%` }} />
                  </div>
                </div>
              </>
            )}
          </section>

          {actionSaveError && <Alert severity="error" sx={{ mt: 1.5 }}>{actionSaveError}</Alert>}
          <ExecutiveActionDialog
            open={actionDialogOpen}
            action={selectedActionDraft}
            onClose={handleCloseActionDialog}
            onSave={handleSaveAction}
            saving={savingAction}
            primaryColor="#2563eb"
          />
        </>
      )}
    </Box>
  );
}

export default Safety;
