import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiCpu,
  FiRefreshCw,
} from "react-icons/fi";

import {
  getExecutiveInsights,
  getExecutiveInsightsErrorMessage,
} from "../../api/executiveInsightsApi";

import ExecutiveAiInsightCard from "./ExecutiveAiInsightCard";

import "./ExecutiveInsightsPanel.css";


const EMPTY_INSIGHTS = Object.freeze([]);


function normalizeInsights(value) {
  if (!Array.isArray(value)) {
    return EMPTY_INSIGHTS;
  }

  return value.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      item.insight_key
  );
}


function ExecutiveInsightsPanel({
  mineName = "Oyu Tolgoi Surface",
  scenario = "",
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getExecutiveInsights(
        mineName,
        scenario
      );

      setData(response);
    } catch (requestError) {
      setData(null);

      setError(
        getExecutiveInsightsErrorMessage(
          requestError,
          "Unable to load AI executive insights."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [mineName, scenario]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const insights = useMemo(
    () => normalizeInsights(data?.insights),
    [data?.insights]
  );

  const executiveHeadline = useMemo(() => {
    const value = String(
      data?.executive_headline || ""
    ).trim();

    return (
      value ||
      "No executive insight headline is currently available."
    );
  }, [data?.executive_headline]);

  const reportingPeriod = useMemo(() => {
    const value = String(
      data?.reporting_period || ""
    ).trim();

    return (
      value ||
      "Reporting period unavailable"
    );
  }, [data?.reporting_period]);

  const activeScenario = useMemo(() => {
    const value = String(
      data?.scenario || scenario || ""
    ).trim();

    return value;
  }, [data?.scenario, scenario]);

  const modeLabel = useMemo(() => {
    const value = String(
      data?.mode || ""
    ).trim().toLowerCase();

    if (value === "demo") {
      return "Demo Scenario";
    }

    return "Live Intelligence";
  }, [data?.mode]);

  const totalInsights = Number(
    data?.total_insights ||
      insights.length ||
      0
  );

  return (
    <section
      className="executive-insights-panel"
      aria-label="AI Executive Insights"
    >
      <header className="executive-insights-panel-header">
        <div className="executive-insights-panel-heading">
          <span className="executive-insights-panel-icon">
            <FiCpu />
          </span>

          <div className="executive-insights-panel-copy">
            <span className="executive-insights-panel-eyebrow">
              Decision Support Intelligence
            </span>

            <h2 className="executive-insights-panel-title">
              AI Executive Insights
            </h2>

            <p className="executive-insights-panel-period">
              {reportingPeriod}
            </p>

            <p
              style={{
                margin: "4px 0 0",
                color:
                  data?.mode === "demo"
                    ? "#b45309"
                    : "#64748b",
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {modeLabel}
              {activeScenario
                ? ` · ${activeScenario}`
                : ""}
            </p>
          </div>
        </div>

        <div className="executive-insights-panel-controls">
          <span
            className="executive-insights-count"
            aria-label={`${totalInsights} executive insights`}
          >
            {totalInsights}
          </span>

          <button
            type="button"
            className="executive-insights-refresh"
            onClick={loadInsights}
            disabled={loading}
            aria-label="Refresh executive insights"
            title="Refresh executive insights"
          >
            <FiRefreshCw />
          </button>
        </div>
      </header>

      <div className="executive-insights-panel-content">
        {loading && (
          <div
            className="executive-insights-loading"
            role="status"
            aria-live="polite"
          >
            <div>
              <div className="executive-insights-loading-spinner" />

              <p>
                Loading AI executive insights...
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div
            className="executive-insights-error"
            role="alert"
          >
            <FiAlertCircle />

            <div>
              <strong>
                Executive insights unavailable
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          insights.length === 0 && (
            <div className="executive-insights-empty">
              No executive insights are currently
              available.
            </div>
          )}

        {!loading &&
          !error &&
          insights.length > 0 && (
            <>
              <div className="executive-insights-headline">
                <span className="executive-insights-headline-label">
                  Executive Headline
                </span>

                <p>{executiveHeadline}</p>
              </div>

              <div className="executive-insights-list">
                {insights.map((insight) => (
                  <ExecutiveAiInsightCard
                    key={insight.insight_key}
                    insight={insight}
                  />
                ))}
              </div>
            </>
          )}
      </div>
    </section>
  );
}


function areExecutiveInsightsPanelPropsEqual(
  previousProps,
  nextProps
) {
  return (
    previousProps.mineName ===
      nextProps.mineName &&
    previousProps.scenario ===
      nextProps.scenario
  );
}


export default memo(
  ExecutiveInsightsPanel,
  areExecutiveInsightsPanelPropsEqual
);