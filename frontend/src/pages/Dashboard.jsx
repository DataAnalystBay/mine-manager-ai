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
import "./dashboard.css";
import { useConfig } from "../context/ConfigContext";
import { getSharedAnalytics } from "../services/dashboardApi";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import DashboardDataState from "../components/dashboard/DashboardDataState";

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
  safety: <FiShield />,
  actions: <FaCheckCircle />,
  briefing: <FiActivity />,
  risk: <FiShield />,
});

function applyScenarioAdjustments(baseValues, scenario) {
  if (scenario === "High Performing Mine") {
    return {
      ...baseValues,
      orePerformance: "104.2",
      wastePerformance: "102.6",
      fleetPerformance: "91.5",
      plantPerformance: "97.2",
      safetyIncidents: 0,
      mineHealthScore: 95,
      priorityAction:
        "Maintain high performance while monitoring fatigue and equipment stress",
      riskMessage:
        "Mine is exceeding plan across key operating areas. Main risk is sustaining performance without increasing fatigue or equipment wear.",
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
      fleetPerformance: "72.5",
      mineHealthScore: Math.max(baseValues.mineHealthScore - 12, 0),
      priorityAction:
        "Recover fleet availability and assign maintenance recovery plan",
      riskMessage:
        "Fleet utilization has dropped due to equipment breakdown risk. Haulage capacity requires immediate attention.",
      healthStatus: "Watch",
      actionSeverity: "Medium",
      trends: {
        ore: "-5.8%",
        waste: "-7.2%",
        fleet: "-14.5%",
        plant: "-1.2%",
        safety: "0",
      },
    };
  }

  if (scenario === "Plant Bottleneck") {
    return {
      ...baseValues,
      plantPerformance: "81.8",
      mineHealthScore: Math.max(baseValues.mineHealthScore - 10, 0),
      priorityAction: "Review crusher and mill bottleneck constraints",
      riskMessage:
        "Plant throughput is below target. Processing bottleneck may impact daily production delivery.",
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
      priorityAction:
        "Complete safety incident review and corrective action verification",
      riskMessage:
        "A recordable safety incident has been detected. Immediate leadership review is required.",
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
      priorityAction:
        "Adjust mine plan for weather delay and prioritize safe haul road recovery",
      riskMessage:
        "Heavy rain is reducing haul road conditions, lowering fleet productivity and delaying waste movement. Focus on road maintenance, water management, and safe operating controls.",
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
      priorityAction:
        "Stabilize winter operating rhythm and confirm cold-weather equipment readiness",
      riskMessage:
        "Winter conditions are reducing equipment productivity and haulage efficiency. Main risks include cold starts, icy haul roads, reduced shift productivity, and increased maintenance demand.",
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
    priorityAction: "Maintain current operating discipline",
    riskMessage: "No major operational risks detected from current demo data.",
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

function generateExecutiveBriefing(values, scenario, mineName, demoLoaded) {
  if (!demoLoaded) {
    return `${mineName} is currently operating with a Mine Health Score of ${values.mineHealthScore}. Ore performance is ${values.orePerformance}%, waste movement is ${values.wastePerformance}%, fleet utilization is ${values.fleetPerformance}%, plant performance is ${values.plantPerformance}%, and safety incidents are ${values.safetyIncidents}.`;
  }

  if (scenario === "High Performing Mine") {
    return `${scenario}: ${mineName} is exceeding plan across major operating areas with a Mine Health Score of ${values.mineHealthScore}. Ore improved ${values.trends.ore}, waste improved ${values.trends.waste}, and fleet performance remains strong. Leadership should focus on sustaining discipline while monitoring fatigue, equipment stress, and overproduction risk.`;
  }

  if (scenario === "Fleet Breakdown") {
    return `${scenario}: ${mineName} is experiencing reduced haulage capacity. Fleet utilization has fallen to ${values.fleetPerformance}%, down ${values.trends.fleet} versus yesterday. Maintenance recovery planning and equipment availability should be treated as today’s operating priority.`;
  }

  if (scenario === "Plant Bottleneck") {
    return `${scenario}: Processing performance is constraining the operation. Plant performance has fallen to ${values.plantPerformance}%, down ${values.trends.plant} versus yesterday. The immediate focus should be crusher, mill, and throughput constraint recovery.`;
  }

  if (scenario === "Safety Incident") {
    return `${scenario}: A recordable safety incident has been detected. Leadership focus should shift immediately to incident review, corrective action verification, and visible field leadership.`;
  }

  if (scenario === "Heavy Rain / Weather Delay") {
    return `${scenario}: Operations are under weather-related pressure. Ore delivery and waste movement are below plan, with waste movement down ${values.trends.waste} versus yesterday. Leadership should prioritize road recovery, water management, and safe operating controls.`;
  }

  if (scenario === "Winter Operations") {
    return `${scenario}: ${mineName} is operating under cold-weather constraints. Fleet productivity is down ${values.trends.fleet}, and waste movement is below plan. Leadership should focus on cold-start readiness, haul road ice controls, shift productivity, and maintenance response capacity.`;
  }

  return `${mineName} is operating within expected demo thresholds. Continue monitoring production, fleet, plant, safety, and workforce indicators.`;
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

function buildKpiDetail(kpiKey, values, scenario, mineName, isDemoLoaded) {
  const definitions = {
    ore: {
      kpi_name: "Ore Performance",
      current_value: values.orePerformance,
      target: 100,
      unit: "%",
      change: values.trends?.ore,
      higher_is_better: true,
      top_drivers: [
        "Ore delivery against the daily mine plan",
        "Fleet availability and loading-unit productivity",
        "Crusher feed continuity and material quality",
      ],
      recommendations: [
        "Protect the highest-value ore movements in the next shift plan.",
        "Review loading and hauling constraints during the daily operating review.",
        "Confirm crusher feed continuity and stockpile readiness.",
      ],
    },
    waste: {
      kpi_name: "Waste Movement",
      current_value: values.wastePerformance,
      target: 100,
      unit: "%",
      change: values.trends?.waste,
      higher_is_better: true,
      top_drivers: [
        "Haul road conditions and travel-cycle efficiency",
        "Waste fleet allocation and dispatch discipline",
        "Dump availability and dozer support",
      ],
      recommendations: [
        "Prioritize constrained waste routes and restore haul-road conditions.",
        "Rebalance trucks between ore and waste based on the shift bottleneck.",
        "Confirm dump capacity and dozer coverage before the next shift.",
      ],
    },
    fleet: {
      kpi_name: "Fleet Performance",
      current_value: values.fleetPerformance,
      target: 90,
      unit: "%",
      change: values.trends?.fleet,
      higher_is_better: true,
      top_drivers: [
        "Mobile-equipment availability and unplanned downtime",
        "Queue time, idle time, and dispatch effectiveness",
        "Operator coverage and shift-change losses",
      ],
      recommendations: [
        "Assign owners to the top equipment downtime events.",
        "Review dispatch exceptions and excessive queue time.",
        "Protect fleet availability through the next maintenance window.",
      ],
    },
    plant: {
      kpi_name: "Plant Performance",
      current_value: values.plantPerformance,
      target: 95,
      unit: "%",
      change: values.trends?.plant,
      higher_is_better: true,
      top_drivers: [
        "Crusher and mill operating availability",
        "Feed continuity, blend stability, and ore characteristics",
        "Planned and unplanned processing delays",
      ],
      recommendations: [
        "Review the largest throughput loss with the processing superintendent.",
        "Stabilize feed blend and stockpile replenishment.",
        "Confirm recovery actions for the next constrained plant asset.",
      ],
    },
    safety: {
      kpi_name: "Safety Incidents",
      current_value: values.safetyIncidents,
      target: 0,
      unit: "",
      change: values.trends?.safety,
      higher_is_better: false,
      top_drivers: [
        "Critical-control verification and field leadership",
        "Changes in operating conditions and task risk",
        "Quality and closure of corrective actions",
      ],
      recommendations: [
        "Verify critical controls for the next shift's highest-risk activities.",
        "Escalate overdue safety actions to the responsible leader.",
        "Confirm visible field leadership in active work areas.",
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

  return {
    ...definition,
    period_label: "Last 7 Days",
    change: changePercent,
    change_percent: changePercent,
    direction: changePercent > 0 ? "up" : changePercent < 0 ? "down" : "flat",
    daily_values: createDailyValues(
      definition.current_value,
      changePercent,
      kpiKey === "safety" ? 0 : 0
    ),
    executive_insight: `${mineName} ${definition.kpi_name.toLowerCase()} is currently ${definition.current_value}${definition.unit} against a target of ${definition.target}${definition.unit}. Under the ${scenario} scenario, the main leadership focus is to protect operating discipline while addressing the most material constraint reflected in this KPI.`,
    forecast:
      riskLevel === "high"
        ? "Without immediate corrective action, this KPI may continue to weaken during the next operating period."
        : riskLevel === "medium"
        ? "Performance can recover toward target if the recommended actions are completed during the next shift cycle."
        : "Current performance is expected to remain stable if operating controls and planned actions are sustained.",
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
    "safety",
    "mine_health",
  ].includes(normalizeKpiKey(kpiKey));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedKpiKey = normalizeKpiKey(searchParams.get("kpi_key") || "");
  const { company, mine, loading } = useConfig();

  const [demoLoading, setDemoLoading] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [demoData, setDemoData] = useState(null);
  const [toast, setToast] = useState(null);
  const [demoScenario, setDemoScenario] = useState("High Performing Mine");
  const [scenarioTransition, setScenarioTransition] = useState(false);
  const [scenarioTransitionLabel, setScenarioTransitionLabel] = useState(
    "Updating executive dashboard"
  );

  const [sharedAnalytics, setSharedAnalytics] = useState(null);
  const [sharedAnalyticsLoading, setSharedAnalyticsLoading] = useState(true);
  const [sharedAnalyticsError, setSharedAnalyticsError] = useState("");

  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [kpiDetailLoading, setKpiDetailLoading] = useState(false);
  const [kpiDetailError, setKpiDetailError] = useState("");
  const [kpiDetailData, setKpiDetailData] = useState(null);
  const [selectedKpiKey, setSelectedKpiKey] = useState(null);

  const kpiDetailTimerRef = useRef(null);
  const kpiDialogClosingRef = useRef(false);

  const companyName = company?.company_name || "Mine Manager AI";
  const mineName = mine?.mine_name || "Demo Mine";
  const timezone = company?.timezone || "Asia/Ulaanbaatar";
  const language = company?.language || "English";
  const shiftPattern = mine?.shift_pattern || "Day / Night Shift";

  const currentDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  const lastUpdated = useMemo(
    () =>
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [demoData, sharedAnalytics, demoScenario]
  );

  const showToast = useCallback((type, title, message) => {
    setToast({ type, title, message });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  const runScenarioTransition = useCallback(
    async ({
      label = "Updating executive dashboard",
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
    [scenarioTransition]
  );

  const handleScenarioChange = useCallback(
    async (event) => {
      const selectedScenario = event.target.value;

      if (selectedScenario === demoScenario || scenarioTransition) {
        return;
      }

      await runScenarioTransition({
        label: `Applying ${selectedScenario} scenario`,
        minimumDuration: 650,
        action: async () => {
          setDemoScenario(selectedScenario);

          await new Promise((resolve) => {
            window.setTimeout(resolve, 180);
          });
        },
      });
    },
    [demoScenario, runScenarioTransition, scenarioTransition]
  );

  const handleLoadDemo = useCallback(async () => {
    await runScenarioTransition({
      label: `Loading ${demoScenario} scenario`,
      minimumDuration: 850,
      action: async () => {
        try {
          setDemoLoading(true);

          const result = await loadDemoData();
          console.log("Demo data loaded:", result);

          setDemoData(result.data);
          setDemoLoaded(true);

          showToast(
            "success",
            "Executive Demo Loaded",
            `${demoScenario} scenario loaded successfully.`
          );
        } catch (error) {
          console.error("Demo load failed:", error);

          showToast(
            "error",
            "Demo Load Failed",
            "Please check backend connection and try again."
          );
        } finally {
          setDemoLoading(false);
        }
      },
    });
  }, [demoScenario, runScenarioTransition, showToast]);

  const handleResetDemo = useCallback(async () => {
    await runScenarioTransition({
      label: "Restoring live dashboard view",
      minimumDuration: 700,
      action: async () => {
        try {
          await resetDemoData();

          setDemoData(null);
          setDemoLoaded(false);
          setDemoScenario("High Performing Mine");

          showToast(
            "success",
            "Demo Reset",
            "Dashboard has been restored to default live view."
          );
        } catch (error) {
          console.error("Demo reset failed:", error);

          showToast(
            "error",
            "Reset Failed",
            "Please check backend connection and try again."
          );
        }
      },
    });
  }, [runScenarioTransition, showToast]);

  const loadSharedAnalytics = useCallback(async () => {
    try {
      setSharedAnalyticsLoading(true);
      setSharedAnalyticsError("");

      const data = await getSharedAnalytics(mineName, 7);
      setSharedAnalytics(data);
    } catch (error) {
      console.error("Shared analytics load failed:", error);
      setSharedAnalyticsError("Unable to load shared analytics.");
    } finally {
      setSharedAnalyticsLoading(false);
    }
  }, [mineName]);

  useEffect(() => {
    loadSharedAnalytics();
  }, [loadSharedAnalytics]);

  const baseValues = useMemo(() => {
    const latestProduction = demoData?.production?.at(-1);
    const latestFleet = demoData?.fleet?.slice(-5) || [];
    const latestPlant = demoData?.plant?.at(-1);
    const latestSafety = demoData?.safety?.at(-1);

    const orePerformance = latestProduction
      ? (
          (latestProduction.ore_actual / latestProduction.ore_plan) *
          100
        ).toFixed(1)
      : "100.5";

    const wastePerformance = latestProduction
      ? (
          (latestProduction.waste_actual / latestProduction.waste_plan) *
          100
        ).toFixed(1)
      : "100.2";

    const fleetPerformance = latestFleet.length
      ? (
          latestFleet.reduce((sum, item) => sum + item.utilization, 0) /
          latestFleet.length
        ).toFixed(1)
      : "90";

    const plantPerformance = latestPlant
      ? (
          (latestPlant.throughput_actual / latestPlant.throughput_plan) *
          100
        ).toFixed(1)
      : "96.1";

    const safetyIncidents = latestSafety
      ? latestSafety.recordable_incidents
      : 0;

    const mineHealthScore = Math.round(
      (Number(orePerformance) +
        Number(wastePerformance) +
        Number(fleetPerformance) +
        Number(plantPerformance) +
        (safetyIncidents === 0 ? 100 : 70)) /
        5
    );

    return {
      orePerformance,
      wastePerformance,
      fleetPerformance,
      plantPerformance,
      safetyIncidents,
      mineHealthScore,
    };
  }, [demoData]);

  const scenarioValues = useMemo(() => {
    if (demoLoaded) {
      return applyScenarioAdjustments(baseValues, demoScenario);
    }

    return {
      ...baseValues,
      priorityAction: "Maintain current operating discipline",
      riskMessage:
        "No major operational risks detected from current KPI thresholds.",
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
  }, [baseValues, demoLoaded, demoScenario]);

  const executiveBriefing = useMemo(
    () =>
      generateExecutiveBriefing(
        scenarioValues,
        demoScenario,
        mineName,
        demoLoaded
      ),
    [scenarioValues, demoScenario, mineName, demoLoaded]
  );

  const openKpiDetail = useCallback(
    (kpiKey) => {
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

      if (kpiDetailTimerRef.current) {
        window.clearTimeout(kpiDetailTimerRef.current);
        kpiDetailTimerRef.current = null;
      }

      setSelectedKpiKey(normalizedKpiKey);
      setKpiDialogOpen(true);
      setKpiDetailLoading(true);
      setKpiDetailError("");
      setKpiDetailData(null);

      kpiDetailTimerRef.current = window.setTimeout(() => {
        try {
          const detail = buildKpiDetail(
            normalizedKpiKey,
            scenarioValues,
            demoScenario,
            mineName,
            demoLoaded
          );
          setKpiDetailData(detail);
        } catch (error) {
          console.error("KPI detail build failed:", error);
          setKpiDetailError("Unable to prepare the KPI analysis.");
        } finally {
          setKpiDetailLoading(false);
          kpiDetailTimerRef.current = null;
        }
      }, 450);
    },
    [
      demoLoaded,
      demoScenario,
      mineName,
      requestedKpiKey,
      scenarioValues,
      searchParams,
      setSearchParams,
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

    if (kpiDetailTimerRef.current) {
      window.clearTimeout(kpiDetailTimerRef.current);
      kpiDetailTimerRef.current = null;
    }

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

  useEffect(() => {
    return () => {
      if (kpiDetailTimerRef.current) {
        window.clearTimeout(kpiDetailTimerRef.current);
        kpiDetailTimerRef.current = null;
      }
    };
  }, []);

  const retryKpiDetail = useCallback(() => {
    if (selectedKpiKey) {
      openKpiDetail(selectedKpiKey);
    }
  }, [openKpiDetail, selectedKpiKey]);

  const openExecutiveActionCenter = useCallback(
    (kpiKey) => {
      const activeKpiKey = kpiKey || selectedKpiKey;

      kpiDialogClosingRef.current = true;

      if (kpiDetailTimerRef.current) {
        window.clearTimeout(kpiDetailTimerRef.current);
        kpiDetailTimerRef.current = null;
      }

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

  const priorityActions = useMemo(
    () => [
      {
        id: "scenario-priority",
        title: scenarioValues.priorityAction,
        priority: scenarioValues.actionSeverity,
        due: "Due Today",
      },
      {
        id: "loading-constraints",
        title: "Review loading constraints during the daily operating review",
        priority: "Medium",
        due: "Due Tomorrow",
      },
      {
        id: "maintenance-recovery",
        title: "Confirm maintenance recovery plan for critical equipment",
        priority: "Medium",
        due: "Due Jul 24",
      },
    ],
    [scenarioValues.actionSeverity, scenarioValues.priorityAction]
  );

  const configurationItems = useMemo(
    () => [
      ["Company", companyName],
      ["Mine", mineName],
      ["Timezone", timezone],
      ["Language", language],
      ["Last Updated", lastUpdated],
    ],
    [companyName, mineName, timezone, language, lastUpdated]
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
              <span>Updating executive KPIs and operational insights</span>
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
        {sharedAnalyticsError && (
          <div className="dashboard-state-banner">
            <DashboardDataState
              type="error"
              title="Live analytics connection unavailable"
              message="The Dashboard is displaying its current executive view, but the latest shared analytics could not be retrieved."
              actionLabel="Retry analytics"
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
              <h1>Executive Command Center</h1>

              <span className="status-pill green">
                {demoLoaded ? "Demo Loaded" : "Live"}
              </span>
            </div>

            <div className="executive-dashboard-breadcrumb">
              <span>{companyName}</span>
              <span className="context-separator">›</span>
              <span>{mineName}</span>
            </div>

            <div className="executive-dashboard-scenario">
              {demoLoaded ? demoScenario : "High Performing Mine"}
            </div>
          </div>

          <div className="executive-dashboard-controls executive-dashboard-controls--reference">
            <select
              className="executive-mine-select"
              value={demoScenario}
              onChange={handleScenarioChange}
              disabled={demoLoading || scenarioTransition}
              aria-label="Select executive demo scenario"
            >
              <option>High Performing Mine</option>
              <option>Fleet Breakdown</option>
              <option>Plant Bottleneck</option>
              <option>Safety Incident</option>
              <option>Heavy Rain / Weather Delay</option>
              <option>Winter Operations</option>
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
                  Updating...
                </>
              ) : demoLoaded ? (
                <>
                  <span className="demo-loaded-icon">✓</span>
                  Demo Loaded
                </>
              ) : (
                <>
                  <span>Load</span>
                  <span>Executive</span>
                  <span>Demo</span>
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
                Reset
              </button>
            )}

            <div className="executive-date-card executive-date-card--reference">
              <strong>{currentDate}</strong>
              <span>Day Shift</span>
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
            <div style={{ fontSize: 12, opacity: 0.78, fontWeight: 700 }}>
              Overall Operational Health
            </div>
            <h2
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
                style={{
                  fontSize: 58,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                }}
              >
                {scenarioValues.mineHealthScore}
              </span>
              <span style={{ fontSize: 18, opacity: 0.85 }}>/100</span>
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
              ↗ {demoLoaded ? `${demoScenario} active` : "+3 vs last week"}
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
              {scenarioValues.healthStatus}
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
                ? "Minor operational risks detected"
                : "Operational attention required"}
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
              Mine Health Score Trend (7 Days)
            </div>

            <svg
              viewBox="0 0 340 130"
              role="img"
              aria-label="Seven day mine health score trend"
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
                <span key={day}>{day}</span>
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
              style={{
                margin: 0,
                fontSize: 18,
                color: "#1d4ed8",
                fontWeight: 900,
              }}
            >
              Key Performance Indicators
            </h2>

            <button
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
              View All KPIs <FiChevronRight />
            </button>
          </div>

          <div className="executive-kpi-grid">
            <ExecutiveKpiCard
              title="Ore Performance"
              value={scenarioValues.orePerformance}
              unit="%"
              target="100%"
              icon={KPI_ICONS.ore}
              badge={demoLoaded ? "Demo" : "Live"}
              trend={scenarioValues.trends?.ore}
              accent="#16a34a"
              soft="#dcfce7"
              onClick={handleOpenOre}
            />

            <ExecutiveKpiCard
              title="Waste Movement"
              value={scenarioValues.wastePerformance}
              unit="%"
              target="100%"
              icon={KPI_ICONS.waste}
              badge={demoLoaded ? "Demo" : "Live"}
              trend={scenarioValues.trends?.waste}
              accent="#f97316"
              soft="#ffedd5"
              onClick={handleOpenWaste}
            />

            <ExecutiveKpiCard
              title="Fleet Performance"
              value={scenarioValues.fleetPerformance}
              unit="%"
              target="90%"
              icon={KPI_ICONS.fleet}
              badge="Avail 91%"
              trend={scenarioValues.trends?.fleet}
              accent="#2563eb"
              soft="#dbeafe"
              onClick={handleOpenFleet}
            />

            <ExecutiveKpiCard
              title="Plant Performance"
              value={scenarioValues.plantPerformance}
              unit="%"
              target="95%"
              icon={KPI_ICONS.plant}
              badge="Throughput 99.5%"
              trend={scenarioValues.trends?.plant}
              accent="#7c3aed"
              soft="#ede9fe"
              onClick={handleOpenPlant}
            />

            <ExecutiveKpiCard
              title="Safety Incidents"
              value={scenarioValues.safetyIncidents}
              unit=""
              target="0"
              icon={KPI_ICONS.safety}
              badge={
                scenarioValues.safetyIncidents === 0
                  ? "Score 100%"
                  : "Action Required"
              }
              trend={scenarioValues.trends?.safety}
              accent="#ef4444"
              soft="#fee2e2"
              onClick={handleOpenSafety}
            />
          </div>
        </section>

        {/* Executive decision area */}
        <section className="executive-panels-grid">
          <ExecutivePanel
            title="Executive Priority Actions"
            icon={KPI_ICONS.actions}
            badge="3"
            actionLabel="View All Actions"
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
                      <FiClock /> {action.due}
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
                    {action.priority}
                  </span>
                </div>
              ))}
            </div>
          </ExecutivePanel>

          <ExecutivePanel
            title="AI Daily Briefing"
            icon={KPI_ICONS.briefing}
            actionLabel="View Full Briefing"
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
                Leadership Focus
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
            title="Risk Heat Map"
            icon={KPI_ICONS.safety}
            actionLabel="Review Risks"
            onAction={handleOpenMineHealth}
          >
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
              <span>LOW</span>
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
              <span>HIGH</span>
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
                  {label}
                </span>
              ))}

              {RISK_ROWS.flatMap((row) => [
                <span
                  key={`${row.label}-label`}
                  style={{
                    fontSize: 9,
                    color: "#475569",
                    fontWeight: 800,
                  }}
                >
                  {row.label}
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
          Click any KPI card to drill down into detailed analysis, insights, and
          related executive actions.
        </div>

        {kpiDialogOpen && (
          <Suspense
            fallback={
              <div
                className="dashboard-transition-overlay"
                role="status"
                aria-live="polite"
                aria-label="Loading KPI analysis"
              >
                <div className="dashboard-transition-card">
                  <div className="dashboard-transition-spinner" />

                  <div className="dashboard-transition-copy">
                    <strong>Loading KPI analysis</strong>
                    <span>Preparing executive trends and insights</span>
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
      aria-label={`Open ${title} analysis`}
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
        <span style={{ marginLeft: 2, fontSize: 13 }}>{unit}</span>
      </div>

      <div
        style={{
          marginTop: 9,
          textAlign: "center",
          color: isDown ? "#dc2626" : isUp ? "#16a34a" : "#64748b",
          fontSize: 10,
          lineHeight: 1.45,
          fontWeight: 900,
        }}
      >
        {isDown ? "▼" : isUp ? "▲" : "→"} {trendValue} vs yesterday
      </div>

      <div
        style={{
          marginTop: 6,
          textAlign: "center",
          color: "#64748b",
          fontSize: 10,
        }}
      >
        Target: {target}
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
