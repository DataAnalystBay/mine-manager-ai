import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiLink2,
  FiLoader,
  FiPlayCircle,
  FiRotateCcw,
  FiTarget,
  FiUser,
  FiZap,
} from "react-icons/fi";

import {
  createExecutiveAction,
  getExecutiveActionByKey,
  getExecutiveActions,
  updateExecutiveActionStatus,
} from "../../api/executiveActionsApi";

import "./ExecutiveRecommendationCard.css";

/* ======================================================
   Normalization helpers
====================================================== */

function normalizePriority(priority) {
  const value = String(priority || "")
    .trim()
    .toLowerCase();

  if (
    value === "critical" ||
    value === "high" ||
    value === "urgent"
  ) {
    return "high";
  }

  if (
    value === "medium" ||
    value === "moderate"
  ) {
    return "medium";
  }

  if (
    value === "low" ||
    value === "minor"
  ) {
    return "low";
  }

  return "neutral";
}

function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  if (
    value === "complete" ||
    value === "completed" ||
    value === "done"
  ) {
    return "complete";
  }

  if (
    value === "in progress" ||
    value === "in_progress" ||
    value === "in-progress" ||
    value === "active"
  ) {
    return "in-progress";
  }

  if (
    value === "blocked" ||
    value === "overdue"
  ) {
    return "blocked";
  }

  return "open";
}

function toApiStatus(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "complete") {
    return "completed";
  }

  if (normalized === "in-progress") {
    return "in_progress";
  }

  if (normalized === "blocked") {
    return "blocked";
  }

  return "open";
}

function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function createActionKey({
  recommendation,
  title,
  index,
}) {
  const existingKey =
    recommendation?.action_key ||
    recommendation?.actionKey;

  if (existingKey) {
    return existingKey;
  }

  const actionText =
    recommendation?.action ||
    recommendation?.description ||
    recommendation?.text ||
    recommendation?.title ||
    `action-${index + 1}`;

  const linkedCause =
    recommendation?.linked_cause ||
    recommendation?.root_cause_reference ||
    recommendation?.cause_reference ||
    recommendation?.linked_root_cause ||
    `P${index + 1}`;

  const titleSlug =
    createSlug(title) || "executive-action";

  const actionSlug =
    createSlug(actionText) ||
    `action-${index + 1}`;

  const causeSlug =
    createSlug(linkedCause) ||
    `cause-${index + 1}`;

  return `${titleSlug}-${causeSlug}-${actionSlug}`;
}

function normalizeRecommendation(
  recommendation,
  index,
  title
) {
  if (typeof recommendation === "string") {
    const actionKey = createActionKey({
      recommendation: {
        action: recommendation,
      },
      title,
      index,
    });

    return {
      id: `local-${actionKey}`,
      backendId: null,
      actionKey,
      action: recommendation,
      linkedCause: `P${index + 1}`,
      priority:
        index === 0
          ? "high"
          : index === 1
            ? "medium"
            : "low",
      owner: "Operations",
      timing: "Next shift",
      expectedBenefit: "",
      status: "open",
      persisted: false,
    };
  }

  const actionKey = createActionKey({
    recommendation,
    title,
    index,
  });

  return {
    id:
      recommendation?.id ||
      recommendation?.action_id ||
      `local-${actionKey}`,

    backendId:
      recommendation?.backendId ||
      recommendation?.backend_id ||
      null,

    actionKey,

    action:
      recommendation?.action ||
      recommendation?.description ||
      recommendation?.text ||
      recommendation?.title ||
      "Review this operational recommendation.",

    linkedCause:
      recommendation?.linked_cause ||
      recommendation?.root_cause_reference ||
      recommendation?.cause_reference ||
      recommendation?.linked_root_cause ||
      `P${index + 1}`,

    priority:
      recommendation?.priority ||
      recommendation?.severity ||
      "neutral",

    owner:
      recommendation?.owner ||
      recommendation?.responsible_owner ||
      recommendation?.responsible_function ||
      "Operations",

    timing:
      recommendation?.timing ||
      recommendation?.due ||
      recommendation?.due_date ||
      recommendation?.timeframe ||
      "Next shift",

    expectedBenefit:
      recommendation?.expected_benefit ||
      recommendation?.expected_impact ||
      recommendation?.benefit ||
      recommendation?.operational_benefit ||
      "",

    status: normalizeStatus(
      recommendation?.status || "open"
    ),

    persisted: Boolean(
      recommendation?.backendId ||
        recommendation?.backend_id
    ),
  };
}

