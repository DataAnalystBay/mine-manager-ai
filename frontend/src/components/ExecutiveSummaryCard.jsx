import { Card, CardContent, Typography, Box, Divider, Chip } from "@mui/material";

function ExecutiveSummaryCard({ analytics }) {
  const oreAbovePlan = analytics.ore_variance >= 0;
  const wasteAbovePlan = analytics.waste_variance >= 0;

  return (
    <Card sx={{ borderRadius: 4, height: "100%" }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          AI Executive Summary
        </Typography>

        <SummarySection
          title="Operational Highlights"
          items={[
            `Ore production achieved ${analytics.production_score}% of plan.`,
            `Waste movement achieved ${analytics.waste_score}% of plan.`,
          ]}
        />

        <Divider sx={{ my: 2 }} />

        <SummarySection
          title="Operational Risks"
          items={[
            oreAbovePlan
              ? "No major ore production risk detected."
              : "Ore production is below plan.",
            wasteAbovePlan
              ? "No major waste movement risk detected."
              : "Waste movement is below target.",
          ]}
        />

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography fontWeight="bold" mb={1}>
            AI Recommendation
          </Typography>
          <Chip
            label={analytics.recommendation}
            color={analytics.status === "Stable" ? "success" : "warning"}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

function SummarySection({ title, items }) {
  return (
    <Box>
      <Typography fontWeight="bold" mb={1}>
        {title}
      </Typography>

      {items.map((item) => (
        <Typography key={item} variant="body2" color="text.secondary" mb={0.5}>
          ✓ {item}
        </Typography>
      ))}
    </Box>
  );
}

export default ExecutiveSummaryCard;