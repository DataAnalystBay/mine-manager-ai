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

import { useLanguage } from "../../context/LanguageContext";
import useKpiExecutiveActions from "../../hooks/useKpiExecutiveActions";

import "./RelatedExecutiveActions.css";


const STATUS_OPTIONS = [
  {
    value: "open",
    translationKey:
      "relatedExecutiveActions.status.open",
  },
  {
    value: "in_progress",
    translationKey:
      "relatedExecutiveActions.status.inProgress",
  },
  {
    value: "completed",
    translationKey:
      "relatedExecutiveActions.status.completed",
  },
  {
    value: "blocked",
    translationKey:
      "relatedExecutiveActions.status.blocked",
  },
];


function translateTemplate(
  t,
  key,
  variables = {},
) {
  let text = t(key);

  Object.entries(variables).forEach(
    ([name, value]) => {
      text = String(text).replaceAll(
        `{${name}}`,
        String(value ?? ""),
      );
    },
  );

  return text;
}


function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}


function formatStatus(status, t) {
  const normalized =
    normalizeText(status);

  const keys = {
    open:
      "relatedExecutiveActions.status.open",
    in_progress:
      "relatedExecutiveActions.status.inProgress",
    completed:
      "relatedExecutiveActions.status.completed",
    blocked:
      "relatedExecutiveActions.status.blocked",
  };

  return t(
    keys[normalized] ||
      "relatedExecutiveActions.status.open",
  );
}


function formatPriority(priority, t) {
  const normalized =
    normalizeText(priority);

  const keys = {
    high:
      "relatedExecutiveActions.priority.high",
    medium:
      "relatedExecutiveActions.priority.medium",
    low:
      "relatedExecutiveActions.priority.low",
    critical:
      "relatedExecutiveActions.priority.critical",
  };

  return t(
    keys[normalized] ||
      "relatedExecutiveActions.priority.medium",
  );
}


