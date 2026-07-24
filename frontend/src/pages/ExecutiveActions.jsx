import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  Snackbar,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

import ExecutiveActionSummary from "../components/executive/ExecutiveActionSummary";
import ExecutiveActionFilters from "../components/executive/ExecutiveActionFilters";
import ExecutiveActionTable from "../components/executive/ExecutiveActionTable";
import ExecutiveActionDialog from "../components/executive/ExecutiveActionDialog";
import ExecutiveActionDeleteDialog from "../components/executive/ExecutiveActionDeleteDialog";
import ExecutiveActionAnalytics from "../components/executive/ExecutiveActionAnalytics";
import ExecutiveActionKpiContext from "../components/executive/ExecutiveActionKpiContext";

import {
  createExecutiveAction,
  deleteExecutiveAction,
  getExecutiveActions,
  getExecutiveActionSummary,
  updateExecutiveAction,
  updateExecutiveActionStatus,
} from "../api/executiveActionsApi";

import {
  getExecutiveActionKpiContext,
} from "../api/executiveKpiContextApi";

import { useConfig } from "../context/ConfigContext";


function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}


function formatStatusLabel(status) {
  const normalizedStatus =
    normalizeValue(status);

  const statusLabels = {
    open: "Open",
    to_do: "To Do",
    todo: "To Do",
    in_progress: "In Progress",
    blocked: "Blocked",
    completed: "Completed",
    complete: "Completed",
  };

  return (
    statusLabels[normalizedStatus] ||
    status ||
    "Open"
  );
}


function formatSpecialFilterLabel(filterKey) {
  const labels = {
    due_today: "Due Today",
    overdue: "Overdue",
    high_priority: "High Priority",
    completed_this_month:
      "Completed This Month",
  };

  return labels[filterKey] || "";
}



function formatKpiLabel(kpiKey) {
  const labels = {
    ore: "Ore Performance",
    waste: "Waste Movement",
    fleet: "Fleet Performance",
    plant: "Plant Performance",
    safety: "Safety",
    mine_health: "Mine Health",
  };

  const normalizedKey =
    normalizeValue(kpiKey);

  if (labels[normalizedKey]) {
    return labels[normalizedKey];
  }

  return String(kpiKey || "")
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}


function getActionOwner(action) {
  return (
    action?.owner_name ||
    action?.owner ||
    action?.assigned_to ||
    "Unassigned"
  );
}


function getActionSearchText(action) {
  return [
    action?.action_title,
    action?.title,
    action?.recommended_action,
    action?.action,
    action?.description,
    action?.action_description,
    action?.recommendation,
    action?.kpi_name,
    action?.kpi_label,
    action?.kpi_key,
    action?.category,
    action?.source,
    getActionOwner(action),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}


function getActionId(action) {
  return (
    action?.id ??
    action?.action_id
  );
}


function getBackendErrorMessage(
  error,
  fallbackMessage
) {
  const backendDetail =
    error?.response?.data?.detail;

  if (
    typeof backendDetail ===
    "string"
  ) {
    return backendDetail;
  }

  if (
    Array.isArray(backendDetail)
  ) {
    return backendDetail
      .map((item) => {
        if (
          typeof item === "string"
        ) {
          return item;
        }

        const fieldPath =
          Array.isArray(item?.loc)
            ? item.loc
                .filter(
                  (part) =>
                    part !== "body"
                )
                .join(".")
            : "";

        const message =
          item?.msg ||
          item?.message ||
          "Validation error";

        return fieldPath
          ? `${fieldPath}: ${message}`
          : message;
      })
      .join(", ");
  }

  return (
    error?.userMessage ||
    error?.response?.data
      ?.message ||
    error?.message ||
    fallbackMessage
  );
}


/*
 * Converts a YYYY-MM-DD backend value
 * into a local Date without UTC timezone
 * shifting the day.
 */
function parseDateOnly(value) {
  if (!value) {
    return null;
  }

  if (
    value instanceof Date
  ) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;
  }

  const stringValue =
    String(value).trim();

  const dateOnlyMatch =
    stringValue.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (dateOnlyMatch) {
    const year = Number(
      dateOnlyMatch[1]
    );

    const month = Number(
      dateOnlyMatch[2]
    );

    const day = Number(
      dateOnlyMatch[3]
    );

    const localDate = new Date(
      year,
      month - 1,
      day
    );

    return Number.isNaN(
      localDate.getTime()
    )
      ? null
      : localDate;
  }

  const parsedDate =
    new Date(stringValue);

  return Number.isNaN(
    parsedDate.getTime()
  )
    ? null
    : parsedDate;
}


function getStartOfToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
}


function getEndOfToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
}


function getFirstDayOfCurrentMonth() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );
}


function ExecutiveActions() {
  const { company } =
    useConfig();

  const navigate =
    useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const activeKpiKey =
    searchParams.get(
      "kpi_key"
    ) || "";

  const primaryColor =
    company?.primary_color ||
    "#16a34a";

  const [summary, setSummary] =
    useState(null);

  const [actions, setActions] =
    useState([]);

  const [filters, setFilters] =
    useState({
      search: "",
      status: "",
      priority: "",
      owner: "",
      special: "",
      firstDayOfMonth: "",
      kpiKey: activeKpiKey,
    });


  useEffect(() => {
    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        kpiKey:
          activeKpiKey,
      })
    );
  }, [activeKpiKey]);


  const [
    summaryLoading,
    setSummaryLoading,
  ] = useState(true);

  const [
    actionsLoading,
    setActionsLoading,
  ] = useState(true);

  const [
    selectedAction,
    setSelectedAction,
  ] = useState(null);

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);

  const [
    savingAction,
    setSavingAction,
  ] = useState(false);

  const [
    actionToDelete,
    setActionToDelete,
  ] = useState(null);

  const [
    deleteDialogOpen,
    setDeleteDialogOpen,
  ] = useState(false);

  const [
    deletingAction,
    setDeletingAction,
  ] = useState(false);

  const [
    updatingStatusId,
    setUpdatingStatusId,
  ] = useState(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    analyticsRefreshKey,
    setAnalyticsRefreshKey,
  ] = useState(0);


  const ownerOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          actions
            .map((action) =>
              getActionOwner(action)
            )
            .filter(
              (owner) =>
                owner &&
                owner !==
                  "Unassigned"
            )
        )
      ).sort((a, b) =>
        a.localeCompare(b)
      );
    }, [actions]);


  const filteredActions =
    useMemo(() => {
      const todayStart =
        getStartOfToday();

      const todayEnd =
        getEndOfToday();

      const defaultFirstDay =
        getFirstDayOfCurrentMonth();

      const selectedFirstDay =
        parseDateOnly(
          filters.firstDayOfMonth
        ) || defaultFirstDay;

      return actions.filter(
        (action) => {
          const searchValue =
            String(
              filters.search || ""
            )
              .trim()
              .toLowerCase();

          const matchesSearch =
            !searchValue ||
            getActionSearchText(
              action
            ).includes(searchValue);

          const actionStatus =
            normalizeValue(
              action?.status
            );

          const actionPriority =
            normalizeValue(
              action?.priority
            );

          const matchesStatus =
            !filters.status ||
            actionStatus ===
              normalizeValue(
                filters.status
              );

          const matchesPriority =
            !filters.priority ||
            actionPriority ===
              normalizeValue(
                filters.priority
              );

          const matchesOwner =
            !filters.owner ||
            getActionOwner(
              action
            ) === filters.owner;

          const matchesKpi =
            !filters.kpiKey ||
            normalizeValue(
              action?.kpi_key
            ) ===
              normalizeValue(
                filters.kpiKey
              );

          const dueDate =
            parseDateOnly(
              action?.due_date
            );

          const completedAt =
            parseDateOnly(
              action?.completed_at
            );

          const activeStatus =
            [
              "open",
              "in_progress",
              "blocked",
            ].includes(
              actionStatus
            );

          let matchesSpecial =
            true;

          if (
            filters.special ===
            "overdue"
          ) {
            matchesSpecial =
              Boolean(dueDate) &&
              dueDate <
                todayStart &&
              activeStatus;
          }

          if (
            filters.special ===
            "due_today"
          ) {
            matchesSpecial =
              Boolean(dueDate) &&
              dueDate >=
                todayStart &&
              dueDate <=
                todayEnd &&
              activeStatus;
          }

          if (
            filters.special ===
            "high_priority"
          ) {
            matchesSpecial =
              [
                "high",
                "critical",
              ].includes(
                actionPriority
              ) &&
              activeStatus;
          }

          if (
            filters.special ===
            "completed_this_month"
          ) {
            matchesSpecial =
              actionStatus ===
                "completed" &&
              Boolean(
                completedAt
              ) &&
              completedAt >=
                selectedFirstDay;
          }

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority &&
            matchesOwner &&
            matchesKpi &&
            matchesSpecial
          );
        }
      );
    }, [actions, filters]);


  const loadSummary =
    useCallback(async () => {
      try {
        setSummaryLoading(true);

        const summaryData =
          await getExecutiveActionSummary();

        setSummary(summaryData);
      } catch (error) {
        console.error(
          "Failed to load executive action summary:",
          error
        );

        setErrorMessage(
          getBackendErrorMessage(
            error,
            "Failed to load the executive action summary."
          )
        );
      } finally {
        setSummaryLoading(
          false
        );
      }
    }, []);


  const loadActions =
    useCallback(async () => {
      try {
        setActionsLoading(true);

        const actionsData =
          await getExecutiveActions({
            skip: 0,
            limit: 100,
            ...(activeKpiKey
              ? {
                  kpi_key:
                    activeKpiKey,
                }
              : {}),
          });

        if (
          Array.isArray(
            actionsData
          )
        ) {
          setActions(
            actionsData
          );

          return;
        }

        if (
          Array.isArray(
            actionsData?.items
          )
        ) {
          setActions(
            actionsData.items
          );

          return;
        }

        if (
          Array.isArray(
            actionsData?.actions
          )
        ) {
          setActions(
            actionsData.actions
          );

          return;
        }

        setActions([]);
      } catch (error) {
        console.error(
          "Failed to load executive actions:",
          error
        );

        setErrorMessage(
          getBackendErrorMessage(
            error,
            "Failed to load executive actions."
          )
        );

        setActions([]);
      } finally {
        setActionsLoading(
          false
        );
      }
    }, [activeKpiKey]);


  const refreshExecutiveActions =
    useCallback(async () => {
      setErrorMessage("");

      await Promise.all([
        loadSummary(),
        loadActions(),
      ]);

      setAnalyticsRefreshKey(
        (currentKey) =>
          currentKey + 1
      );
    }, [
      loadSummary,
      loadActions,
    ]);


  useEffect(() => {
    refreshExecutiveActions();
  }, [
    refreshExecutiveActions,
  ]);


  const handleFilterChange = (
    nextFilters
  ) => {
    if (
      typeof nextFilters ===
      "function"
    ) {
      setFilters(
        (currentFilters) => {
          const result =
            nextFilters(
              currentFilters
            );

          return {
            ...currentFilters,
            ...result,
          };
        }
      );

      return;
    }

    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        ...nextFilters,
      })
    );
  };


  const handleClearFilters =
    () => {
      setFilters({
        search: "",
        status: "",
        priority: "",
        owner: "",
        special: "",
        firstDayOfMonth: "",
        kpiKey:
          activeKpiKey,
      });
    };




  const handleBackToKpiDashboard =
    () => {
      if (activeKpiKey) {
        navigate(
          `/?kpi_key=${encodeURIComponent(
            activeKpiKey
          )}`
        );

        return;
      }

      navigate("/");
    };


  const handleClearKpiFilter =
    () => {
      const nextParams =
        new URLSearchParams(
          searchParams
        );

      nextParams.delete(
        "kpi_key"
      );

      setSearchParams(
        nextParams
      );
    };


  const handleSummaryFilter = (
    filterKey
  ) => {
    const normalizedKey =
      normalizeValue(filterKey);

    const statusKeys = [
      "open",
      "in_progress",
      "completed",
      "blocked",
    ];

    const specialKeys = [
      "due_today",
      "overdue",
      "high_priority",
      "completed_this_month",
    ];

    if (
      normalizedKey ===
      "total"
    ) {
      setFilters(
        (currentFilters) => ({
          ...currentFilters,
          status: "",
          priority: "",
          special: "",
          firstDayOfMonth:
            "",
        })
      );

      return;
    }

    if (
      statusKeys.includes(
        normalizedKey
      )
    ) {
      setFilters(
        (currentFilters) => ({
          ...currentFilters,
          status:
            normalizedKey,
          priority: "",
          special: "",
          firstDayOfMonth:
            "",
        })
      );

      return;
    }

    if (
      specialKeys.includes(
        normalizedKey
      )
    ) {
      const firstDay =
        getFirstDayOfCurrentMonth();

      const firstDayValue = [
        firstDay.getFullYear(),
        String(
          firstDay.getMonth() +
            1
        ).padStart(2, "0"),
        String(
          firstDay.getDate()
        ).padStart(2, "0"),
      ].join("-");

      setFilters(
        (currentFilters) => ({
          ...currentFilters,
          status: "",
          priority: "",
          special:
            normalizedKey,
          firstDayOfMonth:
            normalizedKey ===
            "completed_this_month"
              ? firstDayValue
              : "",
        })
      );
    }
  };


  const handleRemoveSummaryFilter =
    () => {
      setFilters(
        (currentFilters) => ({
          ...currentFilters,
          status: "",
          priority: "",
          special: "",
          firstDayOfMonth:
            "",
        })
      );
    };


  const handleCreateAction =
    () => {
      setErrorMessage("");
      setSelectedAction(null);
      setDialogOpen(true);
    };


  const handleEditAction = (
    action
  ) => {
    setErrorMessage("");
    setSelectedAction(action);
    setDialogOpen(true);
  };


  const handleCloseDialog =
    () => {
      if (savingAction) {
        return;
      }

      setDialogOpen(false);
      setSelectedAction(null);
    };


  const handleSaveAction =
    async (payload) => {
      const actionId =
        getActionId(
          selectedAction
        );

      const isEditMode =
        Boolean(actionId);

      try {
        setSavingAction(true);
        setErrorMessage("");

        if (isEditMode) {
          await updateExecutiveAction(
            actionId,
            payload
          );

          setSuccessMessage(
            "Executive action updated successfully."
          );
        } else {
          await createExecutiveAction({
            ...payload,
            source: "Manual",
          });

          setSuccessMessage(
            "Executive action created successfully."
          );
        }

        setDialogOpen(false);
        setSelectedAction(null);

        await refreshExecutiveActions();
      } catch (error) {
        console.error(
          isEditMode
            ? "Failed to update executive action:"
            : "Failed to create executive action:",
          error
        );

        setErrorMessage(
          getBackendErrorMessage(
            error,
            isEditMode
              ? "Failed to update the executive action."
              : "Failed to create the executive action."
          )
        );
      } finally {
        setSavingAction(false);
      }
    };


  const handleQuickStatusChange =
    async (
      action,
      newStatus
    ) => {
      const actionId =
        getActionId(action);

      if (!actionId) {
        setErrorMessage(
          "This action does not have a valid database ID."
        );

        return;
      }

      try {
        setUpdatingStatusId(
          actionId
        );

        setErrorMessage("");

        await updateExecutiveActionStatus(
          actionId,
          newStatus
        );

        setSuccessMessage(
          `Action status changed to ${formatStatusLabel(
            newStatus
          )}.`
        );

        await refreshExecutiveActions();
      } catch (error) {
        console.error(
          "Failed to update executive action status:",
          error
        );

        setErrorMessage(
          getBackendErrorMessage(
            error,
            "Failed to update the action status."
          )
        );
      } finally {
        setUpdatingStatusId(
          null
        );
      }
    };


  const handleDeleteAction = (
    action
  ) => {
    setErrorMessage("");
    setActionToDelete(action);
    setDeleteDialogOpen(true);
  };


  const handleCloseDeleteDialog =
    () => {
      if (deletingAction) {
        return;
      }

      setDeleteDialogOpen(
        false
      );

      setActionToDelete(null);
    };


  const handleConfirmDelete =
    async () => {
      const actionId =
        getActionId(
          actionToDelete
        );

      if (!actionId) {
        setErrorMessage(
          "This action does not have a valid database ID."
        );

        return;
      }

      try {
        setDeletingAction(true);
        setErrorMessage("");

        await deleteExecutiveAction(
          actionId
        );

        setSuccessMessage(
          "Executive action deleted successfully."
        );

        setDeleteDialogOpen(
          false
        );

        setActionToDelete(null);

        await refreshExecutiveActions();
      } catch (error) {
        console.error(
          "Failed to delete executive action:",
          error
        );

        setErrorMessage(
          getBackendErrorMessage(
            error,
            "Failed to delete the executive action."
          )
        );
      } finally {
        setDeletingAction(false);
      }
    };


  const handleTestKpiContext =
    async () => {
      try {
        setErrorMessage("");

        const result =
          await getExecutiveActionKpiContext(
            1
          );

        console.log(
          "Live KPI Context:",
          result
        );

        setSuccessMessage(
          "Live KPI context loaded successfully. Check the browser console."
        );
      } catch (error) {
        console.error(
          "KPI Context Error:",
          error
        );

        setErrorMessage(
          getBackendErrorMessage(
            error,
            "Unable to load live KPI context."
          )
        );
      }
    };


  const isRefreshing =
    summaryLoading ||
    actionsLoading;

  const activeSummaryFilter =
    filters.special ||
    filters.status ||
    "";

  const activeSummaryLabel =
    filters.special
      ? formatSpecialFilterLabel(
          filters.special
        )
      : filters.status
        ? formatStatusLabel(
            filters.status
          )
        : "";


  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 4,
        },
      }}
    >
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          justifyContent:
            "space-between",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Executive Action Center
          </Typography>

          <Typography
            sx={{
              mt: 0.75,
              color: "#64748b",
            }}
          >
            Manage AI-generated and
            manually created actions
            across all mining
            operations.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            width: {
              xs: "100%",
              sm: "auto",
            },
            flexDirection: {
              xs: "column",
              sm: "row",
            },
          }}
        >
          <Button
            variant="outlined"
            startIcon={
              <RefreshIcon />
            }
            onClick={
              refreshExecutiveActions
            }
            disabled={
              isRefreshing
            }
            sx={{
              minWidth: 120,
              width: {
                xs: "100%",
                sm: "auto",
              },
              minHeight: 44,
              borderRadius: "12px",
              borderColor:
                "#cbd5e1",
              color: "#334155",
              fontWeight: 800,
              textTransform: "none",

              "&:hover": {
                borderColor:
                  primaryColor,
                bgcolor:
                  `${primaryColor}0A`,
                color:
                  primaryColor,
              },
            }}
          >
            {isRefreshing
              ? "Refreshing..."
              : "Refresh"}
          </Button>

          <Button
            variant="outlined"
            onClick={
              handleTestKpiContext
            }
            sx={{
              minWidth: 165,
              width: {
                xs: "100%",
                sm: "auto",
              },
              minHeight: 44,
              borderRadius: "12px",
              borderColor:
                primaryColor,
              color: primaryColor,
              fontWeight: 800,
              textTransform: "none",

              "&:hover": {
                borderColor:
                  primaryColor,
                bgcolor:
                  `${primaryColor}0A`,
              },
            }}
          >
            Test KPI Context
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={
              handleCreateAction
            }
            disabled={
              savingAction
            }
            sx={{
              minWidth: 205,
              width: {
                xs: "100%",
                sm: "auto",
              },
              minHeight: 44,
              borderRadius: "12px",
              bgcolor:
                primaryColor,
              color: "#ffffff",
              fontWeight: 800,
              textTransform: "none",
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

              "&.Mui-disabled": {
                bgcolor: "#cbd5e1",
                color: "#ffffff",
              },
            }}
          >
            New Executive Action
          </Button>
        </Box>
      </Box>

      {activeKpiKey && (
        <ExecutiveActionKpiContext
          kpiKey={activeKpiKey}
          actions={filteredActions}
          primaryColor={primaryColor}
          onBack={
            handleBackToKpiDashboard
          }
          onClear={
            handleClearKpiFilter
          }
        />
      )}

      <ExecutiveActionSummary
        summary={summary}
        loading={summaryLoading}
        primaryColor={
          primaryColor
        }
        onCardClick={
          handleSummaryFilter
        }
        activeFilter={
          activeSummaryFilter
        }
      />

      <Box
        sx={{
          mt: 4,
        }}
      >
        <ExecutiveActionAnalytics
          key={analyticsRefreshKey}
        />
      </Box>

      <Box
        sx={{
          mt: 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            justifyContent:
              "space-between",
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
                fontSize: 20,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Executive Actions
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontSize: 14,
                color: "#64748b",
              }}
            >
              Review ownership,
              priority, due dates, and
              current execution status.
            </Typography>
          </Box>

          {activeSummaryLabel && (
            <Chip
              label={`Filtered: ${activeSummaryLabel}`}
              onDelete={
                handleRemoveSummaryFilter
              }
              sx={{
                borderRadius: "10px",
                color: primaryColor,
                backgroundColor:
                  `${primaryColor}12`,
                border:
                  `1px solid ${primaryColor}35`,
                fontWeight: 800,

                "& .MuiChip-deleteIcon": {
                  color:
                    primaryColor,
                },
              }}
            />
          )}
        </Box>

        <ExecutiveActionFilters
          filters={filters}
          onFilterChange={
            handleFilterChange
          }
          onClear={
            handleClearFilters
          }
          owners={ownerOptions}
          primaryColor={
            primaryColor
          }
        />

        <ExecutiveActionTable
          actions={
            filteredActions
          }
          loading={
            actionsLoading
          }
          onEdit={
            handleEditAction
          }
          onDelete={
            handleDeleteAction
          }
          onStatusChange={
            handleQuickStatusChange
          }
          updatingStatusId={
            updatingStatusId
          }
        />
      </Box>

      <ExecutiveActionDialog
        open={dialogOpen}
        action={selectedAction}
        onClose={
          handleCloseDialog
        }
        onSave={
          handleSaveAction
        }
        saving={
          savingAction
        }
        primaryColor={
          primaryColor
        }
      />

      <ExecutiveActionDeleteDialog
        open={
          deleteDialogOpen
        }
        action={
          actionToDelete
        }
        onClose={
          handleCloseDeleteDialog
        }
        onConfirm={
          handleConfirmDelete
        }
        deleting={
          deletingAction
        }
      />

      <Snackbar
        open={Boolean(
          successMessage
        )}
        autoHideDuration={3500}
        onClose={() =>
          setSuccessMessage("")
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() =>
            setSuccessMessage("")
          }
          sx={{
            width: "100%",
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(
          errorMessage
        )}
        autoHideDuration={5000}
        onClose={() =>
          setErrorMessage("")
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() =>
            setErrorMessage("")
          }
          sx={{
            width: "100%",
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}


export default ExecutiveActions;