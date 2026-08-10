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
  FiArrowDownRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiMinus,
  FiRefreshCw,
  FiTarget,
  FiTruck,
  FiTrendingUp,
} from "react-icons/fi";

import ProductionTrendChart
  from "../components/ProductionTrendChart";

import {
  getProductionTrend,
  getTodayProduction,
} from "../api/productionApi";

import "./Production.css";


/* ============================================================
   Formatting Helpers
   ============================================================ */

function formatNumber(value) {
  const number = Number(value || 0);

  return number.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}


function formatTonnes(value) {
  return `${formatNumber(value)} t`;
}


function formatSignedTonnes(value) {
  const number = Number(value || 0);

  if (number > 0) {
    return `+${formatNumber(number)} t`;
  }

  if (number < 0) {
    return `${formatNumber(number)} t`;
  }

  return "0 t";
}


function formatReportingDate(value) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


/* ============================================================
   Performance Helpers
   ============================================================ */

function calculatePerformance(
  actual,
  plan
) {
  const normalizedActual =
    Number(actual || 0);

  const normalizedPlan =
    Number(plan || 0);

  if (normalizedPlan <= 0) {
    return 0;
  }

  return (
    normalizedActual /
    normalizedPlan
  ) * 100;
}


function calculateCombinedPerformance({
  oreActual,
  orePlan,
  wasteActual,
  wastePlan,
}) {
  const totalActual =
    Number(oreActual || 0) +
    Number(wasteActual || 0);

  const totalPlan =
    Number(orePlan || 0) +
    Number(wastePlan || 0);

  if (totalPlan <= 0) {
    return 0;
  }

  return (
    totalActual /
    totalPlan
  ) * 100;
}


function getPerformanceStatus(
  performance
) {
  if (performance >= 100) {
    return "Above Plan";
  }

  if (performance >= 95) {
    return "Near Plan";
  }

  return "Below Plan";
}


function getPerformanceTone(
  performance
) {
  if (performance >= 100) {
    return "positive";
  }

  if (performance >= 95) {
    return "warning";
  }

  return "negative";
}


function getStatusDescription(
  performance
) {
  if (performance >= 100) {
    return (
      "Production delivery is currently meeting " +
      "or exceeding the operating plan."
    );
  }

  if (performance >= 95) {
    return (
      "Production delivery is close to plan and " +
      "requires continued operational monitoring."
    );
  }

  return (
    "Production delivery is currently below plan " +
    "and requires management attention."
  );
}


function getVarianceIcon(variance) {
  if (variance > 0) {
    return <FiArrowUpRight />;
  }

  if (variance < 0) {
    return <FiArrowDownRight />;
  }

  return <FiMinus />;
}


/* ============================================================
   Performance Badge
   ============================================================ */

function PerformanceBadge({
  performance,
}) {
  const status =
    getPerformanceStatus(performance);

  const tone =
    getPerformanceTone(performance);

  return (
    <span
      className={
        `production-status-badge ` +
        `production-status-badge--${tone}`
      }
    >
      <span className="production-status-dot" />

      {status}
    </span>
  );
}


/* ============================================================
   KPI Card
   ============================================================ */

function KpiCard({
  title,
  eyebrow,
  actual,
  plan,
  variance,
  icon,
}) {
  const performance = useMemo(
    () =>
      calculatePerformance(
        actual,
        plan
      ),
    [actual, plan]
  );

  const tone =
    getPerformanceTone(performance);

  const progressValue =
    Math.min(
      Math.max(performance, 0),
      100
    );

  return (
    <Card
      className={
        `production-kpi-card ` +
        `production-kpi-card--${tone}`
      }
      elevation={0}
    >
      <CardContent className="production-kpi-card-content">

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
        >
          <Box>
            <Typography
              className="production-kpi-eyebrow"
              component="div"
            >
              {eyebrow}
            </Typography>

            <Typography
              className="production-kpi-title"
              component="h3"
            >
              {title}
            </Typography>
          </Box>

          <Box
            className={
              `production-kpi-icon ` +
              `production-kpi-icon--${tone}`
            }
          >
            {icon}
          </Box>
        </Stack>


        <Box className="production-kpi-value-section">

          <Typography
            className="production-kpi-value"
            component="div"
          >
            {formatTonnes(actual)}
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            className="production-kpi-plan-row"
          >
            <span>Plan</span>

            <strong>
              {formatTonnes(plan)}
            </strong>
          </Stack>

        </Box>


        <Box className="production-kpi-progress-section">

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography
              className="production-kpi-progress-label"
            >
              Plan attainment
            </Typography>

            <Typography
              className={
                `production-kpi-performance ` +
                `production-text--${tone}`
              }
            >
              {performance.toFixed(1)}%
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progressValue}
            className={
              `production-progress ` +
              `production-progress--${tone}`
            }
          />

        </Box>


        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          className="production-kpi-footer"
        >

          <PerformanceBadge
            performance={performance}
          />

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            className={
              `production-variance ` +
              `production-text--${tone}`
            }
          >
            {getVarianceIcon(
              Number(variance || 0)
            )}

            <span>
              {formatSignedTonnes(
                variance
              )}
            </span>
          </Stack>

        </Stack>

      </CardContent>
    </Card>
  );
}


