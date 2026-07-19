import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
} from "@mui/material";

function ReportCard({
  title,
  subtitle,
  frequency,
  sections = [],
  buttonText,
  onClick,
  icon,
  disabled = false,
}) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "22px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
        transition: "0.22s ease",
        background:
          "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
        },
      }}
    >
      <CardContent sx={{ p: 3.2 }}>
        <Stack spacing={2.4}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Typography>

              <Typography
                sx={{
                  mt: 0.8,
                  fontSize: 14,
                  color: "#64748b",
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </Typography>
            </Box>

            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "16px",
                bgcolor: "#ecfdf5",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                "& svg": {
                  fontSize: 25,
                },
              }}
            >
              {icon}
            </Box>
          </Box>

          <Chip
            label={frequency}
            size="small"
            sx={{
              width: "fit-content",
              bgcolor: "#f1f5f9",
              color: "#334155",
              fontWeight: 800,
              borderRadius: "999px",
            }}
          />

          <Box
            sx={{
              borderTop: "1px solid #e5e7eb",
              pt: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 900,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                mb: 1.3,
              }}
            >
              Includes
            </Typography>

            <Stack spacing={1}>
              {sections.map((section) => (
                <Box
                  key={section}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: 14,
                    color: "#334155",
                    fontWeight: 650,
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: "#16a34a",
                    }}
                  />
                  {section}
                </Box>
              ))}
            </Stack>
          </Box>

          <Button
            fullWidth
            variant="contained"
            disabled={disabled}
            onClick={onClick}
            sx={{
              mt: 1,
              py: 1.35,
              borderRadius: "14px",
              bgcolor: "#16a34a",
              fontWeight: 900,
              textTransform: "none",
              boxShadow: "0 12px 24px rgba(22, 163, 74, 0.25)",
              "&:hover": {
                bgcolor: "#15803d",
                boxShadow: "0 16px 30px rgba(22, 163, 74, 0.32)",
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