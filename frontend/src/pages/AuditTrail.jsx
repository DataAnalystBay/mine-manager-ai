import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import HistoryIcon from "@mui/icons-material/History";

import { getAuditLogs } from "../api/auditLogApi";
import AuditFilterBar from "../components/audit/AuditFilterBar";

import "./AuditTrail.css";


const DEFAULT_PAGE_SIZE = 20;

const INITIAL_FILTERS = {
  search: "",
  action: "",
  actorEmail: "",
  entityType: "",
  status: "",
  startDate: "",
  endDate: "",
};


function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}


function formatLabel(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}


function getActionChipColor(action) {
  const normalized = String(action || "")
    .trim()
    .toUpperCase();

  if (normalized.includes("CREATE")) {
    return "success";
  }

  if (
    normalized.includes("DEACTIVATE") ||
    normalized.includes("DELETE")
  ) {
    return "error";
  }

  if (
    normalized.includes("RESET") ||
    normalized.includes("UPDATE")
  ) {
    return "warning";
  }

  if (normalized.includes("ACTIVATE")) {
    return "info";
  }

  return "default";
}


function getStatusChipColor(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();

  if (normalized === "SUCCESS") {
    return "success";
  }

  if (normalized === "FAILED") {
    return "error";
  }

  return "default";
}


function toStartDateTime(value) {
  if (!value) {
    return "";
  }

  return `${value}T00:00:00`;
}


function toEndDateTime(value) {
  if (!value) {
    return "";
  }

  return `${value}T23:59:59`;
}


function AuditTrail() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] =
    useState(DEFAULT_PAGE_SIZE);

  const [filters, setFilters] =
    useState(INITIAL_FILTERS);

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(
        filters.search.trim()
      );
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters.search]);


  const apiFilters = useMemo(
    () => ({
      page: page + 1,
      pageSize,
      search: debouncedSearch,
      action: filters.action,
      actorEmail: filters.actorEmail,
      entityType: filters.entityType,
      status: filters.status,
      startDate: toStartDateTime(
        filters.startDate
      ),
      endDate: toEndDateTime(
        filters.endDate
      ),
    }),
    [
      page,
      pageSize,
      debouncedSearch,
      filters.action,
      filters.actorEmail,
      filters.entityType,
      filters.status,
      filters.startDate,
      filters.endDate,
    ]
  );


  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAuditLogs(
        apiFilters
      );

      setItems(
        Array.isArray(response?.items)
          ? response.items
          : []
      );

      setTotal(
        Number(response?.total) || 0
      );
    } catch (requestError) {
      setItems([]);
      setTotal(0);

      setError(
        requestError?.userMessage ||
          requestError?.message ||
          "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }, [apiFilters]);


  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);


  const handleFilterChange = (
    field,
    value
  ) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));

    setPage(0);
  };


  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setDebouncedSearch("");
    setPage(0);
  };


  const handlePageChange = (
    _event,
    nextPage
  ) => {
    setPage(nextPage);
  };


  const handleRowsPerPageChange = (
    event
  ) => {
    const nextPageSize = Number(
      event.target.value
    );

    setPageSize(nextPageSize);
    setPage(0);
  };


  return (
    <Box className="audit-trail-page">
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          md: "center",
        }}
        spacing={2}
        className="audit-trail-header"
      >
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
          >
            <Box className="audit-trail-title-icon">
              <HistoryIcon />
            </Box>

            <Typography
              variant="h4"
              component="h1"
              className="audit-trail-title"
            >
              Audit Trail
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            className="audit-trail-subtitle"
          >
            Review administrator activity,
            account changes, and system events.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadAuditLogs}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>


      {error && (
        <Alert
          severity="error"
          className="audit-trail-alert"
        >
          {error}
        </Alert>
      )}


      <Paper
        elevation={0}
        className="audit-trail-card"
      >
        <Box className="audit-trail-card-header">
          <Box>
            <Typography
              variant="h6"
              className="audit-trail-card-title"
            >
              Activity Records
            </Typography>

            <Typography
              variant="body2"
              className="audit-trail-record-count"
            >
              {total} record
              {total === 1 ? "" : "s"}
            </Typography>
          </Box>
        </Box>


        <AuditFilterBar
          filters={filters}
          onFilterChange={
            handleFilterChange
          }
          onClearFilters={
            handleClearFilters
          }
          disabled={loading}
        />


        <TableContainer>
          <Table
            sx={{ minWidth: 1050 }}
            aria-label="Audit trail records"
          >
            <TableHead>
              <TableRow>
                <TableCell>
                  Date and Time
                </TableCell>

                <TableCell>
                  Actor
                </TableCell>

                <TableCell>
                  Action
                </TableCell>

                <TableCell>
                  Entity
                </TableCell>

                <TableCell>
                  Description
                </TableCell>

                <TableCell>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                  >
                    <Box className="audit-trail-loading">
                      <CircularProgress size={30} />

                      <Typography variant="body2">
                        Loading audit records...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                  >
                    <Box className="audit-trail-empty">
                      <HistoryIcon />

                      <Typography variant="h6">
                        No audit records found
                      </Typography>

                      <Typography variant="body2">
                        Try changing or clearing
                        the current filters.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                  >
                    <TableCell className="audit-date-cell">
                      {formatDateTime(
                        item.created_at
                      )}
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography
                          variant="body2"
                          className="audit-actor-name"
                        >
                          {item.actor_name ||
                            "System"}
                        </Typography>

                        <Typography
                          variant="caption"
                          className="audit-actor-email"
                        >
                          {item.actor_email || "—"}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={formatLabel(
                          item.action
                        )}
                        color={getActionChipColor(
                          item.action
                        )}
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant="body2"
                        className="audit-entity-name"
                      >
                        {item.entity_name ||
                          `#${item.entity_id || "—"}`}
                      </Typography>

                      <Typography
                        variant="caption"
                        className="audit-entity-type"
                      >
                        {formatLabel(
                          item.entity_type
                        )}
                      </Typography>
                    </TableCell>

                    <TableCell className="audit-description-cell">
                      {item.description || "—"}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={formatLabel(
                          item.status
                        )}
                        color={getStatusChipColor(
                          item.status
                        )}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>


        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={pageSize}
          onRowsPerPageChange={
            handleRowsPerPageChange
          }
          rowsPerPageOptions={[
            10,
            20,
            50,
            100,
          ]}
        />
      </Paper>
    </Box>
  );
}


export default AuditTrail;