import React, { useMemo } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PriorityHighRoundedIcon from "@mui/icons-material/PriorityHighRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

import useExecutiveActionAnalytics from "../../hooks/useExecutiveActionAnalytics";

const EMPTY_ANALYTICS = {
  total_actions: 0,
  completed_actions: 0,
  completion_rate: 0,
  average_days_to_close: 0,
  overdue_actions: 0,
  critical_actions: 0,
  priority_distribution: {},
  status_distribution: {},
  top_owners: [],
  top_kpi_categories: [],
};

function toNumber(value, fallback = 0) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function formatNumber(value, decimals = 0) {
  const number = toNumber(value);

  return number.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatLabel(value) {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeDistribution(distribution) {
  if (!distribution) {
    return [];
  }

  if (Array.isArray(distribution)) {
    return distribution.map((item, index) => ({
      label:
        item?.label ||
        item?.name ||
        item?.status ||
        item?.priority ||
        item?.category ||
        `Item ${index + 1}`,
      value: toNumber(item?.value ?? item?.count ?? item?.total),
    }));
  }

  if (typeof distribution === "object") {
    return Object.entries(distribution).map(([label, value]) => ({
      label,
      value: toNumber(
        typeof value === "object"
          ? value?.count ?? value?.value ?? value?.total
          : value
      ),
    }));
  }

  return [];
}

function normalizeRankedItems(items) {
  if (!items) {
    return [];
  }

  if (Array.isArray(items)) {
    return items.map((item, index) => {
      if (typeof item === "string" || typeof item === "number") {
        return {
          label: String(item),
          value: 0,
        };
      }

      return {
        label:
          item?.label ||
          item?.name ||
          item?.owner ||
          item?.category ||
          item?.kpi_category ||
          `Item ${index + 1}`,
        value: toNumber(
          item?.value ??
            item?.count ??
            item?.total_actions ??
            item?.action_count
        ),
      };
    });
  }

  if (typeof items === "object") {
    return Object.entries(items).map(([label, value]) => ({
      label,
      value: toNumber(
        typeof value === "object"
          ? value?.count ?? value?.value ?? value?.total
          : value
      ),
    }));
  }

  return [];
}

function getPriorityColor(priority) {
  const normalizedPriority = String(priority).toLowerCase();

  const colors = {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#d97706",
    low: "#16a34a",
  };

  return colors[normalizedPriority] || "#64748b";
}

function getStatusColor(status) {
  const normalizedStatus = String(status).toLowerCase();

  const colors = {
    completed: "#16a34a",
    in_progress: "#2563eb",
    blocked: "#dc2626",
    open: "#d97706",
  };

  return colors[normalizedStatus] || "#64748b";
}

function AnalyticsCard({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  loading,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ color: "#64748b", fontWeight: 600, mb: 1 }}
            >
              {title}
            </Typography>

            {loading ? (
              <Skeleton width={90} height={42} />
            ) : (
              <Typography
                variant="h4"
                sx={{ color: "#0f172a", fontWeight: 800, lineHeight: 1.1 }}
              >
                {value}
              </Typography>
            )}

            <Typography
              variant="caption"
              sx={{ color: "#94a3b8", display: "block", mt: 1 }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accentColor,
              backgroundColor: `${accentColor}14`,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DistributionPanel({
  title,
  subtitle,
  icon,
  items,
  colorResolver,
  emptyMessage,
}) {
  const total = items.reduce((sum, item) => sum + toNumber(item.value), 0);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            mb: 0.75,
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", color: "#475569" }}>{icon}</Box>

          <Typography
            variant="h6"
            sx={{ color: "#0f172a", fontWeight: 750 }}
          >
            {title}
          </Typography>
        </Stack>

        <Typography variant="body2" sx={{ color: "#64748b", mb: 2.5 }}>
          {subtitle}
        </Typography>

        <Divider sx={{ mb: 2.5 }} />

        {items.length === 0 ? (
          <Box
            sx={{
              minHeight: 150,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2.25}>
            {items.map((item) => {
              const percentage =
                total > 0 ? Math.round((item.value / total) * 100) : 0;

              const barColor = colorResolver?.(item.label) || "#2563eb";

              return (
                <Box key={item.label}>
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                      mb: 0.75,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "#334155", fontWeight: 600 }}
                    >
                      {formatLabel(item.label)}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#0f172a", fontWeight: 700 }}
                      >
                        {formatNumber(item.value)}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: "#94a3b8",
                          minWidth: 32,
                          textAlign: "right",
                        }}
                      >
                        {percentage}%
                      </Typography>
                    </Stack>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 7,
                      borderRadius: 10,
                      backgroundColor: "#f1f5f9",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 10,
                        backgroundColor: barColor,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function RankingPanel({ title, subtitle, icon, items, emptyMessage }) {
  const highestValue = Math.max(
    ...items.map((item) => toNumber(item.value)),
    0
  );

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            mb: 0.75,
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", color: "#475569" }}>{icon}</Box>

          <Typography
            variant="h6"
            sx={{ color: "#0f172a", fontWeight: 750 }}
          >
            {title}
          </Typography>
        </Stack>

        <Typography variant="body2" sx={{ color: "#64748b", mb: 2.5 }}>
          {subtitle}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {items.length === 0 ? (
          <Box
            sx={{
              minHeight: 150,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {items.slice(0, 5).map((item, index) => {
              const progressValue =
                highestValue > 0
                  ? Math.round((item.value / highestValue) * 100)
                  : 0;

              return (
                <Box
                  key={`${item.label}-${index}`}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    "&:hover": { backgroundColor: "#f8fafc" },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: "#475569",
                        backgroundColor: "#f1f5f9",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {index + 1}
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                          mb: 0.75,
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ color: "#334155", fontWeight: 600 }}
                        >
                          {formatLabel(item.label)}
                        </Typography>

                        <Chip
                          size="small"
                          label={formatNumber(item.value)}
                          sx={{
                            height: 23,
                            color: "#1e3a8a",
                            backgroundColor: "#dbeafe",
                            fontWeight: 700,
                          }}
                        />
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={progressValue}
                        sx={{
                          height: 5,
                          borderRadius: 10,
                          backgroundColor: "#f1f5f9",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 10,
                            backgroundColor: "#2563eb",
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function ExecutiveActionAnalytics({
  autoLoad = true,
  showHeader = true,
  onRefresh,
}) {
  const { analytics, loading, error, refreshAnalytics } =
    useExecutiveActionAnalytics({ autoLoad });

  const normalizedAnalytics = useMemo(
    () => ({
      ...EMPTY_ANALYTICS,
      ...(analytics || {}),
    }),
    [analytics]
  );

  const priorityDistribution = useMemo(
    () =>
      normalizeDistribution(normalizedAnalytics.priority_distribution),
    [normalizedAnalytics.priority_distribution]
  );

  const statusDistribution = useMemo(
    () => normalizeDistribution(normalizedAnalytics.status_distribution),
    [normalizedAnalytics.status_distribution]
  );

  const topOwners = useMemo(
    () => normalizeRankedItems(normalizedAnalytics.top_owners),
    [normalizedAnalytics.top_owners]
  );

  const topCategories = useMemo(
    () =>
      normalizeRankedItems(
        normalizedAnalytics.top_kpi_categories ||
          normalizedAnalytics.top_categories
      ),
    [
      normalizedAnalytics.top_kpi_categories,
      normalizedAnalytics.top_categories,
    ]
  );

  const totalActions = toNumber(normalizedAnalytics.total_actions);
  const completedActions = toNumber(normalizedAnalytics.completed_actions);

  const completionRate = toNumber(
    normalizedAnalytics.completion_rate,
    totalActions > 0 ? (completedActions / totalActions) * 100 : 0
  );

  const averageDaysToClose = toNumber(
    normalizedAnalytics.average_days_to_close
  );

  const overdueActions = toNumber(normalizedAnalytics.overdue_actions);
  const criticalActions = toNumber(normalizedAnalytics.critical_actions);

  const handleRefresh = async () => {
    try {
      const refreshedData = await refreshAnalytics();
      onRefresh?.(refreshedData);
    } catch {
      // Error state is already exposed by the hook.
    }
  };

  return (
    <Box>
      {showHeader && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            mb: 3,
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
          }}
        >
          <Box>
            <Stack
              direction="row"
              spacing={1.25}
              sx={{
                alignItems: "center",
              }}
            >
              <AssignmentRoundedIcon sx={{ color: "#2563eb" }} />

              <Typography
                variant="h5"
                sx={{ color: "#0f172a", fontWeight: 800 }}
              >
                Executive Action Analytics
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.75 }}>
              Management action performance, accountability, and completion
              insights.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshRoundedIcon />
              )
            }
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              borderColor: "#cbd5e1",
              color: "#334155",
            }}
          >
            {loading ? "Refreshing..." : "Refresh Analytics"}
          </Button>
        </Stack>
      )}

      {error && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRefresh}
              disabled={loading}
            >
              Retry
            </Button>
          }
          sx={{ mb: 3, borderRadius: 2.5 }}
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <AnalyticsCard
          title="Completion Rate"
          value={`${formatNumber(completionRate, 1)}%`}
          subtitle={`${formatNumber(completedActions)} of ${formatNumber(
            totalActions
          )} actions completed`}
          icon={<CheckCircleRoundedIcon />}
          accentColor="#16a34a"
          loading={loading && !analytics}
        />

        <AnalyticsCard
          title="Average Days to Close"
          value={formatNumber(averageDaysToClose, 1)}
          subtitle="Average action resolution time"
          icon={<ScheduleRoundedIcon />}
          accentColor="#2563eb"
          loading={loading && !analytics}
        />

        <AnalyticsCard
          title="Overdue Actions"
          value={formatNumber(overdueActions)}
          subtitle="Actions beyond their due date"
          icon={<WarningAmberRoundedIcon />}
          accentColor="#d97706"
          loading={loading && !analytics}
        />

        <AnalyticsCard
          title="Critical Actions"
          value={formatNumber(criticalActions)}
          subtitle="Actions requiring urgent attention"
          icon={<PriorityHighRoundedIcon />}
          accentColor="#dc2626"
          loading={loading && !analytics}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "repeat(2, minmax(0, 1fr))",
          },
          gap: 3,
          mb: 3,
        }}
      >
        <DistributionPanel
          title="Priority Distribution"
          subtitle="Current actions grouped by management priority."
          icon={<PriorityHighRoundedIcon />}
          items={priorityDistribution}
          colorResolver={getPriorityColor}
          emptyMessage="No priority analytics are available."
        />

        <DistributionPanel
          title="Status Distribution"
          subtitle="Current actions grouped by execution status."
          icon={<AssignmentRoundedIcon />}
          items={statusDistribution}
          colorResolver={getStatusColor}
          emptyMessage="No status analytics are available."
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "repeat(2, minmax(0, 1fr))",
          },
          gap: 3,
        }}
      >
        <RankingPanel
          title="Top Action Owners"
          subtitle="Owners with the highest number of assigned actions."
          icon={<GroupsRoundedIcon />}
          items={topOwners}
          emptyMessage="No owner analytics are available."
        />

        <RankingPanel
          title="Top KPI Categories"
          subtitle="Operational areas generating the most management actions."
          icon={<CategoryRoundedIcon />}
          items={topCategories}
          emptyMessage="No KPI category analytics are available."
        />
      </Box>
    </Box>
  );
}

export default ExecutiveActionAnalytics;
