import {
  FiAlertTriangle,
  FiDatabase,
  FiRefreshCw,
} from "react-icons/fi";

import "./DashboardDataState.css";

const STATE_CONFIG = {
  error: {
    icon: FiAlertTriangle,
    title: "Dashboard data unavailable",
    message:
      "The latest operational analytics could not be loaded. Check the backend connection and try again.",
  },
  empty: {
    icon: FiDatabase,
    title: "No operational data available",
    message:
      "Upload operational reports or load the executive demo to populate this dashboard.",
  },
};

function DashboardDataState({
  type = "error",
  title,
  message,
  actionLabel = "Retry",
  onRetry,
  retrying = false,
  compact = false,
}) {
  const config = STATE_CONFIG[type] || STATE_CONFIG.error;
  const StateIcon = config.icon;

  return (
    <div
      className={[
        "dashboard-data-state",
        `dashboard-data-state--${type}`,
        compact ? "dashboard-data-state--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role={type === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="dashboard-data-state__icon" aria-hidden="true">
        <StateIcon />
      </div>

      <div className="dashboard-data-state__content">
        <strong>{title || config.title}</strong>
        <p>{message || config.message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          className="dashboard-data-state__action"
          onClick={onRetry}
          disabled={retrying}
        >
          <FiRefreshCw
            className={retrying ? "dashboard-data-state__spinner" : ""}
            aria-hidden="true"
          />

          <span>{retrying ? "Retrying..." : actionLabel}</span>
        </button>
      )}
    </div>
  );
}

export default DashboardDataState;