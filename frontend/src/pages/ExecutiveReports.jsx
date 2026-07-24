import React from "react";
import axios from "axios";

import { Box, Grid } from "@mui/material";

import DescriptionIcon from "@mui/icons-material/Description";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InsightsIcon from "@mui/icons-material/Insights";

import ReportHeader from "../components/reports/ReportHeader";
import ReportCard from "../components/reports/ReportCard";
import ExportCard from "../components/reports/ExportCard";

const API_BASE_URL = "http://127.0.0.1:8000";

function ExecutiveReports() {
  const downloadFile = async (endpoint, filename, mimeType) => {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        responseType: "blob",
      });

      const fileBlob = new Blob([response.data], {
        type: mimeType,
      });

      const fileUrl = window.URL.createObjectURL(fileBlob);

      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error("Report download failed:", error);
      alert("Unable to download the report. Please confirm the backend is running.");
    }
  };

  const downloadDailyPdf = () => {
    return downloadFile(
      "/reports/daily/pdf",
      "Daily_Executive_Report.pdf",
      "application/pdf"
    );
  };

  const downloadWeeklyPdf = () => {
    return downloadFile(
      "/reports/weekly/pdf",
      "Weekly_Operations_Report.pdf",
      "application/pdf"
    );
  };

  const handleGenerate = (type) => {
    switch (type) {
      case "Daily Executive":
        downloadDailyPdf();
        break;

      case "Weekly Operations":
        downloadWeeklyPdf();
        break;

      case "Monthly KPI":
        alert("Monthly KPI Pack will be connected in the next step.");
        break;

      case "Excel Export":
        alert("Excel Export will be connected after the PDF reports.");
        break;

      default:
        console.warn(`Unknown report type: ${type}`);
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        minHeight: "100vh",
        bgcolor: "#f8fafc",
      }}
    >
      <ReportHeader />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <ReportCard
            title="Daily Executive Report"
            subtitle="Meeting-ready daily summary for mine leadership."
            frequency="Daily"
            icon={<DescriptionIcon />}
            sections={[
              "Executive Summary",
              "Production Performance",
              "Fleet & Plant Status",
              "Safety & Risk Overview",
              "Priority Actions",
            ]}
            buttonText="Generate PDF"
            onClick={() => handleGenerate("Daily Executive")}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <ReportCard
            title="Weekly Operations Report"
            subtitle="Operational trend review for weekly performance meetings."
            frequency="Weekly"
            icon={<CalendarMonthIcon />}
            sections={[
              "Weekly KPI Trends",
              "Department Performance",
              "Risk Movement",
              "AI Recommendations",
              "Action Follow-up",
            ]}
            buttonText="Generate PDF"
            onClick={() => handleGenerate("Weekly Operations")}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <ReportCard
            title="Monthly KPI Pack"
            subtitle="Executive KPI pack for monthly leadership review."
            frequency="Monthly"
            icon={<InsightsIcon />}
            sections={[
              "Mine Health Score",
              "Monthly KPI Summary",
              "Production Variance",
              "Risk Register",
              "Management Commentary",
            ]}
            buttonText="Generate PDF"
            onClick={() => handleGenerate("Monthly KPI")}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <ExportCard onClick={() => handleGenerate("Excel Export")} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default ExecutiveReports;