function formatDate(
  dateValue,
  language,
  t,
) {
  if (!dateValue) {
    return t(
      "relatedExecutiveActions.noDueDate",
    );
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString(
    language === "MN"
      ? "mn-MN"
      : "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}


function getActionId(action) {
  return (
    action?.id ??
    action?.action_id ??
    null
  );
}


function getActionKey(
  action,
  index,
) {
  return (
    action?.action_key ||
    getActionId(action) ||
    `${
      action?.title || "action"
    }-${index}`
  );
}


export default function RelatedExecutiveActions({
  kpiKey,
  onOpenActionCenter,
  className = "",
}) {
  const {
    language,
    t,
  } = useLanguage();

  const {
    actions,
    summary,
    loading,
    error,
    updatingStatusId,
    refresh,
    updateStatus,
  } = useKpiExecutiveActions(
    kpiKey,
  );

  const handleStatusChange = async (
    action,
    nextStatus,
  ) => {
    try {
      await updateStatus(
        action,
        nextStatus,
      );
    } catch (requestError) {
      console.error(
        "Unable to update executive action status:",
        requestError,
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
            {t(
              "relatedExecutiveActions.eyebrow",
            )}
          </span>

          <h3 id="related-actions-title">
            {t(
              "relatedExecutiveActions.title",
            )}
          </h3>

          <p>
            {t(
              "relatedExecutiveActions.subtitle",
            )}
          </p>
        </div>

        <div className="related-actions-header-buttons">
          <button
            type="button"
            className="related-actions-refresh-button"
            onClick={refresh}
            disabled={
              loading ||
              !kpiKey
            }
            aria-label={t(
              "relatedExecutiveActions.refreshAria",
            )}
          >
            <FiRefreshCw
              className={
                loading
                  ? "spinning"
                  : ""
              }
            />

            {t(
              "relatedExecutiveActions.refresh",
            )}
          </button>

          {onOpenActionCenter && (
            <button
              type="button"
              className="related-actions-open-button"
              onClick={() =>
                onOpenActionCenter(
                  kpiKey,
                )
              }
            >
              {t(
                "relatedExecutiveActions.openActionCenter",
              )}

              <FiExternalLink />
            </button>
          )}
        </div>
      </div>

      <div className="related-actions-summary">
        <div>
          <span>
            {t(
              "relatedExecutiveActions.summary.total",
            )}
          </span>
          <strong>
            {summary.total}
          </strong>
        </div>

        <div>
          <span>
            {t(
              "relatedExecutiveActions.status.open",
            )}
          </span>
          <strong>
            {summary.open}
          </strong>
        </div>

        <div>
          <span>
            {t(
              "relatedExecutiveActions.status.inProgress",
            )}
          </span>
          <strong>
            {summary.inProgress}
          </strong>
        </div>

        <div>
          <span>
            {t(
              "relatedExecutiveActions.status.completed",
            )}
          </span>
          <strong>
            {summary.completed}
          </strong>
        </div>

        <div>
          <span>
            {t(
              "relatedExecutiveActions.status.blocked",
            )}
          </span>
          <strong>
            {summary.blocked}
          </strong>
        </div>

        <div>
          <span>
            {t(
              "relatedExecutiveActions.summary.completion",
            )}
          </span>
          <strong>
            {summary.completionRate}%
          </strong>
        </div>
      </div>

      {loading && (
        <div className="related-actions-state">
          <FiRefreshCw className="spinning" />

          <div>
            <strong>
              {t(
                "relatedExecutiveActions.loadingTitle",
              )}
            </strong>

            <p>
              {t(
                "relatedExecutiveActions.loadingMessage",
              )}
            </p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="related-actions-state error">
          <FiAlertCircle />

          <div>
            <strong>
              {t(
                "relatedExecutiveActions.errorTitle",
              )}
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={refresh}
          >
            {t(
              "relatedExecutiveActions.retry",
            )}
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        actions.length === 0 && (
          <div className="related-actions-state empty">
            <FiCheckCircle />

            <div>
              <strong>
                {t(
                  "relatedExecutiveActions.emptyTitle",
                )}
              </strong>

              <p>
                {t(
                  "relatedExecutiveActions.emptyMessage",
                )}
              </p>
            </div>

            {onOpenActionCenter && (
              <button
                type="button"
                onClick={() =>
                  onOpenActionCenter(
                    kpiKey,
                  )
                }
              >
                {t(
                  "relatedExecutiveActions.openActionCenter",
                )}
              </button>
            )}
          </div>
        )}

      {!loading &&
        !error &&
        actions.length > 0 && (
          <div className="related-actions-list">
            {actions.map(
              (action, index) => {
                const actionId =
                  getActionId(
                    action,
                  );

                const normalizedStatus =
                  normalizeText(
                    action?.status,
                  ) || "open";

                const normalizedPriority =
                  normalizeText(
                    action?.priority,
                  ) || "medium";

                const isUpdating =
                  updatingStatusId ===
                  actionId;

                const actionTitle =
                  action?.title ||
                  t(
                    "relatedExecutiveActions.untitledAction",
                  );

                return (
                  <article
                    className="related-action-card"
                    key={getActionKey(
                      action,
                      index,
                    )}
                  >
                    <div className="related-action-card-top">
                      <div className="related-action-title-group">
                        <span
                          className={`related-action-priority ${normalizedPriority}`}
                        >
                          {formatPriority(
                            action?.priority,
                            t,
                          )}
                        </span>

                        <span
                          className={`related-action-status ${normalizedStatus}`}
                        >
                          {formatStatus(
                            action?.status,
                            t,
                          )}
                        </span>
                      </div>

                      <select
                        aria-label={translateTemplate(
                          t,
                          "relatedExecutiveActions.updateStatusAria",
                          {
                            title:
                              actionTitle,
                          },
                        )}
                        value={
                          normalizedStatus
                        }
                        disabled={
                          isUpdating
                        }
                        onChange={(
                          event,
                        ) =>
                          handleStatusChange(
                            action,
                            event.target
                              .value,
                          )
                        }
                      >
                        {STATUS_OPTIONS.map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {t(
                                option.translationKey,
                              )}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <h4>
                      {actionTitle}
                    </h4>

                    {action?.description && (
                      <p className="related-action-description">
                        {
                          action.description
                        }
                      </p>
                    )}

                    <div className="related-action-metadata">
                      <span>
                        <FiUser />
                        {action?.owner ||
                          t(
                            "relatedExecutiveActions.ownerNotAssigned",
                          )}
                      </span>

                      <span>
                        <FiCalendar />
                        {formatDate(
                          action?.due_date,
                          language,
                          t,
                        )}
                      </span>

                      {action?.linked_cause && (
                        <span>
                          <FiLink2 />
                          {translateTemplate(
                            t,
                            "relatedExecutiveActions.rootCause",
                            {
                              cause:
                                action.linked_cause,
                            },
                          )}
                        </span>
                      )}
                    </div>

                    {action?.expected_benefit && (
                      <div className="related-action-benefit">
                        <span>
                          {t(
                            "relatedExecutiveActions.expectedBenefit",
                          )}
                        </span>

                        <p>
                          {
                            action.expected_benefit
                          }
                        </p>
                      </div>
                    )}

                    {isUpdating && (
                      <div className="related-action-updating">
                        <FiRefreshCw className="spinning" />

                        {t(
                          "relatedExecutiveActions.updatingStatus",
                        )}
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
    </section>
  );
}
