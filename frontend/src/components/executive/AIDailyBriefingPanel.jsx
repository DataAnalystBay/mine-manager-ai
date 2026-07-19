import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

function AIDailyBriefingPanel({ briefing }) {
  const briefingText =
    briefing?.briefing || "Waiting for AI Daily Briefing...";

  const actions = briefing?.priority_actions || [];

  const risks = briefing?.risks || [];

  return (
    <Card
      sx={{
        borderRadius: 4,
        height: "100%",
        boxShadow: 3,
      }}
    >
      <CardContent>

        {/* Header */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
          }}
        >
          <AutoAwesomeIcon color="primary" />

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ ml: 1 }}
          >
            AI Daily Briefing
          </Typography>

          <Chip
            label="Live"
            color="success"
            size="small"
            sx={{ ml: "auto" }}
          />
        </Box>

        {/* AI Briefing */}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          {briefingText}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Priority Actions */}

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            gutterBottom
          >
            Priority Actions
          </Typography>

          {actions.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              No priority actions.
            </Typography>
          ) : (
            actions.map((action, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <CheckCircleIcon
                  color="success"
                  sx={{
                    mr: 1,
                    mt: "2px",
                  }}
                />

                <Typography variant="body2">
                  {action}
                </Typography>
              </Box>
            ))
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Risks */}

        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            gutterBottom
          >
            Operational Risks
          </Typography>

          {risks.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              No operational risks.
            </Typography>
          ) : (
            risks.map((risk, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <WarningAmberIcon
                  color="warning"
                  sx={{
                    mr: 1,
                    mt: "2px",
                  }}
                />

                <Typography variant="body2">
                  {risk}
                </Typography>
              </Box>
            ))
          )}
        </Box>

      </CardContent>
    </Card>
  );
}

export default AIDailyBriefingPanel;