import { useMemo, useState } from "react";

import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";

import { useLanguage } from "../../context/LanguageContext";

import {
  translateDynamicExecutiveActionCategory,
  translateDynamicExecutiveActionOwner,
  translateDynamicExecutiveActionSource,
  translateDynamicExecutiveActionTitle,
  translateDynamicExecutiveText,
  translateDynamicKpiName,
} from "../../i18n/dynamicTranslations";

const STATUS_OPTIONS = [
  {
    value: "open",
    labelKey: "executiveActionTable.status.open",
    symbol: "○",
  },
  {
    value: "in_progress",
    labelKey: "executiveActionTable.status.inProgress",
    symbol: "◐",
  },
  {
    value: "completed",
    labelKey: "executiveActionTable.status.completed",
    symbol: "✓",
  },
  {
    value: "blocked",
    labelKey: "executiveActionTable.status.blocked",
    symbol: "⊘",
  },
];

const ACTION_ICON_CONFIG = {
  production: {
    Icon: ShowChartOutlinedIcon,
    backgroundColor: "#eff6ff",
    color: "#2563eb",
  },
  fleet: {
    Icon: LocalShippingOutlinedIcon,
    backgroundColor: "#f1f5f9",
    color: "#475569",
  },
  plant: {
    Icon: FactoryOutlinedIcon,
    backgroundColor: "#f0fdf4",
    color: "#15803d",
  },
  safety: {
    Icon: ShieldOutlinedIcon,
    backgroundColor: "#fff7ed",
    color: "#c2410c",
  },
  operations: {
    Icon: AssignmentTurnedInOutlinedIcon,
    backgroundColor: "#f1f5f9",
    color: "#475569",
  },
};

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getActionId(action) {
  return action?.id ?? action?.action_id;
}

function getActionTitle(action, t) {
  const rawTitle =
    action?.title ||
    action?.action_title ||
    action?.recommended_action ||
    action?.action ||
    t("executiveActionTable.untitledAction");

  return translateDynamicExecutiveActionTitle(
    rawTitle,
    t
  );
}

function getActionDescription(action, t) {
  const rawDescription =
    action?.description ||
    action?.action_description ||
    action?.recommendation ||
    "";

  if (!rawDescription) {
    return "";
  }

  const translatedAsActionTitle =
    translateDynamicExecutiveActionTitle(
      rawDescription,
      t
    );

  if (
    translatedAsActionTitle !==
    rawDescription
  ) {
    return translatedAsActionTitle;
  }

  return translateDynamicExecutiveText(
    rawDescription,
    t
  );
}

function getActionOwner(action, t) {
  const rawOwner =
    action?.owner ||
    action?.owner_name ||
    action?.assigned_to ||
    t("executiveActionTable.unassigned");

  return translateDynamicExecutiveActionOwner(
    rawOwner,
    t
  );
}

function getActionCategory(action, t) {
  const rawCategory =
    action?.category ||
    action?.action_category ||
    action?.kpi_name ||
    action?.kpi_label ||
    t("executiveActionTable.operations");

  return translateDynamicExecutiveActionCategory(
    rawCategory,
    t
  );
}

function getActionSource(action) {
  return normalizeValue(
    action?.source ||
      action?.action_source ||
      "manual"
  );
}


function getActionSourceLabel(action, t) {
  const rawSource =
    action?.source ||
    action?.action_source ||
    "manual";

  return translateDynamicExecutiveActionSource(
    rawSource,
    t
  );
}

function formatStatusLabel(status, t) {
  const normalizedStatus =
    normalizeValue(status);

  const statusMap = {
    open: "executiveActionTable.status.open",
    to_do: "executiveActionTable.status.open",
    todo: "executiveActionTable.status.open",
    in_progress:
      "executiveActionTable.status.inProgress",
    completed:
      "executiveActionTable.status.completed",
    complete:
      "executiveActionTable.status.completed",
    blocked:
      "executiveActionTable.status.blocked",
  };

  const translationKey =
    statusMap[normalizedStatus] ||
    "executiveActionTable.status.open";

  return t(translationKey);
}

