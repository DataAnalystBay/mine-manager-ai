import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

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

import {
  useLanguage,
} from "../../context/LanguageContext";

import {
  translateDynamicExecutiveText,
  translateDynamicKpiName,
  translateDynamicStatus,
} from "../../i18n/dynamicTranslations";


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


function formatKpiName(
  value,
  t
) {
  if (!value) {
    return t(
      "executiveActionKpiContext.linkedKpi"
    );
  }

  const formatted =
    String(value)
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase()
      );

  return translateDynamicKpiName(
    formatted,
    t
  );
}


function formatStatus(
  value,
  t
) {
  if (!value) {
    return t(
      "executiveActionKpiContext.unknown"
    );
  }

  const formatted =
    String(value)
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase()
      );

  return translateDynamicStatus(
    formatted,
    t
  );
}


function toFiniteNumber(
  value,
  fallback = 0
) {
  const parsedValue =
    Number(value);

  return Number.isFinite(
    parsedValue
  )
    ? parsedValue
    : fallback;
}


function formatMetricValue(
  value,
  unit = ""
) {
  const numericValue =
    toFiniteNumber(value);

  const hasDecimals =
    !Number.isInteger(
      numericValue
    );

  return `${numericValue.toLocaleString(
    undefined,
    {
      minimumFractionDigits:
        hasDecimals ? 1 : 0,

      maximumFractionDigits:
        2,
    }
  )}${unit}`;
}


function getStatusConfiguration(
  status,
  variance,
  t
) {
  const normalizedStatus =
    String(status || "")
      .trim()
      .toLowerCase()
      .replaceAll(" ", "_")
      .replaceAll("-", "_");

  if (
    normalizedStatus ===
      "above_target" ||
    normalizedStatus ===
      "on_target" ||
    normalizedStatus ===
      "healthy" ||
    normalizedStatus ===
      "good"
  ) {
    return {
      label: formatStatus(
        status,
        t
      ),

      color: "#16a34a",
      isPositive: true,
    };
  }

  if (
    normalizedStatus ===
      "below_target" ||
    normalizedStatus ===
      "critical" ||
    normalizedStatus ===
      "poor"
  ) {
    return {
      label: formatStatus(
        status,
        t
      ),

      color: "#dc2626",
      isPositive: false,
    };
  }

  if (
    normalizedStatus ===
      "warning" ||
    normalizedStatus ===
      "at_risk" ||
    normalizedStatus ===
      "watch"
  ) {
    return {
      label: formatStatus(
        status,
        t
      ),

      color: "#d97706",

      isPositive:
        variance >= 0,
    };
  }

  return {
    label:
      variance >= 0
        ? t(
            "executiveActionKpiContext.onTarget"
          )
        : t(
            "executiveActionKpiContext.belowTarget"
          ),

    color:
      variance >= 0
        ? "#16a34a"
        : "#dc2626",

    isPositive:
      variance >= 0,
  };
}


