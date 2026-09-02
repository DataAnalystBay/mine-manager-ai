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
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BoltIcon from "@mui/icons-material/Bolt";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import ExecutiveActionSummary from "../components/executive/ExecutiveActionSummary";
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

import { useConfig } from "../context/ConfigContext";
import { useLanguage } from "../context/LanguageContext";
import useAuth from "../hooks/useAuth";

import "./ExecutiveActions.css";


function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}


function getKpiReturnRoute(kpiKey) {
  const normalizedKey =
    normalizeValue(kpiKey);

  if (normalizedKey === "mine_health") {
    return "/?kpi_key=mine_health";
  }

  if (
    [
      "ore",
      "ore_performance",
      "waste",
      "waste_movement",
      "production",
      "production_performance",
    ].includes(normalizedKey)
  ) {
    return "/production";
  }

  if (
    [
      "fleet",
      "fleet_performance",
    ].includes(normalizedKey)
  ) {
    return "/fleet";
  }

  if (
    [
      "plant",
      "plant_performance",
      "recovery",
      "cu_recovery",
      "throughput",
      "throughput_performance",
    ].includes(normalizedKey)
  ) {
    return "/plant";
  }

  if (
    [
      "safety",
      "safety_score",
      "safety_incidents",
    ].includes(normalizedKey)
  ) {
    return "/safety";
  }

  return "/";
}


function isMongolianLanguage(t) {
  return t("common.language") === "Хэл";
}


function localizeLabel(t, english, mongolian) {
  return isMongolianLanguage(t)
    ? mongolian
    : english;
}


function formatStatusLabel(status, t) {
  const normalizedStatus =
    normalizeValue(status);

  const statusLabels = isMongolianLanguage(t)
    ? {
        open: "Нээлттэй",
        to_do: "Хийх",
        todo: "Хийх",
        in_progress: "Хэрэгжиж байна",
        blocked: "Саатсан",
        completed: "Дууссан",
        complete: "Дууссан",
      }
    : {
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
    localizeLabel(t, "Open", "Нээлттэй")
  );
}


