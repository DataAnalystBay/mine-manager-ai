import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ApiIcon from "@mui/icons-material/Api";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DatasetIcon from "@mui/icons-material/Dataset";
import ErrorIcon from "@mui/icons-material/Error";
import FolderIcon from "@mui/icons-material/Folder";
import RefreshIcon from "@mui/icons-material/Refresh";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import StorageIcon from "@mui/icons-material/Storage";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";


import { getSystemHealth } from "../api/systemHealthApi";
import { useConfig } from "../context/ConfigContext";
import SystemHealthTrendChart from "../components/system-health/SystemHealthTrendChart";
import SystemHealthIncidentTimeline from "../components/system-health/SystemHealthIncidentTimeline";


const AUTO_REFRESH_INTERVAL_MS = 60_000;
const AUTO_REFRESH_INTERVAL_SECONDS =
  AUTO_REFRESH_INTERVAL_MS / 1000;
const PERFORMANCE_HISTORY_STORAGE_KEY =
  "mine_manager_ai_system_health_history";
const MAX_PERFORMANCE_HISTORY_POINTS = 30;
const INCIDENT_HISTORY_STORAGE_KEY =
  "mine_manager_ai_system_health_incidents";
const MAX_INCIDENT_HISTORY_ITEMS = 50;


const serviceIcons = {
  database: StorageIcon,
  backend_api: ApiIcon,
  ai_service: SmartToyIcon,
  storage: FolderIcon,
  demo_data: DatasetIcon,
};


function normalizeStatus(status) {
  const normalized = String(
    status || "unknown"
  )
    .trim()
    .toLowerCase();

  if (
    normalized === "healthy" ||
    normalized === "warning" ||
    normalized === "unhealthy"
  ) {
    return normalized;
  }

  return "unknown";
}


function getStatusConfig(status) {
  const normalized = normalizeStatus(status);

  const statusMap = {
    healthy: {
      label: "Healthy",
      color: "#15803d",
      background: "#dcfce7",
      border: "#bbf7d0",
      icon: CheckCircleIcon,
    },

    warning: {
      label: "Warning",
      color: "#b45309",
      background: "#fef3c7",
      border: "#fde68a",
      icon: WarningAmberIcon,
    },

    unhealthy: {
      label: "Unhealthy",
      color: "#b91c1c",
      background: "#fee2e2",
      border: "#fecaca",
      icon: ErrorIcon,
    },

    unknown: {
      label: "Unknown",
      color: "#475569",
      background: "#e2e8f0",
      border: "#cbd5e1",
      icon: ErrorIcon,
    },
  };

  return statusMap[normalized];
}


function getCacheStatusConfig(cached) {
  if (cached) {
    return {
      label: "Cached",
      color: "#1d4ed8",
      background: "#dbeafe",
      border: "#bfdbfe",
    };
  }

  return {
    label: "Live Check",
    color: "#15803d",
    background: "#dcfce7",
    border: "#bbf7d0",
  };
}


function getPerformanceStatusConfig(status) {
  const config = getStatusConfig(status);

  return {
    ...config,
    label: `${config.label} Performance`,
  };
}


function formatCheckedAt(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}


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


function formatSeconds(value) {
  const seconds = Number(value);

  if (!Number.isFinite(seconds)) {
    return "—";
  }

  if (seconds < 1) {
    return `${formatNumber(
      seconds * 1000
    )} ms`;
  }

  return `${formatNumber(seconds)} seconds`;
}


function formatCountdown(value) {
  const totalSeconds = Math.max(
    0,
    Number(value) || 0
  );

  const minutes = Math.floor(
    totalSeconds / 60
  );

  const seconds = Math.floor(
    totalSeconds % 60
  );

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}


function loadStoredPerformanceHistory() {
  try {
    const rawValue = window.localStorage.getItem(
      PERFORMANCE_HISTORY_STORAGE_KEY
    );

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((item) => item?.checkedAt)
      .slice(-MAX_PERFORMANCE_HISTORY_POINTS);
  } catch (error) {
    console.warn(
      "Unable to load System Health history:",
      error
    );

    return [];
  }
}


function savePerformanceHistory(history) {
  try {
    window.localStorage.setItem(
      PERFORMANCE_HISTORY_STORAGE_KEY,
      JSON.stringify(history)
    );
  } catch (error) {
    console.warn(
      "Unable to save System Health history:",
      error
    );
  }
}


function loadStoredIncidentHistory() {
  try {
    const rawValue = window.localStorage.getItem(
      INCIDENT_HISTORY_STORAGE_KEY
    );

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((item) => item?.id && item?.createdAt)
      .slice(-MAX_INCIDENT_HISTORY_ITEMS);
  } catch (error) {
    console.warn(
      "Unable to load System Health incidents:",
      error
    );

    return [];
  }
}


