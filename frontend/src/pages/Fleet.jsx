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
  FiTruck,
} from "react-icons/fi";

import FleetTrendChart
  from "../components/FleetTrendChart";

import {
  getFleetTrend,
  getTodayFleet,
} from "../api/fleetApi";


function getStatus(value) {
  if (value >= 90) {
    return "Healthy";
  }

  if (value >= 80) {
    return "Attention Required";
  }

  return "Critical";
}


function getTone(value) {
  if (value >= 90) {
    return "#16a34a";
  }

  if (value >= 80) {
    return "#f59e0b";
  }

  return "#dc2626";
}


function MetricCard({
  title,
  value,
  target = 90,
  icon,
}) {
  const tone =
    getTone(value);

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
              Fleet KPI
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
          {Number(value || 0).toFixed(1)}%
        </Typography>


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
            {target.toFixed(1)}%
          </Typography>
        </Stack>


        <LinearProgress
          variant="determinate"
          value={
            Math.min(
              Math.max(value, 0),
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


        <Typography
          sx={{
            mt: 0.9,
            fontSize: 9,
            color: tone,
            fontWeight: 900,
          }}
        >
          {getStatus(value)}
        </Typography>
      </CardContent>
    </Card>
  );
}


function Fleet() {
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


  const loadFleet =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          todayData,
          trendData,
        ] = await Promise.all([
          getTodayFleet(
            mineName
          ),
          getFleetTrend(
            mineName,
            30
          ),
        ]);

        setToday(todayData);
        setTrend(trendData);
      } catch (requestError) {
        console.error(
          "Fleet page load failed:",
          requestError
        );

        setError(
          requestError?.message ||
            "Unable to load fleet analytics."
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadFleet();
  }, [loadFleet]);


  const fleetPerformance =
    useMemo(
      () =>
        Number(
          today?.fleet_performance ||
            0
        ),
      [
        today?.fleet_performance,
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
            Fleet Performance
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              color: "#64748b",
              fontSize: 10,
            }}
          >
            Availability and utilization
            performance across the operating fleet.
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
            onClick={loadFleet}
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
                  fleetPerformance
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
                    Fleet Operating Status
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
                      fleetPerformance
                    )}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,
                      color: "#64748b",
                      fontSize: 10,
                    }}
                  >
                    Combined availability
                    and utilization performance.
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color:
                      getTone(
                        fleetPerformance
                      ),
                    fontSize: 28,
                    fontWeight: 900,
                  }}
                >
                  {fleetPerformance.toFixed(
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
                title="Availability"
                value={
                  Number(
                    today?.availability ||
                      0
                  )
                }
                icon={
                  <FiTruck />
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
                title="Utilization"
                value={
                  Number(
                    today?.utilization ||
                      0
                  )
                }
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
                title="Fleet Performance"
                value={
                  fleetPerformance
                }
                icon={
                  <FiTarget />
                }
              />
            </Grid>
          </Grid>


          <FleetTrendChart
            data={trend}
            target={90}
          />
        </>
      )}
    </Box>
  );
}


export default Fleet;