import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  FiActivity,
  FiAlertTriangle,
  FiArrowDownRight,
  FiArrowRight,
  FiArrowUpRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiDatabase,
  FiRefreshCw,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

import SafetyTrendChart from "../components/SafetyTrendChart";

import {
  getSafetyTrend,
  getTodaySafety,
} from "../api/safetyApi";

import { useLanguage } from "../context/LanguageContext";


const SAFETY_SCORE_TARGET = 95;
const TREND_PERIODS = 30;


/* =========================================================
   TRANSLATION FALLBACK
========================================================= */

function translate(t, key, fallback) {
  try {
    const translated = t(key);

    if (
      !translated ||
      translated === key
    ) {
      return fallback;
    }

    return translated;
  } catch {
    return fallback;
  }
}


/* =========================================================
   FORMATTERS
========================================================= */

function formatDate(dateValue) {
  if (!dateValue) {
    return "Unavailable";
  }

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}


function getTrendScore(item) {
  const value =
    item?.safety_score ??
    item?.score ??
    item?.safetyScore ??
    item?.value ??
    0;

  return Number(value) || 0;
}


function getRiskLevelColor(level) {
  const normalized =
    String(level || "")
      .trim()
      .toUpperCase();

  if (
    normalized === "CRITICAL" ||
    normalized === "HIGH"
  ) {
    return {
      foreground: "#dc2626",
      background: "#fef2f2",
      dot: "#dc2626",
    };
  }

  if (
    normalized === "MEDIUM" ||
    normalized === "MODERATE"
  ) {
    return {
      foreground: "#d97706",
      background: "#fff7ed",
      dot: "#f59e0b",
    };
  }

  if (normalized === "LOW") {
    return {
      foreground: "#15803d",
      background: "#f0fdf4",
      dot: "#16a34a",
    };
  }

  return {
    foreground: "#64748b",
    background: "#f1f5f9",
    dot: "#94a3b8",
  };
}


/* =========================================================
   SAFETY STATUS
========================================================= */

function getSafetyStatus({
  safetyScore,
  incidents,
  criticalRisks,
  t,
}) {
  if (
    incidents > 0 ||
    criticalRisks > 0
  ) {
    return {
      label: translate(
        t,
        "safety.attentionRequired",
        "Attention Required"
      ),
      color: "#dc2626",
      lightColor: "#fef2f2",
      borderColor: "#fecaca",
      description:
        criticalRisks > 0
          ? `${criticalRisks} critical risk${
              criticalRisks === 1 ? "" : "s"
            } require${
              criticalRisks === 1 ? "s" : ""
            } immediate management attention.`
          : `${incidents} recordable incident${
              incidents === 1 ? "" : "s"
            } require management review.`,
    };
  }

  if (safetyScore >= SAFETY_SCORE_TARGET) {
    return {
      label: translate(
        t,
        "safety.controlled",
        "Controlled"
      ),
      color: "#16a34a",
      lightColor: "#f0fdf4",
      borderColor: "#bbf7d0",
      description: translate(
        t,
        "safety.statusDescriptionControlled",
        "Safety performance is at or above target."
      ),
    };
  }

  return {
    label: translate(
      t,
      "safety.monitor",
      "Monitor"
    ),
    color: "#f59e0b",
    lightColor: "#fffbeb",
    borderColor: "#fde68a",
    description: translate(
      t,
      "safety.statusDescriptionMonitor",
      "Safety performance is below target and should be monitored."
    ),
  };
}


/* =========================================================
   KPI CARD
========================================================= */

