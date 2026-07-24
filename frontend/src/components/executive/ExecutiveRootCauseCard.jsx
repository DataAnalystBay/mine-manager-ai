import React, { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiChevronDown,
  FiTarget,
  FiUser,
} from "react-icons/fi";

import "./ExecutiveRootCauseCard.css";

function normalizeImpact(impact) {
  const value = String(impact || "")
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

  if (value === "low" || value === "minor") {
    return "low";
  }

  return "neutral";
}

function normalizeConfidence(confidence) {
  if (confidence === null || confidence === undefined) {
    return null;
  }

  const parsed = Number(
    String(confidence).replace("%", "").trim()
  );

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const percentage =
    parsed > 0 && parsed <= 1
      ? parsed * 100
      : parsed;

  return Math.min(Math.max(percentage, 0), 100);
}

function normalizeCause(cause, index) {
  if (typeof cause === "string") {
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
      owner: "Operations",
      confidence: null,
    };
  }

  return {
    title:
      cause?.title ||
      cause?.root_cause ||
      cause?.name ||
      cause?.description ||
      "Operational constraint",

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
      "Operations",

    confidence:
      cause?.confidence ??
      cause?.confidence_score ??
      cause?.ai_confidence ??
      null,
  };
}

function formatImpactLabel(impactClass) {
  if (impactClass === "high") {
    return "High Impact";
  }

  if (impactClass === "medium") {
    return "Medium Impact";
  }

  if (impactClass === "low") {
    return "Low Impact";
  }

  return "Impact Unavailable";
}

function getPriorityLabel(index) {
  return `P${index + 1}`;
}

export default function ExecutiveRootCauseCard({
  causes = [],
  title = "Root Cause Analysis",
}) {
  const normalizedCauses = Array.isArray(causes)
    ? causes.map(normalizeCause)
    : [];

  const [expandedItems, setExpandedItems] = useState(() =>
    normalizedCauses.length > 0 ? [0] : []
  );

  useEffect(() => {
    setExpandedItems(
      normalizedCauses.length > 0 ? [0] : []
    );
  }, [causes]);

  const toggleItem = (index) => {
    setExpandedItems((currentItems) =>
      currentItems.includes(index)
        ? currentItems.filter((item) => item !== index)
        : [...currentItems, index]
    );
  };

  const expandAll = () => {
    setExpandedItems(
      normalizedCauses.map((_, index) => index)
    );
  };

  const collapseAll = () => {
    setExpandedItems([]);
  };

  const allExpanded =
    normalizedCauses.length > 0 &&
    expandedItems.length === normalizedCauses.length;

  return (
    <section
      className="executive-root-cause-card"
      aria-label={title}
    >
      <header className="executive-root-cause-header">
        <div className="executive-root-cause-title">
          <span>
            <FiAlertTriangle />
          </span>

          <div>
            <small>AI Diagnostic Analysis</small>
            <h3>{title}</h3>
          </div>
        </div>

        <div className="executive-root-cause-header-actions">
          {normalizedCauses.length > 1 && (
            <button
              type="button"
              className="executive-root-cause-toggle-all"
              onClick={allExpanded ? collapseAll : expandAll}
            >
              {allExpanded ? "Collapse All" : "Expand All"}
            </button>
          )}

          <span className="executive-root-cause-count">
            {normalizedCauses.length} identified
          </span>
        </div>
      </header>

      {normalizedCauses.length > 0 ? (
        <div className="executive-root-cause-list">
          {normalizedCauses.map((cause, index) => {
            const impactClass = normalizeImpact(cause.impact);

            const confidence = normalizeConfidence(
              cause.confidence
            );

            const isExpanded =
              expandedItems.includes(index);

            const detailsId = `root-cause-details-${index}`;

            return (
              <article
                className={`executive-root-cause-item ${
                  isExpanded ? "expanded" : "collapsed"
                }`}
                key={`${cause.title}-${index}`}
              >
                <button
                  type="button"
                  className="executive-root-cause-summary"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isExpanded}
                  aria-controls={detailsId}
                >
                  <span
                    className={`executive-root-cause-priority priority-${index + 1}`}
                  >
                    {getPriorityLabel(index)}
                  </span>

                  <span className="executive-root-cause-summary-content">
                    <span className="executive-root-cause-summary-topline">
                      <strong>{cause.title}</strong>

                      <span
                        className={`executive-root-cause-impact ${impactClass}`}
                      >
                        {formatImpactLabel(impactClass)}
                      </span>
                    </span>

                    <span className="executive-root-cause-summary-meta">
                      <span>
                        <FiUser />
                        {cause.owner}
                      </span>

                      <span>
                        <FiCheckCircle />
                        {confidence !== null
                          ? `${Math.round(confidence)}% confidence`
                          : "Confidence unavailable"}
                      </span>
                    </span>
                  </span>

                  <span
                    className={`executive-root-cause-chevron ${
                      isExpanded ? "expanded" : ""
                    }`}
                  >
                    <FiChevronDown />
                  </span>
                </button>

                <div
                  id={detailsId}
                  className="executive-root-cause-details"
                  hidden={!isExpanded}
                >
                  <div className="executive-root-cause-details-inner">
                    {cause.evidence && (
                      <div className="executive-root-cause-evidence">
                        <FiBarChart2 />

                        <div>
                          <small>Supporting Evidence</small>
                          <p>{cause.evidence}</p>
                        </div>
                      </div>
                    )}

                    {cause.expectedImpact && (
                      <div className="executive-root-cause-expected-impact">
                        <FiTarget />

                        <div>
                          <small>
                            Expected Operational Impact
                          </small>

                          <strong>
                            {cause.expectedImpact}
                          </strong>
                        </div>
                      </div>
                    )}

                    <footer className="executive-root-cause-footer">
                      <div className="executive-root-cause-owner">
                        <FiUser />

                        <span>Responsible Function</span>

                        <strong>{cause.owner}</strong>
                      </div>

                      <div className="executive-root-cause-confidence">
                        <div className="executive-root-cause-confidence-heading">
                          <span>AI Confidence</span>

                          <strong>
                            {confidence !== null
                              ? `${Math.round(confidence)}%`
                              : "—"}
                          </strong>
                        </div>

                        <div
                          className="executive-root-cause-confidence-track"
                          role="progressbar"
                          aria-label={`AI confidence for ${cause.title}`}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-valuenow={
                            confidence !== null
                              ? Math.round(confidence)
                              : 0
                          }
                        >
                          <span
                            style={{
                              width: `${
                                confidence !== null
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
          })}
        </div>
      ) : (
        <div className="executive-root-cause-empty">
          <FiCheckCircle />

          <div>
            <h4>No material root causes detected</h4>

            <p>
              Current KPI performance does not indicate a
              significant operational constraint.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}