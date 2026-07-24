import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AutorenewIcon from "@mui/icons-material/Autorenew";

function ExecutiveHeader({ mineHealthScore, status, lastUpdated }) {
  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Executive Dashboard
          </Typography>
          <Typography color="text.secondary">
            Live mine performance overview from PostgreSQL
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 3,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Chip label="Mine: Demo Mine 01" variant="outlined" />
          <Chip label="Shift: Day Shift" variant="outlined" />

          <Box>
            <Typography variant="caption" color="text.secondary">
              Mine Health
            </Typography>
            <Typography color="#16a34a" fontWeight="bold">
              {mineHealthScore}%
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <br />
            <Chip
              label={status}
              color={status === "Stable" ? "success" : "warning"}
              size="small"
            />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Last Refresh
            </Typography>
            <Typography fontWeight="bold">
              {lastUpdated || "Loading..."}
            </Typography>
          </Box>

          <AutorenewIcon color="success" />
          <CalendarMonthIcon />
        </Box>
      </CardContent>
    </Card>
  );
}

export default ExecutiveHeader;