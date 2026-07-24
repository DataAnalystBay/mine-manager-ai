import { memo, useCallback, useMemo } from "react";

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  LinearProgress,
} from "@mui/material";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import AnimatedNumber from "../common/AnimatedNumber";

function ExecutiveKpiCard({
  title,
  value,
  target,
  unit = "",
  icon,
  status,
  trend = "0%",
  onClick,
  loading = false,
  decimals,
}) {
  const numericValue = Number(value);
  const numericTarget = Number(target);

  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const safeTarget = Number.isFinite(numericTarget) ? numericTarget : 0;

  const progress = useMemo(() => {
    if (safeTarget > 0) {
      return Math.min(
        100,
        Math.max(0, (safeValue / safeTarget) * 100)
      );
    }

    return Math.min(100, Math.max(0, safeValue));
  }, [safeTarget, safeValue]);

  const statusConfig = useMemo(() => {
    if (status === "good") {
      return {
        background: "#dcfce7",
        color: "#16a34a",
        label: "On Target",
        chipColor: "success",
      };
    }

    if (status === "warning") {
      return {
        background: "#fef3c7",
        color: "#d97706",
        label: "Monitor",
        chipColor: "warning",
      };
    }

    return {
      background: "#fee2e2",
      color: "#dc2626",
      label: "Needs Attention",
      chipColor: "error",
    };
  }, [status]);

  const trendText = useMemo(
    () => String(trend ?? "0%").trim(),
    [trend]
  );

  const TrendIcon = useMemo(() => {
    if (trendText.startsWith("+")) {
      return TrendingUpIcon;
    }

    if (trendText.startsWith("-")) {
      return TrendingDownIcon;
    }

    return TrendingFlatIcon;
  }, [trendText]);

  const handleClick = useCallback(() => {
    if (!loading && onClick) {
      onClick();
    }
  }, [loading, onClick]);

  const handleKeyDown = useCallback(
    (event) => {
      if (!onClick || loading) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    },
    [loading, onClick]
  );

  const isInteractive = Boolean(onClick) && !loading;

  return (
    <Card
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={
        onClick
          ? `Open details for ${title}. Current value ${safeValue}${unit}`
          : undefined
      }
      aria-disabled={onClick ? !isInteractive : undefined}
      aria-busy={loading}
      sx={{
        position: "relative",
        height: "100%",
        minHeight: 250,
        overflow: "hidden",
        borderRadius: 4,
        cursor: loading ? "wait" : onClick ? "pointer" : "default",
        border: "1px solid",
        borderColor: "#e5e7eb",
        backgroundColor: "#ffffff",
        transition:
          "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",

        "&:hover": isInteractive
          ? {
              transform: "translateY(-5px)",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
              borderColor: "#cbd5e1",
            }
          : {},

        "&:active": isInteractive
          ? {
              transform: "translateY(-1px) scale(0.99)",
            }
          : {},

        "&:focus-visible": {
          outline: "3px solid rgba(37, 99, 235, 0.24)",
          outlineOffset: "3px",
        },

        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",

          "&:hover": {
            transform: "none",
          },

          "&:active": {
            transform: "none",
          },
        },
      }}
    >
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.72), rgba(255,255,255,0.1))",
            animation: "kpiLoadingSweep 1.3s infinite",

            "@keyframes kpiLoadingSweep": {
              "0%": {
                transform: "translateX(-100%)",
              },
              "100%": {
                transform: "translateX(100%)",
              },
            },

            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
              backgroundColor: "rgba(255,255,255,0.45)",
            },
          }}
        />
      )}

      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: 2.5,

          "&:last-child": {
            pb: 2.5,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              backgroundColor: statusConfig.background,
              color: statusConfig.color,
            }}
          >
            {icon}
          </Avatar>

          <Chip
            icon={<TrendIcon />}
            label={trendText}
            size="small"
            color={statusConfig.chipColor}
            sx={{
              fontWeight: 700,

              "& .MuiChip-icon": {
                fontSize: 17,
              },
            }}
          />
        </Box>

        <Typography
          sx={{
            color: "#64748b",
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.35,
            mb: 1,
          }}
        >
          {title}
        </Typography>

        <Typography
          component="div"
          sx={{
            display: "flex",
            alignItems: "baseline",
            color: "#0f172a",
            fontSize: 34,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          <AnimatedNumber
            value={safeValue}
            decimals={decimals}
            duration={700}
          />

          {unit && (
            <Typography
              component="span"
              sx={{
                ml: 0.6,
                color: "#64748b",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: 0,
              }}
            >
              {unit}
            </Typography>
          )}
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: "#94a3b8",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Target:{" "}
          <Box component="span" sx={{ color: "#64748b" }}>
            {safeTarget.toLocaleString()}
            {unit}
          </Box>
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 0.75,
            }}
          >
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Target attainment
            </Typography>

            <Typography
              sx={{
                color: "#64748b",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {Math.round(progress)}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 7,
              overflow: "hidden",
              borderRadius: 999,
              backgroundColor: "#e5e7eb",

              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                backgroundColor: statusConfig.color,
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

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: "auto",
            pt: 2,
          }}
        >
          <Typography
            sx={{
              color: statusConfig.color,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {statusConfig.label}
          </Typography>

          {onClick && (
            <ChevronRightIcon
              sx={{
                color: "#94a3b8",
                fontSize: 21,
                transition: "transform 180ms ease",

                ".MuiCard-root:hover &": {
                  transform: "translateX(3px)",
                },

                "@media (prefers-reduced-motion: reduce)": {
                  transition: "none",

                  ".MuiCard-root:hover &": {
                    transform: "none",
                  },
                },
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function areExecutiveKpiCardPropsEqual(previousProps, nextProps) {
  return (
    previousProps.title === nextProps.title &&
    previousProps.value === nextProps.value &&
    previousProps.target === nextProps.target &&
    previousProps.unit === nextProps.unit &&
    previousProps.status === nextProps.status &&
    previousProps.trend === nextProps.trend &&
    previousProps.loading === nextProps.loading &&
    previousProps.decimals === nextProps.decimals &&
    previousProps.icon === nextProps.icon &&
    previousProps.onClick === nextProps.onClick
  );
}

export default memo(
  ExecutiveKpiCard,
  areExecutiveKpiCardPropsEqual
);