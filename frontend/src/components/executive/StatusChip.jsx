import { Chip } from "@mui/material";

const STATUS_STYLES = {
  open: {
    label: "Open",
    backgroundColor: "#fff7ed",
    textColor: "#ea580c",
    borderColor: "#fed7aa",
  },

  in_progress: {
    label: "In Progress",
    backgroundColor: "#eff6ff",
    textColor: "#2563eb",
    borderColor: "#bfdbfe",
  },

  completed: {
    label: "Completed",
    backgroundColor: "#f0fdf4",
    textColor: "#16a34a",
    borderColor: "#bbf7d0",
  },

  blocked: {
    label: "Blocked",
    backgroundColor: "#fef2f2",
    textColor: "#dc2626",
    borderColor: "#fecaca",
  },

  cancelled: {
    label: "Cancelled",
    backgroundColor: "#f8fafc",
    textColor: "#64748b",
    borderColor: "#cbd5e1",
  },
};

function normalizeStatus(status) {
  if (!status) {
    return "open";
  }

  return String(status)
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function formatFallbackLabel(status) {
  return String(status || "Open")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function StatusChip({
  status = "open",
  size = "small",
  sx = {},
}) {
  const normalizedStatus = normalizeStatus(status);

  const style =
    STATUS_STYLES[normalizedStatus] || {
      label: formatFallbackLabel(normalizedStatus),
      backgroundColor: "#f8fafc",
      textColor: "#475569",
      borderColor: "#cbd5e1",
    };

  return (
    <Chip
      label={style.label}
      size={size}
      variant="outlined"
      sx={{
        minWidth: 92,
        height: 28,
        borderRadius: "999px",
        borderColor: style.borderColor,
        backgroundColor: style.backgroundColor,
        color: style.textColor,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.1px",

        "& .MuiChip-label": {
          px: 1.5,
        },

        ...sx,
      }}
    />
  );
}

export default StatusChip;