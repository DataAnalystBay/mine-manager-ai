import React, { useEffect, useMemo, useState } from "react";
import "./ExecutiveActionKpiContext.css";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ClearIcon from "@mui/icons-material/Clear";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import EngineeringIcon from "@mui/icons-material/Engineering";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LinkOffRoundedIcon from "@mui/icons-material/LinkOffRounded";

import {
  getExecutiveActionKpiContext,
} from "../../api/executiveKpiContextApi";

function formatKpiName(value) {
  if (!value) {
    return "Linked KPI";
  }

  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatus(value) {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function toFiniteNumber(value, fallback = 0) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function formatMetricValue(value, unit = "") {
  const numericValue = toFiniteNumber(value);
  const hasDecimals = !Number.isInteger(numericValue);

  return `${numericValue.toLocaleString(undefined, {
    minimumFractionDigits: hasDecimals ? 1 : 0,
    maximumFractionDigits: 2,
  })}${unit}`;
}

function getStatusConfiguration(status, variance) {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");

  if (
    normalizedStatus === "above_target" ||
    normalizedStatus === "on_target" ||
    normalizedStatus === "healthy" ||
    normalizedStatus === "good"
  ) {
    return {
      label: formatStatus(status),
      color: "#16a34a",
      isPositive: true,
    };
  }

  if (
    normalizedStatus === "below_target" ||
    normalizedStatus === "critical" ||
    normalizedStatus === "poor"
  ) {
    return {
      label: formatStatus(status),
      color: "#dc2626",
      isPositive: false,
    };
  }

  if (
    normalizedStatus === "warning" ||
    normalizedStatus === "at_risk" ||
    normalizedStatus === "watch"
  ) {
    return {
      label: formatStatus(status),
      color: "#d97706",
      isPositive: variance >= 0,
    };
  }

  return {
    label: variance >= 0 ? "On Target" : "Below Target",
    color: variance >= 0 ? "#16a34a" : "#dc2626",
    isPositive: variance >= 0,
  };
}

export default function ExecutiveActionKpiContext({
  actionId,
  actions = [],
  primaryColor = "#16a34a",
  onBack,
  onClear,
}) {
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(Boolean(actionId));
  const [error, setError] = useState("");

  const loadKpiContext = async (signal) => {
    if (!actionId) {
      setResponseData(null);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getExecutiveActionKpiContext(actionId, {
        signal,
      });

      setResponseData(response);
    } catch (requestError) {
      if (
        requestError?.name === "CanceledError" ||
        requestError?.name === "AbortError" ||
        requestError?.originalError?.code === "ERR_CANCELED"
      ) {
        return;
      }

      setError(
        requestError?.message ||
          "Unable to load live KPI context for this executive action."
      );
      setResponseData(null);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    loadKpiContext(controller.signal);

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionId]);

  const context = responseData?.context || null;
  const isLinked = Boolean(responseData?.linked && context);

  const normalizedContext = useMemo(() => {
    if (!context) {
      return null;
    }

    const currentValue = toFiniteNumber(context.current_value);
    const targetValue = toFiniteNumber(context.target_value);
    const variance = currentValue - targetValue;
    const unit = context.unit || "";

    return {
      kpiKey: context.kpi_key || "",
      name:
        context.kpi_name ||
        context.name ||
        formatKpiName(context.kpi_key),
      currentValue,
      targetValue,
      variance,
      unit,
      status: context.status || "",
      rootCause:
        context.root_cause ||
        context.rootCause ||
        "Root-cause analysis is not available for this KPI context yet.",
      relatedActions:
        context.related_actions || {
          total: 0,
          active: 0,
          completed: 0,
          actions: [],
        },
    };
  }, [context]);

  const statusConfiguration = useMemo(() => {
    if (!normalizedContext) {
      return {
        label: "Unknown",
        color: "#64748b",
        isPositive: false,
      };
    }

    return getStatusConfiguration(
      normalizedContext.status,
      normalizedContext.variance
    );
  }, [normalizedContext]);

  const trendIcon = statusConfiguration.isPositive ? (
    <TrendingUpIcon />
  ) : (
    <TrendingDownIcon />
  );

  const handleRefresh = () => {
    loadKpiContext();
  };

  if (!actionId) {
    return null;
  }

  if (loading) {
    return (
      <Box
        className="executive-kpi-context"
        sx={{
          mb: 3,
          borderRadius: 4,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            background: `${primaryColor}10`,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Skeleton width={110} height={20} />
          <Skeleton width={220} height={34} />
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={3}
          >
            {[1, 2, 3, 4].map((item) => (
              <Box key={item} sx={{ flex: 1 }}>
                <Skeleton width={90} height={18} />
                <Skeleton width={110} height={44} />
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <CircularProgress size={20} sx={{ color: primaryColor }} />

            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Loading live KPI context...
            </Typography>
          </Stack>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<RefreshRoundedIcon />}
            onClick={handleRefresh}
            sx={{
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Retry
          </Button>
        }
        sx={{
          mb: 3,
          borderRadius: 3,
          alignItems: "center",
        }}
      >
        {error}
      </Alert>
    );
  }

  if (!isLinked || !normalizedContext) {
    return (
      <Alert
        severity="info"
        icon={<LinkOffRoundedIcon />}
        sx={{
          mb: 3,
          borderRadius: 3,
          alignItems: "center",
        }}
      >
        {responseData?.message ||
          "No KPI is linked to this executive action."}
      </Alert>
    );
  }

  return (
    <Box
      className="executive-kpi-context"
      sx={{
        mb: 3,
        borderRadius: 4,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          background: `${primaryColor}10`,
          px: 3,
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            LIVE KPI CONTEXT
          </Typography>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            {normalizedContext.name}
          </Typography>
        </Box>

        <Chip
          icon={trendIcon}
          label={statusConfiguration.label}
          sx={{
            bgcolor: `${statusConfiguration.color}15`,
            color: statusConfiguration.color,
            fontWeight: 700,

            "& .MuiChip-icon": {
              color: statusConfiguration.color,
            },
          }}
        />
      </Box>

      <Box sx={{ p: 3 }}>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={3}
        >
          <Box sx={{ flex: 1 }}>
            <Typography className="context-label">
              Current Value
            </Typography>

            <Typography className="context-value">
              {formatMetricValue(
                normalizedContext.currentValue,
                normalizedContext.unit
              )}
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography className="context-label">
              Target
            </Typography>

            <Typography className="context-value">
              {formatMetricValue(
                normalizedContext.targetValue,
                normalizedContext.unit
              )}
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography className="context-label">
              Variance
            </Typography>

            <Typography
              className="context-value"
              sx={{
                color: statusConfiguration.color,
              }}
            >
              {normalizedContext.variance > 0 ? "+" : ""}
              {formatMetricValue(
                normalizedContext.variance,
                normalizedContext.unit
              )}
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography className="context-label">
              Related Actions
            </Typography>

            <Typography className="context-value">
              {normalizedContext.relatedActions.active}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "flex-start",
          }}
        >
          <EngineeringIcon
            sx={{
              color: primaryColor,
              mt: 0.4,
            }}
          />

          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              Primary Root Cause
            </Typography>

            <Typography color="text.secondary">
              {normalizedContext.rootCause}
            </Typography>
          </Box>
        </Box>

        {(
          onBack ||
          onClear ||
          normalizedContext.relatedActions.total > 0
        ) && (
          <>
            <Divider sx={{ my: 3 }} />

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
            >
              {onBack && (
                <Button
                  variant="contained"
                  startIcon={<ArrowBackIcon />}
                  onClick={onBack}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: primaryColor,

                    "&:hover": {
                      bgcolor: primaryColor,
                      opacity: 0.9,
                    },
                  }}
                >
                  Back to KPI Dashboard
                </Button>
              )}

              {onClear && (
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={onClear}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  Clear KPI Filter
                </Button>
              )}

              {normalizedContext.relatedActions.total > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<AssignmentTurnedInIcon />}
                  disabled
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    ml: {
                      sm: "auto",
                    },
                  }}
                >
                  {normalizedContext.relatedActions.total} Related Actions
                </Button>
              )}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}
