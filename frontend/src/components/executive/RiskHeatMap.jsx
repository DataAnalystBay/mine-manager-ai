import { Card, CardContent, Typography, Box, Chip, Grid } from "@mui/material";

const risks = [
  { area: "Production", level: "High", detail: "Ore below plan" },
  { area: "Fleet", level: "Low", detail: "Availability stable" },
  { area: "Plant", level: "Low", detail: "Throughput above target" },
  { area: "Safety", level: "Low", detail: "Zero incidents" },
  { area: "Maintenance", level: "Medium", detail: "Shovel delays" },
  { area: "Weather", level: "Medium", detail: "Possible haul road impact" },
];

function getRiskColor(level) {
  if (level === "High") return "error";
  if (level === "Medium") return "warning";
  return "success";
}

function RiskHeatMap() {
  return (
    <Card sx={{ borderRadius: 4, mb: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
          Operational Risk Heat Map
        </Typography>

        <Grid container spacing={2}>
          {risks.map((risk, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #e5e7eb",
                  height: "100%",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography fontWeight={700}>{risk.area}</Typography>
                  <Chip size="small" label={risk.level} color={getRiskColor(risk.level)} />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {risk.detail}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default RiskHeatMap;