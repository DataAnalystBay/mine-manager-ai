import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

function ProductionTrendChart({ data }) {
  const [mode, setMode] = useState("ore");

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  const planKey = mode === "ore" ? "ore_plan" : "waste_plan";
  const actualKey = mode === "ore" ? "ore_actual" : "waste_actual";
  const title = mode === "ore" ? "Ore Production" : "Waste Movement";

  const formatTonnes = (value) => {
    if (!value) return "0";
    return `${Math.round(value / 1000)}k`;
  };

  const formatDate = (date) => {
    if (!date) return "";
    return String(date).slice(5);
  };

  return (
    <Card sx={{ borderRadius: 4, height: "100%" }}>
      <CardContent>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Production Performance Trend
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}: plan vs actual, last 30 days
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            size="small"
          >
            <ToggleButton value="ore">Ore</ToggleButton>
            <ToggleButton value="waste">Waste</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ width: "100%", height: 380 }}>
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{ top: 20, right: 24, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="report_date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                minTickGap={24}
              />

              <YAxis tickFormatter={formatTonnes} tick={{ fontSize: 12 }} />

              <Tooltip
                formatter={(value) => [
                  `${Number(value || 0).toLocaleString()} t`,
                  "",
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey={planKey}
                name="Plan"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />

              <Line
                type="monotone"
                dataKey={actualKey}
                name="Actual"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ProductionTrendChart;