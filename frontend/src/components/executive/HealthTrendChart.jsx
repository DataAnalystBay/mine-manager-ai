import {
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function HealthTrendChart({ data = [] }) {
  const chartData = data.map((item) => ({
    report_date: item.report_date,
    health: Number(item.health || 0),
    ore: Number(item.ore || 0),
    fleet: Number(item.fleet || 0),
    plant: Number(item.plant || 0),
    safety_score: Number(item.safety_score || 0),
  }));

  return (
    <Card sx={{ borderRadius: 4, height: "100%" }}>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Mine Health Trend
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Historical health score from PostgreSQL operational data
          </Typography>
        </Box>

        {chartData.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No health history available for this mine.
          </Typography>
        ) : (
          <Box sx={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="report_date" />

                <YAxis domain={[0, 120]} />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="health"
                  strokeWidth={3}
                  dot
                  name="Mine Health"
                />

                <Line
                  type="monotone"
                  dataKey="ore"
                  strokeWidth={2}
                  dot={false}
                  name="Ore"
                />

                <Line
                  type="monotone"
                  dataKey="fleet"
                  strokeWidth={2}
                  dot={false}
                  name="Fleet"
                />

                <Line
                  type="monotone"
                  dataKey="plant"
                  strokeWidth={2}
                  dot={false}
                  name="Plant"
                />

                <Line
                  type="monotone"
                  dataKey="safety_score"
                  strokeWidth={2}
                  dot={false}
                  name="Safety"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default HealthTrendChart;