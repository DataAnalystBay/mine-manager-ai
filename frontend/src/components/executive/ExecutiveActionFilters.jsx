import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

function ExecutiveActionFilters({
  filters,
  onFilterChange,
  onClear,
  owners = [],
  primaryColor = "#16a34a",
}) {
  const handleChange = (field) => (event) => {
    onFilterChange({
      ...filters,
      [field]: event.target.value,
    });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.priority) ||
    Boolean(filters.owner);

  return (
    <Box
      sx={{
        mt: 2.5,
        mb: 2.5,
        p: {
          xs: 2,
          sm: 2.5,
        },
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        boxShadow:
          "0 8px 24px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Box
        sx={{
          mb: 2.25,
          display: "flex",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          justifyContent: "space-between",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Filter Executive Actions
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Narrow the table by keyword, status,
            priority, or owner.
          </Typography>
        </Box>

        <Button
          variant="text"
          startIcon={<FilterAltOffIcon />}
          onClick={onClear}
          disabled={!hasActiveFilters}
          sx={{
            minHeight: 40,
            px: 1.75,
            borderRadius: "10px",
            color: hasActiveFilters
              ? primaryColor
              : "#94a3b8",
            fontWeight: 800,
            textTransform: "none",

            "&:hover": {
              bgcolor: `${primaryColor}0A`,
            },

            "&.Mui-disabled": {
              color: "#cbd5e1",
            },
          }}
        >
          Clear Filters
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "2fr repeat(3, minmax(150px, 1fr))",
          },
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          fullWidth
          size="small"
          label="Search"
          placeholder="Search actions"
          value={filters.search}
          onChange={handleChange("search")}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      fontSize: 20,
                      color: "#94a3b8",
                    }}
                  />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              minHeight: 44,
              borderRadius: "12px",
              bgcolor: "#ffffff",

              "& fieldset": {
                borderColor: "#cbd5e1",
              },

              "&:hover fieldset": {
                borderColor: "#94a3b8",
              },

              "&.Mui-focused fieldset": {
                borderColor: primaryColor,
              },
            },

            "& .MuiInputLabel-root.Mui-focused": {
              color: primaryColor,
            },
          }}
        />

        <FormControl
          fullWidth
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              minHeight: 44,
              borderRadius: "12px",

              "& fieldset": {
                borderColor: "#cbd5e1",
              },

              "&:hover fieldset": {
                borderColor: "#94a3b8",
              },

              "&.Mui-focused fieldset": {
                borderColor: primaryColor,
              },
            },

            "& .MuiInputLabel-root.Mui-focused": {
              color: primaryColor,
            },
          }}
        >
          <InputLabel id="executive-action-status-filter-label">
            Status
          </InputLabel>

          <Select
            labelId="executive-action-status-filter-label"
            value={filters.status}
            label="Status"
            onChange={handleChange("status")}
          >
            <MenuItem value="">
              All Statuses
            </MenuItem>

            <MenuItem value="Open">
              Open
            </MenuItem>

            <MenuItem value="To Do">
              To Do
            </MenuItem>

            <MenuItem value="In Progress">
              In Progress
            </MenuItem>

            <MenuItem value="Blocked">
              Blocked
            </MenuItem>

            <MenuItem value="Completed">
              Completed
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl
          fullWidth
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              minHeight: 44,
              borderRadius: "12px",

              "& fieldset": {
                borderColor: "#cbd5e1",
              },

              "&:hover fieldset": {
                borderColor: "#94a3b8",
              },

              "&.Mui-focused fieldset": {
                borderColor: primaryColor,
              },
            },

            "& .MuiInputLabel-root.Mui-focused": {
              color: primaryColor,
            },
          }}
        >
          <InputLabel id="executive-action-priority-filter-label">
            Priority
          </InputLabel>

          <Select
            labelId="executive-action-priority-filter-label"
            value={filters.priority}
            label="Priority"
            onChange={handleChange("priority")}
          >
            <MenuItem value="">
              All Priorities
            </MenuItem>

            <MenuItem value="Critical">
              Critical
            </MenuItem>

            <MenuItem value="High">
              High
            </MenuItem>

            <MenuItem value="Medium">
              Medium
            </MenuItem>

            <MenuItem value="Low">
              Low
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl
          fullWidth
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              minHeight: 44,
              borderRadius: "12px",

              "& fieldset": {
                borderColor: "#cbd5e1",
              },

              "&:hover fieldset": {
                borderColor: "#94a3b8",
              },

              "&.Mui-focused fieldset": {
                borderColor: primaryColor,
              },
            },

            "& .MuiInputLabel-root.Mui-focused": {
              color: primaryColor,
            },
          }}
        >
          <InputLabel id="executive-action-owner-filter-label">
            Owner
          </InputLabel>

          <Select
            labelId="executive-action-owner-filter-label"
            value={filters.owner}
            label="Owner"
            onChange={handleChange("owner")}
          >
            <MenuItem value="">
              All Owners
            </MenuItem>

            {owners.map((owner) => (
              <MenuItem
                key={owner}
                value={owner}
              >
                {owner}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

export default ExecutiveActionFilters;