import { Card, CardContent, Typography, Box, Avatar, Chip } from "@mui/material";

function ExecutiveKpiCard({ title, value, suffix, icon, trend, variance }) {
  const numericValue = Number(value || 0);
  const isNegative = numericValue < 0;

  const statusLabel = variance
    ? isNegative
      ? "Below Plan"
      : "Above Plan"
    : "Live";

  const statusColor = variance
    ? isNegative
      ? "error"
      : "success"
    : "default";

  return (
    <Card
      sx={{
        borderRadius: 4,
        height: "100%",
        transition: "0.2s",
        border: "1px solid #e5e7eb",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Avatar
            sx={{
              bgcolor: variance
                ? isNegative
                  ? "#fee2e2"
                  : "#dcfce7"
                : "#e0f2fe",
              color: variance
                ? isNegative
                  ? "#dc2626"
                  : "#16a34a"
                : "#0284c7",
            }}
          >
            {icon}
          </Avatar>

          <Chip size="small" label={statusLabel} color={statusColor} />
        </Box>

        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>

        <Typography
          variant="h4"
          fontWeight="bold"
          color={
            variance
              ? isNegative
                ? "error"
                : "success.main"
              : "text.primary"
          }
        >
          {numericValue.toLocaleString()} {suffix}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {trend || "Live from PostgreSQL"}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default ExecutiveKpiCard;