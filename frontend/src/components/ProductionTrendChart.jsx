import {
  useMemo,
  useState,
} from "react";

import {
  Box,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useLanguage,
} from "../context/LanguageContext";


const ABOVE_PLAN_COLOR = "#16a34a";
const BELOW_PLAN_COLOR = "#dc2626";
const PLAN_COLOR = "#2563eb";
const GRID_COLOR = "#e8edf3";
const AXIS_COLOR = "#64748b";


/* ============================================================
   Helpers
   ============================================================ */

function getNiceAxisConfig(
  values = []
) {
  const finiteValues =
    values
      .map(Number)
      .filter(
        (value) =>
          Number.isFinite(value) &&
          value >= 0
      );

  const rawMax =
    Math.max(
      0,
      ...finiteValues
    );

  if (rawMax <= 0) {
    return {
      domainMax: 1000,
      ticks: [
        0,
        250,
        500,
        750,
        1000,
      ],
    };
  }

  const paddedMax =
    rawMax * 1.12;

  const roughStep =
    paddedMax / 5;

  const magnitude =
    10 **
    Math.floor(
      Math.log10(
        Math.max(
          roughStep,
          1
        )
      )
    );

  const normalized =
    roughStep /
    magnitude;

  const niceMultiplier =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10;

  const step =
    niceMultiplier *
    magnitude;

  const domainMax =
    Math.ceil(
      paddedMax /
      step
    ) *
    step;

  const ticks = [];

  for (
    let value = 0;
    value <=
    domainMax +
      step * 0.01;
    value += step
  ) {
    ticks.push(
      Math.round(
        value
      )
    );
  }

  return {
    domainMax,
    ticks,
  };
}


function getAveragePositivePlan(
  data = [],
  planKey
) {
  const plans =
    data
      .map(
        (item) =>
          Number(
            item?.[
              planKey
            ]
          )
      )
      .filter(
        (value) =>
          Number.isFinite(
            value
          ) &&
          value > 0
      );

  if (
    !plans.length
  ) {
    return 0;
  }

  return (
    plans.reduce(
      (
        sum,
        value
      ) =>
        sum +
        value,
      0
    ) /
    plans.length
  );
}


function getTickInterval(
  count,
  aggregation
) {
  if (
    aggregation === "monthly"
  ) {
    if (count <= 18) {
      return 1;
    }

    if (count <= 40) {
      return 3;
    }

    return 5;
  }

  if (
    aggregation === "weekly"
  ) {
    if (count <= 20) {
      return 1;
    }

    if (count <= 40) {
      return 3;
    }

    return 4;
  }

  if (count <= 8) {
    return 0;
  }

  if (count <= 16) {
    return 1;
  }

  if (count <= 30) {
    return 3;
  }

  if (count <= 60) {
    return 5;
  }

  return 7;
}


function normalizeAggregation(
  value
) {
  const normalized =
    String(
      value ||
      "daily"
    )
      .trim()
      .toLowerCase();

  if (
    normalized ===
      "weekly" ||
    normalized ===
      "monthly"
  ) {
    return normalized;
  }

  return "daily";
}


function formatDateLabel(
  value,
  aggregation,
  language
) {
  if (!value) {
    return "";
  }

  const text =
    String(value);

  const date =
    new Date(
      text.length >= 10
        ? `${text.slice(
            0,
            10
          )}T00:00:00`
        : text
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return text;
  }

  if (
    aggregation ===
    "monthly"
  ) {
    return date
      .toLocaleDateString(
        language === "MN"
          ? "mn-MN"
          : "en-US",
        {
          month:
            "short",

          year:
            "2-digit",
        }
      );
  }

  if (
    aggregation ===
    "weekly"
  ) {
    return date
      .toLocaleDateString(
        language === "MN"
          ? "mn-MN"
          : "en-US",
        {
          month:
            "short",

          day:
            "numeric",
        }
      );
  }

  return text.slice(
    5,
    10
  );
}


