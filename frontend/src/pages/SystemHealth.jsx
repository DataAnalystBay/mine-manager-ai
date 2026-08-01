import React, {
  useCallback,
  useEffect,
  useMemo,
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
  Typography,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import StorageIcon from "@mui/icons-material/Storage";
import ApiIcon from "@mui/icons-material/Api";
import PsychologyIcon from "@mui/icons-material/Psychology";
import FolderIcon from "@mui/icons-material/Folder";
import DatasetIcon from "@mui/icons-material/Dataset";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";

import { getSystemHealth } from "../api/systemHealthApi";
import { useConfig } from "../context/ConfigContext";

const AUTO_REFRESH_INTERVAL_MS = 60000;

const serviceIcons = {
  database: StorageIcon,
  backend_api: ApiIcon,
  ai_service: PsychologyIcon,
  storage: FolderIcon,
  demo_data: DatasetIcon,
};

function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  if (value === "healthy") {
    return "healthy";
  }

  if (value === "warning") {
    return "warning";
  }

  return "unhealthy";
}

function getStatusConfig(status) {
  const normalized = normalizeStatus(status);

  const configs = {
    healthy: {
      label: "Healthy",
      color: "#15803d",
      background: "#dcfce7",
      border: "#bbf7d0",
      Icon: CheckCircleIcon,
    },

    warning: {
      label: "Warning",
      color: "#a16207",
      background: "#fef3c7",
      border: "#fde68a",
      Icon: WarningAmberIcon,
    },

    unhealthy: {
      label: "Unhealthy",
      color: "#b91c1c",
      background: "#fee2e2",
      border: "#fecaca",
      Icon: ErrorOutlineIcon,
    },
  };

  return configs[normalized];
}

function formatCheckedAt(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusChip({ status }) {
  const config = getStatusConfig(status);
  const IconComponent = config.Icon;

  return (
    <Chip
      icon={
        <IconComponent
          sx={{
            color: `${config.color} !important`,
            fontSize: "18px !important",
          }}
        />
      }
      label={config.label}
      size="small"
      sx={{
        height: 30,
        borderRadius: "999px",
        border: `1px solid ${config.border}`,
        bgcolor: config.background,
        color: config.color,
        fontSize: 12,
        fontWeight: 800,

        "& .MuiChip-label": {
          px: 1.1,
        },
      }}
    />
  );
}

function MetaRow({ label, value }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "150px minmax(0, 1fr)",
        },
        alignItems: "center",
        gap: {
          xs: 0.5,
          sm: 2,
        },
        py: 1.25,
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 600,
          color: "#64748b",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          minWidth: 0,
          overflowWrap: "anywhere",
          fontSize: 14,
          fontWeight: 800,
          color: "#172033",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function ServiceDetail({ label, value }) {
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

function ServiceCard({ service, primaryColor }) {
  const IconComponent =
    serviceIcons[service?.service] || ApiIcon;

  return (
    <Paper
      component="article"
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 235,
        p: 2.5,
        border: "1px solid #e2e8f0",
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

        <StatusChip status={service?.status} />
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
            fontSize: 14,
            color: "#64748b",
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
            service?.latency_ms !== undefined &&
            service?.latency_ms !== null
              ? `${service.latency_ms} ms`
              : null
          }
        />

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
            service?.free_space_gb !== undefined &&
            service?.free_space_gb !== null
              ? `${service.free_space_gb} GB`
              : null
          }
        />

        <ServiceDetail
          label="Total space"
          value={
            service?.total_space_gb !== undefined &&
            service?.total_space_gb !== null
              ? `${service.total_space_gb} GB`
              : null
          }
        />

        <ServiceDetail
          label="Tables loaded"
          value={service?.tables_with_data}
        />
      </Box>
    </Paper>
  );
}

export default function SystemHealth() {
  const { company } = useConfig();

  const primaryColor =
    company?.primary_color || "#f97316";

  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const loadHealth = useCallback(
    async ({ background = false } = {}) => {
      try {
        setErrorMessage("");

        if (background) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getSystemHealth();

        setHealth(response);
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

  useEffect(() => {
    loadHealth();

    const intervalId = window.setInterval(() => {
      loadHealth({
        background: true,
      });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadHealth]);

  const services = useMemo(() => {
    return Array.isArray(health?.services)
      ? health.services
      : [];
  }, [health]);

  const healthyCount = useMemo(() => {
    return services.filter(
      (service) =>
        normalizeStatus(service?.status) ===
        "healthy"
    ).length;
  }, [services]);

  const overallConfig = getStatusConfig(
    health?.overall_status
  );

  if (loading && !health) {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 76px)",
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
          Checking Mine Manager AI services...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 76px)",
        p: {
          xs: 2,
          md: 4,
        },
        bgcolor: "#f5f7fb",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1320,
          mx: "auto",
        }}
      >
        {/* Page Header */}

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
              Mine Manager AI Platform Monitoring
            </Typography>
          </Box>

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
                borderColor: primaryColor,
                bgcolor: `${primaryColor}08`,
              },
            }}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </Button>
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
            {/* Platform Status */}

            <Paper
              elevation={0}
              sx={{
                mb: 4,
                overflow: "hidden",
                border: "1px solid #e2e8f0",
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
                    md: "minmax(260px, 0.85fr) minmax(420px, 1.15fr)",
                  },
                  gap: 4,
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
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#64748b",
                    }}
                  >
                    Platform Status
                  </Typography>

                  <StatusChip
                    status={health.overall_status}
                  />

                  <Typography
                    sx={{
                      mt: 2,
                      fontSize: 22,
                      fontWeight: 900,
                      color: "#172033",
                    }}
                  >
                    {healthyCount} of {services.length}{" "}
                    services healthy
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.8,
                      maxWidth: 420,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "#64748b",
                    }}
                  >
                    Mine Manager AI services are being
                    monitored automatically every 60
                    seconds.
                  </Typography>
                </Box>

                <Box>
                  <MetaRow
                    label="Last Checked"
                    value={formatCheckedAt(
                      health.checked_at
                    )}
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
                    value={health.version || "—"}
                  />

                  <Divider />

                  <MetaRow
                    label="Services"
                    value={`${healthyCount} / ${services.length} Healthy`}
                  />

                  <Divider />

                  <MetaRow
                    label="Check Duration"
                    value={
                      health.check_duration_ms !==
                        undefined &&
                      health.check_duration_ms !== null
                        ? `${health.check_duration_ms} ms`
                        : "—"
                    }
                  />
                </Box>
              </Box>
            </Paper>

            {/* Service Cards */}

            <Box
              component="section"
              aria-labelledby="service-status-heading"
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
                  Current availability and readiness
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
                      xl: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 2.5,
                  }}
                >
                  {services.map((service) => (
                    <ServiceCard
                      key={
                        service?.service ||
                        service?.label
                      }
                      service={service}
                      primaryColor={primaryColor}
                    />
                  ))}
                </Box>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#64748b",
                    }}
                  >
                    No service health information is
                    available.
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