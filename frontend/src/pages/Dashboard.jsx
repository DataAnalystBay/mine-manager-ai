import React, {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadDemoData, resetDemoData } from "../api/demoApi";
import { getKpiDetail } from "../api/kpiDetailApi";
import "./Dashboard.css";
import { useConfig } from "../context/ConfigContext";
import { useLanguage } from "../context/LanguageContext";
import useAuth from "../hooks/useAuth";
import {
  getExecutiveSummary,
  getSharedAnalytics,
} from "../services/dashboardApi";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import DashboardDataState from "../components/dashboard/DashboardDataState";
import ExecutiveInsightsPanel from "../components/executive/ExecutiveInsightsPanel";
import PredictionSummaryPanel from "../components/predictive/PredictionSummaryPanel";
 
import {
  FiBarChart2,
  FiTruck,
  FiShield,
  FiCalendar,
  FiMoreVertical,
  FiPlayCircle,
  FiChevronRight,
  FiClock,
  FiActivity,
} from "react-icons/fi";
 
import {
  FaMountain,
  FaIndustry,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
 
const ExecutiveKpiDetailDialog = lazy(() =>
  import("../components/executive/ExecutiveKpiDetailDialog")
);
 
 
const GRID_LINES = Object.freeze([30, 60, 90]);
const TREND_POINTS = Object.freeze([78, 74, 91, 79, 94, 82, 96]);
const TREND_DAYS = Object.freeze(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
const RISK_LEVELS = Object.freeze([1, 2, 3, 4]);
const RISK_LABELS = Object.freeze(["Low", "Medium", "High", "Extreme"]);
const RISK_ROWS = Object.freeze([
  Object.freeze({ label: "Production", values: Object.freeze([1, 0, 0, 0]) }),
  Object.freeze({ label: "Equipment", values: Object.freeze([1, 2, 3, 4]) }),
  Object.freeze({ label: "Safety", values: Object.freeze([1, 2, 3, 4]) }),
  Object.freeze({ label: "Geotechnical", values: Object.freeze([1, 2, 3, 4]) }),
  Object.freeze({ label: "External", values: Object.freeze([1, 1, 3, 4]) }),
]);
 
const CHART_POINTS = TREND_POINTS
  .map((value, index) => `${index * 53 + 14},${118 - value}`)
  .join(" ");
 
const KPI_ICONS = Object.freeze({
  ore: <FiBarChart2 />,
  waste: <FaMountain />,
  fleet: <FiTruck />,
  plant: <FaIndustry />,
  recovery: <FiActivity />,
  safety: <FiShield />,
  actions: <FaCheckCircle />,
  briefing: <FiActivity />,
  risk: <FiShield />,
});
 
function translateTemplate(t, key, variables = {}) {
  let text = t(key);
 
  Object.entries(variables).forEach(([name, value]) => {
    text = String(text).replaceAll(`{${name}}`, String(value ?? ""));
  });
 
  return text;
}
 
function applyScenarioAdjustments(baseValues, scenario, t) {
  if (scenario === "High Performing Mine") {
    return {
      ...baseValues,
      orePerformance: "104.2",
      wastePerformance: "102.6",
      fleetPerformance: "91.5",
      plantPerformance: "97.2",
      safetyIncidents: 0,
      mineHealthScore: 95,
      priorityAction: t("dashboard.scenarioContent.highPerforming.priorityAction"),
      riskMessage: t("dashboard.scenarioContent.highPerforming.riskMessage"),
      healthStatus: "Excellent",
      actionSeverity: "Low",
      trends: {
        ore: "+2.3%",
        waste: "+1.8%",
        fleet: "+0.7%",
        plant: "+1.1%",
        safety: "0",
      },
    };
  }
 
  if (scenario === "Fleet Breakdown") {
    return {
      ...baseValues,
      orePerformance: "94.0",
      wastePerformance: "90.0",
      fleetPerformance: "71.1",
      plantPerformance: "97.0",
      safetyIncidents: 0,
      mineHealthScore: 78,
      priorityAction: t("dashboard.scenarioContent.fleetBreakdown.priorityAction"),
      riskMessage: t("dashboard.scenarioContent.fleetBreakdown.riskMessage"),
      healthStatus: "High Priority",
      actionSeverity: "High",
      trends: {
        ore: "-6.0%",
        waste: "-10.0%",
        fleet: "-18.9%",
        plant: "-3.0%",
        safety: "0",
      },
    };
  }
 
  if (scenario === "Plant Bottleneck") {
    return {
      ...baseValues,
      plantPerformance: "81.8",
      mineHealthScore: Math.max(baseValues.mineHealthScore - 10, 0),
      priorityAction: t("dashboard.scenarioContent.plantBottleneck.priorityAction"),
      riskMessage: t("dashboard.scenarioContent.plantBottleneck.riskMessage"),
      healthStatus: "Watch",
      actionSeverity: "Medium",
      trends: {
        ore: "-2.4%",
        waste: "-1.6%",
        fleet: "+0.4%",
        plant: "-9.8%",
        safety: "0",
      },
    };
  }
 
  if (scenario === "Safety Incident") {
    return {
      ...baseValues,
      safetyIncidents: 1,
      mineHealthScore: Math.max(baseValues.mineHealthScore - 15, 0),
      priorityAction: t("dashboard.scenarioContent.safetyIncident.priorityAction"),
      riskMessage: t("dashboard.scenarioContent.safetyIncident.riskMessage"),
      healthStatus: "Critical Review",
      actionSeverity: "High",
      trends: {
        ore: "-0.8%",
        waste: "-1.1%",
        fleet: "-0.5%",
        plant: "+0.2%",
        safety: "+1",
      },
    };
  }
 
  if (scenario === "Heavy Rain / Weather Delay") {
    return {
      ...baseValues,
      orePerformance: "88.6",
      wastePerformance: "84.2",
      fleetPerformance: "76.8",
      plantPerformance: "91.4",
      safetyIncidents: 0,
      mineHealthScore: 82,
      priorityAction: t("dashboard.scenarioContent.weatherDelay.priorityAction"),
      riskMessage: t("dashboard.scenarioContent.weatherDelay.riskMessage"),
      healthStatus: "Weather Watch",
      actionSeverity: "Medium",
      trends: {
        ore: "-9.6%",
        waste: "-12.2%",
        fleet: "-11.4%",
        plant: "-2.5%",
        safety: "0",
      },
    };
  }
 
  if (scenario === "Winter Operations") {
    return {
      ...baseValues,
      orePerformance: "91.8",
      wastePerformance: "87.5",
      fleetPerformance: "79.4",
      plantPerformance: "93.6",
      safetyIncidents: 0,
      mineHealthScore: 84,
      priorityAction: t("dashboard.scenarioContent.winterOperations.priorityAction"),
      riskMessage: t("dashboard.scenarioContent.winterOperations.riskMessage"),
      healthStatus: "Winter Watch",
      actionSeverity: "Medium",
      trends: {
        ore: "-4.8%",
        waste: "-6.3%",
        fleet: "-8.1%",
        plant: "-1.4%",
        safety: "0",
      },
    };
  }
 
  return {
    ...baseValues,
    priorityAction: t("dashboard.scenarioContent.stable.priorityAction"),
    riskMessage: t("dashboard.scenarioContent.stable.riskMessage"),
    healthStatus: "Stable",
    actionSeverity: "Low",
    trends: {
      ore: "+0.5%",
      waste: "+0.3%",
      fleet: "0.0%",
      plant: "+0.2%",
      safety: "0",
    },
  };
}
 
function generateExecutiveBriefing(
  values,
  scenario,
  mineName,
  demoLoaded,
  uiLanguage,
  t
) {
  const isSxew = values.operationProfile === "sxew_copper";

  if (!demoLoaded && isSxew) {
    if (uiLanguage === "MN") {
      return (
        `${mineName} үйл ажиллагааны Mine Health Score ${values.mineHealthScore}/100 байна. ` +
        `Катодын зэсийн үйлдвэрлэлийн гүйцэтгэл ${values.orePerformance}%, ` +
        `үйлдвэрийн гүйцэтгэл ${values.plantPerformance}%, ` +
        `Cu recovery ${values.recoveryPerformance}%, ` +
        `аюулгүй ажиллагааны үнэлгээ ${values.safetyScore}% байна. ` +
        `Удирдлагын гол анхаарах чиглэл: катодын үйлдвэрлэлийн алдагдал, ` +
        `үйлдвэрийн тогтвортой ажиллагаа, Cu recovery болон аюулгүй ажиллагааны эрсдэлийг хамтад нь хянах.`
      );
    }

    return (
      `${mineName} is currently operating with a Mine Health Score of ` +
      `${values.mineHealthScore}/100. Cathode production performance is ` +
      `${values.orePerformance}%, process plant performance is ` +
      `${values.plantPerformance}%, Cu recovery is ${values.recoveryPerformance}%, ` +
      `and safety score is ${values.safetyScore}%. The key management focus should be ` +
      `cathode production losses, process stability, Cu recovery, and safety risk controls.`
    );
  }

  if (!demoLoaded) {
    return translateTemplate(t, "dashboard.briefings.live", {
      mineName,
      mineHealthScore: values.mineHealthScore,
      orePerformance: values.orePerformance,
      wastePerformance: values.wastePerformance,
      fleetPerformance: values.fleetPerformance,
      plantPerformance: values.plantPerformance,
      safetyIncidents: values.safetyIncidents,
    });
  }

  const briefingKeys = {
    "High Performing Mine": "dashboard.briefings.highPerforming",
    "Fleet Breakdown": "dashboard.briefings.fleetBreakdown",
    "Plant Bottleneck": "dashboard.briefings.plantBottleneck",
    "Safety Incident": "dashboard.briefings.safetyIncident",
    "Heavy Rain / Weather Delay": "dashboard.briefings.weatherDelay",
    "Winter Operations": "dashboard.briefings.winterOperations",
  };

  const key = briefingKeys[scenario] || "dashboard.briefings.stable";

  return translateTemplate(t, key, {
    scenario: t(
      {
        "High Performing Mine": "dashboard.highPerformingMine",
        "Fleet Breakdown": "dashboard.fleetBreakdown",
        "Plant Bottleneck": "dashboard.plantBottleneck",
        "Safety Incident": "dashboard.safetyIncident",
        "Heavy Rain / Weather Delay": "dashboard.weatherDelay",
        "Winter Operations": "dashboard.winterOperations",
      }[scenario] || "dashboard.highPerformingMine"
    ),
    mineName,
    mineHealthScore: values.mineHealthScore,
    orePerformance: values.orePerformance,
    wastePerformance: values.wastePerformance,
    fleetPerformance: values.fleetPerformance,
    plantPerformance: values.plantPerformance,
    safetyIncidents: values.safetyIncidents,
    oreTrend: values.trends?.ore || "0.0%",
    wasteTrend: values.trends?.waste || "0.0%",
    fleetTrend: values.trends?.fleet || "0.0%",
    plantTrend: values.trends?.plant || "0.0%",
  });
}

function createDailyValues(currentValue, changePercent, lowerBound = 0) {
  const current = Number(currentValue);
  const change = Number(String(changePercent || "0").replace("%", ""));
 
  if (!Number.isFinite(current)) {
    return [];
  }
 
  const safeChange = Number.isFinite(change) ? change : 0;
  const startValue = current / (1 + safeChange / 100 || 1);
  const today = new Date();
 
  return Array.from({ length: 7 }, (_, index) => {
    const progress = index / 6;
    const wave = Math.sin(index * 1.35) * Math.max(Math.abs(current) * 0.008, 0.15);
    const value = Math.max(
      lowerBound,
      startValue + (current - startValue) * progress + wave
    );
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
 
    return {
      date: date.toISOString().slice(0, 10),
      value: Number(value.toFixed(current < 10 ? 2 : 1)),
    };
  });
}
 
function buildKpiDetail(
  kpiKey,
  values,
  scenario,
  mineName,
  isDemoLoaded,
  t
) {
  const definitions = {
    ore: {
      kpi_name: t("dashboard.kpiDefinitions.ore.name"),
      current_value: values.orePerformance,
      target: 100,
      unit: "%",
      change: values.trends?.ore,
      higher_is_better: true,
      top_drivers: [
        t("dashboard.kpiDefinitions.ore.driver1"),
        t("dashboard.kpiDefinitions.ore.driver2"),
        t("dashboard.kpiDefinitions.ore.driver3"),
      ],
      recommendations: [
        t("dashboard.kpiDefinitions.ore.recommendation1"),
        t("dashboard.kpiDefinitions.ore.recommendation2"),
        t("dashboard.kpiDefinitions.ore.recommendation3"),
      ],
    },
    waste: {
      kpi_name: t("dashboard.kpiDefinitions.waste.name"),
      current_value: values.wastePerformance,
      target: 100,
      unit: "%",
      change: values.trends?.waste,
      higher_is_better: true,
      top_drivers: [
        t("dashboard.kpiDefinitions.waste.driver1"),
        t("dashboard.kpiDefinitions.waste.driver2"),
        t("dashboard.kpiDefinitions.waste.driver3"),
      ],
      recommendations: [
        t("dashboard.kpiDefinitions.waste.recommendation1"),
        t("dashboard.kpiDefinitions.waste.recommendation2"),
        t("dashboard.kpiDefinitions.waste.recommendation3"),
      ],
    },
    fleet: {
      kpi_name: t("dashboard.kpiDefinitions.fleet.name"),
      current_value: values.fleetPerformance,
      target: 90,
      unit: "%",
      change: values.trends?.fleet,
      higher_is_better: true,
      top_drivers: [
        t("dashboard.kpiDefinitions.fleet.driver1"),
        t("dashboard.kpiDefinitions.fleet.driver2"),
        t("dashboard.kpiDefinitions.fleet.driver3"),
      ],
      recommendations: [
        t("dashboard.kpiDefinitions.fleet.recommendation1"),
        t("dashboard.kpiDefinitions.fleet.recommendation2"),
        t("dashboard.kpiDefinitions.fleet.recommendation3"),
      ],
    },
    plant: {
      kpi_name: t("dashboard.kpiDefinitions.plant.name"),
      current_value: values.plantPerformance,
      target: 95,
      unit: "%",
      change: values.trends?.plant,
      higher_is_better: true,
      top_drivers: [
        t("dashboard.kpiDefinitions.plant.driver1"),
        t("dashboard.kpiDefinitions.plant.driver2"),
        t("dashboard.kpiDefinitions.plant.driver3"),
      ],
      recommendations: [
        t("dashboard.kpiDefinitions.plant.recommendation1"),
        t("dashboard.kpiDefinitions.plant.recommendation2"),
        t("dashboard.kpiDefinitions.plant.recommendation3"),
      ],
    },
    recovery: {
      kpi_name:
        values.operationProfile === "sxew_copper"
          ? "Cu Recovery"
          : "Recovery",
      current_value: values.recoveryPerformance,
      target: 77,
      unit: "%",
      change: values.trends?.recovery || values.trends?.plant,
      higher_is_better: true,
      top_drivers:
        values.operationProfile === "sxew_copper"
          ? [
              "PLS copper grade and solution chemistry",
              "Leach performance and residence time",
              "SX-EW operating stability",
            ]
          : [
              t("dashboard.kpiDefinitions.plant.driver1"),
              t("dashboard.kpiDefinitions.plant.driver2"),
              t("dashboard.kpiDefinitions.plant.driver3"),
            ],
      recommendations:
        values.operationProfile === "sxew_copper"
          ? [
              "Review PLS copper grade and leach conditions.",
              "Check SX extraction and stripping performance.",
              "Review EW current efficiency and process constraints.",
            ]
          : [
              t("dashboard.kpiDefinitions.plant.recommendation1"),
              t("dashboard.kpiDefinitions.plant.recommendation2"),
              t("dashboard.kpiDefinitions.plant.recommendation3"),
            ],
    },
    safety: {
      kpi_name: t("dashboard.kpiDefinitions.safety.name"),
      current_value: values.safetyIncidents,
      target: 0,
      unit: "",
      change: values.trends?.safety,
      higher_is_better: false,
      top_drivers: [
        t("dashboard.kpiDefinitions.safety.driver1"),
        t("dashboard.kpiDefinitions.safety.driver2"),
        t("dashboard.kpiDefinitions.safety.driver3"),
      ],
      recommendations: [
        t("dashboard.kpiDefinitions.safety.recommendation1"),
        t("dashboard.kpiDefinitions.safety.recommendation2"),
        t("dashboard.kpiDefinitions.safety.recommendation3"),
      ],
    },
    mine_health: {
      kpi_name: t("dashboard.kpiDefinitions.mineHealth.name"),
      current_value: values.mineHealthScore,
      target: 85,
      unit: "/100",
      change: 0,
      higher_is_better: true,
      top_drivers: [
        t("dashboard.kpiDefinitions.mineHealth.driver1"),
        t("dashboard.kpiDefinitions.mineHealth.driver2"),
        t("dashboard.kpiDefinitions.mineHealth.driver3"),
      ],
      recommendations: [
        t("dashboard.kpiDefinitions.mineHealth.recommendation1"),
        t("dashboard.kpiDefinitions.mineHealth.recommendation2"),
        t("dashboard.kpiDefinitions.mineHealth.recommendation3"),
      ],
    },
  };
 
  const definition = definitions[kpiKey] || definitions.ore;
  const rawChange = Number(String(definition.change || "0").replace("%", ""));
  const changePercent = Number.isFinite(rawChange) ? rawChange : 0;
  const riskLevel =
    values.actionSeverity === "High"
      ? "high"
      : values.actionSeverity === "Medium"
      ? "medium"
      : "low";
 
  const scenarioLabel = t(
    {
      "High Performing Mine": "dashboard.highPerformingMine",
      "Fleet Breakdown": "dashboard.fleetBreakdown",
      "Plant Bottleneck": "dashboard.plantBottleneck",
      "Safety Incident": "dashboard.safetyIncident",
      "Heavy Rain / Weather Delay": "dashboard.weatherDelay",
      "Winter Operations": "dashboard.winterOperations",
    }[scenario] || "dashboard.highPerformingMine"
  );
 
  return {
    ...definition,
    period_label: t("dashboard.last7Days"),
    change: changePercent,
    change_percent: changePercent,
    direction: changePercent > 0 ? "up" : changePercent < 0 ? "down" : "flat",
    daily_values: createDailyValues(
      definition.current_value,
      changePercent,
      0
    ),
    executive_insight: translateTemplate(
      t,
      "dashboard.kpiDetailDynamic.executiveInsight",
      {
        mineName,
        kpiName: definition.kpi_name.toLowerCase(),
        currentValue: definition.current_value,
        unit: definition.unit,
        target: definition.target,
        scenario: scenarioLabel,
      }
    ),
    forecast:
      riskLevel === "high"
        ? t("dashboard.kpiDetailDynamic.forecastHigh")
        : riskLevel === "medium"
        ? t("dashboard.kpiDetailDynamic.forecastMedium")
        : t("dashboard.kpiDetailDynamic.forecastLow"),
    risk_level: riskLevel,
    confidence: isDemoLoaded ? 92 : 86,
  };
}
 
function normalizeKpiKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}
 
function isSupportedKpiKey(kpiKey) {
  return [
    "ore",
    "waste",
    "fleet",
    "plant",
    "recovery",
    "safety",
    "mine_health",
  ].includes(normalizeKpiKey(kpiKey));
}
 
export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedKpiKey = normalizeKpiKey(searchParams.get("kpi_key") || "");
  const { company, mine, loading } = useConfig();
  const { user } = useAuth();
  const { language: uiLanguage, t } = useLanguage();
 
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [demoData, setDemoData] = useState(null);
 
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [executiveSummaryLoading, setExecutiveSummaryLoading] = useState(true);
  const [executiveSummaryError, setExecutiveSummaryError] = useState("");
 
  const [toast, setToast] = useState(null);
  const [demoScenario, setDemoScenario] = useState("High Performing Mine");
  const [scenarioTransition, setScenarioTransition] = useState(false);
  const [scenarioTransitionLabel, setScenarioTransitionLabel] = useState(
    t("dashboard.updatingDashboard")
  );
 
  const [sharedAnalytics, setSharedAnalytics] = useState(null);
  const [sharedAnalyticsLoading, setSharedAnalyticsLoading] = useState(true);
  const [sharedAnalyticsError, setSharedAnalyticsError] = useState("");
 
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [kpiDetailLoading, setKpiDetailLoading] = useState(false);
  const [kpiDetailError, setKpiDetailError] = useState("");
  const [kpiDetailData, setKpiDetailData] = useState(null);
  const [selectedKpiKey, setSelectedKpiKey] = useState(null);
 
  const kpiDetailRequestIdRef = useRef(0);
  const kpiDialogClosingRef = useRef(false);
 
  const companyName = company?.company_name || "Mine Manager AI";
  const mineName = mine?.mine_name || "Demo Mine";
  const timezone = company?.timezone || "Asia/Ulaanbaatar";
  const shiftPattern = mine?.shift_pattern || "Day / Night Shift";
 
  const executiveInsightsAllowedRoles = [
    "Superintendent",
    "Mine Manager",
    "General Manager",
    "Administrator",
  ];
 
  const canViewExecutiveInsights =
    executiveInsightsAllowedRoles.includes(user?.role);
 
  const getScenarioLabel = useCallback(
    (scenario) => {
      const scenarioKeys = {
        "High Performing Mine": "dashboard.highPerformingMine",
        "Fleet Breakdown": "dashboard.fleetBreakdown",
        "Plant Bottleneck": "dashboard.plantBottleneck",
        "Safety Incident": "dashboard.safetyIncident",
        "Heavy Rain / Weather Delay": "dashboard.weatherDelay",
        "Winter Operations": "dashboard.winterOperations",
      };
 
      return t(
        scenarioKeys[scenario] ||
          "dashboard.highPerformingMine"
      );
    },
    [t]
  );
 
  const getHealthStatusLabel = useCallback(
    (status) => {
      const statusKeys = {
        Stable: "dashboard.stable",
        Excellent: "dashboard.excellent",
        "High Priority": "dashboard.highPriority",
        Watch: "dashboard.watch",
        "Critical Review": "dashboard.criticalReview",
        "Weather Watch": "dashboard.weatherWatch",
        "Winter Watch": "dashboard.winterWatch",
      };
 
      return statusKeys[status]
        ? t(statusKeys[status])
        : status;
    },
    [t]
  );
 
  const getRiskLabel = useCallback(
    (value) => {
      const keys = {
        Low: "dashboard.riskLowLabel",
        Medium: "dashboard.riskMediumLabel",
        High: "dashboard.riskHighLabel",
        Extreme: "dashboard.riskExtremeLabel",
      };
 
      return t(
        keys[value] ||
          "dashboard.riskLowLabel"
      );
    },
    [t]
  );
 
  const getRiskRowLabel = useCallback(
    (value) => {
      const keys = {
        Production: "dashboard.riskProduction",
        Equipment: "dashboard.riskEquipment",
        Safety: "dashboard.riskSafety",
        Geotechnical: "dashboard.riskGeotechnical",
        External: "dashboard.riskExternal",
      };
 
      if (value === "Process Plant") {
        return uiLanguage === "MN" ? "Үйлдвэр" : "Process Plant";
      }

      return t(
        keys[value] ||
          "dashboard.riskExternal"
      );
    },
    [t, uiLanguage]
  );
 
  const getPriorityLabel = useCallback(
    (value) => {
      const keys = {
        High: "dashboard.high",
        Medium: "dashboard.medium",
        Low: "dashboard.low",
      };
 
      return keys[value] ? t(keys[value]) : value;
    },
    [t]
  );
 
  const getTrendDayLabel = useCallback(
    (value) => {
      const keys = {
        Mon: "dashboard.dayMon",
        Tue: "dashboard.dayTue",
        Wed: "dashboard.dayWed",
        Thu: "dashboard.dayThu",
        Fri: "dashboard.dayFri",
        Sat: "dashboard.daySat",
        Sun: "dashboard.daySun",
      };
 
      return keys[value] ? t(keys[value]) : value;
    },
    [t]
  );
 
  const currentDate = useMemo(
    () =>
      new Date().toLocaleDateString(uiLanguage === "MN" ? "mn-MN" : "en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [uiLanguage]
  );
 
  const lastUpdated = useMemo(
    () =>
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [demoData, executiveSummary, sharedAnalytics, demoScenario]
  );
 
  const showToast = useCallback((type, title, message) => {
    setToast({ type, title, message });
 
    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);
 
  const loadExecutiveSummary = useCallback(async () => {
    try {
      setExecutiveSummaryLoading(true);
      setExecutiveSummaryError("");
 
      const data = await getExecutiveSummary(mineName);
      setExecutiveSummary(data);
    } catch (error) {
      console.error("Executive summary load failed:", error);
      setExecutiveSummaryError(
        t("dashboard.liveSummaryLoadError")
      );
    } finally {
      setExecutiveSummaryLoading(false);
    }
  }, [mineName, t]);
 
  useEffect(() => {
    loadExecutiveSummary();
  }, [loadExecutiveSummary]);
 
  const runScenarioTransition = useCallback(
    async ({
      label = t("dashboard.updatingDashboard"),
      action,
      minimumDuration = 650,
    }) => {
      if (scenarioTransition) {
        return;
      }
 
      setScenarioTransitionLabel(label);
      setScenarioTransition(true);
 
      const startedAt = Date.now();
 
      try {
        await action();
      } finally {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, minimumDuration - elapsed);
 
        if (remaining > 0) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, remaining);
          });
        }
 
        setScenarioTransition(false);
      }
    },
    [scenarioTransition, t]
  );
 
  const handleScenarioChange = useCallback(
    async (event) => {
      const selectedScenario = event.target.value;
 
      if (selectedScenario === demoScenario || scenarioTransition) {
        return;
      }
 
      await runScenarioTransition({
        label: `${t("dashboard.applyingScenario")} ${getScenarioLabel(selectedScenario)}`,
        minimumDuration: 650,
        action: async () => {
          setDemoScenario(selectedScenario);
 
          await new Promise((resolve) => {
            window.setTimeout(resolve, 180);
          });
        },
      });
    },
    [demoScenario, getScenarioLabel, runScenarioTransition, scenarioTransition, t]
  );
 
  const handleLoadDemo = useCallback(async () => {
    await runScenarioTransition({
      label: `${t("dashboard.loadingScenario")} ${getScenarioLabel(demoScenario)}`,
      minimumDuration: 850,
      action: async () => {
        try {
          setDemoLoading(true);
 
          const result = await loadDemoData({
            scenario: demoScenario,
            mine_name: mineName,
          });
          console.log("Demo data loaded:", result);
 
          setDemoData(result.data);
          setDemoLoaded(true);
 
          showToast(
            "success",
            t("dashboard.executiveDemoLoaded"),
            `${getScenarioLabel(demoScenario)} ${t("dashboard.scenarioLoadedSuccessfully")}`
          );
        } catch (error) {
          console.error("Demo load failed:", error);
 
          showToast(
            "error",
            t("dashboard.demoLoadFailed"),
            t("dashboard.checkBackendAndRetry")
          );
        } finally {
          setDemoLoading(false);
        }
      },
    });
  }, [demoScenario, getScenarioLabel, mineName, runScenarioTransition, showToast, t]);
 
  const handleResetDemo = useCallback(async () => {
    await runScenarioTransition({
      label: t("dashboard.restoringLiveView"),
      minimumDuration: 700,
      action: async () => {
        try {
          await resetDemoData({
            mine_name: mineName,
          });
 
          setDemoData(null);
          setDemoLoaded(false);
          setDemoScenario("High Performing Mine");
 
          await loadExecutiveSummary();
 
          showToast(
            "success",
            t("dashboard.demoReset"),
            t("dashboard.restoredToLiveView")
          );
        } catch (error) {
          console.error("Demo reset failed:", error);
 
          showToast(
            "error",
            t("dashboard.resetFailed"),
            t("dashboard.checkBackendAndRetry")
          );
        }
      },
    });
  }, [
    loadExecutiveSummary,
    mineName,
    runScenarioTransition,
    showToast,
    t,
  ]);
 
  const loadSharedAnalytics = useCallback(async () => {
    try {
      setSharedAnalyticsLoading(true);
      setSharedAnalyticsError("");
 
      const data = await getSharedAnalytics(
        mineName,
        7,
        uiLanguage === "MN" ? "mn" : "en"
      );
      setSharedAnalytics(data);
    } catch (error) {
      console.error("Shared analytics load failed:", error);
      setSharedAnalyticsError(t("dashboard.sharedAnalyticsLoadError"));
    } finally {
      setSharedAnalyticsLoading(false);
    }
  }, [mineName, t, uiLanguage]);
 
  useEffect(() => {
    loadSharedAnalytics();
  }, [loadSharedAnalytics]);
 
  const baseValues = useMemo(() => {
    const readNumber = (...values) => {
      for (const value of values) {
        if (value === null || value === undefined || value === "") {
          continue;
        }
 
        const numericValue = Number(value);
 
        if (Number.isFinite(numericValue)) {
          return numericValue;
        }
      }
 
      return null;
    };
 
    const formatOneDecimal = (value, fallback = "0.0") => {
      const numericValue = readNumber(value);
      return numericValue === null ? fallback : numericValue.toFixed(1);
    };
 
    /*
     * Demo Mode intentionally continues to use the scenario dataset.
     * Live Mode uses /api/dashboard/executive-summary as the source of truth.
     */
    if (demoLoaded) {
      const latestProduction = demoData?.production?.at(-1);
      const latestFleet = demoData?.fleet?.slice(-5) || [];
      const latestPlant = demoData?.plant?.at(-1);
      const latestSafety = demoData?.safety?.at(-1);
 
      const orePerformance = latestProduction
        ? (
            (latestProduction.ore_actual / latestProduction.ore_plan) *
            100
          ).toFixed(1)
        : "0.0";
 
      const wastePerformance = latestProduction
        ? (
            (latestProduction.waste_actual / latestProduction.waste_plan) *
            100
          ).toFixed(1)
        : "0.0";
 
      const fleetPerformance = latestFleet.length
        ? (
            latestFleet.reduce(
              (sum, item) =>
                sum +
                Number(
                  item.utilization ??
                    item.fleet_performance ??
                    0
                ),
              0
            ) / latestFleet.length
          ).toFixed(1)
        : "0.0";
 
      const plantPerformance = latestPlant
        ? (
            (latestPlant.throughput_actual / latestPlant.throughput_plan) *
            100
          ).toFixed(1)
        : "0.0";
 
      const safetyIncidents =
        readNumber(
          latestSafety?.recordable_incidents,
          latestSafety?.incidents
        ) ?? 0;
 
      const safetyScore =
        readNumber(latestSafety?.safety_score) ??
        (safetyIncidents === 0 ? 100 : 70);
 
      const fleetAvailability = readNumber(
        latestFleet.at(-1)?.availability
      );
 
      const plantThroughputPerformance = latestPlant
        ? readNumber(latestPlant.throughput_plan) > 0
          ? Number(
              (
                (Number(latestPlant.throughput_actual) /
                  Number(latestPlant.throughput_plan)) *
                100
              ).toFixed(1)
            )
          : null
        : null;
 
      const mineHealthScore = Math.round(
        (Number(orePerformance) +
          Number(wastePerformance) +
          Number(fleetPerformance) +
          Number(plantPerformance) +
          safetyScore) /
          5
      );
 
      return {
        orePerformance,
        wastePerformance,
        fleetPerformance,
        plantPerformance,
        recoveryPerformance: Number(latestPlant?.recovery ?? 0).toFixed(2),
        safetyIncidents,
        safetyScore,
        fleetAvailability,
        plantThroughputPerformance,
        mineHealthScore,
        operationProfile: "standard_mine",
        applicability: {
          production: true,
          waste: true,
          fleet: true,
          plant: true,
          safety: true,
        },
      };
    }
 
    const summary = executiveSummary?.summary ?? executiveSummary ?? {};
 
    const orePerformance = formatOneDecimal(
      readNumber(
        summary.ore_performance,
        summary.orePerformance,
        summary.ore
      )
    );
 
    const wastePerformance = formatOneDecimal(
      readNumber(
        summary.waste_movement,
        summary.waste_performance,
        summary.wastePerformance,
        summary.waste
      )
    );
 
    const fleetPerformance = formatOneDecimal(
      readNumber(
        summary.fleet_performance,
        summary.fleetPerformance,
        summary.fleet
      )
    );
 
    const plantPerformance = formatOneDecimal(
      readNumber(
        summary.plant_performance,
        summary.plantPerformance,
        summary.plant
      )
    );
 
    const safetyIncidents =
      readNumber(
        summary.safety_incidents,
        summary.recordable_incidents,
        summary.incidents,
        summary.safety
      ) ?? 0;
 
    const safetyScore =
      readNumber(
        summary.safety_score,
        summary.safetyScore
      ) ?? 0;
 
    const mineHealthScore =
      readNumber(
        summary.mine_health_score,
        summary.mineHealthScore,
        summary.mine_health,
        summary.health
      ) ?? 0;
 
    const fleetAvailability = readNumber(
      summary.fleet_availability,
      summary.availability
    );
 
    const plantThroughputPerformance = readNumber(
      summary.throughput_performance,
      summary.plant_throughput_performance,
      summary.throughput
    );

    const recoveryPerformance = formatOneDecimal(
      readNumber(
        summary.recovery,
        summary.cu_recovery,
        summary.recovery_performance
      )
    );

    const operationProfile =
      summary.operation_profile ||
      summary.operationProfile ||
      "standard_mine";

    const applicability = {
      production: summary.applicability?.production !== false,
      waste: summary.applicability?.waste !== false,
      fleet: summary.applicability?.fleet !== false,
      plant: summary.applicability?.plant !== false,
      safety: summary.applicability?.safety !== false,
    };
 
    return {
      orePerformance,
      wastePerformance,
      fleetPerformance,
      plantPerformance,
      recoveryPerformance,
      safetyIncidents,
      safetyScore,
      fleetAvailability,
      plantThroughputPerformance,
      mineHealthScore,
      operationProfile,
      applicability,
    };
  }, [demoData, demoLoaded, executiveSummary]);
 
  const scenarioValues = useMemo(() => {
    if (demoLoaded) {
      return applyScenarioAdjustments(baseValues, demoScenario, t);
    }
 
    return {
      ...baseValues,
      priorityAction:
        baseValues.operationProfile === "sxew_copper"
          ? uiLanguage === "MN"
            ? "Катодын үйлдвэрлэл, үйлдвэрийн гүйцэтгэл болон аюулгүй ажиллагааг хянах"
            : "Review cathode production, process plant performance, and safety"
          : t("dashboard.scenarioContent.stable.priorityAction"),
      riskMessage:
        baseValues.operationProfile === "sxew_copper"
          ? uiLanguage === "MN"
            ? "Катодын үйлдвэрлэл, Cu recovery болон аюулгүй ажиллагааны үзүүлэлтүүдэд удирдлагын анхаарал шаардлагатай."
            : "Management attention is required on cathode production, Cu recovery, and safety indicators."
          : t("dashboard.scenarioContent.stable.liveRiskMessage"),
      healthStatus: "Stable",
      actionSeverity: "Low",
      trends: {
        ore: "+0.5%",
        waste: "+0.3%",
        fleet: "0.0%",
        plant: "+0.2%",
        recovery: "0.0%",
        safety: "0",
      },
    };
  }, [baseValues, demoLoaded, demoScenario, t, uiLanguage]);
 
  const executiveBriefing = useMemo(
    () =>
      generateExecutiveBriefing(
        scenarioValues,
        demoScenario,
        mineName,
        demoLoaded,
        uiLanguage,
        t
      ),
    [scenarioValues, demoScenario, mineName, demoLoaded, uiLanguage, t]
  );
 
  const openKpiDetail = useCallback(
    async (kpiKey) => {
      const normalizedKpiKey = normalizeKpiKey(kpiKey);

      if (!isSupportedKpiKey(normalizedKpiKey)) {
        console.warn("Unsupported KPI key:", kpiKey);
        return;
      }

      if (requestedKpiKey !== normalizedKpiKey) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("kpi_key", normalizedKpiKey);
        setSearchParams(nextParams, { replace: true });
      }

      kpiDialogClosingRef.current = false;

      const requestId = kpiDetailRequestIdRef.current + 1;
      kpiDetailRequestIdRef.current = requestId;

      setSelectedKpiKey(normalizedKpiKey);
      setKpiDialogOpen(true);
      setKpiDetailLoading(true);
      setKpiDetailError("");
      setKpiDetailData(null);

      try {
        /*
         * Demo mode keeps the scenario-specific local KPI analysis.
         * Live mode reads KPI detail and operational drivers from PostgreSQL
         * through /api/dashboard/kpi-detail.
         */
        const detail = demoLoaded
          ? buildKpiDetail(
              normalizedKpiKey,
              scenarioValues,
              demoScenario,
              mineName,
              true,
              t
            )
          : await getKpiDetail({
              mineName,
              kpiName: normalizedKpiKey,
              days: 7,
            });

        if (
          kpiDialogClosingRef.current ||
          kpiDetailRequestIdRef.current !== requestId
        ) {
          return;
        }

        setKpiDetailData(detail);
      } catch (error) {
        console.error("KPI detail load failed:", error);

        if (
          !kpiDialogClosingRef.current &&
          kpiDetailRequestIdRef.current === requestId
        ) {
          setKpiDetailError(t("dashboard.unableToPrepareKpi"));
        }
      } finally {
        if (
          !kpiDialogClosingRef.current &&
          kpiDetailRequestIdRef.current === requestId
        ) {
          setKpiDetailLoading(false);
        }
      }
    },
    [
      demoLoaded,
      demoScenario,
      mineName,
      requestedKpiKey,
      scenarioValues,
      searchParams,
      setSearchParams,
      t,
    ]
  );

  useEffect(() => {
    if (
      loading ||
      !requestedKpiKey ||
      !isSupportedKpiKey(requestedKpiKey) ||
      kpiDialogClosingRef.current ||
      kpiDialogOpen ||
      selectedKpiKey === requestedKpiKey
    ) {
      return;
    }
 
    openKpiDetail(requestedKpiKey);
  }, [
    loading,
    requestedKpiKey,
    kpiDialogOpen,
    selectedKpiKey,
    openKpiDetail,
  ]);
 
  const closeKpiDetail = useCallback(() => {
    /*
     * Prevent the URL-driven effect from reopening the dialog during the
     * brief render between closing the dialog and removing `kpi_key`.
     */
    kpiDialogClosingRef.current = true;
    kpiDetailRequestIdRef.current += 1;

if (requestedKpiKey) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("kpi_key");
      setSearchParams(nextParams, { replace: true });
    }
 
    setKpiDialogOpen(false);
    setKpiDetailLoading(false);
    setKpiDetailError("");
    setKpiDetailData(null);
    setSelectedKpiKey(null);
  }, [requestedKpiKey, searchParams, setSearchParams]);
