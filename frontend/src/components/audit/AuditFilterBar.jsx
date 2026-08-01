import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ClearAllIcon from "@mui/icons-material/ClearAll";

import "./AuditFilterBar.css";


const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "CREATE_USER", label: "Create User" },
  { value: "UPDATE_USER", label: "Update User" },
  { value: "ACTIVATE_USER", label: "Activate User" },
  { value: "DEACTIVATE_USER", label: "Deactivate User" },
  { value: "RESET_PASSWORD", label: "Reset Password" },
];


const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "All Entities" },
  { value: "User", label: "User" },
];


const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
];


function AuditFilterBar({
  filters,
  onFilterChange,
  onClearFilters,
  disabled = false,
}) {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.action ||
      filters.actorEmail ||
      filters.entityType ||
      filters.status ||
      filters.startDate ||
      filters.endDate
  );


  const handleChange = (field) => (event) => {
    onFilterChange(
      field,
      event.target.value
    );
  };


  return (
    <Box className="audit-filter-bar">
      <Box className="audit-filter-grid">
        <TextField
          fullWidth
          size="small"
          label="Search audit records"
          placeholder="Search user, email, action, entity..."
          value={filters.search}
          onChange={handleChange("search")}
          disabled={disabled}
          className="audit-filter-search"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <FormControl
          size="small"
          className="audit-filter-field"
        >
          <InputLabel id="audit-action-filter-label">
            Action
          </InputLabel>

          <Select
            labelId="audit-action-filter-label"
            label="Action"
            value={filters.action}
            onChange={handleChange("action")}
            disabled={disabled}
          >
            {ACTION_OPTIONS.map((option) => (
              <MenuItem
                key={option.value || "all-actions"}
                value={option.value}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          className="audit-filter-field"
        >
          <InputLabel id="audit-entity-filter-label">
            Entity
          </InputLabel>

          <Select
            labelId="audit-entity-filter-label"
            label="Entity"
            value={filters.entityType}
            onChange={handleChange("entityType")}
            disabled={disabled}
          >
            {ENTITY_TYPE_OPTIONS.map((option) => (
              <MenuItem
                key={option.value || "all-entities"}
                value={option.value}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          className="audit-filter-field"
        >
          <InputLabel id="audit-status-filter-label">
            Status
          </InputLabel>

          <Select
            labelId="audit-status-filter-label"
            label="Status"
            value={filters.status}
            onChange={handleChange("status")}
            disabled={disabled}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem
                key={option.value || "all-statuses"}
                value={option.value}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          label="Actor email"
          placeholder="admin@company.com"
          value={filters.actorEmail}
          onChange={handleChange("actorEmail")}
          disabled={disabled}
          className="audit-filter-email"
        />

        <TextField
          fullWidth
          size="small"
          type="date"
          label="Start date"
          value={filters.startDate}
          onChange={handleChange("startDate")}
          disabled={disabled}
          className="audit-filter-date"
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />

        <TextField
          fullWidth
          size="small"
          type="date"
          label="End date"
          value={filters.endDate}
          onChange={handleChange("endDate")}
          disabled={disabled}
          className="audit-filter-date"
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />

        <Button
          variant="outlined"
          startIcon={<ClearAllIcon />}
          onClick={onClearFilters}
          disabled={
            disabled || !hasActiveFilters
          }
          className="audit-filter-clear-button"
        >
          Clear Filters
        </Button>
      </Box>
    </Box>
  );
}


export default AuditFilterBar;