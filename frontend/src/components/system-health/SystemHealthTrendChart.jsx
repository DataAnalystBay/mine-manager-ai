import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import TimelineIcon from "@mui/icons-material/Timeline";
import { useLanguage } from "../../context/LanguageContext";


function formatNumber(
  value,
  decimals = 2
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}


function getLatestValue(
  data,
  field
) {
  if (!Array.isArray(data)) {
    return null;
  }

  for (
    let index = data.length - 1;
    index >= 0;
    index -= 1
  ) {
    const value = Number(
      data[index]?.[field]
    );

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}


function CustomTooltip({
  active,
  payload,
  label,
}) {
  const { t } = useLanguage();
  if (
    !active ||
    !Array.isArray(payload) ||
    payload.length === 0
  ) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        minWidth: 220,
        p: 1.75,
        border: "1px solid #dbe3ee",
        borderRadius: "12px",
        bgcolor: "#ffffff",
        boxShadow:
          "0 12px 30px rgba(15, 23, 42, 0.12)",
      }}
    >
      <Typography
        sx={{
          mb: 1.2,
          fontSize: 12,
          fontWeight: 800,
          color: "#172033",
        }}
      >
        {label || t("systemHealth.healthCheck")}
      </Typography>

      <Stack spacing={0.8}>
        {payload.map((item) => (
          <Box
            key={item.dataKey}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 2,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.8}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: item.color,
                }}
              />

              <Typography
                sx={{
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                {item.name}
              </Typography>
            </Stack>

            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 800,
                color: "#172033",
              }}
            >
              {formatNumber(
                item.value
              )}{" "}
              ms
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}


function MetricSummary({
  label,
  value,
}) {
  return (
    <Box
      sx={{
        minWidth: 150,
        p: 1.5,
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        bgcolor: "#f8fafc",
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "#64748b",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          fontSize: 18,
          fontWeight: 900,
          color: "#172033",
        }}
      >
        {value !== null
          ? `${formatNumber(value)} ms`
          : "—"}
      </Typography>
    </Box>
  );
}


export default function SystemHealthTrendChart({
  data = [],
}) {
  const { t } = useLanguage();
  const chartData = Array.isArray(data)
    ? data
    : [];

  const latestOverall =
    getLatestValue(
      chartData,
      "overallMs"
    );

  const latestDatabase =
    getLatestValue(
      chartData,
      "databaseMs"
    );

  const latestDemoData =
    getLatestValue(
      chartData,
      "demoDataMs"
    );

  const hasData =
    chartData.length > 0;

  return (
    <Paper
      component="section"
      elevation={0}
      sx={{
        mt: 4,
        p: {
          xs: 2,
          md: 2.75,
        },
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        bgcolor: "#ffffff",
        boxShadow:
          "0 10px 28px rgba(15, 23, 42, 0.06)",
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
        spacing={2}
      >
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                borderRadius: "11px",
                bgcolor: "#dbeafe",
                color: "#1d4ed8",
              }}
            >
              <TimelineIcon
                sx={{
                  fontSize: 22,
                }}
              />
            </Box>

            <Box>
              <Typography
                component="h2"
                sx={{
                  fontSize: 21,
                  fontWeight: 900,
                  color: "#172033",
                }}
              >
                {t("systemHealth.performanceTimeline")}
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                {t("systemHealth.performanceTimelineDescription")}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Chip
          size="small"
          label={t("systemHealth.checksCount").replace("{count}", chartData.length)}
          sx={{
            height: 28,
            border:
              "1px solid #dbeafe",
            bgcolor: "#eff6ff",
            color: "#1d4ed8",
            fontSize: 12,
            fontWeight: 800,
          }}
        />
      </Stack>

      <Box
        sx={{
          mt: 2.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        <MetricSummary
          label={t("systemHealth.overallCheck")}
          value={latestOverall}
        />

        <MetricSummary
          label={t("systemHealth.databaseLatency")}
          value={latestDatabase}
        />

        <MetricSummary
          label={t("systemHealth.demoDataCheck")}
          value={latestDemoData}
        />
      </Box>

      <Box
        sx={{
          mt: 3,
          width: "100%",
          height: {
            xs: 300,
            md: 360,
          },
        }}
      >
        {hasData ? (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 20,
                left: 5,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#e2e8f0"
                vertical={false}
              />

              <XAxis
                dataKey="checkedAt"
                tick={{
                  fontSize: 11,
                  fill: "#64748b",
                }}
                tickLine={false}
                axisLine={{
                  stroke: "#cbd5e1",
                }}
                minTickGap={24}
              />

              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "#64748b",
                }}
                tickLine={false}
                axisLine={false}
                width={68}
                tickFormatter={(value) =>
                  `${formatNumber(
                    value,
                    0
                  )} ms`
                }
              />

              <Tooltip
                content={
                  <CustomTooltip />
                }
              />

              <Legend
                verticalAlign="top"
                align="right"
                height={42}
                iconType="circle"
                wrapperStyle={{
                  fontSize: 12,
                  color: "#475569",
                }}
              />

              <Line
                type="monotone"
                dataKey="overallMs"
                name={t("systemHealth.overallCheck")}
                stroke="#7c3aed"
                strokeWidth={3}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 5,
                }}
                connectNulls
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="databaseMs"
                name={t("systemHealth.databaseLatency")}
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 5,
                }}
                connectNulls
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="demoDataMs"
                name={t("systemHealth.demoData")}
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 5,
                }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border:
                "1px dashed #cbd5e1",
              borderRadius: "14px",
              bgcolor: "#f8fafc",
            }}
          >
            <TimelineIcon
              sx={{
                mb: 1,
                fontSize: 40,
                color: "#94a3b8",
              }}
            />

            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 800,
                color: "#334155",
              }}
            >
              {t("systemHealth.noPerformanceHistory")}
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                maxWidth: 420,
                px: 2,
                textAlign: "center",
                fontSize: 13,
                lineHeight: 1.6,
                color: "#64748b",
              }}
            >
              {t("systemHealth.noPerformanceHistoryDescription")}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