function formatSpecialFilterLabel(filterKey, t) {
  const labels = isMongolianLanguage(t)
    ? {
        due_today: "Өнөөдөр хугацаатай",
        overdue: "Хугацаа хэтэрсэн",
        due_soon: "Удахгүй хугацаатай",
        my_actions: "Миний арга хэмжээ",
        high_priority: "Өндөр ач холбогдолтой",
        completed_this_month:
          "Энэ сард дууссан",
      }
    : {
        due_today: "Due Today",
        overdue: "Overdue",
        due_soon: "Due Soon",
        my_actions: "My Actions",
        high_priority: "High Priority",
        completed_this_month:
          "Completed This Month",
      };

  return labels[filterKey] || "";
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


function isCompletedAction(action) {
  return ["completed", "complete"].includes(
    normalizeValue(action?.status)
  );
}


function isActiveAction(action) {
  return !isCompletedAction(action);
}


function isOverdueAction(action) {
  const dueDate = parseDateOnly(action?.due_date);

  return Boolean(dueDate) &&
    dueDate < getStartOfToday() &&
    isActiveAction(action);
}


function isDueSoonAction(action) {
  const dueDate = parseDateOnly(action?.due_date);

  if (!dueDate || !isActiveAction(action)) {
    return false;
  }

  const start = getStartOfToday();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  return dueDate >= start && dueDate <= end;
}


function getActionCategoryLabel(action) {
  return (
    action?.kpi_name ||
    action?.kpi_label ||
    action?.category ||
    action?.action_category ||
    action?.kpi_key ||
    ""
  );
}


function getOperationalCategoryLabel(value) {
  const normalizedValue = normalizeValue(value);

  if (
    [
      "production",
      "production_performance",
      "ore",
      "ore_performance",
      "ore_production",
      "waste",
      "waste_movement",
      "waste_performance",
    ].includes(normalizedValue)
  ) {
    return "production";
  }

  if (["fleet", "fleet_performance"].includes(normalizedValue)) {
    return "fleet";
  }

  if (
    [
      "plant",
      "plant_performance",
      "recovery",
      "cu_recovery",
      "throughput",
      "throughput_performance",
    ].includes(normalizedValue)
  ) {
    return "plant";
  }

  if (
    ["safety", "safety_performance", "safety_score", "safety_incidents"].includes(
      normalizedValue
    )
  ) {
    return "safety";
  }

  if (["mine_health", "mine_health_score"].includes(normalizedValue)) {
    return "mine_health";
  }

  return "";
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

  const { t } =
    useLanguage();

  const { user } =
    useAuth();

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


  const activeActionId =
    searchParams.get(
      "action_id"
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
    const timeoutId = window.setTimeout(
      () => {
        setFilters(
          (currentFilters) => ({
            ...currentFilters,
            kpiKey:
              activeKpiKey,
          })
        );
      },
      0
    );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
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

  const [workspaceTab, setWorkspaceTab] =
    useState("all");

  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const [analyticsOpen, setAnalyticsOpen] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  const pageSize = 8;


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

  const currentUserOwners =
    useMemo(
      () =>
        [
          user?.full_name,
          user?.name,
          user?.email,
          user?.username,
        ]
          .filter(Boolean)
          .map((value) =>
            String(value).trim().toLowerCase()
          ),
      [user]
    );


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
            "due_soon"
          ) {
            matchesSpecial =
              isDueSoonAction(action);
          }

          if (
            filters.special ===
            "my_actions"
          ) {
            matchesSpecial =
              currentUserOwners.includes(
                String(getActionOwner(action))
                  .trim()
                  .toLowerCase()
              );
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
    }, [
      actions,
      currentUserOwners,
      filters,
    ]);

  const executionMetrics =
    useMemo(() => {
      const active = actions.filter(isActiveAction).length;
      const overdue = actions.filter(isOverdueAction).length;
      const dueSoon = actions.filter(isDueSoonAction).length;
      const completed = actions.filter(isCompletedAction).length;
      const highPriority = actions.filter(
        (action) =>
          ["high", "critical"].includes(
            normalizeValue(action?.priority)
          ) && isActiveAction(action)
      ).length;

      const categoryCounts = actions.reduce(
        (counts, action) => {
          if (!isActiveAction(action)) {
            return counts;
          }

          const category = getActionCategoryLabel(action);

          if (category) {
            counts[category] = (counts[category] || 0) + 1;
          }

          return counts;
        },
        {}
      );

      const dominantCategory = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "";

      return {
        active,
        overdue,
        dueSoon,
        completed,
        highPriority,
        dominantCategory,
        completion: actions.length
          ? Math.round((completed / actions.length) * 100)
          : 0,
      };
    }, [actions]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredActions.length / pageSize)
  );

  const paginatedActions = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;

    return filteredActions.slice(start, start + pageSize);
  }, [currentPage, filteredActions, totalPages]);

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
            localizeLabel(t, "Failed to load the executive action summary.", "Арга хэмжээний хураангуйг ачаалж чадсангүй.")
          )
        );
      } finally {
        setSummaryLoading(
          false
        );
      }
    }, [t]);


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
            localizeLabel(t, "Failed to load executive actions.", "Арга хэмжээнүүдийг ачаалж чадсангүй.")
          )
        );

        setActions([]);
      } finally {
        setActionsLoading(
          false
        );
      }
    }, [activeKpiKey, t]);


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
    const timeoutId = window.setTimeout(
      refreshExecutiveActions,
      0
    );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    refreshExecutiveActions,
  ]);


  useEffect(
    () => {
      if (
        !activeActionId ||
        actionsLoading ||
        !actions.length
      ) {
        return;
      }

      const matchedAction =
        actions.find(
          (
            action
          ) =>
            String(
              action?.id ||
              action?.action_id ||
              ""
            ) ===
            String(
              activeActionId
            )
        );

      if (
        !matchedAction
      ) {
        return;
      }

      const timeoutId =
        window.setTimeout(
          () => {
            setSelectedAction(
              matchedAction
            );

            setDialogOpen(
              true
            );
          },
          0
        );

      return () => {
        window.clearTimeout(
          timeoutId
        );
      };
    },
    [
      activeActionId,
      actions,
      actionsLoading,
    ]
  );


  const handleFilterChange = (
    nextFilters
  ) => {
    setCurrentPage(1);

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
      setCurrentPage(1);
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
      setWorkspaceTab("all");
    };


  const handleWorkspaceTabChange = (tabKey) => {
    setCurrentPage(1);
    setWorkspaceTab(tabKey);

    setFilters((currentFilters) => ({
      ...currentFilters,
      status: tabKey === "completed" ? "completed" : "",
      special:
        tabKey === "my_actions"
          ? "my_actions"
          : tabKey === "overdue"
            ? "overdue"
            : tabKey === "due_soon"
              ? "due_soon"
              : "",
      firstDayOfMonth: "",
    }));
  };


  const handleReviewPriorities = () => {
    setCurrentPage(1);
    setWorkspaceTab(executionMetrics.overdue ? "overdue" : "all");
    setFilters((currentFilters) => ({
      ...currentFilters,
      status: "",
      priority: "",
      special: executionMetrics.overdue
        ? "overdue"
        : "high_priority",
      firstDayOfMonth: "",
    }));

    window.requestAnimationFrame(() => {
      document
        .getElementById("executive-actions-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };




  const handleBackToKpiSource =
    () => {
      if (activeKpiKey) {
        navigate(
          getKpiReturnRoute(
            activeKpiKey
          )
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
    useCallback(
      () => {
        if (
          savingAction
        ) {
          return;
        }

        setDialogOpen(
          false
        );

        setSelectedAction(
          null
        );

        if (
          !activeActionId
        ) {
          return;
        }

        const nextParams =
          new URLSearchParams(
            searchParams
          );

        nextParams.delete(
          "action_id"
        );

        setSearchParams(
          nextParams,
          {
            replace: true,
          }
        );
      },
      [
        savingAction,
        activeActionId,
        searchParams,
        setSearchParams,
      ]
    );


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
            localizeLabel(t, "Executive action updated successfully.", "Арга хэмжээ амжилттай шинэчлэгдлээ.")
          );
        } else {
          await createExecutiveAction({
            ...payload,
            source: "Manual",
          });

          setSuccessMessage(
            localizeLabel(t, "Executive action created successfully.", "Арга хэмжээ амжилттай үүслээ.")
          );
        }

        setDialogOpen(false);
        setSelectedAction(null);

        if (
          activeActionId
        ) {
          const nextParams =
            new URLSearchParams(
              searchParams
            );

          nextParams.delete(
            "action_id"
          );

          setSearchParams(
            nextParams,
            {
              replace: true,
            }
          );
        }

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
              ? localizeLabel(t, "Failed to update the executive action.", "Арга хэмжээг шинэчилж чадсангүй.")
              : localizeLabel(t, "Failed to create the executive action.", "Арга хэмжээг үүсгэж чадсангүй.")
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
          localizeLabel(t, "This action does not have a valid database ID.", "Энэ арга хэмжээнд хүчинтэй өгөгдлийн сангийн ID алга.")
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
            localizeLabel(t, "Failed to update the action status.", "Арга хэмжээний төлөвийг шинэчилж чадсангүй.")
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
          localizeLabel(t, "This action does not have a valid database ID.", "Энэ арга хэмжээнд хүчинтэй өгөгдлийн сангийн ID алга.")
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
          localizeLabel(t, "Executive action deleted successfully.", "Арга хэмжээ амжилттай устгагдлаа.")
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
            localizeLabel(t, "Failed to delete the executive action.", "Арга хэмжээг устгаж чадсангүй.")
          )
        );
      } finally {
        setDeletingAction(false);
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
          filters.special,
          t
        )
      : filters.status
        ? formatStatusLabel(
            filters.status,
            t
          )
        : "";


  const dominantOperationalCategory =
    getOperationalCategoryLabel(executionMetrics.dominantCategory);

  const dominantCategoryLabel = {
    production: localizeLabel(t, "Production", "Үйлдвэрлэл"),
    fleet: localizeLabel(t, "Fleet", "Техникийн парк"),
    plant: localizeLabel(t, "Plant", "Баяжуулах үйлдвэр"),
    safety: localizeLabel(t, "Safety", "Аюулгүй ажиллагаа"),
    mine_health: localizeLabel(t, "Mine Health", "Уурхайн төлөв"),
  }[dominantOperationalCategory];

  const insightText = dominantCategoryLabel
    ? localizeLabel(
        t,
        `${dominantCategoryLabel}-related actions represent the highest current execution risk. ${executionMetrics.highPriority} high-priority actions require management follow-up.`,
        `${dominantCategoryLabel}-тай холбоотой арга хэмжээнүүд хэрэгжилтийн хамгийн өндөр эрсдэлтэй байна. ${executionMetrics.highPriority} өндөр ач холбогдолтой арга хэмжээнд удирдлагын хяналт шаардлагатай.`
      )
    : localizeLabel(
        t,
        `High-priority actions represent the highest current execution risk. ${executionMetrics.highPriority} high-priority actions require management follow-up.`,
        `Өндөр ач холбогдолтой арга хэмжээнүүд хэрэгжилтийн хамгийн өндөр эрсдэлтэй байна. ${executionMetrics.highPriority} өндөр ач холбогдолтой арга хэмжээнд удирдлагын хяналт шаардлагатай.`
      );

  const insightHeadline = executionMetrics.highPriority > 0
    ? localizeLabel(
        t,
        "Execution risk concentrated in high-priority actions",
        "Хэрэгжилтийн эрсдэл өндөр ач холбогдолтой арга хэмжээнд төвлөрч байна"
      )
    : executionMetrics.overdue > 0
      ? localizeLabel(
          t,
          "Overdue actions require management attention",
          "Хугацаа хэтэрсэн арга хэмжээнд удирдлагын анхаарал шаардлагатай"
        )
      : localizeLabel(
          t,
          "Current actions remain under management review",
          "Одоогийн арга хэмжээнүүд удирдлагын хяналтад байна"
        );

  const workspaceTabs = [
    { key: "all", label: localizeLabel(t, "All", "Бүгд"), count: actions.length },
    { key: "my_actions", label: localizeLabel(t, "My Actions", "Миний арга хэмжээ") },
    { key: "overdue", label: localizeLabel(t, "Overdue", "Хугацаа хэтэрсэн"), count: executionMetrics.overdue, tone: "danger" },
    { key: "due_soon", label: localizeLabel(t, "Due Soon", "Удахгүй хугацаатай"), count: executionMetrics.dueSoon, tone: "warning" },
    { key: "completed", label: localizeLabel(t, "Completed", "Дууссан"), count: executionMetrics.completed },
  ];

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const rangeStart = filteredActions.length
    ? (safeCurrentPage - 1) * pageSize + 1
    : 0;
  const rangeEnd = Math.min(safeCurrentPage * pageSize, filteredActions.length);

  return (
    <Box className="executive-actions-page">
      <header className="executive-actions-page__header">
        <div>
          <Typography component="h1" className="executive-actions-page__title">
            {localizeLabel(t, "Executive Action Center", "Гүйцэтгэх удирдлагын арга хэмжээ")}
          </Typography>
          <Typography className="executive-actions-page__subtitle">
            {localizeLabel(t, "Turn operational insights into accountable execution.", "Үйл ажиллагааны дүгнэлтийг хариуцлагатай хэрэгжилт болгоно.")}
          </Typography>
          <Typography className="executive-actions-page__context">
            {company?.company_name || localizeLabel(t, "Mine Manager AI", "Mine Manager AI")} · {localizeLabel(t, "All Operations", "Бүх үйл ажиллагаа")}
          </Typography>
        </div>

        <div className="executive-actions-page__header-actions">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshExecutiveActions}
            disabled={isRefreshing}
            className="executive-actions-page__refresh"
          >
            {isRefreshing
              ? localizeLabel(t, "Refreshing...", "Шинэчилж байна...")
              : localizeLabel(t, "Refresh", "Шинэчлэх")}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateAction}
            disabled={savingAction}
            className="executive-actions-page__new-action"
          >
            {localizeLabel(t, "New Action", "Шинэ арга хэмжээ")}
          </Button>
        </div>
      </header>

      {activeKpiKey && (
        <ExecutiveActionKpiContext
          kpiKey={activeKpiKey}
          actions={filteredActions}
          primaryColor={primaryColor}
          onBack={handleBackToKpiSource}
          onClear={handleClearKpiFilter}
        />
      )}

      <section className="execution-health" aria-labelledby="execution-health-title">
        <Typography component="h2" id="execution-health-title" className="executive-actions-page__section-title">
          {localizeLabel(t, "Execution Health", "Хэрэгжилтийн төлөв")}
        </Typography>
        <div className="execution-health__grid">
          {[
            { key: "active", label: localizeLabel(t, "Active", "Идэвхтэй"), value: executionMetrics.active, detail: localizeLabel(t, "Active actions", "Идэвхтэй арга хэмжээ"), tone: "blue", icon: <AssignmentTurnedInOutlinedIcon /> },
            { key: "overdue", label: localizeLabel(t, "Overdue", "Хугацаа хэтэрсэн"), value: executionMetrics.overdue, detail: localizeLabel(t, "Needs attention", "Анхаарал шаардлагатай"), tone: "red", icon: <AccessTimeOutlinedIcon /> },
            { key: "due-soon", label: localizeLabel(t, "Due Soon", "Удахгүй хугацаатай"), value: executionMetrics.dueSoon, detail: localizeLabel(t, "Next 7 days", "Дараагийн 7 хоног"), tone: "orange", icon: <CalendarMonthOutlinedIcon /> },
            { key: "completion", label: localizeLabel(t, "Completion", "Гүйцэтгэл"), value: `${executionMetrics.completion}%`, detail: localizeLabel(t, "Overall", "Нийт"), tone: "green" },
          ].map((metric) => (
            <article key={metric.key} className={`execution-health__card execution-health__card--${metric.tone}`}>
              <div>
                <span className="execution-health__label">{metric.label}</span>
                <strong className="execution-health__value">{metric.value}</strong>
                <span className="execution-health__detail">{metric.detail}</span>
              </div>
              {metric.icon && (
                <span className="execution-health__icon" aria-hidden="true">
                  {metric.icon}
                </span>
              )}
              {metric.key === "completion" && (
                <div className="execution-health__progress" style={{ "--completion": `${executionMetrics.completion * 3.6}deg` }} aria-hidden="true">
                  <span>{executionMetrics.completion}%</span>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="management-attention-section" aria-labelledby="management-attention-title">
        <Typography component="h2" id="management-attention-title" className="executive-actions-page__section-title">
          {localizeLabel(t, "Management Attention", "Удирдлагын анхаарал")}
        </Typography>
        <div className="management-attention">
          <div className="management-attention__metric management-attention__metric--danger">
            <WarningAmberIcon />
            <div><strong>{executionMetrics.overdue}</strong><span>{localizeLabel(t, "Overdue Actions", "Хугацаа хэтэрсэн")}</span></div>
          </div>
          <div className="management-attention__metric management-attention__metric--warning">
            <BoltIcon />
            <div><strong>{executionMetrics.highPriority}</strong><span>{localizeLabel(t, "High-Priority Actions", "Өндөр ач холбогдолтой")}</span></div>
          </div>
          <div className="management-attention__ai">
            <AutoAwesomeOutlinedIcon />
            <div>
              <Typography component="h3">{localizeLabel(t, "AI Executive Insight", "AI удирдлагын дүгнэлт")}</Typography>
              <strong className="management-attention__ai-headline">{insightHeadline}</strong>
              <p>{insightText}</p>
              <button type="button" onClick={handleReviewPriorities}>{localizeLabel(t, "Review priorities", "Тэргүүлэх чиглэлийг хянах")} →</button>
            </div>
          </div>
        </div>
      </section>

      <section id="executive-actions-workspace" className="executive-actions-workspace">
        <div className="executive-actions-workspace__heading">
          <Typography component="h2" className="executive-actions-page__section-title">
            {localizeLabel(t, "Executive Actions", "Гүйцэтгэх арга хэмжээнүүд")}
          </Typography>
          {activeSummaryLabel && (
            <Chip
              size="small"
              label={`${localizeLabel(t, "Filtered", "Шүүлтүүр")}: ${activeSummaryLabel}`}
              onDelete={handleRemoveSummaryFilter}
            />
          )}
        </div>

        <div className="executive-actions-toolbar">
          <div className="executive-actions-tabs" role="tablist" aria-label={localizeLabel(t, "Action filters", "Арга хэмжээний шүүлтүүр")}>
            {workspaceTabs.map((tab) => (
              <button
                type="button"
                role="tab"
                aria-selected={workspaceTab === tab.key}
                key={tab.key}
                className={workspaceTab === tab.key ? "is-active" : ""}
                onClick={() => handleWorkspaceTabChange(tab.key)}
              >
                {tab.label}
                {tab.count !== undefined && <span className={tab.tone ? `is-${tab.tone}` : ""}>{tab.count}</span>}
              </button>
            ))}
          </div>

          <div className="executive-actions-toolbar__tools">
            <div className="executive-actions-search">
              <SearchIcon />
              <input
                type="search"
                value={filters.search}
                placeholder={localizeLabel(t, "Search actions...", "Арга хэмжээ хайх...")}
                onChange={(event) => handleFilterChange({ search: event.target.value })}
              />
            </div>
            <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setFiltersOpen((open) => !open)} className={filtersOpen ? "is-active" : ""}>
              {localizeLabel(t, "Filters", "Шүүлтүүр")}
            </Button>
          </div>
        </div>

        {filtersOpen && (
          <div className="executive-actions-filter-panel">
            <Select size="small" value={filters.status} displayEmpty onChange={(event) => handleFilterChange({ status: event.target.value, special: "" })}>
              <MenuItem value="">{localizeLabel(t, "All statuses", "Бүх төлөв")}</MenuItem>
              <MenuItem value="open">{localizeLabel(t, "Open", "Нээлттэй")}</MenuItem>
              <MenuItem value="in_progress">{localizeLabel(t, "In Progress", "Хэрэгжиж байна")}</MenuItem>
              <MenuItem value="blocked">{localizeLabel(t, "Blocked", "Саатсан")}</MenuItem>
              <MenuItem value="completed">{localizeLabel(t, "Completed", "Дууссан")}</MenuItem>
            </Select>
            <Select size="small" value={filters.priority} displayEmpty onChange={(event) => handleFilterChange({ priority: event.target.value })}>
              <MenuItem value="">{localizeLabel(t, "All priorities", "Бүх ач холбогдол")}</MenuItem>
              <MenuItem value="critical">{localizeLabel(t, "Critical", "Нэн чухал")}</MenuItem>
              <MenuItem value="high">{localizeLabel(t, "High", "Өндөр")}</MenuItem>
              <MenuItem value="medium">{localizeLabel(t, "Medium", "Дунд")}</MenuItem>
              <MenuItem value="low">{localizeLabel(t, "Low", "Бага")}</MenuItem>
            </Select>
            <Select size="small" value={filters.owner} displayEmpty onChange={(event) => handleFilterChange({ owner: event.target.value })}>
              <MenuItem value="">{localizeLabel(t, "All owners", "Бүх хариуцагч")}</MenuItem>
              {ownerOptions.map((owner) => <MenuItem key={owner} value={owner}>{owner}</MenuItem>)}
            </Select>
            <Button onClick={handleClearFilters}>{localizeLabel(t, "Clear filters", "Шүүлтүүр цэвэрлэх")}</Button>
          </div>
        )}

        <div className="executive-actions-table-wrap">
          <ExecutiveActionTable
            actions={paginatedActions}
            loading={actionsLoading}
            onEdit={handleEditAction}
            onDelete={handleDeleteAction}
            onStatusChange={handleQuickStatusChange}
            updatingStatusId={updatingStatusId}
            compact
            showFooter={false}
          />
        </div>

        <footer className="executive-actions-workspace__footer">
          <span>{localizeLabel(t, "Showing", "Харуулж байна")} {rangeStart}–{rangeEnd} {localizeLabel(t, "of", "нийт")} {filteredActions.length}</span>
          <div>
            <IconButton size="small" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} aria-label={localizeLabel(t, "Previous page", "Өмнөх хуудас")}><ChevronLeftIcon /></IconButton>
            <span>{safeCurrentPage} / {totalPages}</span>
            <IconButton size="small" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} aria-label={localizeLabel(t, "Next page", "Дараагийн хуудас")}><ChevronRightIcon /></IconButton>
          </div>
        </footer>
      </section>

      <section className={`action-analytics ${analyticsOpen ? "is-open" : ""}`}>
        <button type="button" className="action-analytics__header" onClick={() => setAnalyticsOpen((open) => !open)} aria-expanded={analyticsOpen}>
          <span>
            <strong>{localizeLabel(t, "Action Analytics & Distribution", "Арга хэмжээний шинжилгээ ба хуваарилалт")}</strong>
            <small>{localizeLabel(t, "Priority • Status • Owners • KPI categories • Response time", "Ач холбогдол • Төлөв • Хариуцагч • KPI ангилал • Хариу өгөх хугацаа")}</small>
          </span>
          <KeyboardArrowDownIcon />
        </button>
        {analyticsOpen && (
          <div className="action-analytics__content">
            <ExecutiveActionSummary
              summary={summary}
              loading={summaryLoading}
              primaryColor={primaryColor}
              onCardClick={handleSummaryFilter}
              activeFilter={activeSummaryFilter}
            />
            <ExecutiveActionAnalytics key={analyticsRefreshKey} />
          </div>
        )}
      </section>

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
