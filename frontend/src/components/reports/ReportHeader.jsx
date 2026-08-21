import {
  Box,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import { useLanguage } from "../../context/LanguageContext";

function ReportHeader() {
  const { t } = useLanguage();

  return (
    <Box
      sx={{
        mb: 3,
        p: {
          xs: 2.5,
          md: 3.5,
        },
        borderRadius: "24px",
        border: "1px solid #e5e7eb",
        background:
          "linear-gradient(135deg, #ffffff 0%, #fff7ed 55%, #f8fafc 100%)",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.07)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 7,
          height: "100%",
          bgcolor: "#f97316",
        }}
      />

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
        spacing={3}
      >
        <Box sx={{ pl: 1 }}>
          <Typography
            sx={{
              fontSize: {
                xs: 28,
                md: 34,
              },
              fontWeight: 900,
              color: "#0f172a",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            {t("reports.title")}
          </Typography>

          <Typography
            sx={{
              mt: 1.2,
              maxWidth: 720,
              color: "#64748b",
              fontSize: {
                xs: 14,
                md: 15,
              },
              lineHeight: 1.7,
            }}
          >
            {t("reports.headerDescription")}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ mt: 2.2 }}
          >
            <Chip
              icon={<DescriptionOutlinedIcon />}
              label={t("reports.pdfReports")}
              size="small"
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #fed7aa",
                color: "#9a3412",
                fontWeight: 800,
                "& .MuiChip-icon": {
                  color: "#f97316",
                },
              }}
            />

            <Chip
              icon={<SlideshowOutlinedIcon />}
              label={t("reports.powerPointBoardPack")}
              size="small"
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #fed7aa",
                color: "#9a3412",
                fontWeight: 800,
                "& .MuiChip-icon": {
                  color: "#f97316",
                },
              }}
            />

            <Chip
              icon={<TableViewOutlinedIcon />}
              label={t("reports.excelExport")}
              size="small"
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #bfdbfe",
                color: "#1d4ed8",
                fontWeight: 800,
                "& .MuiChip-icon": {
                  color: "#2563eb",
                },
              }}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            minWidth: {
              xs: "100%",
              md: 210,
            },
            p: 2.2,
            borderRadius: "18px",
            bgcolor: "rgba(255, 255, 255, 0.88)",
            border: "1px solid #fed7aa",
            textAlign: {
              xs: "left",
              md: "right",
            },
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 900,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {t("reports.availableOutputs")}
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              fontSize: 30,
              fontWeight: 900,
              color: "#f97316",
              lineHeight: 1,
            }}
          >
            5
          </Typography>

          <Typography
            sx={{
              mt: 0.8,
              fontSize: 13,
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            {t("reports.availableOutputsDescription")}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export default ReportHeader;