export default function ExecutiveActionKpiContext({
  actionId,
  actions = [],
  primaryColor = "#16a34a",
  onBack,
  onClear,
}) {
  const { t } = useLanguage();

  const [
    responseData,
    setResponseData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(
    Boolean(actionId)
  );

  const [
    error,
    setError,
  ] = useState("");


  const loadKpiContext =
    async (signal) => {
      if (!actionId) {
        setResponseData(null);
        setLoading(false);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await getExecutiveActionKpiContext(
            actionId,
            {
              signal,
            }
          );

        setResponseData(
          response
        );
      } catch (
        requestError
      ) {
        if (
          requestError?.name ===
            "CanceledError" ||
          requestError?.name ===
            "AbortError" ||
          requestError
            ?.originalError
            ?.code ===
            "ERR_CANCELED"
        ) {
          return;
        }

        setError(
          requestError
            ?.message ||
            t(
              "executiveActionKpiContext.loadError"
            )
        );

        setResponseData(
          null
        );
      } finally {
        if (
          !signal?.aborted
        ) {
          setLoading(
            false
          );
        }
      }
    };


  useEffect(() => {
    const controller =
      new AbortController();

    loadKpiContext(
      controller.signal
    );

    return () => {
      controller.abort();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionId]);


  const context =
    responseData?.context ||
    null;


  const isLinked =
    Boolean(
      responseData?.linked &&
        context
    );


  const normalizedContext =
    useMemo(() => {
      if (!context) {
        return null;
      }

      const currentValue =
        toFiniteNumber(
          context.current_value
        );

      const targetValue =
        toFiniteNumber(
          context.target_value
        );

      const variance =
        currentValue -
        targetValue;

      const unit =
        context.unit || "";

      return {
        kpiKey:
          context.kpi_key ||
          "",

        name:
          context.kpi_name ||
          context.name ||
          formatKpiName(
            context.kpi_key,
            t
          ),

        currentValue,
        targetValue,
        variance,
        unit,

        status:
          context.status ||
          "",

        rootCause:
          context.root_cause ||
          context.rootCause ||
          t(
            "executiveActionKpiContext.rootCauseUnavailable"
          ),

        relatedActions:
          context.related_actions ||
          {
            total: 0,
            active: 0,
            completed: 0,
            actions: [],
          },
      };
    }, [context, t]);


  const translatedKpiName =
    useMemo(() => {
      if (
        !normalizedContext
      ) {
        return "";
      }

      return formatKpiName(
        normalizedContext.name,
        t
      );
    }, [
      normalizedContext,
      t,
    ]);


  const translatedRootCause =
    useMemo(() => {
      if (
        !normalizedContext
      ) {
        return "";
      }

      const translated =
        translateDynamicExecutiveText(
          normalizedContext.rootCause,
          t
        );

      return translated ||
        normalizedContext.rootCause;
    }, [
      normalizedContext,
      t,
    ]);


  const statusConfiguration =
    useMemo(() => {
      if (
        !normalizedContext
      ) {
        return {
          label: t(
            "executiveActionKpiContext.unknown"
          ),

          color:
            "#64748b",

          isPositive:
            false,
        };
      }

      return getStatusConfiguration(
        normalizedContext.status,
        normalizedContext.variance,
        t
      );
    }, [
      normalizedContext,
      t,
    ]);


  const trendIcon =
    statusConfiguration
      .isPositive ? (
      <TrendingUpIcon />
    ) : (
      <TrendingDownIcon />
    );


  const handleRefresh =
    () => {
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
          border:
            "1px solid #e5e7eb",
          background:
            "#ffffff",
          overflow:
            "hidden",
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            background:
              `${primaryColor}10`,
            borderBottom:
              "1px solid #e5e7eb",
          }}
        >
          <Skeleton
            width={110}
            height={20}
          />

          <Skeleton
            width={220}
            height={34}
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
            {[1, 2, 3, 4].map(
              (item) => (
                <Box
                  key={item}
                  sx={{
                    flex: 1,
                  }}
                >
                  <Skeleton
                    width={90}
                    height={18}
                  />

                  <Skeleton
                    width={110}
                    height={44}
                  />
                </Box>
              )
            )}
          </Stack>

          <Divider
            sx={{
              my: 3,
            }}
          />

          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems:
                "center",
            }}
          >
            <CircularProgress
              size={20}
              sx={{
                color:
                  primaryColor,
              }}
            />

            <Typography
              variant="body2"
              sx={{
                color:
                  "#64748b",
              }}
            >
              {t(
                "executiveActionKpiContext.loading"
              )}
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
            startIcon={
              <RefreshRoundedIcon />
            }
            onClick={
              handleRefresh
            }
            sx={{
              textTransform:
                "none",
              fontWeight: 700,
            }}
          >
            {t(
              "executiveActionKpiContext.retry"
            )}
          </Button>
        }
        sx={{
          mb: 3,
          borderRadius: 3,
          alignItems:
            "center",
        }}
      >
        {error}
      </Alert>
    );
  }


  if (
    !isLinked ||
    !normalizedContext
  ) {
    return (
      <Alert
        severity="info"
        icon={
          <LinkOffRoundedIcon />
        }
        sx={{
          mb: 3,
          borderRadius: 3,
          alignItems:
            "center",
        }}
      >
        {t(
          "executiveActionKpiContext.noKpiLinked"
        )}
      </Alert>
    );
  }


  return (
    <Box
      className="executive-kpi-context"
      sx={{
        mb: 3,
        borderRadius: 4,
        border:
          "1px solid #e5e7eb",
        background:
          "#ffffff",
        overflow:
          "hidden",
      }}
    >
      <Box
        sx={{
          background:
            `${primaryColor}10`,
          px: 3,
          py: 2,
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{
              fontWeight: 700,
              color:
                "#64748b",
            }}
          >
            {t(
              "executiveActionKpiContext.liveKpiContext"
            )}
          </Typography>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color:
                "#0f172a",
            }}
          >
            {translatedKpiName}
          </Typography>
        </Box>

        <Chip
          icon={trendIcon}
          label={
            statusConfiguration.label
          }
          sx={{
            bgcolor:
              `${statusConfiguration.color}15`,

            color:
              statusConfiguration.color,

            fontWeight: 700,

            "& .MuiChip-icon":
              {
                color:
                  statusConfiguration.color,
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
            <Typography
              className="context-label"
            >
              {t(
                "executiveActionKpiContext.currentValue"
              )}
            </Typography>

            <Typography
              className="context-value"
            >
              {formatMetricValue(
                normalizedContext.currentValue,
                normalizedContext.unit
              )}
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              className="context-label"
            >
              {t(
                "executiveActionKpiContext.target"
              )}
            </Typography>

            <Typography
              className="context-value"
            >
              {formatMetricValue(
                normalizedContext.targetValue,
                normalizedContext.unit
              )}
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              className="context-label"
            >
              {t(
                "executiveActionKpiContext.variance"
              )}
            </Typography>

            <Typography
              className="context-value"
              sx={{
                color:
                  statusConfiguration.color,
              }}
            >
              {normalizedContext.variance >
              0
                ? "+"
                : ""}

              {formatMetricValue(
                normalizedContext.variance,
                normalizedContext.unit
              )}
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              className="context-label"
            >
              {t(
                "executiveActionKpiContext.relatedActions"
              )}
            </Typography>

            <Typography
              className="context-value"
            >
              {
                normalizedContext
                  .relatedActions
                  .active
              }
            </Typography>
          </Box>
        </Stack>

        <Divider
          sx={{
            my: 3,
          }}
        />

        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems:
              "flex-start",
          }}
        >
          <EngineeringIcon
            sx={{
              color:
                primaryColor,
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
              {t(
                "executiveActionKpiContext.primaryRootCause"
              )}
            </Typography>

            <Typography
              color="text.secondary"
            >
              {translatedRootCause}
            </Typography>
          </Box>
        </Box>

        {(
          onBack ||
          onClear ||
          normalizedContext
            .relatedActions
            .total > 0
        ) && (
          <>
            <Divider
              sx={{
                my: 3,
              }}
            />

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
                  startIcon={
                    <ArrowBackIcon />
                  }
                  onClick={
                    onBack
                  }
                  sx={{
                    textTransform:
                      "none",
                    fontWeight:
                      700,
                    bgcolor:
                      primaryColor,

                    "&:hover":
                      {
                        bgcolor:
                          primaryColor,
                        opacity:
                          0.9,
                      },
                  }}
                >
                  {t(
                    "executiveActionKpiContext.backToKpiDashboard"
                  )}
                </Button>
              )}

              {onClear && (
                <Button
                  variant="outlined"
                  startIcon={
                    <ClearIcon />
                  }
                  onClick={
                    onClear
                  }
                  sx={{
                    textTransform:
                      "none",
                    fontWeight:
                      700,
                  }}
                >
                  {t(
                    "executiveActionKpiContext.clearKpiFilter"
                  )}
                </Button>
              )}

              {normalizedContext
                .relatedActions
                .total > 0 && (
                <Button
                  variant="outlined"
                  startIcon={
                    <AssignmentTurnedInIcon />
                  }
                  disabled
                  sx={{
                    textTransform:
                      "none",
                    fontWeight:
                      700,

                    ml: {
                      sm: "auto",
                    },
                  }}
                >
                  {translateTemplate(
                    t,
                    "executiveActionKpiContext.relatedActionsCount",
                    {
                      count:
                        normalizedContext
                          .relatedActions
                          .total,
                    }
                  )}
                </Button>
              )}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}
