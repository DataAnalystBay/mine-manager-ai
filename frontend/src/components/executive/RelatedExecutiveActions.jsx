import React from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiExternalLink,
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiLink2,
} from "react-icons/fi";

import useKpiExecutiveActions from "../../hooks/useKpiExecutiveActions";
import "./RelatedExecutiveActions.css";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function formatStatus(status) {
  const normalized = normalizeText(status);

  const labels = {
    open: "Open",
    in_progress: "In Progress",
    completed: "Completed",
    blocked: "Blocked",
  };

  return labels[normalized] || "Open";
}

function formatPriority(priority) {
  const normalized = normalizeText(priority);

  if (!normalized) {
    return "Medium";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "No due date";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getActionId(action) {
  return action?.id ?? action?.action_id ?? null;
}

function getActionKey(action, index) {
  return (
    action?.action_key ||
    getActionId(action) ||
    `${action?.title || "action"}-${index}`
  );
}

export default function RelatedExecutiveActions({
  kpiKey,
  onOpenActionCenter,
  className = "",
}) {
  const {
    actions,
    summary,
    loading,
    error,
    updatingStatusId,
    refresh,
    updateStatus,
  } = useKpiExecutiveActions(kpiKey);

  const handleStatusChange = async (action, nextStatus) => {
    try {
      await updateStatus(action, nextStatus);
    } catch (requestError) {
      console.error(
        "Unable to update executive action status:",
        requestError
      );
    }
  };

  return (
    <section
      className={`related-actions ${className}`.trim()}
      aria-labelledby="related-actions-title"
    >
      <div className="related-actions-header">
        <div>
          <span className="related-actions-eyebrow">
            Connected Executive Intelligence
          </span>

          <h3 id="related-actions-title">
            Related Executive Actions
          </h3>

          <p>
            Live management actions linked to this KPI.
          </p>
        </div>

        <div className="related-actions-header-buttons">
          <button
            type="button"
            className="related-actions-refresh-button"
            onClick={refresh}
            disabled={loading || !kpiKey}
          >
            <FiRefreshCw className={loading ? "spinning" : ""} />
            Refresh
          </button>

          {onOpenActionCenter && (
            <button
              type="button"
              className="related-actions-open-button"
              onClick={() => onOpenActionCenter(kpiKey)}
            >
              Open Action Center
              <FiExternalLink />
            </button>
          )}
        </div>
      </div>

      <div className="related-actions-summary">
        <div>
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>

        <div>
          <span>Open</span>
          <strong>{summary.open}</strong>
        </div>

        <div>
          <span>In Progress</span>
          <strong>{summary.inProgress}</strong>
        </div>

        <div>
          <span>Completed</span>
          <strong>{summary.completed}</strong>
        </div>

        <div>
          <span>Blocked</span>
          <strong>{summary.blocked}</strong>
        </div>

        <div>
          <span>Completion</span>
          <strong>{summary.completionRate}%</strong>
        </div>
      </div>

      {loading && (
        <div className="related-actions-state">
          <FiRefreshCw className="spinning" />
          <div>
            <strong>Loading executive actions</strong>
            <p>Retrieving live action data for this KPI.</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="related-actions-state error">
          <FiAlertCircle />

          <div>
            <strong>Unable to load executive actions</strong>
            <p>{error}</p>
          </div>

          <button type="button" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && actions.length === 0 && (
        <div className="related-actions-state empty">
          <FiCheckCircle />

          <div>
            <strong>No related executive actions yet</strong>
            <p>
              Actions created from this KPI will appear here automatically.
            </p>
          </div>

          {onOpenActionCenter && (
            <button
              type="button"
              onClick={() => onOpenActionCenter(kpiKey)}
            >
              Open Action Center
            </button>
          )}
        </div>
      )}

      {!loading && !error && actions.length > 0 && (
        <div className="related-actions-list">
          {actions.map((action, index) => {
            const actionId = getActionId(action);
            const normalizedStatus = normalizeText(action?.status) || "open";
            const normalizedPriority =
              normalizeText(action?.priority) || "medium";
            const isUpdating = updatingStatusId === actionId;

            return (
              <article
                className="related-action-card"
                key={getActionKey(action, index)}
              >
                <div className="related-action-card-top">
                  <div className="related-action-title-group">
                    <span
                      className={`related-action-priority ${normalizedPriority}`}
                    >
                      {formatPriority(action?.priority)}
                    </span>

                    <span
                      className={`related-action-status ${normalizedStatus}`}
                    >
                      {formatStatus(action?.status)}
                    </span>
                  </div>

                  <select
                    aria-label={`Update status for ${action?.title || "executive action"}`}
                    value={normalizedStatus}
                    disabled={isUpdating}
                    onChange={(event) =>
                      handleStatusChange(action, event.target.value)
                    }
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <h4>{action?.title || "Untitled executive action"}</h4>

                {action?.description && (
                  <p className="related-action-description">
                    {action.description}
                  </p>
                )}

                <div className="related-action-metadata">
                  <span>
                    <FiUser />
                    {action?.owner || "Owner not assigned"}
                  </span>

                  <span>
                    <FiCalendar />
                    {formatDate(action?.due_date)}
                  </span>

                  {action?.linked_cause && (
                    <span>
                      <FiLink2 />
                      Root Cause {action.linked_cause}
                    </span>
                  )}
                </div>

                {action?.expected_benefit && (
                  <div className="related-action-benefit">
                    <span>Expected Benefit</span>
                    <p>{action.expected_benefit}</p>
                  </div>
                )}

                {isUpdating && (
                  <div className="related-action-updating">
                    <FiRefreshCw className="spinning" />
                    Updating status…
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