function formatPriorityLabel(priority, t) {
  const normalizedPriority =
    normalizeValue(priority);

  const priorityMap = {
    critical:
      "executiveActionTable.priority.critical",
    high:
      "executiveActionTable.priority.high",
    medium:
      "executiveActionTable.priority.medium",
    low:
      "executiveActionTable.priority.low",
  };

  const translationKey =
    priorityMap[normalizedPriority] ||
    "executiveActionTable.priority.medium";

  return t(translationKey);
}

function formatDate(
  dateValue,
  language,
  t
) {
  if (!dateValue) {
    return t(
      "executiveActionTable.noDueDate"
    );
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    language === "MN"
      ? "mn-MN"
      : "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function isOverdue(action) {
  if (!action?.due_date) {
    return false;
  }

  const status = normalizeValue(
    action?.status
  );

  if (status === "completed") {
    return false;
  }

  const dueDate = new Date(
    action.due_date
  );

  if (
    Number.isNaN(
      dueDate.getTime()
    )
  ) {
    return false;
  }

  dueDate.setHours(
    23,
    59,
    59,
    999
  );

  return dueDate < new Date();
}

function getStatusStyles(status) {
  const normalizedStatus =
    normalizeValue(status);

  const styles = {
    open: {
      color: "#475569",
      backgroundColor: "#f1f5f9",
      borderColor: "#cbd5e1",
    },

    to_do: {
      color: "#475569",
      backgroundColor: "#f1f5f9",
      borderColor: "#cbd5e1",
    },

    todo: {
      color: "#475569",
      backgroundColor: "#f1f5f9",
      borderColor: "#cbd5e1",
    },

    in_progress: {
      color: "#1d4ed8",
      backgroundColor: "#eff6ff",
      borderColor: "#bfdbfe",
    },

    completed: {
      color: "#15803d",
      backgroundColor: "#f0fdf4",
      borderColor: "#bbf7d0",
    },

    complete: {
      color: "#15803d",
      backgroundColor: "#f0fdf4",
      borderColor: "#bbf7d0",
    },

    blocked: {
      color: "#b91c1c",
      backgroundColor: "#fef2f2",
      borderColor: "#fecaca",
    },
  };

  return (
    styles[normalizedStatus] ||
    styles.open
  );
}

function getPriorityStyles(priority) {
  const normalizedPriority =
    normalizeValue(priority);

  const styles = {
    critical: {
      color: "#991b1b",
      backgroundColor: "#fee2e2",
      borderColor: "#fecaca",
    },

    high: {
      color: "#c2410c",
      backgroundColor: "#fff7ed",
      borderColor: "#fed7aa",
    },

    medium: {
      color: "#a16207",
      backgroundColor: "#fefce8",
      borderColor: "#fde68a",
    },

    low: {
      color: "#166534",
      backgroundColor: "#f0fdf4",
      borderColor: "#bbf7d0",
    },
  };

  return (
    styles[normalizedPriority] ||
    styles.medium
  );
}

function StatusMenuButton({
  action,
  updating,
  onStatusChange,
}) {
  const { t } = useLanguage();

  const [
    anchorEl,
    setAnchorEl,
  ] = useState(null);

  const menuOpen =
    Boolean(anchorEl);

  const currentStatus =
    normalizeValue(
      action?.status || "open"
    );

  const statusStyles =
    getStatusStyles(
      currentStatus
    );

  const currentOption =
    STATUS_OPTIONS.find(
      (option) =>
        option.value ===
        currentStatus
    ) || STATUS_OPTIONS[0];

  const handleOpenMenu = (
    event
  ) => {
    event.stopPropagation();

    if (!updating) {
      setAnchorEl(
        event.currentTarget
      );
    }
  };

  const handleCloseMenu = (
    event
  ) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const handleSelectStatus = (
    event,
    newStatus
  ) => {
    event.stopPropagation();
    setAnchorEl(null);

    if (
      newStatus ===
        currentStatus ||
      updating
    ) {
      return;
    }

    onStatusChange?.(
      action,
      newStatus
    );
  };

  return (
    <>
      <Tooltip
        title={t(
          "executiveActionTable.changeStatus"
        )}
      >
        <Box
          component="button"
          type="button"
          onClick={
            handleOpenMenu
          }
          disabled={updating}
          aria-haspopup="menu"
          aria-expanded={
            menuOpen
              ? "true"
              : undefined
          }
          sx={{
            minWidth: 140,
            height: 36,
            px: 1.25,
            borderRadius: "10px",
            border: "1px solid",
            borderColor:
              statusStyles.borderColor,
            backgroundColor:
              statusStyles.backgroundColor,
            color:
              statusStyles.color,
            display: "inline-flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 0.75,
            cursor: updating
              ? "not-allowed"
              : "pointer",
            opacity: updating
              ? 0.7
              : 1,
            fontFamily: "inherit",
            transition:
              "all 0.2s ease",

            "&:hover": {
              transform: updating
                ? "none"
                : "translateY(-1px)",
              filter: updating
                ? "none"
                : "brightness(0.98)",
            },

            "&:focus-visible": {
              outline: `2px solid ${statusStyles.color}`,
              outlineOffset: 2,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              minWidth: 0,
            }}
          >
            {!updating && (
              <Typography
                component="span"
                sx={{
                  fontSize: 16,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {
                  currentOption.symbol
                }
              </Typography>
            )}

            <Typography
              component="span"
              sx={{
                fontSize: 12.5,
                fontWeight: 800,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {updating
                ? t(
                    "executiveActionTable.updating"
                  )
                : formatStatusLabel(
                    currentStatus,
                    t
                  )}
            </Typography>
          </Box>

          {updating ? (
            <CircularProgress
              size={15}
              thickness={5}
              sx={{
                color:
                  statusStyles.color,
              }}
            />
          ) : (
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 18,
              }}
            />
          )}
        </Box>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={
          handleCloseMenu
        }
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              minWidth: 200,
              borderRadius: "12px",
              border:
                "1px solid #e2e8f0",
              boxShadow:
                "0 16px 40px rgba(15, 23, 42, 0.14)",
              p: 0.75,
            },
          },
        }}
      >
        {STATUS_OPTIONS.map(
          (option) => {
            const optionStyles =
              getStatusStyles(
                option.value
              );

            const isSelected =
              option.value ===
              currentStatus;

            return (
              <MenuItem
                key={
                  option.value
                }
                selected={
                  isSelected
                }
                onClick={(
                  event
                ) =>
                  handleSelectStatus(
                    event,
                    option.value
                  )
                }
                sx={{
                  minHeight: 42,
                  borderRadius: "9px",
                  px: 1.25,
                  gap: 1.25,
                  color:
                    optionStyles.color,
                  fontSize: 13.5,
                  fontWeight:
                    isSelected
                      ? 800
                      : 700,

                  "&.Mui-selected": {
                    backgroundColor:
                      optionStyles.backgroundColor,
                  },

                  "&.Mui-selected:hover": {
                    backgroundColor:
                      optionStyles.backgroundColor,
                  },
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    width: 20,
                    fontSize: 17,
                    fontWeight: 900,
                    lineHeight: 1,
                    textAlign: "center",
                  }}
                >
                  {option.symbol}
                </Typography>

                <Box
                  sx={{
                    flex: 1,
                  }}
                >
                  {t(option.labelKey)}
                </Box>

                {isSelected && (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 15,
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </Typography>
                )}
              </MenuItem>
            );
          }
        )}
      </Menu>
    </>
  );
}


