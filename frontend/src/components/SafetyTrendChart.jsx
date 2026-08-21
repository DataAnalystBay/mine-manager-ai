import {
  useMemo,
  useState,
} from "react";

import {
  Box,
  Card,
  CardContent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";


const GOOD_COLOR = "#16a34a";
const BELOW_TARGET_COLOR = "#dc2626";
const WARNING_COLOR = "#f59e0b";
const TARGET_COLOR = "#2563eb";

const GRID_COLOR = "#e7edf5";
const TEXT_PRIMARY = "#0f172a";
const TEXT_SECONDARY = "#64748b";


/* =========================================================
   TRANSLATION FALLBACK
========================================================= */

function translate(
  t,
  key,
  fallback
) {
  try {
    const value = t?.(key);

    if (
      !value ||
      value === key
    ) {
      return fallback;
    }

    return value;
  } catch {
    return fallback;
  }
}


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(value) {
  if (!value) {
    return "";
  }

  const raw =
    String(value);

  if (
    raw.length >= 10
  ) {
    return raw.slice(5, 10);
  }

  return raw;
}


/* =========================================================
   TOOLTIP
========================================================= */

function SafetyTooltip({
  active,
  payload,
  label,
  mode,
  target,
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  const row =
    payload[0]?.payload ||
    {};

  const actual =
    Number(
      row.chartValue ?? 0
    );

  const isScore =
    mode === "score";

  const isNearMiss =
    mode === "near_misses";


  let actualColor =
    GOOD_COLOR;

  if (isScore) {
    actualColor =
      actual >= target
        ? GOOD_COLOR
        : BELOW_TARGET_COLOR;
  } else if (isNearMiss) {
    actualColor =
      actual === 0
        ? GOOD_COLOR
        : WARNING_COLOR;
  } else {
    actualColor =
      actual === 0
        ? GOOD_COLOR
        : BELOW_TARGET_COLOR;
  }


  const variance =
    isScore
      ? actual - target
      : actual;


  return (
    <Box
      sx={{
        minWidth: 205,
        px: 1.6,
        py: 1.35,
        bgcolor: "#ffffff",
        border:
          "1px solid #dfe6ef",
        borderRadius:
          "10px",
        boxShadow:
          "0 12px 28px rgba(15, 23, 42, 0.14)",
      }}
    >
      <Typography
        sx={{
          color:
            TEXT_PRIMARY,
          fontSize: 10.5,
          fontWeight: 900,
        }}
      >
        {label}
      </Typography>


      <Stack
        spacing={0.65}
        sx={{
          mt: 1.1,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
        >
          <Typography
            sx={{
              color:
                TEXT_SECONDARY,
              fontSize: 9,
            }}
          >
            Actual
          </Typography>

          <Typography
            sx={{
              color:
                actualColor,
              fontSize: 10,
              fontWeight: 900,
            }}
          >
            {isScore
              ? `${actual.toFixed(
                  1
                )}%`
              : actual}
          </Typography>
        </Stack>


        <Stack
          direction="row"
          justifyContent="space-between"
        >
          <Typography
            sx={{
              color:
                TEXT_SECONDARY,
              fontSize: 9,
            }}
          >
            Target
          </Typography>

          <Typography
            sx={{
              color:
                TARGET_COLOR,
              fontSize: 10,
              fontWeight: 900,
            }}
          >
            {isScore
              ? `${target}%`
              : "0"}
          </Typography>
        </Stack>


        {isScore && (
          <Stack
            direction="row"
            justifyContent="space-between"
          >
            <Typography
              sx={{
                color:
                  TEXT_SECONDARY,
                fontSize: 9,
              }}
            >
              Variance
            </Typography>

            <Typography
              sx={{
                color:
                  variance >= 0
                    ? GOOD_COLOR
                    : BELOW_TARGET_COLOR,
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              {variance >= 0
                ? "+"
                : ""}
              {variance.toFixed(
                1
              )}{" "}
              pts
            </Typography>
          </Stack>
        )}
      </Stack>


      <Box
        sx={{
          mt: 1.1,
          display:
            "inline-flex",
          alignItems:
            "center",
          gap: 0.6,
          px: 0.9,
          py: 0.35,
          borderRadius:
            "999px",
          bgcolor:
            `${actualColor}12`,
          color:
            actualColor,
          fontSize: 8,
          fontWeight: 900,
        }}
      >
        {actualColor ===
        GOOD_COLOR ? (
          <FiCheckCircle
            size={10}
          />
        ) : (
          <FiAlertTriangle
            size={10}
          />
        )}

        {row.status}
      </Box>
    </Box>
  );
}


/* =========================================================
   LEGEND ITEM
========================================================= */

function LegendItem({
  color,
  label,
  type = "box",
}) {
  return (
    <Stack
      direction="row"
      spacing={0.65}
      alignItems="center"
    >
      {type === "line" ? (
        <Box
          sx={{
            width: 18,
            height: 0,
            borderTop:
              `2px dashed ${color}`,
          }}
        />
      ) : (
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius:
              "50%",
            bgcolor: color,
          }}
        />
      )}

      <Typography
        sx={{
          color:
            TEXT_SECONDARY,
          fontSize: 8.5,
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}


/* =========================================================
   BOTTOM KPI
========================================================= */

function BottomMetric({
  icon,
  iconColor,
  iconBackground,
  eyebrow,
  value,
  subtitle,
  subtitleColor =
    TEXT_SECONDARY,
  divider = false,
}) {
  return (
    <Box
      sx={{
        position:
          "relative",
        flex: 1,
        minWidth: 0,
        px: 1.7,
        py: 1.25,

        ...(divider && {
          borderLeft:
            "1px solid #e5eaf1",
        }),
      }}
    >
      <Stack
        direction="row"
        spacing={1.1}
        alignItems="center"
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius:
              "9px",
            bgcolor:
              iconBackground,
            color:
              iconColor,
            display:
              "grid",
            placeItems:
              "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              color:
                "#64748b",
              fontSize: 7,
              fontWeight: 900,
              textTransform:
                "uppercase",
              letterSpacing:
                "0.06em",
            }}
          >
            {eyebrow}
          </Typography>

          <Typography
            sx={{
              mt: 0.15,
              color:
                TEXT_PRIMARY,
              fontSize: 15,
              lineHeight: 1.1,
              fontWeight: 900,
            }}
          >
            {value}
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              color:
                subtitleColor,
              fontSize: 7.5,
              fontWeight: 700,
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

function SafetyTrendChart({
  data = [],
  safetyScoreTarget = 95,
  t,
}) {
  const [mode, setMode] =
    useState("score");


  /* =======================================================
     MODE CONFIGURATION
  ======================================================= */

  const metricConfig =
    useMemo(() => {
      switch (mode) {
        case "incidents":
          return {
            key:
              "incidents",
            title:
              "Recordable Incidents",
            target: 0,
            unit: "",
            targetType:
              "lower",
          };


        case "near_misses":
          return {
            key:
              "near_misses",
            title:
              "Near Misses",
            target: 0,
            unit: "",
            targetType:
              "lower",
          };


        case "critical_risks":
          return {
            key:
              "critical_risks",
            title:
              "Critical Risks",
            target: 0,
            unit: "",
            targetType:
              "lower",
          };


        default:
          return {
            key:
              "safety_score",
            title:
              "Safety Score",
            target:
              safetyScoreTarget,
            unit: "%",
            targetType:
              "higher",
          };
      }
    }, [
      mode,
      safetyScoreTarget,
    ]);


  /* =======================================================
     NORMALIZED DATA
  ======================================================= */

  const chartData =
    useMemo(() => {
      if (
        !Array.isArray(
          data
        )
      ) {
        return [];
      }

      return data.map(
        (
          item,
          index
        ) => {
          const safetyScore =
            Number(
              item?.safety_score ??
                0
            );

          const incidents =
            Number(
              item?.incidents ??
                0
            );

          const nearMisses =
            Number(
              item?.near_misses ??
                0
            );

          const criticalRisks =
            Number(
              item?.critical_risks ??
                0
            );


          let chartValue =
            safetyScore;

          let status =
            "At / above target";

          let barColor =
            GOOD_COLOR;


          if (
            mode ===
            "score"
          ) {
            chartValue =
              safetyScore;

            if (
              safetyScore >=
              safetyScoreTarget
            ) {
              status =
                "At / above target";

              barColor =
                GOOD_COLOR;
            } else {
              status =
                "Below target";

              barColor =
                BELOW_TARGET_COLOR;
            }
          }


          if (
            mode ===
            "incidents"
          ) {
            chartValue =
              incidents;

            if (
              incidents === 0
            ) {
              status =
                "No incidents";

              barColor =
                GOOD_COLOR;
            } else {
              status =
                "Incident recorded";

              barColor =
                BELOW_TARGET_COLOR;
            }
          }


          if (
            mode ===
            "near_misses"
          ) {
            chartValue =
              nearMisses;

            if (
              nearMisses === 0
            ) {
              status =
                "No near misses";

              barColor =
                GOOD_COLOR;
            } else {
              status =
                "Review and learn";

              barColor =
                WARNING_COLOR;
            }
          }


          if (
            mode ===
            "critical_risks"
          ) {
            chartValue =
              criticalRisks;

            if (
              criticalRisks ===
              0
            ) {
              status =
                "No critical risks";

              barColor =
                GOOD_COLOR;
            } else {
              status =
                "Critical risk present";

              barColor =
                BELOW_TARGET_COLOR;
            }
          }


          return {
            ...item,

            _index:
              index,

            report_date:
              item?.report_date ??
              item?.date ??
              "",

            safety_score:
              safetyScore,

            incidents,

            near_misses:
              nearMisses,

            critical_risks:
              criticalRisks,

            chartValue,

            barColor,

            status,
          };
        }
      );
    }, [
      data,
      mode,
      safetyScoreTarget,
    ]);


  /* =======================================================
     SUMMARY CALCULATIONS
  ======================================================= */

  const summary =
    useMemo(() => {
      if (
        !chartData.length
      ) {
        return {
          average: 0,
          targetPeriods: 0,
          targetPercent: 0,
          highest: 0,
          lowest: 0,
          lastSevenChange: 0,
        };
      }


      const values =
        chartData.map(
          (row) =>
            Number(
              row.chartValue ||
                0
            )
        );


      const average =
        values.reduce(
          (
            total,
            value
          ) =>
            total + value,
          0
        ) /
        values.length;


      let targetPeriods =
        0;


      if (
        metricConfig.targetType ===
        "higher"
      ) {
        targetPeriods =
          values.filter(
            (value) =>
              value >=
              metricConfig.target
          ).length;
      } else {
        targetPeriods =
          values.filter(
            (value) =>
              value <=
              metricConfig.target
          ).length;
      }


      const latestSeven =
        values.slice(-7);

      const previousSeven =
        values.slice(
          -14,
          -7
        );


      const latestAverage =
        latestSeven.length
          ? latestSeven.reduce(
              (
                total,
                value
              ) =>
                total +
                value,
              0
            ) /
            latestSeven.length
          : 0;


      const previousAverage =
        previousSeven.length
          ? previousSeven.reduce(
              (
                total,
                value
              ) =>
                total +
                value,
              0
            ) /
            previousSeven.length
          : latestAverage;


      return {
        average,

        targetPeriods,

        targetPercent:
          chartData.length
            ? (targetPeriods /
                chartData.length) *
              100
            : 0,

        highest:
          Math.max(
            ...values
          ),

        lowest:
          Math.min(
            ...values
          ),

        lastSevenChange:
          latestAverage -
          previousAverage,
      };
    }, [
      chartData,
      metricConfig,
    ]);


  /* =======================================================
     CHART Y AXIS
  ======================================================= */

  const yAxisConfig =
    useMemo(() => {
      if (
        mode === "score"
      ) {
        return {
          domain: [
            75,
            100,
          ],

          ticks: [
            75,
            80,
            85,
            90,
            95,
            100,
          ],

          formatter:
            (value) =>
              `${value}%`,
        };
      }


      const maximum =
        Math.max(
          ...chartData.map(
            (row) =>
              Number(
                row.chartValue ||
                  0
              )
          ),
          1
        );


      return {
        domain: [
          0,
          Math.max(
            maximum +
              1,
            3
          ),
        ],

        ticks:
          undefined,

        formatter:
          (value) =>
            Number(
              value
            ).toFixed(
              0
            ),
      };
    }, [
      mode,
      chartData,
    ]);


  /* =======================================================
     MODE CHANGE
  ======================================================= */

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


  const averageDisplay =
    mode === "score"
      ? `${summary.average.toFixed(
          1
        )}%`
      : summary.average.toFixed(
          1
        );


  const targetDisplay =
    mode === "score"
      ? `${safetyScoreTarget}%`
      : "0";


  const changeDisplay =
    `${summary.lastSevenChange >=
    0
      ? "+"
      : ""}${summary.lastSevenChange.toFixed(
      1
    )}${
      mode === "score"
        ? " pts"
        : ""
    }`;


  const changeIsGood =
    mode === "score"
      ? summary.lastSevenChange >=
        0
      : summary.lastSevenChange <=
        0;


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border:
          "1px solid #dfe6ef",
        borderRadius:
          "11px",
        bgcolor:
          "#ffffff",
        overflow:
          "hidden",
        boxShadow:
          "0 3px 12px rgba(15, 23, 42, 0.025)",
      }}
    >
      <CardContent
        sx={{
          p: 0,

          "&:last-child": {
            pb: 0,
          },
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <Box
          sx={{
            px: 1.8,
            pt: 1.7,
            pb: 0.8,
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            alignItems={{
              xs: "stretch",
              md: "flex-start",
            }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              <Typography
                sx={{
                  color:
                    TEXT_PRIMARY,
                  fontSize: 12.5,
                  lineHeight: 1.2,
                  fontWeight: 900,
                }}
              >
                Safety Performance
                Trend
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  color:
                    TEXT_SECONDARY,
                  fontSize: 8.5,
                }}
              >
                {metricConfig.title}
                {" · "}
                actual performance
                against target,
                last 30 periods
              </Typography>
            </Box>


            {/* MODE SELECTOR */}

            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={
                handleModeChange
              }
              size="small"
              sx={{
                bgcolor:
                  "#f8fafc",
                borderRadius:
                  "7px",

                "& .MuiToggleButtonGroup-grouped":
                  {
                    borderColor:
                      "#dfe6ef",
                  },

                "& .MuiToggleButton-root":
                  {
                    minWidth: {
                      xs: 65,
                      lg: 72,
                    },

                    height: 27,

                    px: 1.05,

                    color:
                      "#64748b",

                    bgcolor:
                      "#ffffff",

                    textTransform:
                      "none",

                    fontSize: 7.5,

                    fontWeight: 800,

                    whiteSpace:
                      "nowrap",

                    "&.Mui-selected":
                      {
                        bgcolor:
                          "#0f172a",

                        color:
                          "#ffffff",

                        "&:hover":
                          {
                            bgcolor:
                              "#0f172a",
                          },
                      },
                  },
              }}
            >
              <ToggleButton
                value="score"
              >
                Safety Score
              </ToggleButton>

              <ToggleButton
                value="incidents"
              >
                Incidents
              </ToggleButton>

              <ToggleButton
                value="near_misses"
              >
                Near Misses
              </ToggleButton>

              <ToggleButton
                value="critical_risks"
              >
                Critical Risks
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>


          {/* =================================================
              LEGEND
          ================================================= */}

          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1.8}
            sx={{
              mt: 1.2,
            }}
          >
            <LegendItem
              color={
                GOOD_COLOR
              }
              label={
                mode === "score"
                  ? "At / above target"
                  : "At target"
              }
            />

            {mode ===
            "near_misses" ? (
              <LegendItem
                color={
                  WARNING_COLOR
                }
                label="Review and learn"
              />
            ) : (
              <LegendItem
                color={
                  BELOW_TARGET_COLOR
                }
                label={
                  mode ===
                  "score"
                    ? "Below target"
                    : "Above target"
                }
              />
            )}

            <LegendItem
              color={
                TARGET_COLOR
              }
              label={
                mode === "score"
                  ? `Target ${safetyScoreTarget}%`
                  : "Target 0"
              }
              type="line"
            />
          </Stack>
        </Box>


        {/* =================================================
            CHART
        ================================================= */}

        <Box
          sx={{
            width: "100%",

            height: {
              xs: 280,
              sm: 285,
              md: 275,
              lg: 245,
              xl: 250,
            },

            px: 0.8,
          }}
        >
          {chartData.length >
          0 ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <ComposedChart
                data={
                  chartData
                }
                margin={{
                  top: 15,
                  right: 18,
                  left: 0,
                  bottom: 3,
                }}
                barCategoryGap="28%"
              >
                <CartesianGrid
                  stroke={
                    GRID_COLOR
                  }
                  strokeDasharray="3 3"
                  vertical={
                    false
                  }
                />


                <XAxis
                  dataKey="report_date"
                  tickFormatter={
                    formatDate
                  }
                  tick={{
                    fontSize: 8,
                    fill:
                      TEXT_SECONDARY,
                  }}
                  axisLine={{
                    stroke:
                      "#d6dee9",
                  }}
                  tickLine={
                    false
                  }
                  minTickGap={22}
                  height={28}
                />


                <YAxis
                  domain={
                    yAxisConfig.domain
                  }
                  ticks={
                    yAxisConfig.ticks
                  }
                  allowDecimals={
                    mode ===
                    "score"
                  }
                  tickFormatter={
                    yAxisConfig.formatter
                  }
                  tick={{
                    fontSize: 8,
                    fill:
                      TEXT_SECONDARY,
                  }}
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                  width={38}
                />


                <Tooltip
                  content={
                    <SafetyTooltip
                      mode={
                        mode
                      }
                      target={
                        metricConfig.target
                      }
                    />
                  }
                  cursor={{
                    fill:
                      "rgba(148,163,184,0.07)",
                  }}
                />


                {/* TARGET */}

                <ReferenceLine
                  y={
                    metricConfig.target
                  }
                  stroke={
                    TARGET_COLOR
                  }
                  strokeWidth={1.6}
                  strokeDasharray="5 4"
                  ifOverflow="extendDomain"
                  label={
                    mode ===
                    "score"
                      ? {
                          value:
                            `TARGET ${safetyScoreTarget}%`,

                          position:
                            "insideTopRight",

                          fill:
                            TARGET_COLOR,

                          fontSize:
                            8,

                          fontWeight:
                            800,

                          dy: -5,
                        }
                      : undefined
                  }
                />


                {/* ACTUAL */}

                <Bar
                  dataKey="chartValue"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                  maxBarSize={18}
                  isAnimationActive
                  animationDuration={
                    450
                  }
                >
                  {chartData.map(
                    (
                      row,
                      index
                    ) => (
                      <Cell
                        key={`safety-bar-${index}`}
                        fill={
                          row.barColor
                        }
                      />
                    )
                  )}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <Box
              sx={{
                height:
                  "100%",
                display:
                  "grid",
                placeItems:
                  "center",
              }}
            >
              <Typography
                sx={{
                  color:
                    "#94a3b8",
                  fontSize: 10,
                }}
              >
                No safety trend
                data available.
              </Typography>
            </Box>
          )}
        </Box>


        {/* =================================================
            BOTTOM PERFORMANCE STRIP
            Mirrors Production page structure
        ================================================= */}

        <Box
          sx={{
            mt: 0.2,
            borderTop:
              "1px solid #e5eaf1",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
          >
            <BottomMetric
              icon={
                <FiTrendingUp
                  size={16}
                />
              }
              iconColor={
                GOOD_COLOR
              }
              iconBackground="#f0fdf4"
              eyebrow="30-Period Average"
              value={
                averageDisplay
              }
              subtitle={
                mode === "score"
                  ? `${
                      summary.average >=
                      safetyScoreTarget
                        ? "+"
                        : ""
                    }${(
                      summary.average -
                      safetyScoreTarget
                    ).toFixed(
                      1
                    )} pts vs target`
                  : `Average ${metricConfig.title.toLowerCase()}`
              }
              subtitleColor={
                mode === "score"
                  ? summary.average >=
                    safetyScoreTarget
                    ? GOOD_COLOR
                    : BELOW_TARGET_COLOR
                  : TEXT_SECONDARY
              }
            />


            <BottomMetric
              divider
              icon={
                <FiTarget
                  size={16}
                />
              }
              iconColor={
                TARGET_COLOR
              }
              iconBackground="#eff6ff"
              eyebrow="Safety Target"
              value={
                targetDisplay
              }
              subtitle={
                mode === "score"
                  ? "Target score"
                  : "Target events"
              }
            />


            <BottomMetric
              divider
              icon={
                <FiCheckCircle
                  size={16}
                />
              }
              iconColor={
                summary.targetPercent ===
                100
                  ? GOOD_COLOR
                  : WARNING_COLOR
              }
              iconBackground={
                summary.targetPercent ===
                100
                  ? "#f0fdf4"
                  : "#fff7ed"
              }
              eyebrow="Periods At Target"
              value={`${summary.targetPeriods} / ${chartData.length}`}
              subtitle={`${summary.targetPercent.toFixed(
                0
              )}% of periods`}
              subtitleColor={
                summary.targetPercent ===
                100
                  ? GOOD_COLOR
                  : WARNING_COLOR
              }
            />


            <BottomMetric
              divider
              icon={
                <FiActivity
                  size={16}
                />
              }
              iconColor={
                changeIsGood
                  ? GOOD_COLOR
                  : BELOW_TARGET_COLOR
              }
              iconBackground={
                changeIsGood
                  ? "#f0fdf4"
                  : "#fef2f2"
              }
              eyebrow="Last 7-Period Trend"
              value={
                changeDisplay
              }
              subtitle={
                changeIsGood
                  ? "Improving"
                  : "Needs attention"
              }
              subtitleColor={
                changeIsGood
                  ? GOOD_COLOR
                  : BELOW_TARGET_COLOR
              }
            />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}


export default SafetyTrendChart;