import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from "@mui/material";

import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

function MineHealthHero({ healthScore = 87, mineName = "Oyu Tolgoi Surface" }) {
  return (
    <Card
      sx={{
        borderRadius: 5,
        mb: 4,
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        color: "white",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              Overall Operational Health
            </Typography>

            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {mineName}
            </Typography>

            <Typography variant="h2" fontWeight={900}>
              {healthScore}/100
            </Typography>

            <Chip
              icon={<TrendingUpIcon />}
              label="+3 vs last week"
              color="success"
              sx={{ mt: 1 }}
            />
          </Box>

          <Box sx={{ textAlign: "right" }}>
            <HealthAndSafetyIcon sx={{ fontSize: 56, opacity: 0.85 }} />

            <Typography variant="h5" fontWeight={700}>
              {healthScore >= 85
                ? "Stable"
                : healthScore >= 75
                ? "Watch"
                : "Critical"}
            </Typography>

            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              {healthScore >= 85
                ? "Minor operational risks detected"
                : healthScore >= 75
                ? "Performance requires management attention"
                : "High-risk operational condition"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
            Mine Health Score
          </Typography>

          <LinearProgress
            variant="determinate"
            value={healthScore}
            sx={{
              height: 12,
              borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export default MineHealthHero;