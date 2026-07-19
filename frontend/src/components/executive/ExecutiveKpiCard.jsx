import { Card, CardContent, Typography, Box, Chip, Avatar } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

function ExecutiveKpiCard({ title, value, target, unit, icon, status, trend }) {
  const isGood = status === "good";

  return (
    <Card sx={{ borderRadius: 4, height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Avatar sx={{ bgcolor: isGood ? "#dcfce7" : "#fee2e2", color: isGood ? "#16a34a" : "#dc2626" }}>
            {icon}
          </Avatar>

          <Chip
            size="small"
            icon={isGood ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={trend}
            color={isGood ? "success" : "error"}
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>

        <Typography variant="h4" fontWeight={800}>
          {value}{unit}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Target: {target}{unit}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default ExecutiveKpiCard;