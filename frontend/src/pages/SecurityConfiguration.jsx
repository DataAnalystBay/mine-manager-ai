import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaSyncAlt,
  FaTimesCircle,
} from "react-icons/fa";

import { getDeploymentReadiness } from "../api/deploymentReadinessApi";
import "./SecurityConfiguration.css";


const CATEGORY_LABELS = {
  application: "Application",
  security: "Security",
  database: "Database",
  filesystem: "Filesystem",
  dependencies: "Dependencies",
  operations: "Operations",
};


const formatGeneratedDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};


const getStatusIcon = (status) => {
  if (status === "pass") {
    return <FaCheckCircle />;
  }

  if (status === "fail") {
    return <FaTimesCircle />;
  }

  return <FaExclamationTriangle />;
};


const SecurityConfiguration = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");


  const loadReadinessReport = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getDeploymentReadiness();
      setReport(data);
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Unable to load the deployment readiness report.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    loadReadinessReport();
  }, [loadReadinessReport]);


  const categories = useMemo(() => {
    if (!report?.grouped_checks) {
      return [];
    }

    return Object.entries(report.grouped_checks);
  }, [report]);


  if (loading) {
    return (
      <div className="security-config-page">
        <div className="security-loading-state">
          <FaShieldAlt className="security-loading-icon" />
          <h2>Checking deployment readiness</h2>
          <p>
            Reviewing security, database, filesystem, dependencies,
            and operational configuration.
          </p>
        </div>
      </div>
    );
  }


  if (error && !report) {
    return (
      <div className="security-config-page">
        <div className="security-error-state">
          <FaTimesCircle />
          <h2>Readiness check unavailable</h2>
          <p>{error}</p>

          <button
            type="button"
            className="security-primary-button"
            onClick={() => loadReadinessReport()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  const readiness = report?.readiness || {};
  const score = report?.score || {};
  const summary = report?.summary || {};
  const recommendations = report?.recommendations || [];
  const blockingChecks = report?.blocking_checks || [];

  return (
    <div className="security-config-page">
      <div className="security-config-header">
        <div>
          <div className="security-page-eyebrow">
            <FaShieldAlt />
            Security & Enterprise Readiness
          </div>

          <h1>Security Configuration Center</h1>

          <p>
            Review deployment readiness, security controls, system
            dependencies, and production configuration.
          </p>
        </div>

        <button
          type="button"
          className="security-refresh-button"
          onClick={() => loadReadinessReport(true)}
          disabled={refreshing}
        >
          <FaSyncAlt className={refreshing ? "is-spinning" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Checks"}
        </button>
      </div>

      {error && (
        <div className="security-inline-error">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <section className="security-overview-grid">
        <article
          className={`security-readiness-card readiness-${readiness.status}`}
        >
          <div className="security-readiness-card-header">
            <div>
              <span className="security-card-label">
                Deployment status
              </span>
              <h2>{readiness.label || "Unknown"}</h2>
            </div>

            <div className="security-score-circle">
              <strong>{score.percentage ?? 0}%</strong>
              <span>Ready</span>
            </div>
          </div>

          <p>{readiness.message}</p>

          <div className="security-generated-time">
            Last checked: {formatGeneratedDate(report?.generated_at)}
          </div>
        </article>

        <article className="security-summary-card summary-pass">
          <div className="security-summary-icon">
            <FaCheckCircle />
          </div>
          <div>
            <span>Passed</span>
            <strong>{summary.passed ?? 0}</strong>
          </div>
        </article>

        <article className="security-summary-card summary-warning">
          <div className="security-summary-icon">
            <FaExclamationTriangle />
          </div>
          <div>
            <span>Warnings</span>
            <strong>{summary.warnings ?? 0}</strong>
          </div>
        </article>

        <article className="security-summary-card summary-fail">
          <div className="security-summary-icon">
            <FaTimesCircle />
          </div>
          <div>
            <span>Failed</span>
            <strong>{summary.failed ?? 0}</strong>
          </div>
        </article>
      </section>

      {blockingChecks.length > 0 && (
        <section className="security-blocking-section">
          <div className="security-section-heading">
            <div>
              <span className="security-section-eyebrow">
                Immediate attention
              </span>
              <h2>Blocking Issues</h2>
            </div>

            <span className="security-count-badge status-fail">
              {blockingChecks.length}
            </span>
          </div>

          <div className="security-blocking-list">
            {blockingChecks.map((check) => (
              <article
                key={check.key}
                className="security-blocking-item"
              >
                <FaTimesCircle />

                <div>
                  <h3>{check.name}</h3>
                  <p>{check.message}</p>

                  {check.recommendation && (
                    <div className="security-recommendation-text">
                      {check.recommendation}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="security-checks-section">
        <div className="security-section-heading">
          <div>
            <span className="security-section-eyebrow">
              System validation
            </span>
            <h2>Readiness Checks</h2>
          </div>

          <span className="security-total-checks">
            {summary.total_checks ?? 0} checks
          </span>
        </div>

        <div className="security-category-list">
          {categories.map(([categoryKey, checks]) => (
            <article
              key={categoryKey}
              className="security-category-card"
            >
              <div className="security-category-header">
                <h3>
                  {CATEGORY_LABELS[categoryKey] || categoryKey}
                </h3>

                <span>{checks.length} checks</span>
              </div>

              <div className="security-check-list">
                {checks.map((check) => (
                  <div
                    key={check.key}
                    className={`security-check-row status-${check.status}`}
                  >
                    <div className="security-check-status-icon">
                      {getStatusIcon(check.status)}
                    </div>

                    <div className="security-check-content">
                      <div className="security-check-title-row">
                        <h4>{check.name}</h4>

                        <div className="security-check-badges">
                          <span
                            className={`security-status-badge status-${check.status}`}
                          >
                            {check.status}
                          </span>

                          {!check.required && (
                            <span className="security-optional-badge">
                              Optional
                            </span>
                          )}
                        </div>
                      </div>

                      <p>{check.message}</p>

                      {check.recommendation && (
                        <div className="security-check-recommendation">
                          <strong>Recommended action:</strong>{" "}
                          {check.recommendation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="security-recommendations-section">
        <div className="security-section-heading">
          <div>
            <span className="security-section-eyebrow">
              Configuration actions
            </span>
            <h2>Recommended Actions</h2>
          </div>

          <span className="security-count-badge status-warning">
            {recommendations.length}
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="security-empty-recommendations">
            <FaCheckCircle />
            <div>
              <h3>No outstanding recommendations</h3>
              <p>
                The current deployment configuration passed all
                recommended readiness checks.
              </p>
            </div>
          </div>
        ) : (
          <div className="security-recommendation-list">
            {recommendations.map((item, index) => (
              <article
                key={`${item.key}-${index}`}
                className="security-recommendation-card"
              >
                <div className="security-recommendation-number">
                  {index + 1}
                </div>

                <div>
                  <div className="security-recommendation-heading">
                    <h3>{item.name}</h3>

                    <span
                      className={`security-status-badge status-${item.status}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p>{item.recommendation}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="security-runtime-section">
        <div className="security-section-heading">
          <div>
            <span className="security-section-eyebrow">
              Deployment environment
            </span>
            <h2>Runtime Information</h2>
          </div>
        </div>

        <div className="security-runtime-grid">
          <div>
            <span>Environment</span>
            <strong>{report?.runtime?.environment || "Unknown"}</strong>
          </div>

          <div>
            <span>Python</span>
            <strong>{report?.runtime?.python_version || "Unknown"}</strong>
          </div>

          <div>
            <span>Operating system</span>
            <strong>{report?.runtime?.operating_system || "Unknown"}</strong>
          </div>

          <div>
            <span>Architecture</span>
            <strong>{report?.runtime?.architecture || "Unknown"}</strong>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SecurityConfiguration;