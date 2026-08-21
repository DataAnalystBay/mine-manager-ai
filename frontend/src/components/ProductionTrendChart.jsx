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

  let niceMultiplier = 1;

  if (normalized <= 1) {
    niceMultiplier = 1;
  } else if (normalized <= 2) {
    niceMultiplier = 2;
  } else if (normalized <= 2.5) {
    niceMultiplier = 2.5;
  } else if (normalized <= 5) {
    niceMultiplier = 5;
  } else {
    niceMultiplier = 10;
  }

  const step =
    niceMultiplier *
    magnitude;

  const domainMax =
    Math.ceil(
      paddedMax /
      step
    ) * step;

  const ticks = [];

  for (
    let value = 0;
    value <= domainMax + step * 0.01;
    value += step
  ) {
    ticks.push(
      Math.round(value)
    );
  }

  return {
    domainMax,
    ticks,
  };
}


function getLatestPositivePlan(
  data = [],
  planKey
) {
  for (
    let index =
      data.length - 1;
    index >= 0;
    index -= 1
  ) {
    const plan =
      Number(
        data[index]?.[planKey]
      );

    if (
      Number.isFinite(plan) &&
      plan > 0
    ) {
      return plan;
    }
  }

  return 0;
}


function getTickInterval(
  count
) {
  if (count <= 8) {
    return 0;
  }

  if (count <= 16) {
    return 1;
  }

  if (count <= 24) {
    return 2;
  }

  return 3;
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
    Number(value)
      .toLocaleString();

  const badgeWidth =
    Math.max(
      48,
      label.length * 7 + 14
    );

  const badgeHeight = 22;

  const badgeX =
    x +
    width -
    badgeWidth +
    5;

  const badgeY =
    y -
    badgeHeight / 2;

  return (
    <g>
      <rect
        x={badgeX}
        y={badgeY}
        width={badgeWidth}
        height={badgeHeight}
        rx={5}
        fill={PLAN_COLOR}
      />

      <text
        x={
          badgeX +
          badgeWidth / 2
        }
        y={badgeY + 14.5}
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

function ProductionTrendChart({
  data = [],
}) {
  const {
    t,
  } = useLanguage();

  const [mode, setMode] =
    useState("ore");


  const handleModeChange = (
    event,
    newMode
  ) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };


  const planKey =
    mode === "ore"
      ? "ore_plan"
      : "waste_plan";


  const actualKey =
    mode === "ore"
      ? "ore_actual"
      : "waste_actual";


  const title =
    mode === "ore"
      ? t(
          "production.oreProduction"
        )
      : t(
          "production.wasteMovement"
        );


  /*
   * Use the latest available positive plan as the selected
   * operating target. This intentionally produces the horizontal
   * target line used in the approved Production UI instead of a
   * changing daily plan curve.
   */
  const targetValue =
    useMemo(
      () =>
        getLatestPositivePlan(
          Array.isArray(data)
            ? data
            : [],
          planKey
        ),
      [
        data,
        planKey,
      ]
    );


  /*
   * Daily bar color is evaluated against the same horizontal
   * selected-period target so the red/green bars and target line
   * communicate one consistent management threshold.
   */
  const chartData =
    useMemo(() => {
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map(
        (item) => {
          const actual =
            Number(
              item?.[
                actualKey
              ] ?? 0
            );

          const dailyPlan =
            Number(
              item?.[
                planKey
              ] ?? 0
            );

          const effectivePlan =
            targetValue > 0
              ? targetValue
              : dailyPlan;

          const variance =
            actual -
            effectivePlan;

          const variancePercent =
            effectivePlan > 0
              ? (
                  variance /
                  effectivePlan
                ) * 100
              : 0;

          const isAtOrAbovePlan =
            effectivePlan > 0
              ? actual >=
                effectivePlan
              : actual > 0;

          return {
            ...item,

            chart_plan:
              effectivePlan,

            source_daily_plan:
              dailyPlan,

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
    }, [
      data,
      planKey,
      actualKey,
      targetValue,
      t,
    ]);


  const axisConfig =
    useMemo(
      () =>
        getNiceAxisConfig([
          targetValue,
          ...chartData.map(
            (item) =>
              item.chart_actual
          ),
        ]),
      [
        chartData,
        targetValue,
      ]
    );


  const xAxisInterval =
    useMemo(
      () =>
        getTickInterval(
          chartData.length
        ),
      [
        chartData.length,
      ]
    );


  const formatTonnes = (
    value
  ) => {
    const numericValue =
      Number(value || 0);

    if (
      Math.abs(
        numericValue
      ) >= 1000
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


  const formatDate = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const value =
      String(date);

    if (
      /^\d{4}-\d{2}-\d{2}/.test(
        value
      )
    ) {
      return value.slice(
        5,
        10
      );
    }

    return value;
  };


  const formatTooltipValue = (
    value
  ) => {
    return `${Number(
      value || 0
    ).toLocaleString()} t`;
  };


  /* ==========================================================
     Tooltip
     ========================================================== */

  function CustomTooltip({
    active,
    payload,
    label,
  }) {
    if (
      !active ||
      !payload ||
      payload.length === 0
    ) {
      return null;
    }

    const row =
      payload[0]?.payload ||
      {};

    const plan =
      Number(
        row.chart_plan || 0
      );

    const actual =
      Number(
        row.chart_actual || 0
      );

    const variance =
      Number(
        row.variance || 0
      );

    const variancePercent =
      Number(
        row.variance_percent ||
          0
      );

    const isAtOrAbovePlan =
      actual >= plan;

    return (
      <Box
        sx={{
          minWidth: 220,
          px: 1.8,
          py: 1.5,
          bgcolor: "#ffffff",
          border:
            "1px solid #dfe5ec",
          borderRadius: 2.5,
          boxShadow:
            "0 12px 28px rgba(15, 23, 42, 0.11)",
        }}
      >
        <Typography
          sx={{
            mb: 1,
            color:
              "#0f172a",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {formatDate(
            label
          )}
        </Typography>


        <Box
          sx={{
            mb: 0.45,
            display: "flex",
            justifyContent:
              "space-between",
            gap: 3,
          }}
        >
          <Typography
            sx={{
              color:
                "#64748b",
              fontSize: 11,
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
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {formatTooltipValue(
              plan
            )}
          </Typography>
        </Box>


        <Box
          sx={{
            mb: 0.45,
            display: "flex",
            justifyContent:
              "space-between",
            gap: 3,
          }}
        >
          <Typography
            sx={{
              color:
                "#64748b",
              fontSize: 11,
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
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {formatTooltipValue(
              actual
            )}
          </Typography>
        </Box>


        <Box
          sx={{
            mb: 1,
            display: "flex",
            justifyContent:
              "space-between",
            gap: 3,
          }}
        >
          <Typography
            sx={{
              color:
                "#64748b",
              fontSize: 11,
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
              fontSize: 11,
              fontWeight: 800,
              textAlign:
                "right",
            }}
          >
            {variance >= 0
              ? "+"
              : ""}

            {variance.toLocaleString()}
            {" t "}

            (
            {variancePercent >= 0
              ? "+"
              : ""}

            {variancePercent.toFixed(
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
            px: 1,
            py: 0.35,
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

            fontSize: 9,
            fontWeight: 900,
          }}
        >
          {isAtOrAbovePlan
            ? t(
                "production.atOrAbovePlan"
              ).toUpperCase()
            : t(
                "production.belowPlan"
              ).toUpperCase()}
        </Box>
      </Box>
    );
  }


  return (
    <Card
      elevation={0}
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
            xs: 2,
            md: 2,
            lg: 2,
          },

          "&:last-child": {
            pb: {
              xs: 1.5,
              md: 1.5,
              lg: 1.5,
            },
          },
        }}
      >

        {/* ==================================================
            Header
            ================================================== */}

        <Box
          sx={{
            mb: 1.2,
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            flexWrap:
              "wrap",
            gap: 1.25,
          }}
        >
          <Box>
            <Typography
              sx={{
                color:
                  "#334155",
                fontSize: {
                  xs: 15,
                  lg: 17,
                },
                fontWeight:
                  800,
                letterSpacing:
                  "-0.01em",
              }}
            >
              {t(
                "production.productionPerformanceTrend"
              )}
            </Typography>

            <Typography
              sx={{
                mt: 0.35,
                color:
                  "#64748b",
                fontSize: {
                  xs: 10,
                  lg: 10,
                },
              }}
            >
              {title}:{" "}

              {t(
                "production.chartActualAgainstPlan"
              )}
            </Typography>
          </Box>


          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={
              handleModeChange
            }
            size="small"
            sx={{
              "& .MuiToggleButton-root":
                {
                  minWidth: 54,
                  px: 1.5,
                  py: 0.55,
                  color:
                    "#64748b",
                  borderColor:
                    "#dbe3ec",
                  textTransform:
                    "none",
                  fontSize: 10,
                  fontWeight:
                    800,

                  "&:hover": {
                    bgcolor:
                      "#f8fafc",
                  },

                  "&.Mui-selected": {
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
        </Box>


        {/* ==================================================
            Legend
            ================================================== */}

        <Box
          sx={{
            mb: 0.9,
            display:
              "flex",
            alignItems:
              "center",
            flexWrap:
              "wrap",
            gap: 1.8,
          }}
        >

          <Box
            sx={{
              display:
                "flex",
              alignItems:
                "center",
              gap: 0.65,
            }}
          >
            <Box
              sx={{
                width: 22,
                height: 0,
                borderTop:
                  `2px dashed ${PLAN_COLOR}`,
              }}
            />

            <Typography
              sx={{
                color:
                  "#64748b",
                fontSize: 9,
                fontWeight:
                  800,
              }}
            >
              {t(
                "production.plan"
              )}

              {targetValue > 0
                ? ` (${targetValue.toLocaleString()} t)`
                : ""}
            </Typography>
          </Box>


          <Box
            sx={{
              display:
                "flex",
              alignItems:
                "center",
              gap: 0.65,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
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
                fontSize: 9,
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
              gap: 0.65,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
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
                fontSize: 9,
                fontWeight:
                  800,
              }}
            >
              {t(
                "production.actualBelowPlan"
              )}
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
              xs: 310,
              sm: 320,
              md: 315,
              lg: 300,
              xl: 295,
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
                top: 16,
                right: 30,
                left: 0,
                bottom: 4,
              }}
              barCategoryGap="32%"
            >

              <CartesianGrid
                stroke={
                  GRID_COLOR
                }
                strokeDasharray=
                  "2 4"
                vertical={
                  false
                }
              />


              <XAxis
                dataKey=
                  "report_date"
                tickFormatter={
                  formatDate
                }
                interval={
                  xAxisInterval
                }
                tick={{
                  fontSize: 10,
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
                  22
                }
                padding={{
                  left: 4,
                  right: 4,
                }}
              />


              <YAxis
                domain={[
                  0,
                  axisConfig.domainMax,
                ]}
                ticks={
                  axisConfig.ticks
                }
                tickFormatter={
                  formatTonnes
                }
                tick={{
                  fontSize: 10,
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
                width={46}
              />


              <Tooltip
                content={
                  <CustomTooltip />
                }
                cursor={{
                  fill:
                    "rgba(100, 116, 139, 0.055)",
                }}
              />


              {targetValue > 0 && (
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
                  strokeDasharray=
                    "7 6"
                  strokeLinecap=
                    "round"
                  ifOverflow=
                    "extendDomain"
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
                dataKey=
                  "actual_above_plan"
                name={
                  t(
                    "production.actualAtOrAbovePlan"
                  )
                }
                fill={
                  ABOVE_PLAN_COLOR
                }
                stackId=
                  "actual"
                radius={[
                  5,
                  5,
                  1,
                  1,
                ]}
                maxBarSize={
                  16
                }
                isAnimationActive
              />


              <Bar
                dataKey=
                  "actual_below_plan"
                name={
                  t(
                    "production.actualBelowPlan"
                  )
                }
                fill={
                  BELOW_PLAN_COLOR
                }
                stackId=
                  "actual"
                radius={[
                  5,
                  5,
                  1,
                  1,
                ]}
                maxBarSize={
                  16
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
