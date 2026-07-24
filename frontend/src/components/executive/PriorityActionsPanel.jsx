import { memo, useMemo } from "react";

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

const PRIORITY_CONFIG = Object.freeze({
  High: {
    color: "error",
    rank: 3,
  },
  Medium: {
    color: "warning",
    rank: 2,
  },
  Low: {
    color: "success",
    rank: 1,
  },
});

function toSafeNumber(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function PriorityActionsPanel({
  selectedMine = "Selected Mine",
  ore = 0,
  fleet = 0,
  plant = 0,
  safety = 0,
}) {
  const safeOre = toSafeNumber(ore);
  const safeFleet = toSafeNumber(fleet);
  const safePlant = toSafeNumber(plant);
  const safeSafety = toSafeNumber(safety);

  const actions = useMemo(() => {
    const nextActions = [];

    if (safeOre < 95) {
      nextActions.push({
        id: "ore-production-variance",
        title: "Recover ore production variance",
        owner: "Production Superintendent",
        priority: "High",
      });
    }

    if (safeFleet < 90) {
      nextActions.push({
        id: "fleet-availability-losses",
        title: "Review fleet availability losses",
        owner: "Maintenance / Mine Ops",
        priority: "High",
      });
    }

    if (safePlant < 100) {
      nextActions.push({
        id: "plant-throughput-gap",
        title: "Investigate plant throughput gap",
        owner: "Plant Superintendent",
        priority: "Medium",
      });
    }

    if (safeSafety > 0) {
      nextActions.push({
        id: "safety-controls-review",
        title: "Review safety incidents and controls",
        owner: "HSE Lead",
        priority: "High",
      });
    }

    if (nextActions.length === 0) {
      nextActions.push({
        id: "maintain-operating-discipline",
        title: "Maintain current operating discipline",
        owner: "General Manager / Superintendents",
        priority: "Low",
      });
    }

    return nextActions.sort(
      (firstAction, secondAction) =>
        PRIORITY_CONFIG[secondAction.priority].rank -
        PRIORITY_CONFIG[firstAction.priority].rank
    );
  }, [safeOre, safeFleet, safePlant, safeSafety]);

  const highPriorityCount = useMemo(
    () =>
      actions.filter((action) => action.priority === "High").length,
    [actions]
  );

  return (
    <Card
      sx={{
        height: "100%",
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: 3,

          "&:last-child": {
            pb: 3,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            mb: 0.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                color: "#0f172a",
                fontWeight: 800,
              }}
            >
              Executive Priority Actions
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: "#64748b",
              }}
            >
              Recommended actions for {selectedMine}
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${actions.length} action${
              actions.length === 1 ? "" : "s"
            }`}
            color={highPriorityCount > 0 ? "error" : "success"}
            variant={highPriorityCount > 0 ? "filled" : "outlined"}
            sx={{
              flexShrink: 0,
              fontWeight: 800,
            }}
          />
        </Box>

        <List
          disablePadding
          aria-label={`Executive priority actions for ${selectedMine}`}
          sx={{
            mt: 1.5,
          }}
        >
          {actions.map((action, index) => {
            const priorityConfig =
              PRIORITY_CONFIG[action.priority] || PRIORITY_CONFIG.Low;

            return (
              <ListItem
                key={action.id}
                disableGutters
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  py: 1.5,
                  borderBottom:
                    index !== actions.length - 1
                      ? "1px solid #e5e7eb"
                      : "none",
                }}
              >
                <ListItemText
                  primary={action.title}
                  secondary={`Owner: ${action.owner}`}
                  primaryTypographyProps={{
                    sx: {
                      color: "#0f172a",
                      fontSize: 14,
                      fontWeight: 700,
                      lineHeight: 1.4,
                    },
                  }}
                  secondaryTypographyProps={{
                    sx: {
                      mt: 0.4,
                      color: "#64748b",
                      fontSize: 12,
                      lineHeight: 1.4,
                    },
                  }}
                />

                <Box sx={{ flexShrink: 0 }}>
                  <Chip
                    size="small"
                    label={action.priority}
                    color={priorityConfig.color}
                    sx={{
                      minWidth: 72,
                      fontWeight: 800,
                    }}
                  />
                </Box>
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}

function arePriorityActionsPanelPropsEqual(
  previousProps,
  nextProps
) {
  return (
    previousProps.selectedMine === nextProps.selectedMine &&
    previousProps.ore === nextProps.ore &&
    previousProps.fleet === nextProps.fleet &&
    previousProps.plant === nextProps.plant &&
    previousProps.safety === nextProps.safety
  );
}

export default memo(
  PriorityActionsPanel,
  arePriorityActionsPanelPropsEqual
);