function mapBackendActionToUi(
  backendAction,
  localAction
) {
  return {
    ...localAction,
    id: backendAction.id,
    backendId: backendAction.id,
    actionKey:
      backendAction.action_key ||
      localAction.actionKey,
    action:
      backendAction.title ||
      backendAction.description ||
      localAction.action,
    linkedCause:
      backendAction.linked_cause ||
      localAction.linkedCause,
    priority:
      backendAction.priority ||
      localAction.priority,
    owner:
      backendAction.owner ||
      localAction.owner,
    timing:
      backendAction.timing ||
      localAction.timing,
    expectedBenefit:
      backendAction.expected_benefit ||
      localAction.expectedBenefit,
    status: normalizeStatus(
      backendAction.status
    ),
    persisted: true,
  };
}

/* ======================================================
   Display helpers
====================================================== */

function formatPriorityLabel(priority) {
  if (priority === "high") {
    return "High Priority";
  }

  if (priority === "medium") {
    return "Medium Priority";
  }

  if (priority === "low") {
    return "Low Priority";
  }

  return "Priority Unavailable";
}

function formatStatusLabel(status) {
  if (status === "complete") {
    return "Completed";
  }

  if (status === "in-progress") {
    return "In Progress";
  }

  if (status === "blocked") {
    return "Blocked";
  }

  return "Open";
}

function getStatusIcon(status) {
  if (status === "complete") {
    return <FiCheckCircle />;
  }

  if (status === "in-progress") {
    return <FiPlayCircle />;
  }

  if (status === "blocked") {
    return <FiAlertCircle />;
  }

  return <FiRotateCcw />;
}

/* ======================================================
   Component
====================================================== */

