import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaSyncAlt,
  FaTimesCircle,
} from "react-icons/fa";

import { getDeploymentReadiness } from "../api/deploymentReadinessApi";
import { useLanguage } from "../context/LanguageContext";
import { formatDisplayDateTime } from "../utils/displayDateTime";
import "./SecurityConfiguration.css";


const formatGeneratedDate = (value, language, t) => {
  if (!value) {
    return t("common.notAvailable");
  }

  return formatDisplayDateTime(value, language, {
    seconds: true,
    fallback: value,
  });
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

const formatSecurityStatus = (status, t) => {
  const normalized = String(status || "unknown").trim().toLowerCase();
  const key = ["pass", "warning", "fail", "ready", "not_ready", "pilot_ready", "production_ready", "unknown"].includes(normalized)
    ? `securityConfiguration.status_${normalized}`
    : null;
  return key ? t(key) : String(status || t("securityConfiguration.unknown"));
};


const SecurityConfiguration = () => {
  const { language, t } = useLanguage();
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
          t("securityConfiguration.loadError"),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);


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
          <h2>{t("securityConfiguration.checking")}</h2>
          <p>{t("securityConfiguration.checkingDescription")}</p>
        </div>
      </div>
    );
  }


  if (error && !report) {
    return (
      <div className="security-config-page">
        <div className="security-error-state">
          <FaTimesCircle />
          <h2>{t("securityConfiguration.unavailable")}</h2>
          <p>{error}</p>

          <button
            type="button"
            className="security-primary-button"
            onClick={() => loadReadinessReport()}
          >
            {t("securityConfiguration.tryAgain")}
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
            {t("securityConfiguration.eyebrow")}
          </div>

          <h1>{t("securityConfiguration.title")}</h1>

          <p>{t("securityConfiguration.subtitle")}</p>
        </div>

        <button
          type="button"
          className="security-refresh-button"
          onClick={() => loadReadinessReport(true)}
          disabled={refreshing}
        >
          <FaSyncAlt className={refreshing ? "is-spinning" : ""} />
          {refreshing ? t("securityConfiguration.refreshing") : t("securityConfiguration.refreshChecks")}
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
                {t("securityConfiguration.deploymentStatus")}
              </span>
              <h2>{formatSecurityStatus(readiness.status || readiness.label, t)}</h2>
            </div>

            <div className="security-score-circle">
              <strong>{score.percentage ?? 0}%</strong>
              <span>{t("securityConfiguration.ready")}</span>
            </div>
          </div>

          <p>{readiness.message}</p>

          <div className="security-generated-time">
            {t("securityConfiguration.lastChecked")}: {formatGeneratedDate(report?.generated_at, language, t)}
          </div>
        </article>

        <article className="security-summary-card summary-pass">
          <div className="security-summary-icon">
            <FaCheckCircle />
          </div>
          <div>
            <span>{t("securityConfiguration.passed")}</span>
            <strong>{summary.passed ?? 0}</strong>
          </div>
        </article>

        <article className="security-summary-card summary-warning">
          <div className="security-summary-icon">
            <FaExclamationTriangle />
          </div>
          <div>
            <span>{t("securityConfiguration.warnings")}</span>
            <strong>{summary.warnings ?? 0}</strong>
          </div>
        </article>

        <article className="security-summary-card summary-fail">
          <div className="security-summary-icon">
            <FaTimesCircle />
          </div>
          <div>
            <span>{t("securityConfiguration.failed")}</span>
            <strong>{summary.failed ?? 0}</strong>
          </div>
        </article>
      </section>

      {blockingChecks.length > 0 && (
        <section className="security-blocking-section">
          <div className="security-section-heading">
            <div>
              <span className="security-section-eyebrow">
                {t("securityConfiguration.immediateAttention")}
              </span>
              <h2>{t("securityConfiguration.blockingIssues")}</h2>
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
              {t("securityConfiguration.systemValidation")}
            </span>
            <h2>{t("securityConfiguration.readinessChecks")}</h2>
          </div>

          <span className="security-total-checks">
            {summary.total_checks ?? 0} {t("securityConfiguration.checks")}
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
                  {t(`securityConfiguration.category_${categoryKey}`) || categoryKey}
                </h3>

                <span>{checks.length} {t("securityConfiguration.checks")}</span>
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
                            {formatSecurityStatus(check.status, t)}
                          </span>

                          {!check.required && (
                            <span className="security-optional-badge">
                              {t("securityConfiguration.optional")}
                            </span>
                          )}
                        </div>
                      </div>

                      <p>{check.message}</p>

                      {check.recommendation && (
                        <div className="security-check-recommendation">
                          <strong>{t("securityConfiguration.recommendedAction")}:</strong>{" "}
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
              {t("securityConfiguration.configurationActions")}
            </span>
            <h2>{t("securityConfiguration.recommendedActions")}</h2>
          </div>

          <span className="security-count-badge status-warning">
            {recommendations.length}
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="security-empty-recommendations">
            <FaCheckCircle />
            <div>
              <h3>{t("securityConfiguration.noRecommendations")}</h3>
              <p>{t("securityConfiguration.noRecommendationsDescription")}</p>
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
                      {formatSecurityStatus(item.status, t)}
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
              {t("securityConfiguration.deploymentEnvironment")}
            </span>
            <h2>{t("securityConfiguration.runtimeInformation")}</h2>
          </div>
        </div>

        <div className="security-runtime-grid">
          <div>
            <span>{t("securityConfiguration.environment")}</span>
            <strong>{report?.runtime?.environment || t("securityConfiguration.unknown")}</strong>
          </div>

          <div>
            <span>Python</span>
            <strong>{report?.runtime?.python_version || t("securityConfiguration.unknown")}</strong>
          </div>

          <div>
            <span>{t("securityConfiguration.operatingSystem")}</span>
            <strong>{report?.runtime?.operating_system || t("securityConfiguration.unknown")}</strong>
          </div>

          <div>
            <span>{t("securityConfiguration.architecture")}</span>
            <strong>{report?.runtime?.architecture || t("securityConfiguration.unknown")}</strong>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SecurityConfiguration;
