import { Chip } from "@mui/material";

const PRIORITY_STYLES = {
  critical: {
    label: "Critical",
    backgroundColor: "#fef2f2",
    textColor: "#b91c1c",
    borderColor: "#fecaca",
  },

  high: {
    label: "High",
    backgroundColor: "#fff7ed",
    textColor: "#ea580c",
    borderColor: "#fed7aa",
  },

  medium: {
    label: "Medium",
    backgroundColor: "#fffbeb",
    textColor: "#d97706",
    borderColor: "#fde68a",
  },

  low: {
    label: "Low",
    backgroundColor: "#f0fdf4",
    textColor: "#16a34a",
    borderColor: "#bbf7d0",
  },
};

function normalizePriority(priority) {
  if (!priority) {
    return "medium";
  }

  return String(priority)
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function formatFallbackLabel(priority) {
  return String(priority || "Medium")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function PriorityChip({
  priority = "medium",
  size = "small",
  sx = {},
}) {
  const normalizedPriority =
    normalizePriority(priority);

  const style =
    PRIORITY_STYLES[normalizedPriority] || {
      label: formatFallbackLabel(
        normalizedPriority
      ),
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
        minWidth: 78,
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

export default PriorityChip;