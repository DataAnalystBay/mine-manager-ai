import { memo, useMemo } from "react";

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
} from "@mui/material";

const DEFAULT_RISKS = Object.freeze([
  {
    id: "production",
    area: "Production",
    level: "High",
    detail: "Ore below plan",
  },
  {
    id: "fleet",
    area: "Fleet",
    level: "Low",
    detail: "Availability stable",
  },
  {
    id: "plant",
    area: "Plant",
    level: "Low",
    detail: "Throughput above target",
  },
  {
    id: "safety",
    area: "Safety",
    level: "Low",
    detail: "Zero incidents",
  },
  {
    id: "maintenance",
    area: "Maintenance",
    level: "Medium",
    detail: "Shovel delays",
  },
  {
    id: "weather",
    area: "Weather",
    level: "Medium",
    detail: "Possible haul road impact",
  },
]);

const RISK_LEVEL_CONFIG = Object.freeze({
  High: {
    chipColor: "error",
    borderColor: "#fecaca",
    backgroundColor: "#fff7f7",
    textColor: "#dc2626",
    rank: 3,
  },
  Medium: {
    chipColor: "warning",
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    textColor: "#d97706",
    rank: 2,
  },
  Low: {
    chipColor: "success",
    borderColor: "#bbf7d0",
    backgroundColor: "#f7fff9",
    textColor: "#16a34a",
    rank: 1,
  },
});

function normalizeRiskLevel(level) {
  const normalizedLevel = String(level ?? "").trim().toLowerCase();

  if (normalizedLevel === "high") {
    return "High";
  }

  if (normalizedLevel === "medium") {
    return "Medium";
  }

  return "Low";
}

function RiskHeatMap({
  risks = DEFAULT_RISKS,
  title = "Operational Risk Heat Map",
}) {
  const normalizedRisks = useMemo(() => {
    const sourceRisks = Array.isArray(risks) ? risks : DEFAULT_RISKS;

    return sourceRisks.map((risk, index) => {
      const level = normalizeRiskLevel(risk?.level);
      const config = RISK_LEVEL_CONFIG[level];

      return {
        id: risk?.id ?? `${risk?.area ?? "risk"}-${index}`,
        area: risk?.area || "Unknown Area",
        level,
        detail: risk?.detail || "No risk detail available",
        config,
      };
    });
  }, [risks]);

  const riskSummary = useMemo(() => {
    return normalizedRisks.reduce(
      (summary, risk) => {
        if (risk.level === "High") {
          summary.high += 1;
        } else if (risk.level === "Medium") {
          summary.medium += 1;
        } else {
          summary.low += 1;
        }

        return summary;
      },
      {
        high: 0,
        medium: 0,
        low: 0,
      }
    );
  }, [normalizedRisks]);

  const highestRiskLevel = useMemo(() => {
    if (riskSummary.high > 0) {
      return "High";
    }

    if (riskSummary.medium > 0) {
      return "Medium";
    }

    return "Low";
  }, [riskSummary]);

  return (
    <Card
      sx={{
        mb: 4,
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid #e5e7eb",
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
            mb: 2.5,
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
                mt: 0.4,
                color: "#64748b",
              }}
            >
              Current operational risks by business area
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${highestRiskLevel} overall risk`}
            color={RISK_LEVEL_CONFIG[highestRiskLevel].chipColor}
            sx={{
              fontWeight: 800,
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mb: 2.5,
          }}
        >
          <Chip
            size="small"
            label={`${riskSummary.high} High`}
            color="error"
            variant={riskSummary.high > 0 ? "filled" : "outlined"}
          />

          <Chip
            size="small"
            label={`${riskSummary.medium} Medium`}
            color="warning"
            variant={riskSummary.medium > 0 ? "filled" : "outlined"}
          />

          <Chip
            size="small"
            label={`${riskSummary.low} Low`}
            color="success"
            variant={riskSummary.low > 0 ? "filled" : "outlined"}
          />
        </Box>

        {normalizedRisks.length > 0 ? (
          <Grid container spacing={2}>
            {normalizedRisks.map((risk) => (
              <Grid item xs={12} sm={6} md={4} key={risk.id}>
                <Box
                  sx={{
                    height: "100%",
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: risk.config.borderColor,
                    backgroundColor: risk.config.backgroundColor,
                    transition:
                      "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",

                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                    },

                    "@media (prefers-reduced-motion: reduce)": {
                      transition: "none",

                      "&:hover": {
                        transform: "none",
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#0f172a",
                        fontWeight: 800,
                      }}
                    >
                      {risk.area}
                    </Typography>

                    <Chip
                      size="small"
                      label={risk.level}
                      color={risk.config.chipColor}
                      sx={{
                        flexShrink: 0,
                        fontWeight: 700,
                      }}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#64748b",
                      lineHeight: 1.55,
                    }}
                  >
                    {risk.detail}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box
            role="status"
            sx={{
              px: 2,
              py: 4,
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
              No operational risks available
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: "#94a3b8",
              }}
            >
              Risk information will appear when analytics data is available.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function areRiskHeatMapPropsEqual(previousProps, nextProps) {
  return (
    previousProps.risks === nextProps.risks &&
    previousProps.title === nextProps.title
  );
}

export default memo(RiskHeatMap, areRiskHeatMapPropsEqual);