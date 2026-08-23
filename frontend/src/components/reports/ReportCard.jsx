import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import SlideshowRoundedIcon from "@mui/icons-material/SlideshowRounded";

import { useLanguage } from "../../context/LanguageContext";

function getFormatTheme(format = "PDF") {
  const normalizedFormat = String(format).toUpperCase();

  if (
    normalizedFormat === "PPTX" ||
    normalizedFormat === "PPT" ||
    normalizedFormat === "POWERPOINT"
  ) {
    return {
      label: "PPTX",
      color: "#d24726",
      dark: "#b83a1f",
      soft: "#fff4f0",
      border: "#f4c9bd",
      shadow: "0 5px 14px rgba(210, 71, 38, 0.14)",
      Icon: SlideshowRoundedIcon,
    };
  }

  return {
    label: "PDF",
    color: "#dc2626",
    dark: "#b91c1c",
    soft: "#fef2f2",
    border: "#fecaca",
    shadow: "0 5px 14px rgba(220, 38, 38, 0.12)",
    Icon: PictureAsPdfRoundedIcon,
  };
}

function ReportCard({
  title,
  subtitle,
  frequency,
  sections = [],
  buttonText,
  onClick,
  icon,
  disabled = false,
  loading = false,
  featured = false,
  format = "PDF",
  badge,
}) {
  const { t } = useLanguage();

  const theme = getFormatTheme(format);
  const FormatIcon = theme.Icon;

  const visibleSections = sections.slice(0, 3);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        minHeight: 238,
        borderRadius: "14px",
        border: featured
          ? `1px solid ${theme.border}`
          : "1px solid #e2e8f0",
        background: "#ffffff",
        boxShadow: featured
          ? theme.shadow
          : "0 2px 8px rgba(15, 23, 42, 0.035)",
        position: "relative",
        overflow: "hidden",
        transition:
          "border-color 160ms ease, box-shadow 160ms ease",

        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: theme.color,
          opacity: featured ? 1 : 0.85,
        },

        "&:hover": {
          borderColor: theme.border,
          boxShadow:
            "0 5px 16px rgba(15, 23, 42, 0.07)",
        },
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 2,
            md: 2.15,
          },
          height: "100%",

          "&:last-child": {
            pb: {
              xs: 2,
              md: 2.15,
            },
          },
        }}
      >
        <Stack
          spacing={1.35}
          sx={{
            height: "100%",
          }}
        >
          {/* =====================================================
              TOP ROW
              ===================================================== */}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 1.25,
            }}
          >
            <Stack
              direction="row"
              spacing={0.7}
              alignItems="center"
              useFlexGap
              flexWrap="wrap"
            >
              <Chip
                icon={
                  <FormatIcon
                    sx={{
                      fontSize:
                        "14px !important",
                      color:
                        `${theme.color} !important`,
                    }}
                  />
                }
                label={theme.label}
                size="small"
                sx={{
                  height: 23,
                  borderRadius: "6px",
                  bgcolor: theme.soft,
                  color: theme.color,
                  border:
                    `1px solid ${theme.border}`,
                  fontSize: 9.5,
                  fontWeight: 900,
                  letterSpacing: "0.04em",

                  "& .MuiChip-label": {
                    px: 0.7,
                  },

                  "& .MuiChip-icon": {
                    ml: 0.6,
                  },
                }}
              />

              {badge && (
                <Chip
                  label={badge}
                  size="small"
                  sx={{
                    height: 23,
                    borderRadius: "6px",
                    bgcolor: "#fff7ed",
                    color: "#c2410c",
                    border:
                      "1px solid #fed7aa",
                    fontSize: 9.2,
                    fontWeight: 900,

                    "& .MuiChip-label": {
                      px: 0.75,
                    },
                  }}
                />
              )}
            </Stack>

            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: theme.soft,
                color: theme.color,
                border:
                  `1px solid ${theme.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,

                "& svg": {
                  fontSize: 20,
                },
              }}
            >
              {icon || <FormatIcon />}
            </Box>
          </Box>

          {/* =====================================================
              TITLE
              ===================================================== */}

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: {
                  xs: 15,
                  md: 16,
                },
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.25,
                letterSpacing: "-0.012em",
              }}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography
                sx={{
                  mt: 0.35,
                  fontSize: 11.2,
                  color: "#64748b",
                  lineHeight: 1.42,
                  fontWeight: 500,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* =====================================================
              INCLUDED ITEMS
              ===================================================== */}

          {visibleSections.length > 0 && (
            <Box
              sx={{
                pt: 1.1,
                borderTop:
                  "1px solid #eef2f7",
                flexGrow: 1,
              }}
            >
              <Typography
                sx={{
                  mb: 0.8,
                  color: "#94a3b8",
                  fontSize: 8.8,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {t("reports.includes")}
              </Typography>

              <Stack spacing={0.65}>
                {visibleSections.map(
                  (section) => (
                    <Box
                      key={section}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.55,
                      }}
                    >
                      <CheckCircleRoundedIcon
                        sx={{
                          fontSize: 13.5,
                          color:
                            theme.color,
                          flexShrink: 0,
                        }}
                      />

                      <Typography
                        sx={{
                          fontSize: 10.4,
                          color: "#475569",
                          fontWeight: 650,
                          lineHeight: 1.25,
                        }}
                      >
                        {section}
                      </Typography>
                    </Box>
                  )
                )}
              </Stack>
            </Box>
          )}

          {/* =====================================================
              FOOTER
              ===================================================== */}

          <Box
            sx={{
              pt: 1.1,
              borderTop:
                "1px solid #eef2f7",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 1,
              mt: "auto",
            }}
          >
            {/* Frequency — simplified for cleaner UI */}
            <Box
              sx={{
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: 0.65,
              }}
            >
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  bgcolor: "#94a3b8",
                  flexShrink: 0,
                }}
              />

              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: 10.2,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {frequency}
              </Typography>
            </Box>

            <Button
              variant="contained"
              disabled={disabled}
              onClick={onClick}
              disableElevation
              startIcon={
                loading ? (
                  <CircularProgress
                    size={13}
                    thickness={5}
                    sx={{
                      color: "inherit",
                    }}
                  />
                ) : (
                  <FormatIcon
                    sx={{
                      fontSize:
                        "15px !important",
                    }}
                  />
                )
              }
              sx={{
                minHeight: 34,
                px: 1.4,
                py: 0.65,
                borderRadius: "8px",
                bgcolor: theme.color,
                color: "#ffffff",
                fontSize: 10.2,
                fontWeight: 800,
                textTransform: "none",
                whiteSpace: "nowrap",
                boxShadow: theme.shadow,

                "&:hover": {
                  bgcolor: theme.dark,
                  boxShadow: theme.shadow,
                },

                "&.Mui-disabled": {
                  bgcolor: "#e2e8f0",
                  color: "#94a3b8",
                  boxShadow: "none",
                },
              }}
            >
              {buttonText}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ReportCard;