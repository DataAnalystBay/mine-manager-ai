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
import { useLanguage } from "../../context/LanguageContext";

import "./AuditFilterBar.css";


const ACTION_OPTIONS = [
  { value: "", labelKey: "allActions" },
  { value: "CREATE_USER", labelKey: "createUser" },
  { value: "UPDATE_USER", labelKey: "updateUser" },
  { value: "ACTIVATE_USER", labelKey: "activateUser" },
  { value: "DEACTIVATE_USER", labelKey: "deactivateUser" },
  { value: "RESET_PASSWORD", labelKey: "resetPassword" },
];


const ENTITY_TYPE_OPTIONS = [
  { value: "", labelKey: "allEntities" },
  { value: "User", labelKey: "user" },
];


const STATUS_OPTIONS = [
  { value: "", labelKey: "allStatuses" },
  { value: "SUCCESS", labelKey: "success" },
  { value: "FAILED", labelKey: "failed" },
];


function AuditFilterBar({
  filters,
  onFilterChange,
  onClearFilters,
  disabled = false,
}) {
  const { t } = useLanguage();
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
          label={t("auditTrail.searchLabel")}
          placeholder={t("auditTrail.searchPlaceholder")}
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
            {t("auditTrail.action")}
          </InputLabel>

          <Select
            labelId="audit-action-filter-label"
            label={t("auditTrail.action")}
            value={filters.action}
            onChange={handleChange("action")}
            disabled={disabled}
          >
            {ACTION_OPTIONS.map((option) => (
              <MenuItem
                key={option.value || "all-actions"}
                value={option.value}
              >
                {t(`auditTrail.${option.labelKey}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          className="audit-filter-field"
        >
          <InputLabel id="audit-entity-filter-label">
            {t("auditTrail.entity")}
          </InputLabel>

          <Select
            labelId="audit-entity-filter-label"
            label={t("auditTrail.entity")}
            value={filters.entityType}
            onChange={handleChange("entityType")}
            disabled={disabled}
          >
            {ENTITY_TYPE_OPTIONS.map((option) => (
              <MenuItem
                key={option.value || "all-entities"}
                value={option.value}
              >
                {t(`auditTrail.${option.labelKey}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          className="audit-filter-field"
        >
          <InputLabel id="audit-status-filter-label">
            {t("auditTrail.status")}
          </InputLabel>

          <Select
            labelId="audit-status-filter-label"
            label={t("auditTrail.status")}
            value={filters.status}
            onChange={handleChange("status")}
            disabled={disabled}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem
                key={option.value || "all-statuses"}
                value={option.value}
              >
                {t(`auditTrail.${option.labelKey}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          label={t("auditTrail.actorEmail")}
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
          label={t("auditTrail.startDate")}
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
          label={t("auditTrail.endDate")}
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
          {t("auditTrail.clearFilters")}
        </Button>
      </Box>
    </Box>
  );
}


export default AuditFilterBar;
