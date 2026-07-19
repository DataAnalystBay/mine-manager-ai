import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
} from "@mui/material";

function PriorityActionsPanel({ selectedMine, ore, fleet, plant, safety }) {
  const actions = [];

  if (ore < 95) {
    actions.push({
      title: "Recover ore production variance",
      owner: "Production Superintendent",
      priority: "High",
    });
  }

  if (fleet < 90) {
    actions.push({
      title: "Review fleet availability losses",
      owner: "Maintenance / Mine Ops",
      priority: "High",
    });
  }

  if (plant < 100) {
    actions.push({
      title: "Investigate plant throughput gap",
      owner: "Plant Superintendent",
      priority: "Medium",
    });
  }

  if (safety > 0) {
    actions.push({
      title: "Review safety incidents and controls",
      owner: "HSE Lead",
      priority: "High",
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: "Maintain current operating discipline",
      owner: "General Manager / Superintendents",
      priority: "Low",
    });
  }

  return (
    <Card sx={{ borderRadius: 4, height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
          Executive Priority Actions
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Recommended actions for {selectedMine}
        </Typography>

        <List disablePadding>
          {actions.map((action, index) => (
            <ListItem
              key={index}
              disableGutters
              sx={{
                borderBottom:
                  index !== actions.length - 1 ? "1px solid #e5e7eb" : "none",
                py: 1.5,
              }}
            >
              <ListItemText
                primary={action.title}
                secondary={`Owner: ${action.owner}`}
              />

              <Box>
                <Chip
                  size="small"
                  label={action.priority}
                  color={
                    action.priority === "High"
                      ? "error"
                      : action.priority === "Medium"
                      ? "warning"
                      : "success"
                  }
                />
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default PriorityActionsPanel;