function SafetyMetricCard({
  eyebrow,
  title,
  value,
  suffix = "",
  subtitle,
  statusText,
  statusColor,
  color,
  icon,
  miniTrend = false,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid #dfe6ef",
        borderTop: `2px solid ${color}`,
        borderRadius: "12px",
        bgcolor: "#ffffff",
        boxShadow:
          "0 4px 14px rgba(15, 23, 42, 0.025)",
        overflow: "hidden",
      }}
    >
      <CardContent
        sx={{
          p: 2,
          "&:last-child": {
            pb: 2,
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1}
        >
          <Stack
            direction="row"
            spacing={1.1}
            alignItems="center"
          >
            <Box
              sx={{
                width: 37,
                height: 37,
                borderRadius: "10px",
                display: "grid",
                placeItems: "center",
                bgcolor: `${color}12`,
                color,
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>

            <Box>
              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: 8,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  lineHeight: 1.3,
                }}
              >
                {eyebrow}
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  color: "#334155",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {title}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-end"
          sx={{
            mt: 1.2,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "#0f172a",
                fontSize: {
                  xs: 29,
                  xl: 31,
                },
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-0.025em",
              }}
            >
              {value}
              {suffix}
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: "#64748b",
                fontSize: 9.5,
                fontWeight: 600,
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          {miniTrend && (
            <Box
              sx={{
                width: 75,
                height: 34,
                position: "relative",
              }}
            >
              <svg
                width="75"
                height="34"
                viewBox="0 0 75 34"
                aria-hidden="true"
              >
                <polyline
                  points="2,27 14,21 25,24 37,16 49,19 61,7 73,10"
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <circle
                  cx="73"
                  cy="10"
                  r="2.5"
                  fill={color}
                />
              </svg>
            </Box>
          )}
        </Stack>

        {statusText && (
          <Box
            sx={{
              mt: 1.4,
            }}
          >
            <Chip
              size="small"
              label={statusText}
              sx={{
                height: 23,
                borderRadius: "20px",
                bgcolor: `${statusColor}12`,
                color: statusColor,
                fontSize: 9,
                fontWeight: 800,
                "& .MuiChip-label": {
                  px: 1.1,
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}


/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  dotColor,
  label,
  value,
  secondaryValue,
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={1}
    >
      <Stack
        direction="row"
        spacing={0.8}
        alignItems="center"
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: dotColor,
            flexShrink: 0,
          }}
        />

        <Typography
          sx={{
            color: "#475569",
            fontSize: 9.5,
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Box
        sx={{
          textAlign: "right",
        }}
      >
        <Typography
          sx={{
            color: "#0f172a",
            fontSize: 10,
            fontWeight: 900,
          }}
        >
          {value}
        </Typography>

        {secondaryValue && (
          <Typography
            sx={{
              mt: 0.1,
              color: "#94a3b8",
              fontSize: 8,
              fontWeight: 700,
            }}
          >
            {secondaryValue}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}


/* =========================================================
   RISK ROW
========================================================= */

function RiskRow({
  label,
  level,
}) {
  const colors =
    getRiskLevelColor(level);

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        minHeight: 34,
        borderBottom:
          "1px solid #eef2f7",
      }}
    >
      <Typography
        sx={{
          flex: 1.25,
          color: "#0f172a",
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          flex: 0.9,
        }}
      >
        <Chip
          size="small"
          label={level}
          sx={{
            height: 20,
            borderRadius: "6px",
            bgcolor: colors.background,
            color: colors.foreground,
            fontSize: 8.5,
            fontWeight: 900,
            "& .MuiChip-label": {
              px: 1,
            },
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 0.8,
        }}
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: colors.dot,
          }}
        />

        <Box
          sx={{
            width: 40,
            height: 18,
          }}
        >
          <svg
            width="40"
            height="18"
            viewBox="0 0 40 18"
            aria-hidden="true"
          >
            <polyline
              points="1,14 7,12 12,13 18,8 24,12 30,10 39,6"
              fill="none"
              stroke={colors.dot}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>
      </Box>
    </Stack>
  );
}


/* =========================================================
   PRIORITY ACTION
========================================================= */

function PriorityAction({
  number,
  icon,
  iconColor,
  iconBackground,
  title,
  description,
  badge,
  badgeColor,
  badgeBackground,
  meta,
}) {
  return (
    <Box
      sx={{
        minHeight: 58,
        border: "1px solid #e5eaf1",
        borderRadius: "9px",
        display: "flex",
        alignItems: "center",
        px: 1.25,
        py: 0.8,
        bgcolor: "#ffffff",
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "8px",
          bgcolor: iconBackground,
          color: iconColor,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          fontSize: 15,
          fontWeight: 900,
        }}
      >
        {number}
      </Box>

      <Box
        sx={{
          ml: 0.8,
          width: 31,
          height: 31,
          borderRadius: "8px",
          bgcolor: iconBackground,
          color: iconColor,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box
        sx={{
          ml: 1.1,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            color: "#0f172a",
            fontSize: 10.5,
            lineHeight: 1.25,
            fontWeight: 900,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.25,
            color: "#64748b",
            fontSize: 8.5,
            lineHeight: 1.35,
          }}
        >
          {description}
        </Typography>
      </Box>

      <Box
        sx={{
          width: 100,
          ml: 1,
          flexShrink: 0,
        }}
      >
        <Chip
          size="small"
          label={badge}
          sx={{
            height: 20,
            borderRadius: "6px",
            bgcolor: badgeBackground,
            color: badgeColor,
            fontSize: 8,
            fontWeight: 900,
            "& .MuiChip-label": {
              px: 0.8,
            },
          }}
        />

        <Typography
          sx={{
            mt: 0.3,
            color: "#475569",
            fontSize: 8,
            fontWeight: 700,
          }}
        >
          {meta}
        </Typography>
      </Box>

      <FiArrowRight
        size={15}
        color="#475569"
      />
    </Box>
  );
}


/* =========================================================
   MAIN PAGE
========================================================= */

function Safety() {
  const { t } = useLanguage();

  const [today, setToday] =
    useState(null);

  const [trend, setTrend] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ---------------------------------------------------------
     LOAD DATA
  --------------------------------------------------------- */

  const loadSafety =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          todayData,
          trendData,
        ] = await Promise.all([
          getTodaySafety(),

          getSafetyTrend(
            TREND_PERIODS
          ),
        ]);

        setToday(todayData);

        setTrend(
          Array.isArray(trendData)
            ? trendData
            : trendData?.data ||
              trendData?.items ||
              []
        );
      } catch (requestError) {
        console.error(
          "Safety page load failed:",
          requestError
        );

        setError(
          requestError?.message ||
            translate(
              t,
              "safety.unableToLoad",
              "Unable to load safety data."
            )
        );
      } finally {
        setLoading(false);
      }
    }, [t]);


  useEffect(() => {
    loadSafety();
  }, [loadSafety]);


  /* ---------------------------------------------------------
     CURRENT KPI VALUES
  --------------------------------------------------------- */

  const safetyScore =
    Number(
      today?.safety_score || 0
    );

  const incidents =
    Number(
      today?.incidents || 0
    );

  const nearMisses =
    Number(
      today?.near_misses || 0
    );

  const criticalRisks =
    Number(
      today?.critical_risks || 0
    );


  /* ---------------------------------------------------------
     STATUS
  --------------------------------------------------------- */

  const status =
    useMemo(
      () =>
        getSafetyStatus({
          safetyScore,
          incidents,
          criticalRisks,
          t,
        }),
      [
        safetyScore,
        incidents,
        criticalRisks,
        t,
      ]
    );


  /* ---------------------------------------------------------
     SCORE DELTA
  --------------------------------------------------------- */

  const safetyScoreVariance =
    safetyScore -
    SAFETY_SCORE_TARGET;

  const safetyScoreVarianceAbs =
    Math.abs(
      safetyScoreVariance
    ).toFixed(1);


  /* ---------------------------------------------------------
     TREND SUMMARY
  --------------------------------------------------------- */

  const trendSummary =
    useMemo(() => {
      const values =
        trend
          .map(getTrendScore)
          .filter(
            (value) =>
              Number.isFinite(value) &&
              value > 0
          );

      if (!values.length) {
        return {
          atOrAboveTarget: 0,
          belowTarget: 0,
          average: 0,
          highest: 0,
          lowest: 0,
          lastSevenChange: 0,
          improving: false,
        };
      }

      const atOrAboveTarget =
        values.filter(
          (value) =>
            value >=
            SAFETY_SCORE_TARGET
        ).length;

      const belowTarget =
        values.length -
        atOrAboveTarget;

      const average =
        values.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / values.length;

      const highest =
        Math.max(...values);

      const lowest =
        Math.min(...values);

      const latestSeven =
        values.slice(-7);

      const previousSeven =
        values.slice(-14, -7);

      const latestSevenAverage =
        latestSeven.length
          ? latestSeven.reduce(
              (sum, value) =>
                sum + value,
              0
            ) /
            latestSeven.length
          : 0;

      const previousSevenAverage =
        previousSeven.length
          ? previousSeven.reduce(
              (sum, value) =>
                sum + value,
              0
            ) /
            previousSeven.length
          : latestSevenAverage;

      const lastSevenChange =
        previousSevenAverage
          ? latestSevenAverage -
            previousSevenAverage
          : 0;

      return {
        atOrAboveTarget,
        belowTarget,
        average,
        highest,
        lowest,
        lastSevenChange,
        improving:
          lastSevenChange >= 0,
      };
    }, [trend]);


  /* ---------------------------------------------------------
     RISK LEVELS
     Only Production, Equipment and Safety.
     Geotechnical / External intentionally removed.
  --------------------------------------------------------- */

  const safetyRiskLevel =
    criticalRisks > 0
      ? "HIGH"
      : incidents > 0
        ? "MEDIUM"
        : safetyScore <
            SAFETY_SCORE_TARGET
          ? "MEDIUM"
          : "LOW";

  const productionRiskLevel =
    String(
      today?.production_risk_level ||
        today?.production_risk ||
        "LOW"
    ).toUpperCase();

  const equipmentRiskLevel =
    String(
      today?.equipment_risk_level ||
        today?.equipment_risk ||
        "LOW"
    ).toUpperCase();


  const overallRiskLevel =
    criticalRisks > 0
      ? "HIGH"
      : incidents > 0
        ? "MEDIUM"
        : safetyScore <
            SAFETY_SCORE_TARGET
          ? "MEDIUM"
          : "LOW";


  const overallRiskColors =
    getRiskLevelColor(
      overallRiskLevel
    );


  /* ---------------------------------------------------------
     LOADING
  --------------------------------------------------------- */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 520,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Stack
          alignItems="center"
          spacing={1.5}
        >
          <CircularProgress
            size={32}
          />

          <Typography
            sx={{
              color: "#64748b",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Loading safety performance...
          </Typography>
        </Stack>
      </Box>
    );
  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Box
      sx={{
        width: "100%",
        px: {
          xs: 2,
          lg: 3,
        },
        pt: 2.1,
        pb: 1.5,
      }}
    >
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "stretch",
          md: "flex-start",
        }}
        spacing={2}
        sx={{
          mb: 1.5,
        }}
      >
        <Box>
          <Stack
            direction="row"
            spacing={0.8}
            alignItems="center"
          >
            <FiActivity
              size={12}
              color="#f97316"
            />

            <Typography
              sx={{
                color: "#f97316",
                fontSize: 8.5,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing:
                  "0.08em",
              }}
            >
              {translate(
                t,
                "safety.operationalIntelligence",
                "Operational Intelligence"
              )}
            </Typography>
          </Stack>

          <Typography
            component="h1"
            sx={{
              mt: 0.35,
              color: "#0f172a",
              fontSize: {
                xs: 24,
                xl: 27,
              },
              lineHeight: 1.15,
              fontWeight: 900,
              letterSpacing:
                "-0.025em",
            }}
          >
            {translate(
              t,
              "safety.safetyPerformance",
              "Safety Performance"
            )}
          </Typography>

          <Typography
            sx={{
              mt: 0.45,
              color: "#64748b",
              fontSize: 9.5,
            }}
          >
            Monitor safety performance,
            incidents, near misses, and
            critical risks.
          </Typography>
        </Box>


        <Stack
          direction="row"
          spacing={1}
          alignItems="stretch"
        >
          <Box
            sx={{
              minWidth: 138,
              px: 1.5,
              py: 0.9,
              border:
                "1px solid #dfe6ef",
              borderRadius: "9px",
              bgcolor: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <FiCalendar
              size={15}
              color="#2563eb"
            />

            <Box>
              <Typography
                sx={{
                  color: "#94a3b8",
                  fontSize: 7,
                  fontWeight: 900,
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.06em",
                }}
              >
                Reporting Date
              </Typography>

              <Typography
                sx={{
                  mt: 0.1,
                  color: "#0f172a",
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                {formatDate(
                  today?.report_date
                )}
              </Typography>
            </Box>
          </Box>


          <Button
            onClick={loadSafety}
            aria-label="Refresh safety data"
            sx={{
              minWidth: 39,
              width: 39,
              height: 39,
              mt: "auto",
              mb: "auto",
              p: 0,
              border:
                "1px solid #dfe6ef",
              borderRadius: "9px",
              bgcolor: "#ffffff",
              color: "#64748b",
              "&:hover": {
                bgcolor: "#f8fafc",
                borderColor:
                  "#cbd5e1",
              },
            }}
          >
            <FiRefreshCw
              size={15}
            />
          </Button>
        </Stack>
      </Stack>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 1.5,
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}


      {!error && (
        <>
          {/* =================================================
              EXECUTIVE SAFETY STATUS
          ================================================= */}

          <Card
            elevation={0}
            sx={{
              mb: 1.5,
              border:
                `1px solid ${status.borderColor}`,
              borderLeft:
                `3px solid ${status.color}`,
              borderRadius: "11px",
              bgcolor: "#ffffff",
              overflow: "hidden",
              boxShadow:
                "0 3px 12px rgba(15, 23, 42, 0.025)",
            }}
          >
            <CardContent
              sx={{
                px: 2,
                py: 1.55,
                "&:last-child": {
                  pb: 1.55,
                },
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  md: "row",
                }}
                alignItems={{
                  xs: "stretch",
                  md: "center",
                }}
                justifyContent="space-between"
                spacing={2}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 43,
                      height: 43,
                      borderRadius: "50%",
                      bgcolor:
                        status.lightColor,
                      color:
                        status.color,
                      display: "grid",
                      placeItems:
                        "center",
                      flexShrink: 0,
                      boxShadow:
                        `0 5px 14px ${status.color}18`,
                    }}
                  >
                    {criticalRisks >
                    0 ? (
                      <FiAlertTriangle
                        size={21}
                      />
                    ) : (
                      <FiShield
                        size={21}
                      />
                    )}
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        color:
                          "#64748b",
                        fontSize: 7.5,
                        fontWeight: 900,
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.07em",
                      }}
                    >
                      Safety Operating
                      Status
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.15,
                        color:
                          status.color,
                        fontSize: 18,
                        lineHeight: 1.2,
                        fontWeight: 900,
                      }}
                    >
                      {status.label}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        color:
                          "#64748b",
                        fontSize: 9,
                      }}
                    >
                      {
                        status.description
                      }
                    </Typography>
                  </Box>
                </Stack>


                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={3}
                >
                  <Box
                    sx={{
                      textAlign:
                        "center",
                      minWidth: 110,
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          status.color,
                        fontSize: 30,
                        lineHeight: 1,
                        fontWeight: 900,
                        letterSpacing:
                          "-0.03em",
                      }}
                    >
                      {safetyScore.toFixed(
                        1
                      )}
                      %
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.4,
                        color:
                          "#475569",
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      Safety Score
                    </Typography>
                  </Box>

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                      display: {
                        xs: "none",
                        md: "block",
                      },
                    }}
                  />

                  <Button
                    variant="outlined"
                    endIcon={
                      <FiArrowRight />
                    }
                    sx={{
                      minWidth: 136,
                      height: 37,
                      borderColor:
                        status.color,
                      color:
                        status.color,
                      borderRadius:
                        "8px",
                      textTransform:
                        "none",
                      fontSize: 9.5,
                      fontWeight: 900,
                      "&:hover": {
                        borderColor:
                          status.color,
                        bgcolor:
                          status.lightColor,
                      },
                    }}
                  >
                    Review Risks
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>


          {/* =================================================
              KPI CARDS
          ================================================= */}

          <Grid
            container
            spacing={1.5}
            sx={{
              mb: 1.5,
            }}
          >
            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
            >
              <SafetyMetricCard
                eyebrow="Safety Score"
                title="Safety Score"
                value={
                  safetyScore.toFixed(1)
                }
                suffix="%"
                subtitle={`Target ${SAFETY_SCORE_TARGET}%`}
                statusText={
                  safetyScoreVariance >= 0
                    ? `↑ ${safetyScoreVarianceAbs} pts above target`
                    : `↓ ${safetyScoreVarianceAbs} pts vs target`
                }
                statusColor={
                  safetyScoreVariance >= 0
                    ? "#16a34a"
                    : "#dc2626"
                }
                color={
                  safetyScoreVariance >= 0
                    ? "#16a34a"
                    : "#f59e0b"
                }
                icon={
                  <FiActivity />
                }
                miniTrend
              />
            </Grid>


            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
            >
              <SafetyMetricCard
                eyebrow="Safety KPI"
                title="Incidents"
                value={incidents}
                subtitle={
                  incidents === 0
                    ? "No recordable incidents"
                    : "Management review required"
                }
                statusText={
                  incidents === 0
                    ? "✓ On track"
                    : "Action required"
                }
                statusColor={
                  incidents === 0
                    ? "#16a34a"
                    : "#dc2626"
                }
                color={
                  incidents === 0
                    ? "#16a34a"
                    : "#dc2626"
                }
                icon={
                  incidents === 0
                    ? (
                      <FiClipboard />
                    )
                    : (
                      <FiAlertTriangle />
                    )
                }
              />
            </Grid>


            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
            >
              <SafetyMetricCard
                eyebrow="Leading Indicator"
                title="Near Misses"
                value={nearMisses}
                subtitle={
                  nearMisses === 0
                    ? "No near misses reported"
                    : "Review and learn"
                }
                statusText={
                  nearMisses === 0
                    ? "✓ Controlled"
                    : "↑ Leading indicator"
                }
                statusColor={
                  nearMisses === 0
                    ? "#16a34a"
                    : "#f97316"
                }
                color={
                  nearMisses === 0
                    ? "#16a34a"
                    : "#f97316"
                }
                icon={
                  <FiUsers />
                }
              />
            </Grid>


            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
            >
              <SafetyMetricCard
                eyebrow="Critical Control"
                title="Critical Risks"
                value={
                  criticalRisks
                }
                subtitle={
                  criticalRisks === 0
                    ? "No open critical risks"
                    : "Immediate attention required"
                }
                statusText={
                  criticalRisks === 0
                    ? "✓ Controlled"
                    : "⚠ Action required"
                }
                statusColor={
                  criticalRisks === 0
                    ? "#16a34a"
                    : "#dc2626"
                }
                color={
                  criticalRisks === 0
                    ? "#16a34a"
                    : "#dc2626"
                }
                icon={
                  criticalRisks === 0
                    ? (
                      <FiCheckCircle />
                    )
                    : (
                      <FiAlertTriangle />
                    )
                }
              />
            </Grid>
          </Grid>


          {/* =================================================
              TREND + 30 PERIOD SUMMARY
          ================================================= */}

          <Grid
            container
            spacing={1.5}
            sx={{
              mb: 1.5,
            }}
          >
            {/* TREND */}

            <Grid
              size={{
                xs: 12,
                xl: 9.25,
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  "& > *": {
                    height: "100%",
                  },
                }}
              >
                <SafetyTrendChart
                  data={trend}
                  safetyScoreTarget={
                    SAFETY_SCORE_TARGET
                  }
                  t={t}
                />
              </Box>
            </Grid>


            {/* SUMMARY */}

            <Grid
              size={{
                xs: 12,
                xl: 2.75,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  minHeight: 330,
                  border:
                    "1px solid #dfe6ef",
                  borderRadius:
                    "11px",
                  bgcolor:
                    "#ffffff",
                  boxShadow:
                    "0 3px 12px rgba(15, 23, 42, 0.025)",
                }}
              >
                <CardContent
                  sx={{
                    p: 1.8,
                    "&:last-child": {
                      pb: 1.8,
                    },
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "#0f172a",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    30-Period Safety
                    Summary
                  </Typography>

                  <Stack
                    spacing={1.35}
                    sx={{
                      mt: 1.7,
                    }}
                  >
                    <SummaryRow
                      dotColor="#16a34a"
                      label="Periods at / above target"
                      value={`${trendSummary.atOrAboveTarget} periods`}
                      secondaryValue={
                        trend.length
                          ? `${(
                              (trendSummary.atOrAboveTarget /
                                trend.length) *
                              100
                            ).toFixed(
                              0
                            )}%`
                          : "0%"
                      }
                    />

                    <SummaryRow
                      dotColor="#dc2626"
                      label="Periods below target"
                      value={`${trendSummary.belowTarget} periods`}
                      secondaryValue={
                        trend.length
                          ? `${(
                              (trendSummary.belowTarget /
                                trend.length) *
                              100
                            ).toFixed(
                              0
                            )}%`
                          : "0%"
                      }
                    />

                    <SummaryRow
                      dotColor="#2563eb"
                      label="Average safety score"
                      value={`${trendSummary.average.toFixed(
                        1
                      )}%`}
                    />
                  </Stack>

                  <Divider
                    sx={{
                      my: 1.6,
                    }}
                  />

                  <Stack
                    spacing={1.15}
                  >
                    <SummaryRow
                      dotColor="#cbd5e1"
                      label="Highest score"
                      value={`${trendSummary.highest.toFixed(
                        1
                      )}%`}
                    />

                    <SummaryRow
                      dotColor="#cbd5e1"
                      label="Lowest score"
                      value={`${trendSummary.lowest.toFixed(
                        1
                      )}%`}
                    />
                  </Stack>


                  {/* LAST 7 PERIOD */}

                  <Box
                    sx={{
                      mt: 1.8,
                      p: 1.5,
                      borderRadius:
                        "10px",
                      border:
                        trendSummary.improving
                          ? "1px solid #bbf7d0"
                          : "1px solid #fecaca",
                      bgcolor:
                        trendSummary.improving
                          ? "#f0fdf4"
                          : "#fef2f2",
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          trendSummary.improving
                            ? "#15803d"
                            : "#b91c1c",
                        fontSize: 7.5,
                        fontWeight: 900,
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.06em",
                      }}
                    >
                      Last 7-Period Trend
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1.1}
                      alignItems="center"
                      sx={{
                        mt: 0.8,
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius:
                            "50%",
                          bgcolor:
                            trendSummary.improving
                              ? "#16a34a"
                              : "#dc2626",
                          color:
                            "#ffffff",
                          display:
                            "grid",
                          placeItems:
                            "center",
                          flexShrink: 0,
                        }}
                      >
                        {trendSummary.improving ? (
                          <FiArrowUpRight
                            size={19}
                          />
                        ) : (
                          <FiArrowDownRight
                            size={19}
                          />
                        )}
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            color:
                              trendSummary.improving
                                ? "#15803d"
                                : "#b91c1c",
                            fontSize: 15,
                            fontWeight:
                              900,
                          }}
                        >
                          {trendSummary.improving
                            ? "Improving"
                            : "Declining"}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.15,
                            color:
                              "#64748b",
                            fontSize: 8,
                            lineHeight:
                              1.35,
                          }}
                        >
                          Safety score
                          compared with
                          the previous
                          seven periods.
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography
                      sx={{
                        mt: 0.9,
                        color:
                          trendSummary.improving
                            ? "#16a34a"
                            : "#dc2626",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {trendSummary.lastSevenChange >=
                      0
                        ? "+"
                        : ""}
                      {trendSummary.lastSevenChange.toFixed(
                        1
                      )}
                      pts
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>


          {/* =================================================
              RISK HEAT MAP + PRIORITY ACTIONS
          ================================================= */}

          <Grid
            container
            spacing={1.5}
          >
            {/* SAFETY RISK HEAT MAP */}

            <Grid
              size={{
                xs: 12,
                lg: 5,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  border:
                    "1px solid #dfe6ef",
                  borderRadius:
                    "11px",
                  bgcolor:
                    "#ffffff",
                  boxShadow:
                    "0 3px 12px rgba(15, 23, 42, 0.025)",
                }}
              >
                <CardContent
                  sx={{
                    p: 1.7,
                    "&:last-child": {
                      pb: 1.7,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0.7}
                    alignItems="center"
                  >
                    <Typography
                      sx={{
                        color:
                          "#0f172a",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      Safety Risk Heat
                      Map
                    </Typography>

                    <Box
                      sx={{
                        width: 15,
                        height: 15,
                        borderRadius:
                          "50%",
                        border:
                          "1px solid #94a3b8",
                        color:
                          "#64748b",
                        display:
                          "grid",
                        placeItems:
                          "center",
                        fontSize: 8,
                        fontWeight:
                          900,
                      }}
                    >
                      i
                    </Box>
                  </Stack>


                  <Grid
                    container
                    spacing={1.5}
                    sx={{
                      mt: 0.8,
                    }}
                  >
                    <Grid
                      size={{
                        xs: 12,
                        md: 7,
                      }}
                    >
                      <Stack
                        direction="row"
                        sx={{
                          pb: 0.6,
                          borderBottom:
                            "1px solid #e2e8f0",
                        }}
                      >
                        <Typography
                          sx={{
                            flex: 1.25,
                            color:
                              "#64748b",
                            fontSize:
                              7.5,
                            fontWeight:
                              900,
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Category
                        </Typography>

                        <Typography
                          sx={{
                            flex: 0.9,
                            color:
                              "#64748b",
                            fontSize:
                              7.5,
                            fontWeight:
                              900,
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Risk Level
                        </Typography>

                        <Typography
                          sx={{
                            flex: 0.5,
                            color:
                              "#64748b",
                            fontSize:
                              7.5,
                            fontWeight:
                              900,
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Trend
                        </Typography>
                      </Stack>

                      <RiskRow
                        label="Production"
                        level={
                          productionRiskLevel
                        }
                      />

                      <RiskRow
                        label="Equipment"
                        level={
                          equipmentRiskLevel
                        }
                      />

                      <RiskRow
                        label="Safety"
                        level={
                          safetyRiskLevel
                        }
                      />
                    </Grid>


                    <Grid
                      size={{
                        xs: 12,
                        md: 5,
                      }}
                    >
                      <Box
                        sx={{
                          height:
                            "100%",
                          minHeight: 135,
                          border:
                            "1px solid #e5eaf1",
                          borderRadius:
                            "9px",
                          p: 1.4,
                          bgcolor:
                            "#fbfdff",
                        }}
                      >
                        <Typography
                          sx={{
                            color:
                              "#64748b",
                            fontSize:
                              7.5,
                            fontWeight:
                              900,
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Overall Risk
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.4,
                            color:
                              overallRiskColors.foreground,
                            fontSize: 24,
                            fontWeight:
                              900,
                            lineHeight: 1,
                          }}
                        >
                          {
                            overallRiskLevel
                          }
                        </Typography>

                        <Divider
                          sx={{
                            my: 1.2,
                          }}
                        />

                        <Stack
                          spacing={1}
                        >
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                          >
                            <FiShield
                              size={14}
                              color="#475569"
                            />

                            <Typography
                              sx={{
                                color:
                                  "#334155",
                                fontSize:
                                  9,
                                fontWeight:
                                  800,
                              }}
                            >
                              {
                                criticalRisks
                              }{" "}
                              Open Critical
                              Risk
                              {criticalRisks ===
                              1
                                ? ""
                                : "s"}
                            </Typography>
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                          >
                            <FiTarget
                              size={14}
                              color="#475569"
                            />

                            <Typography
                              sx={{
                                color:
                                  "#334155",
                                fontSize:
                                  9,
                                fontWeight:
                                  800,
                              }}
                            >
                              Target{" "}
                              {
                                SAFETY_SCORE_TARGET
                              }
                              %
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>


            {/* PRIORITY ACTIONS */}

            <Grid
              size={{
                xs: 12,
                lg: 7,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  border:
                    "1px solid #dfe6ef",
                  borderRadius:
                    "11px",
                  bgcolor:
                    "#ffffff",
                  boxShadow:
                    "0 3px 12px rgba(15, 23, 42, 0.025)",
                }}
              >
                <CardContent
                  sx={{
                    p: 1.7,
                    "&:last-child": {
                      pb: 1.7,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0.7}
                    alignItems="center"
                  >
                    <Typography
                      sx={{
                        color:
                          "#0f172a",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      Priority Actions
                    </Typography>

                    <Box
                      sx={{
                        width: 15,
                        height: 15,
                        borderRadius:
                          "50%",
                        border:
                          "1px solid #94a3b8",
                        color:
                          "#64748b",
                        display:
                          "grid",
                        placeItems:
                          "center",
                        fontSize: 8,
                        fontWeight:
                          900,
                      }}
                    >
                      i
                    </Box>
                  </Stack>


                  <Stack
                    spacing={0.7}
                    sx={{
                      mt: 1.15,
                    }}
                  >
                    <PriorityAction
                      number="01"
                      icon={
                        <FiAlertTriangle />
                      }
                      iconColor="#dc2626"
                      iconBackground="#fef2f2"
                      title="Review outstanding critical risk"
                      description="Confirm responsible owner, mitigation controls and agreed closure date."
                      badge="High Priority"
                      badgeColor="#dc2626"
                      badgeBackground="#fef2f2"
                      meta="Due Today"
                    />

                    <PriorityAction
                      number="02"
                      icon={
                        <FiUsers />
                      }
                      iconColor="#f97316"
                      iconBackground="#fff7ed"
                      title="Investigate near-miss pattern"
                      description="Review recent near-miss events and identify recurring causes or control weaknesses."
                      badge="Medium Priority"
                      badgeColor="#ea580c"
                      badgeBackground="#fff7ed"
                      meta="HSE"
                    />

                    <PriorityAction
                      number="03"
                      icon={
                        <FiCheck />
                      }
                      iconColor="#2563eb"
                      iconBackground="#eff6ff"
                      title="Verify critical controls"
                      description="Confirm critical safety controls remain effective and evidence is current."
                      badge="Verification"
                      badgeColor="#2563eb"
                      badgeBackground="#eff6ff"
                      meta="Current Period"
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>


          {/* =================================================
              FOOTER
          ================================================= */}

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            spacing={1}
            sx={{
              mt: 1.3,
              px: 0.7,
            }}
          >
            <Stack
              direction="row"
              spacing={0.7}
              alignItems="center"
            >
              <FiDatabase
                size={10}
                color="#64748b"
              />

              <Typography
                sx={{
                  color: "#94a3b8",
                  fontSize: 7.5,
                }}
              >
                Data: Safety operational
                report
                {"  •  "}
                Last updated:{" "}
                {formatDate(
                  today?.report_date
                )}
              </Typography>
            </Stack>

            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 7.5,
              }}
            >
              Timezone:
              Asia/Ulaanbaatar
            </Typography>
          </Stack>
        </>
      )}
    </Box>
  );
}


export default Safety;