function getOperationalPerformanceLabel(value, t) {
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
    return t("production.productionPerformance");
  }

  if (["fleet", "fleet_performance"].includes(normalizedValue)) {
    return t("dynamicKpiNames.fleetPerformance");
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
    return t("dynamicKpiNames.plantPerformance");
  }

  if (
    ["safety", "safety_performance", "safety_score", "safety_incidents"].includes(
      normalizedValue
    )
  ) {
    return t("dynamicKpiNames.safetyPerformance");
  }

  if (["mine_health", "mine_health_score"].includes(normalizedValue)) {
    return t("dynamicKpiNames.mineHealth");
  }

  return "";
}


function getActionVisualCategory(action) {
  const categoryCandidates = [
    action?.kpi_key,
    action?.kpi_name,
    action?.kpi_label,
    action?.category,
    action?.action_category,
  ]
    .filter(Boolean)
    .map(normalizeValue);

  if (
    categoryCandidates.some((value) =>
      [
        "production",
        "production_performance",
        "ore",
        "ore_performance",
        "ore_production",
        "waste",
        "waste_movement",
        "waste_performance",
      ].includes(value)
    )
  ) {
    return "production";
  }

  if (
    categoryCandidates.some((value) =>
      ["fleet", "fleet_performance"].includes(value)
    )
  ) {
    return "fleet";
  }

  if (
    categoryCandidates.some((value) =>
      [
        "plant",
        "plant_performance",
        "recovery",
        "cu_recovery",
        "throughput",
        "throughput_performance",
      ].includes(value)
    )
  ) {
    return "plant";
  }

  if (
    categoryCandidates.some((value) =>
      ["safety", "safety_performance", "safety_score", "safety_incidents"].includes(
        value
      )
    )
  ) {
    return "safety";
  }

  return "operations";
}


