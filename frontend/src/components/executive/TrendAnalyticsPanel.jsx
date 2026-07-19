import { Card, CardContent, Typography, Box } from "@mui/material";

const trendData = [82, 85, 84, 88, 87, 90, 92];

function TrendAnalyticsPanel() {
  return (
    <Card sx={{ borderRadius: 4, mb: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
          7-Day Mine Health Trend
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Mine performance is improving over the last 7 days.
        </Typography>

        <Box sx={{ display: "flex", alignItems: "end", gap: 1, height: 160 }}>
          {trendData.map((value, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                height: `${value}%`,
                borderRadius: 2,
                background: "linear-gradient(180deg, #2563eb, #93c5fd)",
                display: "flex",
                alignItems: "end",
                justifyContent: "center",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                pb: 1,
              }}
            >
              {value}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          {["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "Today"].map((day) => (
            <Typography key={day} variant="caption" color="text.secondary">
              {day}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default TrendAnalyticsPanel;