const retryKpiDetail = useCallback(() => {
    if (selectedKpiKey) {
      openKpiDetail(selectedKpiKey);
    }
  }, [openKpiDetail, selectedKpiKey]);
 
  const openExecutiveActionCenter = useCallback(
    (kpiKey) => {
      const activeKpiKey = kpiKey || selectedKpiKey;
 
      kpiDialogClosingRef.current = true;
    kpiDetailRequestIdRef.current += 1;

setKpiDialogOpen(false);
 
      if (activeKpiKey) {
        navigate(
          `/executive-actions?kpi_key=${encodeURIComponent(activeKpiKey)}`
        );
        return;
      }
 
      navigate("/executive-actions");
    },
    [navigate, selectedKpiKey]
  );
 
  const isSxewOperation =
    !demoLoaded && scenarioValues.operationProfile === "sxew_copper";

  const operationLabels = useMemo(() => {
    if (!isSxewOperation) {
      return {
        production: t("dashboard.orePerformance"),
        plant: t("dashboard.plantPerformance"),
        recovery: "Recovery",
        safety: t("dashboard.safetyIncidents"),
      };
    }

    if (uiLanguage === "MN") {
      return {
        production: "Катодын зэсийн үйлдвэрлэл",
        plant: "Үйлдвэрийн гүйцэтгэл",
        recovery: "Cu Recovery",
        safety: "Аюулгүй ажиллагааны тохиолдол",
      };
    }

    return {
      production: "Cathode Production",
      plant: "Process Plant Performance",
      recovery: "Cu Recovery",
      safety: "Safety Incidents",
    };
  }, [isSxewOperation, t, uiLanguage]);

  const priorityActions = useMemo(() => {
    if (isSxewOperation) {
      const actions = [];

      if (Number(scenarioValues.orePerformance) < 95) {
        actions.push({
          id: "cathode-production",
          title:
            uiLanguage === "MN"
              ? "Катодын зэсийн үйлдвэрлэлийн алдагдлыг шалгах"
              : "Review cathode production losses",
          priority: "High",
          due: "Due Today",
        });
      }

      if (Number(scenarioValues.plantPerformance) < 95) {
        actions.push({
          id: "process-plant",
          title:
            uiLanguage === "MN"
              ? "Үйлдвэрийн тогтвортой ажиллагаа ба Cu recovery-г хянах"
              : "Review process plant stability and Cu recovery",
          priority: "Medium",
          due: "Due Today",
        });
      }

      if (
        Number(scenarioValues.safetyIncidents) > 0 ||
        Number(baseValues.safetyScore) < 95
      ) {
        actions.push({
          id: "safety-controls",
          title:
            uiLanguage === "MN"
              ? "Аюулгүй ажиллагааны эрсдэлийн хяналтыг баталгаажуулах"
              : "Confirm safety risk controls",
          priority: "Medium",
          due: "Due Tomorrow",
        });
      }

      return actions.length
        ? actions.slice(0, 3)
        : [
            {
              id: "stable-operations",
              title:
                uiLanguage === "MN"
                  ? "Одоогийн үйл ажиллагааны сахилга батыг хадгалах"
                  : "Maintain current operating discipline",
              priority: "Low",
              due: "Due Today",
            },
          ];
    }

    return [
      {
        id: "scenario-priority",
        title: scenarioValues.priorityAction,
        priority: scenarioValues.actionSeverity,
        due: "Due Today",
      },
      {
        id: "loading-constraints",
        title: t("dashboard.staticPriorityActions.reviewLoadingConstraints"),
        priority: "Medium",
        due: "Due Tomorrow",
      },
      {
        id: "maintenance-recovery",
        title: t("dashboard.staticPriorityActions.confirmMaintenanceRecovery"),
        priority: "Medium",
        due: t("dashboard.dueJul24"),
      },
    ];
  }, [
    baseValues.safetyScore,
    isSxewOperation,
    scenarioValues.actionSeverity,
    scenarioValues.orePerformance,
    scenarioValues.plantPerformance,
    scenarioValues.priorityAction,
    scenarioValues.safetyIncidents,
    t,
    uiLanguage,
  ]);

  const configurationItems = useMemo(
    () => [
      [t("dashboard.company"), companyName],
      [t("dashboard.mine"), mineName],
      [t("dashboard.timezone"), timezone],
      [
        t("dashboard.language"),
        uiLanguage === "MN"
          ? "Монгол"
          : "English",
      ],
      [t("dashboard.lastUpdated"), lastUpdated],
    ],
    [
      companyName,
      mineName,
      timezone,
      uiLanguage,
      lastUpdated,
      t,
    ]
  );
 
  const handleViewAllKpis = useCallback(() => {
    navigate("/production");
  }, [navigate]);
 
  const handleViewAllActions = useCallback(() => {
    navigate("/executive-actions");
  }, [navigate]);
 
  const handleViewFullBriefing = useCallback(() => {
    navigate("/reports");
  }, [navigate]);
 
  const handleOpenOre = useCallback(() => openKpiDetail("ore"), [openKpiDetail]);
  const handleOpenWaste = useCallback(
    () => openKpiDetail("waste"),
    [openKpiDetail]
  );
  const handleOpenFleet = useCallback(
    () => openKpiDetail("fleet"),
    [openKpiDetail]
  );
  const handleOpenPlant = useCallback(
    () => openKpiDetail("plant"),
    [openKpiDetail]
  );
  const handleOpenRecovery = useCallback(
    () => openKpiDetail("recovery"),
    [openKpiDetail]
  );
  const handleOpenSafety = useCallback(
    () => openKpiDetail("safety"),
    [openKpiDetail]
  );
  const handleOpenMineHealth = useCallback(
    () => openKpiDetail("mine_health"),
    [openKpiDetail]
  );
 
  if (loading) {
    return <DashboardSkeleton />;
  }
 
  return (
    <div
      className="mma-dashboard executive-dashboard-page"
      style={{
        minHeight: "100%",
        background: "#f4f7fb",
        color: "#0f172a",
      }}
    >
      {scenarioTransition && (
        <div
          className="dashboard-transition-overlay"
          role="status"
          aria-live="polite"
          aria-label={scenarioTransitionLabel}
        >
          <div className="dashboard-transition-card">
            <div className="dashboard-transition-spinner" />
 
            <div className="dashboard-transition-copy">
              <strong>{scenarioTransitionLabel}</strong>
              <span>{t("dashboard.updatingKpis")}</span>
            </div>
          </div>
        </div>
      )}
 
      {toast && (
        <div className={`demo-toast ${toast.type}`}>
          <div className="demo-toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </div>
 
          <div>
            <h4>{toast.title}</h4>
            <p>{toast.message}</p>
          </div>
        </div>
      )}
 
      <main
        className="mma-main"
        style={{
          width: "100%",
          maxWidth: 1500,
          margin: "0 auto",
          padding: "4px 0 18px",
        }}
      >
        {executiveSummaryError && !demoLoaded && (
          <div className="dashboard-state-banner">
            <DashboardDataState
              type="error"
              title={t("dashboard.liveSummaryUnavailable")}
              message={t("dashboard.liveSummaryUnavailableMessage")}
              actionLabel={t("dashboard.retryExecutiveSummary")}
              onRetry={loadExecutiveSummary}
              retrying={executiveSummaryLoading}
              compact
            />
          </div>
        )}
 
        {sharedAnalyticsError && (
          <div className="dashboard-state-banner">
            <DashboardDataState
              type="error"
              title={t("dashboard.analyticsUnavailable")}
              message={t("dashboard.analyticsUnavailableMessage")}
              actionLabel={t("dashboard.retryAnalytics")}
              onRetry={loadSharedAnalytics}
              retrying={sharedAnalyticsLoading}
              compact
            />
          </div>
        )}
 
        {/* Executive header */}
        <section className="executive-dashboard-header executive-dashboard-header--reference">
          <div className="executive-dashboard-heading">
            <div className="executive-dashboard-title-row">
              <h1>{t("dashboard.title")}</h1>
 
              <span className="status-pill green">
                {demoLoaded ? t("dashboard.demoLoaded") : t("dashboard.live")}
              </span>
            </div>
 
            <div className="executive-dashboard-breadcrumb">
              <span>{companyName}</span>
              <span className="context-separator">›</span>
              <span>{mineName}</span>
            </div>
 
            <div className="executive-dashboard-scenario">
              {demoLoaded
                ? getScenarioLabel(demoScenario)
                : isSxewOperation
                ? uiLanguage === "MN"
                  ? "SX-EW Зэсийн үйл ажиллагаа"
                  : "SX-EW Copper Operation"
                : getScenarioLabel("High Performing Mine")}
            </div>
          </div>
 
          <div className="executive-dashboard-controls executive-dashboard-controls--reference">
            <select
              className="executive-mine-select"
              value={demoScenario}
              onChange={handleScenarioChange}
              disabled={demoLoading || scenarioTransition}
              aria-label={t("dashboard.selectScenario")}
            >
              <option value="High Performing Mine">
                {t("dashboard.highPerformingMine")}
              </option>
              <option value="Fleet Breakdown">
                {t("dashboard.fleetBreakdown")}
              </option>
              <option value="Plant Bottleneck">
                {t("dashboard.plantBottleneck")}
              </option>
              <option value="Safety Incident">
                {t("dashboard.safetyIncident")}
              </option>
              <option value="Heavy Rain / Weather Delay">
                {t("dashboard.weatherDelay")}
              </option>
              <option value="Winter Operations">
                {t("dashboard.winterOperations")}
              </option>
            </select>
 
            <button
              type="button"
              className="executive-demo-button executive-demo-button--reference"
              onClick={handleLoadDemo}
              disabled={demoLoading || scenarioTransition || demoLoaded}
            >
              {demoLoading || scenarioTransition ? (
                <>
                  <span className="demo-spinner"></span>
                  {t("dashboard.updating")}
                </>
              ) : demoLoaded ? (
                <>
                  <span className="demo-loaded-icon">✓</span>
                  {t("dashboard.demoLoaded")}
                </>
              ) : (
                <>
                  <span>{t("dashboard.load")}</span>
                  <span>{t("dashboard.executive")}</span>
                  <span>{t("dashboard.demo")}</span>
                </>
              )}
            </button>
 
            {demoLoaded && (
              <button
                type="button"
                className="executive-reset-button executive-reset-button--reference"
                onClick={handleResetDemo}
                disabled={scenarioTransition}
              >
                {t("dashboard.reset")}
              </button>
            )}
 
            <div className="executive-date-card executive-date-card--reference">
              <strong>{currentDate}</strong>
              <span>{t("dashboard.dayShift")}</span>
            </div>
 
            <div className="executive-shift-card executive-shift-card--reference">
              <strong>{shiftPattern}</strong>
            </div>
          </div>
        </section>
 
        {/* Compact configuration strip */}
        <section className="executive-config-grid">
          {configurationItems.map(([label, value], index) => (
            <div
              key={label}
              style={{
                padding: "0 16px",
                textAlign: "center",
                borderRight: index < 4 ? "1px solid #e8edf4" : "none",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: 5,
                  fontSize: 12,
                  color: "#0f172a",
                  fontWeight: 900,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </section>
 
        {/* Mine health hero */}
        <section className="executive-health-grid">
          <div>
            <div
              className="executive-type-eyebrow executive-type-eyebrow--inverse"
              style={{ fontSize: 12, opacity: 0.78, fontWeight: 700 }}
            >
              {t("dashboard.overallOperationalHealth")}
            </div>
            <h2
              className="executive-type-hero-title"
              style={{
                margin: "10px 0 0",
                fontSize: 20,
                lineHeight: 1.15,
                fontWeight: 900,
              }}
            >
              {mineName}
            </h2>
 
            <div
              style={{
                marginTop: 4,
                display: "flex",
                alignItems: "baseline",
                gap: 5,
              }}
            >
              <span
                className="executive-type-health-score"
                style={{
                  fontSize: 58,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                }}
              >
                {scenarioValues.mineHealthScore}
              </span>
              <span
                className="executive-type-health-unit"
                style={{ fontSize: 18, opacity: 0.85 }}
              >
                /100
              </span>
            </div>
 
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginTop: 12,
                padding: "8px 13px",
                borderRadius: 999,
                background: "rgba(16,185,129,0.24)",
                color: "#a7f3d0",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              ↗{" "}
              {demoLoaded
                ? `${getScenarioLabel(demoScenario)} ${t("dashboard.active")}`
                : t("dashboard.versusLastWeek")}
            </div>
          </div>
 
          <div
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.10)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 16,
            }}
          >
            <FiShield style={{ fontSize: 38, color: "#6ee7b7" }} />
            <h3 style={{ margin: "10px 0 5px", fontSize: 20 }}>
              {getHealthStatusLabel(scenarioValues.healthStatus)}
            </h3>
            <p
              style={{
                margin: 0,
                maxWidth: 160,
                fontSize: 12,
                lineHeight: 1.5,
                opacity: 0.82,
              }}
            >
              {scenarioValues.mineHealthScore >= 85
                ? t("dashboard.minorRisks")
                : t("dashboard.attentionRequired")}
            </p>
          </div>
 
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                marginBottom: 8,
                fontSize: 12,
                opacity: 0.82,
                fontWeight: 800,
              }}
            >
              {t("dashboard.mineHealthTrend")}
            </div>
 
            <svg
              viewBox="0 0 340 130"
              role="img"
              aria-label={t("dashboard.mineHealthTrend")}
              style={{ width: "100%", height: 122, overflow: "visible" }}
            >
              {GRID_LINES.map((y) => (
                <line
                  key={y}
                  x1="12"
                  x2="330"
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="1"
                />
              ))}
 
              <polyline
                points={CHART_POINTS}
                fill="none"
                stroke="#6ee7b7"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
 
              {TREND_POINTS.map((value, index) => (
                <circle
                  key={`${value}-${index}`}
                  cx={index * 53 + 14}
                  cy={118 - value}
                  r="4"
                  fill="#6ee7b7"
                />
              ))}
            </svg>
 
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                opacity: 0.72,
                padding: "0 4px",
              }}
            >
              {TREND_DAYS.map((day) => (
                <span key={day}>{getTrendDayLabel(day)}</span>
              ))}
            </div>
          </div>
        </section>
 
        {/* KPI section */}
        <section style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <h2
              className="executive-type-section-title"
              style={{
                margin: 0,
                fontSize: 18,
                color: "#1d4ed8",
                fontWeight: 900,
              }}
            >
              {t("dashboard.keyPerformanceIndicators")}
            </h2>
 
            <button
              className="executive-type-section-action"
              type="button"
              onClick={handleViewAllKpis}
              style={{
                border: 0,
                background: "transparent",
                color: "#2563eb",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {t("dashboard.viewAllKpis")} <FiChevronRight />
            </button>
          </div>
 
          <div className="executive-kpi-grid">
            <ExecutiveKpiCard
              title={operationLabels.production}
              value={scenarioValues.orePerformance}
              unit="%"
              target="100%"
              icon={KPI_ICONS.ore}
              badge={demoLoaded ? t("dashboard.demo") : t("dashboard.live")}
              trend={scenarioValues.trends?.ore}
              accent="#16a34a"
              soft="#dcfce7"
              onClick={handleOpenOre}
              analysisAriaLabel={translateTemplate(t, "dashboard.openKpiAnalysis", {
                title: operationLabels.production,
              })}
              targetLabel={t("dashboard.target")}
              versusYesterdayLabel={t("dashboard.versusYesterday")}
            />

            {!isSxewOperation && (
              <ExecutiveKpiCard
                title={t("dashboard.wasteMovement")}
                value={scenarioValues.wastePerformance}
                unit="%"
                target="100%"
                icon={KPI_ICONS.waste}
                badge={demoLoaded ? t("dashboard.demo") : t("dashboard.live")}
                trend={scenarioValues.trends?.waste}
                accent="#f97316"
                soft="#ffedd5"
                onClick={handleOpenWaste}
                analysisAriaLabel={translateTemplate(t, "dashboard.openKpiAnalysis", {
                  title: t("dashboard.wasteMovement"),
                })}
                targetLabel={t("dashboard.target")}
                versusYesterdayLabel={t("dashboard.versusYesterday")}
              />
            )}

            {!isSxewOperation && (
              <ExecutiveKpiCard
                title={t("dashboard.fleetPerformance")}
                value={scenarioValues.fleetPerformance}
                unit="%"
                target="90%"
                icon={KPI_ICONS.fleet}
                badge={
                  demoLoaded && demoScenario === "Fleet Breakdown"
                    ? `${t("dashboard.availability")} 68.8%`
                    : demoLoaded
                    ? t("dashboard.demo")
                    : baseValues.fleetAvailability !== null &&
                      baseValues.fleetAvailability !== undefined
                    ? `${t("dashboard.availability")} ${Number(
                        baseValues.fleetAvailability
                      ).toFixed(1)}%`
                    : t("dashboard.live")
                }
                trend={scenarioValues.trends?.fleet}
                accent="#2563eb"
                soft="#dbeafe"
                onClick={handleOpenFleet}
                analysisAriaLabel={translateTemplate(t, "dashboard.openKpiAnalysis", {
                  title: t("dashboard.fleetPerformance"),
                })}
                targetLabel={t("dashboard.target")}
                versusYesterdayLabel={t("dashboard.versusYesterday")}
              />
            )}

            <ExecutiveKpiCard
              title={operationLabels.plant}
              value={scenarioValues.plantPerformance}
              unit="%"
              target="95%"
              icon={KPI_ICONS.plant}
              badge={
                demoLoaded
                  ? t("dashboard.demo")
                  : baseValues.plantThroughputPerformance !== null &&
                    baseValues.plantThroughputPerformance !== undefined
                  ? `${
                      isSxewOperation
                        ? uiLanguage === "MN"
                          ? "Үйлдвэрлэл"
                          : "Production"
                        : t("dashboard.throughput")
                    } ${Number(baseValues.plantThroughputPerformance).toFixed(1)}%`
                  : t("dashboard.live")
              }
              trend={scenarioValues.trends?.plant}
              accent="#7c3aed"
              soft="#ede9fe"
              onClick={handleOpenPlant}
              analysisAriaLabel={translateTemplate(t, "dashboard.openKpiAnalysis", {
                title: operationLabels.plant,
              })}
              targetLabel={t("dashboard.target")}
              versusYesterdayLabel={t("dashboard.versusYesterday")}
            />

            {isSxewOperation && (
              <ExecutiveKpiCard
                title={operationLabels.recovery}
                value={scenarioValues.recoveryPerformance}
                unit="%"
                target="77%"
                icon={KPI_ICONS.recovery}
                badge={uiLanguage === "MN" ? "Процесс KPI" : "Process KPI"}
                trend={scenarioValues.trends?.recovery || "0.0%"}
                accent="#0f766e"
                soft="#ccfbf1"
                onClick={handleOpenRecovery}
                analysisAriaLabel={translateTemplate(t, "dashboard.openKpiAnalysis", {
                  title: operationLabels.recovery,
                })}
                targetLabel={t("dashboard.target")}
                versusYesterdayLabel={t("dashboard.versusYesterday")}
              />
            )}

            <ExecutiveKpiCard
              title={operationLabels.safety}
              value={scenarioValues.safetyIncidents}
              unit=""
              target="0"
              icon={KPI_ICONS.safety}
              badge={
                demoLoaded
                  ? scenarioValues.safetyIncidents === 0
                    ? `${t("dashboard.score")} 100%`
                    : t("dashboard.actionRequired")
                  : `${t("dashboard.score")} ${Number(
                      baseValues.safetyScore ?? 0
                    ).toFixed(1)}%`
              }
              trend={scenarioValues.trends?.safety}
              accent="#ef4444"
              soft="#fee2e2"
              onClick={handleOpenSafety}
              analysisAriaLabel={translateTemplate(t, "dashboard.openKpiAnalysis", {
                title: operationLabels.safety,
              })}
              targetLabel={t("dashboard.target")}
              versusYesterdayLabel={t("dashboard.versusYesterday")}
            />
          </div>
        </section>
 
        {/* Executive decision area */}
        <section className="executive-panels-grid">
          <ExecutivePanel
            title={t("dashboard.priorityActions")}
            icon={KPI_ICONS.actions}
            badge={String(priorityActions.length)}
            actionLabel={t("dashboard.viewAllActions")}
            onAction={handleViewAllActions}
          >
            <div style={{ display: "grid", gap: 0 }}>
              {priorityActions.map((action, index) => (
                <div
                  key={action.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 10,
                    padding: "11px 0",
                    borderBottom:
                      index < priorityActions.length - 1
                        ? "1px solid #edf1f6"
                        : "none",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        lineHeight: 1.4,
                        color: "#0f172a",
                        fontWeight: 850,
                      }}
                    >
                      {action.title}
                    </div>
                    <div
                      style={{
                        marginTop: 5,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 10,
                        color: "#64748b",
                      }}
                    >
                      <FiClock />{" "}
                      {action.due === "Due Today"
                        ? t("dashboard.dueToday")
                        : action.due === "Due Tomorrow"
                        ? t("dashboard.dueTomorrow")
                        : action.due}
                    </div>
                  </div>
 
                  <span
                    style={{
                      alignSelf: "start",
                      padding: "5px 8px",
                      borderRadius: 999,
                      background:
                        action.priority === "High" ? "#fee2e2" : "#fff7ed",
                      color:
                        action.priority === "High" ? "#dc2626" : "#ea580c",
                      fontSize: 9,
                      fontWeight: 900,
                    }}
                  >
                    {getPriorityLabel(action.priority)}
                  </span>
                </div>
              ))}
            </div>
          </ExecutivePanel>
 
          <ExecutivePanel
            title={t("dashboard.aiDailyBriefing")}
            icon={KPI_ICONS.briefing}
            actionLabel={t("dashboard.viewFullBriefing")}
            onAction={handleViewFullBriefing}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#475569",
                lineHeight: 1.75,
              }}
            >
              {executiveBriefing}
            </p>
 
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 14,
                background: "#f8fafc",
                border: "1px solid #edf1f6",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#64748b",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("dashboard.leadershipFocus")}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "#0f172a",
                  fontWeight: 850,
                  lineHeight: 1.5,
                }}
              >
                {scenarioValues.priorityAction}
              </div>
            </div>
          </ExecutivePanel>
 
          <ExecutivePanel
            title={t("dashboard.riskHeatMap")}
            icon={KPI_ICONS.safety}
            actionLabel={t("dashboard.reviewRisks")}
            onAction={handleOpenMineHealth}
          >
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #edf1f6",
                color: "#475569",
                fontSize: 10,
                lineHeight: 1.55,
                fontWeight: 700,
              }}
            >
              {scenarioValues.riskMessage}
            </div>
 
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 7,
                marginBottom: 10,
                fontSize: 9,
                color: "#64748b",
                fontWeight: 800,
              }}
            >
              <span>{t("dashboard.riskLow")}</span>
              {RISK_LEVELS.map((level) => (
                <span
                  key={level}
                  style={{
                    width: 18,
                    height: 6,
                    borderRadius: 999,
                    background:
                      level === 1
                        ? "#22c55e"
                        : level === 2
                        ? "#facc15"
                        : level === 3
                        ? "#fb923c"
                        : "#ef4444",
                  }}
                />
              ))}
              <span>{t("dashboard.riskHigh")}</span>
            </div>
 
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "78px repeat(4, 1fr)",
                gap: 5,
                alignItems: "center",
              }}
            >
              <span />
              {RISK_LABELS.map((label) => (
                <span
                  key={label}
                  style={{
                    textAlign: "center",
                    fontSize: 8,
                    color: "#94a3b8",
                    fontWeight: 800,
                  }}
                >
                  {getRiskLabel(label)}
                </span>
              ))}
 
              {(isSxewOperation
                ? [
                    { label: "Production", values: [2, 0, 0, 0] },
                    { label: "Process Plant", values: [0, 2, 0, 0] },
                    { label: "Safety", values: [0, 2, 0, 0] },
                    { label: "External", values: [1, 1, 3, 4] },
                  ]
                : RISK_ROWS
              ).flatMap((row) => [
                <span
                  key={`${row.label}-label`}
                  style={{
                    fontSize: 9,
                    color: "#475569",
                    fontWeight: 800,
                  }}
                >
                  {getRiskRowLabel(row.label)}
                </span>,
                ...row.values.map((level, index) => (
                  <span
                    key={`${row.label}-${index}`}
                    style={{
                      height: 24,
                      borderRadius: 4,
                      background:
                        level === 0
                          ? "#f1f5f9"
                          : level === 1
                          ? "#22c55e"
                          : level === 2
                          ? "#facc15"
                          : level === 3
                          ? "#fb923c"
                          : "#ef4444",
                      opacity: level === 0 ? 1 : 0.9,
                    }}
                  />
                )),
              ])}
            </div>
          </ExecutivePanel>
        </section>
 
        {canViewExecutiveInsights && (
          <section style={{ marginTop: 24 }}>
            <ExecutiveInsightsPanel
              mineName={mineName}
              scenario={
                demoLoaded
                  ? demoScenario
                  : ""
              }
            />
          </section>
        )}
 
        <section style={{ marginTop: 24 }}>
          <PredictionSummaryPanel mineName={mineName} />
        </section>
 
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 6px",
            color: "#64748b",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <FaCheckCircle style={{ color: "#22c55e" }} />
          {t("dashboard.kpiHint")}
        </div>
 
        {kpiDialogOpen && (
          <Suspense
            fallback={
              <div
                className="dashboard-transition-overlay"
                role="status"
                aria-live="polite"
                aria-label={t("dashboard.loadingKpi")}
              >
                <div className="dashboard-transition-card">
                  <div className="dashboard-transition-spinner" />
 
                  <div className="dashboard-transition-copy">
                    <strong>{t("dashboard.loadingKpi")}</strong>
                    <span>{t("dashboard.preparingKpi")}</span>
                  </div>
                </div>
              </div>
            }
          >
            <ExecutiveKpiDetailDialog
              open={kpiDialogOpen}
              loading={kpiDetailLoading}
              error={kpiDetailError}
              data={kpiDetailData}
              kpiKey={selectedKpiKey}
              onClose={closeKpiDetail}
              onRetry={retryKpiDetail}
              onOpenActionCenter={openExecutiveActionCenter}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}
 
const ExecutiveKpiCard = memo(function ExecutiveKpiCard({
  title,
  value,
  unit,
  target,
  icon,
  badge,
  trend,
  accent,
  soft,
  onClick,
  analysisAriaLabel,
  targetLabel,
  versusYesterdayLabel,
}) {
  const trendValue = trend || "0.0%";
  const isDown = String(trendValue).startsWith("-");
  const isUp = String(trendValue).startsWith("+");
 
  const handleKeyDown = useCallback(
    (event) => {
      if ((event.key === "Enter" || event.key === " ") && onClick) {
        event.preventDefault();
        onClick();
      }
    },
    [onClick]
  );
 
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={{
        minWidth: 0,
        borderRadius: 18,
        border: "1px solid #e8edf4",
        background: "#ffffff",
        padding: "16px 16px 14px",
        boxShadow: "0 10px 28px rgba(15,23,42,0.055)",
        cursor: "pointer",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      aria-label={analysisAriaLabel || title}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: soft,
            color: accent,
            display: "grid",
            placeItems: "center",
            fontSize: 20,
          }}
        >
          {icon}
        </div>
 
        <FiMoreVertical style={{ color: "#64748b" }} />
      </div>
 
      <div
        className="executive-type-kpi-title"
        style={{
          marginTop: 12,
          minHeight: 34,
          color: "#64748b",
          fontSize: 12,
          fontWeight: 800,
          lineHeight: 1.35,
          textAlign: "center",
        }}
      >
        {title}
      </div>
 
      <div
        className="executive-type-kpi-badge"
        style={{
          width: "fit-content",
          maxWidth: "100%",
          margin: "8px auto 0",
          padding: "5px 9px",
          borderRadius: 999,
          background: "#f1f5f9",
          color: "#475569",
          fontSize: 9,
          fontWeight: 900,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {badge}
      </div>
 
      <div
        className="executive-type-kpi-value"
        style={{
          marginTop: 10,
          textAlign: "center",
          color: "#0f172a",
          fontSize: 30,
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: "-0.035em",
        }}
      >
        {value}
        <span
          className="executive-type-kpi-unit"
          style={{ marginLeft: 2, fontSize: 13 }}
        >
          {unit}
        </span>
      </div>
 
      <div
        className="executive-type-kpi-trend"
        style={{
          marginTop: 9,
          textAlign: "center",
          color: isDown ? "#dc2626" : isUp ? "#16a34a" : "#64748b",
          fontSize: 10,
          lineHeight: 1.45,
          fontWeight: 900,
        }}
      >
        {isDown ? "▼" : isUp ? "▲" : "→"} {trendValue} {versusYesterdayLabel}
      </div>
 
      <div
        className="executive-type-kpi-target"
        style={{
          marginTop: 6,
          textAlign: "center",
          color: "#64748b",
          fontSize: 10,
        }}
      >
        {targetLabel}: {target}
      </div>
 
      <div
        style={{
          marginTop: 12,
          height: 5,
          borderRadius: 999,
          background: "#e8eef7",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(Math.max(Number(value) || 0, 8), 100)}%`,
            height: "100%",
            borderRadius: 999,
            background: "#2563eb",
          }}
        />
      </div>
    </div>
  );
});
 
const ExecutivePanel = memo(function ExecutivePanel({
  title,
  icon,
  badge,
  actionLabel,
  onAction,
  children,
}) {
  return (
    <section
      style={{
        minHeight: 236,
        display: "flex",
        flexDirection: "column",
        borderRadius: 18,
        border: "1px solid #e8edf4",
        background: "#ffffff",
        boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          minHeight: 46,
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid #edf1f6",
        }}
      >
        <span style={{ color: "#2563eb", display: "grid", placeItems: "center" }}>
          {icon}
        </span>
        <h3
          className="executive-type-panel-title"
          style={{
            margin: 0,
            fontSize: 13,
            color: "#0f172a",
            fontWeight: 900,
          }}
        >
          {title}
        </h3>
 
        {badge && (
          <span
            style={{
              marginLeft: 2,
              minWidth: 20,
              height: 20,
              padding: "0 6px",
              borderRadius: 999,
              background: "#ef4444",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontSize: 9,
              fontWeight: 900,
            }}
          >
            {badge}
          </span>
        )}
      </div>
 
      <div style={{ flex: 1, padding: "12px 14px" }}>{children}</div>
 
      <button
        className="executive-type-panel-action"
        type="button"
        onClick={onAction}
        style={{
          alignSelf: "flex-end",
          margin: "0 12px 11px",
          border: 0,
          background: "transparent",
          color: "#2563eb",
          fontSize: 10,
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        {actionLabel} <FiChevronRight />
      </button>
    </section>
  );
});