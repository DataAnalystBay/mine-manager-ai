import { useLanguage } from "../../context/LanguageContext";

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
  t,
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
      status: t("predictionRecommendation.status.dataRequired"),
      statusClass: "unavailable",
      icon: <FiTarget />,
      action:
        t("predictionRecommendation.dataRequired.action"),
      benefit:
        t("predictionRecommendation.dataRequired.benefit"),
      owner:
        t("predictionRecommendation.owner.dataReporting"),
    };
  }

  if (
    kpiName.includes("ore")
  ) {
    if (isDeclining) {
      return {
        status: t("predictionRecommendation.status.priorityAction"),
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          t("predictionRecommendation.ore.declining.action"),
        benefit:
          t("predictionRecommendation.ore.declining.benefit"),
        owner:
          t("predictionRecommendation.owner.miningOperations"),
      };
    }

    if (isImproving) {
      return {
        status: t("predictionRecommendation.status.maintainMomentum"),
        statusClass: "healthy",
        icon: <FiCheckCircle />,
        action:
          t("predictionRecommendation.ore.improving.action"),
        benefit:
          t("predictionRecommendation.ore.improving.benefit"),
        owner:
          t("predictionRecommendation.owner.miningOperations"),
      };
    }

    return {
      status: t("predictionRecommendation.status.monitor"),
      statusClass: "watch",
      icon: <FiTarget />,
      action:
        t("predictionRecommendation.ore.stable.action"),
      benefit:
        t("predictionRecommendation.ore.stable.benefit"),
      owner:
        t("predictionRecommendation.owner.miningOperations"),
    };
  }

  if (
    kpiName.includes("waste")
  ) {
    if (isDeclining) {
      return {
        status: t("predictionRecommendation.status.priorityAction"),
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          t("predictionRecommendation.waste.declining.action"),
        benefit:
          t("predictionRecommendation.waste.declining.benefit"),
        owner:
          t("predictionRecommendation.owner.miningOperations"),
      };
    }

    return {
      status: t("predictionRecommendation.status.monitor"),
      statusClass: "watch",
      icon: <FiTarget />,
      action:
        t("predictionRecommendation.waste.stable.action"),
      benefit:
        t("predictionRecommendation.waste.stable.benefit"),
      owner:
        t("predictionRecommendation.owner.miningOperations"),
    };
  }

  if (
    kpiName.includes("fleet")
  ) {
    if (isDeclining) {
      return {
        status: t("predictionRecommendation.status.priorityAction"),
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          t("predictionRecommendation.fleet.declining.action"),
        benefit:
          t("predictionRecommendation.fleet.declining.benefit"),
        owner:
          t("predictionRecommendation.owner.maintenanceDispatch"),
      };
    }

    if (isImproving) {
      return {
        status: t("predictionRecommendation.status.maintainMomentum"),
        statusClass: "healthy",
        icon: <FiCheckCircle />,
        action:
          t("predictionRecommendation.fleet.improving.action"),
        benefit:
          t("predictionRecommendation.fleet.improving.benefit"),
        owner:
          t("predictionRecommendation.owner.maintenanceDispatch"),
      };
    }

    return {
      status: t("predictionRecommendation.status.monitor"),
      statusClass: "watch",
      icon: <FiTarget />,
      action:
        t("predictionRecommendation.fleet.stable.action"),
      benefit:
        t("predictionRecommendation.fleet.stable.benefit"),
      owner:
        t("predictionRecommendation.owner.maintenanceDispatch"),
    };
  }

  if (
    kpiName.includes("plant")
  ) {
    if (isDeclining) {
      return {
        status: t("predictionRecommendation.status.priorityAction"),
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          t("predictionRecommendation.plant.declining.action"),
        benefit:
          t("predictionRecommendation.plant.declining.benefit"),
        owner:
          t("predictionRecommendation.owner.processingOperations"),
      };
    }

    return {
      status: t("predictionRecommendation.status.monitor"),
      statusClass: "watch",
      icon: <FiTarget />,
      action:
        t("predictionRecommendation.plant.stable.action"),
      benefit:
        t("predictionRecommendation.plant.stable.benefit"),
      owner:
        t("predictionRecommendation.owner.processingOperations"),
    };
  }

  if (
    kpiName.includes("safety")
  ) {
    if (isDeclining) {
      return {
        status: t("predictionRecommendation.status.priorityAction"),
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          t("predictionRecommendation.safety.declining.action"),
        benefit:
          t("predictionRecommendation.safety.declining.benefit"),
        owner:
          t("predictionRecommendation.owner.hseOperations"),
      };
    }

    return {
      status: t("predictionRecommendation.status.maintainControls"),
      statusClass: "healthy",
      icon: <FiCheckCircle />,
      action:
        t("predictionRecommendation.safety.stable.action"),
      benefit:
        t("predictionRecommendation.safety.stable.benefit"),
      owner:
        t("predictionRecommendation.owner.hseOperations"),
    };
  }

  if (
    kpiName.includes("health")
  ) {
    if (isDeclining) {
      return {
        status: t("predictionRecommendation.status.executiveReview"),
        statusClass: "critical",
        icon: <FiTrendingDown />,
        action:
          t("predictionRecommendation.health.declining.action"),
        benefit:
          t("predictionRecommendation.health.declining.benefit"),
        owner:
          t("predictionRecommendation.owner.mineManagement"),
      };
    }

    if (isImproving) {
      return {
        status: t("predictionRecommendation.status.maintainMomentum"),
        statusClass: "healthy",
        icon: <FiCheckCircle />,
        action:
          t("predictionRecommendation.health.improving.action"),
        benefit:
          t("predictionRecommendation.health.improving.benefit"),
        owner:
          t("predictionRecommendation.owner.mineManagement"),
      };
    }

    return {
      status: t("predictionRecommendation.status.monitor"),
      statusClass: "watch",
      icon: <FiTarget />,
      action:
        t("predictionRecommendation.health.stable.action"),
      benefit:
        t("predictionRecommendation.health.stable.benefit"),
      owner:
        t("predictionRecommendation.owner.mineManagement"),
    };
  }

  if (isDeclining) {
    return {
      status: t("predictionRecommendation.status.priorityAction"),
      statusClass: "critical",
      icon: <FiTrendingDown />,
      action:
        t("predictionRecommendation.generic.declining.action"),
      benefit:
        t("predictionRecommendation.generic.declining.benefit"),
      owner:
        t("predictionRecommendation.owner.operationalOwner"),
    };
  }

  return {
    status:
      confidence >= 85
        ? t("predictionRecommendation.status.monitor")
        : t("predictionRecommendation.status.validateForecast"),
    statusClass:
      confidence >= 85
        ? "watch"
        : "unavailable",
    icon: <FiTarget />,
    action:
      confidence >= 85
        ? t("predictionRecommendation.generic.monitor.action")
        : t("predictionRecommendation.generic.validate.action"),
    benefit:
      confidence >= 85
        ? t("predictionRecommendation.generic.monitor.benefit")
        : t("predictionRecommendation.generic.validate.benefit"),
    owner:
      t("predictionRecommendation.owner.operationalOwner"),
  };
}


function PredictionRecommendation({
  prediction,
}) {
  const { t } = useLanguage();

  const recommendation =
    getRecommendationContent(
      prediction || {},
      t,
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
            {t("predictionRecommendation.title")}
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
            {t("predictionRecommendation.expectedBenefit")}
          </span>

          <strong>
            {recommendation.benefit}
          </strong>
        </div>

        <div>
          <span>
            {t("predictionRecommendation.suggestedOwner")}
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