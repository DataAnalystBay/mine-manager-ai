import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
} from "@mui/material";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import RemoveIcon from "@mui/icons-material/Remove";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import InsightsIcon from "@mui/icons-material/Insights";

function TrendAnalysisCard({ trendAnalysis }) {
  const direction = trendAnalysis?.direction || "No Data";
  const changePercent = trendAnalysis?.change_percent ?? 0;
  const summary =
    trendAnalysis?.summary || "No trend analysis available for this mine.";

  const drivers = trendAnalysis?.drivers || [];
  const recommendations = trendAnalysis?.recommendations || [];

  const getDirectionIcon = () => {
    if (direction === "Improving") return <TrendingUpIcon color="success" />;
    if (direction === "Declining") return <TrendingDownIcon color="error" />;
    if (direction === "Stable") return <RemoveIcon color="warning" />;
    return <InsightsIcon color="disabled" />;
  };

  const getDirectionColor = () => {
    if (direction === "Improving") return "success";
    if (direction === "Declining") return "error";
    if (direction === "Stable") return "warning";
    return "default";
  };

  return (
    <Card sx={{ borderRadius: 4, height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          {getDirectionIcon()}

          <Typography variant="h6" fontWeight={700}>
            Executive Trend Analysis
          </Typography>

          <Chip
            label={direction}
            color={getDirectionColor()}
            size="small"
            sx={{ ml: "auto" }}
          />
        </Box>

        <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
          {changePercent > 0 ? "+" : ""}
          {changePercent} pts
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {summary}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <InsightsIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={700}>
              Key Drivers
            </Typography>
          </Box>

          {drivers.length > 0 ? (
            drivers.map((driver, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.8, pl: 3 }}>
                {index + 1}. {driver}
              </Typography>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No key drivers available.
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <LightbulbIcon fontSize="small" color="warning" />
            <Typography variant="subtitle2" fontWeight={700}>
              Recommendations
            </Typography>
          </Box>

          {recommendations.length > 0 ? (
            recommendations.map((recommendation, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.8, pl: 3 }}>
                {index + 1}. {recommendation}
              </Typography>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No recommendations available.
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default TrendAnalysisCard;