function saveIncidentHistory(items) {
  try {
    window.localStorage.setItem(
      INCIDENT_HISTORY_STORAGE_KEY,
      JSON.stringify(items)
    );
  } catch (error) {
    console.warn(
      "Unable to save System Health incidents:",
      error
    );
  }
}


function buildPerformanceHistoryPoint(health) {
  const services = Array.isArray(health?.services)
    ? health.services
    : [];

  const databaseService = services.find(
    (service) => service?.service === "database"
  );

  const demoDataService = services.find(
    (service) => service?.service === "demo_data"
  );

  const checkedAt = health?.checked_at;

  if (!checkedAt) {
    return null;
  }

  const checkedDate = new Date(checkedAt);

  return {
    checkedAt,
    label: Number.isNaN(checkedDate.getTime())
      ? String(checkedAt)
      : checkedDate.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
    overallMs: Number(health?.check_duration_ms) || 0,
    databaseMs:
      Number(databaseService?.latency_ms) ||
      Number(databaseService?.check_duration_ms) ||
      0,
    demoDataMs:
      Number(demoDataService?.check_duration_ms) || 0,
  };
}


function buildStatusChangeIncidents(
  previousHealth,
  currentHealth
) {
  if (!previousHealth || !currentHealth) {
    return [];
  }

  if (
    previousHealth?.checked_at &&
    currentHealth?.checked_at &&
    previousHealth.checked_at === currentHealth.checked_at
  ) {
    return [];
  }

  const previousServices = Array.isArray(
    previousHealth?.services
  )
    ? previousHealth.services
    : [];

  const currentServices = Array.isArray(
    currentHealth?.services
  )
    ? currentHealth.services
    : [];

  const createdAt =
    currentHealth?.checked_at ||
    new Date().toISOString();

  const incidents = [];

  currentServices.forEach((currentService) => {
    const previousService = previousServices.find(
      (item) =>
        item?.service === currentService?.service
    );

    if (!previousService) {
      return;
    }

    const previousStatus = normalizeStatus(
      previousService?.status
    );

    const currentStatus = normalizeStatus(
      currentService?.status
    );

    if (previousStatus === currentStatus) {
      return;
    }

    const serviceKey =
      currentService?.service || "service";

    const serviceLabel =
      currentService?.label ||
      currentService?.service ||
      "Service";

    if (
      currentStatus === "warning" ||
      currentStatus === "unhealthy"
    ) {
      const metricDescription =
        currentService?.latency_ms !== undefined &&
        currentService?.latency_ms !== null
          ? `${currentService.message || "Service requires attention."} Current latency: ${formatNumber(
              currentService.latency_ms
            )} ms.`
          : currentService?.message ||
            "Service requires attention.";

      incidents.push({
        id: `${serviceKey}-${createdAt}-${currentStatus}`,
        createdAt,
        service: serviceLabel,
        type: currentStatus,
        title: `${serviceLabel} entered ${
          currentStatus === "unhealthy"
            ? "critical"
            : "warning"
        } state`,
        description: metricDescription,
      });
    }

    if (
      previousStatus !== "healthy" &&
      currentStatus === "healthy"
    ) {
      incidents.push({
        id: `${serviceKey}-${createdAt}-recovered`,
        createdAt,
        service: serviceLabel,
        type: "recovered",
        title: `${serviceLabel} recovered`,
        description:
          currentService?.message ||
          "Service returned to healthy status.",
      });
    }
  });

  return incidents;
}


function StatusChip({ status }) {
  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <Chip
      size="small"
      icon={
        <IconComponent
          sx={{
            fontSize: "17px !important",
          }}
        />
      }
      label={config.label}
      sx={{
        height: 28,
        border: `1px solid ${config.border}`,
        borderRadius: "999px",
        bgcolor: config.background,
        color: config.color,
        fontSize: 12,
        fontWeight: 800,

        "& .MuiChip-icon": {
          color: config.color,
        },
      }}
    />
  );
}


function CacheStatusChip({ cached }) {
  const config =
    getCacheStatusConfig(cached);

  return (
    <Chip
      size="small"
      label={config.label}
      sx={{
        height: 28,
        border: `1px solid ${config.border}`,
        borderRadius: "999px",
        bgcolor: config.background,
        color: config.color,
        fontSize: 12,
        fontWeight: 800,
      }}
    />
  );
}


function PerformanceStatusChip({
  status,
}) {
  const config =
    getPerformanceStatusConfig(status);

  const IconComponent = config.icon;

  return (
    <Chip
      size="small"
      icon={
        <IconComponent
          sx={{
            fontSize: "17px !important",
          }}
        />
      }
      label={config.label}
      sx={{
        height: 28,
        border: `1px solid ${config.border}`,
        borderRadius: "999px",
        bgcolor: config.background,
        color: config.color,
        fontSize: 12,
        fontWeight: 800,

        "& .MuiChip-icon": {
          color: config.color,
        },
      }}
    />
  );
}


