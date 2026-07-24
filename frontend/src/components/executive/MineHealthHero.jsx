import { memo, useMemo } from "react";

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from "@mui/material";

import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

function MineHealthHero({
  healthScore = 87,
  mineName = "Oyu Tolgoi Surface",
}) {
  const safeHealthScore = useMemo(() => {
    const numericScore = Number(healthScore);

    if (!Number.isFinite(numericScore)) {
      return 0;
    }

    return Math.min(100, Math.max(0, numericScore));
  }, [healthScore]);

  const healthStatus = useMemo(() => {
    if (safeHealthScore >= 85) {
      return {
        label: "Stable",
        description: "Minor operational risks detected",
      };
    }

    if (safeHealthScore >= 75) {
      return {
        label: "Watch",
        description: "Performance requires management attention",
      };
    }

    return {
      label: "Critical",
      description: "High-risk operational condition",
    };
  }, [safeHealthScore]);

  return (
    <Card
      sx={{
        borderRadius: 5,
        mb: 4,
        overflow: "hidden",
        color: "#ffffff",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
      }}
    >
      <CardContent
        sx={{
          p: 4,

          "&:last-child": {
            pb: 4,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 3,
          }}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.75,
                fontWeight: 600,
              }}
            >
              Overall Operational Health
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mt: 0.5,
                opacity: 0.9,
                fontWeight: 700,
              }}
            >
              {mineName}
            </Typography>

            <Typography
              component="div"
              sx={{
                mt: 1,
                fontSize: {
                  xs: 48,
                  sm: 60,
                },
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              {safeHealthScore}
              <Typography
                component="span"
                sx={{
                  ml: 0.75,
                  fontSize: 22,
                  fontWeight: 700,
                  opacity: 0.65,
                  letterSpacing: 0,
                }}
              >
                /100
              </Typography>
            </Typography>

            <Chip
              icon={<TrendingUpIcon />}
              label="+3 vs last week"
              color="success"
              size="small"
              sx={{
                mt: 2,
                fontWeight: 800,

                "& .MuiChip-icon": {
                  fontSize: 18,
                },
              }}
            />
          </Box>

          <Box
            sx={{
              maxWidth: 360,
              textAlign: {
                xs: "left",
                sm: "right",
              },
            }}
          >
            <HealthAndSafetyIcon
              sx={{
                mb: 1,
                fontSize: 56,
                opacity: 0.85,
              }}
            />

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
              }}
            >
              {healthStatus.label}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.75,
                opacity: 0.75,
                lineHeight: 1.6,
              }}
            >
              {healthStatus.description}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                opacity: 0.8,
                fontWeight: 700,
              }}
            >
              Mine Health Score
            </Typography>

            <Typography
              variant="body2"
              sx={{
                opacity: 0.85,
                fontWeight: 800,
              }}
            >
              {Math.round(safeHealthScore)}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={safeHealthScore}
            aria-label={`${mineName} mine health score`}
            sx={{
              height: 12,
              overflow: "hidden",
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.2)",

              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                transition:
                  "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
              },

              "@media (prefers-reduced-motion: reduce)": {
                "& .MuiLinearProgress-bar": {
                  transition: "none",
                },
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

function areMineHealthHeroPropsEqual(previousProps, nextProps) {
  return (
    previousProps.healthScore === nextProps.healthScore &&
    previousProps.mineName === nextProps.mineName
  );
}

export default memo(
  MineHealthHero,
  areMineHealthHeroPropsEqual
);