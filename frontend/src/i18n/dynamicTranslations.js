function normalizeDynamicValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
 
 
function translateMappedValue(
  value,
  t,
  translationMap,
) {
  const normalized =
    normalizeDynamicValue(value);
 
  if (!normalized) {
    return "";
  }
 
  const translationKey =
    translationMap[normalized];
 
  return translationKey
    ? t(translationKey)
    : value;
}
 
 
function isMongolian(t) {
  return t("common.language") === "Хэл";
}


function formatMongolianDativeKpi(value) {
  const text = String(value || "").trim();

  const dativeMap = {
    "Хүдрийн олборлолт":
      "Хүдрийн олборлолтод",

    "Хөрс хуулалт":
      "Хөрс хуулалтад",

    "Техникийн гүйцэтгэл":
      "Техникийн гүйцэтгэлд",

    "Техникийн ашиглалт":
      "Техникийн ашиглалтад",

    "Техникийн бэлэн байдал":
      "Техникийн бэлэн байдалд",

    "Үйлдвэрийн гүйцэтгэл":
      "Үйлдвэрийн гүйцэтгэлд",

    "Аюулгүй ажиллагаа":
      "Аюулгүй ажиллагаанд",

    "Уурхайн төлөв":
      "Уурхайн төлөвт",

    "Засварын сэргэлт":
      "Засварын сэргэлтэд",
  };

  return dativeMap[text] || `${text}-д`;
}
 
 
function formatNumber(value) {
  const numericValue = Number(value);
 
  if (!Number.isFinite(numericValue)) {
    return value;
  }
 
  return numericValue.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });
}
 
 
/* ======================================================
   KPI NAMES
====================================================== */
 
export function translateDynamicKpiName(
  value,
  t,
) {
  const kpiMap = {
    "mine health":
      "dynamicKpiNames.mineHealth",

    "mine health score":
      "dynamicKpiNames.mineHealth",

    "mine health performance":
      "dynamicKpiNames.mineHealth",

    "ore production":
      "dynamicKpiNames.oreProduction",

    "ore production performance":
      "dynamicKpiNames.oreProduction",

    "ore performance":
      "dynamicKpiNames.oreProduction",

    "ore production performance analysis":
      "dynamicKpiNames.oreProduction",

    "waste movement":
      "dynamicKpiNames.wasteMovement",

    "waste movement performance":
      "dynamicKpiNames.wasteMovement",

    "waste performance":
      "dynamicKpiNames.wasteMovement",

    "fleet":
      "dynamicKpiNames.fleetPerformance",

    "fleet performance":
      "dynamicKpiNames.fleetPerformance",

    "fleet utilization":
      "dynamicKpiNames.fleetPerformance",

    "fleet availability":
      "dynamicKpiNames.fleetPerformance",

    "plant":
      "dynamicKpiNames.plantPerformance",

    "plant performance":
      "dynamicKpiNames.plantPerformance",

    "processing performance":
      "dynamicKpiNames.plantPerformance",

    "plant throughput":
      "dynamicKpiNames.plantPerformance",

    "safety":
      "dynamicKpiNames.safetyPerformance",

    "safety performance":
      "dynamicKpiNames.safetyPerformance",

    "safety incidents":
      "dynamicKpiNames.safetyPerformance",

    "safety incident performance":
      "dynamicKpiNames.safetyPerformance",
  };

  const normalizedKpiName =
    normalizeDynamicValue(
      String(value || "")
        .replaceAll("_", " ")
        .replaceAll("-", " ")
    );

  /*
   * Executive Action analytics can return the same
   * logical KPI using backend keys, display names,
   * underscores, or hyphens.
   *
   * Normalize those variants here so the backend
   * contract stays unchanged while the UI remains
   * customer-friendly.
   */
  if (
    normalizedKpiName ===
    "ai recommended actions"
  ) {
    return isMongolian(t)
      ? "AI-аас санал болгосон арга хэмжээ"
      : "AI Recommended Actions";
  }

  if (
    normalizedKpiName === "ai"
  ) {
    return "AI";
  }

  if (
    normalizedKpiName ===
    "fleet utilization"
  ) {
    return isMongolian(t)
      ? "Техникийн ашиглалт"
      : "Fleet Utilization";
  }

  if (
    normalizedKpiName ===
    "fleet availability"
  ) {
    return isMongolian(t)
      ? "Техникийн бэлэн байдал"
      : "Fleet Availability";
  }

  if (
    normalizedKpiName ===
    "maintenance recovery"
  ) {
    return isMongolian(t)
      ? "Засварын сэргэлт"
      : "Maintenance Recovery";
  }

  const translationKey =
    kpiMap[normalizedKpiName];

  if (translationKey) {
    return t(translationKey);
  }

  return value;
}
/* ======================================================
   SCENARIOS
====================================================== */
 
export function translateDynamicScenario(
  value,
  t,
) {
  const scenarioMap = {
    "high performing mine":
      "dynamicScenarios.highPerformingMine",
 
    "fleet breakdown":
      "dynamicScenarios.fleetBreakdown",
 
    "plant bottleneck":
      "dynamicScenarios.plantBottleneck",
 
    "safety incident":
      "dynamicScenarios.safetyIncident",
 
    "heavy rain / weather delay":
      "dynamicScenarios.weatherDelay",
 
    "weather delay":
      "dynamicScenarios.weatherDelay",
 
    "heavy rain":
      "dynamicScenarios.weatherDelay",
 
    "winter operations":
      "dynamicScenarios.winterOperations",
  };
 
  return translateMappedValue(
    value,
    t,
    scenarioMap,
  );
}
 
 
/* ======================================================
   OUTLOOK
====================================================== */
 
export function translateDynamicOutlook(
  value,
  t,
) {
  const outlookMap = {
    improving:
      "dynamicOutlooks.improving",
 
    declining:
      "dynamicOutlooks.declining",
 
    stable:
      "dynamicOutlooks.stable",
 
    "attention required":
      "dynamicOutlooks.attentionRequired",
 
    unavailable:
      "dynamicOutlooks.unavailable",
  };
 
  return translateMappedValue(
    value,
    t,
    outlookMap,
  );
}
 
 
/* ======================================================
   TRENDS
====================================================== */
 
export function translateDynamicTrend(
  value,
  t,
) {
  const trendMap = {
    improving:
      "predictionCard.trend.improving",
 
    declining:
      "predictionCard.trend.declining",
 
    stable:
      "predictionCard.trend.stable",
 
    unavailable:
      "predictionCard.trend.unavailable",
 
    up:
      "predictionCard.trend.improving",
 
    down:
      "predictionCard.trend.declining",
 
    flat:
      "predictionCard.trend.stable",
 
    "no data":
      "predictionCard.trend.unavailable",
  };
 
  return translateMappedValue(
    value,
    t,
    trendMap,
  );
}
 
 
/* ======================================================
   PRIORITY / SEVERITY
====================================================== */
 
export function translateDynamicPriority(
  value,
  t,
) {
  const normalized =
    normalizeDynamicValue(value);
 
  const priorityMap = {
    critical:
      "executiveAiInsightCard.severity.critical",
 
    severe:
      "executiveAiInsightCard.severity.critical",
 
    high:
      "executiveAiInsightCard.severity.high",
 
    "high priority":
      "executiveAiInsightCard.severity.high",
 
    medium:
      "executiveAiInsightCard.severity.medium",
 
    moderate:
      "executiveAiInsightCard.severity.medium",
 
    warning:
      "executiveAiInsightCard.severity.medium",
 
    "medium priority":
      "executiveAiInsightCard.severity.medium",
 
    low:
      "executiveAiInsightCard.severity.low",
 
    normal:
      "executiveAiInsightCard.severity.low",
 
    "low priority":
      "executiveAiInsightCard.severity.low",
 
    stable:
      "executiveAiInsightCard.severity.low",
 
    unavailable:
      "executiveAiInsightCard.severity.unavailable",
 
    "priority unavailable":
      "executiveAiInsightCard.severity.unavailable",
  };
 
  const mapped =
    priorityMap[normalized];
 
  if (mapped) {
    return t(mapped);
  }
 
  if (!isMongolian(t)) {
    return value;
  }
 
  const executivePriorityMap = {
    "high management priority":
      "Удирдлагын өндөр ач холбогдолтой",
 
    "immediate executive attention":
      "Удирдлагын нэн даруй анхаарал",
 
    "maintain operating discipline":
      "Үйл ажиллагааны сахилга батыг хадгалах",
 
    "protect fleet reliability":
      "Техникийн найдвартай байдлыг хамгаалах",
 
    "maintain plant stability":
      "Үйлдвэрийн тогтвортой байдлыг хадгалах",
 
    "maintain safety discipline":
      "Аюулгүй ажиллагааны сахилга батыг хадгалах",
 
    "management review required":
      "Удирдлагын хяналт шаардлагатай",
 
    "continue routine monitoring":
      "Хэвийн хяналтыг үргэлжлүүлэх",
  };
 
  return (
    executivePriorityMap[normalized] ||
    value
  );
}
 
 
/* ======================================================
   STATUS
====================================================== */
 