function getCustomerFacingActionMetadata(action, t) {
  const sourceCandidates = [
    action?.kpi_name,
    action?.kpi_label,
    action?.kpi_key,
    action?.category,
    action?.action_category,
  ].filter(Boolean);

  for (const candidate of sourceCandidates) {
    const operationalLabel = getOperationalPerformanceLabel(candidate, t);

    if (operationalLabel) {
      return operationalLabel;
    }
  }

  const businessCategory = [
    action?.category,
    action?.action_category,
    action?.kpi_name,
    action?.kpi_label,
  ].find((value) => {
    const rawValue = String(value || "").trim();
    const normalizedValue = normalizeValue(rawValue);

    return rawValue &&
      !rawValue.includes("_") &&
      !rawValue.includes("-") &&
      !["manual", "ai", "system", "ai_recommended_actions"].includes(
        normalizedValue
      );
  });

  return businessCategory
    ? translateDynamicExecutiveActionCategory(businessCategory, t)
    : "";
}


function ActionMenuButton({
  action,
  disabled,
  onEdit,
  onDelete,
}) {
  const { t } = useLanguage();
  const [anchorEl, setAnchorEl] = useState(null);

  const closeMenu = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title={t("executiveActionTable.columns.actions")}>
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={(event) => setAnchorEl(event.currentTarget)}
            sx={{
              width: 34,
              height: 34,
              color: "#475569",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
            }}
          >
            <MoreHorizIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 160,
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            closeMenu();
            onEdit?.(action);
          }}
          sx={{ gap: 1, fontSize: 13.5 }}
        >
          <EditOutlinedIcon sx={{ fontSize: 18 }} />
          {t("executiveActionTable.editAction")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            onDelete?.(action);
          }}
          sx={{ gap: 1, color: "#b91c1c", fontSize: 13.5 }}
        >
          <DeleteIcon sx={{ fontSize: 18 }} />
          {t("executiveActionTable.deleteAction")}
        </MenuItem>
      </Menu>
    </>
  );
}