function formatTooltipDate(
  value,
  aggregation,
  language
) {
  if (!value) {
    return "";
  }

  const text =
    String(value);

  const date =
    new Date(
      text.length >= 10
        ? `${text.slice(
            0,
            10
          )}T00:00:00`
        : text
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return text;
  }

  if (
    aggregation ===
    "monthly"
  ) {
    return date
      .toLocaleDateString(
        language === "MN"
          ? "mn-MN"
          : "en-US",
        {
          month:
            "long",

          year:
            "numeric",
        }
      );
  }

  if (
    aggregation ===
    "weekly"
  ) {
    return date
      .toLocaleDateString(
        language === "MN"
          ? "mn-MN"
          : "en-US",
        {
          month:
            "short",

          day:
            "numeric",

          year:
            "numeric",
        }
      );
  }

  return date
    .toLocaleDateString(
      language === "MN"
        ? "mn-MN"
        : "en-US",
      {
        month:
          "short",

        day:
          "numeric",

        year:
          "numeric",
      }
    );
}


/* ============================================================
   Target Line Label
   ============================================================ */

function TargetLineLabel({
  viewBox,
  value,
}) {
  if (
    !viewBox ||
    !Number.isFinite(
      Number(value)
    )
  ) {
    return null;
  }

  const {
    x,
    y,
    width,
  } = viewBox;

  const label =
    Math.round(
      Number(value)
    )
      .toLocaleString();

  const badgeWidth =
    Math.max(
      48,
      label.length *
        7 +
        14
    );

  const badgeHeight =
    22;

  const badgeX =
    x +
    width -
    badgeWidth +
    5;

  const badgeY =
    y -
    badgeHeight /
      2;

  return (
    <g>
      <rect
        x={
          badgeX
        }
        y={
          badgeY
        }
        width={
          badgeWidth
        }
        height={
          badgeHeight
        }
        rx={
          5
        }
        fill={
          PLAN_COLOR
        }
      />

      <text
        x={
          badgeX +
          badgeWidth /
            2
        }
        y={
          badgeY +
          14.5
        }
        fill="#ffffff"
        fontFamily='Arial, "Helvetica Neue", sans-serif'
        fontSize="10"
        fontWeight="800"
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}


/* ============================================================
   Component
   ============================================================ */

function formatProductionTooltipValue(
  value
) {
  return `${Number(
    value ||
    0
  ).toLocaleString()} t`;
}


function ProductionTrendTooltip({
  active,
  payload,
  label,
  aggregation,
  language,
  t,
}) {
  if (
    !active ||
    !payload ||
    payload.length ===
      0
  ) {
    return null;
  }

  const row =
    payload?.[0]
      ?.payload ||
    {};

  const plan =
    Number(
      row.chart_plan ||
      0
    );

  const actual =
    Number(
      row.chart_actual ||
      0
    );

  const variance =
    Number(
      row.variance ||
      0
    );

  const variancePercent =
    Number(
      row
        .variance_percent ||
      0
    );

  const isAtOrAbovePlan =
    plan > 0
      ? actual >=
        plan
      : actual >
        0;

  return (
    <Box
      sx={{
        minWidth:
          220,

        px:
          1.8,

        py:
          1.5,

        bgcolor:
          "#ffffff",

        border:
          "1px solid #dfe5ec",

        borderRadius:
          2.5,

        boxShadow:
          "0 12px 28px rgba(15, 23, 42, 0.11)",
      }}
    >
      <Typography
        sx={{
          mb:
            1,

          color:
            "#0f172a",

          fontSize:
            11,

          fontWeight:
            800,
        }}
      >
        {formatTooltipDate(
          label,
          aggregation,
          language
        )}
      </Typography>


      <Box
        sx={{
          mb:
            0.45,

          display:
            "flex",

          justifyContent:
            "space-between",

          gap:
            3,
        }}
      >
        <Typography
          sx={{
            color:
              "#64748b",

            fontSize:
              11,
          }}
        >
          {t(
            "production.plan"
          )}
        </Typography>

        <Typography
          sx={{
            color:
              PLAN_COLOR,

            fontSize:
              11,

            fontWeight:
              800,
          }}
        >
          {formatProductionTooltipValue(
            plan
          )}
        </Typography>
      </Box>


      <Box
        sx={{
          mb:
            0.45,

          display:
            "flex",

          justifyContent:
            "space-between",

          gap:
            3,
        }}
      >
        <Typography
          sx={{
            color:
              "#64748b",

            fontSize:
              11,
          }}
        >
          {t(
            "production.actual"
          )}
        </Typography>

        <Typography
          sx={{
            color:
              isAtOrAbovePlan
                ? ABOVE_PLAN_COLOR
                : BELOW_PLAN_COLOR,

            fontSize:
              11,

            fontWeight:
              800,
          }}
        >
          {formatProductionTooltipValue(
            actual
          )}
        </Typography>
      </Box>


      <Box
        sx={{
          mb:
            1,

          display:
            "flex",

          justifyContent:
            "space-between",

          gap:
            3,
        }}
      >
        <Typography
          sx={{
            color:
              "#64748b",

            fontSize:
              11,
          }}
        >
          {t(
            "production.variance"
          )}
        </Typography>

        <Typography
          sx={{
            color:
              isAtOrAbovePlan
                ? ABOVE_PLAN_COLOR
                : BELOW_PLAN_COLOR,

            fontSize:
              11,

            fontWeight:
              800,

            textAlign:
              "right",
          }}
        >
          {variance >= 0
            ? "+"
            : ""}

          {variance
            .toLocaleString()}

          {" t "}

          (
          {variancePercent >=
          0
            ? "+"
            : ""}

          {variancePercent
            .toFixed(
              1
            )}
          %)
        </Typography>
      </Box>


      <Box
        sx={{
          display:
            "inline-flex",

          alignItems:
            "center",

          px:
            1,

          py:
            0.35,

          borderRadius:
            999,

          bgcolor:
            isAtOrAbovePlan
              ? "#dcfce7"
              : "#fee2e2",

          color:
            isAtOrAbovePlan
              ? "#166534"
              : "#991b1b",

          fontSize:
            9,

          fontWeight:
            900,
        }}
      >
        {isAtOrAbovePlan
          ? t(
              "production.atOrAbovePlan"
            )
              .toUpperCase()
          : t(
              "production.belowPlan"
            )
              .toUpperCase()}
      </Box>
    </Box>
  );
}


function ProductionTrendChart({
  data = [],
  headerActions = null,
}) {
  const {
    t,
    language,
  } = useLanguage();


  const safeData =
    useMemo(
      () =>
        Array.isArray(
          data
        )
          ? data
          : [],
      [
        data,
      ]
    );


  const operationProfile =
    String(
      safeData?.[0]
        ?.operation_profile ||
      ""
    )
      .trim()
      .toLowerCase();


  const isSxewOperation =
    operationProfile ===
    "sxew_copper";


  const wasteApplicable =
    safeData?.[0]
      ?.waste_applicable !==
    false;


  const aggregation =
    normalizeAggregation(
      safeData?.[0]
        ?.aggregation
    );


  const [
    mode,
    setMode,
  ] =
    useState(
      "ore"
    );


  /*
   * Achit-Ikht SX-EW Production does not use Waste Movement.
   * If a previous standard-mine selection left mode="waste",
   * use ore data for this chart.
   */

  const effectiveMode =
    !wasteApplicable ||
    isSxewOperation
      ? "ore"
      : mode;


  const handleModeChange = (
    event,
    newMode
  ) => {
    if (
      newMode !== null
    ) {
      setMode(
        newMode
      );
    }
  };


  const planKey =
    effectiveMode ===
    "ore"
      ? "ore_plan"
      : "waste_plan";


  const actualKey =
    effectiveMode ===
    "ore"
      ? "ore_actual"
      : "waste_actual";


  /*
   * The horizontal management target is the AVERAGE plan
   * across the currently selected reporting range.
   *
   * This ensures:
   *
   * 30D -> average daily target
   * 90D -> average daily target
   * 1Y  -> average weekly target
   * 3Y  -> average monthly target
   * 5Y  -> average monthly target
   *
   * It also matches the "Average Target" KPI shown below
   * the chart.
   */

  const targetValue =
    useMemo(
      () =>
        getAveragePositivePlan(
          safeData,
          planKey
        ),
      [
        safeData,
        planKey,
      ]
    );


  /*
   * IMPORTANT:
   *
   * Bar status is based on THAT PERIOD'S OWN PLAN.
   *
   * This keeps chart colours consistent with:
   *
   * 30D summary
   * 90D summary
   * 1Y weekly summary
   * 3Y monthly summary
   * 5Y monthly summary
   *
   * The horizontal blue line remains the average management
   * target for visual reference only.
   */

  const chartData =
    useMemo(
      () => {
        return safeData.map(
          (
            item
          ) => {
            const actual =
              Number(
                item?.[
                  actualKey
                ] ??
                0
              );

            const periodPlan =
              Number(
                item?.[
                  planKey
                ] ??
                0
              );

            const variance =
              actual -
              periodPlan;

            const variancePercent =
              periodPlan >
              0
                ? (
                    variance /
                    periodPlan
                  ) *
                  100
                : 0;

            const isAtOrAbovePlan =
              periodPlan >
              0
                ? (
                    actual >=
                    periodPlan
                  )
                : actual >
                  0;

            return {
              ...item,

              chart_plan:
                periodPlan,

              chart_actual:
                actual,

              actual_above_plan:
                isAtOrAbovePlan
                  ? actual
                  : null,

              actual_below_plan:
                isAtOrAbovePlan
                  ? null
                  : actual,

              variance,

              variance_percent:
                variancePercent,

              performance_status:
                isAtOrAbovePlan
                  ? t(
                      "production.atOrAbovePlan"
                    )
                  : t(
                      "production.belowPlan"
                    ),
            };
          }
        );
      },
      [
        safeData,
        planKey,
        actualKey,
        t,
      ]
    );


  const axisConfig =
    useMemo(
      () =>
        getNiceAxisConfig(
          [
            targetValue,

            ...chartData
              .map(
                (
                  item
                ) =>
                  item
                    .chart_actual
              ),

            ...chartData
              .map(
                (
                  item
                ) =>
                  item
                    .chart_plan
              ),
          ]
        ),
      [
        chartData,
        targetValue,
      ]
    );


  const xAxisInterval =
    useMemo(
      () =>
        getTickInterval(
          chartData.length,
          aggregation
        ),
      [
        chartData.length,
        aggregation,
      ]
    );


  const formatTonnes = (
    value
  ) => {
    const numericValue =
      Number(
        value ||
        0
      );

    if (
      Math.abs(
        numericValue
      ) >=
      1000000
    ) {
      const millions =
        numericValue /
        1000000;

      return Number.isInteger(
        millions
      )
        ? `${millions}M`
        : `${millions.toFixed(
            1
          )}M`;
    }

    if (
      Math.abs(
        numericValue
      ) >=
      1000
    ) {
      const thousands =
        numericValue /
        1000;

      return Number.isInteger(
        thousands
      )
        ? `${thousands}k`
        : `${thousands.toFixed(
            1
          )}k`;
    }

    return numericValue
      .toLocaleString();
  };


  const chartHeading =
    isSxewOperation
      ? (
          language === "MN"
            ? "Катодын зэсийн үйлдвэрлэлийн чиг хандлага"
            : "Cathode Production Trend"
        )
      : t(
          "production.productionPerformanceTrend"
        );


  const chartSubtitle =
    isSxewOperation
      ? (
          language === "MN"
            ? "Төлөвлөгөө болон бодит катодын зэсийн үйлдвэрлэл"
            : "Plan versus actual cathode production"
        )
      : (
          language === "MN"
            ? "Төлөвлөгөө болон бодит үйлдвэрлэлийн гүйцэтгэл"
            : "Plan versus actual production performance"
        );


  const averagePlanLegendLabel =
    aggregation === "daily"
      ? (
          language === "MN"
            ? "Өдрийн дундаж төлөвлөгөө"
            : "Average Daily Plan"
        )
      : aggregation ===
          "weekly"
        ? (
            language === "MN"
              ? "7 хоногийн дундаж төлөвлөгөө"
              : "Average Weekly Plan"
          )
        : (
            language === "MN"
              ? "Сарын дундаж төлөвлөгөө"
              : "Average Monthly Plan"
          );


  /* ==========================================================
     Tooltip
     ========================================================== */


  return (
    <Card
      elevation={
        0
      }
      sx={{
        height:
          "100%",

        border:
          "none",

        borderRadius:
          0,

        boxShadow:
          "none",

        bgcolor:
          "transparent",
      }}
    >
      <CardContent
        sx={{
          p: {
            xs:
              1.5,

            md:
              1.25,

            lg:
              1.25,
          },

          "&:last-child": {
            pb: {
              xs:
                1.5,

              md:
                1.5,

              lg:
                1.5,
            },
          },
        }}
      >

        {/* ==================================================
            Header
            ================================================== */}

        <Box
          sx={{
            mb:
              0.8,

            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            flexWrap:
              "wrap",

            gap:
              1.25,
          }}
        >

          <Box
            sx={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <Typography
              sx={{
                color:
                  "#334155",

                fontSize: {
                  xs:
                    15,

                  lg:
                    16,
                },

                fontWeight:
                  800,

                lineHeight:
                  1.2,

                letterSpacing:
                  "-0.01em",
              }}
            >
              {chartHeading}
            </Typography>

            <Typography
              sx={{
                mt:
                  0.25,

                color:
                  "#7b8497",

                fontSize:
                  9.5,

                fontWeight:
                  500,

                lineHeight:
                  1.35,
              }}
            >
              {chartSubtitle}
            </Typography>
          </Box>


          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: 1,
              flexShrink: 0,
            }}
          >
            {wasteApplicable &&
              !isSxewOperation && (
              <ToggleButtonGroup
              value={
                mode
              }
              exclusive
              onChange={
                handleModeChange
              }
              size="small"
              sx={{
                "& .MuiToggleButton-root":
                  {
                    minWidth:
                      54,

                    px:
                      1.5,

                    py:
                      0.55,

                    color:
                      "#64748b",

                    borderColor:
                      "#dbe3ec",

                    textTransform:
                      "none",

                    fontSize:
                      10,

                    fontWeight:
                      800,

                    "&:hover": {
                      bgcolor:
                        "#f8fafc",
                    },

                    "&.Mui-selected":
                      {
                        bgcolor:
                          "#eef7f1",

                        color:
                          "#15803d",

                        borderColor:
                          "#b9dfc8",
                      },

                    "&.Mui-selected:hover":
                      {
                        bgcolor:
                          "#e8f4ed",
                      },
                  },
              }}
            >
              <ToggleButton
                value="ore"
              >
                {t(
                  "production.ore"
                )}
              </ToggleButton>

              <ToggleButton
                value="waste"
              >
                {t(
                  "production.waste"
                )}
              </ToggleButton>
              </ToggleButtonGroup>
            )}

            {headerActions}
          </Box>
        </Box>


        {/* ==================================================
            Legend
            ================================================== */}

        <Box
          sx={{
            mb:
              0.65,

            display:
              "flex",

            alignItems:
              "center",

            flexWrap:
              "wrap",

            gap:
              1.8,
          }}
        >

          <Box
            sx={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                0.65,
            }}
          >
            <Box
              sx={{
                width:
                  10,

                height:
                  10,

                borderRadius:
                  1.5,

                bgcolor:
                  ABOVE_PLAN_COLOR,
              }}
            />

            <Typography
              sx={{
                color:
                  "#64748b",

                fontSize:
                  9,

                fontWeight:
                  800,
              }}
            >
              {t(
                "production.actualAtOrAbovePlan"
              )}
            </Typography>
          </Box>


          <Box
            sx={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                0.65,
            }}
          >
            <Box
              sx={{
                width:
                  10,

                height:
                  10,

                borderRadius:
                  1.5,

                bgcolor:
                  BELOW_PLAN_COLOR,
              }}
            />

            <Typography
              sx={{
                color:
                  "#64748b",

                fontSize:
                  9,

                fontWeight:
                  800,
              }}
            >
              {t(
                "production.actualBelowPlan"
              )}
            </Typography>
          </Box>


          <Box
            sx={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                0.65,
            }}
          >
            <Box
              sx={{
                width:
                  22,

                height:
                  0,

                borderTop:
                  `2px dashed ${PLAN_COLOR}`,
              }}
            />

            <Typography
              sx={{
                color:
                  "#64748b",

                fontSize:
                  9,

                fontWeight:
                  800,
              }}
            >
              {averagePlanLegendLabel}

              {targetValue > 0
                ? ` (${Math.round(
                    targetValue
                  ).toLocaleString()} t)`
                : ""}
            </Typography>
          </Box>

        </Box>


        {/* ==================================================
            Chart
            ================================================== */}

        <Box
          sx={{
            width:
              "100%",

            height: {
              xs:
                265,

              sm:
                260,

              md:
                245,

              lg:
                235,

              xl:
                230,
            },
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <ComposedChart
              data={
                chartData
              }
              margin={{
                top:
                  7,

                right:
                  26,

                left:
                  0,

                bottom:
                  0,
              }}
              barCategoryGap={
                aggregation ===
                "monthly"
                  ? "28%"
                  : "32%"
              }
            >

              <CartesianGrid
                stroke={
                  GRID_COLOR
                }
                strokeDasharray="2 4"
                vertical={
                  false
                }
              />


              <XAxis
                dataKey="report_date"
                tickFormatter={
                  (
                    value
                  ) =>
                    formatDateLabel(
                      value,
                      aggregation,
                      language
                    )
                }
                interval={
                  xAxisInterval
                }
                tick={{
                  fontSize:
                    10,

                  fill:
                    AXIS_COLOR,

                  fontWeight:
                    600,
                }}
                axisLine={{
                  stroke:
                    "#d3dae3",
                }}
                tickLine={
                  false
                }
                minTickGap={
                  aggregation ===
                  "monthly"
                    ? 28
                    : 22
                }
                padding={{
                  left:
                    4,

                  right:
                    4,
                }}
              />


              <YAxis
                domain={[
                  0,
                  axisConfig
                    .domainMax,
                ]}
                ticks={
                  axisConfig
                    .ticks
                }
                tickFormatter={
                  formatTonnes
                }
                tick={{
                  fontSize:
                    10,

                  fill:
                    AXIS_COLOR,

                  fontWeight:
                    600,
                }}
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                width={
                  52
                }
              />


              <Tooltip
                content={
                  <ProductionTrendTooltip
                    aggregation={
                      aggregation
                    }
                    language={
                      language
                    }
                    t={t}
                  />
                }
                cursor={{
                  fill:
                    "rgba(100, 116, 139, 0.055)",
                }}
              />


              {targetValue >
                0 && (
                <ReferenceLine
                  y={
                    targetValue
                  }
                  stroke={
                    PLAN_COLOR
                  }
                  strokeWidth={
                    2
                  }
                  strokeDasharray="7 6"
                  strokeLinecap="round"
                  ifOverflow="extendDomain"
                  label={
                    <TargetLineLabel
                      value={
                        targetValue
                      }
                    />
                  }
                />
              )}


              <Bar
                dataKey="actual_above_plan"
                name={
                  t(
                    "production.actualAtOrAbovePlan"
                  )
                }
                fill={
                  ABOVE_PLAN_COLOR
                }
                stackId="actual"
                radius={[
                  5,
                  5,
                  1,
                  1,
                ]}
                maxBarSize={
                  aggregation ===
                  "monthly"
                    ? 13
                    : 16
                }
                isAnimationActive
              />


              <Bar
                dataKey="actual_below_plan"
                name={
                  t(
                    "production.actualBelowPlan"
                  )
                }
                fill={
                  BELOW_PLAN_COLOR
                }
                stackId="actual"
                radius={[
                  5,
                  5,
                  1,
                  1,
                ]}
                maxBarSize={
                  aggregation ===
                  "monthly"
                    ? 13
                    : 16
                }
                isAnimationActive
              />

            </ComposedChart>
          </ResponsiveContainer>
        </Box>

      </CardContent>
    </Card>
  );
}


export default ProductionTrendChart;
