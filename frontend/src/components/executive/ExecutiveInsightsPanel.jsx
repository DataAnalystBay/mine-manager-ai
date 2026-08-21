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
} from "../../api/executiveInsightsApi";

import {
  useLanguage,
} from "../../context/LanguageContext";

import {
  translateDynamicExecutiveHeadline,
  translateDynamicScenario,
} from "../../i18n/dynamicTranslations";

import ExecutiveAiInsightCard from "./ExecutiveAiInsightCard";

import "./ExecutiveInsightsPanel.css";


const EMPTY_INSIGHTS = Object.freeze([]);


/**
 * Ensure the Executive Insights API result always
 * provides a safe array to render.
 */
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


/**
 * Replace simple {variable} placeholders in
 * translation strings.
 */
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
        String(value ?? "")
      );
    },
  );

  return text;
}


/**
 * Convert the frontend LanguageContext value into
 * the language code expected by the backend API.
 *
 * Frontend:
 *   EN
 *   MN
 *
 * Backend:
 *   en
 *   mn
 */
function normalizeApiLanguage(language) {
  const normalized =
    String(language || "EN")
      .trim()
      .toUpperCase();

  return normalized === "MN"
    ? "mn"
    : "en";
}


/**
 * Detect the operational profile.
 *
 * Backend profile is authoritative whenever available.
 * The mine-name fallback preserves compatibility while the
 * executive-insights backend is being migrated to explicit
 * operation_profile output.
 */
function resolveOperationProfile(
  data,
  mineName,
) {
  const backendProfile =
    String(
      data?.operation_profile ||
      data?.operationProfile ||
      ""
    )
      .trim()
      .toLowerCase();

  if (backendProfile) {
    return backendProfile;
  }

  const normalizedMine =
    String(mineName || "")
      .trim()
      .toLowerCase();

  if (
    normalizedMine.includes("achit-ikht") ||
    normalizedMine.includes("achit ikht") ||
    normalizedMine.includes("copper cathode")
  ) {
    return "sxew_copper";
  }

  return "standard_mine";
}


/**
 * Replace standard open-pit terminology with SX-EW terminology.
 *
 * This is a frontend compatibility layer. The backend remains
 * responsible for tenant isolation and should ultimately return
 * operation-aware text directly.
 */
function transformSxewText(
  value,
  apiLanguage,
) {
  if (value === null || value === undefined) {
    return value;
  }

  let text = String(value);

  if (apiLanguage === "mn") {
    const replacements = [
      [/Ore Production/gi, "Катодын зэсийн үйлдвэрлэл"],
      [/ore production/gi, "катодын зэсийн үйлдвэрлэл"],
      [/Ore Performance/gi, "Катодын үйлдвэрлэлийн гүйцэтгэл"],
      [/ore performance/gi, "катодын үйлдвэрлэлийн гүйцэтгэл"],
      [/Plant Performance/gi, "Үйлдвэрийн гүйцэтгэл"],
      [/plant performance/gi, "үйлдвэрийн гүйцэтгэл"],
      [/Process Plant/gi, "Үйлдвэр"],
      [/Cu Recovery/gi, "Cu Recovery"],
      [/Copper Recovery/gi, "Cu Recovery"],
      [/copper recovery/gi, "Cu recovery"],
      [/Mine Operations/gi, "Үйлдвэрлэлийн үйл ажиллагаа"],
      [/mine operations/gi, "үйлдвэрлэлийн үйл ажиллагаа"],
      [/shovel allocation/gi, "үйлдвэрлэлийн хүчин чадлын хуваарилалт"],
      [/mining sequence/gi, "үйлдвэрлэлийн дараалал"],
    ];

    replacements.forEach(
      ([pattern, replacement]) => {
        text = text.replace(
          pattern,
          replacement
        );
      },
    );

    return text;
  }

  const replacements = [
    [/Ore Production/gi, "Cathode Production"],
    [/ore production/gi, "cathode production"],
    [/Ore Performance/gi, "Cathode Production Performance"],
    [/ore performance/gi, "cathode production performance"],
    [/Plant Performance/gi, "Process Plant Performance"],
    [/plant performance/gi, "process plant performance"],
    [/Copper Recovery/gi, "Cu Recovery"],
    [/copper recovery/gi, "Cu recovery"],
    [/Mine Operations/gi, "Process Operations"],
    [/mine operations/gi, "process operations"],
    [/mining sequence/gi, "process operating sequence"],
    [/shovel allocation/gi, "process capacity allocation"],
    [/short-interval control/gi, "short-interval process control"],
  ];

  replacements.forEach(
    ([pattern, replacement]) => {
      text = text.replace(
        pattern,
        replacement
      );
    },
  );

  return text;
}


