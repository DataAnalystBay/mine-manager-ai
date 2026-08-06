import "./PredictionRecommendation.css";

import {
  FiCheckCircle,
  FiTarget,
  FiTrendingDown,
} from "react-icons/fi";


function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


function getNumericValue(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


function getRecommendationContent(
  prediction,
) {
  const kpiName =
    normalizeText(
      prediction?.kpi_name,
    );

  const trend =
    normalizeText(
      prediction?.trend,
    );

  const varianceShift3 =
    getNumericValue(
      prediction?.variance_shift_3,
    );

  const confidence =
    getNumericValue(
      prediction?.confidence,
    );

  const isDeclining =
    trend === "declining" ||
    varianceShift3 < -1;

  const isImproving =
    trend === "improving" ||
    varianceShift3 > 1;

  if (
    prediction?.data_status !==
    "Available"
  ) {
    return {
      status: "Data Required",
      statusClass: "unavailable",
      icon: <FiTarget />,
      action:
        "Load additional historical KPI data before taking forecast-based action.",
      benefit:
        "Improve forecast reliability and enable operational recommendations.",
      owner:
        "Data and Reporting Team",
    };
  }

  if (
    kpiName.includes("ore")
  ) {
    if (isDeclining) {
      return {
        status: "Priority Action",
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          "Review shovel availability, ore exposure, mining sequence, and crusher feed constraints before the next shift.",
        benefit:
          "Reduce the forecast production decline and protect ore delivery against plan.",
        owner:
          "Mining Operations",
      };
    }

    if (isImproving) {
      return {
        status: "Maintain Momentum",
        statusClass: "healthy",
        icon: <FiCheckCircle />,
        action:
          "Maintain the current ore mining sequence and monitor shovel and crusher performance.",
        benefit:
          "Sustain production performance while protecting the current operating rhythm.",
        owner:
          "Mining Operations",
      };
    }

    return {
      status: "Monitor",
      statusClass: "watch",
      icon: <FiTarget />,
      action:
        "Confirm ore exposure, shovel allocation, and crusher feed readiness for the next three shifts.",
      benefit:
        "Prevent stable performance from moving into a declining production trend.",
      owner:
        "Mining Operations",
    };
  }

  if (
    kpiName.includes("waste")
  ) {
    if (isDeclining) {
      return {
        status: "Priority Action",
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          "Review truck allocation, haul-road delays, dump access, and waste movement priorities.",
        benefit:
          "Protect waste stripping progress and reduce schedule disruption.",
        owner:
          "Mining Operations",
      };
    }

    return {
      status: "Monitor",
      statusClass: "watch",
      icon: <FiTarget />,
      action:
        "Maintain current truck allocation and continue monitoring haul-road and dump constraints.",
      benefit:
        "Keep waste movement aligned with the short-term mining plan.",
      owner:
        "Mining Operations",
    };
  }

  if (
    kpiName.includes("fleet")
  ) {
    if (isDeclining) {
      return {
        status: "Priority Action",
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          "Prioritize critical truck maintenance, review dispatch delays, and investigate utilization losses before the next shift.",
        benefit:
          "Recover fleet capacity and reduce the predicted deterioration in availability and utilization.",
        owner:
          "Maintenance and Dispatch",
      };
    }

    if (isImproving) {
      return {
        status: "Maintain Momentum",
        statusClass: "healthy",
        icon: <FiCheckCircle />,
        action:
          "Maintain current dispatch and maintenance controls while monitoring equipment reliability.",
        benefit:
          "Sustain fleet performance and protect production capacity.",
        owner:
          "Maintenance and Dispatch",
      };
    }

    return {
      status: "Monitor",
      statusClass: "watch",
      icon: <FiTarget />,
      action:
        "Review truck availability, utilization, idle time, and upcoming maintenance exposure.",
      benefit:
        "Prevent stable fleet performance from moving into decline.",
      owner:
        "Maintenance and Dispatch",
    };
  }

  if (
    kpiName.includes("plant")
  ) {
    if (isDeclining) {
      return {
        status: "Priority Action",
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          "Review throughput bottlenecks, recovery losses, feed variability, and planned plant downtime.",
        benefit:
          "Reduce the forecast performance loss and protect processing output.",
        owner:
          "Processing Operations",
      };
    }

    return {
      status: "Monitor",
      statusClass: "watch",
      icon: <FiTarget />,
      action:
        "Maintain current operating settings and monitor throughput, recovery, and feed stability.",
      benefit:
        "Sustain plant performance through the forecast period.",
      owner:
        "Processing Operations",
    };
  }

  if (
    kpiName.includes("safety")
  ) {
    if (isDeclining) {
      return {
        status: "Priority Action",
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          "Review incidents, near misses, critical-risk controls, and supervisor field verification before the next shift.",
        benefit:
          "Strengthen preventive controls and reduce exposure to high-consequence risk.",
        owner:
          "HSE and Operations",
      };
    }

    return {
      status: "Maintain Controls",
      statusClass: "healthy",
      icon: <FiCheckCircle />,
      action:
        "Maintain current critical-risk controls and continue monitoring leading safety indicators.",
      benefit:
        "Preserve strong safety performance through the forecast period.",
      owner:
        "HSE and Operations",
    };
  }

  if (
    kpiName.includes("health")
  ) {
    if (isDeclining) {
      return {
        status: "Executive Review",
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          "Review the declining KPI drivers and assign owners to the highest-risk operational constraints.",
        benefit:
          "Stabilize overall Mine Health before the decline affects multiple operating areas.",
        owner:
          "Mine Management Team",
      };
    }

    if (isImproving) {
      return {
        status: "Maintain Momentum",
        statusClass: "healthy",
        icon: <FiCheckCircle />,
        action:
          "Maintain the current operating rhythm and continue monitoring the leading KPI drivers.",
        benefit:
          "Sustain the improving Mine Health position.",
        owner:
          "Mine Management Team",
      };
    }

    return {
      status: "Monitor",
      statusClass: "watch",
      icon: <FiTarget />,
      action:
        "Review the leading KPI drivers and maintain focus on production, fleet, plant, and safety controls.",
      benefit:
        "Prevent a stable Mine Health forecast from moving into decline.",
      owner:
        "Mine Management Team",
    };
  }

  if (isDeclining) {
    return {
      status: "Priority Action",
      statusClass: "critical",
      icon: <FiTrendingDown />,
      action:
        "Review the operational drivers behind the forecast decline and assign a corrective action owner.",
      benefit:
        "Reduce the predicted KPI deterioration over the next three shifts.",
      owner:
        "Operational Owner",
    };
  }

  return {
    status:
      confidence >= 85
        ? "Monitor"
        : "Validate Forecast",
    statusClass:
      confidence >= 85
        ? "watch"
        : "unavailable",
    icon: <FiTarget />,
    action:
      confidence >= 85
        ? "Maintain current controls and monitor the KPI during the next three shifts."
        : "Validate the underlying data and review the forecast before taking action.",
    benefit:
      confidence >= 85
        ? "Protect current performance and identify early deterioration."
        : "Improve decision quality by confirming the forecast inputs.",
    owner:
      "Operational Owner",
  };
}


function PredictionRecommendation({
  prediction,
}) {
  const recommendation =
    getRecommendationContent(
      prediction || {},
    );

  return (
    <section className="prediction-recommendation">
      <header className="prediction-recommendation__header">
        <div
          className={`prediction-recommendation__icon prediction-recommendation__icon--${recommendation.statusClass}`}
        >
          {recommendation.icon}
        </div>

        <div>
          <span className="prediction-recommendation__eyebrow">
            AI Recommended Action
          </span>

          <strong
            className={`prediction-recommendation__status prediction-recommendation__status--${recommendation.statusClass}`}
          >
            {recommendation.status}
          </strong>
        </div>
      </header>

      <p className="prediction-recommendation__action">
        {recommendation.action}
      </p>

      <div className="prediction-recommendation__details">
        <div>
          <span>
            Expected benefit
          </span>

          <strong>
            {recommendation.benefit}
          </strong>
        </div>

        <div>
          <span>
            Suggested owner
          </span>

          <strong>
            {recommendation.owner}
          </strong>
        </div>
      </div>
    </section>
  );
}


export default PredictionRecommendation;