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
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiRefreshCw,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

import PlantTrendChart from "../components/PlantTrendChart";

import {
  getPlantTrend,
  getTodayPlant,
} from "../api/plantApi";

import { useLanguage } from "../context/LanguageContext";


/* =========================================================
   CONSTANTS
   ========================================================= */

const THROUGHPUT_TARGET = 100;
const RECOVERY_TARGET = 90;
const PLANT_TARGET = 95;


/* =========================================================
   STATUS HELPERS
   ========================================================= */

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


function getSoftTone(value) {
  if (value >= 95) {
    return "#ecfdf5";
  }

  if (value >= 85) {
    return "#fffbeb";
  }

  return "#fef2f2";
}


function translate(t, key, fallback) {
  const value = t(key);

  if (!value || value === key) {
    return fallback;
  }

  return value;
}


/* =========================================================
   PRIMARY KPI BLOCK
   ========================================================= */

function PrimaryMetric({
  eyebrow,
  title,
  value,
  target,
  icon,
  accent = "#16a34a",
  t,
}) {
  const numericValue = Number(value || 0);
  const numericTarget = Number(target || 0);

  const gap = numericValue - numericTarget;

  const attainment =
    numericTarget > 0
      ? (numericValue / numericTarget) * 100
      : 0;

  const below = gap < 0;

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        px: {
          xs: 2,
          md: 2.5,
        },
        py: 2,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "50%",
          height: 2,
          bgcolor: accent,
        }}
      />

      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
      >
        <Box
          sx={{
            width: 45,
            height: 45,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            borderRadius: "12px",
            bgcolor:
              accent === "#2563eb"
                ? "#eff6ff"
                : "#ecfdf5",
            color: accent,
            fontSize: 21,
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
              letterSpacing: "0.045em",
            }}
          >
            {eyebrow}
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              color: "#334155",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 0.3,
              color: "#0f172a",
              fontSize: {
                xs: 25,
                xl: 29,
              },
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "-0.025em",
            }}
          >
            {numericValue.toFixed(1)}%
          </Typography>

          <Typography
            sx={{
              mt: 0.65,
              color: "#64748b",
              fontSize: 9,
            }}
          >
            {t("plant.target")}{" "}
            <Box
              component="span"
              sx={{
                color: "#0f172a",
                fontWeight: 850,
              }}
            >
              {numericTarget.toFixed(1)}%
            </Box>
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          mt: 1.7,
          px: 1.25,
          py: 0.9,
          borderRadius: "8px",
          bgcolor: below
            ? "#fef2f2"
            : "#ecfdf5",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Stack
            direction="row"
            spacing={0.6}
            alignItems="center"
          >
            <Box
              sx={{
                display: "flex",
                color: below
                  ? "#dc2626"
                  : "#16a34a",
                fontSize: 13,
              }}
            >
              {below ? (
                <FiTrendingDown />
              ) : (
                <FiTrendingUp />
              )}
            </Box>

            <Typography
              sx={{
                color: below
                  ? "#dc2626"
                  : "#16a34a",
                fontSize: 9,
                fontWeight: 850,
              }}
            >
              {gap > 0 ? "+" : ""}
              {gap.toFixed(1)}%
            </Typography>
          </Stack>

          <Typography
            sx={{
              color: below
                ? "#dc2626"
                : "#16a34a",
              fontSize: 9,
              fontWeight: 850,
            }}
          >
            {attainment.toFixed(1)}%{" "}
            {translate(
              t,
              "plant.attainment",
              "attainment"
            )}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}


/* =========================================================
   SUMMARY ROW
   ========================================================= */

