import {
  Box,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";

import { useLanguage } from "../../context/LanguageContext";

function ReportHeader() {
  const { t } = useLanguage();

  const reportingDate = new Date();

  const formattedDate = reportingDate.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }
  );

  return (
    <Box
      sx={{
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            lg: "row",
          },
          alignItems: {
            xs: "stretch",
            lg: "flex-end",
          },
          justifyContent: "space-between",
          gap: {
            xs: 2,
            lg: 3,
          },
        }}
      >
        {/* =====================================================
            LEFT — TITLE AREA
            ===================================================== */}

        <Box
          sx={{
            minWidth: 0,
          }}
        >
          {/* Eyebrow */}
          <Stack
            direction="row"
            spacing={0.7}
            alignItems="center"
            sx={{
              mb: 0.7,
            }}
          >
            <AssessmentRoundedIcon
              sx={{
                fontSize: 14,
                color: "#2563eb",
              }}
            />

            <Typography
              sx={{
                fontSize: 9.5,
                fontWeight: 900,
                color: "#2563eb",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1.2,
              }}
            >
              EXECUTIVE INTELLIGENCE
            </Typography>

            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                bgcolor: "#94a3b8",
              }}
            />

            <Typography
              sx={{
                fontSize: 9.5,
                fontWeight: 800,
                color: "#15803d",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                lineHeight: 1.2,
              }}
            >
              REPORTING CENTER
            </Typography>
          </Stack>

          {/* Main Title */}
          <Typography
            sx={{
              fontSize: {
                xs: 26,
                md: 30,
              },
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
            }}
          >
            {t("reports.title")}
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              mt: 0.7,
              maxWidth: 720,
              fontSize: {
                xs: 11.5,
                md: 12,
              },
              fontWeight: 500,
              color: "#64748b",
              lineHeight: 1.55,
            }}
          >
            {t("reports.headerDescription")}
          </Typography>
        </Box>

        {/* =====================================================
            RIGHT — REPORTING CONTROLS
            ===================================================== */}

        <Stack
          direction="row"
          spacing={1}
          alignItems="stretch"
          sx={{
            flexShrink: 0,
          }}
        >
          {/* Reporting Date */}
          <Box
            sx={{
              minWidth: 150,
              px: 1.5,
              py: 1.15,
              borderRadius: "10px",
              border: "1px solid #dbe3ee",
              bgcolor: "#ffffff",
              boxShadow:
                "0 2px 6px rgba(15, 23, 42, 0.035)",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "8px",
                bgcolor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CalendarMonthRoundedIcon
                sx={{
                  fontSize: 17,
                }}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: 8,
                  fontWeight: 900,
                  color: "#94a3b8",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                }}
              >
                REPORTING DATE
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.25,
                }}
              >
                {formattedDate}
              </Typography>
            </Box>
          </Box>

          {/* Refresh */}
          <IconButton
            aria-label="Refresh executive reports"
            sx={{
              width: 42,
              height: 42,
              alignSelf: "center",
              borderRadius: "10px",
              border: "1px solid #dbe3ee",
              bgcolor: "#ffffff",
              color: "#475569",
              boxShadow:
                "0 2px 6px rgba(15, 23, 42, 0.035)",

              "&:hover": {
                bgcolor: "#f8fafc",
                color: "#2563eb",
              },
            }}
          >
            <RefreshRoundedIcon
              sx={{
                fontSize: 19,
              }}
            />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
}

export default ReportHeader;