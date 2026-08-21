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
import { useLanguage } from "../../context/LanguageContext";

import {
  translateDynamicExecutiveActionAnalyticsLabel,
  translateDynamicExecutiveActionOwner,
  translateDynamicKpiName,
} from "../../i18n/dynamicTranslations";


const EMPTY_ANALYTICS = {
  completion_rate: 0,
  average_days_to_close: 0,
  overdue_percentage: 0,
  active_actions: 0,
  critical_actions: 0,
  blocked_actions: 0,

  actions_by_priority: {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  },

  actions_by_status: {
    open: 0,
    in_progress: 0,
    completed: 0,
    blocked: 0,
  },

  top_owners: [],
  top_kpis: [],
};


function toNumber(value, fallback = 0) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
}


function formatNumber(value, decimals = 0) {
  const number = toNumber(value);

  return number.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}


function normalizeLabel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replace(/\s+/g, "_");
}


function formatFallbackLabel(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}


function translateAnalyticsLabel(
  value,
  t
) {
  const normalized =
    normalizeLabel(value);

  const labelMap = {
    critical:
      "executiveActionAnalytics.priorityCritical",

    high:
      "executiveActionAnalytics.priorityHigh",

    medium:
      "executiveActionAnalytics.priorityMedium",

    low:
      "executiveActionAnalytics.priorityLow",

    open:
      "executiveActionAnalytics.statusOpen",

    in_progress:
      "executiveActionAnalytics.statusInProgress",

    completed:
      "executiveActionAnalytics.statusCompleted",

    blocked:
      "executiveActionAnalytics.statusBlocked",
  };

  const translationKey =
    labelMap[normalized];

  if (translationKey) {
    return t(translationKey);
  }

  const dynamicLabel =
    translateDynamicExecutiveActionAnalyticsLabel(
      value,
      t,
    );

  if (
    dynamicLabel &&
    dynamicLabel !== value
  ) {
    return dynamicLabel;
  }

  return (
    formatFallbackLabel(value) ||
    t(
      "executiveActionAnalytics.unknown"
    )
  );
}


function translateKpiRankingLabel(
  item,
  t
) {
  const rawKpiKey = String(
    item?.kpiKey || ""
  ).trim();

  if (rawKpiKey) {
    const translatedKey =
      translateDynamicKpiName(
        rawKpiKey,
        t
      );

    if (
      translatedKey &&
      translatedKey !== rawKpiKey
    ) {
      return translatedKey;
    }
  }

  return translateDynamicExecutiveActionAnalyticsLabel(
    item?.label,
    t
  );
}


function translateTemplate(
  t,
  key,
  variables = {}
) {
  let text = t(key);

  Object.entries(variables).forEach(
    ([name, value]) => {
      text = String(text).replaceAll(
        `{${name}}`,
        String(value ?? "")
      );
    }
  );

  return text;
}