export function translateDynamicStatus(
  value,
  t,
) {
  const normalized =
    normalizeDynamicValue(value);
 
  if (!isMongolian(t)) {
    return value;
  }
 
  const statusMap = {
    "below plan":
      "Төлөвлөгөөнөөс доогуур",
 
    "above plan":
      "Төлөвлөгөөнөөс дээгүүр",
 
    stable:
      "Тогтвортой",
 
    controlled:
      "Хяналттай",
 
    available:
      "Боломжтой",
 
    unavailable:
      "Боломжгүй",
 
    "no data":
      "Өгөгдөлгүй",
 
    open:
      "Нээлттэй",
 
    "to do":
      "Хийх",
 
    todo:
      "Хийх",
 
    "in progress":
      "Хэрэгжиж байна",
 
    completed:
      "Дууссан",
 
    complete:
      "Дууссан",
 
    blocked:
      "Саатсан",
 
    overdue:
      "Хугацаа хэтэрсэн",
  };
 
  return statusMap[normalized] || value;
}
 
 
/* ======================================================
   EXECUTIVE INSIGHT TITLES
====================================================== */
 
export function translateDynamicInsightTitle(
  value,
  t,
) {
  const normalized =
    normalizeDynamicValue(value);
 
  if (!normalized) {
    return "";
  }
 
  const translatedKpi =
    translateDynamicKpiName(
      value,
      t,
    );
 
  if (translatedKpi !== value) {
    return translatedKpi;
  }
 
  const titleMap = {
    "ai executive insight":
      "executiveAiInsightCard.defaultTitle",
 
    "executive insight":
      "executiveAiInsightCard.defaultTitle",
 
    "executive summary":
      "executiveAiInsightCard.executiveSummary",
 
    "performance trend":
      "executiveAiInsightCard.performanceTrend",
 
    "likely driver":
      "executiveAiInsightCard.likelyDriver",
 
    "estimated impact":
      "executiveAiInsightCard.estimatedImpact",
 
    "recommended management priority":
      "executiveAiInsightCard.recommendedPriority",
  };
 
  const mapped =
    titleMap[normalized];
 
  if (mapped) {
    return t(mapped);
  }
 
  if (!isMongolian(t)) {
    return value;
  }
 
  let titleMatch = value.match(
    /^(.+?) Below Target$/i,
  );
 
  if (titleMatch) {
    const translatedKpi =
      translateDynamicKpiName(
        titleMatch[1],
        t,
      );
 
    return (
      `${translatedKpi} зорилтот түвшнээс доогуур`
    );
  }
 
  titleMatch = value.match(
    /^(.+?) Performance$/i,
  );
 
  if (titleMatch) {
    const translatedKpi =
      translateDynamicKpiName(
        titleMatch[1],
        t,
      );
 
    return `${translatedKpi}-ийн гүйцэтгэл`;
  }
 
 
  const insightTitleMap = {
    "fleet performance below target":
      "Техникийн гүйцэтгэл зорилтот түвшнээс доогуур",
 
    "waste movement critically below target":
      "Хөрс хуулалтын гүйцэтгэл зорилтот түвшнээс ноцтой доогуур",
 
    "ore production below target":
      "Хүдрийн олборлолт зорилтот түвшнээс доогуур",
 
    "maintenance recovery risk":
      "Засварын сэргэлтийн эрсдэл",
 
    "production performance above plan":
      "Үйлдвэрлэлийн гүйцэтгэл төлөвлөгөөнөөс дээгүүр",
 
    "fleet reliability supporting plan":
      "Техникийн найдвартай байдал төлөвлөгөөг дэмжиж байна",
 
    "plant performance stable":
      "Үйлдвэрийн гүйцэтгэл тогтвортой",
 
    "safety performance controlled":
      "Аюулгүй ажиллагааны гүйцэтгэл хяналттай",
  };
 
  return (
    insightTitleMap[normalized] ||
    value
  );
}
 
 
/* ======================================================
   SOURCE TYPES / CONFIDENCE LABELS
====================================================== */
 
export function translateDynamicSourceType(
  value,
  t,
) {
  const normalized =
    normalizeDynamicValue(
      String(value || "")
        .replaceAll("_", " "),
    );
 
  const sourceMap = {
    "rule based":
      "executiveAiInsightCard.ruleBasedEstimate",
 
    "rule-based":
      "executiveAiInsightCard.ruleBasedEstimate",
 
    "rule based estimate":
      "executiveAiInsightCard.ruleBasedEstimate",
 
    "rule-based estimate":
      "executiveAiInsightCard.ruleBasedEstimate",
 
    "operational kpi":
      "predictionCard.operationalKpi",
 
    "operational kpis":
      "predictionCard.operationalKpi",
  };
 
  /*
   * Customer-facing label for the backend internal
   * source identifier: rule_based_orchestrator.
   *
   * Keep the backend contract unchanged while avoiding
   * the internal engineering term in the customer UI.
   */
  if (
    normalized === "rule based orchestrator" ||
    normalized === "rule-based orchestrator"
  ) {
    return isMongolian(t)
      ? "Дүрэмд суурилсан шинжилгээ"
      : "Rule-based analysis";
  }
 
  const translationKey =
    sourceMap[normalized];
 
  if (translationKey) {
    return t(translationKey);
  }
 
  if (!isMongolian(t)) {
    return String(value || "")
      .replaceAll("_", " ")
      .trim();
  }
 
  const sourceTypeMap = {
    "deterministic demo confidence":
      "Детерминистик демо итгэлцэл",
 
    "deterministic demo orchestrator":
      "Детерминистик демо шинжилгээ",
 
    "demo scenario engine":
      "Демо сценарийн хөдөлгүүр",
 
    "fleet kpi analysis":
      "Техникийн KPI шинжилгээ",
 
    "maintenance risk analysis":
      "Засварын эрсдэлийн шинжилгээ",
 
    "fleet recovery analysis":
      "Техникийн сэргэлтийн шинжилгээ",
 
    "production kpi analysis":
      "Үйлдвэрлэлийн KPI шинжилгээ",
 
    "fleet constraint analysis":
      "Техникийн хязгаарлалтын шинжилгээ",
 
    "maintenance performance analysis":
      "Засварын гүйцэтгэлийн шинжилгээ",
 
    "plant kpi analysis":
      "Үйлдвэрийн KPI шинжилгээ",
 
    "safety kpi analysis":
      "Аюулгүй ажиллагааны KPI шинжилгээ",
 
    "workforce readiness analysis":
      "Ажиллах хүчний бэлэн байдлын шинжилгээ",
  };
 
  return (
    sourceTypeMap[normalized] ||
    String(value || "")
      .replaceAll("_", " ")
      .trim()
  );
}
 
 
/* ======================================================
   DATA STATUS
====================================================== */
 
export function translateDynamicDataStatus(
  value,
  t,
) {
  const statusMap = {
    available:
      "common.good",
 
    unavailable:
      "common.notAvailable",
 
    complete:
      "predictionSummary.dataQualityStatus.complete",
 
    partial:
      "predictionSummary.dataQualityStatus.partial",
 
    limited:
      "predictionSummary.dataQualityStatus.limited",
 
    good:
      "predictionSummary.dataQualityStatus.good",
 
    fair:
      "predictionSummary.dataQualityStatus.fair",
 
    poor:
      "predictionSummary.dataQualityStatus.poor",
 
    unknown:
      "predictionSummary.dataQualityStatus.unknown",
  };
 
  return translateMappedValue(
    value,
    t,
    statusMap,
  );
}
 
 
/* ======================================================
   DYNAMIC EXECUTIVE NARRATIVES
====================================================== */
 
