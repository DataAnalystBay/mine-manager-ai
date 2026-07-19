import React, { useState } from "react";
import { loadDemoData, resetDemoData } from "../api/demoApi";
import "./dashboard.css";
import { useConfig } from "../context/ConfigContext";

import {
  FiBarChart2,
  FiTruck,
  FiShield,
  FiCalendar,
  FiMoreVertical,
  FiPlayCircle,
} from "react-icons/fi";

import {
  FaMountain,
  FaIndustry,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

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

export default function Dashboard() {
  const { company, mine, loading } = useConfig();

  const [demoLoading, setDemoLoading] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [demoData, setDemoData] = useState(null);
  const [toast, setToast] = useState(null);
  const [demoScenario, setDemoScenario] = useState("High Performing Mine");

  const showToast = (type, title, message) => {
    setToast({ type, title, message });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleLoadDemo = async () => {
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
  };

  const handleResetDemo = async () => {
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
  };

  if (loading) {
    return <div style={{ padding: "40px" }}>Loading configuration...</div>;
  }

  const companyName = company?.company_name || "Mine Manager AI";
  const mineName = mine?.mine_name || "Demo Mine";
  const timezone = company?.timezone || "Asia/Ulaanbaatar";
  const language = company?.language || "English";
  const shiftPattern = mine?.shift_pattern || "Day / Night Shift";

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const latestProduction = demoData?.production?.at(-1);
  const latestFleet = demoData?.fleet?.slice(-5) || [];
  const latestPlant = demoData?.plant?.at(-1);
  const latestSafety = demoData?.safety?.at(-1);

  const orePerformance = latestProduction
    ? ((latestProduction.ore_actual / latestProduction.ore_plan) * 100).toFixed(
        1
      )
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

  const safetyIncidents = latestSafety ? latestSafety.recordable_incidents : 0;

  const mineHealthScore = Math.round(
    (
      Number(orePerformance) +
      Number(wastePerformance) +
      Number(fleetPerformance) +
      Number(plantPerformance) +
      (safetyIncidents === 0 ? 100 : 70)
    ) / 5
  );

  const baseValues = {
    orePerformance,
    wastePerformance,
    fleetPerformance,
    plantPerformance,
    safetyIncidents,
    mineHealthScore,
  };

  const scenarioValues = demoLoaded
    ? applyScenarioAdjustments(baseValues, demoScenario)
    : {
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

  const executiveBriefing = generateExecutiveBriefing(
    scenarioValues,
    demoScenario,
    mineName,
    demoLoaded
  );

  const severityClass =
    scenarioValues.actionSeverity === "High"
      ? "red"
      : scenarioValues.actionSeverity === "Medium"
      ? "orange"
      : "green";

  return (
    <div className="mma-dashboard">
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

      <main className="mma-main">
        <header className="mma-header">
          <div>
            <h1>Executive Command Center</h1>
            <p>
              {companyName} · Mine performance, risks, AI insights, and priority
              actions
            </p>
          </div>

          <div className="header-actions">
            <span className="status-pill green">
              {demoLoaded ? "Demo Loaded" : "Live Demo"}
            </span>

            <select
              className="scenario-select"
              value={demoScenario}
              onChange={(e) => setDemoScenario(e.target.value)}
              disabled={demoLoading || demoLoaded}
            >
              <option>High Performing Mine</option>
              <option>Fleet Breakdown</option>
              <option>Plant Bottleneck</option>
              <option>Safety Incident</option>
              <option>Heavy Rain / Weather Delay</option>
              <option>Winter Operations</option>
            </select>

            <button
              className="demo-button"
              onClick={handleLoadDemo}
              disabled={demoLoading || demoLoaded}
            >
              {demoLoading ? (
                <span className="demo-spinner"></span>
              ) : demoLoaded ? (
                <span className="demo-loaded-icon">✓</span>
              ) : (
                <FiPlayCircle />
              )}

              {demoLoading
                ? "Loading Executive Demo..."
                : demoLoaded
                ? "Demo Loaded"
                : "Load Executive Demo"}
            </button>

            {demoLoaded && (
              <button className="reset-demo-button" onClick={handleResetDemo}>
                Reset Demo
              </button>
            )}

            <button>
              {currentDate} <FiCalendar />
            </button>

            <button className="blue">{shiftPattern}</button>
          </div>
        </header>

        <section className="filter-bar">
          <div>
            <label>Company</label>
            <strong>{companyName}</strong>
          </div>

          <div>
            <label>Mine</label>
            <strong>{mineName}</strong>
          </div>

          <div>
            <label>Timezone</label>
            <strong>{timezone}</strong>
          </div>

          <div>
            <label>Language</label>
            <strong>{language}</strong>
          </div>
        </section>

        <section className="health-hero">
          <div>
            <p>Overall Operational Health</p>
            <h3>{mineName}</h3>

            <div className="health-score">
              {scenarioValues.mineHealthScore}
              <span>/100</span>
            </div>

            <span className="score-change">
              {demoLoaded ? `↗ ${demoScenario} active` : "↗ +3 vs last week"}
            </span>
          </div>

          <div className="health-status">
            <FiShield />
            <h3>{scenarioValues.healthStatus}</h3>
            <p>
              {scenarioValues.mineHealthScore >= 85
                ? "Minor operational risks detected"
                : "Operational attention required"}
            </p>
          </div>

          <div className="health-progress">
            <p>Mine Health Score</p>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${scenarioValues.mineHealthScore}%` }}
              ></div>
            </div>
          </div>
        </section>

        <section className="card-section">
          <div className="section-title">
            <h2>Key Performance Indicators</h2>
            <a>View All KPIs</a>
          </div>

          <div className="kpi-grid">
            <KpiCard
              title="Ore Performance"
              value={scenarioValues.orePerformance}
              unit="%"
              target="100%"
              type="green"
              icon={<FiBarChart2 />}
              badge={demoLoaded ? "Demo" : "Live"}
              trend={scenarioValues.trends?.ore}
            />

            <KpiCard
              title="Waste Movement"
              value={scenarioValues.wastePerformance}
              unit="%"
              target="100%"
              type="orange"
              icon={<FaMountain />}
              badge={
                demoScenario === "Heavy Rain / Weather Delay" && demoLoaded
                  ? "Road Impact"
                  : demoScenario === "Winter Operations" && demoLoaded
                  ? "Cold Weather"
                  : demoLoaded
                  ? "Demo"
                  : "Live"
              }
              trend={scenarioValues.trends?.waste}
            />

            <KpiCard
              title="Fleet Performance"
              value={scenarioValues.fleetPerformance}
              unit="%"
              target="90%"
              type="blue"
              icon={<FiTruck />}
              badge={
                demoScenario === "Fleet Breakdown" && demoLoaded
                  ? "Breakdown"
                  : demoScenario === "Heavy Rain / Weather Delay" && demoLoaded
                  ? "Weather Delay"
                  : demoScenario === "Winter Operations" && demoLoaded
                  ? "Winter Impact"
                  : demoLoaded
                  ? "Demo Fleet"
                  : "Avail 91%"
              }
              trend={scenarioValues.trends?.fleet}
            />

            <KpiCard
              title="Plant Performance"
              value={scenarioValues.plantPerformance}
              unit="%"
              target="95%"
              type="purple"
              icon={<FaIndustry />}
              badge={
                demoScenario === "Plant Bottleneck" && demoLoaded
                  ? "Bottleneck"
                  : demoLoaded
                  ? "Demo Plant"
                  : "Throughput 99.5%"
              }
              trend={scenarioValues.trends?.plant}
            />

            <KpiCard
              title="Safety Incidents"
              value={scenarioValues.safetyIncidents}
              unit=""
              target="0"
              type="red"
              icon={<FiShield />}
              badge={
                scenarioValues.safetyIncidents === 0
                  ? "Score 100%"
                  : "Action Required"
              }
              trend={scenarioValues.trends?.safety}
            />
          </div>
        </section>

        <section className="two-column">
          <div className="info-card">
            <div className="card-heading">
              <h2>✨ AI Daily Briefing</h2>

              <span className="status-pill green">
                {demoLoaded ? "Demo Active" : "Live"}
              </span>
            </div>

            <p>{executiveBriefing}</p>

            <hr />

            <h3>
              <FaCheckCircle className="green-icon" /> Priority Actions
            </h3>

            <p>{scenarioValues.priorityAction}</p>

            <hr />

            <h3>
              <FaExclamationTriangle className="orange-icon" /> Operational Risks
            </h3>

            <p>{scenarioValues.riskMessage}</p>
          </div>

          <div className="info-card">
            <div className="card-heading">
              <h2>Executive Priority Actions</h2>
              <a>View All</a>
            </div>

            <div className="action-box">
              <div>
                <h3>{scenarioValues.priorityAction}</h3>
                <p>Owner: General Manager / Superintendents</p>
              </div>

              <span className={`status-pill ${severityClass}`}>
                {scenarioValues.actionSeverity}
              </span>
            </div>

            <p className="muted">
              {demoLoaded
                ? `Recommended actions generated from ${demoScenario}`
                : "Recommended actions"}
            </p>
          </div>
        </section>

        <footer className="mma-footer">
          Last updated:{" "}
          {demoLoaded ? `${demoScenario} loaded now` : "Live dashboard view"} ·
          Auto refresh: 60s · Config loaded from PostgreSQL
        </footer>
      </main>
    </div>
  );
}

function KpiCard({ title, value, unit, target, icon, badge, type, trend }) {
  const trendValue = trend || "0.0%";

  const trendClass = String(trendValue).startsWith("-")
    ? "down"
    : String(trendValue).startsWith("+")
    ? "up"
    : "flat";

  const trendIcon = String(trendValue).startsWith("-")
    ? "▼"
    : String(trendValue).startsWith("+")
    ? "▲"
    : "➜";

  return (
    <div className={`kpi-card ${type}`}>
      <div className="kpi-top">
        <div className="kpi-icon">{icon}</div>
        <FiMoreVertical />
      </div>

      <p>{title}</p>

      <span className="kpi-badge">{badge}</span>

      <h3>
        {value}
        <small>{unit}</small>
      </h3>

      <p className={`kpi-trend ${trendClass}`}>
        {trendIcon} {trendValue} vs yesterday
      </p>

      <p className="muted">Target: {target}</p>

      <div className="mini-progress">
        <div></div>
      </div>
    </div>
  );
}