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

import { useLanguage } from "../../context/LanguageContext";

import {
  translateDynamicExecutiveActionCategory,
  translateDynamicExecutiveActionOwner,
  translateDynamicExecutiveActionSource,
  translateDynamicExecutiveActionTitle,
  translateDynamicExecutiveText,
} from "../../i18n/dynamicTranslations";


function translateTemplate(
  t,
  key,
  variables = {}
) {
  let text = t(key);

  Object.entries(variables).forEach(
    ([name, value]) => {
      text = String(text).replaceAll(
        `{${name}}`,
        String(value ?? "")
      );
    }
  );

  return text;
}


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


function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}


function normalizePriorityValue(value) {
  const normalized =
    normalizeValue(value);

  const priorityMap = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  return (
    priorityMap[normalized] ||
    "Medium"
  );
}


function normalizeStatusValue(value) {
  const normalized =
    normalizeValue(value);

  const statusMap = {
    open: "Open",
    to_do: "To Do",
    todo: "To Do",
    in_progress: "In Progress",
    blocked: "Blocked",
    completed: "Completed",
    complete: "Completed",
  };

  return (
    statusMap[normalized] ||
    "Open"
  );
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
      normalizePriorityValue(
        action?.priority ||
          "Medium"
      ),

    status:
      normalizeStatusValue(
        action?.status ||
          "Open"
      ),

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


function getPriorityLabel(
  value,
  t
) {
  const normalized =
    normalizeValue(value);

  const priorityMap = {
    critical:
      "executiveActionDialog.priority.critical",

    high:
      "executiveActionDialog.priority.high",

    medium:
      "executiveActionDialog.priority.medium",

    low:
      "executiveActionDialog.priority.low",
  };

  const key =
    priorityMap[normalized];

  return key
    ? t(key)
    : value;
}


function getStatusLabel(
  value,
  t
) {
  const normalized =
    normalizeValue(value);

  const statusMap = {
    open:
      "executiveActionDialog.status.open",

    to_do:
      "executiveActionDialog.status.toDo",

    todo:
      "executiveActionDialog.status.toDo",

    in_progress:
      "executiveActionDialog.status.inProgress",

    blocked:
      "executiveActionDialog.status.blocked",

    completed:
      "executiveActionDialog.status.completed",
  };

  const key =
    statusMap[normalized];

  return key
    ? t(key)
    : value;
}


function getCategoryLabel(
  value,
  t
) {
  const normalized =
    normalizeValue(value);

  const fixedCategoryMap = {
    geotechnical:
      "executiveActionDialog.category.geotechnical",

    environment:
      "executiveActionDialog.category.environment",

    other:
      "executiveActionDialog.category.other",
  };

  const fixedKey =
    fixedCategoryMap[normalized];

  if (fixedKey) {
    return t(fixedKey);
  }

  return translateDynamicExecutiveActionCategory(
    value,
    t
  );
}


function getSourceLabel(
  value,
  t
) {
  return translateDynamicExecutiveActionSource(
    value,
    t
  );
}


function ExecutiveActionDialog({
  open,
  action,
  onClose,
  onSave,
  saving = false,
  primaryColor = "#16a34a",
}) {
  const { t } = useLanguage();

  const isMongolian =
    t("common.language") === "Хэл";

  const isEditMode = Boolean(
    action?.id ?? action?.action_id
  );

  const actionId =
    action?.id ?? action?.action_id ?? null;

  const [form, setForm] = useState(
    getInitialForm(action)
  );

  const [errors, setErrors] =
    useState({});

  const [
    localizedFieldEdits,
    setLocalizedFieldEdits,
  ] = useState({
    action_title: false,
    description: false,
    owner_name: false,
  });


  const translatedActionTitle =
    useMemo(
      () =>
        translateDynamicExecutiveActionTitle(
          form.action_title,
          t
        ),
      [
        form.action_title,
        t,
      ]
    );


  const translatedDescription =
    useMemo(() => {
      if (!form.description) {
        return "";
      }

      const translatedAsActionTitle =
        translateDynamicExecutiveActionTitle(
          form.description,
          t
        );

      if (
        translatedAsActionTitle &&
        translatedAsActionTitle !==
          form.description
      ) {
        return translatedAsActionTitle;
      }

      return translateDynamicExecutiveText(
        form.description,
        t
      );
    }, [
      form.description,
      t,
    ]);


  const translatedOwner =
    useMemo(
      () =>
        translateDynamicExecutiveActionOwner(
          form.owner_name,
          t
        ),
      [
        form.owner_name,
        t,
      ]
    );


  const actionTitleDisplayValue =
    isMongolian &&
    !localizedFieldEdits.action_title &&
    translatedActionTitle &&
    translatedActionTitle !==
      form.action_title
      ? translatedActionTitle
      : form.action_title;


  const descriptionDisplayValue =
    isMongolian &&
    !localizedFieldEdits.description &&
    translatedDescription &&
    translatedDescription !==
      form.description
      ? translatedDescription
      : form.description;


  const ownerDisplayValue =
    isMongolian &&
    !localizedFieldEdits.owner_name &&
    translatedOwner &&
    translatedOwner !==
      form.owner_name
      ? translatedOwner
      : form.owner_name;


  const descriptionHelperText =
    isMongolian &&
    !localizedFieldEdits.description &&
    translatedDescription &&
    translatedDescription !==
      form.description
      ? `${form.description} • ${descriptionDisplayValue.length}/2000 тэмдэгт`
      : translateTemplate(
          t,
          "executiveActionDialog.characterCount",
          {
            count:
              descriptionDisplayValue.length,
            max: 2000,
          }
        );


  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId =
      window.setTimeout(
        () => {
          setForm(
            getInitialForm(action)
          );

          setErrors({});

          setLocalizedFieldEdits({
            action_title: false,
            description: false,
            owner_name: false,
          });
        },
        0
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [open, action]);


  const hasChanges =
    useMemo(() => {
      const original =
        getInitialForm(action);

      return (
        form.action_title.trim() !==
          String(
            original.action_title || ""
          ).trim() ||

        form.description.trim() !==
          String(
            original.description || ""
          ).trim() ||

        form.owner_name.trim() !==
          String(
            original.owner_name || ""
          ).trim() ||

        form.priority !==
          original.priority ||

        form.status !==
          original.status ||

        normalizeDateValue(
          form.due_date
        ) !==
          normalizeDateValue(
            original.due_date
          ) ||

        form.category !==
          original.category ||

        form.source !==
          original.source
      );
    }, [form, action]);


  const handleFieldChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (currentForm) => ({
          ...currentForm,
          [name]: value,
        })
      );

      if (errors[name]) {
        setErrors(
          (currentErrors) => ({
            ...currentErrors,
            [name]: "",
          })
        );
      }
    };


  const handleLocalizedFieldChange =
    (fieldName) => (event) => {
      const { value } = event.target;

      setLocalizedFieldEdits(
        (current) => ({
          ...current,
          [fieldName]: true,
        })
      );

      setForm(
        (currentForm) => ({
          ...currentForm,
          [fieldName]: value,
        })
      );

      if (errors[fieldName]) {
        setErrors(
          (currentErrors) => ({
            ...currentErrors,
            [fieldName]: "",
          })
        );
      }
    };


  const validateForm = () => {
    const nextErrors = {};

    if (
      !actionTitleDisplayValue.trim()
    ) {
      nextErrors.action_title =
        t(
          "executiveActionDialog.validation.actionTitleRequired"
        );
    }

    if (
      !ownerDisplayValue.trim()
    ) {
      nextErrors.owner_name =
        t(
          "executiveActionDialog.validation.ownerRequired"
        );
    }

    if (!form.priority) {
      nextErrors.priority =
        t(
          "executiveActionDialog.validation.priorityRequired"
        );
    }

    if (!form.status) {
      nextErrors.status =
        t(
          "executiveActionDialog.validation.statusRequired"
        );
    }

    if (!form.due_date) {
      nextErrors.due_date =
        t(
          "executiveActionDialog.validation.dueDateRequired"
        );
    }

    setErrors(nextErrors);

    return (
      Object.keys(
        nextErrors
      ).length === 0
    );
  };


  const handleSubmit =
    async () => {
      if (saving) {
        return;
      }

      if (!validateForm()) {
        return;
      }

      const payload = {
        action_title:
          localizedFieldEdits.action_title
            ? actionTitleDisplayValue.trim()
            : form.action_title.trim(),

        description:
          localizedFieldEdits.description
            ? descriptionDisplayValue.trim()
            : form.description.trim(),

        owner_name:
          localizedFieldEdits.owner_name
            ? ownerDisplayValue.trim()
            : form.owner_name.trim(),

        priority:
          form.priority,

        status:
          form.status,

        due_date:
          form.due_date,

        category:
          form.category,

        source:
          form.source ||
          "Manual",
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
      reason ===
        "backdropClick" ||
      reason ===
        "escapeKeyDown"
    ) {
      onClose();
      return;
    }

    onClose();
  };


  const dialogTitle =
    isEditMode
      ? t(
          "executiveActionDialog.editTitle"
        )
      : t(
          "executiveActionDialog.createTitle"
        );


  const dialogSubtitle =
    isEditMode
      ? t(
          "executiveActionDialog.editSubtitle"
        )
      : t(
          "executiveActionDialog.createSubtitle"
        );


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
            alignItems:
              "flex-start",
            justifyContent:
              "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems:
                "flex-start",
              gap: 1.75,
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                flexShrink: 0,
                borderRadius:
                  "14px",
                display: "grid",
                placeItems:
                  "center",
                bgcolor:
                  `${primaryColor}14`,
                color:
                  primaryColor,
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
                  color:
                    "#0f172a",
                }}
              >
                {dialogTitle}
              </Typography>

              <Typography
                sx={{
                  mt: 0.75,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color:
                    "#64748b",
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
            aria-label={t(
              "executiveActionDialog.closeDialog"
            )}
            sx={{
              minWidth: 42,
              width: 42,
              height: 42,
              borderRadius:
                "12px",
              color:
                "#64748b",

              "&:hover": {
                bgcolor:
                  "#f1f5f9",
                color:
                  "#0f172a",
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
                color:
                  "#475569",
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.06em",
              }}
            >
              {t(
                "executiveActionDialog.actionDetails"
              )}
            </Typography>

            <Stack spacing={2.25}>
              <TextField
                fullWidth
                required
                autoFocus
                name="action_title"
                label={t(
                  "executiveActionDialog.actionTitle"
                )}
                placeholder={t(
                  "executiveActionDialog.actionTitlePlaceholder"
                )}
                value={
                  actionTitleDisplayValue
                }
                onChange={
                  handleLocalizedFieldChange(
                    "action_title"
                  )
                }
                disabled={saving}
                error={Boolean(
                  errors.action_title
                )}
                helperText={
                  errors.action_title ||
                  (
                    isMongolian &&
                    !localizedFieldEdits.action_title &&
                    translatedActionTitle &&
                    translatedActionTitle !==
                      form.action_title
                      ? form.action_title
                      : t(
                          "executiveActionDialog.actionTitleHelper"
                        )
                  )
                }
                slotProps={{
                  htmlInput: {
                    maxLength: 200,
                  },
                }}
              />

              <TextField
                fullWidth
                multiline
                minRows={4}
                maxRows={8}
                name="description"
                label={t(
                  "executiveActionDialog.description"
                )}
                placeholder={t(
                  "executiveActionDialog.descriptionPlaceholder"
                )}
                value={
                  descriptionDisplayValue
                }
                onChange={
                  handleLocalizedFieldChange(
                    "description"
                  )
                }
                disabled={saving}
                slotProps={{
                  htmlInput: {
                    maxLength: 2000,
                  },
                }}
                helperText={
                  descriptionHelperText
                }
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
                color:
                  "#475569",
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.06em",
              }}
            >
              {t(
                "executiveActionDialog.ownershipAndExecution"
              )}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  {
                    xs: "1fr",
                    sm:
                      "repeat(2, minmax(0, 1fr))",
                  },
                gap: 2.25,
              }}
            >
              <TextField
                fullWidth
                required
                name="owner_name"
                label={t(
                  "executiveActionDialog.actionOwner"
                )}
                placeholder={t(
                  "executiveActionDialog.actionOwnerPlaceholder"
                )}
                value={
                  ownerDisplayValue
                }
                onChange={
                  handleLocalizedFieldChange(
                    "owner_name"
                  )
                }
                disabled={saving}
                error={Boolean(
                  errors.owner_name
                )}
                helperText={
                  errors.owner_name ||
                  (
                    isMongolian &&
                    !localizedFieldEdits.owner_name &&
                    translatedOwner &&
                    translatedOwner !==
                      form.owner_name
                      ? form.owner_name
                      : t(
                          "executiveActionDialog.actionOwnerHelper"
                        )
                  )
                }
              />

              <TextField
                fullWidth
                required
                type="date"
                name="due_date"
                label={t(
                  "executiveActionDialog.dueDate"
                )}
                value={
                  form.due_date
                }
                onChange={
                  handleFieldChange
                }
                disabled={saving}
                error={Boolean(
                  errors.due_date
                )}
                helperText={
                  errors.due_date ||
                  t(
                    "executiveActionDialog.dueDateHelper"
                  )
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
                error={Boolean(
                  errors.priority
                )}
                disabled={saving}
              >
                <InputLabel
                  id="priority-label"
                >
                  {t(
                    "executiveActionDialog.priorityLabel"
                  )}
                </InputLabel>

                <Select
                  labelId="priority-label"
                  name="priority"
                  value={
                    form.priority
                  }
                  label={t(
                    "executiveActionDialog.priorityLabel"
                  )}
                  onChange={
                    handleFieldChange
                  }
                >
                  {[
                    "Critical",
                    "High",
                    "Medium",
                    "Low",
                  ].map(
                    (priority) => (
                      <MenuItem
                        key={
                          priority
                        }
                        value={
                          priority
                        }
                      >
                        {getPriorityLabel(
                          priority,
                          t
                        )}
                      </MenuItem>
                    )
                  )}
                </Select>

                <FormHelperText>
                  {errors.priority ||
                    t(
                      "executiveActionDialog.priorityHelper"
                    )}
                </FormHelperText>
              </FormControl>

              <FormControl
                fullWidth
                required
                error={Boolean(
                  errors.status
                )}
                disabled={saving}
              >
                <InputLabel
                  id="status-label"
                >
                  {t(
                    "executiveActionDialog.statusLabel"
                  )}
                </InputLabel>

                <Select
                  labelId="status-label"
                  name="status"
                  value={
                    form.status
                  }
                  label={t(
                    "executiveActionDialog.statusLabel"
                  )}
                  onChange={
                    handleFieldChange
                  }
                >
                  {[
                    "Open",
                    "To Do",
                    "In Progress",
                    "Blocked",
                    "Completed",
                  ].map(
                    (status) => (
                      <MenuItem
                        key={status}
                        value={status}
                      >
                        {getStatusLabel(
                          status,
                          t
                        )}
                      </MenuItem>
                    )
                  )}
                </Select>

                <FormHelperText>
                  {errors.status ||
                    t(
                      "executiveActionDialog.statusHelper"
                    )}
                </FormHelperText>
              </FormControl>

              <FormControl
                fullWidth
                disabled={saving}
              >
                <InputLabel
                  id="category-label"
                >
                  {t(
                    "executiveActionDialog.categoryLabel"
                  )}
                </InputLabel>

                <Select
                  labelId="category-label"
                  name="category"
                  value={
                    form.category
                  }
                  label={t(
                    "executiveActionDialog.categoryLabel"
                  )}
                  onChange={
                    handleFieldChange
                  }
                >
                  {[
                    "Operations",
                    "Production",
                    "Maintenance",
                    "Safety",
                    "Geotechnical",
                    "Plant",
                    "Environment",
                    "Workforce",
                    "Other",
                  ].map(
                    (category) => (
                      <MenuItem
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {getCategoryLabel(
                          category,
                          t
                        )}
                      </MenuItem>
                    )
                  )}
                </Select>

                <FormHelperText>
                  {t(
                    "executiveActionDialog.categoryHelper"
                  )}
                </FormHelperText>
              </FormControl>

              <FormControl
                fullWidth
                disabled={
                  saving ||
                  !isEditMode
                }
              >
                <InputLabel
                  id="source-label"
                >
                  {t(
                    "executiveActionDialog.sourceLabel"
                  )}
                </InputLabel>

                <Select
                  labelId="source-label"
                  name="source"
                  value={
                    form.source
                  }
                  label={t(
                    "executiveActionDialog.sourceLabel"
                  )}
                  onChange={
                    handleFieldChange
                  }
                >
                  {[
                    "Manual",
                    "AI",
                  ].map(
                    (source) => (
                      <MenuItem
                        key={source}
                        value={source}
                      >
                        {getSourceLabel(
                          source,
                          t
                        )}
                      </MenuItem>
                    )
                  )}
                </Select>

                <FormHelperText>
                  {isEditMode
                    ? t(
                        "executiveActionDialog.sourceEditHelper"
                      )
                    : t(
                        "executiveActionDialog.sourceCreateHelper"
                      )}
                </FormHelperText>
              </FormControl>
            </Box>
          </Box>

          {isEditMode &&
            actionId && (
              <>
                <Divider
                  sx={{
                    my: 1,
                  }}
                />

                <Box>
                  <Typography
                    sx={{
                      mb: 1.5,
                      fontSize: 13,
                      fontWeight:
                        800,
                      color:
                        "#475569",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.06em",
                    }}
                  >
                    {t(
                      "executiveActionDialog.liveKpiContext"
                    )}
                  </Typography>

                  <ExecutiveActionKpiContext
                    actionId={
                      actionId
                    }
                    primaryColor={
                      primaryColor
                    }
                  />
                </Box>
              </>
            )}

          {!isEditMode &&
            String(
              form.source || ""
            )
              .trim()
              .toLowerCase() !==
              "ai" && (
            <Box
              sx={{
                p: 2,
                borderRadius:
                  "14px",
                bgcolor:
                  `${primaryColor}0A`,
                border:
                  `1px solid ${primaryColor}25`,
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  color:
                    "#334155",
                }}
              >
                {t(
                  "executiveActionDialog.manualActionTitle"
                )}
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color:
                    "#64748b",
                }}
              >
                {t(
                  "executiveActionDialog.manualActionDescription"
                )}
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
            xs:
              "column-reverse",
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

            borderRadius:
              "12px",

            borderColor:
              "#cbd5e1",

            color:
              "#475569",

            fontWeight: 800,
            textTransform:
              "none",

            "&:hover": {
              borderColor:
                "#94a3b8",

              bgcolor:
                "#f8fafc",
            },
          }}
        >
          {t(
            "executiveActionDialog.cancel"
          )}
        </Button>

        <Button
          type="button"
          variant="contained"
          onClick={
            handleSubmit
          }
          disabled={
            saving ||
            (isEditMode &&
              !hasChanges)
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

            borderRadius:
              "12px",

            bgcolor:
              primaryColor,

            color:
              "#ffffff",

            fontWeight: 800,
            textTransform:
              "none",

            boxShadow:
              `0 8px 18px ${primaryColor}30`,

            "&:hover": {
              bgcolor:
                primaryColor,

              filter:
                "brightness(0.92)",

              boxShadow:
                `0 10px 22px ${primaryColor}40`,
            },

            "&.Mui-disabled":
              {
                bgcolor:
                  "#cbd5e1",

                color:
                  "#ffffff",
              },
          }}
        >
          {saving
            ? isEditMode
              ? t(
                  "executiveActionDialog.updating"
                )
              : t(
                  "executiveActionDialog.creating"
                )
            : isEditMode
              ? t(
                  "executiveActionDialog.saveChanges"
                )
              : t(
                  "executiveActionDialog.createAction"
                )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


export default ExecutiveActionDialog;