/**
 * Recursively transform all string fields in one insight.
 *
 * This means the compatibility layer still works even when the
 * ExecutiveAiInsightCard consumes fields such as title,
 * summary, recommendation, driver, scenario, or description.
 */
function transformInsightObject(
  value,
  apiLanguage,
) {
  if (Array.isArray(value)) {
    return value.map(
      (item) =>
        transformInsightObject(
          item,
          apiLanguage
        )
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, itemValue]) => [
          key,
          transformInsightObject(
            itemValue,
            apiLanguage
          ),
        ],
      )
    );
  }

  if (typeof value === "string") {
    return transformSxewText(
      value,
      apiLanguage
    );
  }

  return value;
}


/**
 * Waste and Fleet are not applicable to the current
 * Achit-Ikht SX-EW executive profile.
 *
 * Detect them across common insight fields so legacy backend
 * responses do not surface false 0% risks.
 */
function isInapplicableSxewInsight(
  insight,
) {
  const searchable = [
    insight?.insight_key,
    insight?.kpi_key,
    insight?.category,
    insight?.title,
    insight?.headline,
    insight?.summary,
    insight?.message,
    insight?.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    searchable.includes("waste") ||
    searchable.includes("fleet") ||
    searchable.includes("truck") ||
    searchable.includes("haul road") ||
    searchable.includes("shovel")
  );
}


