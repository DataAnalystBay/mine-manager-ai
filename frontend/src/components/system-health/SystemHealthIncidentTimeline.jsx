import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HistoryIcon from "@mui/icons-material/History";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";


function normalizeIncidentType(type) {
  const normalized = String(
    type || "info"
  )
    .trim()
    .toLowerCase();

  if (
    normalized === "warning" ||
    normalized === "unhealthy" ||
    normalized === "recovered" ||
    normalized === "healthy"
  ) {
    return normalized;
  }

  return "info";
}


function getIncidentConfig(type) {
  const normalized =
    normalizeIncidentType(type);

  const configMap = {
    warning: {
      label: "Warning",
      color: "#b45309",
      background: "#fef3c7",
      border: "#fde68a",
      icon: WarningAmberIcon,
      dotColor: "#f59e0b",
    },

    unhealthy: {
      label: "Critical",
      color: "#b91c1c",
      background: "#fee2e2",
      border: "#fecaca",
      icon: ErrorIcon,
      dotColor: "#dc2626",
    },

    recovered: {
      label: "Recovered",
      color: "#15803d",
      background: "#dcfce7",
      border: "#bbf7d0",
      icon: CheckCircleIcon,
      dotColor: "#16a34a",
    },

    healthy: {
      label: "Healthy",
      color: "#15803d",
      background: "#dcfce7",
      border: "#bbf7d0",
      icon: CheckCircleIcon,
      dotColor: "#16a34a",
    },

    info: {
      label: "Info",
      color: "#1d4ed8",
      background: "#dbeafe",
      border: "#bfdbfe",
      icon: HistoryIcon,
      dotColor: "#2563eb",
    },
  };

  return configMap[normalized];
}


function formatIncidentTime(value) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}


function IncidentStatusChip({ type }) {
  const config =
    getIncidentConfig(type);

  const IconComponent = config.icon;

  return (
    <Chip
      size="small"
      icon={
        <IconComponent
          sx={{
            fontSize: "15px !important",
          }}
        />
      }
      label={config.label}
      sx={{
        height: 25,
        border:
          `1px solid ${config.border}`,
        borderRadius: "999px",
        bgcolor: config.background,
        color: config.color,
        fontSize: 11,
        fontWeight: 800,

        "& .MuiChip-icon": {
          color: config.color,
        },
      }}
    />
  );
}


function IncidentItem({
  incident,
  isLast,
}) {
  const config = getIncidentConfig(
    incident?.type
  );

  return (
    <Box
      sx={{
        position: "relative",
        display: "grid",
        gridTemplateColumns:
          "18px minmax(0, 1fr)",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            width: 10,
            height: 10,
            mt: 0.7,
            borderRadius: "50%",
            bgcolor: config.dotColor,
            boxShadow:
              `0 0 0 4px ${config.background}`,
          }}
        />

        {!isLast && (
          <Box
            sx={{
              position: "absolute",
              top: 14,
              bottom: -22,
              width: 2,
              bgcolor: "#e2e8f0",
            }}
          />
        )}
      </Box>

      <Box
        sx={{
          minWidth: 0,
          pb: isLast ? 0 : 2.5,
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                overflowWrap: "anywhere",
                fontSize: 13,
                fontWeight: 900,
                color: "#172033",
              }}
            >
              {incident?.title ||
                "System Health event"}
            </Typography>

            <Typography
              sx={{
                mt: 0.35,
                fontSize: 11,
                color: "#64748b",
              }}
            >
              {formatIncidentTime(
                incident?.createdAt
              )}
            </Typography>
          </Box>

          <IncidentStatusChip
            type={incident?.type}
          />
        </Stack>

        {incident?.service && (
          <Typography
            sx={{
              mt: 0.8,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            {incident.service}
          </Typography>
        )}

        <Typography
          sx={{
            mt: 0.6,
            overflowWrap: "anywhere",
            fontSize: 12,
            lineHeight: 1.6,
            color: "#475569",
          }}
        >
          {incident?.description ||
            "No additional incident information is available."}
        </Typography>
      </Box>
    </Box>
  );
}


export default function SystemHealthIncidentTimeline({
  incidents = [],
  onClear,
  maxVisible = 8,
}) {
  const incidentItems =
    Array.isArray(incidents)
      ? incidents
      : [];

  const visibleIncidents = [
    ...incidentItems,
  ]
    .sort(
      (first, second) =>
        new Date(
          second?.createdAt || 0
        ).getTime() -
        new Date(
          first?.createdAt || 0
        ).getTime()
    )
    .slice(0, maxVisible);

  const hasIncidents =
    visibleIncidents.length > 0;

  return (
    <Paper
      component="section"
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
      <Stack
        direction="row"
        alignItems="flex-start"
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
                bgcolor: "#f1f5f9",
                color: "#475569",
              }}
            >
              <HistoryIcon
                sx={{
                  fontSize: 22,
                }}
              />
            </Box>

            <Box>
              <Typography
                component="h2"
                sx={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#172033",
                }}
              >
                Incident Timeline
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                Recent service status
                changes and recoveries.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Chip
          size="small"
          label={`${incidentItems.length} events`}
          sx={{
            height: 27,
            border:
              "1px solid #e2e8f0",
            bgcolor: "#f8fafc",
            color: "#475569",
            fontSize: 11,
            fontWeight: 800,
          }}
        />
      </Stack>

      <Divider
        sx={{
          my: 2.25,
          borderColor: "#edf1f5",
        }}
      />

      {hasIncidents ? (
        <Stack spacing={0}>
          {visibleIncidents.map(
            (incident, index) => (
              <IncidentItem
                key={
                  incident?.id ||
                  `${incident?.createdAt}-${index}`
                }
                incident={incident}
                isLast={
                  index ===
                  visibleIncidents.length - 1
                }
              />
            )
          )}

          {incidentItems.length >
            maxVisible && (
            <Typography
              sx={{
                mt: 2,
                textAlign: "center",
                fontSize: 11,
                color: "#64748b",
              }}
            >
              Showing the latest{" "}
              {maxVisible} of{" "}
              {incidentItems.length} events.
            </Typography>
          )}

          {typeof onClear ===
            "function" && (
            <>
              <Divider
                sx={{
                  my: 2,
                  borderColor: "#edf1f5",
                }}
              />

              <Button
                variant="text"
                size="small"
                onClick={onClear}
                sx={{
                  alignSelf: "flex-start",
                  px: 0,
                  color: "#64748b",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "none",

                  "&:hover": {
                    bgcolor: "transparent",
                    color: "#b91c1c",
                  },
                }}
              >
                Clear incident history
              </Button>
            </>
          )}
        </Stack>
      ) : (
        <Box
          sx={{
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "14px",
              bgcolor: "#dcfce7",
              color: "#15803d",
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 26,
              }}
            />
          </Box>

          <Typography
            sx={{
              mt: 1.5,
              fontSize: 14,
              fontWeight: 900,
              color: "#172033",
            }}
          >
            No incidents recorded
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              maxWidth: 300,
              fontSize: 12,
              lineHeight: 1.6,
              color: "#64748b",
            }}
          >
            Service warnings, critical
            changes, and recoveries will
            appear here as monitoring
            updates are received.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}