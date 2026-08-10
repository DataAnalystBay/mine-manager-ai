import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";

import SafetyTrendChart
  from "../components/SafetyTrendChart";

import {
  getSafetyTrend,
  getTodaySafety,
} from "../api/safetyApi";


const SAFETY_SCORE_TARGET = 95;


function getSafetyStatus({
  safetyScore,
  incidents,
  criticalRisks,
}) {
  if (
    incidents > 0 ||
    criticalRisks > 0
  ) {
    return {
      label: "Attention Required",
      color: "#dc2626",
      description:
        "A recordable incident or critical risk requires management attention.",
    };
  }

  if (
    safetyScore >=
    SAFETY_SCORE_TARGET
  ) {
    return {
      label: "Controlled",
      color: "#16a34a",
      description:
        "Safety performance is controlled with no current recordable incidents or critical risks.",
    };
  }

  return {
    label: "Monitor",
    color: "#f59e0b",
    description:
      "No current incidents or critical risks, but the Safety Score is below target.",
  };
}


function SafetyMetricCard({
  eyebrow,
  title,
  value,
  suffix = "",
  subtitle,
  color,
  icon,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border:
          "1px solid #e2e8f0",
        borderTop:
          `3px solid ${color}`,
        borderRadius: 3,
      }}
    >
      <CardContent
        sx={{
          p: 1.65,
          "&:last-child": {
            pb: 1.65,
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 8,
                fontWeight: 900,
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.08em",
              }}
            >
              {eyebrow}
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                color: "#334155",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {title}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 32,
              height: 32,
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              bgcolor: "#f8fafc",
              color,
            }}
          >
            {icon}
          </Box>
        </Stack>

        <Typography
          sx={{
            mt: 1,
            color: "#0f172a",
            fontSize: 26,
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          {value}
          {suffix}
        </Typography>

        <Typography
          sx={{
            mt: 0.8,
            color,
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}


function Safety() {
  const [today, setToday] =
    useState(null);

  const [trend, setTrend] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const mineName =
    "Oyu Tolgoi Surface";


  const loadSafety =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          todayData,
          trendData,
        ] = await Promise.all([
          getTodaySafety(
            mineName
          ),
          getSafetyTrend(
            mineName,
            30
          ),
        ]);

        setToday(todayData);
        setTrend(trendData);
      } catch (requestError) {
        console.error(
          "Safety page load failed:",
          requestError
        );

        setError(
          requestError?.message ||
            "Unable to load safety analytics."
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadSafety();
  }, [loadSafety]);


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


  const status =
    useMemo(
      () =>
        getSafetyStatus({
          safetyScore,
          incidents,
          criticalRisks,
        }),
      [
        safetyScore,
        incidents,
        criticalRisks,
      ]
    );


  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 420,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }


  return (
    <Box
      sx={{
        width: "100%",
        px: 3,
        py: 1.5,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Typography
            sx={{
              color: "#2563eb",
              fontSize: 9,
              fontWeight: 900,
              textTransform:
                "uppercase",
              letterSpacing:
                "0.08em",
            }}
          >
            Operational Intelligence
          </Typography>

          <Typography
            component="h1"
            sx={{
              mt: 0.25,
              color: "#0f172a",
              fontSize: 25,
              fontWeight: 900,
            }}
          >
            Safety Performance
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              color: "#64748b",
              fontSize: 10,
            }}
          >
            Safety score, incidents,
            near misses, and critical
            risk performance.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Box
            sx={{
              px: 1.5,
              py: 0.8,
              border:
                "1px solid #e2e8f0",
              borderRadius: 2,
              bgcolor: "#ffffff",
            }}
          >
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 7,
                fontWeight: 900,
                textTransform:
                  "uppercase",
              }}
            >
              Reporting Date
            </Typography>

            <Typography
              sx={{
                color: "#0f172a",
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {today?.report_date ||
                "Unavailable"}
            </Typography>
          </Box>

          <Box
            component="button"
            type="button"
            onClick={loadSafety}
            sx={{
              width: 38,
              height: 38,
              border:
                "1px solid #e2e8f0",
              borderRadius: 2,
              bgcolor: "#ffffff",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <FiRefreshCw />
          </Box>
        </Stack>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {!error && (
        <>
          <Card
            elevation={0}
            sx={{
              mb: 1.5,
              border:
                "1px solid #e2e8f0",
              borderTop:
                `4px solid ${status.color}`,
              borderRadius: 3,
            }}
          >
            <CardContent
              sx={{
                p: 1.65,
                "&:last-child": {
                  pb: 1.65,
                },
              }}
            >
              <Stack
                direction="row"
                justifyContent=
                  "space-between"
                alignItems="center"
              >
                <Box>
                  <Typography
                    sx={{
                      color: "#64748b",
                      fontSize: 8,
                      fontWeight: 900,
                      textTransform:
                        "uppercase",
                    }}
                  >
                    Safety Operating Status
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,
                      color: "#0f172a",
                      fontSize: 21,
                      fontWeight: 900,
                    }}
                  >
                    {status.label}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,
                      color: "#64748b",
                      fontSize: 10,
                    }}
                  >
                    {status.description}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color:
                      status.color,
                  }}
                >
                  <FiShield
                    size={24}
                  />

                  <Typography
                    sx={{
                      fontSize: 28,
                      fontWeight: 900,
                    }}
                  >
                    {safetyScore.toFixed(
                      1
                    )}
                    %
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Grid
            container
            spacing={1.5}
            sx={{ mb: 1.5 }}
          >
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <SafetyMetricCard
                eyebrow="Safety KPI"
                title="Safety Score"
                value={
                  safetyScore.toFixed(1)
                }
                suffix="%"
                subtitle={
                  safetyScore >=
                  SAFETY_SCORE_TARGET
                    ? "At / above target"
                    : `Target ${SAFETY_SCORE_TARGET}%`
                }
                color={
                  safetyScore >=
                  SAFETY_SCORE_TARGET
                    ? "#16a34a"
                    : "#f59e0b"
                }
                icon={
                  <FiActivity />
                }
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <SafetyMetricCard
                eyebrow="Safety KPI"
                title="Incidents"
                value={incidents}
                subtitle={
                  incidents === 0
                    ? "No recordable incidents"
                    : "Management attention required"
                }
                color={
                  incidents === 0
                    ? "#16a34a"
                    : "#dc2626"
                }
                icon={
                  incidents === 0
                    ? <FiCheckCircle />
                    : <FiAlertTriangle />
                }
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
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
                color={
                  nearMisses === 0
                    ? "#16a34a"
                    : "#f59e0b"
                }
                icon={
                  <FiActivity />
                }
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <SafetyMetricCard
                eyebrow="Critical Control"
                title="Critical Risks"
                value={criticalRisks}
                subtitle={
                  criticalRisks === 0
                    ? "No open critical risks"
                    : "Immediate attention required"
                }
                color={
                  criticalRisks === 0
                    ? "#16a34a"
                    : "#dc2626"
                }
                icon={
                  criticalRisks === 0
                    ? <FiCheckCircle />
                    : <FiAlertTriangle />
                }
              />
            </Grid>
          </Grid>

          <SafetyTrendChart
            data={trend}
            safetyScoreTarget={
              SAFETY_SCORE_TARGET
            }
          />
        </>
      )}
    </Box>
  );
}


export default Safety;