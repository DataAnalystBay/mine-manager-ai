import { memo, useMemo } from "react";

import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const EMPTY_LIST = Object.freeze([]);

function normalizeText(value, fallback) {
  const normalizedValue = String(value ?? "").trim();

  return normalizedValue || fallback;
}

function normalizeList(value) {
  if (!Array.isArray(value)) {
    return EMPTY_LIST;
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function AIDailyBriefingPanel({ briefing }) {
  const briefingText = useMemo(
    () =>
      normalizeText(
        briefing?.briefing,
        "Waiting for AI Daily Briefing..."
      ),
    [briefing?.briefing]
  );

  const actions = useMemo(
    () => normalizeList(briefing?.priority_actions),
    [briefing?.priority_actions]
  );

  const risks = useMemo(
    () => normalizeList(briefing?.risks),
    [briefing?.risks]
  );

  const hasLiveBriefing = Boolean(
    briefing?.briefing ||
      actions.length > 0 ||
      risks.length > 0
  );

  return (
    <Card
      sx={{
        height: "100%",
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: 3,

          "&:last-child": {
            pb: 3,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: 2.5,
              color: "#2563eb",
              backgroundColor: "#eff6ff",
            }}
          >
            <AutoAwesomeIcon fontSize="small" />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                color: "#0f172a",
                fontWeight: 800,
                lineHeight: 1.25,
              }}
            >
              AI Daily Briefing
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: "#94a3b8",
                fontWeight: 600,
              }}
            >
              Executive operational summary
            </Typography>
          </Box>

          <Chip
            label={hasLiveBriefing ? "Live" : "Waiting"}
            color={hasLiveBriefing ? "success" : "default"}
            size="small"
            sx={{
              ml: "auto",
              flexShrink: 0,
              fontWeight: 800,
            }}
          />
        </Box>

        <Box
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 3,
            border: "1px solid #dbeafe",
            backgroundColor: "#f8fbff",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#475569",
              lineHeight: 1.7,
              whiteSpace: "pre-line",
            }}
          >
            {briefingText}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        <Box sx={{ mb: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              mb: 1.5,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                color: "#0f172a",
                fontWeight: 800,
              }}
            >
              Priority Actions
            </Typography>

            <Chip
              size="small"
              label={actions.length}
              color={actions.length > 0 ? "success" : "default"}
              variant="outlined"
              sx={{
                minWidth: 34,
                fontWeight: 800,
              }}
            />
          </Box>

          {actions.length === 0 ? (
            <Typography
              variant="body2"
              sx={{
                color: "#94a3b8",
              }}
            >
              No priority actions.
            </Typography>
          ) : (
            <Box
              component="ul"
              sx={{
                display: "grid",
                gap: 1.25,
                p: 0,
                m: 0,
                listStyle: "none",
              }}
            >
              {actions.map((action, index) => (
                <Box
                  component="li"
                  key={`${action}-${index}`}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <CheckCircleIcon
                    color="success"
                    sx={{
                      mt: "2px",
                      flexShrink: 0,
                      fontSize: 20,
                    }}
                  />

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#475569",
                      lineHeight: 1.55,
                    }}
                  >
                    {action}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              mb: 1.5,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                color: "#0f172a",
                fontWeight: 800,
              }}
            >
              Operational Risks
            </Typography>

            <Chip
              size="small"
              label={risks.length}
              color={risks.length > 0 ? "warning" : "default"}
              variant="outlined"
              sx={{
                minWidth: 34,
                fontWeight: 800,
              }}
            />
          </Box>

          {risks.length === 0 ? (
            <Typography
              variant="body2"
              sx={{
                color: "#94a3b8",
              }}
            >
              No operational risks.
            </Typography>
          ) : (
            <Box
              component="ul"
              sx={{
                display: "grid",
                gap: 1.25,
                p: 0,
                m: 0,
                listStyle: "none",
              }}
            >
              {risks.map((risk, index) => (
                <Box
                  component="li"
                  key={`${risk}-${index}`}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <WarningAmberIcon
                    color="warning"
                    sx={{
                      mt: "2px",
                      flexShrink: 0,
                      fontSize: 20,
                    }}
                  />

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#475569",
                      lineHeight: 1.55,
                    }}
                  >
                    {risk}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function areAIDailyBriefingPanelPropsEqual(
  previousProps,
  nextProps
) {
  return previousProps.briefing === nextProps.briefing;
}

export default memo(
  AIDailyBriefingPanel,
  areAIDailyBriefingPanelPropsEqual
);