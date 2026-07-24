import { memo, useMemo } from "react";

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from "@mui/material";

const DEFAULT_TREND_DATA = Object.freeze([
  { id: "d-6", label: "D-6", value: 82 },
  { id: "d-5", label: "D-5", value: 85 },
  { id: "d-4", label: "D-4", value: 84 },
  { id: "d-3", label: "D-3", value: 88 },
  { id: "d-2", label: "D-2", value: 87 },
  { id: "d-1", label: "D-1", value: 90 },
  { id: "today", label: "Today", value: 92 },
]);

function normalizeTrendData(data) {
  const sourceData = Array.isArray(data) ? data : DEFAULT_TREND_DATA;

  return sourceData.map((item, index) => {
    const rawValue =
      typeof item === "number"
        ? item
        : item?.value;

    const numericValue = Number(rawValue);

    const safeValue = Number.isFinite(numericValue)
      ? Math.min(100, Math.max(0, numericValue))
      : 0;

    return {
      id:
        typeof item === "object" && item?.id
          ? item.id
          : `trend-${index}`,
      label:
        typeof item === "object" && item?.label
          ? item.label
          : index === sourceData.length - 1
          ? "Today"
          : `D-${sourceData.length - index - 1}`,
      value: safeValue,
    };
  });
}

function TrendAnalyticsPanel({
  trendData = DEFAULT_TREND_DATA,
  title = "7-Day Mine Health Trend",
}) {
  const normalizedTrendData = useMemo(
    () => normalizeTrendData(trendData),
    [trendData]
  );

  const trendSummary = useMemo(() => {
    if (normalizedTrendData.length === 0) {
      return {
        firstValue: 0,
        latestValue: 0,
        change: 0,
        direction: "flat",
        description: "No trend data is currently available.",
      };
    }

    const firstValue = normalizedTrendData[0].value;
    const latestValue =
      normalizedTrendData[normalizedTrendData.length - 1].value;

    const change = latestValue - firstValue;

    if (change > 0) {
      return {
        firstValue,
        latestValue,
        change,
        direction: "up",
        description:
          "Mine performance is improving over the selected period.",
      };
    }

    if (change < 0) {
      return {
        firstValue,
        latestValue,
        change,
        direction: "down",
        description:
          "Mine performance has declined over the selected period.",
      };
    }

    return {
      firstValue,
      latestValue,
      change,
      direction: "flat",
      description:
        "Mine performance is stable over the selected period.",
    };
  }, [normalizedTrendData]);

  const chipColor =
    trendSummary.direction === "up"
      ? "success"
      : trendSummary.direction === "down"
      ? "error"
      : "default";

  const changeLabel =
    trendSummary.change > 0
      ? `+${trendSummary.change}`
      : `${trendSummary.change}`;

  return (
    <Card
      sx={{
        mb: 4,
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <CardContent
        sx={{
          p: 3,

          "&:last-child": {
            pb: 3,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            justifyContent: "space-between",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 1.5,
            mb: 1,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: "#0f172a",
                fontWeight: 800,
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: "#64748b",
              }}
            >
              {trendSummary.description}
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${changeLabel} pts`}
            color={chipColor}
            variant={
              trendSummary.direction === "flat"
                ? "outlined"
                : "filled"
            }
            sx={{
              flexShrink: 0,
              fontWeight: 800,
            }}
          />
        </Box>

        {normalizedTrendData.length > 0 ? (
          <>
            <Box
              role="img"
              aria-label={`${title}. Latest value ${trendSummary.latestValue}. Change ${changeLabel} points.`}
              sx={{
                display: "flex",
                alignItems: "flex-end",
                gap: {
                  xs: 0.6,
                  sm: 1,
                },
                height: 160,
                mt: 3,
              }}
            >
              {normalizedTrendData.map((item) => (
                <Box
                  key={item.id}
                  title={`${item.label}: ${item.value}`}
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    flex: 1,
                    minWidth: 0,
                    height: `${item.value}%`,
                    minHeight: item.value > 0 ? 24 : 0,
                    pb: 1,
                    overflow: "hidden",
                    borderRadius: "10px 10px 4px 4px",
                    color: "#ffffff",
                    fontSize: {
                      xs: 10,
                      sm: 12,
                    },
                    fontWeight: 800,
                    background:
                      "linear-gradient(180deg, #2563eb, #93c5fd)",
                    transition:
                      "height 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms ease",

                    "&:hover": {
                      transform: "translateY(-3px)",
                    },

                    "@media (prefers-reduced-motion: reduce)": {
                      transition: "none",

                      "&:hover": {
                        transform: "none",
                      },
                    },
                  }}
                >
                  {item.value}
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${normalizedTrendData.length}, minmax(0, 1fr))`,
                gap: {
                  xs: 0.6,
                  sm: 1,
                },
                mt: 1,
              }}
            >
              {normalizedTrendData.map((item) => (
                <Typography
                  key={`${item.id}-label`}
                  variant="caption"
                  sx={{
                    minWidth: 0,
                    overflow: "hidden",
                    color: "#64748b",
                    fontWeight: 600,
                    textAlign: "center",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
          </>
        ) : (
          <Box
            role="status"
            sx={{
              px: 2,
              py: 5,
              mt: 3,
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed #cbd5e1",
              backgroundColor: "#f8fafc",
            }}
          >
            <Typography
              sx={{
                color: "#475569",
                fontWeight: 700,
              }}
            >
              No trend data available
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: "#94a3b8",
              }}
            >
              Mine health history will appear when data is available.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function areTrendAnalyticsPanelPropsEqual(
  previousProps,
  nextProps
) {
  return (
    previousProps.trendData === nextProps.trendData &&
    previousProps.title === nextProps.title
  );
}

export default memo(
  TrendAnalyticsPanel,
  areTrendAnalyticsPanelPropsEqual
);