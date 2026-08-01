import React, { useState } from "react";
import axios from "axios";

import { API_BASE_URL } from "../config/apiConfig";

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

import ReportHeader from "../components/reports/ReportHeader";
import ReportCard from "../components/reports/ReportCard";
import ExportCard from "../components/reports/ExportCard";
import ReportHistoryTable from "../components/reports/ReportHistoryTable";


function ExecutiveReports() {
  const [loadingReport, setLoadingReport] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    severity: "success",
    message: "",
  });


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
      const response = await axios.get(
        `${API_BASE_URL}${endpoint}`,
        {
          responseType: "blob",
        }
      );

      const contentType =
        response.headers["content-type"] || mimeType;

      const fileBlob = new Blob(
        [response.data],
        {
          type: contentType,
        }
      );

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
        "Unable to generate the report. Please confirm the backend is running.";

      if (error.response?.status === 401) {
        errorMessage =
          "Your session has expired. Please sign in again.";
      } else if (error.response?.status === 403) {
        errorMessage =
          "You do not have permission to download this report.";
      } else if (error.response?.status >= 500) {
        errorMessage =
          "The report service encountered an error. Please review the backend logs.";
      }

      showNotification(
        "error",
        errorMessage
      );
    } finally {
      setLoadingReport(null);
    }
  };


  const downloadExecutivePowerPoint = () =>
    downloadFile({
      reportKey: "powerpoint",
      endpoint: "/reports/powerpoint",
      fallbackFilename:
        "Mine_Manager_AI_Executive_Board_Pack.pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      successMessage:
        "Executive PowerPoint Board Pack generated successfully.",
    });


  const downloadDailyPdf = () =>
    downloadFile({
      reportKey: "daily",
      endpoint: "/reports/daily/pdf",
      fallbackFilename:
        "Daily_Executive_Report.pdf",
      mimeType: "application/pdf",
      successMessage:
        "Daily Executive Report generated successfully.",
    });


  const downloadWeeklyPdf = () =>
    downloadFile({
      reportKey: "weekly",
      endpoint: "/reports/weekly/pdf",
      fallbackFilename:
        "Weekly_Operations_Report.pdf",
      mimeType: "application/pdf",
      successMessage:
        "Weekly Operations Report generated successfully.",
    });


  const downloadMonthlyPdf = () =>
    downloadFile({
      reportKey: "monthly",
      endpoint: "/reports/monthly/pdf",
      fallbackFilename:
        "Monthly_KPI_Pack.pdf",
      mimeType: "application/pdf",
      successMessage:
        "Monthly KPI Pack generated successfully.",
    });


  const downloadExecutiveExcel = () =>
    downloadFile({
      reportKey: "excel",
      endpoint: "/reports/excel",
      fallbackFilename:
        "Mine_Manager_AI_Executive_Export.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      successMessage:
        "Executive Excel workbook exported successfully.",
    });


  const isGenerating =
    loadingReport !== null;


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
      <ReportHeader />

      <Grid
        container
        spacing={3}
      >
        <Grid size={{ xs: 12, md: 6 }}>
          <ReportCard
            title="Executive Board Pack"
            subtitle="Board-ready PowerPoint presentation for executive operational reviews."
            frequency="On demand"
            format="PPTX"
            badge="NEW"
            featured
            loading={
              loadingReport === "powerpoint"
            }
            icon={<SlideshowIcon />}
            sections={[
              "Executive KPI Summary",
              "Production Trend",
              "Fleet, Plant & Safety",
              "Key Operational Risks",
              "Management Actions",
              "Executive Recommendations",
            ]}
            buttonText={
              loadingReport === "powerpoint"
                ? "Generating PowerPoint..."
                : "Generate PowerPoint"
            }
            disabled={isGenerating}
            onClick={
              downloadExecutivePowerPoint
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ReportCard
            title="Daily Executive Report"
            subtitle="Meeting-ready daily summary for mine leadership."
            frequency="Daily"
            format="PDF"
            loading={
              loadingReport === "daily"
            }
            icon={<DescriptionIcon />}
            sections={[
              "Executive Summary",
              "Production Performance",
              "Fleet & Plant Status",
              "Safety & Risk Overview",
              "Priority Actions",
            ]}
            buttonText={
              loadingReport === "daily"
                ? "Generating PDF..."
                : "Generate PDF"
            }
            disabled={isGenerating}
            onClick={downloadDailyPdf}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ReportCard
            title="Weekly Operations Report"
            subtitle="Operational trend review for weekly performance meetings."
            frequency="Weekly"
            format="PDF"
            loading={
              loadingReport === "weekly"
            }
            icon={<CalendarMonthIcon />}
            sections={[
              "Weekly KPI Trends",
              "Department Performance",
              "Risk Movement",
              "AI Recommendations",
              "Action Follow-up",
            ]}
            buttonText={
              loadingReport === "weekly"
                ? "Generating PDF..."
                : "Generate PDF"
            }
            disabled={isGenerating}
            onClick={downloadWeeklyPdf}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ReportCard
            title="Monthly KPI Pack"
            subtitle="Executive KPI pack for monthly leadership review."
            frequency="Monthly"
            format="PDF"
            loading={
              loadingReport === "monthly"
            }
            icon={<InsightsIcon />}
            sections={[
              "Mine Health Score",
              "Monthly KPI Summary",
              "Production Variance",
              "Risk Register",
              "Management Commentary",
            ]}
            buttonText={
              loadingReport === "monthly"
                ? "Generating PDF..."
                : "Generate PDF"
            }
            disabled={isGenerating}
            onClick={downloadMonthlyPdf}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ExportCard
            title="Excel Export"
            subtitle="Export operational datasets for analysis, sharing, and Power BI."
            frequency="On demand"
            format="XLSX"
            loading={
              loadingReport === "excel"
            }
            sections={[
              "Executive Summary",
              "Production Dataset",
              "Fleet Dataset",
              "Plant Dataset",
              "Safety Dataset",
              "KPI Definitions",
            ]}
            buttonText={
              loadingReport === "excel"
                ? "Generating Excel..."
                : "Export Excel"
            }
            disabled={isGenerating}
            onClick={downloadExecutiveExcel}
          />
        </Grid>
      </Grid>

      <ReportHistoryTable />

      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={closeNotification}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={closeNotification}
          severity={notification.severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: "12px",
            fontWeight: 700,
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}


export default ExecutiveReports;