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
import { useLanguage } from "../context/LanguageContext";
import { formatDisplayDateTime } from "../utils/displayDateTime";

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

const INITIAL_SUMMARY = {
  totalLogs: 0,
  successfulLogs: 0,
  failedLogs: 0,
  todayLogs: 0,
};


function formatLabel(value, t) {
  if (!value) {
    return "—";
  }

  const normalized = String(value).trim().toUpperCase();
  const key = {
    CREATE_USER: "createUser",
    UPDATE_USER: "updateUser",
    ACTIVATE_USER: "activateUser",
    DEACTIVATE_USER: "deactivateUser",
    RESET_PASSWORD: "resetPassword",
    SUCCESS: "success",
    FAILED: "failed",
    USER: "user",
  }[normalized];

  if (key) {
    return t(`auditTrail.${key}`);
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
  const { language, t } = useLanguage();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [summary, setSummary] =
    useState(INITIAL_SUMMARY);

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

      setSummary({
        totalLogs:
          Number(response?.total_logs) || 0,

        successfulLogs:
          Number(response?.successful_logs) || 0,

        failedLogs:
          Number(response?.failed_logs) || 0,

        todayLogs:
          Number(response?.today_logs) || 0,
      });
    } catch (requestError) {
      setItems([]);
      setTotal(0);
      setSummary(INITIAL_SUMMARY);

      setError(
        requestError?.userMessage ||
          requestError?.message ||
          t("auditTrail.loadError")
      );
    } finally {
      setLoading(false);
    }
  }, [apiFilters, t]);


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
              {t("auditTrail.title")}
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            className="audit-trail-subtitle"
          >
            {t("auditTrail.subtitle")}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadAuditLogs}
          disabled={loading}
        >
          {t("common.refresh")}
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


      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#64748b" }}
          >
            {t("auditTrail.totalLogs")}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              mt: 0.75,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            {summary.totalLogs}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            border: "1px solid #bbf7d0",
            borderRadius: "14px",
            bgcolor: "#f0fdf4",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#166534" }}
          >
            {t("auditTrail.successful")}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              mt: 0.75,
              fontWeight: 800,
              color: "#166534",
            }}
          >
            {summary.successfulLogs}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            border: "1px solid #fecaca",
            borderRadius: "14px",
            bgcolor: "#fef2f2",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#b91c1c" }}
          >
            {t("auditTrail.failed")}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              mt: 0.75,
              fontWeight: 800,
              color: "#b91c1c",
            }}
          >
            {summary.failedLogs}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            border: "1px solid #bfdbfe",
            borderRadius: "14px",
            bgcolor: "#eff6ff",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#1d4ed8" }}
          >
            {t("auditTrail.todayActivity")}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              mt: 0.75,
              fontWeight: 800,
              color: "#1d4ed8",
            }}
          >
            {summary.todayLogs}
          </Typography>
        </Paper>
      </Box>


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
              {t("auditTrail.activityRecords")}
            </Typography>

            <Typography
              variant="body2"
              className="audit-trail-record-count"
            >
              {t(total === 1 ? "auditTrail.recordCount" : "auditTrail.recordsCount").replace("{count}", total)}
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
            aria-label={t("auditTrail.recordsAria")}
          >
            <TableHead>
              <TableRow>
                <TableCell>
                  {t("auditTrail.dateTime")}
                </TableCell>

                <TableCell>
                  {t("auditTrail.actor")}
                </TableCell>

                <TableCell>
                  {t("auditTrail.action")}
                </TableCell>

                <TableCell>
                  {t("auditTrail.entity")}
                </TableCell>

                <TableCell>
                  {t("auditTrail.description")}
                </TableCell>

                <TableCell>
                  {t("auditTrail.status")}
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
                        {t("auditTrail.loading")}
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
                        {t("auditTrail.emptyTitle")}
                      </Typography>

                      <Typography variant="body2">
                        {t("auditTrail.emptyDescription")}
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
                      {formatDisplayDateTime(
                        item.created_at,
                        language,
                        {
                          seconds: true,
                          fallback: String(item.created_at || "—"),
                        },
                      )}
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography
                          variant="body2"
                          className="audit-actor-name"
                        >
                          {item.actor_name ||
                            t("auditTrail.system")}
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
                          item.action,
                          t
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
                          item.entity_type,
                          t
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
                          item.status,
                          t
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