function MetaRow({
  label,
  value,
  valueNode,
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns:
          "minmax(130px, 0.8fr) minmax(190px, 1.2fr)",
        alignItems: "center",
        gap: 2,
        py: 1.25,
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          color: "#64748b",
        }}
      >
        {label}
      </Typography>

      {valueNode || (
        <Typography
          sx={{
            textAlign: "left",
            overflowWrap: "anywhere",
            fontSize: 13,
            fontWeight: 800,
            color: "#172033",
          }}
        >
          {value}
        </Typography>
      )}
    </Box>
  );
}


function ServiceDetail({
  label,
  value,
}) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        py: 0.7,
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          color: "#64748b",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          textAlign: "right",
          overflowWrap: "anywhere",
          fontSize: 13,
          fontWeight: 800,
          color: "#172033",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}


function HealthKpiCard({
  label,
  value,
  caption,
  icon: IconComponent,
  color,
  background,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.75,
        minHeight: 124,
        display: "flex",
        alignItems: "center",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        bgcolor: "#ffffff",
        boxShadow:
          "0 8px 22px rgba(15, 23, 42, 0.05)",
        transition:
          "transform 0.2s ease, box-shadow 0.2s ease",

        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            "0 12px 28px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ width: "100%" }}
      >
        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
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
              mt: 0.7,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: {
                xs: 24,
                md: 28,
              },
              lineHeight: 1.1,
              fontWeight: 900,
              color: "#172033",
            }}
          >
            {value}
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              minHeight: 18,
              fontSize: 12,
              color: "#64748b",
            }}
          >
            {caption}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 50,
            height: 50,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "13px",
            bgcolor: background,
            color,
          }}
        >
          <IconComponent
            sx={{
              fontSize: 25,
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}


function ServiceCard({
  service,
  primaryColor,
}) {
  const IconComponent =
    serviceIcons[service?.service] ||
    ApiIcon;

  const statusConfig = getStatusConfig(
    service?.status
  );

  const isDatabase =
    service?.service === "database";

  return (
    <Paper
      component="article"
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 230,
        p: 2.25,
        border:
          `1px solid ${statusConfig.border}`,
        borderTop:
          `4px solid ${statusConfig.color}`,
        borderRadius: "18px",
        bgcolor: "#ffffff",
        boxShadow:
          "0 10px 28px rgba(15, 23, 42, 0.06)",
        transition:
          "transform 0.2s ease, box-shadow 0.2s ease",

        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow:
            "0 16px 36px rgba(15, 23, 42, 0.10)",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "14px",
            bgcolor: `${primaryColor}14`,
            color: primaryColor,
          }}
        >
          <IconComponent
            sx={{
              fontSize: 26,
            }}
          />
        </Box>

        <StatusChip
          status={service?.status}
        />
      </Stack>

      <Box
        sx={{
          mt: 2.25,
        }}
      >
        <Typography
          component="h3"
          sx={{
            fontSize: 18,
            fontWeight: 900,
            color: "#172033",
          }}
        >
          {service?.label || "Service"}
        </Typography>

        <Typography
          sx={{
            mt: 0.7,
            minHeight: 21,
            fontSize: 14,
            color: statusConfig.color,
            fontWeight:
              normalizeStatus(
                service?.status
              ) === "healthy"
                ? 500
                : 700,
          }}
        >
          {service?.message ||
            "No status information available"}
        </Typography>
      </Box>

      <Divider
        sx={{
          my: 2,
          borderColor: "#edf1f5",
        }}
      />

      <Box
        sx={{
          mt: "auto",
        }}
      >
        <ServiceDetail
          label="Latency"
          value={
            service?.latency_ms !==
              undefined &&
            service?.latency_ms !== null
              ? `${formatNumber(
                  service.latency_ms
                )} ms`
              : null
          }
        />

        {!isDatabase && (
          <ServiceDetail
            label="Check duration"
            value={
              service?.check_duration_ms !==
                undefined &&
              service?.check_duration_ms !==
                null
                ? `${formatNumber(
                    service.check_duration_ms
                  )} ms`
                : null
            }
          />
        )}

        <ServiceDetail
          label="Version"
          value={service?.version}
        />

        <ServiceDetail
          label="Provider"
          value={service?.provider}
        />

        <ServiceDetail
          label="Environment"
          value={service?.environment}
        />

        <ServiceDetail
          label="Free space"
          value={
            service?.free_space_gb !==
              undefined &&
            service?.free_space_gb !== null
              ? `${formatNumber(
                  service.free_space_gb
                )} GB`
              : null
          }
        />

        <ServiceDetail
          label="Used space"
          value={
            service?.used_space_gb !==
              undefined &&
            service?.used_space_gb !== null
              ? `${formatNumber(
                  service.used_space_gb
                )} GB`
              : null
          }
        />

        <ServiceDetail
          label="Total space"
          value={
            service?.total_space_gb !==
              undefined &&
            service?.total_space_gb !== null
              ? `${formatNumber(
                  service.total_space_gb
                )} GB`
              : null
          }
        />

        <ServiceDetail
          label="Free space %"
          value={
            service?.free_space_percent !==
              undefined &&
            service?.free_space_percent !==
              null
              ? `${formatNumber(
                  service.free_space_percent
                )}%`
              : null
          }
        />

        <ServiceDetail
          label="Tables loaded"
          value={
            service?.tables_with_data !==
              undefined &&
            service?.tables_with_data !==
              null
              ? service
                  ?.total_candidate_tables
                ? `${service.tables_with_data} / ${service.total_candidate_tables}`
                : service.tables_with_data
              : null
          }
        />
      </Box>
    </Paper>
  );
}



