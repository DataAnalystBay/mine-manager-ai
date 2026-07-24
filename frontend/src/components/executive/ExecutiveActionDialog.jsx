import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddTaskIcon from "@mui/icons-material/AddTask";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

import ExecutiveActionKpiContext from "./ExecutiveActionKpiContext";

function normalizeDateValue(value) {
  if (!value) {
    return "";
  }

  const dateValue = String(value);

  if (dateValue.includes("T")) {
    return dateValue.split("T")[0];
  }

  return dateValue.slice(0, 10);
}

function getInitialForm(action) {
  return {
    action_title:
      action?.action_title ||
      action?.title ||
      action?.recommended_action ||
      action?.action ||
      "",

    description:
      action?.description ||
      action?.action_description ||
      action?.recommendation ||
      "",

    owner_name:
      action?.owner_name ||
      action?.owner ||
      action?.assigned_to ||
      "",

    priority:
      action?.priority || "Medium",

    status:
      action?.status || "Open",

    due_date: normalizeDateValue(
      action?.due_date ||
        action?.target_date ||
        ""
    ),

    category:
      action?.category ||
      action?.action_category ||
      "Operations",

    source:
      action?.source ||
      action?.action_source ||
      "Manual",
  };
}

function ExecutiveActionDialog({
  open,
  action,
  onClose,
  onSave,
  saving = false,
  primaryColor = "#16a34a",
}) {
  const isEditMode = Boolean(
    action?.id ?? action?.action_id
  );

  const actionId =
    action?.id ?? action?.action_id ?? null;

  const [form, setForm] = useState(
    getInitialForm(action)
  );

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(getInitialForm(action));
    setErrors({});
  }, [open, action]);

  const hasChanges = useMemo(() => {
    const original = getInitialForm(action);

    return (
      form.action_title.trim() !==
        String(original.action_title || "").trim() ||
      form.description.trim() !==
        String(original.description || "").trim() ||
      form.owner_name.trim() !==
        String(original.owner_name || "").trim() ||
      form.priority !== original.priority ||
      form.status !== original.status ||
      normalizeDateValue(form.due_date) !==
        normalizeDateValue(original.due_date) ||
      form.category !== original.category ||
      form.source !== original.source
    );
  }, [form, action]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.action_title.trim()) {
      nextErrors.action_title =
        "Action title is required.";
    }

    if (!form.owner_name.trim()) {
      nextErrors.owner_name =
        "Action owner is required.";
    }

    if (!form.priority) {
      nextErrors.priority =
        "Priority is required.";
    }

    if (!form.status) {
      nextErrors.status =
        "Status is required.";
    }

    if (!form.due_date) {
      nextErrors.due_date =
        "Due date is required.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (saving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const payload = {
      action_title: form.action_title.trim(),
      description: form.description.trim(),
      owner_name: form.owner_name.trim(),
      priority: form.priority,
      status: form.status,
      due_date: form.due_date,
      category: form.category,
      source: isEditMode
        ? form.source || "Manual"
        : "Manual",
    };

    await onSave(payload);
  };

  const handleDialogClose = (
    event,
    reason
  ) => {
    if (saving) {
      return;
    }

    if (
      reason === "backdropClick" ||
      reason === "escapeKeyDown"
    ) {
      onClose();
      return;
    }

    onClose();
  };

  const dialogTitle = isEditMode
    ? "Edit Executive Action"
    : "Create Executive Action";

  const dialogSubtitle = isEditMode
    ? "Update ownership, priority, due date, and execution status."
    : "Create a new operational action for management follow-up.";

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow:
              "0 24px 60px rgba(15, 23, 42, 0.22)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: {
            xs: 2.5,
            sm: 3.5,
          },
          pt: 3,
          pb: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.75,
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                flexShrink: 0,
                borderRadius: "14px",
                display: "grid",
                placeItems: "center",
                bgcolor: `${primaryColor}14`,
                color: primaryColor,
              }}
            >
              {isEditMode ? (
                <EditNoteIcon />
              ) : (
                <AddTaskIcon />
              )}
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: {
                    xs: 20,
                    sm: 23,
                  },
                  lineHeight: 1.2,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {dialogTitle}
              </Typography>

              <Typography
                sx={{
                  mt: 0.75,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#64748b",
                }}
              >
                {dialogSubtitle}
              </Typography>
            </Box>
          </Box>

          <Button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close dialog"
            sx={{
              minWidth: 42,
              width: 42,
              height: 42,
              borderRadius: "12px",
              color: "#64748b",

              "&:hover": {
                bgcolor: "#f1f5f9",
                color: "#0f172a",
              },
            }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          px: {
            xs: 2.5,
            sm: 3.5,
          },
          py: 3,
        }}
      >
        <Stack spacing={2.75}>
          <Box>
            <Typography
              sx={{
                mb: 1.5,
                fontSize: 13,
                fontWeight: 800,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Action details
            </Typography>

            <Stack spacing={2.25}>
              <TextField
                fullWidth
                required
                autoFocus
                name="action_title"
                label="Action title"
                placeholder="Example: Investigate shovel breakdown"
                value={form.action_title}
                onChange={handleFieldChange}
                disabled={saving}
                error={Boolean(
                  errors.action_title
                )}
                helperText={
                  errors.action_title ||
                  "Use a clear, outcome-focused action title."
                }
                inputProps={{
                  maxLength: 200,
                }}
              />

              <TextField
                fullWidth
                multiline
                minRows={4}
                maxRows={8}
                name="description"
                label="Description"
                placeholder="Describe the issue, expected outcome, and important context."
                value={form.description}
                onChange={handleFieldChange}
                disabled={saving}
                inputProps={{
                  maxLength: 2000,
                }}
                helperText={`${form.description.length}/2000 characters`}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography
              sx={{
                mb: 1.5,
                fontSize: 13,
                fontWeight: 800,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Ownership and execution
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2.25,
              }}
            >
              <TextField
                fullWidth
                required
                name="owner_name"
                label="Action owner"
                placeholder="Example: Maintenance Superintendent"
                value={form.owner_name}
                onChange={handleFieldChange}
                disabled={saving}
                error={Boolean(
                  errors.owner_name
                )}
                helperText={
                  errors.owner_name ||
                  "Person or role accountable for the action."
                }
              />

              <TextField
                fullWidth
                required
                type="date"
                name="due_date"
                label="Due date"
                value={form.due_date}
                onChange={handleFieldChange}
                disabled={saving}
                error={Boolean(errors.due_date)}
                helperText={
                  errors.due_date ||
                  "Target completion date."
                }
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <FormControl
                fullWidth
                required
                error={Boolean(errors.priority)}
                disabled={saving}
              >
                <InputLabel id="priority-label">
                  Priority
                </InputLabel>

                <Select
                  labelId="priority-label"
                  name="priority"
                  value={form.priority}
                  label="Priority"
                  onChange={handleFieldChange}
                >
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

                <FormHelperText>
                  {errors.priority ||
                    "Operational importance of this action."}
                </FormHelperText>
              </FormControl>

              <FormControl
                fullWidth
                required
                error={Boolean(errors.status)}
                disabled={saving}
              >
                <InputLabel id="status-label">
                  Status
                </InputLabel>

                <Select
                  labelId="status-label"
                  name="status"
                  value={form.status}
                  label="Status"
                  onChange={handleFieldChange}
                >
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

                <FormHelperText>
                  {errors.status ||
                    "Current execution status."}
                </FormHelperText>
              </FormControl>

              <FormControl
                fullWidth
                disabled={saving}
              >
                <InputLabel id="category-label">
                  Category
                </InputLabel>

                <Select
                  labelId="category-label"
                  name="category"
                  value={form.category}
                  label="Category"
                  onChange={handleFieldChange}
                >
                  <MenuItem value="Operations">
                    Operations
                  </MenuItem>

                  <MenuItem value="Production">
                    Production
                  </MenuItem>

                  <MenuItem value="Maintenance">
                    Maintenance
                  </MenuItem>

                  <MenuItem value="Safety">
                    Safety
                  </MenuItem>

                  <MenuItem value="Geotechnical">
                    Geotechnical
                  </MenuItem>

                  <MenuItem value="Plant">
                    Plant
                  </MenuItem>

                  <MenuItem value="Environment">
                    Environment
                  </MenuItem>

                  <MenuItem value="Workforce">
                    Workforce
                  </MenuItem>

                  <MenuItem value="Other">
                    Other
                  </MenuItem>
                </Select>

                <FormHelperText>
                  Used for filtering and reporting.
                </FormHelperText>
              </FormControl>

              <FormControl
                fullWidth
                disabled={
                  saving || !isEditMode
                }
              >
                <InputLabel id="source-label">
                  Source
                </InputLabel>

                <Select
                  labelId="source-label"
                  name="source"
                  value={form.source}
                  label="Source"
                  onChange={handleFieldChange}
                >
                  <MenuItem value="Manual">
                    Manual
                  </MenuItem>

                  <MenuItem value="AI">
                    AI
                  </MenuItem>
                </Select>

                <FormHelperText>
                  {isEditMode
                    ? "How this action was originally created."
                    : "New manager-created actions are saved as Manual."}
                </FormHelperText>
              </FormControl>
            </Box>
          </Box>

          {isEditMode && actionId && (
            <>
              <Divider sx={{ my: 1 }} />

              <Box>
                <Typography
                  sx={{
                    mb: 1.5,
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Live KPI Context
                </Typography>

                <ExecutiveActionKpiContext
                  actionId={actionId}
                  primaryColor={primaryColor}
                />
              </Box>
            </>
          )}

          {!isEditMode && (
            <Box
              sx={{
                p: 2,
                borderRadius: "14px",
                bgcolor: `${primaryColor}0A`,
                border: `1px solid ${primaryColor}25`,
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                Manual executive action
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#64748b",
                }}
              >
                This action will be recorded as manually
                created by a manager and will appear in the
                Executive Action Center after saving.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: {
            xs: 2.5,
            sm: 3.5,
          },
          py: 2.5,
          gap: 1.25,
          flexDirection: {
            xs: "column-reverse",
            sm: "row",
          },
        }}
      >
        <Button
          type="button"
          variant="outlined"
          onClick={onClose}
          disabled={saving}
          fullWidth
          sx={{
            minHeight: 44,
            minWidth: {
              sm: 110,
            },
            width: {
              sm: "auto",
            },
            borderRadius: "12px",
            borderColor: "#cbd5e1",
            color: "#475569",
            fontWeight: 800,
            textTransform: "none",

            "&:hover": {
              borderColor: "#94a3b8",
              bgcolor: "#f8fafc",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="contained"
          onClick={handleSubmit}
          disabled={
            saving ||
            (isEditMode && !hasChanges)
          }
          startIcon={
            saving ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : (
              <SaveIcon />
            )
          }
          fullWidth
          sx={{
            minHeight: 44,
            minWidth: {
              sm: 190,
            },
            width: {
              sm: "auto",
            },
            borderRadius: "12px",
            bgcolor: primaryColor,
            color: "#ffffff",
            fontWeight: 800,
            textTransform: "none",
            boxShadow: `0 8px 18px ${primaryColor}30`,

            "&:hover": {
              bgcolor: primaryColor,
              filter: "brightness(0.92)",
              boxShadow: `0 10px 22px ${primaryColor}40`,
            },

            "&.Mui-disabled": {
              bgcolor: "#cbd5e1",
              color: "#ffffff",
            },
          }}
        >
          {saving
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
              ? "Save Changes"
              : "Create Action"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ExecutiveActionDialog;