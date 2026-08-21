import React, {
  useState,
} from "react";

import axios from "axios";

import {
  API_BASE_URL,
} from "../config/apiConfig";

import {
  Alert,
  Box,
  Grid,
  Snackbar,
} from "@mui/material";

import DescriptionIcon from "@mui/icons-material/Description";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InsightsIcon from "@mui/icons-material/Insights";
import SlideshowIcon from "@mui/icons-material/Slideshow";

import ReportHeader
  from "../components/reports/ReportHeader";

import ReportCard
  from "../components/reports/ReportCard";

import ExportCard
  from "../components/reports/ExportCard";

import ReportHistoryTable
  from "../components/reports/ReportHistoryTable";
import { useLanguage } from "../context/LanguageContext";


/* ============================================================
   Authenticated Report Download Client
   ============================================================ */

const reportDownloadClient =
  axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
  });


reportDownloadClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "access_token"
      ) ||
      localStorage.getItem(
        "token"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) =>
    Promise.reject(error)
);


/* ============================================================
   Executive Reports Page
   ============================================================ */

function ExecutiveReports() {
  const { t } = useLanguage();
  const [
    loadingReport,
    setLoadingReport,
  ] = useState(null);


  const [
    notification,
    setNotification,
  ] = useState({
    open: false,
    severity: "success",
    message: "",
  });


  /* ==========================================================
     Notifications
     ========================================================== */

  const showNotification = (
    severity,
    message
  ) => {
    setNotification({
      open: true,
      severity,
      message,
    });
  };


  const closeNotification = (
    _,
    reason
  ) => {
    if (
      reason === "clickaway"
    ) {
      return;
    }

    setNotification(
      (current) => ({
        ...current,
        open: false,
      })
    );
  };


  /* ==========================================================
     Download Filename Helper
     ========================================================== */

  const extractFilename = (
    contentDisposition,
    fallbackFilename
  ) => {
    if (
      !contentDisposition
    ) {
      return fallbackFilename;
    }

    const utf8Match =
      contentDisposition.match(
        /filename\*=UTF-8''([^;]+)/i
      );

    if (
      utf8Match?.[1]
    ) {
      return decodeURIComponent(
        utf8Match[1].replace(
          /["']/g,
          ""
        )
      );
    }

    const standardMatch =
      contentDisposition.match(
        /filename="?([^"]+)"?/i
      );

    if (
      standardMatch?.[1]
    ) {
      return standardMatch[
        1
      ].trim();
    }

    return fallbackFilename;
  };


  /* ==========================================================
     Shared Authenticated Download Function
     ========================================================== */

  const downloadFile =
    async ({
      reportKey,
      endpoint,
      fallbackFilename,
      mimeType,
      successMessage,
    }) => {
      if (loadingReport) {
        return;
      }

      setLoadingReport(
        reportKey
      );

      try {
        const response =
          await reportDownloadClient.get(
            endpoint,
            {
              responseType:
                "blob",
            }
          );


        const contentType =
          response.headers[
            "content-type"
          ] ||
          mimeType;


        const fileBlob =
          new Blob(
            [
              response.data,
            ],
            {
              type:
                contentType,
            }
          );


        const contentDisposition =
          response.headers[
            "content-disposition"
          ];


        const filename =
          extractFilename(
            contentDisposition,
            fallbackFilename
          );


        const fileUrl =
          window.URL.createObjectURL(
            fileBlob
          );


        const link =
          document.createElement(
            "a"
          );

        link.href =
          fileUrl;

        link.setAttribute(
          "download",
          filename
        );


        document.body.appendChild(
          link
        );

        link.click();

        link.remove();


        window.URL.revokeObjectURL(
          fileUrl
        );


        showNotification(
          "success",
          successMessage
        );
      } catch (error) {
        console.error(
          `${reportKey} download failed:`,
          error
        );


        let errorMessage =
          t("reports.reportGenerateError");


        if (
          error.response?.status ===
          401
        ) {
          errorMessage =
            t("reports.sessionExpired");
        } else if (
          error.response?.status ===
          403
        ) {
          errorMessage =
            t("reports.noReportPermission");
        } else if (
          error.response?.status >=
          500
        ) {
          errorMessage =
            t("reports.reportServiceError");
        }


        showNotification(
          "error",
          errorMessage
        );
      } finally {
        setLoadingReport(
          null
        );
      }
    };


  /* ==========================================================
     PowerPoint
     ========================================================== */

  const downloadExecutivePowerPoint =
    () =>
      downloadFile({
        reportKey:
          "powerpoint",

        endpoint:
          "/reports/powerpoint",

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

  const downloadDailyPdf =
    () =>
      downloadFile({
        reportKey:
          "daily",

        endpoint:
          "/reports/daily/pdf",

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

  const downloadWeeklyPdf =
    () =>
      downloadFile({
        reportKey:
          "weekly",

        endpoint:
          "/reports/weekly/pdf",

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

  const downloadMonthlyPdf =
    () =>
      downloadFile({
        reportKey:
          "monthly",

        endpoint:
          "/reports/monthly/pdf",

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

  const downloadExecutiveExcel =
    () =>
      downloadFile({
        reportKey:
          "excel",

        endpoint:
          "/reports/excel",

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

        minHeight:
          "100vh",

        bgcolor:
          "#f8fafc",
      }}
    >
      <ReportHeader />


      <Grid
        container
        spacing={3}
      >

        {/* ==================================================
            Executive Board Pack
            ================================================== */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <ReportCard
            title={t("reports.executiveBoardPack")}

            subtitle={t("reports.executiveBoardPackSubtitle")}

            frequency={t("reports.onDemand")}

            format=
              "PPTX"

            badge={t("reports.newLabel")}

            featured

            loading={
              loadingReport ===
              "powerpoint"
            }

            icon={
              <SlideshowIcon />
            }

            sections={[
              t("reports.executiveKpiSummary"),
              t("reports.productionTrend"),
              t("reports.fleetPlantSafety"),
              t("reports.keyOperationalRisks"),
              t("reports.managementActions"),
              t("reports.executiveRecommendations"),
            ]}

            buttonText={
              loadingReport ===
              "powerpoint"
                ? t("reports.generatingPowerPoint")
                : t("reports.generatePowerPoint")
            }

            disabled={
              isGenerating
            }

            onClick={
              downloadExecutivePowerPoint
            }
          />
        </Grid>


        {/* ==================================================
            Daily Executive Report
            ================================================== */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <ReportCard
            title={t("reports.dailyExecutiveReport")}

            subtitle={t("reports.dailyExecutiveReportSubtitle")}

            frequency={t("reports.daily")}

            format=
              "PDF"

            loading={
              loadingReport ===
              "daily"
            }

            icon={
              <DescriptionIcon />
            }

            sections={[
              t("reports.executiveSummary"),
              t("reports.productionPerformance"),
              t("reports.fleetPlantStatus"),
              t("reports.safetyRiskOverview"),
              t("reports.priorityActions"),
            ]}

            buttonText={
              loadingReport ===
              "daily"
                ? t("reports.generatingPdf")
                : t("reports.generatePdf")
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
            Weekly Operations Report
            ================================================== */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <ReportCard
            title={t("reports.weeklyOperationsReport")}

            subtitle={t("reports.weeklyOperationsReportSubtitle")}

            frequency={t("reports.weekly")}

            format=
              "PDF"

            loading={
              loadingReport ===
              "weekly"
            }

            icon={
              <CalendarMonthIcon />
            }

            sections={[
              t("reports.weeklyKpiTrends"),
              t("reports.departmentPerformance"),
              t("reports.riskMovement"),
              t("reports.aiRecommendations"),
              t("reports.actionFollowUp"),
            ]}

            buttonText={
              loadingReport ===
              "weekly"
                ? t("reports.generatingPdf")
                : t("reports.generatePdf")
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
            Monthly KPI Pack
            ================================================== */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <ReportCard
            title={t("reports.monthlyKpiPack")}

            subtitle={t("reports.monthlyKpiPackSubtitle")}

            frequency={t("reports.monthly")}

            format=
              "PDF"

            loading={
              loadingReport ===
              "monthly"
            }

            icon={
              <InsightsIcon />
            }

            sections={[
              t("reports.mineHealthScore"),
              t("reports.monthlyKpiSummary"),
              t("reports.productionVariance"),
              t("reports.riskRegister"),
              t("reports.managementCommentary"),
            ]}

            buttonText={
              loadingReport ===
              "monthly"
                ? t("reports.generatingPdf")
                : t("reports.generatePdf")
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
            Excel Export
            ================================================== */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <ExportCard
            title=
              "Excel Export"

            subtitle=
              "Export operational datasets for analysis, sharing, and Power BI."

            frequency={t("reports.onDemand")}

            format=
              "XLSX"

            loading={
              loadingReport ===
              "excel"
            }

            sections={[
              t("reports.executiveSummary"),
              "Production Dataset",
              "Fleet Dataset",
              "Plant Dataset",
              "Safety Dataset",
              "KPI Definitions",
            ]}

            buttonText={
              loadingReport ===
              "excel"
                ? t("reports.generatingExcel")
                : t("reports.exportExcel")
            }

            disabled={
              isGenerating
            }

            onClick={
              downloadExecutiveExcel
            }
          />
        </Grid>

      </Grid>


      {/* ====================================================
          Report History
          ==================================================== */}

      <ReportHistoryTable />


      {/* ====================================================
          Notifications
          ==================================================== */}

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

          variant=
            "filled"

          sx={{
            width:
              "100%",

            borderRadius:
              "12px",

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

