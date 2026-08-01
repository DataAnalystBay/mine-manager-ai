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
  const accentColor = featured ? "#f97316" : "#16a34a";
  const accentDark = featured ? "#ea580c" : "#15803d";
  const accentLight = featured ? "#fff7ed" : "#ecfdf5";
  const accentBorder = featured ? "#fed7aa" : "#d1fae5";

  return (
    <Card
      sx={{
        height: "100%",
        minHeight: 410,
        borderRadius: "24px",
        border: featured
          ? "1px solid #fdba74"
          : "1px solid #e5e7eb",
        boxShadow: featured
          ? "0 24px 55px rgba(249, 115, 22, 0.16)"
          : "0 18px 45px rgba(15, 23, 42, 0.08)",
        transition: "0.22s ease",
        background: featured
          ? "linear-gradient(155deg, #ffffff 0%, #fff7ed 100%)"
          : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: featured
            ? "0 30px 70px rgba(249, 115, 22, 0.22)"
            : "0 24px 60px rgba(15, 23, 42, 0.13)",
        },
      }}
    >
      {featured && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 5,
            bgcolor: accentColor,
          }}
        />
      )}

      <CardContent
        sx={{
          p: {
            xs: 2.5,
            md: 3,
          },
          height: "100%",
          "&:last-child": {
            pb: {
              xs: 2.5,
              md: 3,
            },
          },
        }}
      >
        <Stack
          spacing={2.1}
          sx={{
            height: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
              >
                <Typography
                  sx={{
                    fontSize: {
                      xs: 19,
                      md: featured ? 23 : 20,
                    },
                    fontWeight: 900,
                    color: "#0f172a",
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {title}
                </Typography>

                {badge && (
                  <Chip
                    label={badge}
                    size="small"
                    sx={{
                      height: 23,
                      bgcolor: "#ffedd5",
                      color: "#c2410c",
                      border: "1px solid #fed7aa",
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: "0.06em",
                    }}
                  />
                )}
              </Stack>

              <Typography
                sx={{
                  mt: 0.85,
                  maxWidth: 520,
                  fontSize: 14,
                  color: "#64748b",
                  lineHeight: 1.55,
                }}
              >
                {subtitle}
              </Typography>
            </Box>

            <Box
              sx={{
                width: featured ? 52 : 46,
                height: featured ? 52 : 46,
                borderRadius: featured ? "18px" : "16px",
                bgcolor: accentLight,
                color: accentColor,
                border: `1px solid ${accentBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                "& svg": {
                  fontSize: featured ? 28 : 25,
                },
              }}
            >
              {icon}
            </Box>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
          >
            <Chip
              label={frequency}
              size="small"
              sx={{
                bgcolor: "#f1f5f9",
                color: "#334155",
                fontWeight: 800,
                borderRadius: "999px",
              }}
            />

            <Chip
              label={format}
              size="small"
              sx={{
                bgcolor: featured ? "#ffedd5" : "#f0fdf4",
                color: featured ? "#c2410c" : "#15803d",
                border: `1px solid ${accentBorder}`,
                fontWeight: 900,
                borderRadius: "999px",
              }}
            />
          </Stack>

          <Box
            sx={{
              borderTop: "1px solid #e5e7eb",
              pt: 1.8,
              flexGrow: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 900,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                mb: 1.25,
              }}
            >
              Includes
            </Typography>

            <Stack spacing={1.05}>
              {sections.map((section) => (
                <Box
                  key={section}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    minHeight: 23,
                  }}
                >
                  <CheckCircleRoundedIcon
                    sx={{
                      fontSize: 16,
                      color: accentColor,
                      flexShrink: 0,
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: 13.5,
                      color: "#334155",
                      fontWeight: 700,
                      lineHeight: 1.35,
                    }}
                  >
                    {section}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Button
            fullWidth
            variant="contained"
            disabled={disabled}
            onClick={onClick}
            startIcon={
              loading ? (
                <CircularProgress
                  size={17}
                  thickness={5}
                  sx={{
                    color: "inherit",
                  }}
                />
              ) : null
            }
            sx={{
              mt: "auto",
              py: 1.35,
              minHeight: 46,
              borderRadius: "14px",
              bgcolor: accentColor,
              color: "#ffffff",
              fontWeight: 900,
              textTransform: "none",
              boxShadow: featured
                ? "0 14px 28px rgba(249, 115, 22, 0.3)"
                : "0 12px 24px rgba(22, 163, 74, 0.25)",
              "&:hover": {
                bgcolor: accentDark,
                boxShadow: featured
                  ? "0 18px 34px rgba(249, 115, 22, 0.36)"
                  : "0 16px 30px rgba(22, 163, 74, 0.32)",
              },
              "&.Mui-disabled": {
                bgcolor: featured ? "#fdba74" : "#86efac",
                color: "#ffffff",
              },
            }}
          >
            {buttonText}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ReportCard;