export function translateDynamicExecutiveText(
  value,
  t,
) {
  const text = String(value || "").trim();
 
  if (!text || !isMongolian(t)) {
    return text;
  }
 
  const normalized =
    normalizeDynamicValue(text);
 
    /* ====================================================
     LIVE FLEET KPI DETAIL
  ==================================================== */
 
  let fleetDetailMatch;
 
  fleetDetailMatch = text.match(
    /^Fleet performance is ([\d.]+)% against a ([\d.]+)% target and has improved by ([\d.]+) percentage points over the reporting period\. Availability and utilization are both supporting the current recovery\. No material negative Fleet performance gap is currently identified\.$/i,
  );
 
  if (fleetDetailMatch) {
    return (
      `Техникийн гүйцэтгэл ${fleetDetailMatch[1]}% байгаа нь ` +
      `${fleetDetailMatch[2]}%-ийн зорилттой харьцуулахад өндөр үзүүлэлт бөгөөд ` +
      `тайлант хугацаанд ${fleetDetailMatch[3]} пунктээр сайжирсан байна. ` +
      `Техникийн бэлэн байдал болон ашиглалт нь одоогийн сэргэлтийг дэмжиж байна. ` +
      `Одоогоор техникийн гүйцэтгэлд мэдэгдэхүйц сөрөг зөрүү илрээгүй байна.`
    );
  }
 
  fleetDetailMatch = text.match(
    /^Current recovery momentum supports continued above-target Fleet performance if availability and utilization are sustained\.$/i,
  );
 
  if (fleetDetailMatch) {
    return (
      "Техникийн бэлэн байдал болон ашиглалтыг тогтвортой хадгалж чадвал " +
      "одоогийн сэргэлтийн хандлага нь техникийн гүйцэтгэлийг зорилтоос дээгүүр " +
      "түвшинд үргэлжлүүлэн хадгалах боломжтойг харуулж байна."
    );
  }
 
  fleetDetailMatch = text.match(
    /^Fleet performance is ([\d.]+)% against a ([\d.]+)% target\. Performance remains above target, although the recent trend should continue to be monitored\.$/i,
  );
 
  if (fleetDetailMatch) {
    return (
      `Техникийн гүйцэтгэл ${fleetDetailMatch[1]}% байгаа нь ` +
      `${fleetDetailMatch[2]}%-ийн зорилтоос дээгүүр байна. ` +
      "Гүйцэтгэл зорилтоос өндөр хэвээр байгаа боловч сүүлийн үеийн чиг хандлагыг " +
      "үргэлжлүүлэн хянах шаардлагатай."
    );
  }
 
  fleetDetailMatch = text.match(
    /^Fleet performance is currently above target\. Continued monitoring of availability and utilization is required to confirm sustainability\.$/i,
  );
 
  if (fleetDetailMatch) {
    return (
      "Техникийн гүйцэтгэл зорилтоос дээгүүр байна. Энэ түвшнийг хадгалахын тулд " +
      "бэлэн байдал болон ашиглалтыг үргэлжлүүлэн хянана уу."
    );
  }
 
  fleetDetailMatch = text.match(
    /^Fleet performance is ([\d.]+)% against a ([\d.]+)% target\. The KPI remains ([\d.]+) percentage points below target but has improved by ([\d.]+) percentage points over the reporting period\.$/i,
  );
 
  if (fleetDetailMatch) {
    return (
      `Техникийн гүйцэтгэл ${fleetDetailMatch[1]}% байгаа нь ` +
      `${fleetDetailMatch[2]}%-ийн зорилтоос ${fleetDetailMatch[3]} пунктээр доогуур байна. ` +
      `Гэсэн хэдий ч тайлант хугацаанд ${fleetDetailMatch[4]} пунктээр сайжирсан байна.`
    );
  }
 
  fleetDetailMatch = text.match(
    /^The current recovery trend is positive, but Fleet performance remains below target\. Sustained improvement in the measured Fleet drivers is required\.$/i,
  );
 
  if (fleetDetailMatch) {
    return (
      "Сэргэлтийн хандлага эерэг боловч техникийн гүйцэтгэл зорилтоос доогуур хэвээр байна. " +
      "Техникийн гол үзүүлэлтүүдийг тогтвортой сайжруулах шаардлагатай."
    );
  }
 
  fleetDetailMatch = text.match(
    /^Fleet performance is ([\d.]+)% against a ([\d.]+)% target and has declined by ([\d.]+) percentage points over the reporting period\. Management review of the measured Fleet drivers is required\.$/i,
  );
 
  if (fleetDetailMatch) {
    return (
      `Техникийн гүйцэтгэл ${fleetDetailMatch[1]}% байгаа нь ` +
      `${fleetDetailMatch[2]}%-ийн зорилттой харьцуулахад хангалтгүй бөгөөд ` +
      `тайлант хугацаанд ${fleetDetailMatch[3]} пунктээр буурсан байна. ` +
      "Хэмжигдэж буй техникийн нөлөөлөгч үзүүлэлтүүдэд удирдлагын хяналт шаардлагатай."
    );
  }
 
  fleetDetailMatch = text.match(
    /^Without improvement in Fleet availability and utilization, the current performance gap may persist into the next reporting period\.$/i,
  );
 
  if (fleetDetailMatch) {
    return (
      "Техникийн бэлэн байдал болон ашиглалт сайжрахгүй бол одоогийн " +
      "гүйцэтгэлийн зөрүү дараагийн тайлант хугацаанд үргэлжлэх эрсдэлтэй."
    );
  }
 
 
/* ====================================================
     GENERIC KPI SUMMARY FROM _build_kpi_summary()
  ==================================================== */
 
  let kpiSummaryMatch;
 
  // KPI BELOW TARGET
  kpiSummaryMatch = text.match(
    /^(.+?) is ([\d.]+)% below target\. Actual performance is ([\d,.]+) against a plan of ([\d,.]+), or ([\d.]+)% of plan\.$/i,
  );
 
  if (kpiSummaryMatch) {
    const translatedKpi =
      translateDynamicKpiName(
        kpiSummaryMatch[1],
        t,
      );
 
    return (
      `${translatedKpi} төлөвлөгөөнөөс ${kpiSummaryMatch[2]}%-иар дутуу. ` +
      `Бодит гүйцэтгэл ${kpiSummaryMatch[3]}, ` +
      `төлөвлөгөө ${kpiSummaryMatch[4]}, ` +
      `гүйцэтгэл ${kpiSummaryMatch[5]}%.`
    );
  }
 
 
  // KPI ABOVE TARGET
  kpiSummaryMatch = text.match(
    /^(.+?) is ([\d.]+)% above target\. Actual performance is ([\d,.]+) against a plan of ([\d,.]+), or ([\d.]+)% of plan\.$/i,
  );
 
  if (kpiSummaryMatch) {
    const translatedKpi =
      translateDynamicKpiName(
        kpiSummaryMatch[1],
        t,
      );
 
    return (
      `${translatedKpi} төлөвлөгөөнөөс ${kpiSummaryMatch[2]}%-иар давсан. ` +
      `Бодит гүйцэтгэл ${kpiSummaryMatch[3]}, ` +
      `төлөвлөгөө ${kpiSummaryMatch[4]}, ` +
      `гүйцэтгэл ${kpiSummaryMatch[5]}%.`
    );
  }
 
 
  // KPI EXACTLY ON TARGET
  kpiSummaryMatch = text.match(
    /^(.+?) is exactly on target at ([\d,.]+)\.$/i,
  );
 
  if (kpiSummaryMatch) {
    const translatedKpi =
      translateDynamicKpiName(
        kpiSummaryMatch[1],
        t,
      );
 
    return (
      `${translatedKpi} төлөвлөгөөндөө хүрсэн. Гүйцэтгэл ${kpiSummaryMatch[2]}.`
    );
  }
 
 
  // KPI TARGET / PLAN UNAVAILABLE
  kpiSummaryMatch = text.match(
    /^(.+?) performance is currently unavailable because no valid target was found\.$/i,
  );
 
  if (kpiSummaryMatch) {
    const translatedKpi =
      translateDynamicKpiName(
        kpiSummaryMatch[1],
        t,
      );
 
    return (
      `${translatedKpi}-ийн гүйцэтгэлийг тооцоолох боломжгүй. Хүчинтэй зорилт олдсонгүй.`
    );
  }
 
 
  // LIVE FALLBACK TREND SUMMARY
  let liveMatch = text.match(
    /^The overall mine performance trend is (.+)\.$/i,
  );
 
  if (liveMatch) {
    const translatedTrend =
      translateDynamicTrend(
        liveMatch[1],
        t,
      );
 
    return (
      `Уурхайн нийт гүйцэтгэлийн хандлага ${translatedTrend}.`
    );
  }
 
 
  // LIVE HIGH / CRITICAL RECOMMENDATION FALLBACK
  liveMatch = text.match(
    /^Initiate an operational review of (.+?) performance and assign a responsible owner\.$/i,
  );
 
  if (liveMatch) {
    const translatedKpi =
      translateDynamicKpiName(
        liveMatch[1],
        t,
      );
 
    return (
      `${translatedKpi}-ийн гүйцэтгэлд нэн даруй хяналт хийж, хариуцагч томилно уу.`
    );
  }
 
 
  // LIVE MEDIUM RECOMMENDATION FALLBACK
  liveMatch = text.match(
    /^Review the main constraints affecting (.+?) and monitor the next reporting period\.$/i,
  );
 
  if (liveMatch) {
    const translatedKpi =
      translateDynamicKpiName(
        liveMatch[1],
        t,
      );
 
    return (
      `${formatMongolianDativeKpi(translatedKpi)} нөлөөлж буй гол хязгаарлалтыг шалгаж, дараагийн тайлант хугацаанд хянана уу.`
    );
  }
 
 
  // LIVE NO-NEGATIVE-IMPACT FALLBACK
  liveMatch = text.match(
    /^No negative direct (.+?) impact is currently estimated\.$/i,
  );
 
  if (liveMatch) {
    const translatedKpi =
      translateDynamicKpiName(
        liveMatch[1],
        t,
      );
 
    return (
      `${formatMongolianDativeKpi(translatedKpi)} мэдэгдэхүйц сөрөг нөлөө одоогоор илрээгүй.`
    );
  }
 
 
  // LIVE DIRECT SHORTFALL ESTIMATE
  liveMatch = text.match(
    /^Estimated direct shortfall is ([\d,.]+) tonnes per day based on the difference between plan and actual\.$/i,
  );
 
  if (liveMatch) {
    return (
      `Төлөвлөгөө болон бодит гүйцэтгэлийн зөрүүнд үндэслэн ` +
      `өдрийн шууд дутуу гүйцэтгэл ойролцоогоор ${liveMatch[1]} тонн байна.`
    );
  }
 
 
  // UNSUPPORTED DEMO SCENARIO MESSAGE
  liveMatch = text.match(
    /^Scenario-specific executive insights are not yet implemented for (.+)\.$/i,
  );
 
  if (liveMatch) {
    const scenarioName =
      translateDynamicScenario(
        liveMatch[1],
        t,
      );
 
    return (
      `${scenarioName} сценарид зориулсан удирдлагын дүгнэлт ` +
      `одоогоор хэрэгжээгүй байна.`
    );
  }
 
 
  // TREND ENGINE KPI DRIVER MOVEMENTS
  let trendMatch = text.match(
    /^(Fleet performance|Plant performance|Ore performance|Waste movement|Safety score) (improved|declined) by ([\d.]+) percentage points\.$/i,
  );
 
  if (trendMatch) {
    const metricKey =
      normalizeDynamicValue(
        trendMatch[1],
      );
 
    const metricMap = {
      "fleet performance":
        "Техникийн гүйцэтгэл",
 
      "plant performance":
        "Үйлдвэрийн гүйцэтгэл",
 
      "ore performance":
        "Хүдрийн олборлолт",
 
      "waste movement":
        "Хөрс хуулалт",
 
      "safety score":
        "Аюулгүй ажиллагааны үнэлгээ",
    };
 
    const movement =
      normalizeDynamicValue(
        trendMatch[2],
      ) === "improved"
        ? "сайжирсан"
        : "буурсан";
 
    return (
      `${metricMap[metricKey] || trendMatch[1]} ` +
      `${trendMatch[3]} пунктээр ${movement}.`
    );
  }
 
 
  // TREND ENGINE MINE HEALTH SUMMARY
  trendMatch = text.match(
    /^Mine Health is (improving|declining|stable) over the available reporting period\. The score changed from ([\d.]+)% to ([\d.]+)%, a movement of (-?[\d.]+) percentage points\.$/i,
  );
 
  if (trendMatch) {
    const direction =
      translateDynamicTrend(
        trendMatch[1],
        t,
      );
 
    return (
      `Уурхайн төлөв ${direction}. ` +
      `Үнэлгээ ${trendMatch[2]}%-иас ${trendMatch[3]}% болж, ` +
      `${trendMatch[4]} пунктээр өөрчлөгдсөн.`
    );
  }
 
 
  const exactMap = {
    "maintain cross-functional short-interval control":
      "Функц хоорондын богино хугацааны хяналтыг хэрэгжүүлэх",

    "continue monitoring leading operational indicators":
      "Тэргүүлэх үйл ажиллагааны үзүүлэлтүүдийг үргэлжлүүлэн хянах",

    "review the lowest-performing operational kpi":
      "Хамгийн бага гүйцэтгэлтэй үйл ажиллагааны KPI-г хянах",

    "mobile-equipment availability and unplanned truck downtime are reducing haulage capacity.":
      "Хөдөлгөөнт техникийн бэлэн байдал буурч, төлөвлөгдөөгүй машины зогсолт нэмэгдсэнээр тээвэрлэлтийн хүчин чадал буурч байна.",
 
    "waste movement has deteriorated as available trucks have been redirected and haulage capacity has fallen.":
      "Боломжтой машинуудыг өөр чиглэлд шилжүүлж, тээвэрлэлтийн хүчин чадал буурснаар хөрс хуулалтын гүйцэтгэл муудсан.",
 
    "the fleet breakdown is constraining truck allocation to waste routes and reducing effective haulage hours.":
      "Техникийн эвдрэл нь хөрс тээвэрлэлтийн чиглэлд машин хуваарилах боломжийг хязгаарлаж, үр ашигтай тээвэрлэлтийн цагийг бууруулж байна.",
 
    "ore delivery has declined as truck availability and effective haulage capacity have weakened.":
      "Машины бэлэн байдал болон үр ашигтай тээвэрлэлтийн хүчин чадал суларснаар хүдрийн нийлүүлэлт буурсан.",
 
    "reduced fleet availability is limiting ore haulage and loading-unit productivity.":
      "Техникийн бэлэн байдал буурснаар хүдэр тээвэрлэлт болон ачих төхөөрөмжийн бүтээмж хязгаарлагдаж байна.",
 
    "maintenance performance is weakening as unplanned work and equipment failures increase.":
      "Төлөвлөгдөөгүй ажил болон техникийн эвдрэл нэмэгдсэнээр засварын гүйцэтгэл суларч байна.",
 
    "high unplanned maintenance demand is displacing preventive work and delaying equipment return-to-service.":
      "Төлөвлөгдөөгүй засварын өндөр ачаалал нь урьдчилан сэргийлэх ажлыг шахаж, техникийг ашиглалтад буцаах хугацааг хойшлуулж байна.",
 
    "production delivery remains above planned levels while maintaining balanced ore and waste movement.":
      "Үйлдвэрлэлийн нийлүүлэлт төлөвлөгөөнөөс дээгүүр хэвээр бөгөөд хүдэр болон хөрс хуулалтын тэнцвэртэй хөдөлгөөнийг хадгалж байна.",
 
    "stable fleet availability, disciplined shift execution, and consistent operating conditions are supporting production.":
      "Техникийн тогтвортой бэлэн байдал, ээлжийн сахилга баттай гүйцэтгэл болон тогтвортой ажиллагааны нөхцөл нь үйлдвэрлэлийг дэмжиж байна.",
 
    "production is delivering tonnes above the current daily ore plan.":
      "Үйлдвэрлэл одоогийн өдрийн хүдрийн төлөвлөгөөнөөс давсан хэмжээгээр ажиллаж байна.",
 
    "improved equipment reliability and maintenance execution are supporting effective haulage capacity.":
      "Техникийн найдвартай байдал болон засварын гүйцэтгэл сайжирснаар үр ашигтай тээвэрлэлтийн хүчин чадлыг дэмжиж байна.",
 
    "fleet availability and utilization are improving while breakdown and idle time remain controlled.":
      "Техникийн бэлэн байдал болон ашиглалт сайжирч, эвдрэл болон сул зогсолтын хугацаа хяналттай хэвээр байна.",
 
    "high fleet availability is protecting production capacity.":
      "Техникийн өндөр бэлэн байдал нь үйлдвэрлэлийн хүчин чадлыг хамгаалж байна.",
 
    "throughput and recovery are stable with reduced downtime.":
      "Сул зогсолт буурсан нөхцөлд боловсруулалтын хүчин чадал болон металл авалт тогтвортой байна.",
 
    "stable ore feed, controlled downtime, and consistent plant operating conditions.":
      "Хүдрийн тогтвортой тэжээл, хяналттай сул зогсолт болон үйлдвэрийн тогтвортой ажиллагааны нөхцөл.",
 
    "stable recovery supports reliable metal production performance.":
      "Тогтвортой металл авалт нь металлын үйлдвэрлэлийн найдвартай гүйцэтгэлийг дэмжиж байна.",
 
    "strong operational performance is being maintained without deterioration in safety outcomes.":
      "Үйл ажиллагааны өндөр гүйцэтгэлийг аюулгүй ажиллагааны үр дүнг муутгахгүйгээр хадгалж байна.",
 
    "consistent operating discipline, hazard management, and stable workforce execution.":
      "Үйл ажиллагааны тогтвортой сахилга бат, аюулын удирдлага болон ажиллах хүчний тогтвортой гүйцэтгэл.",
 
    "no recordable incidents are present in the current scenario.":
      "Одоогийн сценарид бүртгэгдэх осол, тохиолдол байхгүй байна.",
 
    "mine performance is declining under the fleet breakdown scenario. fleet availability, production delivery, and maintenance recovery all require coordinated management action.":
      "Техникийн эвдрэлийн сценарийн үед уурхайн гүйцэтгэл буурч байна. Техникийн бэлэн байдал, үйлдвэрлэлийн нийлүүлэлт болон засварын сэргэлтэд уялдаатай удирдлагын арга хэмжээ шаардлагатай.",
 
    "the high performing mine scenario shows production above plan, strong fleet reliability, stable plant performance, and controlled safety risk. management priority is to protect sustainable performance without creating operational strain.":
      "Өндөр гүйцэтгэлтэй уурхайн сценари нь үйлдвэрлэл төлөвлөгөөнөөс дээгүүр, техникийн найдвартай байдал өндөр, үйлдвэрийн гүйцэтгэл тогтвортой, аюулгүй ажиллагааны эрсдэл хяналттай байгааг харуулж байна. Удирдлагын тэргүүлэх зорилго нь үйл ажиллагаанд хэт ачаалал үүсгэхгүйгээр тогтвортой гүйцэтгэлийг хамгаалах юм.",
 
    "high performing mine demo data is incomplete.":
      "Өндөр гүйцэтгэлтэй уурхайн демо өгөгдөл бүрэн бус байна.",
 
    "no material operational driver was identified.":
      "Гүйцэтгэлд мэдэгдэхүйц нөлөөлсөн хүчин зүйл илрээгүй.",
 
    "maintain the current operating rhythm and continue monitoring leading indicators.":
      "Одоогийн үйл ажиллагааны хэмнэлийг хадгалж, тэргүүлэх үзүүлэлтүүдийг үргэлжлүүлэн хянана уу.",
 
    "actual minus plan":
      "Бодит гүйцэтгэлээс төлөвлөгөөг хассан",
 
    "plan minus actual":
      "Төлөвлөгөөнөөс бодит гүйцэтгэлийг хассан",
 
    "no scenario-specific trend is currently available.":
      "Одоогоор энэ сценарийн хандлагын мэдээлэл алга.",
 
    "no trend summary is currently available.":
      "Одоогоор хандлагын товч мэдээлэл алга.",

    "insufficient historical data to calculate trend.":
      "Гүйцэтгэлийн чиг хандлагыг тодорхойлоход түүхэн өгөгдөл хангалтгүй байна.",

    "insufficient historical data to calculate the trend.":
      "Гүйцэтгэлийн чиг хандлагыг тодорхойлоход түүхэн өгөгдөл хангалтгүй байна.",

    "there is insufficient historical data to calculate the trend.":
      "Гүйцэтгэлийн чиг хандлагыг тодорхойлоход түүхэн өгөгдөл хангалтгүй байна.",

    "not enough historical data to calculate trend.":
      "Гүйцэтгэлийн чиг хандлагыг тодорхойлоход түүхэн өгөгдөл хангалтгүй байна.",
 
    "the selected demo scenario does not yet have a dedicated executive insight model.":
      "Сонгосон демо сценарид зориулсан удирдлагын дүгнэлтийн тусгай загвар одоогоор хэрэгжээгүй байна.",
 
    "no kpi intelligence data was returned.":
      "KPI аналитикийн өгөгдөл буцаагдсангүй.",
 
    "no production data is available for executive insight generation.":
      "Удирдлагын дүгнэлт үүсгэх үйлдвэрлэлийн өгөгдөл байхгүй байна.",
 
    "executive insight generation failed.":
      "Удирдлагын дүгнэлт үүсгэх ажиллагаа амжилтгүй боллоо.",
 
    "demo executive insight generation failed.":
      "Демо удирдлагын дүгнэлт үүсгэх ажиллагаа амжилтгүй боллоо.",
 
    "no major kpi movement detected across the available reporting period.":
      "Тайлант хугацаанд KPI үзүүлэлтүүдэд мэдэгдэхүйц өөрчлөлт илрээгүй.",
 
    "review fleet availability, utilization, maintenance delays, and dispatch efficiency.":
      "Техникийн бэлэн байдал, ашиглалт, засварын саатал болон диспетчерийн үр ашгийг шалгана уу.",
 
    "review throughput bottlenecks, recovery performance, and plant downtime causes.":
      "Боловсруулалтын хүчин чадлын хязгаарлалт, металл авалтын гүйцэтгэл болон үйлдвэрийн сул зогсолтын шалтгааныг шалгана уу.",
 
    "review mining sequence, shovel allocation, and ore delivery constraints.":
      "Олборлолтын дараалал, экскаваторын хуваарилалт болон хүдрийн нийлүүлэлтийн хязгаарлалтыг шалгана уу.",
 
    "check truck allocation, haul road delays, and waste dump constraints.":
      "Машины хуваарилалт, тээврийн замын саатал болон хөрсний буулгалтын талбайн хязгаарлалтыг шалгана уу.",
 
    "review safety incidents, near misses, and critical risk controls.":
      "Аюулгүй ажиллагааны тохиолдол, осолд дөхсөн тохиолдол болон ноцтой эрсдэлийн хяналтыг шалгана уу.",
 
    "trend analysis generated from health history":
      "Уурхайн төлөвийн түүхэн өгөгдөлд үндэслэн хандлагын шинжилгээ үүсгэсэн",
 
  };
 
  if (exactMap[normalized]) {
    return exactMap[normalized];
  }
 
  let match;
 
  match = text.match(
    /^Fleet utilization is ([\d.]+)% against a ([\d.]+)% target\. Availability has declined to ([\d.]+)%, while average breakdown duration has increased to ([\d.]+) hours per truck\.$/i,
  );
 
  if (match) {
    return (
      `Техникийн ашиглалт ${match[1]}% бөгөөд ` +
      `${match[2]}%-ийн зорилтот түвшинтэй харьцуулахад доогуур байна. ` +
      `Бэлэн байдал ${match[3]}% хүртэл буурч, нэг машинд ногдох ` +
      `эвдрэлийн дундаж хугацаа ${match[4]} цаг болж өссөн.`
    );
  }
 
  match = text.match(
    /^Fleet utilization declined by ([\d.]+) percentage points compared with the previous reporting day\.$/i,
  );
 
  if (match) {
    return (
      `Техникийн ашиглалт өмнөх тайлант өдөртэй харьцуулахад ` +
      `${match[1]} пунктээр буурсан.`
    );
  }
 
  match = text.match(
    /^Reduced haulage capacity is associated with an estimated ore shortfall of ([\d,.]+) tonnes per day\.$/i,
  );
 
  if (match) {
    return (
      `Тээвэрлэлтийн хүчин чадал буурсантай холбоотойгоор хүдрийн ` +
      `өдрийн дутуу гүйцэтгэл ойролцоогоор ${match[1]} тонн байна.`
    );
  }
 
  match = text.match(
    /^Waste movement is ([\d.]+)% below target\. Actual movement is ([\d,.]+) tonnes against a plan of ([\d,.]+) tonnes\.$/i,
  );
 
  if (match) {
    return (
      `Хөрс хуулалт зорилтот түвшнээс ${match[1]}% доогуур байна. ` +
      `Гүйцэтгэл ${match[2]} тонн, төлөвлөгөө ${match[3]} тонн байна.`
    );
  }
 
  match = text.match(
    /^Estimated waste movement shortfall is ([\d,.]+) tonnes per day\.$/i,
  );
 
  if (match) {
    return (
      `Хөрс хуулалтын өдрийн дутуу гүйцэтгэл ойролцоогоор ` +
      `${match[1]} тонн байна.`
    );
  }
 
  match = text.match(
    /^Ore production is ([\d.]+)% below target\. Actual production is ([\d,.]+) tonnes against a plan of ([\d,.]+) tonnes\.$/i,
  );
 
  if (match) {
    return (
      `Хүдрийн олборлолт зорилтот түвшнээс ${match[1]}% доогуур байна. ` +
      `Гүйцэтгэл ${match[2]} тонн, төлөвлөгөө ${match[3]} тонн байна.`
    );
  }
 
  match = text.match(
    /^Estimated ore production shortfall is ([\d,.]+) tonnes per day\.$/i,
  );
 
  if (match) {
    return (
      `Хүдрийн олборлолтын өдрийн дутуу гүйцэтгэл ойролцоогоор ` +
      `${match[1]} тонн байна.`
    );
  }
 
  match = text.match(
    /^Maintenance backlog has increased to ([\d,.]+) work orders\. PM compliance is ([\d.]+)% and unplanned work represents ([\d.]+)% of total work\.$/i,
  );
 
  if (match) {
    return (
      `Засварын хуримтлагдсан ажил ${match[1]} ажлын захиалга болж өссөн. ` +
      `Төлөвлөгөөт засварын биелэлт ${match[2]}%, төлөвлөгдөөгүй ажил нийт ` +
      `ажлын ${match[3]}%-ийг эзэлж байна.`
    );
  }
 
  match = text.match(
    /^The current backlog of ([\d,.]+) work orders raises the risk of continued equipment availability loss\.$/i,
  );
 
  if (match) {
    return (
      `Одоогийн ${match[1]} ажлын захиалгын хуримтлал нь техникийн ` +
      `бэлэн байдал цаашид буурах эрсдэлийг нэмэгдүүлж байна.`
    );
  }
 
  match = text.match(
    /^Ore production is operating at ([\d.]+)% of plan, with waste movement also sustaining ([\d.]+)% of plan\.$/i,
  );
 
  if (match) {
    return (
      `Хүдрийн олборлолт төлөвлөгөөний ${match[1]}%-д, ` +
      `хөрс хуулалт төлөвлөгөөний ${match[2]}%-д ажиллаж байна.`
    );
  }
 
  match = text.match(
    /^Average fleet availability is ([\d.]+)% and utilization is ([\d.]+)%\.$/i,
  );
 
  if (match) {
    return (
      `Техникийн дундаж бэлэн байдал ${match[1]}%, ` +
      `ашиглалт ${match[2]}% байна.`
    );
  }
 
  match = text.match(
    /^Plant throughput is operating at ([\d.]+)% of plan with recovery at ([\d.]+)%\.$/i,
  );
 
  if (match) {
    return (
      `Үйлдвэрийн боловсруулалтын гүйцэтгэл төлөвлөгөөний ${match[1]}%-д, ` +
      `металл авалт ${match[2]}% байна.`
    );
  }
 
  match = text.match(
    /^Recordable incidents remain at ([\d,.]+) and critical risks remain at ([\d,.]+)\.$/i,
  );
 
  if (match) {
    return (
      `Бүртгэгдэх осол, тохиолдол ${match[1]}, ` +
      `ноцтой эрсдэл ${match[2]} хэвээр байна.`
    );
  }
 
  const recommendationMap = {
    "launch an immediate fleet recovery plan, prioritize repairs on the highest-downtime trucks, rebalance available equipment, and review the maintenance backlog with the mine and maintenance managers.":
      "Техникийн сэргэлтийн төлөвлөгөөг нэн даруй хэрэгжүүлж, хамгийн их зогсолттой машинуудын засварыг нэн тэргүүнд хийж, боломжтой техникийг дахин хуваарилан, засварын хуримтлагдсан ажлыг Уурхайн болон Засварын менежерүүдтэй хамт шалгана уу.",
 
    "protect critical waste movements, review truck allocation between ore and waste, remove haul-route delays, and confirm dump and dozer capacity for the next shift.":
      "Хөрс тээвэрлэлтийг нэн тэргүүнд хамгаална. Хүдэр–хөрсний машины хуваарилалт, замын саатал, дараагийн ээлжийн буулгалт болон бульдозерын хүчин чадлыг шалгана уу.",
 
    "protect high-value ore movements, assign available trucks to the most critical ore routes, and review loading-unit and dispatch constraints during the next operating review.":
      "Чухал хүдрийн тээвэрлэлтийг хамгаална. Боломжтой машинуудыг гол хүдрийн чиглэлд хуваарилж, ачих төхөөрөмж болон диспетчерийн хязгаарлалтыг шалгана уу.",
 
    "prioritize critical equipment work orders, assign recovery owners, protect the next maintenance window, and separate urgent breakdown work from recoverable backlog.":
      "Чухал засварын ажлыг нэн тэргүүнд эрэмбэлж, хариуцагч томилно. Дараагийн засварын цонхыг хамгаалж, яаралтай эвдрэлийн ажлыг хуримтлагдсан ажлаас тусгаарлана уу.",
 
    "protect the current operating rhythm, maintain dispatch discipline, and avoid creating downstream constraints through uncontrolled overproduction.":
      "Одоогийн үйл ажиллагааны хэмнэлийг хадгалж, диспетчерийн сахилга батыг хамгаална. Хяналтгүй хэт үйлдвэрлэлээс шалтгаалах дараагийн шатны хязгаарлалтаас зайлсхийнэ үү.",
 
    "maintain preventive maintenance compliance and protect planned maintenance windows despite strong operational performance.":
      "Гүйцэтгэл өндөр байсан ч урьдчилан сэргийлэх засварын биелэлт болон төлөвлөсөн засварын цонхыг хамгаална уу.",
 
    "maintain feed consistency, continue monitoring recovery, and avoid pushing throughput beyond sustainable operating limits.":
      "Тэжээлийн тогтвортой байдлыг хадгалж, металл авалтыг хянана. Боловсруулалтын хүчин чадлыг тогтвортой ажиллагааны хязгаараас хэтрүүлэхгүй байна.",
 
    "avoid complacency during strong production performance and continue verification of critical controls and field leadership.":
      "Өндөр гүйцэтгэлийн үед хяналтаа сулруулахгүй. Ноцтой эрсдэлийн хяналт болон талбайн удирдлагын баталгаажуулалтыг үргэлжлүүлнэ үү.",
 
    "production plan minus actual, linked to fleet constraint":
      "Үйлдвэрлэлийн төлөвлөгөөнөөс бодит гүйцэтгэлийг хасч, техникийн хязгаарлалттай холбосон",
 
    "waste plan minus actual":
      "Хөрс хуулалтын төлөвлөгөөнөөс бодит гүйцэтгэлийг хассан",
 
    "ore plan minus actual":
      "Хүдрийн төлөвлөгөөнөөс бодит гүйцэтгэлийг хассан",
 
    "latest deterministic maintenance scenario record":
      "Сүүлийн детерминистик засварын сценарийн бүртгэл",
 
    "ore actual minus ore plan":
      "Хүдрийн бодит гүйцэтгэлээс хүдрийн төлөвлөгөөг хассан",
 
    "average latest fleet availability":
      "Сүүлийн үеийн техникийн бэлэн байдлын дундаж",
 
    "latest deterministic plant record":
      "Сүүлийн детерминистик үйлдвэрийн бүртгэл",
 
    "latest deterministic safety record":
      "Сүүлийн детерминистик аюулгүй ажиллагааны бүртгэл",
 
  };
 
  if (recommendationMap[normalized]) {
    return recommendationMap[normalized];
  }
 
  return text;
}
 
 
/* ======================================================
   EXECUTIVE HEADLINE
====================================================== */
 
