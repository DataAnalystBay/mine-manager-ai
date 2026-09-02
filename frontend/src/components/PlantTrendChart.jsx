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

import { useLanguage } from "../context/LanguageContext";


const ABOVE_TARGET_COLOR = "#16a34a";
const BELOW_TARGET_COLOR = "#dc2626";
const TARGET_COLOR = "#2563eb";


function toFiniteMetric(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}


function PlantTrendChart({
  data = [],
  recoveryTarget = 90,
  periodDescription,
  headerActions,
  aggregation = "daily",
}) {
  const { t, language } = useLanguage();

  const [mode, setMode] =
    useState("throughput");

  const tonnesUnit =
    language === "MN" ? "тн" : "t";


  const handleModeChange = (
    event,
    newMode
  ) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };


  const chartData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    const chronologicalData = [...data].sort((left, right) => {
      const leftTime = new Date(left?.report_date).getTime();
      const rightTime = new Date(right?.report_date).getTime();
      const normalizedLeftTime = Number.isNaN(leftTime)
        ? Number.NEGATIVE_INFINITY
        : leftTime;
      const normalizedRightTime = Number.isNaN(rightTime)
        ? Number.NEGATIVE_INFINITY
        : rightTime;

      return normalizedLeftTime - normalizedRightTime;
    });

    return chronologicalData.map((item) => {
      const throughputPlan = toFiniteMetric(item?.throughput_plan);
      const throughputActual = toFiniteMetric(item?.throughput_actual);
      const recovery = toFiniteMetric(item?.recovery);

      if (mode === "throughput") {
        if (throughputPlan === null || throughputActual === null) return null;
        const variance =
          throughputActual -
          throughputPlan;

        const atOrAbove =
          throughputActual >=
          throughputPlan;

        return {
          ...item,
          chart_target:
            throughputPlan,
          chart_actual:
            throughputActual,
          actual_above_target:
            atOrAbove
              ? throughputActual
              : null,
          actual_below_target:
            atOrAbove
              ? null
              : throughputActual,
          variance,
        };
      }

      if (recovery === null) return null;

      const variance =
        recovery -
        recoveryTarget;

      const atOrAbove =
        recovery >= recoveryTarget;

      return {
        ...item,
        chart_target:
          recoveryTarget,
        chart_actual:
          recovery,
        actual_above_target:
          atOrAbove
            ? recovery
            : null,
        actual_below_target:
          atOrAbove
            ? null
            : recovery,
        variance,
      };
    }).filter(Boolean);
  }, [
    data,
    mode,
    recoveryTarget,
  ]);


  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    const normalized =
      String(value);

    return normalized.length >= 10
      ? aggregation === "monthly"
        ? normalized.slice(0, 7)
        : normalized.slice(5, 10)
      : normalized;
  };


  const formatYAxis = (value) => {
    const number =
      Number(value || 0);

    if (mode === "recovery") {
      return `${number.toFixed(0)}%`;
    }

    if (
      Math.abs(number) >= 1000
    ) {
      return `${Math.round(
        number / 1000
      )}k`;
    }

    return number.toLocaleString();
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

    const target =
      Number(
        row.chart_target || 0
      );

    const variance =
      Number(
        row.variance || 0
      );

    const atOrAbove =
      actual >= target;

    const isRecovery =
      mode === "recovery";

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
            {t("plant.target")}
          </Typography>

          <Typography
            sx={{
              color:
                TARGET_COLOR,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {isRecovery
              ? `${target.toFixed(1)}%`
              : `${target.toLocaleString()} ${tonnesUnit}`}
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
            {t("plant.actual")}
          </Typography>

          <Typography
            sx={{
              color:
                atOrAbove
                  ? ABOVE_TARGET_COLOR
                  : BELOW_TARGET_COLOR,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {isRecovery
              ? `${actual.toFixed(1)}%`
              : `${actual.toLocaleString()} ${tonnesUnit}`}
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
            {t("plant.variance")}
          </Typography>

          <Typography
            sx={{
              color:
                atOrAbove
                  ? ABOVE_TARGET_COLOR
                  : BELOW_TARGET_COLOR,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {variance >= 0
              ? "+"
              : ""}
            {isRecovery
              ? `${variance.toFixed(1)} pp`
              : `${variance.toLocaleString()} ${tonnesUnit}`}
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
              atOrAbove
                ? "#dcfce7"
                : "#fee2e2",
            color:
              atOrAbove
                ? "#166534"
                : "#991b1b",
            fontSize: 9,
            fontWeight: 900,
          }}
        >
          {atOrAbove
            ? t("plant.atOrAboveTarget")
            : t("plant.belowTarget")}
        </Box>
      </Box>
    );
  }


  const metricLabel =
    mode === "throughput"
      ? t("plant.throughput")
      : t("plant.recovery");


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
        <Box
          sx={{
            mb: 1.25,
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            flexWrap: "wrap",
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
              {t("plant.plantPerformanceTrend")}
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "#64748b",
                fontSize: 10,
              }}
            >
              {metricLabel}:{" "}
              {periodDescription || t("plant.chartActualAgainstTarget")}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: {
                xs: "flex-start",
                md: "flex-end",
              },
              flexWrap: "wrap",
              gap: 1,
            }}
          >
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
                value="throughput"
              >
                {t("plant.throughput")}
              </ToggleButton>

              <ToggleButton
                value="recovery"
              >
                {t("plant.recovery")}
              </ToggleButton>
            </ToggleButtonGroup>

            {headerActions}
          </Box>
        </Box>

        <Box
          sx={{
            mb: 0.75,
            display: "flex",
            alignItems:
              "center",
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
              {t("plant.target")}
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
                  ABOVE_TARGET_COLOR,
              }}
            />

            <Typography
              sx={{
                color: "#64748b",
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              {t("plant.actualAtOrAboveTarget")}
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
              {t("plant.actualBelowTarget")}
            </Typography>
          </Box>
        </Box>

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
                  mode === "recovery"
                    ? [0, 100]
                    : ["auto", "auto"]
                }
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
                width={42}
              />

              <Tooltip
                content={CustomTooltip}
                cursor={{
                  fill:
                    "rgba(148, 163, 184, 0.08)",
                }}
              />

              <Bar
                dataKey=
                  "actual_above_target"
                name={
                  t("plant.actualAtOrAboveTarget")
                }
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

              <Bar
                dataKey=
                  "actual_below_target"
                name={
                  t("plant.actualBelowTarget")
                }
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

              <Line
                type="monotone"
                dataKey=
                  "chart_target"
                name={t("plant.target")}
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


export default PlantTrendChart;
