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
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  FiActivity,
  FiCheckCircle,
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

import { useLanguage } from "../context/LanguageContext";


function getTone(value) {
  const number = Number(value || 0);

  if (number >= 95) {
    return "#16a34a";
  }

  if (number >= 85) {
    return "#f59e0b";
  }

  return "#dc2626";
}


function getStatus(value) {
  const number = Number(value || 0);

  if (number >= 95) {
    return "Healthy";
  }

  if (number >= 85) {
    return "Attention Required";
  }

  return "Critical";
}


function MetricCard({
  eyebrow,
  title,
  value,
  target,
  icon,
}) {
  const numericValue = Number(value || 0);
  const numericTarget = Number(target || 100);
  const tone = getTone(numericValue);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid #e2e8f0",
        borderTop: `3px solid ${tone}`,
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
          alignItems="flex-start"
        >
          <Box>
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 8,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
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
          {numericValue.toFixed(1)}%
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
            {numericTarget.toFixed(1)}%
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={
            Math.min(
              Math.max(
                (numericValue /
                  Math.max(numericTarget, 1)) *
                  100,
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

        <Typography
          sx={{
            mt: 0.9,
            fontSize: 9,
            color: tone,
            fontWeight: 900,
          }}
        >
          {getStatus(numericValue)}
        </Typography>
      </CardContent>
    </Card>
  );
}


function NotApplicableState({
  today,
  onRefresh,
}) {
  return (
    <Box>
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          md: "center",
        }}
        spacing={1.5}
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography
              sx={{
                color: "#2563eb",
                fontSize: 9,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Fleet Intelligence
            </Typography>

            <Chip
              label="SX-EW Copper Operation"
              size="small"
              sx={{
                height: 22,
                bgcolor: "#ecfdf5",
                color: "#047857",
                fontSize: 8,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            />
          </Stack>

          <Typography
            component="h1"
            sx={{
              mt: 0.35,
              color: "#0f172a",
              fontSize: 25,
              fontWeight: 900,
            }}
          >
            Fleet Analytics
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              color: "#64748b",
              fontSize: 10,
            }}
          >
            Fleet performance is not part of the configured
            KPI model for this operation.
          </Typography>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={onRefresh}
          aria-label="Refresh Fleet"
          sx={{
            width: 38,
            height: 38,
            border: "1px solid #e2e8f0",
            borderRadius: 2,
            bgcolor: "#ffffff",
            color: "#475569",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <FiRefreshCw />
        </Box>
      </Stack>

      <Card
        elevation={0}
        sx={{
          border: "1px solid #dbeafe",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: 4,
            bgcolor: "#2563eb",
          }}
        />

        <CardContent
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
            "&:last-child": {
              pb: {
                xs: 2,
                md: 3,
              },
            },
          }}
        >
          <Grid
            container
            spacing={3}
            alignItems="stretch"
          >
            <Grid
              size={{
                xs: 12,
                md: 7,
              }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    flex: "0 0 auto",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 2.5,
                    bgcolor: "#eff6ff",
                    color: "#2563eb",
                    fontSize: 20,
                  }}
                >
                  <FiTruck />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#0f172a",
                      fontSize: 18,
                      fontWeight: 900,
                    }}
                  >
                    Fleet analytics are not enabled
                    for this operation
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.7,
                      maxWidth: 650,
                      color: "#64748b",
                      fontSize: 11,
                      lineHeight: 1.7,
                    }}
                  >
                    {today?.not_applicable_reason ||
                      "No Fleet dataset is currently configured for this operation profile."}
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  mt: 2.5,
                  p: 1.75,
                  border: "1px solid #e2e8f0",
                  borderRadius: 2.5,
                  bgcolor: "#f8fafc",
                }}
              >
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 8,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Active operation
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    color: "#0f172a",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  {today?.mine_name ||
                    "Achit-Ikht Copper Cathode Operation"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    color: "#64748b",
                    fontSize: 10,
                  }}
                >
                  {today?.company_name ||
                    "Achit-Ikht LLC"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    color: "#64748b",
                    fontSize: 10,
                  }}
                >
                  {today?.mine_type ||
                    "Processing Plant / SX-EW"}
                </Typography>
              </Box>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 5,
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  p: 2,
                  border: "1px solid #e2e8f0",
                  borderRadius: 2.5,
                  bgcolor: "#ffffff",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography
                    sx={{
                      color: "#64748b",
                      fontSize: 9,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Module status
                  </Typography>

                  <Chip
                    label="Not Applicable"
                    size="small"
                    sx={{
                      height: 22,
                      bgcolor: "#f1f5f9",
                      color: "#475569",
                      fontSize: 8,
                      fontWeight: 900,
                      textTransform: "uppercase",
                    }}
                  />
                </Stack>

                <Typography
                  sx={{
                    mt: 2,
                    color: "#0f172a",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  Relevant operational intelligence
                </Typography>

                <Stack
                  spacing={1.15}
                  sx={{ mt: 1.5 }}
                >
                  {[
                    "Cathode Production",
                    "Process Plant",
                    "Cu Recovery",
                    "Safety",
                  ].map((label) => (
                    <Stack
                      key={label}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Box
                        sx={{
                          color: "#16a34a",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <FiCheckCircle />
                      </Box>

                      <Typography
                        sx={{
                          color: "#334155",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Box
                  sx={{
                    mt: 2,
                    pt: 1.5,
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Typography
                      sx={{
                        color: "#64748b",
                        fontSize: 10,
                      }}
                    >
                      Fleet
                    </Typography>

                    <Typography
                      sx={{
                        color: "#94a3b8",
                        fontSize: 9,
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      Not Applicable
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ mt: 1 }}
                  >
                    <Typography
                      sx={{
                        color: "#64748b",
                        fontSize: 10,
                      }}
                    >
                      Waste Movement
                    </Typography>

                    <Typography
                      sx={{
                        color: "#94a3b8",
                        fontSize: 9,
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      Not Applicable
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Alert
            severity="info"
            sx={{
              mt: 2.5,
              borderRadius: 2,
              fontSize: 10,
            }}
          >
            Fleet analytics can be enabled later if this
            customer provides applicable mobile-equipment,
            maintenance, availability, or utilization data.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}


function Fleet() {
  const { t } = useLanguage();

  const [today, setToday] =
    useState(null);

  const [trend, setTrend] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadFleet =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          todayData,
          trendData,
        ] = await Promise.all([
          getTodayFleet(),
          getFleetTrend(
            undefined,
            30
          ),
        ]);

        setToday(
          todayData || null
        );

        setTrend(
          Array.isArray(trendData)
            ? trendData
            : []
        );
      } catch (requestError) {
        console.error(
          "Fleet page load failed:",
          requestError
        );

        setError(
          requestError?.message ||
            "Unable to load Fleet analytics."
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadFleet();
  }, [loadFleet]);


  const operationProfile =
    String(
      today?.operation_profile || ""
    )
      .trim()
      .toLowerCase();


  const fleetApplicable =
    today?.fleet_applicable !== false &&
    operationProfile !== "sxew_copper";


  const fleetPerformance =
    useMemo(
      () => {
        if (
          today?.fleet_performance !== null &&
          today?.fleet_performance !== undefined
        ) {
          return Number(
            today.fleet_performance
          );
        }

        const availability =
          Number(
            today?.availability || 0
          );

        const utilization =
          Number(
            today?.utilization || 0
          );

        return Number(
          (
            (
              availability +
              utilization
            ) / 2
          ).toFixed(1)
        );
      },
      [
        today?.fleet_performance,
        today?.availability,
        today?.utilization,
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
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {!error &&
        !fleetApplicable && (
          <NotApplicableState
            today={today}
            onRefresh={loadFleet}
          />
        )}

      {!error &&
        fleetApplicable && (
          <>
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              justifyContent="space-between"
              alignItems={{
                xs: "flex-start",
                md: "center",
              }}
              spacing={1.5}
              sx={{ mb: 1.5 }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#2563eb",
                    fontSize: 9,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Fleet Intelligence
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
                  Monitor equipment availability,
                  utilization, and overall Fleet
                  performance.
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
                    border: "1px solid #e2e8f0",
                    borderRadius: 2,
                    bgcolor: "#ffffff",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#94a3b8",
                      fontSize: 7,
                      fontWeight: 900,
                      textTransform: "uppercase",
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
                  aria-label="Refresh Fleet"
                  sx={{
                    width: 38,
                    height: 38,
                    border: "1px solid #e2e8f0",
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

            {today?.data_status ===
              "No Data" && (
              <Alert
                severity="info"
                sx={{
                  mb: 1.5,
                  borderRadius: 2,
                  fontSize: 10,
                }}
              >
                No Fleet dataset is currently
                available for this operation.
              </Alert>
            )}

            {today?.data_status !==
              "No Data" && (
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
                            textTransform: "uppercase",
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
                          Combined equipment
                          availability and utilization.
                        </Typography>
                      </Box>

                      <Typography
                        sx={{
                          color: getTone(
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
                      eyebrow="Fleet KPI"
                      title={
                        today?.availability_label ||
                        "Availability"
                      }
                      value={
                        Number(
                          today?.availability ||
                            0
                        )
                      }
                      target={95}
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
                      eyebrow="Fleet KPI"
                      title={
                        today?.utilization_label ||
                        "Utilization"
                      }
                      value={
                        Number(
                          today?.utilization ||
                            0
                        )
                      }
                      target={85}
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
                      eyebrow="Fleet KPI"
                      title={
                        today?.fleet_performance_label ||
                        "Fleet Performance"
                      }
                      value={
                        fleetPerformance
                      }
                      target={90}
                      icon={
                        <FiTarget />
                      }
                    />
                  </Grid>
                </Grid>

                <FleetTrendChart
                  data={trend}
                />
              </>
            )}
          </>
        )}
    </Box>
  );
}


export default Fleet;