export function translateDynamicImpactMethod(
  value,
  t,
) {
  return translateDynamicExecutiveText(
    value,
    t,
  );
}
 
 
export function translateDynamicExecutiveHeadline(
  value,
  t,
) {
  const text = String(value || "").trim();
 
  if (!text || !isMongolian(t)) {
    return text;
  }
 
  if (
    normalizeDynamicValue(text) ===
    "no executive insights are available because no valid kpi data was found."
  ) {
    return (
      "Хүчинтэй KPI өгөгдөл олдоогүй тул удирдлагын дүгнэлт байхгүй байна."
    );
  }
 
  let match = text.match(
    /^Immediate executive attention is required:\s*(.+)\.$/i,
  );
 
  if (match) {
    return (
      "Нэн даруй анхаарах шаардлагатай: " +
      `${translateDynamicInsightTitle(
        match[1],
        t,
      )}.`
    );
  }
 
  match = text.match(
    /^High-priority operational review required:\s*(.+)\.$/i,
  );
 
  if (match) {
    return (
      "Үйл ажиллагааны өндөр ач холбогдолтой хяналт шаардлагатай: " +
      `${translateDynamicInsightTitle(
        match[1],
        t,
      )}.`
    );
  }
 
  match = text.match(
    /^Overall mine performance is ([^;]+);\s*the leading insight is\s*(.+)\.$/i,
  );
 
  if (match) {
    const trend =
      translateDynamicTrend(
        match[1],
        t,
      );
 
    const title =
      translateDynamicInsightTitle(
        match[2],
        t,
      );
 
    const normalizedOverallStatus =
      normalizeDynamicValue(match[1]);

    const translatedOverallStatus =
      String(trend || "")
        .trim()
        .toLowerCase();

    const isOverallDataUnavailable =
      normalizedOverallStatus ===
        "unavailable" ||
      normalizedOverallStatus ===
        "not available" ||
      normalizedOverallStatus ===
        "no data" ||
      normalizedOverallStatus ===
        "data unavailable" ||
      translatedOverallStatus ===
        "өгөгдөл байхгүй" ||
      translatedOverallStatus ===
        "мэдээлэл байхгүй" ||
      translatedOverallStatus ===
        "өгөгдөл хангалтгүй";

    if (isOverallDataUnavailable) {
      return (
        "Уурхайн нийт гүйцэтгэлийн нэгдсэн үнэлгээ хийхэд өгөгдөл хангалтгүй байна. " +
        `Гол анхаарах үзүүлэлт: ${title}.`
      );
    }

    return (
      `Уурхайн нийт гүйцэтгэл ${trend}. ` +
      `Гол анхаарах үзүүлэлт: ${title}.`
    );
  }
 
  return translateDynamicExecutiveText(
    text,
    t,
  );
}
 
 
 