/* ============================================================
   Plan Attainment Card
   ============================================================ */

function PlanAttainmentCard({
  orePerformance,
  wastePerformance,
  combinedPerformance,
}) {
  const tone =
    getPerformanceTone(
      combinedPerformance
    );

  return (
    <Card
      className={
        `production-kpi-card ` +
        `production-attainment-card ` +
        `production-kpi-card--${tone}`
      }
      elevation={0}
    >
      <CardContent className="production-kpi-card-content">

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              className="production-kpi-eyebrow"
              component="div"
            >
              Overall Performance
            </Typography>

            <Typography
              className="production-kpi-title"
              component="h3"
            >
              Plan Attainment
            </Typography>
          </Box>

          <Box
            className={
              `production-kpi-icon ` +
              `production-kpi-icon--${tone}`
            }
          >
            <FiTarget />
          </Box>
        </Stack>


        <Box className="production-attainment-value-row">

          <Typography
            className="production-kpi-value"
            component="div"
          >
            {combinedPerformance.toFixed(1)}%
          </Typography>

          <PerformanceBadge
            performance={
              combinedPerformance
            }
          />

        </Box>


        <Stack
          spacing={2}
          className="production-attainment-metrics"
        >

          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 0.75 }}
            >
              <Typography
                className="production-attainment-label"
              >
                Ore Production
              </Typography>

              <Typography
                className="production-attainment-number"
              >
                {orePerformance.toFixed(1)}%
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={
                Math.min(
                  Math.max(
                    orePerformance,
                    0
                  ),
                  100
                )
              }
              className={
                `production-progress ` +
                `production-progress--${getPerformanceTone(
                  orePerformance
                )}`
              }
            />
          </Box>


          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 0.75 }}
            >
              <Typography
                className="production-attainment-label"
              >
                Waste Movement
              </Typography>

              <Typography
                className="production-attainment-number"
              >
                {wastePerformance.toFixed(1)}%
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={
                Math.min(
                  Math.max(
                    wastePerformance,
                    0
                  ),
                  100
                )
              }
              className={
                `production-progress ` +
                `production-progress--${getPerformanceTone(
                  wastePerformance
                )}`
              }
            />
          </Box>

        </Stack>

      </CardContent>
    </Card>
  );
}


/* ============================================================
   Production Page
   ============================================================ */

