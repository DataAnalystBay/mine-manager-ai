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
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const STATUS_OPTIONS = [
  {
    value: "open",
    label: "Open",
    symbol: "○",
  },
  {
    value: "in_progress",
    label: "In Progress",
    symbol: "◐",
  },
  {
    value: "completed",
    label: "Completed",
    symbol: "✓",
  },
  {
    value: "blocked",
    label: "Blocked",
    symbol: "⊘",
  },
];

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

function getActionTitle(action) {
  return (
    action?.title ||
    action?.action_title ||
    action?.recommended_action ||
    action?.action ||
    "Untitled Executive Action"
  );
}

function getActionDescription(action) {
  return (
    action?.description ||
    action?.action_description ||
    action?.recommendation ||
    ""
  );
}

function getActionOwner(action) {
  return (
    action?.owner ||
    action?.owner_name ||
    action?.assigned_to ||
    "Unassigned"
  );
}

function getActionCategory(action) {
  return (
    action?.category ||
    action?.action_category ||
    action?.kpi_name ||
    action?.kpi_label ||
    "Operations"
  );
}

function getActionSource(action) {
  return normalizeValue(
    action?.source ||
      action?.action_source ||
      "manual"
  );
}

function formatStatusLabel(status) {
  const normalizedStatus =
    normalizeValue(status);

  const statusMap = {
    open: "Open",
    to_do: "Open",
    todo: "Open",
    in_progress: "In Progress",
    completed: "Completed",
    complete: "Completed",
    blocked: "Blocked",
  };

  return (
    statusMap[normalizedStatus] ||
    "Open"
  );
}

function formatPriorityLabel(priority) {
  const normalizedPriority =
    normalizeValue(priority);

  const priorityMap = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  return (
    priorityMap[normalizedPriority] ||
    "Medium"
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "No due date";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
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
      <Tooltip title="Change status">
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
                ? "Updating..."
                : formatStatusLabel(
                    currentStatus
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
                  {option.label}
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

function LoadingRows() {
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

      <TableCell>
        <Skeleton
          variant="rounded"
          width={90}
          height={28}
        />
      </TableCell>

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

function EmptyState() {
  return (
    <TableRow>
      <TableCell
        colSpan={7}
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
          No executive actions
          found
        </Typography>

        <Typography
          sx={{
            mt: 0.75,
            fontSize: 14,
            color: "#64748b",
          }}
        >
          Create a new action or
          adjust the filters to
          display existing actions.
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
}) {
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
        mt: 2,
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
            minWidth: 1120,
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor:
                  "#f8fafc",
              }}
            >
              {[
                "Action",
                "Category",
                "Priority",
                "Owner",
                "Due Date",
                "Status",
                "Actions",
              ].map(
                (heading) => (
                  <TableCell
                    key={heading}
                    align={
                      heading ===
                      "Actions"
                        ? "right"
                        : "left"
                    }
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
                    {heading}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <LoadingRows />
            ) : normalizedActions.length ===
              0 ? (
              <EmptyState />
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
                      action
                    );

                  const actionDescription =
                    getActionDescription(
                      action
                    );

                  const priorityStyles =
                    getPriorityStyles(
                      action?.priority
                    );

                  const source =
                    getActionSource(
                      action
                    );

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
                              "flex-start",
                            gap: 1.25,
                          }}
                        >
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              flexShrink: 0,
                              borderRadius:
                                "10px",
                              backgroundColor:
                                source ===
                                "ai"
                                  ? "#eef2ff"
                                  : "#f1f5f9",
                              color:
                                source ===
                                "ai"
                                  ? "#4f46e5"
                                  : "#475569",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              fontSize:
                                source ===
                                "ai"
                                  ? 11
                                  : 13,
                              fontWeight:
                                900,
                            }}
                          >
                            {source ===
                            "ai"
                              ? "AI"
                              : "M"}
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
                                    800,
                                  lineHeight:
                                    1.4,
                                }}
                              >
                                {
                                  actionTitle
                                }
                              </Typography>

                              <Chip
                                size="small"
                                label={
                                  source ===
                                  "ai"
                                    ? "AI"
                                    : "Manual"
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
                            action
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
                              action.kpi_key
                            }
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
                        <Chip
                          size="small"
                          label={formatPriorityLabel(
                            action?.priority
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
                            action
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
                            action?.due_date
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
                            Overdue
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
                        <Tooltip title="Edit action">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() =>
                                onEdit?.(
                                  action
                                )
                              }
                              disabled={
                                isUpdating
                              }
                              sx={{
                                width: 34,
                                height: 34,
                                mr: 0.75,
                                color:
                                  "#475569",
                                border:
                                  "1px solid #e2e8f0",
                                backgroundColor:
                                  "#ffffff",

                                "&:hover": {
                                  color:
                                    "#1d4ed8",
                                  borderColor:
                                    "#bfdbfe",
                                  backgroundColor:
                                    "#eff6ff",
                                },
                              }}
                            >
                              <EditOutlinedIcon
                                sx={{
                                  fontSize:
                                    18,
                                }}
                              />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Delete action">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() =>
                                onDelete?.(
                                  action
                                )
                              }
                              disabled={
                                isUpdating
                              }
                              sx={{
                                width: 34,
                                height: 34,
                                color:
                                  "#64748b",
                                border:
                                  "1px solid #e2e8f0",
                                backgroundColor:
                                  "#ffffff",

                                "&:hover": {
                                  color:
                                    "#dc2626",
                                  borderColor:
                                    "#fecaca",
                                  backgroundColor:
                                    "#fef2f2",
                                },
                              }}
                            >
                              <DeleteIcon
                                sx={{
                                  fontSize:
                                    18,
                                }}
                              />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                }
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading &&
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
              Showing{" "}
              {
                normalizedActions.length
              }{" "}
              executive{" "}
              {normalizedActions.length ===
              1
                ? "action"
                : "actions"}
            </Typography>
          </Box>
        )}
    </Paper>
  );
}

export default ExecutiveActionTable;