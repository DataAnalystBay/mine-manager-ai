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


const ABOVE_TARGET_COLOR = "#16a34a";
const BELOW_TARGET_COLOR = "#dc2626";
const TARGET_COLOR = "#2563eb";


function FleetTrendChart({
  data = [],
  target = 90,
}) {
  const [mode, setMode] =
    useState("availability");


  const handleModeChange = (
    event,
    newMode
  ) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };


  const metricKey =
    mode === "availability"
      ? "availability"
      : "utilization";


  const metricLabel =
    mode === "availability"
      ? "Fleet Availability"
      : "Fleet Utilization";


  const chartData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => {
      const actual = Number(
        item?.[metricKey] ?? 0
      );

      const variance =
        actual - target;

      const isAtOrAboveTarget =
        actual >= target;

      return {
        ...item,

        chart_actual:
          actual,

        chart_target:
          target,

        actual_above_target:
          isAtOrAboveTarget
            ? actual
            : null,

        actual_below_target:
          isAtOrAboveTarget
            ? null
            : actual,

        variance,

        performance_status:
          isAtOrAboveTarget
            ? "At / Above Target"
            : "Below Target",
      };
    });
  }, [
    data,
    metricKey,
    target,
  ]);


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


  const formatPercent = (
    value
  ) => {
    return `${Number(
      value || 0
    ).toFixed(0)}%`;
  };


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

    const targetValue =
      Number(
        row.chart_target || target
      );

    const variance =
      Number(
        row.variance || 0
      );

    const isAtOrAboveTarget =
      actual >= targetValue;

    return (
      <Box
        sx={{
          minWidth: 205,
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
            fontWeight: 800,
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
              fontSize: 11,
            }}
          >
            Target
          </Typography>

          <Typography
            sx={{
              color:
                TARGET_COLOR,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {targetValue.toFixed(1)}%
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
              fontSize: 11,
            }}
          >
            Actual
          </Typography>

          <Typography
            sx={{
              color:
                isAtOrAboveTarget
                  ? ABOVE_TARGET_COLOR
                  : BELOW_TARGET_COLOR,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {actual.toFixed(1)}%
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
              color: "#64748b",
              fontSize: 11,
            }}
          >
            Variance
          </Typography>

          <Typography
            sx={{
              color:
                isAtOrAboveTarget
                  ? ABOVE_TARGET_COLOR
                  : BELOW_TARGET_COLOR,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {variance >= 0
              ? "+"
              : ""}
            {variance.toFixed(1)}
            {" pp"}
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
            borderRadius: 999,

            bgcolor:
              isAtOrAboveTarget
                ? "#dcfce7"
                : "#fee2e2",

            color:
              isAtOrAboveTarget
                ? "#166534"
                : "#991b1b",

            fontSize: 9,
            fontWeight: 900,
          }}
        >
          {isAtOrAboveTarget
            ? "AT / ABOVE TARGET"
            : "BELOW TARGET"}
        </Box>
      </Box>
    );
  }


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
            display:
              "flex",
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
              Fleet Performance Trend
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "#64748b",
                fontSize: 10,
              }}
            >
              {metricLabel}: actual performance
              against target, last 30 days
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
                  minWidth: 78,
                  px: 1.4,
                  py: 0.55,
                  textTransform:
                    "none",
                  fontSize: 10,
                  fontWeight: 800,
                },
            }}
          >
            <ToggleButton
              value="availability"
            >
              Availability
            </ToggleButton>

            <ToggleButton
              value="utilization"
            >
              Utilization
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>


        {/* ==================================================
            Legend
            ================================================== */}

        <Box
          sx={{
            mb: 0.75,
            display:
              "flex",
            alignItems:
              "center",
            flexWrap:
              "wrap",
            gap: 2,
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
                width: 18,
                height: 2.5,
                borderRadius: 2,
                bgcolor:
                  TARGET_COLOR,
              }}
            />

            <Typography
              sx={{
                color:
                  "#64748b",
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              Target {target}%
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
                width: 9,
                height: 9,
                borderRadius: 0.5,
                bgcolor:
                  ABOVE_TARGET_COLOR,
              }}
            />

            <Typography
              sx={{
                color:
                  "#64748b",
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              Actual ≥ Target
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
                width: 9,
                height: 9,
                borderRadius: 0.5,
                bgcolor:
                  BELOW_TARGET_COLOR,
              }}
            />

            <Typography
              sx={{
                color:
                  "#64748b",
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              Actual &lt; Target
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
                tickLine={
                  false
                }
                minTickGap={18}
              />


              <YAxis
                domain={[
                  0,
                  100,
                ]}
                ticks={[
                  0,
                  25,
                  50,
                  75,
                  100,
                ]}
                tickFormatter={
                  formatPercent
                }
                tick={{
                  fontSize: 9,
                  fill:
                    "#64748b",
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
                  <CustomTooltip />
                }
                cursor={{
                  fill:
                    "rgba(148, 163, 184, 0.08)",
                }}
              />


              {/* ============================================
                  Actual >= Target
                  Green bars
                  ============================================ */}

              <Bar
                dataKey=
                  "actual_above_target"
                name=
                  "Actual ≥ Target"
                fill={
                  ABOVE_TARGET_COLOR
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
                  Actual < Target
                  Red bars
                  ============================================ */}

              <Bar
                dataKey=
                  "actual_below_target"
                name=
                  "Actual < Target"
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
                  Blue reference line
                  ============================================ */}

              <Line
                type="monotone"
                dataKey=
                  "chart_target"
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


export default FleetTrendChart;