/* ======================================================
   EXECUTIVE ACTIONS — DYNAMIC UI VALUES
====================================================== */
 
export function translateDynamicExecutiveActionCategory(
  value,
  t,
) {
  const text = String(value || "").trim();
 
  if (!text || !isMongolian(t)) {
    return text;
  }
 
  const normalized =
    normalizeDynamicValue(text);
 
  const categoryMap = {
    "operations": "Үйл ажиллагаа",
    "operations team": "Үйл ажиллагааны баг",
    "operations manager": "Үйл ажиллагааны менежер",
    "operations superintendent": "Үйл ажиллагааны ахлах менежер",
    "mining operations": "Уурхайн үйл ажиллагаа",
    "mine operations": "Уурхайн үйл ажиллагаа",
    "dispatch & control room": "Диспетчер ба хяналтын өрөө",
    "dispatch and control room": "Диспетчер ба хяналтын өрөө",
    "dispatch": "Диспетчер",
    "mobile maintenance": "Явуулын засвар",
    "maintenance": "Засвар үйлчилгээ",
    "maintenance operations": "Засвар үйлчилгээ",
    "processing": "Боловсруулах үйлдвэрлэл",
    "processing operations": "Боловсруулах үйлдвэрлэл",
    "plant operations": "Үйлдвэрийн үйл ажиллагаа",
    "safety": "Аюулгүй ажиллагаа",
    "safety operations": "Аюулгүй ажиллагаа",
    "hse": "ХАБЭА",
    "technical services": "Техникийн үйлчилгээ",
    "mine planning": "Уурхайн төлөвлөлт",
    "production": "Үйлдвэрлэл",
    "fleet": "Техник",
    "plant": "Баяжуулах үйлдвэр",
    "workforce": "Ажиллах хүч",
  };
 
  const mapped =
    categoryMap[normalized];
 
  if (mapped) {
    return mapped;
  }
 
  return translateDynamicKpiName(
    text,
    t,
  );
}
 
 
export function translateDynamicExecutiveActionTitle(
  value,
  t,
) {
  const text = String(value || "").trim();
 
  if (!text || !isMongolian(t)) {
    return text;
  }
 
  const normalized =
    normalizeDynamicValue(text);
 
  const actionTitleMap = {
    "maintain cross-functional short-interval control":
      "Функц хоорондын богино хугацааны хяналтыг хэрэгжүүлэх",

    "continue monitoring leading operational indicators":
      "Тэргүүлэх үйл ажиллагааны үзүүлэлтүүдийг үргэлжлүүлэн хянах",

    "review the lowest-performing operational kpi":
      "Хамгийн бага гүйцэтгэлтэй үйл ажиллагааны KPI-г хянах",

    "maintain current plant operating rhythm":
      "Үйлдвэрийн одоогийн ажиллагааны хэмнэлийг хадгалах",
    "maintain the current plant operating rhythm":
      "Үйлдвэрийн одоогийн ажиллагааны хэмнэлийг хадгалах",
    "maintain current operating rhythm":
      "Одоогийн үйл ажиллагааны хэмнэлийг хадгалах",
    "maintain the current operating rhythm":
      "Одоогийн үйл ажиллагааны хэмнэлийг хадгалах",
    "protect planned maintenance windows":
      "Төлөвлөгөөт засварын цонхыг хамгаалах",
    "protect planned maintenance window":
      "Төлөвлөгөөт засварын цонхыг хамгаалах",
    "monitor throughput constraint risk":
      "Боловсруулалтын хүчин чадлын хязгаарлалтын эрсдэлийг хянах",
    "monitor throughput constraints":
      "Боловсруулалтын хүчин чадлын хязгаарлалтуудыг хянах",
    "monitor haul road constraints":
      "Тээврийн замын хязгаарлалтыг хянах",
    "monitor haul-road constraints":
      "Тээврийн замын хязгаарлалтыг хянах",
    "prioritize critical waste routes":
      "Чухал хөрс тээвэрлэлтийн чиглэлүүдийг эрэмбэлэх",
    "prioritise critical waste routes":
      "Чухал хөрс тээвэрлэлтийн чиглэлүүдийг эрэмбэлэх",
    "review truck allocation by destination":
      "Чиглэлээр машины хуваарилалтыг шалгах",
    "review truck allocations by destination":
      "Чиглэлээр машинуудын хуваарилалтыг шалгах",
    "maintain critical control verification":
      "Ноцтой эрсдэлийн хяналтын баталгаажуулалтыг хадгалах",
    "continue critical control verification":
      "Ноцтой эрсдэлийн хяналтын баталгаажуулалтыг үргэлжлүүлэх",
    "monitor fatigue and operational exposure":
      "Ядаргаа болон үйл ажиллагааны өртөлтийг хянах",
    "monitor fatigue exposure":
      "Ядаргааны өртөлтийг хянах",
    "protect critical waste movements":
      "Чухал хөрс тээвэрлэлтийг хамгаалах",
    "protect high-value ore movements":
      "Өндөр үнэ цэнтэй хүдрийн тээвэрлэлтийг хамгаалах",
    "prioritize critical equipment work orders":
      "Чухал техникийн ажлын захиалгуудыг эрэмбэлэх",
    "protect the current operating rhythm":
      "Одоогийн үйл ажиллагааны хэмнэлийг хамгаалах",
    "maintain preventive maintenance compliance":
      "Урьдчилан сэргийлэх засварын биелэлтийг хадгалах",
    "maintain feed consistency":
      "Тэжээлийн тогтвортой байдлыг хадгалах",
    "avoid complacency during strong production performance":
      "Үйлдвэрлэлийн өндөр гүйцэтгэлийн үед хяналтыг сулруулахгүй байх",
    "continue visible leadership interactions":
      "Талбай дахь удирдлагын оролцоог үргэлжлүүлэх",
    "continue visible leadership interaction":
      "Талбай дахь удирдлагын оролцоог үргэлжлүүлэх",
    "confirm crusher feed stability":
      "Бутлуурын тэжээлийн тогтвортой байдлыг баталгаажуулах",
    "verify crusher feed stability":
      "Бутлуурын тэжээлийн тогтвортой байдлыг баталгаажуулах",
    "review fleet availability":
      "Техникийн бэлэн байдлыг шалгах",
    "review dispatch exceptions":
      "Диспетчерийн зөрчлүүдийг шалгах",
    "protect fleet availability":
      "Техникийн бэлэн байдлыг хамгаалах",
    "review mining sequence":
      "Олборлолтын дарааллыг шалгах",
    "check truck allocation":
      "Машины хуваарилалтыг шалгах",
    "review safety incidents":
      "Аюулгүй ажиллагааны тохиолдлуудыг шалгах",
  };
 
  if (actionTitleMap[normalized]) {
    return actionTitleMap[normalized];
  }
 
  return translateDynamicExecutiveText(
    text,
    t,
  );
}
 
 
export function translateDynamicExecutiveActionSource(
  value,
  t,
) {
  const text = String(value || "").trim();
 
  if (!text || !isMongolian(t)) {
    return text;
  }
 
  const normalized =
    normalizeDynamicValue(
      text.replaceAll("_", " "),
    );
 
  const sourceMap = {
    "manual": "Гараар",
    "ai": "AI",
    "ai generated": "AI-аар үүсгэсэн",
    "ai-generated": "AI-аар үүсгэсэн",
    "executive insight": "Удирдлагын дүгнэлт",
    "executive insights": "Удирдлагын дүгнэлт",
    "trend engine": "Хандлагын шинжилгээ",
    "rule based": "Дүрэмд суурилсан",
    "rule-based": "Дүрэмд суурилсан",
    "rule based orchestrator": "Дүрэмд суурилсан шинжилгээ",
    "rule-based orchestrator": "Дүрэмд суурилсан шинжилгээ",
  };
 
  return (
    sourceMap[normalized] ||
    translateDynamicSourceType(
      text,
      t,
    )
  );
}
 
 
export function translateDynamicExecutiveActionOwner(
  value,
  t,
) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  const normalized =
    normalizeDynamicValue(text);

  const englishToMongolianMap = {
    "operations": "Үйл ажиллагаа",
    "operations team": "Үйл ажиллагааны баг",
    "operations manager": "Үйл ажиллагааны менежер",
    "operations superintendent":
      "Үйл ажиллагааны ахлах менежер",

    "mining operations":
      "Уурхайн үйл ажиллагаа",

    "mine operations":
      "Уурхайн үйл ажиллагаа",

    "dispatch & control room":
      "Диспетчер ба хяналтын өрөө",

    "dispatch and control room":
      "Диспетчер ба хяналтын өрөө",

    "dispatch":
      "Диспетчер",

    "mobile maintenance":
      "Явуулын засвар",

    "maintenance":
      "Засвар үйлчилгээ",

    "maintenance manager":
      "Засварын менежер",

    "maintenance superintendent":
      "Засварын ахлах менежер",

    "mine manager":
      "Уурхайн менежер",

    "mining superintendent":
      "Уурхайн ахлах менежер",

    "production superintendent":
      "Үйлдвэрлэлийн ахлах менежер",

    "processing operations":
      "Боловсруулах үйлдвэрлэл",

    "hse and operations":
      "ХАБЭА ба Үйл ажиллагаа",

    "mine management team":
      "Уурхайн удирдлагын баг",

    "data and reporting team":
      "Өгөгдөл ба тайлагналын баг",

    "maintenance and dispatch":
      "Засвар ба диспетчер",
  };

  const mongolianToEnglishMap = {
    "үйл ажиллагаа":
      "Operations",

    "үйл ажиллагааны баг":
      "Operations Team",

    "үйл ажиллагааны менежер":
      "Operations Manager",

    "үйл ажиллагааны ахлах менежер":
      "Operations Superintendent",

    "уурхайн үйл ажиллагаа":
      "Mining Operations",

    "диспетчер ба хяналтын өрөө":
      "Dispatch & Control Room",

    "диспетчер":
      "Dispatch",

    "явуулын засвар":
      "Mobile Maintenance",

    "засвар үйлчилгээ":
      "Maintenance",

    "засварын менежер":
      "Maintenance Manager",

    "засварын ахлах менежер":
      "Maintenance Superintendent",

    "уурхайн менежер":
      "Mine Manager",

    "уурхайн ахлах менежер":
      "Mining Superintendent",

    "үйлдвэрлэлийн ахлах менежер":
      "Production Superintendent",

    "боловсруулах үйлдвэрлэл":
      "Processing Operations",

    "хабэа ба үйл ажиллагаа":
      "HSE and Operations",

    "уурхайн удирдлагын баг":
      "Mine Management Team",

    "өгөгдөл ба тайлагналын баг":
      "Data and Reporting Team",

    "засвар ба диспетчер":
      "Maintenance and Dispatch",
  };

  if (isMongolian(t)) {
    return (
      englishToMongolianMap[normalized] ||
      text
    );
  }

  return (
    mongolianToEnglishMap[normalized] ||
    text
  );
}
 
 
export function translateDynamicExecutiveActionAnalyticsLabel(
  value,
  t,
) {
  const text = String(value || "").trim();
 
  if (!text || !isMongolian(t)) {
    return text;
  }
 
  const normalized =
    normalizeDynamicValue(text);
 
  const itemMatch =
    normalized.match(
      /^item\s+(\d+)$/i,
    );
 
  if (itemMatch) {
    return `KPI ангилал ${itemMatch[1]}`;
  }
 
  const category =
    translateDynamicExecutiveActionCategory(
      text,
      t,
    );
 
  if (category !== text) {
    return category;
  }
 
  const owner =
    translateDynamicExecutiveActionOwner(
      text,
      t,
    );
 
  if (owner !== text) {
    return owner;
  }
 
  return translateDynamicKpiName(
    text,
    t,
  );
}
 
 
export function translateDynamicExecutiveActionValue(
  value,
  t,
) {
  const text = String(value || "").trim();
 
  if (!text || !isMongolian(t)) {
    return text;
  }
 
  const title =
    translateDynamicExecutiveActionTitle(
      text,
      t,
    );
 
  if (title !== text) {
    return title;
  }
 
  const analyticsLabel =
    translateDynamicExecutiveActionAnalyticsLabel(
      text,
      t,
    );
 
  if (analyticsLabel !== text) {
    return analyticsLabel;
  }
 
  const source =
    translateDynamicExecutiveActionSource(
      text,
      t,
    );
 
  if (source !== text) {
    return source;
  }
 
  const priority =
    translateDynamicPriority(
      text,
      t,
    );
 
  if (priority !== text) {
    return priority;
  }
 
  const status =
    translateDynamicStatus(
      text,
      t,
    );
 
  if (status !== text) {
    return status;
  }
 
  return text;
}
 
