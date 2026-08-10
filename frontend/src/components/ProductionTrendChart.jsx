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


const ABOVE_PLAN_COLOR = "#16a34a";
const BELOW_PLAN_COLOR = "#dc2626";
const PLAN_COLOR = "#2563eb";


function ProductionTrendChart({
  data = [],
}) {
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
      ? "Ore Production"
      : "Waste Movement";


  const chartData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => {
      const plan =
        Number(
          item?.[planKey] ?? 0
        );

      const actual =
        Number(
          item?.[actualKey] ?? 0
        );

      const variance =
        actual - plan;

      const variancePercent =
        plan > 0
          ? (
              variance /
              plan
            ) * 100
          : 0;

      const isAtOrAbovePlan =
        actual >= plan;

      return {
        ...item,

        chart_plan:
          plan,

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
            ? "At / Above Plan"
            : "Below Plan",
      };
    });
  }, [
    data,
    planKey,
    actualKey,
  ]);


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
      return `${Math.round(
        numericValue / 1000
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
      value.length >= 10
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
            Plan
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
              color: "#64748b",
              fontSize: 11,
            }}
          >
            Variance
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
            borderRadius: 999,

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
            ? "AT / ABOVE PLAN"
            : "BELOW PLAN"}
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
              Production Performance Trend
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "#64748b",
                fontSize: {
                  xs: 10,
                  lg: 10,
                },
              }}
            >
              {title}: actual performance
              against plan, last 30 days
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
                  minWidth: 48,
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
              value="ore"
            >
              Ore
            </ToggleButton>

            <ToggleButton
              value="waste"
            >
              Waste
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
                  PLAN_COLOR,
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
              Plan
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
                  ABOVE_PLAN_COLOR,
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
              Actual ≥ Plan
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
                  BELOW_PLAN_COLOR,
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
              Actual &lt; Plan
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
                tickFormatter={
                  formatTonnes
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
                width={42}
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
                  Actual >= Plan
                  Green bars
                  ============================================ */}

              <Bar
                dataKey=
                  "actual_above_plan"
                name=
                  "Actual ≥ Plan"
                fill={
                  ABOVE_PLAN_COLOR
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
                  Actual < Plan
                  Red bars
                  ============================================ */}

              <Bar
                dataKey=
                  "actual_below_plan"
                name=
                  "Actual < Plan"
                fill={
                  BELOW_PLAN_COLOR
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
                  Plan
                  Blue reference line
                  ============================================ */}

              <Line
                type="monotone"
                dataKey=
                  "chart_plan"
                name="Plan"
                stroke={
                  PLAN_COLOR
                }
                strokeWidth={2.25}
                dot={false}
                activeDot={{
                  r: 4,
                  fill:
                    PLAN_COLOR,
                  stroke:
                    "#ffffff",
                  strokeWidth: 2,
                }}
                connectNulls
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