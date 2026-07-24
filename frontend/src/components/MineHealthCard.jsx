import { Card, CardContent, Typography, Box, LinearProgress, Chip } from "@mui/material";

function MineHealthCard({ score, oreScore, wasteScore }) {
  const status = score >= 95 ? "Stable" : score >= 90 ? "Watch" : "Attention";

  return (
    <Card sx={{ borderRadius: 4, height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Mine Health
          </Typography>
          <Chip label={status} color={status === "Stable" ? "success" : "warning"} />
        </Box>

        <Typography variant="h2" fontWeight="bold" color="#16a34a">
          {score}%
        </Typography>

        <Typography color="text.secondary" mb={3}>
          Overall operational condition
        </Typography>

        <HealthRow title="Production" value={oreScore} />
        <HealthRow title="Waste" value={wasteScore} />
        <HealthRow title="Fleet" value={92} placeholder />
        <HealthRow title="Plant" value={95} placeholder />
        <HealthRow title="Safety" value={100} placeholder />
      </CardContent>
    </Card>
  );
}

function HealthRow({ title, value, placeholder }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="body2">
          {title} {placeholder ? "(demo)" : ""}
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          {value}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Number(value)}
        sx={{ height: 8, borderRadius: 8, mt: 0.5 }}
        color={Number(value) >= 95 ? "success" : "warning"}
      />
    </Box>
  );
}

export default MineHealthCard;