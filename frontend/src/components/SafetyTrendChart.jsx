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
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


const GOOD_COLOR = "#16a34a";
const BELOW_TARGET_COLOR = "#dc2626";
const WARNING_COLOR = "#f59e0b";
const TARGET_COLOR = "#2563eb";


function SafetyTrendChart({
  data = [],
  safetyScoreTarget = 95,
}) {
  const [mode, setMode] =
    useState("score");


  const handleModeChange = (
    event,
    newMode
  ) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };


  /* ========================================================
     Metric Configuration
     ======================================================== */

  const metricConfig = useMemo(() => {
    switch (mode) {
      case "incidents":
        return {
          key: "incidents",
          title: "Recordable Incidents",
          target: 0,
          unit: "",
          targetType: "lower",
        };

      case "near_misses":
        return {
          key: "near_misses",
          title: "Near Misses",
          target: 0,
          unit: "",
          targetType: "lower",
        };

      case "critical_risks":
        return {
          key: "critical_risks",
          title: "Critical Risks",
          target: 0,
          unit: "",
          targetType: "lower",
        };

      default:
        return {
          key: "safety_score",
          title: "Safety Score",
          target:
            safetyScoreTarget,
          unit: "%",
          targetType: "higher",
        };
    }
  }, [
    mode,
    safetyScoreTarget,
  ]);


  /* ========================================================
     Normalize Chart Data
     ======================================================== */

  const chartData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => {
      const safetyScore =
        Number(
          item?.safety_score ?? 0
        );

      const incidents =
        Number(
          item?.incidents ?? 0
        );

      const nearMisses =
        Number(
          item?.near_misses ?? 0
        );

      const criticalRisks =
        Number(
          item?.critical_risks ?? 0
        );

      const normalized = {
        ...item,

        safety_score:
          safetyScore,

        incidents,

        near_misses:
          nearMisses,

        critical_risks:
          criticalRisks,
      };


      /* ----------------------------------------------------
         Safety Score
         Higher is better
         ---------------------------------------------------- */

      if (mode === "score") {
        const actual =
          safetyScore;

        const target =
          safetyScoreTarget;

        const meetsTarget =
          actual >= target;

        return {
          ...normalized,

          chart_actual:
            actual,

          chart_target:
            target,

          actual_good:
            meetsTarget
              ? actual
              : null,

          actual_bad:
            meetsTarget
              ? null
              : actual,

          actual_warning:
            null,

          variance:
            actual - target,

          status:
            meetsTarget
              ? "At / Above Target"
              : "Below Target",
        };
      }


      /* ----------------------------------------------------
         Incidents
         Zero is target
         ---------------------------------------------------- */

      if (mode === "incidents") {
        const actual =
          incidents;

        const meetsTarget =
          actual === 0;

        return {
          ...normalized,

          chart_actual:
            actual,

          chart_target:
            0,

          actual_good:
            meetsTarget
              ? actual
              : null,

          actual_bad:
            meetsTarget
              ? null
              : actual,

          actual_warning:
            null,

          variance:
            actual,

          status:
            meetsTarget
              ? "No Incidents"
              : "Incident Recorded",
        };
      }


      /* ----------------------------------------------------
         Near Misses
         Zero = green
         > 0 = amber
         ---------------------------------------------------- */

      if (mode === "near_misses") {
        const actual =
          nearMisses;

        const meetsTarget =
          actual === 0;

        return {
          ...normalized,

          chart_actual:
            actual,

          chart_target:
            0,

          actual_good:
            meetsTarget
              ? actual
              : null,

          actual_bad:
            null,

          actual_warning:
            meetsTarget
              ? null
              : actual,

          variance:
            actual,

          status:
            meetsTarget
              ? "No Near Misses"
              : "Review and Learn",
        };
      }


      /* ----------------------------------------------------
         Critical Risks
         Zero is target
         ---------------------------------------------------- */

      const actual =
        criticalRisks;

      const meetsTarget =
        actual === 0;

      return {
        ...normalized,

        chart_actual:
          actual,

        chart_target:
          0,

        actual_good:
          meetsTarget
            ? actual
            : null,

        actual_bad:
          meetsTarget
            ? null
            : actual,

        actual_warning:
          null,

        variance:
          actual,

        status:
          meetsTarget
            ? "No Critical Risks"
            : "Critical Risk Present",
      };
    });
  }, [
    data,
    mode,
    safetyScoreTarget,
  ]);


  /* ========================================================
     Formatting
     ======================================================== */

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "";
    }

    const normalized =
      String(value);

    if (
      normalized.length >= 10
    ) {
      return normalized.slice(
        5,
        10
      );
    }

    return normalized;
  };


  const formatYAxis = (
    value
  ) => {
    if (mode === "score") {
      return `${Number(
        value
      ).toFixed(0)}%`;
    }

    return Number(
      value
    ).toFixed(0);
  };


  /* ========================================================
     Tooltip
     ======================================================== */

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

    const actual =
      Number(
        row.chart_actual || 0
      );

    const target =
      Number(
        row.chart_target || 0
      );

    const variance =
      Number(
        row.variance || 0
      );

    const isScore =
      mode === "score";

    const isNearMiss =
      mode === "near_misses";

    let actualColor =
      GOOD_COLOR;

    if (actual > target) {
      actualColor =
        isNearMiss
          ? WARNING_COLOR
          : BELOW_TARGET_COLOR;
    }

    if (
      isScore &&
      actual < target
    ) {
      actualColor =
        BELOW_TARGET_COLOR;
    }


    return (
      <Box
        sx={{
          minWidth: 210,
          px: 1.75,
          py: 1.4,
          bgcolor: "#ffffff",
          border:
            "1px solid #e2e8f0",
          borderRadius: 2,
          boxShadow:
            "0 8px 24px rgba(15, 23, 42, 0.12)",
        }}
      >
        <Typography
          sx={{
            mb: 1,
            color: "#0f172a",
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          {label}
        </Typography>


        <Box
          sx={{
            mb: 0.4,
            display: "flex",
            justifyContent:
              "space-between",
            gap: 3,
          }}
        >
          <Typography
            sx={{
              color: "#64748b",
              fontSize: 10,
            }}
          >
            Target
          </Typography>

          <Typography
            sx={{
              color:
                TARGET_COLOR,
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {isScore
              ? `${target.toFixed(1)}%`
              : target}
          </Typography>
        </Box>


        <Box
          sx={{
            mb: 0.4,
            display: "flex",
            justifyContent:
              "space-between",
            gap: 3,
          }}
        >
          <Typography
            sx={{
              color: "#64748b",
              fontSize: 10,
            }}
          >
            Actual
          </Typography>

          <Typography
            sx={{
              color:
                actualColor,
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {isScore
              ? `${actual.toFixed(1)}%`
              : actual}
          </Typography>
        </Box>


        {isScore && (
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
                color: "#64748b",
                fontSize: 10,
              }}
            >
              Variance
            </Typography>

            <Typography
              sx={{
                color:
                  actual >= target
                    ? GOOD_COLOR
                    : BELOW_TARGET_COLOR,
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              {variance >= 0
                ? "+"
                : ""}
              {variance.toFixed(1)}
              {" pp"}
            </Typography>
          </Box>
        )}


        <Box
          sx={{
            display:
              "inline-flex",
            alignItems:
              "center",
            px: 1,
            py: 0.35,
            borderRadius: 999,

            bgcolor:
              actualColor ===
              GOOD_COLOR
                ? "#dcfce7"
                : actualColor ===
                    WARNING_COLOR
                  ? "#fef3c7"
                  : "#fee2e2",

            color:
              actualColor ===
              GOOD_COLOR
                ? "#166534"
                : actualColor ===
                    WARNING_COLOR
                  ? "#92400e"
                  : "#991b1b",

            fontSize: 9,
            fontWeight: 900,
          }}
        >
          {row.status}
        </Box>
      </Box>
    );
  }


  /* ========================================================
     Render
     ======================================================== */

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border:
          "1px solid #e2e8f0",
        borderRadius: 3,
        boxShadow:
          "0 4px 16px rgba(15, 23, 42, 0.04)",
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 2,
            md: 2,
            lg: 1.75,
          },

          "&:last-child": {
            pb: {
              xs: 2,
              md: 2,
              lg: 1.75,
            },
          },
        }}
      >

        {/* ==================================================
            Header
        ================================================== */}

        <Box
          sx={{
            mb: 1.25,
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            flexWrap:
              "wrap",
            gap: 1.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                color:
                  "#0f172a",
                fontSize: {
                  xs: 15,
                  lg: 16,
                },
                fontWeight: 900,
              }}
            >
              Safety Performance Trend
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "#64748b",
                fontSize: 10,
              }}
            >
              {metricConfig.title}:
              actual performance against
              target, last 30 days
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
                  minWidth: 62,
                  px: 1.2,
                  py: 0.55,
                  textTransform:
                    "none",
                  fontSize: 9,
                  fontWeight: 800,
                },
            }}
          >
            <ToggleButton
              value="score"
            >
              Score
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
        </Box>


        {/* ==================================================
            Legend
        ================================================== */}

        <Box
          sx={{
            mb: 0.75,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.65,
            }}
          >
            <Box
              sx={{
                width: 18,
                height: 2.5,
                borderRadius: 2,
                bgcolor:
                  TARGET_COLOR,
              }}
            />

            <Typography
              sx={{
                color: "#64748b",
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              {mode === "score"
                ? `Target ${safetyScoreTarget}%`
                : "Target 0"}
            </Typography>
          </Box>


          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.65,
            }}
          >
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: 0.5,
                bgcolor:
                  GOOD_COLOR,
              }}
            />

            <Typography
              sx={{
                color: "#64748b",
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              {mode === "score"
                ? "Actual ≥ Target"
                : "At Target"}
            </Typography>
          </Box>


          {mode ===
          "near_misses" ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.65,
              }}
            >
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: 0.5,
                  bgcolor:
                    WARNING_COLOR,
                }}
              />

              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: 9,
                  fontWeight: 800,
                }}
              >
                Review and Learn
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.65,
              }}
            >
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: 0.5,
                  bgcolor:
                    BELOW_TARGET_COLOR,
                }}
              />

              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: 9,
                  fontWeight: 800,
                }}
              >
                {mode === "score"
                  ? "Actual < Target"
                  : "Above Target"}
              </Typography>
            </Box>
          )}

        </Box>


        {/* ==================================================
            Chart
        ================================================== */}

        <Box
          sx={{
            width: "100%",

            height: {
              xs: 280,
              sm: 290,
              md: 285,
              lg: 255,
              xl: 245,
            },
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <ComposedChart
              data={chartData}
              margin={{
                top: 10,
                right: 18,
                left: 4,
                bottom: 2,
              }}
              barCategoryGap="22%"
            >

              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                vertical={false}
              />


              <XAxis
                dataKey="report_date"
                tickFormatter={
                  formatDate
                }
                tick={{
                  fontSize: 9,
                  fill:
                    "#64748b",
                }}
                axisLine={{
                  stroke:
                    "#cbd5e1",
                }}
                tickLine={false}
                minTickGap={18}
              />


              <YAxis
                domain={
                  mode === "score"
                    ? [80, 100]
                    : [0, "auto"]
                }
                ticks={
                  mode === "score"
                    ? [
                        80,
                        85,
                        90,
                        95,
                        100,
                      ]
                    : undefined
                }
                allowDecimals={false}
                tickFormatter={
                  formatYAxis
                }
                tick={{
                  fontSize: 9,
                  fill:
                    "#64748b",
                }}
                axisLine={false}
                tickLine={false}
                width={38}
              />


              <Tooltip
                content={
                  <CustomTooltip />
                }
                cursor={{
                  fill:
                    "rgba(148, 163, 184, 0.08)",
                }}
              />


              {/* ============================================
                  Good actual
              ============================================ */}

              <Bar
                dataKey="actual_good"
                name="At / Above Target"
                fill={GOOD_COLOR}
                stackId="actual"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                maxBarSize={22}
                isAnimationActive
              />


              {/* ============================================
                  Warning actual
              ============================================ */}

              <Bar
                dataKey="actual_warning"
                name="Review and Learn"
                fill={WARNING_COLOR}
                stackId="actual"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                maxBarSize={22}
                isAnimationActive
              />


              {/* ============================================
                  Bad actual
              ============================================ */}

              <Bar
                dataKey="actual_bad"
                name="Below Target"
                fill={
                  BELOW_TARGET_COLOR
                }
                stackId="actual"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                maxBarSize={22}
                isAnimationActive
              />


              {/* ============================================
                  Target
              ============================================ */}

              <Line
                type="monotone"
                dataKey="chart_target"
                name="Target"
                stroke={
                  TARGET_COLOR
                }
                strokeWidth={2.25}
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              />

            </ComposedChart>
          </ResponsiveContainer>
        </Box>

      </CardContent>
    </Card>
  );
}


export default SafetyTrendChart;