function LoadingRows({ compact = false }) {
  return Array.from({
    length: 5,
  }).map((_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton
          variant="rounded"
          height={20}
          width="75%"
        />

        <Skeleton
          variant="text"
          width="90%"
        />
      </TableCell>

      {!compact && (
        <TableCell>
          <Skeleton
            variant="rounded"
            width={90}
            height={28}
          />
        </TableCell>
      )}

      <TableCell>
        <Skeleton
          variant="rounded"
          width={76}
          height={28}
        />
      </TableCell>

      <TableCell>
        <Skeleton
          variant="text"
          width={100}
        />
      </TableCell>

      <TableCell>
        <Skeleton
          variant="text"
          width={90}
        />
      </TableCell>

      <TableCell>
        <Skeleton
          variant="rounded"
          width={140}
          height={36}
        />
      </TableCell>

      <TableCell align="right">
        <Skeleton
          variant="circular"
          width={34}
          height={34}
          sx={{
            display:
              "inline-block",
            mr: 1,
          }}
        />

        <Skeleton
          variant="circular"
          width={34}
          height={34}
          sx={{
            display:
              "inline-block",
          }}
        />
      </TableCell>
    </TableRow>
  ));
}

function EmptyState({ t, columnCount = 7 }) {
  return (
    <TableRow>
      <TableCell
        colSpan={columnCount}
        sx={{
          py: 9,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 58,
            height: 58,
            mx: "auto",
            mb: 2,
            borderRadius: "16px",
            backgroundColor:
              "#f1f5f9",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            fontSize: 28,
            fontWeight: 900,
          }}
        >
          ✓
        </Box>

        <Typography
          sx={{
            fontSize: 17,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          {t(
            "executiveActionTable.emptyTitle"
          )}
        </Typography>

        <Typography
          sx={{
            mt: 0.75,
            fontSize: 14,
            color: "#64748b",
          }}
        >
          {t(
            "executiveActionTable.emptyMessage"
          )}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

function ExecutiveActionTable({
  actions = [],
  loading = false,
  onEdit,
  onDelete,
  onStatusChange,
  updatingStatusId = null,
  compact = false,
  showFooter = true,
}) {
  const { language, t } =
    useLanguage();

  const tableHeadings = [
    {
      key: "action",
      label: compact
        ? language === "MN"
          ? "АРГА ХЭМЖЭЭ / ЭХ ҮҮСВЭР"
          : "ACTION / SOURCE"
        : t("executiveActionTable.columns.action"),
      align: "left",
    },
    !compact && {
      key: "category",
      label: t(
        "executiveActionTable.columns.category"
      ),
      align: "left",
    },
    {
      key: "priority",
      label: t(
        "executiveActionTable.columns.priority"
      ),
      align: "left",
    },
    {
      key: "owner",
      label: t(
        "executiveActionTable.columns.owner"
      ),
      align: "left",
    },
    {
      key: "dueDate",
      label: t(
        "executiveActionTable.columns.dueDate"
      ),
      align: "left",
    },
    {
      key: "status",
      label: t(
        "executiveActionTable.columns.status"
      ),
      align: "left",
    },
    {
      key: "actions",
      label: t(
        "executiveActionTable.columns.actions"
      ),
      align: "right",
    },
  ].filter(Boolean);

  const normalizedActions =
    useMemo(
      () =>
        Array.isArray(actions)
          ? actions
          : [],
      [actions]
    );

  return (
    <Paper
      elevation={0}
      sx={{
        mt: compact ? 0 : 2,
        overflow: "hidden",
        borderRadius: "16px",
        border:
          "1px solid #e2e8f0",
        backgroundColor:
          "#ffffff",
      }}
    >
      <TableContainer
        sx={{
          overflowX: "auto",
        }}
      >
        <Table
          sx={{
            minWidth: compact ? 900 : 1120,
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor:
                  "#f8fafc",
              }}
            >
              {tableHeadings.map(
                (heading) => (
                  <TableCell
                    key={heading.key}
                    align={heading.align}
                    sx={{
                      py: 1.75,
                      borderBottom:
                        "1px solid #e2e8f0",
                      color:
                        "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing:
                        "0.04em",
                      textTransform:
                        "uppercase",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {heading.label}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <LoadingRows compact={compact} />
            ) : normalizedActions.length ===
              0 ? (
              <EmptyState t={t} columnCount={tableHeadings.length} />
            ) : (
              normalizedActions.map(
                (
                  action,
                  index
                ) => {
                  const actionId =
                    getActionId(
                      action
                    );

                  const actionTitle =
                    getActionTitle(
                      action,
                      t
                    );

                  const actionDescription = compact
                    ? getCustomerFacingActionMetadata(action, t)
                    : getActionDescription(
                        action,
                        t
                      );

                  const priorityStyles =
                    getPriorityStyles(
                      action?.priority
                    );

                  const source =
                    getActionSource(
                      action
                    );

                  const sourceLabel =
                    getActionSourceLabel(
                      action,
                      t
                    );

                  const actionIconConfig =
                    ACTION_ICON_CONFIG[
                      getActionVisualCategory(action)
                    ] || ACTION_ICON_CONFIG.operations;

                  const ActionCategoryIcon =
                    actionIconConfig.Icon;

                  const overdue =
                    isOverdue(
                      action
                    );

                  const isUpdating =
                    String(
                      updatingStatusId
                    ) ===
                    String(
                      actionId
                    );

                  return (
                    <TableRow
                      key={
                        actionId ||
                        action?.action_key ||
                        `${actionTitle}-${index}`
                      }
                      hover
                      sx={{
                        "&:last-child td": {
                          borderBottom:
                            0,
                        },

                        "&:hover": {
                          backgroundColor:
                            "#fbfdff",
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          width: 360,
                          maxWidth: 360,
                          py: 2,
                          borderColor:
                            "#eef2f7",
                        }}
                      >
                        <Box
                          sx={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 1.25,
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              flexShrink: 0,
                              borderRadius:
                                "9px",
                              backgroundColor:
                                actionIconConfig.backgroundColor,
                              color:
                                actionIconConfig.color,
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              border:
                                "1px solid rgba(148, 163, 184, 0.2)",
                            }}
                          >
                            <ActionCategoryIcon
                              sx={{
                                fontSize: 17,
                              }}
                            />
                          </Box>

                          <Box
                            sx={{
                              minWidth: 0,
                            }}
                          >
                            <Box
                              sx={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                flexWrap:
                                  "wrap",
                                gap: 0.75,
                              }}
                            >
                              <Typography
                                sx={{
                                  color:
                                    "#0f172a",
                                  fontSize:
                                    14,
                                  fontWeight:
                                    compact
                                      ? 700
                                      : 800,
                                  lineHeight:
                                    1.4,
                                }}
                              >
                                {
                                  actionTitle
                                }
                              </Typography>

                              {(!compact || source === "ai") && (
                                <Chip
                                size="small"
                                label={
                                  source ===
                                  "ai"
                                    ? "AI"
                                    : sourceLabel
                                }
                                sx={{
                                  height: 21,
                                  borderRadius:
                                    "7px",
                                  color:
                                    source ===
                                    "ai"
                                      ? "#4338ca"
                                      : "#475569",
                                  backgroundColor:
                                    source ===
                                    "ai"
                                      ? "#eef2ff"
                                      : "#f1f5f9",
                                  fontSize:
                                    10.5,
                                  fontWeight:
                                    800,

                                  "& .MuiChip-label": {
                                    px: 0.85,
                                  },
                                }}
                                />
                              )}
                            </Box>

                            {actionDescription && (
                              <Typography
                                title={
                                  actionDescription
                                }
                                sx={{
                                  mt: 0.55,
                                  color:
                                    "#64748b",
                                  fontSize:
                                    12.5,
                                  lineHeight:
                                    1.5,
                                  display:
                                    "-webkit-box",
                                  WebkitLineClamp:
                                    2,
                                  WebkitBoxOrient:
                                    "vertical",
                                  overflow:
                                    "hidden",
                                }}
                              >
                                {
                                  actionDescription
                                }
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {!compact && (
                        <TableCell
                        sx={{
                          py: 2,
                          borderColor:
                            "#eef2f7",
                        }}
                      >
                        <Typography
                          sx={{
                            color:
                              "#334155",
                            fontSize:
                              13,
                            fontWeight:
                              700,
                          }}
                        >
                          {getActionCategory(
                            action,
                            t
                          )}
                        </Typography>

                        {action?.kpi_key && (
                          <Typography
                            sx={{
                              mt: 0.35,
                              color:
                                "#94a3b8",
                              fontSize:
                                11.5,
                            }}
                          >
                            {
                              translateDynamicKpiName(
                                action.kpi_key,
                                t
                              )
                            }
                          </Typography>
                        )}
                        </TableCell>
                      )}

                      <TableCell
                        sx={{
                          py: 2,
                          borderColor:
                            "#eef2f7",
                        }}
                      >
                        <Chip
                          size="small"
                          label={formatPriorityLabel(
                            action?.priority,
                            t
                          )}
                          variant="outlined"
                          sx={{
                            height: 28,
                            borderRadius:
                              "8px",
                            color:
                              priorityStyles.color,
                            borderColor:
                              priorityStyles.borderColor,
                            backgroundColor:
                              priorityStyles.backgroundColor,
                            fontSize:
                              11.5,
                            fontWeight:
                              800,

                            "& .MuiChip-label": {
                              px: 1.15,
                            },
                          }}
                        />
                      </TableCell>

                      <TableCell
                        sx={{
                          py: 2,
                          borderColor:
                            "#eef2f7",
                        }}
                      >
                        <Typography
                          sx={{
                            color:
                              "#334155",
                            fontSize:
                              13,
                            fontWeight:
                              700,
                          }}
                        >
                          {getActionOwner(
                            action,
                            t
                          )}
                        </Typography>
                      </TableCell>

                      <TableCell
                        sx={{
                          py: 2,
                          borderColor:
                            "#eef2f7",
                        }}
                      >
                        <Typography
                          sx={{
                            color:
                              overdue
                                ? "#b91c1c"
                                : "#334155",
                            fontSize:
                              13,
                            fontWeight:
                              overdue
                                ? 800
                                : 700,
                          }}
                        >
                          {formatDate(
                            action?.due_date,
                            language,
                            t
                          )}
                        </Typography>

                        {overdue && (
                          <Typography
                            sx={{
                              mt: 0.25,
                              color:
                                "#dc2626",
                              fontSize:
                                11.5,
                              fontWeight:
                                800,
                            }}
                          >
                            {t(
                              "executiveActionTable.overdue"
                            )}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          py: 2,
                          borderColor:
                            "#eef2f7",
                        }}
                      >
                        <StatusMenuButton
                          action={
                            action
                          }
                          updating={
                            isUpdating
                          }
                          onStatusChange={
                            onStatusChange
                          }
                        />
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          py: 2,
                          borderColor:
                            "#eef2f7",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        <ActionMenuButton
                          action={action}
                          disabled={isUpdating}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      </TableCell>
                    </TableRow>
                  );
                }
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {showFooter &&
        !loading &&
        normalizedActions.length >
          0 && (
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderTop:
                "1px solid #eef2f7",
              backgroundColor:
                "#fbfdff",
            }}
          >
            <Typography
              sx={{
                color: "#64748b",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              {String(
                normalizedActions.length === 1
                  ? t(
                      "executiveActionTable.showingSingle"
                    )
                  : t(
                      "executiveActionTable.showingPlural"
                    )
              ).replace(
                "{count}",
                String(
                  normalizedActions.length
                )
              )}
            </Typography>
          </Box>
        )}
    </Paper>
  );
}

export default ExecutiveActionTable;