function Production() {
  const [today, setToday] =
    useState(null);

  const [trend, setTrend] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadProduction =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          todayData,
          trendData,
        ] = await Promise.all([
          getTodayProduction(),
          getProductionTrend(),
        ]);

        setToday(todayData);
        setTrend(trendData);
      } catch (requestError) {
        console.error(
          "Production page load failed:",
          requestError
        );

        setError(
          requestError?.message ||
            "Unable to load production analytics."
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadProduction();
  }, [loadProduction]);


  const orePerformance = useMemo(
    () =>
      calculatePerformance(
        today?.ore_actual,
        today?.ore_plan
      ),
    [
      today?.ore_actual,
      today?.ore_plan,
    ]
  );


  const wastePerformance = useMemo(
    () =>
      calculatePerformance(
        today?.waste_actual,
        today?.waste_plan
      ),
    [
      today?.waste_actual,
      today?.waste_plan,
    ]
  );


  const combinedPerformance =
    useMemo(
      () =>
        calculateCombinedPerformance({
          oreActual:
            today?.ore_actual,
          orePlan:
            today?.ore_plan,
          wasteActual:
            today?.waste_actual,
          wastePlan:
            today?.waste_plan,
        }),
      [
        today?.ore_actual,
        today?.ore_plan,
        today?.waste_actual,
        today?.waste_plan,
      ]
    );


  const overallTone =
    getPerformanceTone(
      combinedPerformance
    );


  const overallStatus =
    getPerformanceStatus(
      combinedPerformance
    );


  if (loading) {
    return (
      <Box className="production-loading">

        <Stack
          spacing={2}
          alignItems="center"
        >
          <CircularProgress />

          <Typography
            color="text.secondary"
            fontWeight={700}
          >
            Loading production intelligence...
          </Typography>
        </Stack>

      </Box>
    );
  }


  return (
    <Box className="production-page">

      {/* ======================================================
          Page Header
          ====================================================== */}

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
        spacing={2}
        className="production-page-header"
      >

        <Box>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            className="production-page-eyebrow"
          >
            <FiBarChart2 />

            <span>
              Operational Intelligence
            </span>
          </Stack>

          <Typography
            component="h1"
            className="production-page-title"
          >
            Production Performance
          </Typography>

          <Typography
            className="production-page-subtitle"
          >
            Daily ore and waste movement
            performance against operating plan.
          </Typography>

        </Box>


        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >

          <Box className="production-reporting-date">

            <FiCalendar />

            <Box>
              <span className="production-reporting-date-label">
                Reporting Date
              </span>

              <strong>
                {formatReportingDate(
                  today?.report_date
                )}
              </strong>
            </Box>

          </Box>


          <button
            type="button"
            className="production-refresh-button"
            onClick={loadProduction}
            title="Refresh production data"
            aria-label="Refresh production data"
          >
            <FiRefreshCw />
          </button>

        </Stack>

      </Stack>


      {/* ======================================================
          Error / Information Messages
          ====================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}


      {!error && today?.message && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
        >
          {today.message}
        </Alert>
      )}


      {/* ======================================================
          Executive Production Hero
          ====================================================== */}

      {!error && (
        <section
          className={
            `production-hero ` +
            `production-hero--${overallTone}`
          }
        >

          <div className="production-hero-top">

            <div>

              <div className="production-hero-eyebrow">
                <FiTrendingUp />

                <span>
                  Daily Production Status
                </span>
              </div>

              <h2>
                {overallStatus}
              </h2>

              <p>
                {getStatusDescription(
                  combinedPerformance
                )}
              </p>

            </div>


            <PerformanceBadge
              performance={
                combinedPerformance
              }
            />

          </div>


          <div className="production-hero-metrics">

            <div className="production-hero-metric">

              <span>
                Ore Production
              </span>

              <strong>
                {formatTonnes(
                  today?.ore_actual
                )}
              </strong>

              <small>
                {orePerformance.toFixed(1)}%
                {" "}of plan
              </small>

            </div>


            <div className="production-hero-divider" />


            <div className="production-hero-metric">

              <span>
                Waste Movement
              </span>

              <strong>
                {formatTonnes(
                  today?.waste_actual
                )}
              </strong>

              <small>
                {wastePerformance.toFixed(1)}%
                {" "}of plan
              </small>

            </div>


            <div className="production-hero-divider" />


            <div className="production-hero-metric">

              <span>
                Overall Material Movement
              </span>

              <strong>
                {combinedPerformance.toFixed(1)}%
              </strong>

              <small>
                Combined plan attainment
              </small>

            </div>

          </div>

        </section>
      )}


      {/* ======================================================
          KPI Section Heading
          ====================================================== */}

      {!error && (
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
          spacing={1}
          className="production-section-heading"
        >

          <Box>
            <Typography
              component="h2"
              className="production-section-title"
            >
              Key Production Indicators
            </Typography>

            <Typography
              className="production-section-subtitle"
            >
              Current shift performance
              against operating plan.
            </Typography>
          </Box>


          <Chip
            icon={<FiCheckCircle />}
            label={
              `${overallStatus} · ` +
              `${combinedPerformance.toFixed(1)}%`
            }
            className={
              `production-summary-chip ` +
              `production-summary-chip--${overallTone}`
            }
          />

        </Stack>
      )}


      {/* ======================================================
          KPI Cards
          ====================================================== */}

      {!error && (
        <Grid
          container
          spacing={2.5}
          className="production-kpi-grid"
        >

          <Grid
            size={{
              xs: 12,
              md: 6,
              xl: 4,
            }}
          >
            <KpiCard
              eyebrow="Production Delivery"
              title="Ore Production"
              actual={
                today?.ore_actual
              }
              plan={
                today?.ore_plan
              }
              variance={
                today?.ore_variance
              }
              icon={
                <FiActivity />
              }
            />
          </Grid>


          <Grid
            size={{
              xs: 12,
              md: 6,
              xl: 4,
            }}
          >
            <KpiCard
              eyebrow="Material Movement"
              title="Waste Movement"
              actual={
                today?.waste_actual
              }
              plan={
                today?.waste_plan
              }
              variance={
                today?.waste_variance
              }
              icon={
                <FiTruck />
              }
            />
          </Grid>


          <Grid
            size={{
              xs: 12,
              md: 12,
              xl: 4,
            }}
          >
            <PlanAttainmentCard
              orePerformance={
                orePerformance
              }
              wastePerformance={
                wastePerformance
              }
              combinedPerformance={
                combinedPerformance
              }
            />
          </Grid>

        </Grid>
      )}


      {/* ======================================================
          Trend Section
          ====================================================== */}

      {!error && (
        <section className="production-trend-section">

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            spacing={1}
            className="production-trend-heading"
          >

            <Box>
              <div className="production-trend-eyebrow">
                Performance History
              </div>

              <Typography
                component="h2"
                className="production-trend-title"
              >
                Production Performance Trend
              </Typography>

              <Typography
                className="production-trend-subtitle"
              >
                Actual versus planned production
                performance over the last 30 days.
              </Typography>
            </Box>


            <div className="production-trend-period">
              <FiActivity />

              30 Day Trend
            </div>

          </Stack>


          <div className="production-trend-chart">

            <ProductionTrendChart
              data={trend}
            />

          </div>

        </section>
      )}

    </Box>
  );
}


export default Production;