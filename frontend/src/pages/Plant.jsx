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
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  FiActivity,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";

import PlantTrendChart
  from "../components/PlantTrendChart";

import {
  getPlantTrend,
  getTodayPlant,
} from "../api/plantApi";


function getStatus(value) {
  if (value >= 95) {
    return "Healthy";
  }

  if (value >= 85) {
    return "Attention Required";
  }

  return "Critical";
}


function getTone(value) {
  if (value >= 95) {
    return "#16a34a";
  }

  if (value >= 85) {
    return "#f59e0b";
  }

  return "#dc2626";
}


function MetricCard({
  title,
  value,
  target,
  suffix = "%",
  icon,
}) {
  const tone =
    getTone(
      suffix === "%"
        ? value
        : 100
    );

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border:
          "1px solid #e2e8f0",
        borderTop:
          `3px solid ${tone}`,
        borderRadius: 3,
      }}
    >
      <CardContent
        sx={{
          p: 1.75,
          "&:last-child": {
            pb: 1.75,
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
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
              Plant KPI
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
              color: tone,
            }}
          >
            {icon}
          </Box>
        </Stack>

        <Typography
          sx={{
            mt: 1.1,
            color: "#0f172a",
            fontSize: 26,
            fontWeight: 900,
          }}
        >
          {Number(value || 0).toFixed(1)}
          {suffix}
        </Typography>

        {target !== undefined && (
          <>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mt: 0.8 }}
            >
              <Typography
                sx={{
                  fontSize: 9,
                  color: "#64748b",
                }}
              >
                Target
              </Typography>

              <Typography
                sx={{
                  fontSize: 9,
                  color: "#334155",
                  fontWeight: 800,
                }}
              >
                {Number(target).toFixed(1)}
                {suffix}
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={
                Math.min(
                  Math.max(
                    (
                      Number(value || 0) /
                      Number(target || 1)
                    ) * 100,
                    0
                  ),
                  100
                )
              }
              sx={{
                mt: 0.6,
                height: 5,
                borderRadius: 99,
                bgcolor: "#e2e8f0",
                "& .MuiLinearProgress-bar": {
                  bgcolor: tone,
                },
              }}
            />
          </>
        )}

        <Typography
          sx={{
            mt: 0.9,
            fontSize: 9,
            color: tone,
            fontWeight: 900,
          }}
        >
          {getStatus(
            suffix === "%"
              ? value
              : 100
          )}
        </Typography>
      </CardContent>
    </Card>
  );
}


function Plant() {
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


  const loadPlant =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          todayData,
          trendData,
        ] = await Promise.all([
          getTodayPlant(
            mineName
          ),
          getPlantTrend(
            mineName,
            30
          ),
        ]);

        setToday(todayData);
        setTrend(trendData);
      } catch (requestError) {
        console.error(
          "Plant page load failed:",
          requestError
        );

        setError(
          requestError?.message ||
            "Unable to load plant analytics."
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadPlant();
  }, [loadPlant]);


  const plantPerformance =
    useMemo(
      () =>
        Number(
          today?.plant_performance ||
            0
        ),
      [
        today?.plant_performance,
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
            Plant Performance
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              color: "#64748b",
              fontSize: 10,
            }}
          >
            Throughput and recovery performance
            against operating targets.
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
            onClick={loadPlant}
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
                `4px solid ${getTone(
                  plantPerformance
                )}`,
              borderRadius: 3,
            }}
          >
            <CardContent
              sx={{
                p: 1.75,
                "&:last-child": {
                  pb: 1.75,
                },
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
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
                    Plant Operating Status
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,
                      color: "#0f172a",
                      fontSize: 21,
                      fontWeight: 900,
                    }}
                  >
                    {getStatus(
                      plantPerformance
                    )}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,
                      color: "#64748b",
                      fontSize: 10,
                    }}
                  >
                    Combined throughput
                    and recovery performance.
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color:
                      getTone(
                        plantPerformance
                      ),
                    fontSize: 28,
                    fontWeight: 900,
                  }}
                >
                  {plantPerformance.toFixed(
                    1
                  )}
                  %
                </Typography>
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
                md: 4,
              }}
            >
              <MetricCard
                title="Throughput Performance"
                value={
                  Number(
                    today?.throughput_performance ||
                      0
                  )
                }
                target={100}
                icon={
                  <FiTrendingUp />
                }
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <MetricCard
                title="Recovery"
                value={
                  Number(
                    today?.recovery ||
                      0
                  )
                }
                target={90}
                icon={
                  <FiActivity />
                }
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <MetricCard
                title="Plant Performance"
                value={
                  plantPerformance
                }
                target={95}
                icon={
                  <FiTarget />
                }
              />
            </Grid>
          </Grid>

          <PlantTrendChart
            data={trend}
            recoveryTarget={90}
          />
        </>
      )}
    </Box>
  );
}


export default Plant;