export default function ExecutiveRecommendationCard({
  recommendations = [],
  title = "AI Recommended Actions",
}) {
  const [actionItems, setActionItems] =
    useState([]);

  const [expandedItems, setExpandedItems] =
    useState([]);

  const [loadingActions, setLoadingActions] =
    useState(false);

  const [savingActionIds, setSavingActionIds] =
    useState([]);

  const [actionError, setActionError] =
    useState("");

  const [actionMessage, setActionMessage] =
    useState("");

  const syncRequestRef = useRef(0);

  /* ====================================================
     Backend synchronization
  ==================================================== */

  useEffect(() => {
    const syncRequestId =
      syncRequestRef.current + 1;

    syncRequestRef.current = syncRequestId;

    const syncRecommendations = async () => {
      const normalizedRecommendations =
        Array.isArray(recommendations)
          ? recommendations.map(
              (recommendation, index) =>
                normalizeRecommendation(
                  recommendation,
                  index,
                  title
                )
            )
          : [];

      setActionItems(
        normalizedRecommendations
      );

      setExpandedItems(
        normalizedRecommendations.length > 0
          ? [0]
          : []
      );

      setActionError("");
      setActionMessage("");

      if (
        normalizedRecommendations.length === 0
      ) {
        setLoadingActions(false);
        return;
      }

      try {
        setLoadingActions(true);

        const existingActionsResponse =
          await getExecutiveActions({
            limit: 500,
          });

        const existingActions =
          Array.isArray(existingActionsResponse)
            ? existingActionsResponse
            : Array.isArray(
                  existingActionsResponse?.items
                )
              ? existingActionsResponse.items
              : [];

        const existingActionMap = new Map(
          existingActions.map((action) => [
            action.action_key,
            action,
          ])
        );

        const synchronizedActions =
          await Promise.all(
            normalizedRecommendations.map(
              async (localAction) => {
                const existingAction =
                  existingActionMap.get(
                    localAction.actionKey
                  );

                if (existingAction) {
                  return mapBackendActionToUi(
                    existingAction,
                    localAction
                  );
                }

                const createPayload = {
                  action_key:
                    localAction.actionKey,
                  kpi_key:
                    createSlug(title) ||
                    "executive-kpi",
                  kpi_name: title,
                  linked_cause:
                    localAction.linkedCause,
                  title: localAction.action,
                  description:
                    localAction.action,
                  priority:
                    normalizePriority(
                      localAction.priority
                    ) === "neutral"
                      ? "medium"
                      : normalizePriority(
                          localAction.priority
                        ),
                  owner: localAction.owner,
                  timing: localAction.timing,
                  expected_benefit:
                    localAction.expectedBenefit,
                  status: toApiStatus(
                    localAction.status
                  ),
                };

                try {
                  const createdAction =
                    await createExecutiveAction(
                      createPayload
                    );

                  return mapBackendActionToUi(
                    createdAction,
                    localAction
                  );
                } catch (createError) {
                  /*
                   * React StrictMode may run development
                   * effects twice. If another request has
                   * already created the same action_key,
                   * retrieve that action instead.
                   */
                  try {
                    const existingByKey =
                      await getExecutiveActionByKey(
                        localAction.actionKey
                      );

                    return mapBackendActionToUi(
                      existingByKey,
                      localAction
                    );
                  } catch {
                    throw createError;
                  }
                }
              }
            )
          );

        if (
          syncRequestRef.current !==
          syncRequestId
        ) {
          return;
        }

        setActionItems(
          synchronizedActions
        );
      } catch (error) {
        console.error(
          "Executive action synchronization failed:",
          error
        );

        if (
          syncRequestRef.current ===
          syncRequestId
        ) {
          setActionError(
            error?.message ||
              "Unable to synchronize executive actions."
          );
        }
      } finally {
        if (
          syncRequestRef.current ===
          syncRequestId
        ) {
          setLoadingActions(false);
        }
      }
    };

    syncRecommendations();
  }, [recommendations, title]);

  /* ====================================================
     Summary
  ==================================================== */

  const actionSummary = useMemo(() => {
    const summary = {
      total: actionItems.length,
      open: 0,
      inProgress: 0,
      complete: 0,
      blocked: 0,
      progress: 0,
    };

    actionItems.forEach((item) => {
      const status = normalizeStatus(
        item.status
      );

      if (status === "complete") {
        summary.complete += 1;
      } else if (
        status === "in-progress"
      ) {
        summary.inProgress += 1;
      } else if (
        status === "blocked"
      ) {
        summary.blocked += 1;
      } else {
        summary.open += 1;
      }
    });

    summary.progress =
      summary.total > 0
        ? Math.round(
            (summary.complete /
              summary.total) *
              100
          )
        : 0;

    return summary;
  }, [actionItems]);

  /* ====================================================
     Expansion controls
  ==================================================== */

  const toggleItem = (index) => {
    setExpandedItems((currentItems) =>
      currentItems.includes(index)
        ? currentItems.filter(
            (item) => item !== index
          )
        : [...currentItems, index]
    );
  };

  const expandAll = () => {
    setExpandedItems(
      actionItems.map((_, index) => index)
    );
  };

  const collapseAll = () => {
    setExpandedItems([]);
  };

  /* ====================================================
     Persistent status update
  ==================================================== */

  const updateActionStatus = async (
    actionId,
    nextStatus
  ) => {
    const selectedAction =
      actionItems.find(
        (item) => item.id === actionId
      );

    if (!selectedAction) {
      return;
    }

    if (!selectedAction.backendId) {
      setActionError(
        "This action has not finished synchronizing with the backend."
      );
      return;
    }

    const currentStatus =
      normalizeStatus(
        selectedAction.status
      );

    const normalizedNextStatus =
      normalizeStatus(nextStatus);

    if (
      currentStatus ===
      normalizedNextStatus
    ) {
      return;
    }

    const previousItems = actionItems;

    setActionError("");
    setActionMessage("");

    setSavingActionIds((currentIds) => [
      ...currentIds,
      selectedAction.backendId,
    ]);

    /*
     * Optimistic UI update:
     * update the display immediately, then roll back
     * if the API request fails.
     */
    setActionItems((currentItems) =>
      currentItems.map((item) =>
        item.id === actionId
          ? {
              ...item,
              status:
                normalizedNextStatus,
            }
          : item
      )
    );

    try {
      const updatedAction =
        await updateExecutiveActionStatus(
          selectedAction.backendId,
          toApiStatus(
            normalizedNextStatus
          )
        );

      setActionItems((currentItems) =>
        currentItems.map((item) =>
          item.id === actionId
            ? mapBackendActionToUi(
                updatedAction,
                item
              )
            : item
        )
      );

      setActionMessage(
        `Action status updated to ${formatStatusLabel(
          normalizedNextStatus
        )}.`
      );

      window.setTimeout(() => {
        setActionMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Executive action status update failed:",
        error
      );

      setActionItems(previousItems);

      setActionError(
        error?.message ||
          "Unable to update the action status."
      );
    } finally {
      setSavingActionIds(
        (currentIds) =>
          currentIds.filter(
            (id) =>
              id !==
              selectedAction.backendId
          )
      );
    }
  };

  const allExpanded =
    actionItems.length > 0 &&
    expandedItems.length ===
      actionItems.length;

  /* ====================================================
     Render
  ==================================================== */

  return (
    <section
      className="executive-recommendation-card"
      aria-label={title}
    >
      <header className="executive-recommendation-header">
        <div className="executive-recommendation-title">
          <span>
            <FiTarget />
          </span>

          <div>
            <small>
              AI Decision Support
            </small>

            <h3>{title}</h3>
          </div>
        </div>

        <div className="executive-recommendation-header-actions">
          {loadingActions && (
            <span className="executive-recommendation-count">
              <FiLoader /> Syncing
            </span>
          )}

          {actionItems.length > 1 && (
            <button
              type="button"
              className="executive-recommendation-toggle-all"
              onClick={
                allExpanded
                  ? collapseAll
                  : expandAll
              }
            >
              {allExpanded
                ? "Collapse All"
                : "Expand All"}
            </button>
          )}

          <span className="executive-recommendation-count">
            {actionItems.length} actions
          </span>
        </div>
      </header>

      {actionError && (
        <div
          role="alert"
          style={{
            margin: "16px 20px 0",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <FiAlertCircle
            style={{
              marginRight: "7px",
              verticalAlign: "middle",
            }}
          />

          {actionError}
        </div>
      )}

      {actionMessage && (
        <div
          role="status"
          style={{
            margin: "16px 20px 0",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <FiCheckCircle
            style={{
              marginRight: "7px",
              verticalAlign: "middle",
            }}
          />

          {actionMessage}
        </div>
      )}

      {actionItems.length > 0 ? (
        <>
          <section
            className="executive-action-summary"
            aria-label="Action progress summary"
          >
            <div className="executive-action-summary-top">
              <div>
                <small>
                  Execution Overview
                </small>

                <h4>
                  Action Progress Summary
                </h4>
              </div>

              <div className="executive-action-progress-value">
                <strong>
                  {actionSummary.progress}%
                </strong>

                <span>completed</span>
              </div>
            </div>

            <div className="executive-action-summary-grid">
              <article className="executive-action-summary-item total">
                <span>Total Actions</span>

                <strong>
                  {actionSummary.total}
                </strong>
              </article>

              <article className="executive-action-summary-item open">
                <span>Open</span>

                <strong>
                  {actionSummary.open}
                </strong>
              </article>

              <article className="executive-action-summary-item in-progress">
                <span>In Progress</span>

                <strong>
                  {actionSummary.inProgress}
                </strong>
              </article>

              <article className="executive-action-summary-item complete">
                <span>Completed</span>

                <strong>
                  {actionSummary.complete}
                </strong>
              </article>

              <article className="executive-action-summary-item blocked">
                <span>Blocked</span>

                <strong>
                  {actionSummary.blocked}
                </strong>
              </article>
            </div>

            <div className="executive-action-progress">
              <div className="executive-action-progress-heading">
                <span>
                  Overall Completion
                </span>

                <strong>
                  {actionSummary.complete} of{" "}
                  {actionSummary.total} actions
                </strong>
              </div>

              <div
                className="executive-action-progress-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={
                  actionSummary.progress
                }
                aria-label="Action completion progress"
              >
                <span
                  style={{
                    width: `${actionSummary.progress}%`,
                  }}
                />
              </div>
            </div>
          </section>

          <div className="executive-recommendation-list">
            {actionItems.map(
              (recommendation, index) => {
                const priority =
                  normalizePriority(
                    recommendation.priority
                  );

                const status =
                  normalizeStatus(
                    recommendation.status
                  );

                const isExpanded =
                  expandedItems.includes(index);

                const isSaving =
                  savingActionIds.includes(
                    recommendation.backendId
                  );

                const detailsId =
                  `recommendation-details-${recommendation.id}`;

                return (
                  <article
                    className={`executive-recommendation-item ${
                      isExpanded
                        ? "expanded"
                        : "collapsed"
                    }`}
                    key={
                      recommendation.actionKey ||
                      recommendation.id
                    }
                  >
                    <button
                      type="button"
                      className="executive-recommendation-summary"
                      onClick={() =>
                        toggleItem(index)
                      }
                      aria-expanded={
                        isExpanded
                      }
                      aria-controls={
                        detailsId
                      }
                    >
                      <span className="executive-recommendation-action-id">
                        A{index + 1}
                      </span>

                      <span className="executive-recommendation-summary-content">
                        <span className="executive-recommendation-summary-topline">
                          <strong>
                            {
                              recommendation.action
                            }
                          </strong>

                          <span
                            className={`executive-recommendation-priority ${priority}`}
                          >
                            {formatPriorityLabel(
                              priority
                            )}
                          </span>
                        </span>

                        <span className="executive-recommendation-summary-meta">
                          <span>
                            <FiLink2 />
                            Linked to{" "}
                            {
                              recommendation.linkedCause
                            }
                          </span>

                          <span>
                            <FiUser />
                            {
                              recommendation.owner
                            }
                          </span>

                          <span>
                            <FiClock />
                            {
                              recommendation.timing
                            }
                          </span>

                          <span
                            className={`executive-recommendation-inline-status ${status}`}
                          >
                            {isSaving ? (
                              <FiLoader />
                            ) : (
                              getStatusIcon(
                                status
                              )
                            )}

                            {isSaving
                              ? "Saving..."
                              : formatStatusLabel(
                                  status
                                )}
                          </span>
                        </span>
                      </span>

                      <span
                        className={`executive-recommendation-chevron ${
                          isExpanded
                            ? "expanded"
                            : ""
                        }`}
                      >
                        <FiChevronDown />
                      </span>
                    </button>

                    <div
                      id={detailsId}
                      className="executive-recommendation-details"
                      hidden={!isExpanded}
                    >
                      <div className="executive-recommendation-details-inner">
                        <div className="executive-recommendation-link-panel">
                          <FiLink2 />

                          <div>
                            <small>
                              Linked Root Cause
                            </small>

                            <strong>
                              {
                                recommendation.linkedCause
                              }
                            </strong>
                          </div>
                        </div>

                        {recommendation.expectedBenefit && (
                          <div className="executive-recommendation-benefit">
                            <FiZap />

                            <div>
                              <small>
                                Expected
                                Operational Benefit
                              </small>

                              <strong>
                                {
                                  recommendation.expectedBenefit
                                }
                              </strong>
                            </div>
                          </div>
                        )}

                        <div className="executive-recommendation-status-control">
                          <div className="executive-recommendation-status-control-heading">
                            <div>
                              <small>
                                Action Workflow
                              </small>

                              <h4>
                                Update action status
                              </h4>
                            </div>

                            <span
                              className={`executive-recommendation-status ${status}`}
                            >
                              {isSaving ? (
                                <FiLoader />
                              ) : (
                                getStatusIcon(
                                  status
                                )
                              )}

                              {isSaving
                                ? "Saving..."
                                : formatStatusLabel(
                                    status
                                  )}
                            </span>
                          </div>

                          <div className="executive-recommendation-status-buttons">
                            <button
                              type="button"
                              className={`action-status-button open ${
                                status === "open"
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                updateActionStatus(
                                  recommendation.id,
                                  "open"
                                )
                              }
                              aria-pressed={
                                status === "open"
                              }
                              disabled={
                                isSaving ||
                                loadingActions ||
                                !recommendation.backendId
                              }
                            >
                              <FiRotateCcw />
                              Open
                            </button>

                            <button
                              type="button"
                              className={`action-status-button in-progress ${
                                status ===
                                "in-progress"
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                updateActionStatus(
                                  recommendation.id,
                                  "in-progress"
                                )
                              }
                              aria-pressed={
                                status ===
                                "in-progress"
                              }
                              disabled={
                                isSaving ||
                                loadingActions ||
                                !recommendation.backendId
                              }
                            >
                              <FiPlayCircle />
                              In Progress
                            </button>

                            <button
                              type="button"
                              className={`action-status-button complete ${
                                status ===
                                "complete"
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                updateActionStatus(
                                  recommendation.id,
                                  "complete"
                                )
                              }
                              aria-pressed={
                                status ===
                                "complete"
                              }
                              disabled={
                                isSaving ||
                                loadingActions ||
                                !recommendation.backendId
                              }
                            >
                              <FiCheckCircle />
                              Completed
                            </button>

                            <button
                              type="button"
                              className={`action-status-button blocked ${
                                status ===
                                "blocked"
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                updateActionStatus(
                                  recommendation.id,
                                  "blocked"
                                )
                              }
                              aria-pressed={
                                status ===
                                "blocked"
                              }
                              disabled={
                                isSaving ||
                                loadingActions ||
                                !recommendation.backendId
                              }
                            >
                              <FiAlertCircle />
                              Blocked
                            </button>
                          </div>

                          <p className="executive-recommendation-status-note">
                            Status changes are saved
                            to PostgreSQL and remain
                            available after refreshing
                            the browser.
                          </p>
                        </div>

                        <footer className="executive-recommendation-footer">
                          <div className="executive-recommendation-owner">
                            <FiUser />

                            <div>
                              <span>
                                Responsible Function
                              </span>

                              <strong>
                                {
                                  recommendation.owner
                                }
                              </strong>
                            </div>
                          </div>

                          <div className="executive-recommendation-timing">
                            <FiClock />

                            <div>
                              <span>
                                Recommended Timing
                              </span>

                              <strong>
                                {
                                  recommendation.timing
                                }
                              </strong>
                            </div>
                          </div>

                          <span
                            className={`executive-recommendation-status ${status}`}
                          >
                            {isSaving ? (
                              <FiLoader />
                            ) : (
                              getStatusIcon(
                                status
                              )
                            )}

                            {isSaving
                              ? "Saving..."
                              : formatStatusLabel(
                                  status
                                )}
                          </span>
                        </footer>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </>
      ) : (
        <div className="executive-recommendation-empty">
          {loadingActions ? (
            <FiLoader />
          ) : (
            <FiCheckCircle />
          )}

          <div>
            <h4>
              {loadingActions
                ? "Loading executive actions"
                : "No immediate actions required"}
            </h4>

            <p>
              {loadingActions
                ? "Synchronizing AI recommendations with PostgreSQL."
                : "Current KPI performance does not require an additional AI recommendation."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}