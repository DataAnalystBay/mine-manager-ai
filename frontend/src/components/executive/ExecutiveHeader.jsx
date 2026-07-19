import { Box, Typography, Chip, Stack } from "@mui/material";

function ExecutiveHeader({ selectedMine = "Oyu Tolgoi Surface" }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" fontWeight={800}>
        Executive Command Center
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
        Mine performance, risks, AI insights, and priority actions
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
        <Chip label={`Mine: ${selectedMine}`} />
        <Chip label={`Date: ${today}`} />
        <Chip label="Shift: Day Shift" color="primary" />
        <Chip label="Status: Live Demo" color="success" />
      </Stack>
    </Box>
  );
}

export default ExecutiveHeader;