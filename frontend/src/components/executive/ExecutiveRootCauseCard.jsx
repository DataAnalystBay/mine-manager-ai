import React, {
  useEffect,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiChevronDown,
  FiTarget,
  FiUser,
} from "react-icons/fi";

import {
  useLanguage,
} from "../../context/LanguageContext";

import "./ExecutiveRootCauseCard.css";


function translateTemplate(
  t,
  key,
  variables = {},
) {
  let text = t(key);

  Object.entries(
    variables,
  ).forEach(
    ([name, value]) => {
      text = String(
        text,
      ).replaceAll(
        `{${name}}`,
        String(
          value ?? "",
        ),
      );
    },
  );

  return text;
}


function normalizeImpact(
  impact,
) {
  const value = String(
    impact || "",
  )
    .trim()
    .toLowerCase();

  if (
    value === "critical" ||
    value === "high" ||
    value === "severe"
  ) {
    return "high";
  }

  if (
    value === "medium" ||
    value === "moderate" ||
    value === "warning"
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


function normalizeConfidence(
  confidence,
) {
  if (
    confidence === null ||
    confidence === undefined
  ) {
    return null;
  }

  const parsed = Number(
    String(confidence)
      .replace("%", "")
      .trim(),
  );

  if (
    !Number.isFinite(parsed)
  ) {
    return null;
  }

  const percentage =
    parsed > 0 &&
    parsed <= 1
      ? parsed * 100
      : parsed;

  return Math.min(
    Math.max(
      percentage,
      0,
    ),
    100,
  );
}


function normalizeCause(
  cause,
  index,
  t,
) {
  if (
    typeof cause ===
    "string"
  ) {
    return {
      title: cause,

      impact:
        index === 0
          ? "high"
          : index === 1
            ? "medium"
            : "low",

      evidence: "",

      expectedImpact: "",

      owner: t(
        "executiveRootCauseCard.defaults.operations",
      ),

      confidence: null,
    };
  }

  return {
    title:
      cause?.title ||
      cause?.root_cause ||
      cause?.name ||
      cause?.description ||
      t(
        "executiveRootCauseCard.defaults.operationalConstraint",
      ),

    impact:
      cause?.impact ||
      cause?.severity ||
      cause?.priority ||
      "neutral",

    evidence:
      cause?.evidence ||
      cause?.supporting_evidence ||
      cause?.reason ||
      cause?.diagnostic_evidence ||
      "",

    expectedImpact:
      cause?.expected_impact ||
      cause?.operational_impact ||
      cause?.estimated_impact ||
      cause?.production_impact ||
      "",

    owner:
      cause?.owner ||
      cause?.responsible_owner ||
      cause?.responsible_function ||
      cause?.function ||
      t(
        "executiveRootCauseCard.defaults.operations",
      ),

    confidence:
      cause?.confidence ??
      cause?.confidence_score ??
      cause?.ai_confidence ??
      null,
  };
}


function formatImpactLabel(
  impactClass,
  t,
) {
  if (
    impactClass === "high"
  ) {
    return t(
      "executiveRootCauseCard.impact.high",
    );
  }

  if (
    impactClass === "medium"
  ) {
    return t(
      "executiveRootCauseCard.impact.medium",
    );
  }

  if (
    impactClass === "low"
  ) {
    return t(
      "executiveRootCauseCard.impact.low",
    );
  }

  return t(
    "executiveRootCauseCard.impact.unavailable",
  );
}


function getPriorityLabel(
  index,
) {
  return `P${index + 1}`;
}


export default function ExecutiveRootCauseCard({
  causes = [],
  title,
}) {
  const { t } =
    useLanguage();

  const displayTitle =
    title ||
    t(
      "executiveRootCauseCard.defaultTitle",
    );

  const normalizedCauses =
    Array.isArray(causes)
      ? causes.map(
          (
            cause,
            index,
          ) =>
            normalizeCause(
              cause,
              index,
              t,
            ),
        )
      : [];

  const [
    expandedItems,
    setExpandedItems,
  ] = useState(
    () =>
      normalizedCauses.length >
      0
        ? [0]
        : [],
  );

  useEffect(() => {
    setExpandedItems(
      normalizedCauses.length >
        0
        ? [0]
        : [],
    );
  }, [causes]);

  const toggleItem = (
    index,
  ) => {
    setExpandedItems(
      (
        currentItems,
      ) =>
        currentItems.includes(
          index,
        )
          ? currentItems.filter(
              (
                item,
              ) =>
                item !==
                index,
            )
          : [
              ...currentItems,
              index,
            ],
    );
  };

  const expandAll = () => {
    setExpandedItems(
      normalizedCauses.map(
        (
          _,
          index,
        ) => index,
      ),
    );
  };

  const collapseAll = () => {
    setExpandedItems([]);
  };

  const allExpanded =
    normalizedCauses.length >
      0 &&
    expandedItems.length ===
      normalizedCauses.length;

  return (
    <section
      className="executive-root-cause-card"
      aria-label={
        displayTitle
      }
    >
      <header className="executive-root-cause-header">
        <div className="executive-root-cause-title">
          <span>
            <FiAlertTriangle />
          </span>

          <div>
            <small>
              {t(
                "executiveRootCauseCard.aiDiagnosticAnalysis",
              )}
            </small>

            <h3>
              {displayTitle}
            </h3>
          </div>
        </div>

        <div className="executive-root-cause-header-actions">
          {normalizedCauses.length >
            1 && (
            <button
              type="button"
              className="executive-root-cause-toggle-all"
              onClick={
                allExpanded
                  ? collapseAll
                  : expandAll
              }
            >
              {allExpanded
                ? t(
                    "executiveRootCauseCard.collapseAll",
                  )
                : t(
                    "executiveRootCauseCard.expandAll",
                  )}
            </button>
          )}

          <span className="executive-root-cause-count">
            {translateTemplate(
              t,
              "executiveRootCauseCard.identifiedCount",
              {
                count:
                  normalizedCauses.length,
              },
            )}
          </span>
        </div>
      </header>

      {normalizedCauses.length >
      0 ? (
        <div className="executive-root-cause-list">
          {normalizedCauses.map(
            (
              cause,
              index,
            ) => {
              const impactClass =
                normalizeImpact(
                  cause.impact,
                );

              const confidence =
                normalizeConfidence(
                  cause.confidence,
                );

              const isExpanded =
                expandedItems.includes(
                  index,
                );

              const detailsId =
                `root-cause-details-${index}`;

              return (
                <article
                  className={`executive-root-cause-item ${
                    isExpanded
                      ? "expanded"
                      : "collapsed"
                  }`}
                  key={`${cause.title}-${index}`}
                >
                  <button
                    type="button"
                    className="executive-root-cause-summary"
                    onClick={() =>
                      toggleItem(
                        index,
                      )
                    }
                    aria-expanded={
                      isExpanded
                    }
                    aria-controls={
                      detailsId
                    }
                  >
                    <span
                      className={`executive-root-cause-priority priority-${
                        index +
                        1
                      }`}
                    >
                      {getPriorityLabel(
                        index,
                      )}
                    </span>

                    <span className="executive-root-cause-summary-content">
                      <span className="executive-root-cause-summary-topline">
                        <strong>
                          {
                            cause.title
                          }
                        </strong>

                        <span
                          className={`executive-root-cause-impact ${impactClass}`}
                        >
                          {formatImpactLabel(
                            impactClass,
                            t,
                          )}
                        </span>
                      </span>

                      <span className="executive-root-cause-summary-meta">
                        <span>
                          <FiUser />

                          {
                            cause.owner
                          }
                        </span>

                        <span>
                          <FiCheckCircle />

                          {confidence !==
                          null
                            ? `${Math.round(
                                confidence,
                              )}%`
                            : t(
                                "executiveRootCauseCard.confidenceUnavailable",
                              )}
                        </span>
                      </span>
                    </span>

                    <span
                      className={`executive-root-cause-chevron ${
                        isExpanded
                          ? "expanded"
                          : ""
                      }`}
                    >
                      <FiChevronDown />
                    </span>
                  </button>

                  <div
                    id={
                      detailsId
                    }
                    className="executive-root-cause-details"
                    hidden={
                      !isExpanded
                    }
                  >
                    <div className="executive-root-cause-details-inner">
                      {cause.evidence && (
                        <div className="executive-root-cause-evidence">
                          <FiBarChart2 />

                          <div>
                            <small>
                              {t(
                                "executiveRootCauseCard.supportingEvidence",
                              )}
                            </small>

                            <p>
                              {
                                cause.evidence
                              }
                            </p>
                          </div>
                        </div>
                      )}

                      {cause.expectedImpact && (
                        <div className="executive-root-cause-expected-impact">
                          <FiTarget />

                          <div>
                            <small>
                              {t(
                                "executiveRootCauseCard.expectedOperationalImpact",
                              )}
                            </small>

                            <strong>
                              {
                                cause.expectedImpact
                              }
                            </strong>
                          </div>
                        </div>
                      )}

                      <footer className="executive-root-cause-footer">
                        <div className="executive-root-cause-owner">
                          <FiUser />

                          <span>
                            {t(
                              "executiveRootCauseCard.responsibleFunction",
                            )}
                          </span>

                          <strong>
                            {
                              cause.owner
                            }
                          </strong>
                        </div>

                        <div className="executive-root-cause-confidence">
                          <div className="executive-root-cause-confidence-heading">
                            <span>
                              {t(
                                "executiveRootCauseCard.aiConfidence",
                              )}
                            </span>

                            <strong>
                              {confidence !==
                              null
                                ? `${Math.round(
                                    confidence,
                                  )}%`
                                : "—"}
                            </strong>
                          </div>

                          <div
                            className="executive-root-cause-confidence-track"
                            role="progressbar"
                            aria-label={translateTemplate(
                              t,
                              "executiveRootCauseCard.aiConfidenceAria",
                              {
                                title:
                                  cause.title,
                              },
                            )}
                            aria-valuemin="0"
                            aria-valuemax="100"
                            aria-valuenow={
                              confidence !==
                              null
                                ? Math.round(
                                    confidence,
                                  )
                                : 0
                            }
                          >
                            <span
                              style={{
                                width: `${
                                  confidence !==
                                  null
                                    ? confidence
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </footer>
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>
      ) : (
        <div className="executive-root-cause-empty">
          <FiCheckCircle />

          <div>
            <h4>
              {t(
                "executiveRootCauseCard.noMaterialRootCauses",
              )}
            </h4>

            <p>
              {t(
                "executiveRootCauseCard.noSignificantConstraint",
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}