import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import TableViewIcon from "@mui/icons-material/TableView";

function ExportCard({ onClick, disabled = false }) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "22px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      }}
    >
      <CardContent sx={{ p: 3.2 }}>
        <Stack spacing={2.4}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 900 }}>
                Excel Export
              </Typography>

              <Typography sx={{ mt: 0.8, fontSize: 14, color: "#64748b" }}>
                Export operational datasets for analysis, sharing, and Power BI.
              </Typography>
            </Box>

            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "16px",
                bgcolor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TableViewIcon />
            </Box>
          </Box>

          <Chip
            label="On demand"
            size="small"
            sx={{
              width: "fit-content",
              bgcolor: "#f1f5f9",
              fontWeight: 800,
            }}
          />

          <Box sx={{ borderTop: "1px solid #e5e7eb", pt: 2 }}>
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
              {["Production", "Fleet", "Plant", "Safety", "Maintenance"].map(
                (item) => (
                  <Box
                    key={item}
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
                        bgcolor: "#2563eb",
                      }}
                    />
                    {item}
                  </Box>
                )
              )}
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
              bgcolor: "#2563eb",
              fontWeight: 900,
              textTransform: "none",
              "&:hover": {
                bgcolor: "#1d4ed8",
              },
            }}
          >
            Export Excel
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ExportCard;