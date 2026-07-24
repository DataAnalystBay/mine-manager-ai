import { Card, CardContent, Typography, Grid, Button, Box } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssessmentIcon from "@mui/icons-material/Assessment";

const reports = [
  {
    title: "Daily Executive Report",
    icon: <PictureAsPdfIcon />,
  },
  {
    title: "Weekly Operations Report",
    icon: <AssessmentIcon />,
  },
  {
    title: "Monthly Summary",
    icon: <CalendarMonthIcon />,
  },
  {
    title: "PowerPoint Summary",
    icon: <SlideshowIcon />,
  },
];

function ReportExportPanel() {
  return (
    <Card sx={{ borderRadius: 4, mb: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
          Executive Report Export
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Generate management-ready reporting packs from AI insights and operational KPIs.
        </Typography>

        <Grid container spacing={2}>
          {reports.map((report) => (
            <Grid item xs={12} sm={6} md={3} key={report.title}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #e5e7eb",
                  height: "100%",
                }}
              >
                <Box sx={{ mb: 1 }}>{report.icon}</Box>

                <Typography fontWeight={700} sx={{ mb: 2 }}>
                  {report.title}
                </Typography>

                <Button variant="outlined" fullWidth>
                  Export
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default ReportExportPanel;