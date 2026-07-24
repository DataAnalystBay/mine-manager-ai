import { Box, Typography } from "@mui/material";

function ReportHeader() {
  return (
    <Box sx={{ mb: 5 }}>
      <Typography
        variant="h4"
        fontWeight={800}
        gutterBottom
      >
        Executive Reports
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ maxWidth: 700 }}
      >
        Generate professional management reports for daily,
        weekly and monthly operational meetings.
      </Typography>
    </Box>
  );
}

export default ReportHeader;