function SummaryRow({
  dotColor,
  label,
  value,
  valueColor = "#0f172a",
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
    >
      <Stack
        direction="row"
        spacing={0.8}
        alignItems="center"
        sx={{ minWidth: 0 }}
      >
        {dotColor && (
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: dotColor,
              flexShrink: 0,
            }}
          />
        )}

        <Typography
          sx={{
            color: "#64748b",
            fontSize: 9,
            lineHeight: 1.35,
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        sx={{
          color: valueColor,
          fontSize: 9.5,
          fontWeight: 900,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}


/* =========================================================
   PLANT PAGE
   ========================================================= */

function Plant() {
  const { t } = useLanguage();

  const [today, setToday] =
    useState(null);

  const [trend, setTrend] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =======================================================
     DATA LOADING
     ======================================================= */

  const loadPlant =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          todayData,
          trendData,
        ] = await Promise.all([
          getTodayPlant(),

          getPlantTrend(
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
            t(
              "plant.unableToLoad"
            )
        );
      } finally {
        setLoading(false);
      }
    }, [t]);


  useEffect(() => {
    loadPlant();
  }, [loadPlant]);


  /* =======================================================
     KPI DATA
     ======================================================= */

  const throughputPerformance =
    useMemo(
      () =>
        Number(
          today?.throughput_performance ||
            0
        ),
      [
        today?.throughput_performance,
      ]
    );


  const recovery =
    useMemo(
      () =>
        Number(
          today?.recovery ||
            0
        ),
      [
        today?.recovery,
      ]
    );


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


  const plantStatus =
    getStatus(
      plantPerformance
    );


  const statusTone =
    getTone(
      plantPerformance
    );


  const statusSoftTone =
    getSoftTone(
      plantPerformance
    );


  const plantGap =
    plantPerformance -
    PLANT_TARGET;


  const throughputGap =
    throughputPerformance -
    THROUGHPUT_TARGET;


  const recoveryGap =
    recovery -
    RECOVERY_TARGET;


  const focusAreas =
    useMemo(() => {
      const result = [];

      if (
        throughputPerformance <
        THROUGHPUT_TARGET
      ) {
        result.push(
          t(
            "plant.throughputPerformance"
          )
        );
      }

      if (
        recovery <
        RECOVERY_TARGET
      ) {
        result.push(
          t(
            "plant.recovery"
          )
        );
      }

      return result;
    }, [
      throughputPerformance,
      recovery,
      t,
    ]);


  /* =======================================================
     TRANSLATIONS
     ======================================================= */

  const belowPlanText =
    translate(
      t,
      "plant.belowPlan",
      "Below Target"
    );


  const performanceSummaryText =
    translate(
      t,
      "plant.performanceSummary",
      "Plant Performance Summary"
    );


  const overallPerformanceText =
    translate(
      t,
      "plant.overallPerformance",
      "Overall Performance"
    );


  const focusAreasText =
    translate(
      t,
      "plant.focusAreas",
      "Focus Areas"
    );


  const throughputGapText =
    translate(
      t,
      "plant.throughputGap",
      "Throughput gap"
    );


  const recoveryGapText =
    translate(
      t,
      "plant.recoveryGap",
      "Recovery gap"
    );


  const monitoredAreasText =
    translate(
      t,
      "plant.monitoredAreas",
      "Areas requiring attention"
    );


  const lastPeriodTrendText =
    translate(
      t,
      "plant.recentPerformance",
      "Current Performance"
    );


  const improvingText =
    translate(
      t,
      "plant.improving",
      "Needs Attention"
    );


  const thirtyPeriodAverageText =
    translate(
      t,
      "plant.periodAverage",
      "Current Performance"
    );


  const plantTargetText =
    translate(
      t,
      "plant.plantTarget",
      "Plant Target"
    );


  const areasOnTargetText =
    translate(
      t,
      "plant.areasOnTarget",
      "KPIs At Target"
    );


  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 520,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress
          size={34}
          sx={{
            color: "#2563eb",
          }}
        />
      </Box>
    );
  }


  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        bgcolor: "#f6f8fb",

        px: {
          xs: 1.5,
          md: 2.75,
          xl: 3,
        },

        py: {
          xs: 1.5,
          md: 2.5,
        },
      }}
    >

      {/* ===================================================
          PAGE HEADER
          Production-style header
          =================================================== */}

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        alignItems={{
          xs: "flex-start",
          md: "center",
        }}
        spacing={2}
        sx={{
          mb: 2,
        }}
      >

        <Box
          sx={{
            flex: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={0.7}
            alignItems="center"
          >
            <FiActivity
              style={{
                color: "#2563eb",
                fontSize: 12,
              }}
            />

            <Typography
              sx={{
                color: "#2563eb",
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              {t(
                "plant.operationalIntelligence"
              )}
            </Typography>

            <Typography
              sx={{
                color: "#059669",
                fontSize: 8,
                fontWeight: 900,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              ACHIT-IKHT COPPER OPERATION
            </Typography>
          </Stack>

          <Typography
            component="h1"
            sx={{
              mt: 0.45,
              color: "#0f172a",
              fontSize: {
                xs: 26,
                md: 29,
                xl: 31,
              },
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            {t("plant.title")}
          </Typography>

          <Typography
            sx={{
              mt: 0.7,
              color: "#64748b",
              fontSize: 10.5,
              lineHeight: 1.4,
            }}
          >
            {t(
              "plant.pageDescription"
            )}
          </Typography>
        </Box>


        {/* REPORTING DATE */}

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Box
            sx={{
              px: 1.5,
              py: 1.05,
              minWidth: 132,
              border: "1px solid #dbe3ec",
              borderRadius: "10px",
              bgcolor: "#ffffff",
              boxShadow:
                "0 3px 10px rgba(15,23,42,0.03)",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Box
                sx={{
                  display: "flex",
                  color: "#2563eb",
                  fontSize: 15,
                }}
              >
                <FiCalendar />
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "#64748b",
                    fontSize: 7.5,
                    fontWeight: 900,
                    letterSpacing:
                      "0.04em",
                    textTransform:
                      "uppercase",
                  }}
                >
                  {t(
                    "plant.reportingDate"
                  )}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    color: "#0f172a",
                    fontSize: 10.5,
                    fontWeight: 850,
                  }}
                >
                  {today?.report_date ||
                    t(
                      "plant.unavailable"
                    )}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            component="button"
            type="button"
            onClick={loadPlant}
            aria-label="Refresh plant data"
            sx={{
              width: 41,
              height: 41,
              border:
                "1px solid #dbe3ec",
              borderRadius: "10px",
              bgcolor: "#ffffff",
              color: "#475569",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: 16,

              "&:hover": {
                color: "#2563eb",
                borderColor:
                  "#bfdbfe",
              },
            }}
          >
            <FiRefreshCw />
          </Box>
        </Stack>
      </Stack>


      {/* ===================================================
          ERROR
          =================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: 2.5,
          }}
        >
          {error}
        </Alert>
      )}


      {!error && (
        <>

          {/* =================================================
              PERFORMANCE OVERVIEW CARD
              ================================================= */}

          <Card
            elevation={0}
            sx={{
              mb: 2,
              overflow: "hidden",
              border:
                "1px solid #dbe3ec",
              borderRadius:
                "14px",
              bgcolor:
                "#ffffff",
              boxShadow:
                "0 5px 18px rgba(15,23,42,0.035)",
            }}
          >

            {/* STATUS BANNER */}

            <Box
              sx={{
                px: {
                  xs: 2,
                  md: 2.5,
                },
                py: 1.8,
                borderLeft:
                  `3px solid ${statusTone}`,
                borderBottom:
                  "1px solid #e2e8f0",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={2}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      display:
                        "grid",
                      placeItems:
                        "center",
                      flexShrink: 0,
                      borderRadius:
                        "50%",
                      bgcolor:
                        statusTone,
                      color:
                        "#ffffff",
                      fontSize:
                        21,
                      boxShadow:
                        `0 5px 14px ${statusTone}30`,
                    }}
                  >
                    {plantPerformance >=
                    PLANT_TARGET ? (
                      <FiTrendingUp />
                    ) : (
                      <FiAlertCircle />
                    )}
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        color:
                          "#64748b",
                        fontSize: 8,
                        fontWeight:
                          900,
                        letterSpacing:
                          "0.045em",
                        textTransform:
                          "uppercase",
                      }}
                    >
                      {translate(
                        t,
                        "plant.plantPerformanceStatus",
                        "Plant Performance"
                      )}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        color:
                          statusTone,
                        fontSize: 20,
                        lineHeight: 1,
                        fontWeight:
                          900,
                      }}
                    >
                      {plantStatus ===
                      "Healthy"
                        ? t(
                            "plant.healthy"
                          )
                        : plantStatus ===
                          "Attention Required"
                        ? t(
                            "plant.attentionRequired"
                          )
                        : t(
                            "plant.critical"
                          )}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.55,
                        color:
                          "#64748b",
                        fontSize: 9.5,
                      }}
                    >
                      {plantPerformance <
                      PLANT_TARGET
                        ? `${translate(
                            t,
                            "plant.performanceBelowTarget",
                            "Plant performance is"
                          )} ${Math.abs(
                            plantGap
                          ).toFixed(
                            1
                          )}% ${translate(
                            t,
                            "plant.belowTarget",
                            "below target"
                          )}.`
                        : translate(
                            t,
                            "plant.performanceOnTarget",
                            "Plant performance is operating at or above target."
                          )}
                    </Typography>
                  </Box>
                </Stack>


                <Box
                  sx={{
                    px: 1.3,
                    py: 0.55,
                    border:
                      `1px solid ${statusTone}35`,
                    borderRadius:
                      "999px",
                    bgcolor:
                      statusSoftTone,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0.6}
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius:
                          "50%",
                        bgcolor:
                          statusTone,
                      }}
                    />

                    <Typography
                      sx={{
                        color:
                          statusTone,
                        fontSize: 8,
                        fontWeight:
                          850,
                      }}
                    >
                      {plantPerformance <
                      PLANT_TARGET
                        ? belowPlanText
                        : t(
                            "plant.healthy"
                          )}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>


            {/* PRIMARY KPI PAIR */}

            <Grid
              container
              spacing={0}
            >
              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
                sx={{
                  borderRight: {
                    xs: "none",
                    md:
                      "1px solid #e2e8f0",
                  },
                  borderBottom: {
                    xs:
                      "1px solid #e2e8f0",
                    md: "none",
                  },
                }}
              >
                <PrimaryMetric
                  eyebrow={translate(
                    t,
                    "plant.throughputKpi",
                    "Plant Throughput"
                  )}
                  title={t(
                    "plant.throughputPerformance"
                  )}
                  value={
                    throughputPerformance
                  }
                  target={
                    THROUGHPUT_TARGET
                  }
                  icon={
                    <FiTrendingUp />
                  }
                  accent="#16a34a"
                  t={t}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <PrimaryMetric
                  eyebrow={translate(
                    t,
                    "plant.recoveryKpi",
                    "Plant Recovery"
                  )}
                  title={t(
                    "plant.recovery"
                  )}
                  value={
                    recovery
                  }
                  target={
                    RECOVERY_TARGET
                  }
                  icon={
                    <FiTarget />
                  }
                  accent="#2563eb"
                  t={t}
                />
              </Grid>
            </Grid>
          </Card>


          {/* =================================================
              MAIN ANALYTICS AREA
              ================================================= */}

          <Grid
            container
            spacing={1.5}
            alignItems="stretch"
          >

            {/* MAIN TREND */}

            <Grid
              size={{
                xs: 12,
                lg: 9.5,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  height:
                    "100%",
                  overflow:
                    "hidden",
                  border:
                    "1px solid #dbe3ec",
                  borderRadius:
                    "14px",
                  bgcolor:
                    "#ffffff",
                  boxShadow:
                    "0 4px 14px rgba(15,23,42,0.03)",
                }}
              >
                <Box
                  sx={{
                    /*
                     * Preserve the existing chart component
                     * and its data/toggle functionality.
                     */
                    "& > *": {
                      border:
                        "none !important",
                      boxShadow:
                        "none !important",
                      borderRadius:
                        "0 !important",
                    },
                  }}
                >
                  <PlantTrendChart
                    data={trend}
                    recoveryTarget={
                      RECOVERY_TARGET
                    }
                  />
                </Box>


                {/* SUPPORTING METRICS */}

                <Divider />

                <Grid
                  container
                  spacing={0}
                >

                  {/* CURRENT AVERAGE */}

                  <Grid
                    size={{
                      xs: 12,
                      md: 4,
                    }}
                    sx={{
                      borderRight: {
                        xs: "none",
                        md:
                          "1px solid #e2e8f0",
                      },
                      borderBottom: {
                        xs:
                          "1px solid #e2e8f0",
                        md: "none",
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.3}
                      alignItems="center"
                      sx={{
                        px: 2,
                        py: 1.7,
                      }}
                    >
                      <Box
                        sx={{
                          width: 37,
                          height: 37,
                          display:
                            "grid",
                          placeItems:
                            "center",
                          borderRadius:
                            "10px",
                          bgcolor:
                            "#ecfdf5",
                          color:
                            "#16a34a",
                          fontSize: 18,
                        }}
                      >
                        <FiTrendingUp />
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            color:
                              "#64748b",
                            fontSize: 7.5,
                            fontWeight:
                              900,
                            letterSpacing:
                              "0.04em",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {thirtyPeriodAverageText}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.2,
                            color:
                              "#0f172a",
                            fontSize: 18,
                            fontWeight:
                              900,
                          }}
                        >
                          {plantPerformance.toFixed(
                            1
                          )}
                          %
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.1,
                            color:
                              statusTone,
                            fontSize: 8,
                            fontWeight:
                              800,
                          }}
                        >
                          {plantGap >=
                          0
                            ? "+"
                            : ""}
                          {plantGap.toFixed(
                            1
                          )}
                          %{" "}
                          {translate(
                            t,
                            "plant.vsTarget",
                            "vs target"
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>


                  {/* TARGET */}

                  <Grid
                    size={{
                      xs: 12,
                      md: 4,
                    }}
                    sx={{
                      borderRight: {
                        xs: "none",
                        md:
                          "1px solid #e2e8f0",
                      },
                      borderBottom: {
                        xs:
                          "1px solid #e2e8f0",
                        md: "none",
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.3}
                      alignItems="center"
                      sx={{
                        px: 2,
                        py: 1.7,
                      }}
                    >
                      <Box
                        sx={{
                          width: 37,
                          height: 37,
                          display:
                            "grid",
                          placeItems:
                            "center",
                          borderRadius:
                            "10px",
                          bgcolor:
                            "#eff6ff",
                          color:
                            "#2563eb",
                          fontSize: 18,
                        }}
                      >
                        <FiTarget />
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            color:
                              "#64748b",
                            fontSize: 7.5,
                            fontWeight:
                              900,
                            letterSpacing:
                              "0.04em",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {plantTargetText}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.2,
                            color:
                              "#0f172a",
                            fontSize: 18,
                            fontWeight:
                              900,
                          }}
                        >
                          {PLANT_TARGET.toFixed(
                            1
                          )}
                          %
                        </Typography>

                        <Typography
                          sx={{
                            color:
                              "#64748b",
                            fontSize: 8,
                          }}
                        >
                          {t(
                            "plant.target"
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>


                  {/* KPI TARGET COUNT */}

                  <Grid
                    size={{
                      xs: 12,
                      md: 4,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.3}
                      alignItems="center"
                      sx={{
                        px: 2,
                        py: 1.7,
                      }}
                    >
                      <Box
                        sx={{
                          width: 37,
                          height: 37,
                          display:
                            "grid",
                          placeItems:
                            "center",
                          borderRadius:
                            "10px",
                          bgcolor:
                            "#f5f3ff",
                          color:
                            "#7c3aed",
                          fontSize: 18,
                        }}
                      >
                        <FiActivity />
                      </Box>

                      <Box
                        sx={{
                          width:
                            "100%",
                        }}
                      >
                        <Typography
                          sx={{
                            color:
                              "#64748b",
                            fontSize: 7.5,
                            fontWeight:
                              900,
                            letterSpacing:
                              "0.04em",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {areasOnTargetText}
                        </Typography>

                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="baseline"
                        >
                          <Typography
                            sx={{
                              mt: 0.2,
                              color:
                                "#0f172a",
                              fontSize: 18,
                              fontWeight:
                                900,
                            }}
                          >
                            {2 -
                              focusAreas.length}{" "}
                            / 2
                          </Typography>

                          <Typography
                            sx={{
                              color:
                                "#64748b",
                              fontSize: 8,
                              fontWeight:
                                800,
                            }}
                          >
                            {(
                              ((2 -
                                focusAreas.length) /
                                2) *
                              100
                            ).toFixed(
                              0
                            )}
                            %
                          </Typography>
                        </Stack>

                        <LinearProgress
                          variant="determinate"
                          value={
                            ((2 -
                              focusAreas.length) /
                              2) *
                            100
                          }
                          sx={{
                            mt: 0.55,
                            height: 4,
                            borderRadius:
                              99,
                            bgcolor:
                              "#e2e8f0",

                            "& .MuiLinearProgress-bar":
                              {
                                borderRadius:
                                  99,
                                bgcolor:
                                  "#7c3aed",
                              },
                          }}
                        />
                      </Box>
                    </Stack>
                  </Grid>

                </Grid>
              </Card>
            </Grid>


            {/* =================================================
                RIGHT PERFORMANCE SUMMARY
                ================================================= */}

            <Grid
              size={{
                xs: 12,
                lg: 2.5,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  height:
                    "100%",
                  border:
                    "1px solid #dbe3ec",
                  borderRadius:
                    "14px",
                  bgcolor:
                    "#ffffff",
                  boxShadow:
                    "0 4px 14px rgba(15,23,42,0.03)",
                }}
              >
                <CardContent
                  sx={{
                    p: 2,

                    "&:last-child":
                      {
                        pb: 2,
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
                    {performanceSummaryText}
                  </Typography>


                  <Stack
                    spacing={1.5}
                    sx={{
                      mt: 2,
                    }}
                  >
                    <SummaryRow
                      dotColor="#dc2626"
                      label={
                        overallPerformanceText
                      }
                      value={`${plantPerformance.toFixed(
                        1
                      )}%`}
                      valueColor={
                        statusTone
                      }
                    />

                    <SummaryRow
                      dotColor={
                        throughputGap >=
                        0
                          ? "#16a34a"
                          : "#dc2626"
                      }
                      label={
                        throughputGapText
                      }
                      value={`${throughputGap.toFixed(
                        1
                      )}%`}
                      valueColor={
                        throughputGap >=
                        0
                          ? "#16a34a"
                          : "#dc2626"
                      }
                    />

                    <SummaryRow
                      dotColor={
                        recoveryGap >=
                        0
                          ? "#16a34a"
                          : "#dc2626"
                      }
                      label={
                        recoveryGapText
                      }
                      value={`${recoveryGap.toFixed(
                        1
                      )}%`}
                      valueColor={
                        recoveryGap >=
                        0
                          ? "#16a34a"
                          : "#dc2626"
                      }
                    />

                    <SummaryRow
                      dotColor="#2563eb"
                      label={
                        monitoredAreasText
                      }
                      value={
                        focusAreas.length
                      }
                    />
                  </Stack>


                  <Divider
                    sx={{
                      my: 2,
                    }}
                  />


                  <Typography
                    sx={{
                      color:
                        "#64748b",
                      fontSize: 8,
                      fontWeight: 900,
                      letterSpacing:
                        "0.04em",
                      textTransform:
                        "uppercase",
                    }}
                  >
                    {focusAreasText}
                  </Typography>


                  <Stack
                    spacing={0.8}
                    sx={{
                      mt: 1,
                    }}
                  >
                    {focusAreas.length >
                    0 ? (
                      focusAreas.map(
                        (
                          area
                        ) => (
                          <Stack
                            key={
                              area
                            }
                            direction="row"
                            spacing={
                              0.7
                            }
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width:
                                  5,
                                height:
                                  5,
                                borderRadius:
                                  "50%",
                                bgcolor:
                                  "#dc2626",
                                flexShrink:
                                  0,
                              }}
                            />

                            <Typography
                              sx={{
                                color:
                                  "#475569",
                                fontSize:
                                  8.5,
                              }}
                            >
                              {
                                area
                              }
                            </Typography>
                          </Stack>
                        )
                      )
                    ) : (
                      <Typography
                        sx={{
                          color:
                            "#16a34a",
                          fontSize:
                            8.5,
                          fontWeight:
                            800,
                        }}
                      >
                        {translate(
                          t,
                          "plant.noCriticalFocusAreas",
                          "No critical focus areas"
                        )}
                      </Typography>
                    )}
                  </Stack>


                  <Divider
                    sx={{
                      my: 2,
                    }}
                  />


                  {/* CURRENT PERFORMANCE BOX */}

                  <Box
                    sx={{
                      p: 1.5,
                      border:
                        `1px solid ${statusTone}20`,
                      borderRadius:
                        "11px",
                      bgcolor:
                        statusSoftTone,
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          statusTone,
                        fontSize: 7.5,
                        fontWeight: 900,
                        letterSpacing:
                          "0.04em",
                        textTransform:
                          "uppercase",
                      }}
                    >
                      {lastPeriodTrendText}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{
                        mt: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          display:
                            "grid",
                          placeItems:
                            "center",
                          borderRadius:
                            "50%",
                          bgcolor:
                            statusTone,
                          color:
                            "#ffffff",
                          fontSize:
                            17,
                          flexShrink:
                            0,
                        }}
                      >
                        {plantPerformance >=
                        PLANT_TARGET ? (
                          <FiTrendingUp />
                        ) : (
                          <FiTrendingDown />
                        )}
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            color:
                              statusTone,
                            fontSize: 14,
                            fontWeight:
                              900,
                          }}
                        >
                          {plantPerformance >=
                          PLANT_TARGET
                            ? t(
                                "plant.healthy"
                              )
                            : improvingText}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.25,
                            color:
                              "#64748b",
                            fontSize:
                              8,
                            lineHeight:
                              1.4,
                          }}
                        >
                          {plantPerformance <
                          PLANT_TARGET
                            ? `${Math.abs(
                                plantGap
                              ).toFixed(
                                1
                              )}% ${translate(
                                t,
                                "plant.belowTarget",
                                "below target"
                              )}`
                            : translate(
                                t,
                                "plant.operatingWithinTargetRange",
                                "Operating within target range"
                              )}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                </CardContent>
              </Card>
            </Grid>
          </Grid>


          {/* =================================================
              FOOTER DATA NOTE
              ================================================= */}

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            spacing={1}
            sx={{
              mt: 1.5,
              px: 0.5,
            }}
          >
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 7.5,
              }}
            >
              Data: Plant performance
              &nbsp;•&nbsp;
              {translate(
                t,
                "plant.lastUpdated",
                "Last updated"
              )}:{" "}
              {today?.report_date ||
                "—"}
            </Typography>

            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 7.5,
              }}
            >
              Timezone: Asia/Ulaanbaatar
            </Typography>
          </Stack>
        </>
      )}
    </Box>
  );
}


export default Plant;