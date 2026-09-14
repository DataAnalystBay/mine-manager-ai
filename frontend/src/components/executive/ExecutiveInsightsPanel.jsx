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

import {
  formatDisplayDate,
} from "../../utils/displayDateTime";

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
    /*
     * Translate the deterministic English phrases returned by the
     * Executive Insights backend before the card renders them.
     * Keep product/technical abbreviations such as SX-EW, PLS and EW.
     */

    const sentenceReplacements = [
      [
        /^Immediate executive attention is required:\s*(.+)\.$/i,
        "Удирдлагын яаралтай анхаарал шаардлагатай: $1.",
      ],
      [
        /^High-priority operational review required:\s*(.+)\.$/i,
        "Үйл ажиллагааны өндөр ач холбогдолтой хяналт шаардлагатай: $1.",
      ],
      [
        /^Cathode Production is ([\d.]+)% below target, operating at ([\d.]+)% of plan\.$/i,
        "Катодын зэсийн үйлдвэрлэл зорилтоос $1%-иар доогуур, төлөвлөгөөний $2%-ийн гүйцэтгэлтэй байна.",
      ],
      [
        /^Cathode Production is ([\d.]+) percentage points below target performance\.$/i,
        "Катодын зэсийн үйлдвэрлэлийн гүйцэтгэл зорилтот түвшнээс $1 нэгж хувиар доогуур байна.",
      ],
      [
        /^Cathode Production is ([\d.]+)% above target, operating at ([\d.]+)% of plan\.$/i,
        "Катодын зэсийн үйлдвэрлэл зорилтоос $1%-иар дээгүүр, төлөвлөгөөний $2%-ийн гүйцэтгэлтэй байна.",
      ],
      [
        /^Mine Health trend is (.+)\.$/i,
        "Уурхайн нэгдсэн төлөвийн хандлага $1 байна.",
      ],
      [
        /^Mine Health is (.+) over the available reporting period\.$/i,
        "Боломжит тайлант хугацаанд уурхайн нэгдсэн төлөв $1 байна.",
      ],
      [
        /^The score changed from ([\d.]+)% to ([\d.]+)%, a movement of (-?[\d.]+) percentage points\.$/i,
        "Нэгдсэн үнэлгээ $1%-аас $2% болж, $3 нэгж хувиар өөрчлөгдсөн.",
      ],
      [
        /^No negative direct cathode production impact is currently estimated\.$/i,
        "Одоогоор катодын зэсийн үйлдвэрлэлд шууд сөрөг нөлөө үүсэхээргүй байна.",
      ],
      [
        /^Maintain current operating rhythm and continue monitoring leading indicators\.$/i,
        "Одоогийн үйл ажиллагааны хэмнэлийг хадгалж, тэргүүлэх үзүүлэлтүүдийн хяналтыг үргэлжлүүлнэ үү.",
      ],
    ];

    sentenceReplacements.forEach(([pattern, replacement]) => {
      text = text.replace(pattern, replacement);
    });

    const replacements = [
      [/Available reporting period/gi, "Боломжит тайлант хугацаа"],
      [/Cathode Production Below Target/gi, "Катодын зэсийн үйлдвэрлэл зорилтот түвшнээс доогуур"],
      [/Cathode Production/gi, "Катодын зэсийн үйлдвэрлэл"],
      [/cathode production/gi, "катодын зэсийн үйлдвэрлэл"],
      [/Ore Production/gi, "Катодын зэсийн үйлдвэрлэл"],
      [/ore production/gi, "катодын зэсийн үйлдвэрлэл"],
      [/Ore Performance/gi, "Катодын үйлдвэрлэлийн гүйцэтгэл"],
      [/ore performance/gi, "катодын үйлдвэрлэлийн гүйцэтгэл"],
      [/Plant Performance/gi, "Үйлдвэрийн гүйцэтгэл"],
      [/plant performance/gi, "үйлдвэрийн гүйцэтгэл"],
      [/Process Plant/gi, "Үйлдвэр"],
      [/Cu Recovery/gi, "Зэс авалт"],
      [/Cu recovery/gi, "зэс авалт"],
      [/Copper Recovery/gi, "Зэс авалт"],
      [/copper recovery/gi, "зэс авалт"],
      [/Mine Health Score/gi, "Уурхайн нэгдсэн төлөвийн үнэлгээ"],
      [/Mine Health/gi, "Уурхайн нэгдсэн төлөв"],
      [/Mine Operations/gi, "Үйлдвэрлэлийн үйл ажиллагаа"],
      [/mine operations/gi, "үйлдвэрлэлийн үйл ажиллагаа"],
      [/shovel allocation/gi, "үйлдвэрлэлийн хүчин чадлын хуваарилалт"],
      [/mining sequence/gi, "үйлдвэрлэлийн дараалал"],
      [/short-interval control/gi, "богино хугацааны үйл ажиллагааны хяналт"],
      [/percentage points/gi, "нэгж хувь"],
      [/below target performance/gi, "зорилтот түвшнээс доогуур"],
      [/below target/gi, "зорилтот түвшнээс доогуур"],
      [/operating at/gi, "гүйцэтгэл"],
      [/of plan/gi, "төлөвлөгөөний"],
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
 * Translate deterministic Executive Insights backend text for a
 * standard mining operation when the UI language is Mongolian.
 *
 * This is display-only compatibility logic. Raw API values and
 * backend calculations remain unchanged.
 */
function transformStandardMineText(
  value,
  apiLanguage,
) {
  if (value === null || value === undefined) {
    return value;
  }

  let text = String(value);

  if (apiLanguage !== "mn") {
    return text;
  }

  const sentenceReplacements = [
    [
      /^Ore Production is ([\d.]+)% above target, operating at ([\d.]+)% of plan\.$/i,
      "Хүдрийн олборлолт зорилтоос $1%-иар дээгүүр, төлөвлөгөөний $2%-ийн гүйцэтгэлтэй байна.",
    ],
    [
      /^Ore Production is ([\d.]+)% below target, operating at ([\d.]+)% of plan\.$/i,
      "Хүдрийн олборлолт зорилтоос $1%-иар доогуур, төлөвлөгөөний $2%-ийн гүйцэтгэлтэй байна.",
    ],
    [
      /^Waste Movement is ([\d.]+)% above target, operating at ([\d.]+)% of plan\.$/i,
      "Хөрс хуулалт зорилтоос $1%-иар дээгүүр, төлөвлөгөөний $2%-ийн гүйцэтгэлтэй байна.",
    ],
    [
      /^Waste Movement is ([\d.]+)% below target, operating at ([\d.]+)% of plan\.$/i,
      "Хөрс хуулалт зорилтоос $1%-иар доогуур, төлөвлөгөөний $2%-ийн гүйцэтгэлтэй байна.",
    ],
    [
      /^Fleet Performance is ([\d.]+)% above target, operating at ([\d.]+)% of plan\.$/i,
      "Техникийн гүйцэтгэл зорилтоос $1%-иар дээгүүр, төлөвлөгөөний $2%-ийн гүйцэтгэлтэй байна.",
    ],
    [
      /^Fleet Performance is ([\d.]+)% below target, operating at ([\d.]+)% of plan\.$/i,
      "Техникийн гүйцэтгэл зорилтоос $1%-иар доогуур, төлөвлөгөөний $2%-ийн гүйцэтгэлтэй байна.",
    ],
    [
      /^Plant Performance is ([\d.]+)% above target, operating at ([\d.]+)% of plan\.$/i,
      "Үйлдвэрийн гүйцэтгэл зорилтоос $1%-иар дээгүүр, төлөвлөгөөний $2%-ийн гүйцэтгэлтэй байна.",
    ],
    [
      /^Plant Performance is ([\d.]+)% below target, operating at ([\d.]+)% of plan\.$/i,
      "Үйлдвэрийн гүйцэтгэл зорилтоос $1%-иар доогуур, төлөвлөгөөний $2%-ийн гүйцэтгэлтэй байна.",
    ],
    [
      /^Mine Health trend is (.+)\.$/i,
      "Уурхайн нэгдсэн төлөвийн хандлага $1 байна.",
    ],
    [
      /^Mine Health is (.+) over the available reporting period\.$/i,
      "Боломжит тайлант хугацаанд уурхайн нэгдсэн төлөв $1 байна.",
    ],
    [
      /^No negative ore production performance gap is currently estimated\.$/i,
      "Одоогоор хүдрийн олборлолтын гүйцэтгэлд сөрөг зөрүү тооцоологдоогүй байна.",
    ],
    [
      /^No negative waste movement performance gap is currently estimated\.$/i,
      "Одоогоор хөрс хуулалтын гүйцэтгэлд сөрөг зөрүү тооцоологдоогүй байна.",
    ],
    [
      /^No negative fleet performance gap is currently estimated\.$/i,
      "Одоогоор техникийн гүйцэтгэлд сөрөг зөрүү тооцоологдоогүй байна.",
    ],
    [
      /^No negative plant performance gap is currently estimated\.$/i,
      "Одоогоор үйлдвэрийн гүйцэтгэлд сөрөг зөрүү тооцоологдоогүй байна.",
    ],
    [
      /^Immediate executive attention is required:\s*(.+)\.$/i,
      "Удирдлагын яаралтай анхаарал шаардлагатай: $1.",
    ],
    [
      /^High-priority operational review required:\s*(.+)\.$/i,
      "Үйл ажиллагааны өндөр ач холбогдолтой хяналт шаардлагатай: $1.",
    ],
    [
      /^The score changed from ([\d.]+)% to ([\d.]+)%, a movement of (-?[\d.]+) percentage points\.$/i,
      "Нэгдсэн үнэлгээ $1%-аас $2% болж, $3 нэгж хувиар өөрчлөгдсөн.",
    ],
    [
      /^Maintain current operating rhythm and continue monitoring leading indicators\.$/i,
      "Одоогийн үйл ажиллагааны хэмнэлийг хадгалж, тэргүүлэх үзүүлэлтүүдийн хяналтыг үргэлжлүүлнэ үү.",
    ],
  ];

  sentenceReplacements.forEach(
    ([pattern, replacement]) => {
      text = text.replace(
        pattern,
        replacement,
      );
    },
  );

  const replacements = [
    [/Available reporting period/gi, "Боломжит тайлант хугацаа"],
    [/Ore Production Above Target/gi, "Хүдрийн олборлолт зорилтоос дээгүүр"],
    [/Ore Production Below Target/gi, "Хүдрийн олборлолт зорилтоос доогуур"],
    [/Waste Movement Above Target/gi, "Хөрс хуулалт зорилтоос дээгүүр"],
    [/Waste Movement Below Target/gi, "Хөрс хуулалт зорилтоос доогуур"],
    [/Fleet Performance Above Target/gi, "Техникийн гүйцэтгэл зорилтоос дээгүүр"],
    [/Fleet Performance Below Target/gi, "Техникийн гүйцэтгэл зорилтоос доогуур"],
    [/Plant Performance Above Target/gi, "Үйлдвэрийн гүйцэтгэл зорилтоос дээгүүр"],
    [/Plant Performance Below Target/gi, "Үйлдвэрийн гүйцэтгэл зорилтоос доогуур"],
    [/Ore Production/gi, "Хүдрийн олборлолт"],
    [/ore production/gi, "хүдрийн олборлолт"],
    [/Waste Movement/gi, "Хөрс хуулалт"],
    [/waste movement/gi, "хөрс хуулалт"],
    [/Fleet Performance/gi, "Техникийн гүйцэтгэл"],
    [/fleet performance/gi, "техникийн гүйцэтгэл"],
    [/Plant Performance/gi, "Үйлдвэрийн гүйцэтгэл"],
    [/plant performance/gi, "үйлдвэрийн гүйцэтгэл"],
    [/Safety Performance/gi, "Аюулгүй ажиллагааны гүйцэтгэл"],
    [/safety performance/gi, "аюулгүй ажиллагааны гүйцэтгэл"],
    [/Mine Health Score/gi, "Уурхайн нэгдсэн төлөвийн үнэлгээ"],
    [/Mine Health/gi, "Уурхайн нэгдсэн төлөв"],
    [/percentage points/gi, "нэгж хувь"],
    [/below target performance/gi, "зорилтот түвшнээс доогуур"],
    [/above target performance/gi, "зорилтот түвшнээс дээгүүр"],
  ];

  replacements.forEach(
    ([pattern, replacement]) => {
      text = text.replace(
        pattern,
        replacement,
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
  isSxewOperation,
) {
  if (Array.isArray(value)) {
    return value.map(
      (item) =>
        transformInsightObject(
          item,
          apiLanguage,
          isSxewOperation
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
            apiLanguage,
            isSxewOperation
          ),
        ],
      )
    );
  }

  if (typeof value === "string") {
    return isSxewOperation
      ? transformSxewText(
          value,
          apiLanguage
        )
      : transformStandardMineText(
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
  displayMineName = mineName,
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

      const applicableInsights =
        isSxewOperation
          ? normalized.filter(
              (insight) =>
                !isInapplicableSxewInsight(
                  insight
                )
            )
          : normalized;

      if (
        apiLanguage !== "mn" &&
        !isSxewOperation
      ) {
        return applicableInsights;
      }

      return applicableInsights.map(
        (insight) =>
          transformInsightObject(
            insight,
            apiLanguage,
            isSxewOperation
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

      const translatedHeadline =
        translateDynamicExecutiveHeadline(
          value,
          t
        ) ||
        value;

      const operationAwareHeadline =
        isSxewOperation
          ? transformSxewText(
              translatedHeadline,
              apiLanguage
            )
          : transformStandardMineText(
              translatedHeadline,
              apiLanguage
            );

      return apiLanguage === "mn" && displayMineName
        ? operationAwareHeadline.replaceAll(
            mineName,
            displayMineName,
          )
        : operationAwareHeadline;
    }, [
      data?.executive_headline,
      isSxewOperation,
      apiLanguage,
      displayMineName,
      mineName,
      t,
    ]);


  const reportingPeriod =
    useMemo(() => {
      const value =
        String(
          data?.reporting_period ||
          ""
        ).trim();

      if (!value) {
        return t(
          "executiveInsights.reportingPeriodUnavailable"
        );
      }

      if (apiLanguage === "mn") {
        if (value === "Available reporting period") {
          return t(
            "executiveInsights.reportingPeriodUnavailable"
          );
        }

        const range = value.match(
          /^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/
        );

        if (range) {
          return `${formatDisplayDate(range[1], "MN")} – ${formatDisplayDate(range[2], "MN")}`;
        }
      }

      return isSxewOperation
        ? transformSxewText(
            value,
            apiLanguage
          )
        : transformStandardMineText(
            value,
            apiLanguage
          );
    }, [
      data?.reporting_period,
      isSxewOperation,
      apiLanguage,
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
    previousProps.displayMineName ===
      nextProps.displayMineName &&
    previousProps.scenario ===
      nextProps.scenario
  );
}


export default memo(
  ExecutiveInsightsPanel,
  areExecutiveInsightsPanelPropsEqual
);