function normalizeDistribution(
  distribution
) {
  if (!distribution) {
    return [];
  }

  if (Array.isArray(distribution)) {
    return distribution.map(
      (item, index) => ({
        label:
          item?.label ||
          item?.name ||
          item?.status ||
          item?.priority ||
          item?.category ||
          `Item ${index + 1}`,

        value: toNumber(
          item?.value ??
            item?.count ??
            item?.total
        ),
      })
    );
  }

  if (
    typeof distribution === "object"
  ) {
    return Object.entries(
      distribution
    ).map(([label, value]) => ({
      label,

      value: toNumber(
        typeof value === "object"
          ? value?.count ??
              value?.value ??
              value?.total
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
    return items.map(
      (item, index) => {
        if (
          typeof item === "string" ||
          typeof item === "number"
        ) {
          return {
            label: String(item),
            value: 0,
            kpiKey: null,
            activeCount: 0,
          };
        }

        return {
          label:
            item?.label ||
            item?.name ||
            item?.kpi_name ||
            item?.kpi_label ||
            item?.kpi_key ||
            item?.kpi_category ||
            item?.category ||
            item?.owner ||
            `Item ${index + 1}`,

          value: toNumber(
            item?.value ??
              item?.count ??
              item?.active_count ??
              item?.total_actions ??
              item?.action_count
          ),

          kpiKey:
            item?.kpi_key ||
            item?.key ||
            null,

          activeCount: toNumber(
            item?.active_count
          ),
        };
      }
    );
  }

  if (typeof items === "object") {
    return Object.entries(items).map(
      ([label, value]) => ({
        label:
          typeof value === "object"
            ? value?.label ||
              value?.name ||
              value?.kpi_name ||
              value?.kpi_label ||
              value?.kpi_key ||
              value?.kpi_category ||
              label
            : label,

        value: toNumber(
          typeof value === "object"
            ? value?.count ??
                value?.value ??
                value?.active_count ??
                value?.total ??
                value?.total_actions ??
                value?.action_count
            : value
        ),

        kpiKey:
          typeof value === "object"
            ? value?.kpi_key ||
              value?.key ||
              null
            : null,

        activeCount:
          typeof value === "object"
            ? toNumber(
                value?.active_count
              )
            : 0,
      }));
  }

  return [];
}


function getPriorityColor(priority) {
  const normalizedPriority =
    String(priority)
      .trim()
      .toLowerCase()
      .replaceAll(" ", "_");

  const colors = {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#d97706",
    low: "#16a34a",
  };

  return (
    colors[normalizedPriority] ||
    "#64748b"
  );
}


function getStatusColor(status) {
  const normalizedStatus =
    String(status)
      .trim()
      .toLowerCase()
      .replaceAll(" ", "_")
      .replaceAll("-", "_");

  const colors = {
    completed: "#16a34a",
    in_progress: "#2563eb",
    blocked: "#dc2626",
    open: "#d97706",
  };

  return (
    colors[normalizedStatus] ||
    "#64748b"
  );
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
        border:
          "1px solid #e2e8f0",
        backgroundColor: "#ffffff",

        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",

        "&:hover": {
          transform:
            "translateY(-2px)",

          borderColor:
            "#cbd5e1",

          boxShadow:
            "0 12px 28px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <CardContent
        sx={{
          p: 2.5,

          "&:last-child": {
            pb: 2.5,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems:
              "flex-start",

            justifyContent:
              "space-between",
          }}
        >
          <Box
            sx={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                fontWeight: 700,
                mb: 1,
                lineHeight: 1.35,
              }}
            >
              {title}
            </Typography>

            {loading ? (
              <Skeleton
                width={90}
                height={42}
              />
            ) : (
              <Typography
                variant="h4"
                sx={{
                  color: "#0f172a",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing:
                    "-0.02em",
                }}
              >
                {value}
              </Typography>
            )}

            <Typography
              variant="caption"
              sx={{
                color: "#94a3b8",
                display: "block",
                mt: 1,
                lineHeight: 1.45,
              }}
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
              justifyContent:
                "center",

              color: accentColor,

              backgroundColor:
                `${accentColor}14`,
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
  t,
}) {
  const total = items.reduce(
    (sum, item) =>
      sum + toNumber(item.value),
    0
  );

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border:
          "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
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
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            mb: 0.75,
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              color: "#475569",
            }}
          >
            {icon}
          </Box>

          <Typography
            variant="h6"
            sx={{
              color: "#0f172a",
              fontWeight: 750,
              letterSpacing:
                "-0.01em",
            }}
          >
            {title}
          </Typography>
        </Stack>

        <Typography
          variant="body2"
          sx={{
            color: "#64748b",
            mb: 2.5,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </Typography>

        <Divider sx={{ mb: 2.5 }} />

        {items.length === 0 ? (
          <Box
            sx={{
              minHeight: 150,
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              textAlign: "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#94a3b8",
              }}
            >
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2.25}>
            {items.map((item) => {
              const percentage =
                total > 0
                  ? Math.round(
                      (
                        item.value /
                        total
                      ) * 100
                    )
                  : 0;

              const barColor =
                colorResolver?.(
                  item.label
                ) || "#2563eb";

              return (
                <Box
                  key={item.label}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                      mb: 0.75,

                      alignItems:
                        "center",

                      justifyContent:
                        "space-between",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          "#334155",

                        fontWeight:
                          650,
                      }}
                    >
                      {translateAnalyticsLabel(
                        item.label,
                        t
                      )}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems:
                          "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            "#0f172a",

                          fontWeight:
                            700,
                        }}
                      >
                        {formatNumber(
                          item.value
                        )}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            "#94a3b8",

                          minWidth: 32,

                          textAlign:
                            "right",
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

                      borderRadius:
                        10,

                      backgroundColor:
                        "#f1f5f9",

                      "& .MuiLinearProgress-bar":
                        {
                          borderRadius:
                            10,

                          backgroundColor:
                            barColor,
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


function RankingPanel({
  title,
  subtitle,
  icon,
  items,
  emptyMessage,
  t,
  labelTranslator,
  itemLabelTranslator,
}) {
  const highestValue = Math.max(
    ...items.map((item) =>
      toNumber(item.value)
    ),
    0
  );

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,

        border:
          "1px solid #e2e8f0",

        backgroundColor:
          "#ffffff",
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
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            mb: 0.75,
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              color: "#475569",
            }}
          >
            {icon}
          </Box>

          <Typography
            variant="h6"
            sx={{
              color: "#0f172a",
              fontWeight: 750,

              letterSpacing:
                "-0.01em",
            }}
          >
            {title}
          </Typography>
        </Stack>

        <Typography
          variant="body2"
          sx={{
            color: "#64748b",
            mb: 2.5,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {items.length === 0 ? (
          <Box
            sx={{
              minHeight: 150,

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              textAlign:
                "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#94a3b8",
              }}
            >
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {items
              .slice(0, 5)
              .map(
                (
                  item,
                  index
                ) => {
                  const progressValue =
                    highestValue >
                    0
                      ? Math.round(
                          (
                            item.value /
                            highestValue
                          ) * 100
                        )
                      : 0;

                  return (
                    <Box
                      key={`${item.label}-${index}`}
                      sx={{
                        p: 1.5,

                        borderRadius:
                          2,

                        transition:
                          "background-color 160ms ease",

                        "&:hover":
                          {
                            backgroundColor:
                              "#f8fafc",
                          },
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{
                          alignItems:
                            "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,

                            borderRadius:
                              "50%",

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            flexShrink:
                              0,

                            color:
                              "#475569",

                            backgroundColor:
                              "#f1f5f9",

                            fontSize:
                              13,

                            fontWeight:
                              800,
                          }}
                        >
                          {index +
                            1}
                        </Box>

                        <Box
                          sx={{
                            minWidth:
                              0,

                            flex: 1,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={2}
                            sx={{
                              mb: 0.75,

                              justifyContent:
                                "space-between",
                            }}
                          >
                            <Typography
                              variant="body2"
                              noWrap
                              title={
                                itemLabelTranslator
                                  ? itemLabelTranslator(
                                      item,
                                      t,
                                    )
                                  : labelTranslator
                                    ? labelTranslator(
                                        item.label,
                                        t,
                                      )
                                    : translateAnalyticsLabel(
                                        item.label,
                                        t,
                                      )
                              }
                              sx={{
                                color:
                                  "#334155",

                                fontWeight:
                                  600,
                              }}
                            >
                              {itemLabelTranslator
                                ? itemLabelTranslator(
                                    item,
                                    t,
                                  )
                                : labelTranslator
                                  ? labelTranslator(
                                      item.label,
                                      t,
                                    )
                                  : translateAnalyticsLabel(
                                      item.label,
                                      t,
                                    )}
                            </Typography>

                            <Chip
                              size="small"
                              label={formatNumber(
                                item.value
                              )}
                              sx={{
                                height:
                                  23,

                                color:
                                  "#1e3a8a",

                                backgroundColor:
                                  "#dbeafe",

                                fontWeight:
                                  700,
                              }}
                            />
                          </Stack>

                          <LinearProgress
                            variant="determinate"
                            value={
                              progressValue
                            }
                            sx={{
                              height:
                                5,

                              borderRadius:
                                10,

                              backgroundColor:
                                "#f1f5f9",

                              "& .MuiLinearProgress-bar":
                                {
                                  borderRadius:
                                    10,

                                  backgroundColor:
                                    "#2563eb",
                                },
                            }}
                          />
                        </Box>
                      </Stack>
                    </Box>
                  );
                }
              )}
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
  const { t } = useLanguage();

  const {
    analytics,
    loading,
    error,
    refreshAnalytics,
  } =
    useExecutiveActionAnalytics({
      autoLoad,
    });

  const normalizedAnalytics =
    useMemo(
      () => ({
        ...EMPTY_ANALYTICS,
        ...(analytics || {}),
      }),
      [analytics]
    );

  const actionsByPriority =
    normalizedAnalytics
      .actions_by_priority || {};

  const actionsByStatus =
    normalizedAnalytics
      .actions_by_status || {};

  const priorityDistribution =
    useMemo(
      () =>
        normalizeDistribution(
          actionsByPriority
        ),
      [actionsByPriority]
    );

  const statusDistribution =
    useMemo(
      () =>
        normalizeDistribution(
          actionsByStatus
        ),
      [actionsByStatus]
    );

  const topOwners = useMemo(
    () =>
      normalizeRankedItems(
        normalizedAnalytics.top_owners
      ),
    [
      normalizedAnalytics.top_owners,
    ]
  );

  const topCategories = useMemo(
    () =>
      normalizeRankedItems(
        normalizedAnalytics.top_kpis
      ),
    [
      normalizedAnalytics.top_kpis,
    ]
  );

  const openActions =
    toNumber(
      actionsByStatus.open
    );

  const inProgressActions =
    toNumber(
      actionsByStatus.in_progress
    );

  const completedActions =
    toNumber(
      actionsByStatus.completed
    );

  const blockedActions =
    toNumber(
      actionsByStatus.blocked
    );

  const totalActions =
    openActions +
    inProgressActions +
    completedActions +
    blockedActions;

  const completionRate =
    toNumber(
      normalizedAnalytics
        .completion_rate,

      totalActions > 0
        ? (
            completedActions /
            totalActions
          ) * 100
        : 0
    );

  const averageDaysToClose =
    toNumber(
      normalizedAnalytics
        .average_days_to_close
    );

  const criticalActions =
    toNumber(
      normalizedAnalytics
        .critical_actions
    );

  const activeActions =
    toNumber(
      normalizedAnalytics
        .active_actions
    );

  const overduePercentage =
    toNumber(
      normalizedAnalytics
        .overdue_percentage
    );

  /*
   * The current backend analytics response exposes
   * overdue_percentage rather than the raw overdue
   * action count.
   *
   * Recover the display count from:
   *
   * overdue_percentage =
   * overdue_actions / active_actions * 100
   */
  const overdueActions =
    activeActions > 0
      ? Math.round(
          (
            overduePercentage /
            100
          ) * activeActions
        )
      : 0;


  const handleRefresh =
    async () => {
      try {
        const refreshedData =
          await refreshAnalytics();

        onRefresh?.(
          refreshedData
        );
      } catch {
        /*
         * Error state is already
         * exposed by the hook.
         */
      }
    };


  const completionSubtitle =
    translateTemplate(
      t,
      "executiveActionAnalytics.completionSubtitle",
      {
        completed:
          formatNumber(
            completedActions
          ),

        total:
          formatNumber(
            totalActions
          ),
      }
    );


  return (
    <Box>
      {showHeader && (
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
          sx={{
            mb: 3,

            justifyContent:
              "space-between",

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
                alignItems:
                  "center",
              }}
            >
              <AssignmentRoundedIcon
                sx={{
                  color:
                    "#2563eb",
                }}
              />

              <Typography
                variant="h5"
                sx={{
                  color:
                    "#0f172a",

                  fontWeight:
                    800,

                  letterSpacing:
                    "-0.02em",
                }}
              >
                {t(
                  "executiveActionAnalytics.title"
                )}
              </Typography>
            </Stack>

            <Typography
              variant="body2"
              sx={{
                color:
                  "#64748b",

                mt: 0.75,

                maxWidth:
                  720,

                lineHeight:
                  1.5,
              }}
            >
              {t(
                "executiveActionAnalytics.subtitle"
              )}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={
              loading ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : (
                <RefreshRoundedIcon />
              )
            }
            onClick={
              handleRefresh
            }
            disabled={loading}
            sx={{
              borderRadius: 2,

              textTransform:
                "none",

              fontWeight: 700,

              borderColor:
                "#cbd5e1",

              color:
                "#334155",

              minHeight: 40,

              px: 2,

              "&:hover": {
                borderColor:
                  "#94a3b8",

                backgroundColor:
                  "#f8fafc",
              },
            }}
          >
            {loading
              ? t(
                  "executiveActionAnalytics.refreshing"
                )
              : t(
                  "executiveActionAnalytics.refreshAnalytics"
                )}
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
              onClick={
                handleRefresh
              }
              disabled={loading}
              sx={{
                textTransform:
                  "none",

                fontWeight:
                  700,
              }}
            >
              {t(
                "executiveActionAnalytics.retry"
              )}
            </Button>
          }
          sx={{
            mb: 3,
            borderRadius: 2.5,
          }}
        >
          {error}
        </Alert>
      )}


      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            sm:
              "repeat(2, minmax(0, 1fr))",

            lg:
              "repeat(4, minmax(0, 1fr))",
          },

          gap: 2,
          mb: 3,
        }}
      >
        <AnalyticsCard
          title={t(
            "executiveActionAnalytics.completionRate"
          )}
          value={`${formatNumber(
            completionRate,
            1
          )}%`}
          subtitle={
            completionSubtitle
          }
          icon={
            <CheckCircleRoundedIcon />
          }
          accentColor="#16a34a"
          loading={
            loading &&
            !analytics
          }
        />

        <AnalyticsCard
          title={t(
            "executiveActionAnalytics.averageDaysToClose"
          )}
          value={formatNumber(
            averageDaysToClose,
            1
          )}
          subtitle={t(
            "executiveActionAnalytics.averageResolutionTime"
          )}
          icon={
            <ScheduleRoundedIcon />
          }
          accentColor="#2563eb"
          loading={
            loading &&
            !analytics
          }
        />

        <AnalyticsCard
          title={t(
            "executiveActionAnalytics.overdueActions"
          )}
          value={formatNumber(
            overdueActions
          )}
          subtitle={t(
            "executiveActionAnalytics.overdueActionsSubtitle"
          )}
          icon={
            <WarningAmberRoundedIcon />
          }
          accentColor="#d97706"
          loading={
            loading &&
            !analytics
          }
        />

        <AnalyticsCard
          title={t(
            "executiveActionAnalytics.criticalActions"
          )}
          value={formatNumber(
            criticalActions
          )}
          subtitle={t(
            "executiveActionAnalytics.criticalActionsSubtitle"
          )}
          icon={
            <PriorityHighRoundedIcon />
          }
          accentColor="#dc2626"
          loading={
            loading &&
            !analytics
          }
        />
      </Box>


      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            lg:
              "repeat(2, minmax(0, 1fr))",
          },

          gap: 3,
          mb: 3,
        }}
      >
        <DistributionPanel
          title={t(
            "executiveActionAnalytics.priorityDistribution"
          )}
          subtitle={t(
            "executiveActionAnalytics.priorityDistributionSubtitle"
          )}
          icon={
            <PriorityHighRoundedIcon />
          }
          items={
            priorityDistribution
          }
          colorResolver={
            getPriorityColor
          }
          emptyMessage={t(
            "executiveActionAnalytics.noPriorityAnalytics"
          )}
          t={t}
        />

        <DistributionPanel
          title={t(
            "executiveActionAnalytics.statusDistribution"
          )}
          subtitle={t(
            "executiveActionAnalytics.statusDistributionSubtitle"
          )}
          icon={
            <AssignmentRoundedIcon />
          }
          items={
            statusDistribution
          }
          colorResolver={
            getStatusColor
          }
          emptyMessage={t(
            "executiveActionAnalytics.noStatusAnalytics"
          )}
          t={t}
        />
      </Box>


      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            lg:
              "repeat(2, minmax(0, 1fr))",
          },

          gap: 3,
        }}
      >
        <RankingPanel
          title={t(
            "executiveActionAnalytics.topActionOwners"
          )}
          subtitle={t(
            "executiveActionAnalytics.topActionOwnersSubtitle"
          )}
          icon={
            <GroupsRoundedIcon />
          }
          items={
            topOwners
          }
          emptyMessage={t(
            "executiveActionAnalytics.noOwnerAnalytics"
          )}
          t={t}
          labelTranslator={
            translateDynamicExecutiveActionOwner
          }
        />

        <RankingPanel
          title={t(
            "executiveActionAnalytics.topKpiCategories"
          )}
          subtitle={t(
            "executiveActionAnalytics.topKpiCategoriesSubtitle"
          )}
          icon={
            <CategoryRoundedIcon />
          }
          items={
            topCategories
          }
          emptyMessage={t(
            "executiveActionAnalytics.noKpiCategoryAnalytics"
          )}
          t={t}
          itemLabelTranslator={
            translateKpiRankingLabel
          }
        />
      </Box>
    </Box>
  );
}


export default ExecutiveActionAnalytics;