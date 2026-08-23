import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

import { useLanguage } from "../../context/LanguageContext";

function ExportCard({ onClick, disabled = false }) {
  const { t } = useLanguage();

  const excelGreen = "#217346";
  const excelGreenDark = "#185c37";
  const excelSoft = "#f0fdf4";
  const excelBorder = "#bbf7d0";

  const includedItems = [
    t("reports.production"),
    t("reports.fleet"),
    t("reports.plant"),
    t("reports.safety"),
    t("reports.maintenance"),
  ];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "14px",
        border: `1px solid ${excelBorder}`,
        background: "#ffffff",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.035)",
        overflow: "hidden",
        position: "relative",

        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 4,
          bgcolor: excelGreen,
        },
      }}
    >
      <CardContent
        sx={{
          px: {
            xs: 2,
            md: 2.25,
          },
          py: {
            xs: 1.6,
            md: 1.8,
          },
          "&:last-child": {
            pb: {
              xs: 1.6,
              md: 1.8,
            },
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "220px minmax(0, 1fr) auto",
            },
            alignItems: {
              xs: "stretch",
              md: "center",
            },
            gap: {
              xs: 1.6,
              md: 2,
            },
          }}
        >
          {/* LEFT */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "11px",
                bgcolor: excelSoft,
                color: excelGreen,
                border: `1px solid ${excelBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TableViewRoundedIcon sx={{ fontSize: 24 }} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={0.7}
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
              >
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.25,
                  }}
                >
                  {t("reports.excelExport")}
                </Typography>

                <Chip
                  label="EXCEL"
                  size="small"
                  sx={{
                    height: 22,
                    bgcolor: excelSoft,
                    color: excelGreen,
                    border: `1px solid ${excelBorder}`,
                    borderRadius: "6px",
                    fontSize: 9.5,
                    fontWeight: 900,
                    letterSpacing: "0.04em",

                    "& .MuiChip-label": {
                      px: 0.8,
                    },
                  }}
                />
              </Stack>

              <Typography
                sx={{
                  mt: 0.3,
                  fontSize: 10.8,
                  color: "#64748b",
                  fontWeight: 500,
                }}
              >
                {t("reports.excelExportSubtitle")}
              </Typography>
            </Box>
          </Box>

          {/* CENTER */}
          <Stack
            direction="row"
            spacing={1.3}
            useFlexGap
            flexWrap="wrap"
            sx={{
              alignItems: "center",
            }}
          >
            {includedItems.map((item) => (
              <Box
                key={item}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <CheckCircleRoundedIcon
                  sx={{
                    fontSize: 14,
                    color: excelGreen,
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 10.6,
                    color: "#475569",
                    fontWeight: 650,
                  }}
                >
                  {item}
                </Typography>
              </Box>
            ))}
          </Stack>

          {/* RIGHT */}
          <Button
            variant="contained"
            disabled={disabled}
            onClick={onClick}
            disableElevation
            startIcon={<DownloadRoundedIcon sx={{ fontSize: "16px !important" }} />}
            sx={{
              minHeight: 36,
              px: 1.8,
              py: 0.7,
              borderRadius: "8px",
              bgcolor: excelGreen,
              color: "#ffffff",
              fontSize: 10.8,
              fontWeight: 800,
              textTransform: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 6px 14px rgba(33, 115, 70, 0.16)",

              "&:hover": {
                bgcolor: excelGreenDark,
                boxShadow: "0 6px 14px rgba(33, 115, 70, 0.2)",
              },

              "&.Mui-disabled": {
                bgcolor: "#e2e8f0",
                color: "#94a3b8",
                boxShadow: "none",
              },
            }}
          >
            {t("reports.exportExcel")}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ExportCard;