/* ======================================================
   GENERIC DYNAMIC LABEL
====================================================== */
 
export function translateDynamicLabel(
  value,
  t,
) {
  const normalized =
    normalizeDynamicValue(value);
 
  if (!normalized) {
    return "";
  }
 
  const kpiValue =
    translateDynamicKpiName(
      value,
      t,
    );
 
  if (kpiValue !== value) {
    return kpiValue;
  }
 
  const scenarioValue =
    translateDynamicScenario(
      value,
      t,
    );
 
  if (scenarioValue !== value) {
    return scenarioValue;
  }
 
  const outlookValue =
    translateDynamicOutlook(
      value,
      t,
    );
 
  if (outlookValue !== value) {
    return outlookValue;
  }
 
  const trendValue =
    translateDynamicTrend(
      value,
      t,
    );
 
  if (trendValue !== value) {
    return trendValue;
  }
 
  const priorityValue =
    translateDynamicPriority(
      value,
      t,
    );
 
  if (priorityValue !== value) {
    return priorityValue;
  }
 
  const statusValue =
    translateDynamicStatus(
      value,
      t,
    );
 
  if (statusValue !== value) {
    return statusValue;
  }
 
  const executiveActionValue =
    translateDynamicExecutiveActionValue(
      value,
      t,
    );
 
  if (executiveActionValue !== value) {
    return executiveActionValue;
  }
 
  return value;
}