function ExecutiveInsightsPanel({
  mineName = "Oyu Tolgoi Surface",
  scenario = "",
}) {
  /*
   * Important:
   *
   * We need both `language` and `t`.
   *
   * `t` handles frontend/static translations.
   *
   * `language` is also sent to the backend so
   * dynamically generated Executive Insights can
   * be generated in English or Mongolian.
   */
  const {
    language,
    t,
  } = useLanguage();


  const apiLanguage =
    useMemo(
      () =>
        normalizeApiLanguage(
          language
        ),
      [language]
    );


  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /**
   * Load Executive Insights from the backend.
   *
   * The selected UI language is passed to the API.
   */
  const loadInsights =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await getExecutiveInsights(
            mineName,
            scenario,
            apiLanguage
          );

        setData(response);
      } catch (requestError) {
        console.error(
          "Executive insights load failed:",
          requestError
        );

        setData(null);

        setError(
          t(
            "executiveInsights.loadError"
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      mineName,
      scenario,
      apiLanguage,
      t,
    ]);


  /**
   * Reload when:
   *
   * - mine changes
   * - scenario changes
   * - language changes
   */
  useEffect(() => {
    loadInsights();
  }, [
    loadInsights,
  ]);


  /**
   * Use backend operation_profile when available.
   *
   * For current Achit-Ikht compatibility, mineName is a fallback.
   */
  const operationProfile =
    useMemo(
      () =>
        resolveOperationProfile(
          data,
          mineName
        ),
      [
        data,
        mineName,
      ]
    );


  const isSxewOperation =
    operationProfile ===
    "sxew_copper";


  /**
   * Normalize, remove non-applicable KPIs, and apply
   * SX-EW terminology to legacy insight payloads.
   */
  const insights =
    useMemo(() => {
      const normalized =
        normalizeInsights(
          data?.insights
        );

      if (!isSxewOperation) {
        return normalized;
      }

      return normalized
        .filter(
          (insight) =>
            !isInapplicableSxewInsight(
              insight
            )
        )
        .map(
          (insight) =>
            transformInsightObject(
              insight,
              apiLanguage
            )
        );
    }, [
      data?.insights,
      isSxewOperation,
      apiLanguage,
    ]);


  /**
   * Executive headline.
   *
   * Standard mine:
   *   preserve existing dynamic translation helper.
   *
   * SX-EW:
   *   first translate legacy headline content into
   *   operation-appropriate terminology.
   */
  const executiveHeadline =
    useMemo(() => {
      const value =
        String(
          data?.executive_headline ||
          ""
        ).trim();

      if (!value) {
        return t(
          "executiveInsights.noHeadline"
        );
      }

      if (isSxewOperation) {
        return transformSxewText(
          value,
          apiLanguage
        );
      }

      return (
        translateDynamicExecutiveHeadline(
          value,
          t
        ) ||
        value
      );
    }, [
      data?.executive_headline,
      isSxewOperation,
      apiLanguage,
      t,
    ]);


  const reportingPeriod =
    useMemo(() => {
      const value =
        String(
          data?.reporting_period ||
          ""
        ).trim();

      return (
        value ||
        t(
          "executiveInsights.reportingPeriodUnavailable"
        )
      );
    }, [
      data?.reporting_period,
      t,
    ]);


  /**
   * Translate demo scenario names where a dynamic
   * translation exists.
   */
  const activeScenario =
    useMemo(() => {
      const value =
        String(
          data?.scenario ||
          scenario ||
          ""
        ).trim();

      if (!value) {
        return "";
      }

      return (
        translateDynamicScenario(
          value,
          t
        ) ||
        value
      );
    }, [
      data?.scenario,
      scenario,
      t,
    ]);


  /**
   * Human-readable mode label.
   */
  const modeLabel =
    useMemo(() => {
      const value =
        String(
          data?.mode ||
          ""
        )
          .trim()
          .toLowerCase();

      if (value === "demo") {
        return t(
          "executiveInsights.demoScenario"
        );
      }

      return t(
        "executiveInsights.liveIntelligence"
      );
    }, [
      data?.mode,
      t,
    ]);


  /**
   * Human-readable operation profile.
   */
  const operationProfileLabel =
    useMemo(() => {
      if (!isSxewOperation) {
        return "";
      }

      return apiLanguage === "mn"
        ? "SX-EW зэсийн үйл ажиллагаа"
        : "SX-EW Copper Operation";
    }, [
      isSxewOperation,
      apiLanguage,
    ]);


  /**
   * Use the filtered insight count for SX-EW rather than
   * the backend's legacy total, which may still include
   * Waste/Fleet insights.
   */
  const totalInsights =
    isSxewOperation
      ? insights.length
      : Number(
          data?.total_insights ||
          insights.length ||
          0
        );


  const insightsCountLabel =
    useMemo(
      () =>
        translateTemplate(
          t,
          "executiveInsights.insightsCount",
          {
            count:
              totalInsights,
          }
        ),
      [
        t,
        totalInsights,
      ]
    );


  return (
    <section
      className="executive-insights-panel"
      aria-label={t(
        "executiveInsights.ariaLabel"
      )}
    >
      <header className="executive-insights-panel-header">
        <div className="executive-insights-panel-heading">
          <span className="executive-insights-panel-icon">
            <FiCpu />
          </span>

          <div className="executive-insights-panel-copy">
            <span className="executive-insights-panel-eyebrow">
              {t(
                "executiveInsights.eyebrow"
              )}
            </span>

            <h2 className="executive-insights-panel-title">
              {t(
                "executiveInsights.title"
              )}
            </h2>

            <p className="executive-insights-panel-period">
              {reportingPeriod}
            </p>

            <p
              style={{
                margin:
                  "4px 0 0",
                color:
                  data?.mode ===
                  "demo"
                    ? "#b45309"
                    : "#64748b",
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {modeLabel}

              {operationProfileLabel
                ? ` · ${operationProfileLabel}`
                : ""}

              {activeScenario
                ? ` · ${activeScenario}`
                : ""}
            </p>
          </div>
        </div>


        <div className="executive-insights-panel-controls">
          <span
            className="executive-insights-count"
            aria-label={
              insightsCountLabel
            }
          >
            {totalInsights}
          </span>

          <button
            type="button"
            className="executive-insights-refresh"
            onClick={
              loadInsights
            }
            disabled={
              loading
            }
            aria-label={t(
              "executiveInsights.refreshAria"
            )}
            title={t(
              "executiveInsights.refreshAria"
            )}
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
                {t(
                  "executiveInsights.loading"
                )}
              </p>
            </div>
          </div>
        )}


        {!loading &&
          error && (
            <div
              className="executive-insights-error"
              role="alert"
            >
              <FiAlertCircle />

              <div>
                <strong>
                  {t(
                    "executiveInsights.unavailable"
                  )}
                </strong>

                <p>
                  {error}
                </p>
              </div>
            </div>
          )}


        {!loading &&
          !error &&
          insights.length ===
            0 && (
            <div className="executive-insights-empty">
              {t(
                "executiveInsights.empty"
              )}
            </div>
          )}


        {!loading &&
          !error &&
          insights.length >
            0 && (
            <>
              <div className="executive-insights-headline">
                <span className="executive-insights-headline-label">
                  {t(
                    "executiveInsights.executiveHeadline"
                  )}
                </span>

                <p>
                  {
                    executiveHeadline
                  }
                </p>
              </div>


              <div className="executive-insights-list">
                {insights.map(
                  (
                    insight
                  ) => (
                    <ExecutiveAiInsightCard
                      key={
                        insight.insight_key
                      }
                      insight={
                        insight
                      }
                    />
                  )
                )}
              </div>
            </>
          )}
      </div>
    </section>
  );
}


/**
 * Only parent props need to be compared here.
 *
 * LanguageContext updates are independent of React.memo,
 * so changing EN <-> MN will still re-render this
 * component through useLanguage().
 */
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
