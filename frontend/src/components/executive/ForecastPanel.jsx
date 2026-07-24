import { Card, CardContent, Typography, Grid, Box, Chip } from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";

const forecasts = [
  { title: "Tomorrow Ore Forecast", value: "97%", risk: "Low" },
  { title: "Fleet Availability Forecast", value: "90%", risk: "Medium" },
  { title: "Plant Throughput Forecast", value: "103%", risk: "Low" },
  { title: "Forecast Mine Health", value: "88/100", risk: "Low" },
];

function ForecastPanel() {
  return (
    <Card sx={{ borderRadius: 4, mb: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <InsightsIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Tomorrow Forecast
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {forecasts.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.title}>
              <Box sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
                <Typography variant="body2" color="text.secondary">
                  {item.title}
                </Typography>

                <Typography variant="h5" fontWeight={800}>
                  {item.value}
                </Typography>

                <Chip
                  size="small"
                  label={`${item.risk} Risk`}
                  color={item.risk === "Low" ? "success" : "warning"}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default ForecastPanel;