export default function SystemHealth() {
  const { company } = useConfig();

  const primaryColor =
    company?.primary_color || "#f97316";

  const [health, setHealth] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    performanceHistory,
    setPerformanceHistory,
  ] = useState(
    loadStoredPerformanceHistory
  );

  const [
    incidentHistory,
    setIncidentHistory,
  ] = useState(
    loadStoredIncidentHistory
  );

  const previousHealthRef = useRef(null);

  const [autoRefresh, setAutoRefresh] =
    useState(true);

  const [countdown, setCountdown] =
    useState(AUTO_REFRESH_INTERVAL_SECONDS);

  const [lastUpdated, setLastUpdated] =
    useState(null);


  const loadHealth = useCallback(
    async ({
      background = false,
      forceRefresh = false,
    } = {}) => {
      try {
        setErrorMessage("");

        if (background) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response =
          await getSystemHealth(
            forceRefresh
          );

        setHealth(response);

        const newIncidents =
          buildStatusChangeIncidents(
            previousHealthRef.current,
            response
          );

        if (newIncidents.length > 0) {
          setIncidentHistory(
            (currentItems) => {
              const existingIds = new Set(
                currentItems.map(
                  (item) => item.id
                )
              );

              const uniqueNewItems =
                newIncidents.filter(
                  (item) =>
                    !existingIds.has(item.id)
                );

              if (uniqueNewItems.length === 0) {
                return currentItems;
              }

              const nextItems = [
                ...currentItems,
                ...uniqueNewItems,
              ].slice(
                -MAX_INCIDENT_HISTORY_ITEMS
              );

              saveIncidentHistory(nextItems);

              return nextItems;
            }
          );
        }

        previousHealthRef.current = response;
        setLastUpdated(new Date());
        setCountdown(
          AUTO_REFRESH_INTERVAL_SECONDS
        );

        const historyPoint =
          buildPerformanceHistoryPoint(
            response
          );

        if (historyPoint) {
          setPerformanceHistory(
            (currentHistory) => {
              const alreadyExists =
                currentHistory.some(
                  (item) =>
                    item.checkedAt ===
                    historyPoint.checkedAt
                );

              if (alreadyExists) {
                return currentHistory;
              }

              const nextHistory = [
                ...currentHistory,
                historyPoint,
              ].slice(
                -MAX_PERFORMANCE_HISTORY_POINTS
              );

              savePerformanceHistory(
                nextHistory
              );

              return nextHistory;
            }
          );
        }
      } catch (error) {
        console.error(
          "Failed to load system health:",
          error
        );

        const message =
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.userMessage ||
          error?.message ||
          "Unable to load system health.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );


  const handleClearIncidents = useCallback(() => {
    setIncidentHistory([]);

    try {
      window.localStorage.removeItem(
        INCIDENT_HISTORY_STORAGE_KEY
      );
    } catch (error) {
      console.warn(
        "Unable to clear System Health incidents:",
        error
      );
    }
  }, []);


  useEffect(() => {
    loadHealth();
  }, [loadHealth]);


  useEffect(() => {
    if (!autoRefresh) {
      return undefined;
    }

    const intervalId =
      window.setInterval(() => {
        loadHealth({
          background: true,
        });
      }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefresh, loadHealth]);


  useEffect(() => {
    if (!autoRefresh) {
      return undefined;
    }

    const timerId = window.setInterval(
      () => {
        setCountdown((currentValue) => {
          if (currentValue <= 1) {
            return AUTO_REFRESH_INTERVAL_SECONDS;
          }

          return currentValue - 1;
        });
      },
      1000
    );

    return () => {
      window.clearInterval(timerId);
    };
  }, [autoRefresh]);


  const services = useMemo(() => {
    return Array.isArray(
      health?.services
    )
      ? health.services
      : [];
  }, [health]);


  const serviceSummary =
    useMemo(() => {
      const backendSummary =
        health?.service_summary;

      if (backendSummary) {
        return {
          total:
            Number(
              backendSummary.total
            ) || 0,

          healthy:
            Number(
              backendSummary.healthy
            ) || 0,

          warning:
            Number(
              backendSummary.warning
            ) || 0,

          unhealthy:
            Number(
              backendSummary.unhealthy
            ) || 0,
        };
      }

      return {
        total: services.length,

        healthy: services.filter(
          (service) =>
            normalizeStatus(
              service?.status
            ) === "healthy"
        ).length,

        warning: services.filter(
          (service) =>
            normalizeStatus(
              service?.status
            ) === "warning"
        ).length,

        unhealthy: services.filter(
          (service) =>
            normalizeStatus(
              service?.status
            ) === "unhealthy"
        ).length,
      };
    }, [health, services]);


  const averageServiceDuration =
    useMemo(() => {
      const durationValues = services
        .map((service) =>
          Number(
            service?.check_duration_ms
          )
        )
        .filter((value) =>
          Number.isFinite(value)
        );

      if (durationValues.length === 0) {
        return 0;
      }

      const totalDuration =
        durationValues.reduce(
          (sum, value) => sum + value,
          0
        );

      return (
        totalDuration /
        durationValues.length
      );
    }, [services]);


  const slowestServiceSummary =
    useMemo(() => {
      if (
        health?.slowest_service?.label
      ) {
        return {
          label:
            health.slowest_service.label,
          duration:
            Number(
              health.slowest_service
                .check_duration_ms
            ) || 0,
        };
      }

      if (services.length === 0) {
        return {
          label: "—",
          duration: 0,
        };
      }

      const slowest = [...services].sort(
        (first, second) =>
          Number(
            second?.check_duration_ms
          ) -
          Number(
            first?.check_duration_ms
          )
      )[0];

      return {
        label:
          slowest?.label || "—",
        duration:
          Number(
            slowest?.check_duration_ms
          ) || 0,
      };
    }, [health, services]);


  const warningServices = useMemo(
    () =>
      services.filter(
        (service) =>
          normalizeStatus(
            service?.status
          ) === "warning"
      ),
    [services]
  );


  const primaryWarningService =
    warningServices[0] || null;


  const overallConfig =
    getStatusConfig(
      health?.overall_status
    );


  if (loading && !health) {
    return (
      <Box
        sx={{
          minHeight:
            "calc(100vh - 76px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f7fb",
        }}
      >
        <CircularProgress
          size={48}
          thickness={4}
          sx={{
            color: primaryColor,
          }}
        />

        <Typography
          sx={{
            mt: 2,
            fontSize: 14,
            fontWeight: 700,
            color: "#64748b",
          }}
        >
          Checking Mine Manager AI
          services...
        </Typography>
      </Box>
    );
  }


  return (
    <Box
      sx={{
        minHeight:
          "calc(100vh - 76px)",
        px: {
          xs: 2,
          md: 3,
          xl: 4,
        },
        py: {
          xs: 2,
          md: 3,
        },
        bgcolor: "#f5f7fb",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "1700px",
          mx: "auto",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          alignItems={{
            xs: "stretch",
            sm: "flex-start",
          }}
          justifyContent="space-between"
          spacing={2}
          sx={{
            mb: 3,
          }}
        >
          <Box>
            <Typography
              component="h1"
              sx={{
                fontSize: {
                  xs: 28,
                  md: 34,
                },
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: "#172033",
              }}
            >
              System Health
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 14,
                color: "#64748b",
              }}
            >
              Mine Manager AI Platform
              Monitoring
            </Typography>
          </Box>

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            justifyContent="flex-end"
            spacing={1.25}
          >
            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                minHeight: 44,
                px: 1.5,
                py: 0.7,
                border: "1px solid #d7dee8",
                borderRadius: "11px",
                bgcolor: "#ffffff",
              }}
            >
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  bgcolor: autoRefresh
                    ? "#16a34a"
                    : "#94a3b8",
                  boxShadow: autoRefresh
                    ? "0 0 0 4px rgba(22, 163, 74, 0.12)"
                    : "none",
                }}
              />

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#172033",
                  }}
                >
                  {autoRefresh ? "Live" : "Paused"}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 10,
                    color: "#64748b",
                  }}
                >
                  {lastUpdated
                    ? `Updated ${lastUpdated.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}`
                    : "Waiting for first check"}
                </Typography>
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                minHeight: 44,
                px: 1.5,
                py: 0.7,
                border: "1px solid #d7dee8",
                borderRadius: "11px",
                bgcolor: "#ffffff",
              }}
            >
              <AccessTimeIcon
                sx={{
                  fontSize: 18,
                  color: "#64748b",
                }}
              />

              <Box>
                <Typography
                  sx={{
                    fontSize: 10,
                    color: "#64748b",
                  }}
                >
                  Next refresh
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#172033",
                  }}
                >
                  {autoRefresh
                    ? formatCountdown(countdown)
                    : "Paused"}
                </Typography>
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                minHeight: 44,
                px: 1.1,
                border: "1px solid #d7dee8",
                borderRadius: "11px",
                bgcolor: "#ffffff",
              }}
            >
              <Typography
                sx={{
                  pl: 0.5,
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#172033",
                }}
              >
                Auto Refresh
              </Typography>

              <Switch
                size="small"
                checked={autoRefresh}
                onChange={(event) => {
                  const nextValue =
                    event.target.checked;

                  setAutoRefresh(nextValue);
                  setCountdown(
                    AUTO_REFRESH_INTERVAL_SECONDS
                  );
                }}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: primaryColor,
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    bgcolor: primaryColor,
                  },
                }}
              />
            </Paper>

            <Button
              variant="outlined"
              startIcon={
                refreshing ? (
                  <CircularProgress
                    size={17}
                    thickness={5}
                  />
                ) : (
                  <RefreshIcon />
                )
              }
              onClick={() =>
                loadHealth({
                  background: true,
                  forceRefresh: true,
                })
              }
              disabled={refreshing}
              sx={{
                minWidth: 120,
                height: 44,
                px: 2,
                borderRadius: "11px",
                borderColor: "#d7dee8",
                bgcolor: "#ffffff",
                color: "#172033",
                fontSize: 13,
                fontWeight: 800,
                textTransform: "none",

                "&:hover": {
                  borderColor:
                    primaryColor,
                  bgcolor:
                    `${primaryColor}08`,
                },
              }}
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </Button>
          </Stack>
        </Stack>

        {errorMessage && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: "14px",
            }}
          >
            {errorMessage}
          </Alert>
        )}

        {health && (
          <>
            <Box
              component="section"
              aria-labelledby="system-overview-heading"
              sx={{
                mb: 5,
              }}
            >
              <Box
                sx={{
                  mb: 2.25,
                }}
              >
                <Typography
                  id="system-overview-heading"
                  component="h2"
                  sx={{
                    fontSize: 21,
                    fontWeight: 900,
                    color: "#172033",
                  }}
                >
                  System Overview
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: 14,
                    color: "#64748b",
                  }}
                >
                  Current service health and
                  performance indicators.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <HealthKpiCard
                  label="Healthy Services"
                  value={
                    serviceSummary.healthy
                  }
                  caption={
                    `${serviceSummary.total} services monitored`
                  }
                  icon={CheckCircleIcon}
                  color="#15803d"
                  background="#dcfce7"
                />

                <HealthKpiCard
                  label="Warnings"
                  value={
                    serviceSummary.warning
                  }
                  caption={
                    serviceSummary.warning === 1
                      ? "1 service needs attention"
                      : `${serviceSummary.warning} services need attention`
                  }
                  icon={WarningAmberIcon}
                  color="#b45309"
                  background="#fef3c7"
                />

                <HealthKpiCard
                  label="Average Check"
                  value={
                    `${formatNumber(
                      averageServiceDuration
                    )} ms`
                  }
                  caption="Average service-check duration"
                  icon={ApiIcon}
                  color="#1d4ed8"
                  background="#dbeafe"
                />

                <HealthKpiCard
                  label="Slowest Service"
                  value={
                    slowestServiceSummary.label
                  }
                  caption={
                    `${formatNumber(
                      slowestServiceSummary.duration
                    )} ms`
                  }
                  icon={StorageIcon}
                  color="#7c3aed"
                  background="#ede9fe"
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  xl: "minmax(0, 1.65fr) minmax(340px, 0.85fr)",
                },
                gap: 3,
                alignItems: "start",
                mb: 5,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  mb: 0,
                  overflow: "hidden",
                  border:
                    "1px solid #e2e8f0",
                  borderLeft:
                    `6px solid ${overallConfig.color}`,
                  borderRadius: "18px",
                  bgcolor: "#ffffff",
                  boxShadow:
                    "0 12px 32px rgba(15, 23, 42, 0.07)",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      lg: "minmax(420px, 0.85fr) minmax(620px, 1.15fr)",
                    },
                    gap: {
                      xs: 3,
                      lg: 6,
                    },
                    p: {
                      xs: 2.5,
                      md: 3.5,
                    },
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        mb: 1.3,
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing:
                          "0.08em",
                        textTransform:
                          "uppercase",
                        color: "#64748b",
                      }}
                    >
                      Platform Status
                    </Typography>

                    <Stack
                      direction="row"
                      alignItems="center"
                      flexWrap="wrap"
                      gap={1}
                    >
                      <StatusChip
                        status={
                          health.overall_status
                        }
                      />

                      <CacheStatusChip
                        cached={Boolean(
                          health.cached
                        )}
                      />

                      <PerformanceStatusChip
                        status={
                          health
                            .check_duration_status
                        }
                      />
                    </Stack>

                    <Typography
                      sx={{
                        mt: 2,
                        fontSize: {
                          xs: 19,
                          md: 22,
                        },
                        fontWeight: 900,
                        color: "#172033",
                      }}
                    >
                      {
                        serviceSummary.healthy
                      }{" "}
                      Healthy
                      {" · "}
                      {
                        serviceSummary.warning
                      }{" "}
                      Warning
                      {" · "}
                      {
                        serviceSummary.unhealthy
                      }{" "}
                      Unhealthy
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.8,
                        maxWidth: 460,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: "#64748b",
                      }}
                    >
                      Mine Manager AI services
                      are monitored automatically
                      every 60 seconds. Repeated
                      requests may use a recent
                      cached result to reduce
                      database load.
                    </Typography>
                  </Box>

                  <Box>
                    <MetaRow
                      label="Last Real Check"
                      value={formatCheckedAt(
                        health.checked_at
                      )}
                    />

                    <Divider />

                    <MetaRow
                      label="Response Source"
                      value={
                        health.cached
                          ? "Cached result"
                          : "Live system check"
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Cache Age"
                      value={
                        health.cached
                          ? formatSeconds(
                              health.cache_age_seconds
                            )
                          : "Fresh"
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Cache TTL"
                      value={
                        health
                          .cache_ttl_seconds !==
                          undefined &&
                        health
                          .cache_ttl_seconds !==
                          null
                          ? `${formatNumber(
                              health.cache_ttl_seconds
                            )} seconds`
                          : "—"
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Environment"
                      value={
                        health.environment ||
                        "Unknown"
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Version"
                      value={
                        health.version || "—"
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Services"
                      value={
                        `${serviceSummary.healthy} Healthy · ` +
                        `${serviceSummary.warning} Warning · ` +
                        `${serviceSummary.unhealthy} Unhealthy`
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Check Duration"
                      value={
                        health
                          .check_duration_ms !==
                          undefined &&
                        health
                          .check_duration_ms !==
                          null
                          ? `${formatNumber(
                              health
                                .check_duration_ms
                            )} ms`
                          : "—"
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="API Response Time"
                      value={
                        health
                          .response_duration_ms !==
                          undefined &&
                        health
                          .response_duration_ms !==
                          null
                          ? `${formatNumber(
                              health
                                .response_duration_ms
                            )} ms`
                          : "—"
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Check Performance"
                      value={
                        health
                          .check_duration_message ||
                        "No performance status"
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Slowest Service"
                      value={
                        health
                          ?.slowest_service
                          ?.label
                          ? `${
                              health
                                .slowest_service
                                .label
                            } · ${formatNumber(
                              health
                                .slowest_service
                                .check_duration_ms
                            )} ms`
                          : "—"
                      }
                    />
                  </Box>
                </Box>
              </Paper>

                <Box sx={{ mt: 3 }}>
                  <SystemHealthTrendChart
                    data={performanceHistory.map((item) => ({
                      ...item,
                      checkedAt: item.label || item.checkedAt,
                    }))}
                  />
                </Box>
              </Box>

              <Box
                component="aside"
                aria-label="System health operations summary"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  minWidth: 0,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    bgcolor: "#ffffff",
                    boxShadow:
                      "0 10px 28px rgba(15, 23, 42, 0.06)",
                  }}
                >
                  <Typography
                    component="h2"
                    sx={{
                      fontSize: 19,
                      fontWeight: 900,
                      color: "#172033",
                    }}
                  >
                    Operations Snapshot
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      mb: 2,
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "#64748b",
                    }}
                  >
                    Current monitoring status and key operational signals.
                  </Typography>

                  <Stack spacing={0}>
                    <MetaRow
                      label="Monitoring"
                      value={autoRefresh ? "Live" : "Paused"}
                    />

                    <Divider />

                    <MetaRow
                      label="Next Refresh"
                      value={
                        autoRefresh
                          ? `00:${String(countdown).padStart(2, "0")}`
                          : "Paused"
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Healthy Services"
                      valueNode={
                        <Chip
                          size="small"
                          label={`${serviceSummary.healthy} Healthy`}
                          sx={{
                            justifySelf: "start",
                            bgcolor: "#dcfce7",
                            color: "#15803d",
                            border: "1px solid #bbf7d0",
                            fontWeight: 800,
                          }}
                        />
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Warnings"
                      valueNode={
                        <Chip
                          size="small"
                          label={`${serviceSummary.warning} Warning`}
                          sx={{
                            justifySelf: "start",
                            bgcolor: "#fef3c7",
                            color: "#b45309",
                            border: "1px solid #fde68a",
                            fontWeight: 800,
                          }}
                        />
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Critical"
                      valueNode={
                        <Chip
                          size="small"
                          label={`${serviceSummary.unhealthy} Critical`}
                          sx={{
                            justifySelf: "start",
                            bgcolor:
                              serviceSummary.unhealthy > 0
                                ? "#fee2e2"
                                : "#f1f5f9",
                            color:
                              serviceSummary.unhealthy > 0
                                ? "#b91c1c"
                                : "#64748b",
                            border:
                              serviceSummary.unhealthy > 0
                                ? "1px solid #fecaca"
                                : "1px solid #e2e8f0",
                            fontWeight: 800,
                          }}
                        />
                      }
                    />

                    <Divider />

                    <MetaRow
                      label="Slowest Service"
                      value={slowestServiceSummary.label}
                    />

                    <Divider />

                    <MetaRow
                      label="Slowest Duration"
                      value={`${formatNumber(
                        slowestServiceSummary.duration
                      )} ms`}
                    />
                  </Stack>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border:
                      serviceSummary.warning > 0
                        ? "1px solid #fde68a"
                        : "1px solid #bbf7d0",
                    borderRadius: "18px",
                    bgcolor:
                      serviceSummary.warning > 0
                        ? "#fffbeb"
                        : "#f0fdf4",
                    boxShadow:
                      "0 10px 28px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    {serviceSummary.warning > 0 ? (
                      <WarningAmberIcon
                        sx={{ color: "#b45309" }}
                      />
                    ) : (
                      <CheckCircleIcon
                        sx={{ color: "#15803d" }}
                      />
                    )}

                    <Typography
                      component="h2"
                      sx={{
                        fontSize: 18,
                        fontWeight: 900,
                        color:
                          serviceSummary.warning > 0
                            ? "#92400e"
                            : "#166534",
                      }}
                    >
                      Current Attention
                    </Typography>
                  </Stack>

                  <Typography
                    sx={{
                      mt: 1.5,
                      fontSize: 14,
                      fontWeight: 800,
                      color:
                        serviceSummary.warning > 0
                          ? "#92400e"
                          : "#166534",
                    }}
                  >
                    {serviceSummary.warning > 0
                      ? `${serviceSummary.warning} service${
                          serviceSummary.warning === 1 ? "" : "s"
                        } require${
                          serviceSummary.warning === 1 ? "s" : ""
                        } attention`
                      : "No active warnings"}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.75,
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: "#78716c",
                    }}
                  >
                    {serviceSummary.warning > 0
                      ? `${
                          primaryWarningService?.label ||
                          slowestServiceSummary.label
                        }: ${
                          primaryWarningService?.message ||
                          "Service performance is outside the preferred threshold."
                        }`
                      : "All monitored services are operating within their expected thresholds."}
                  </Typography>

                  {serviceSummary.warning > 0 && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor: "rgba(255, 255, 255, 0.72)",
                        border: "1px solid #fde68a",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          color: "#92400e",
                        }}
                      >
                        Recommended action
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.6,
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: "#78350f",
                        }}
                      >
                        Review the affected service, confirm whether the delay is
                        temporary, and investigate infrastructure load if the
                        warning persists.
                      </Typography>
                    </Box>
                  )}
                </Paper>

                <SystemHealthIncidentTimeline
                  incidents={incidentHistory}
                  onClear={handleClearIncidents}
                  maxVisible={8}
                />
              </Box>
            </Box>

            <Box
              component="section"
              aria-labelledby="service-status-heading"
              sx={{
                pb: 4,
              }}
            >
              <Box
                sx={{
                  mb: 2.5,
                }}
              >
                <Typography
                  id="service-status-heading"
                  component="h2"
                  sx={{
                    fontSize: 21,
                    fontWeight: 900,
                    color: "#172033",
                  }}
                >
                  Service Status
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: 14,
                    color: "#64748b",
                  }}
                >
                  Current availability,
                  readiness, and response time
                  of platform services.
                </Typography>
              </Box>

              {services.length > 0 ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      lg: "repeat(3, minmax(0, 1fr))",
                      xl: "repeat(5, minmax(0, 1fr))",
                    },
                    gap: 2.5,
                  }}
                >
                  {services.map(
                    (service) => (
                      <ServiceCard
                        key={
                          service?.service ||
                          service?.label
                        }
                        service={service}
                        primaryColor={
                          primaryColor
                        }
                      />
                    )
                  )}
                </Box>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "16px",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#64748b",
                    }}
                  >
                    No service health
                    information is available.
                  </Typography>
                </Paper>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}