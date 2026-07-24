import { Card, CardContent, Typography, Box, Chip, Avatar } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

function OperationsSnapshotCard({ analytics }) {
  const oreRisk = analytics.ore_variance < 0;
  const wasteRisk = analytics.waste_variance < 0;

  const alerts = [
    {
      title: oreRisk ? "Ore below plan" : "Ore on track",
      status: oreRisk ? "Risk" : "OK",
      icon: oreRisk ? <WarningAmberIcon /> : <CheckCircleIcon />,
    },
    {
      title: wasteRisk ? "Waste below plan" : "Waste on track",
      status: wasteRisk ? "Risk" : "OK",
      icon: wasteRisk ? <WarningAmberIcon /> : <CheckCircleIcon />,
    },
    {
      title: "Daily report uploaded",
      status: "OK",
      icon: <AssignmentTurnedInIcon />,
    },
  ];

  return (
    <Card sx={{ borderRadius: 4, height: "100%" }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Operations Snapshot
        </Typography>

        {alerts.map((item) => (
          <Box
            key={item.title}
            sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
          >
            <Avatar
              sx={{
                bgcolor: item.status === "OK" ? "#dcfce7" : "#fee2e2",
                color: item.status === "OK" ? "#16a34a" : "#dc2626",
              }}
            >
              {item.icon}
            </Avatar>

            <Typography sx={{ flex: 1 }}>{item.title}</Typography>

            <Chip
              label={item.status}
              color={item.status === "OK" ? "success" : "error"}
              size="small"
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

export default OperationsSnapshotCard;