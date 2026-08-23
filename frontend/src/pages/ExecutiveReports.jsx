import React, { useState } from "react";

import axios from "axios";

import { API_BASE_URL } from "../config/apiConfig";

import {
  Alert,
  Box,
  Grid,
  Snackbar,
  Typography,
} from "@mui/material";

import DescriptionIcon from "@mui/icons-material/Description";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InsightsIcon from "@mui/icons-material/Insights";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";

import ReportHeader from "../components/reports/ReportHeader";
import ReportCard from "../components/reports/ReportCard";
import ExportCard from "../components/reports/ExportCard";
import ReportHistoryTable from "../components/reports/ReportHistoryTable";

import { useLanguage } from "../context/LanguageContext";

/* ============================================================
   Authenticated Report Download Client
   ============================================================ */

const reportDownloadClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

reportDownloadClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================================================
   Executive Reports Page
   ============================================================ */

function ExecutiveReports() {
  const { t } = useLanguage();

  const [loadingReport, setLoadingReport] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  /* ==========================================================
     Notifications
     ========================================================== */

  const showNotification = (severity, message) => {
    setNotification({
      open: true,
      severity,
      message,
    });
  };

  const closeNotification = (_, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setNotification((current) => ({
      ...current,
      open: false,
    }));
  };

  /* ==========================================================
     Download Filename Helper
     ========================================================== */

  const extractFilename = (
    contentDisposition,
    fallbackFilename
  ) => {
    if (!contentDisposition) {
      return fallbackFilename;
    }

    const utf8Match = contentDisposition.match(
      /filename\*=UTF-8''([^;]+)/i
    );

    if (utf8Match?.[1]) {
      return decodeURIComponent(
        utf8Match[1].replace(/["']/g, "")
      );
    }

    const standardMatch = contentDisposition.match(
      /filename="?([^"]+)"?/i
    );

    if (standardMatch?.[1]) {
      return standardMatch[1].trim();
    }

    return fallbackFilename;
  };

  /* ==========================================================
     Shared Authenticated Download Function
     ========================================================== */

  const downloadFile = async ({
    reportKey,
    endpoint,
    fallbackFilename,
    mimeType,
    successMessage,
  }) => {
    if (loadingReport) {
      return;
    }

    setLoadingReport(reportKey);

    try {
      const response = await reportDownloadClient.get(endpoint, {
        responseType: "blob",
      });

      const contentType =
        response.headers["content-type"] || mimeType;

      const fileBlob = new Blob([response.data], {
        type: contentType,
      });

      const contentDisposition =
        response.headers["content-disposition"];

      const filename = extractFilename(
        contentDisposition,
        fallbackFilename
      );

      const fileUrl =
        window.URL.createObjectURL(fileBlob);

      const link = document.createElement("a");

      link.href = fileUrl;
      link.setAttribute("download", filename);

      document.body.appendChild(link);

      link.click();
      link.remove();

      window.URL.revokeObjectURL(fileUrl);

      showNotification("success", successMessage);
    } catch (error) {
      console.error(
        `${reportKey} download failed:`,
        error
      );

      let errorMessage =
        t("reports.reportGenerateError");

      if (error.response?.status === 401) {
        errorMessage =
          t("reports.sessionExpired");
      } else if (error.response?.status === 403) {
        errorMessage =
          t("reports.noReportPermission");
      } else if (error.response?.status >= 500) {
        errorMessage =
          t("reports.reportServiceError");
      }

      showNotification(
        "error",
        errorMessage
      );
    } finally {
      setLoadingReport(null);
    }
  };

  /* ==========================================================
     PowerPoint
     ========================================================== */

  const downloadExecutivePowerPoint = () =>
    downloadFile({
      reportKey: "powerpoint",

      endpoint: "/reports/powerpoint",

      fallbackFilename:
        "Mine_Manager_AI_Executive_Board_Pack.pptx",

      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

      successMessage:
        t("reports.powerPointSuccess"),
    });

  /* ==========================================================
     Daily PDF
     ========================================================== */

  const downloadDailyPdf = () =>
    downloadFile({
      reportKey: "daily",

      endpoint: "/reports/daily/pdf",

      fallbackFilename:
        "Daily_Executive_Report.pdf",

      mimeType:
        "application/pdf",

      successMessage:
        t("reports.dailySuccess"),
    });

  /* ==========================================================
     Weekly PDF
     ========================================================== */

  const downloadWeeklyPdf = () =>
    downloadFile({
      reportKey: "weekly",

      endpoint: "/reports/weekly/pdf",

      fallbackFilename:
        "Weekly_Operations_Report.pdf",

      mimeType:
        "application/pdf",

      successMessage:
        t("reports.weeklySuccess"),
    });

  /* ==========================================================
     Monthly PDF
     ========================================================== */

  const downloadMonthlyPdf = () =>
    downloadFile({
      reportKey: "monthly",

      endpoint: "/reports/monthly/pdf",

      fallbackFilename:
        "Monthly_KPI_Pack.pdf",

      mimeType:
        "application/pdf",

      successMessage:
        t("reports.monthlySuccess"),
    });

  /* ==========================================================
     Excel
     ========================================================== */

  const downloadExecutiveExcel = () =>
    downloadFile({
      reportKey: "excel",

      endpoint: "/reports/excel",

      fallbackFilename:
        "Mine_Manager_AI_Executive_Export.xlsx",

      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      successMessage:
        t("reports.excelSuccess"),
    });

  const isGenerating =
    loadingReport !== null;

  /* ==========================================================
     UI
     ========================================================== */

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 3,
          lg: 4,
        },

        minHeight: "100vh",

        bgcolor: "#f8fafc",
      }}
    >
      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <ReportHeader />

      {/* ======================================================
          REPORT GENERATOR
          ====================================================== */}

      <Box
        sx={{
          mt: 2,

          p: {
            xs: 1.75,
            md: 2,
          },

          border:
            "1px solid #e2e8f0",

          borderRadius:
            "14px",

          bgcolor:
            "#ffffff",

          boxShadow:
            "0 2px 8px rgba(15, 23, 42, 0.035)",
        }}
      >
        {/* ====================================================
            Section Header
            ==================================================== */}

        <Box
          sx={{
            mb: 1.75,

            display: "flex",

            alignItems: {
              xs: "flex-start",
              sm: "center",
            },

            justifyContent:
              "space-between",

            flexDirection: {
              xs: "column",
              sm: "row",
            },

            gap: 1.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                color:
                  "#0f172a",

                fontSize:
                  15,

                fontWeight:
                  800,

                lineHeight:
                  1.2,

                letterSpacing:
                  "-0.01em",
              }}
            >
              ТАЙЛАН ҮҮСГЭХ
            </Typography>

            <Typography
              sx={{
                mt: 0.35,

                color:
                  "#64748b",

                fontSize:
                  10.8,

                fontWeight:
                  500,

                lineHeight:
                  1.45,
              }}
            >
              Удирдлагын тайлангийн төрөл болон
              хугацааг сонгоно уу.
            </Typography>
          </Box>

          <Box
            sx={{
              px: 1,

              py: 0.5,

              borderRadius:
                "7px",

              bgcolor:
                "#f8fafc",

              border:
                "1px solid #e2e8f0",
            }}
          >
            <Typography
              sx={{
                color:
                  "#64748b",

                fontSize:
                  9.5,

                fontWeight:
                  800,

                letterSpacing:
                  "0.05em",

                whiteSpace:
                  "nowrap",
              }}
            >
              6 REPORT TYPES
            </Typography>
          </Box>
        </Box>

        {/* ====================================================
            REPORT CARDS
            ==================================================== */}

        <Grid
          container
          spacing={1.5}
        >
          {/* ==================================================
              ROW 1 — DAILY
              ================================================== */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 4,
            }}
          >
            <ReportCard
              title={
                t(
                  "reports.dailyExecutiveReport"
                )
              }
              subtitle={
                t(
                  "reports.dailyExecutiveReportSubtitle"
                )
              }
              frequency={
                t("reports.daily")
              }
              format="PDF"
              loading={
                loadingReport ===
                "daily"
              }
              icon={
                <DescriptionIcon />
              }
              sections={[
                t(
                  "reports.executiveSummary"
                ),
                t(
                  "reports.productionPerformance"
                ),
                t(
                  "reports.priorityActions"
                ),
              ]}
              buttonText={
                loadingReport ===
                "daily"
                  ? t(
                      "reports.generatingPdf"
                    )
                  : t(
                      "reports.generatePdf"
                    )
              }
              disabled={
                isGenerating
              }
              onClick={
                downloadDailyPdf
              }
            />
          </Grid>

          {/* ==================================================
              ROW 1 — WEEKLY
              ================================================== */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 4,
            }}
          >
            <ReportCard
              title={
                t(
                  "reports.weeklyOperationsReport"
                )
              }
              subtitle={
                t(
                  "reports.weeklyOperationsReportSubtitle"
                )
              }
              frequency={
                t("reports.weekly")
              }
              format="PDF"
              loading={
                loadingReport ===
                "weekly"
              }
              icon={
                <CalendarMonthIcon />
              }
              sections={[
                t(
                  "reports.weeklyKpiTrends"
                ),
                t(
                  "reports.departmentPerformance"
                ),
                t(
                  "reports.riskMovement"
                ),
              ]}
              buttonText={
                loadingReport ===
                "weekly"
                  ? t(
                      "reports.generatingPdf"
                    )
                  : t(
                      "reports.generatePdf"
                    )
              }
              disabled={
                isGenerating
              }
              onClick={
                downloadWeeklyPdf
              }
            />
          </Grid>

          {/* ==================================================
              ROW 1 — MONTHLY
              ================================================== */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 4,
            }}
          >
            <ReportCard
              title={
                t(
                  "reports.monthlyKpiPack"
                )
              }
              subtitle={
                t(
                  "reports.monthlyKpiPackSubtitle"
                )
              }
              frequency={
                t("reports.monthly")
              }
              format="PDF"
              loading={
                loadingReport ===
                "monthly"
              }
              icon={
                <InsightsIcon />
              }
              sections={[
                t(
                  "reports.mineHealthScore"
                ),
                t(
                  "reports.monthlyKpiSummary"
                ),
                t(
                  "reports.productionVariance"
                ),
              ]}
              buttonText={
                loadingReport ===
                "monthly"
                  ? t(
                      "reports.generatingPdf"
                    )
                  : t(
                      "reports.generatePdf"
                    )
              }
              disabled={
                isGenerating
              }
              onClick={
                downloadMonthlyPdf
              }
            />
          </Grid>

          {/* ==================================================
              ROW 2 — QUARTERLY
              ================================================== */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 4,
            }}
          >
            <ReportCard
              title="Улирлын гүйцэтгэлийн тайлан"
              subtitle="Quarterly Performance Report"
              frequency="Улирал бүр"
              format="PDF"
              icon={
                <DateRangeRoundedIcon />
              }
              sections={[
                "Quarterly KPI Performance",
                "Trend & Variance",
                "Risk & Outlook",
              ]}
              buttonText="Тун удахгүй"
              disabled
            />
          </Grid>

          {/* ==================================================
              ROW 2 — ANNUAL
              ================================================== */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 4,
            }}
          >
            <ReportCard
              title="Жилийн гүйцэтгэлийн тайлан"
              subtitle="Annual Performance Report"
              frequency="Жил бүр"
              format="PDF"
              icon={
                <EventNoteRoundedIcon />
              }
              sections={[
                "Annual KPI Performance",
                "Year-over-Year Trend",
                "Executive Review",
              ]}
              buttonText="Тун удахгүй"
              disabled
            />
          </Grid>

          {/* ==================================================
              ROW 2 — EXECUTIVE BOARD PACK
              ================================================== */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 4,
            }}
          >
            <ReportCard
              title={
                t(
                  "reports.executiveBoardPack"
                )
              }
              subtitle={
                t(
                  "reports.executiveBoardPackSubtitle"
                )
              }
              frequency={
                t(
                  "reports.onDemand"
                )
              }
              format="PPTX"
              badge={
                t(
                  "reports.newLabel"
                )
              }
              featured
              loading={
                loadingReport ===
                "powerpoint"
              }
              icon={
                <SlideshowIcon />
              }
              sections={[
                t(
                  "reports.executiveKpiSummary"
                ),
                t(
                  "reports.productionTrend"
                ),
                t(
                  "reports.keyOperationalRisks"
                ),
              ]}
              buttonText={
                loadingReport ===
                "powerpoint"
                  ? t(
                      "reports.generatingPowerPoint"
                    )
                  : t(
                      "reports.generatePowerPoint"
                    )
              }
              disabled={
                isGenerating
              }
              onClick={
                downloadExecutivePowerPoint
              }
            />
          </Grid>
        </Grid>
      </Box>

      {/* ======================================================
          EXCEL DATA EXPORT
          ====================================================== */}

      <Box
        sx={{
          mt: 1.5,
        }}
      >
        <ExportCard
          onClick={
            downloadExecutiveExcel
          }
          disabled={
            isGenerating
          }
        />
      </Box>

      {/* ======================================================
          REPORT HISTORY
          ====================================================== */}

      <ReportHistoryTable />

      {/* ======================================================
          NOTIFICATIONS
          ====================================================== */}

      <Snackbar
        open={
          notification.open
        }
        autoHideDuration={
          5000
        }
        onClose={
          closeNotification
        }
        anchorOrigin={{
          vertical:
            "top",

          horizontal:
            "right",
        }}
      >
        <Alert
          onClose={
            closeNotification
          }
          severity={
            notification.severity
          }
          variant="filled"
          sx={{
            width:
              "100%",

            borderRadius:
              "10px",

            fontWeight:
              700,
          }}
        >
          {
            notification.message
          }
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ExecutiveReports;