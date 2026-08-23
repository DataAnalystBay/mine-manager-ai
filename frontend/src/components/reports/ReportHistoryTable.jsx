import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import SlideshowRoundedIcon from "@mui/icons-material/SlideshowRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

import { getReportHistory } from "../../api/reportHistoryApi";
import { useLanguage } from "../../context/LanguageContext";

/* ============================================================
   FORMAT THEME
   ============================================================ */

function getFormatTheme(format) {
  const normalized = String(format || "").toUpperCase();

  if (
    normalized === "PPTX" ||
    normalized === "PPT" ||
    normalized === "POWERPOINT"
  ) {
    return {
      label: "PPTX",
      color: "#d24726",
      soft: "#fff4f0",
      border: "#f4c9bd",
      Icon: SlideshowRoundedIcon,
    };
  }

  if (
    normalized === "XLSX" ||
    normalized === "XLS" ||
    normalized === "EXCEL"
  ) {
    return {
      label: "XLSX",
      color: "#217346",
      soft: "#f0fdf4",
      border: "#bbf7d0",
      Icon: TableViewRoundedIcon,
    };
  }

  return {
    label: normalized || "PDF",
    color: "#dc2626",
    soft: "#fef2f2",
    border: "#fecaca",
    Icon: DescriptionRoundedIcon,
  };
}

/* ============================================================
   REPORT HISTORY
   ============================================================ */

function ReportHistoryTable({ refreshKey = 0 }) {
  const { t, language } = useLanguage();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /* ==========================================================
     LOAD HISTORY
     ========================================================== */

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getReportHistory();

      const reportHistory = Array.isArray(response)
        ? response
        : response?.items || response?.history || [];

      setHistory(reportHistory);
    } catch (error) {
      console.error(
        "Unable to load report history:",
        error
      );

      setErrorMessage(
        t("reports.historyLoadError")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshKey]);

  /* ==========================================================
     DATE
     ========================================================== */

  const formatGeneratedDate = (value) => {
    if (!value) {
      return "—";
    }

    const generatedDate = new Date(value);

    if (Number.isNaN(generatedDate.getTime())) {
      return value;
    }

    return generatedDate.toLocaleString(
      language === "mn" ? "mn-MN" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /* ==========================================================
     STATUS
     ========================================================== */

  const getStatusTheme = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (
      normalized === "completed" ||
      normalized === "success"
    ) {
      return {
        label: t("reports.done"),
        color: "#15803d",
        soft: "#f0fdf4",
        border: "#bbf7d0",
        Icon: CheckCircleRoundedIcon,
      };
    }

    if (
      normalized === "failed" ||
      normalized === "error"
    ) {
      return {
        label: t("reports.failed"),
        color: "#dc2626",
        soft: "#fef2f2",
        border: "#fecaca",
        Icon: ErrorRoundedIcon,
      };
    }

    return {
      label:
        status ||
        t("reports.unknown"),
      color: "#b45309",
      soft: "#fffbeb",
      border: "#fde68a",
      Icon: ScheduleRoundedIcon,
    };
  };

  /* ==========================================================
     UI
     ========================================================== */

  return (
    <Card
      elevation={0}
      sx={{
        mt: 2,
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        bgcolor: "#ffffff",
        boxShadow:
          "0 2px 8px rgba(15, 23, 42, 0.035)",
        overflow: "hidden",
      }}
    >
      {/* ======================================================
          HEADER
          ====================================================== */}

      <Box
        sx={{
          px: {
            xs: 1.75,
            md: 2,
          },

          py: 1.6,

          borderBottom:
            "1px solid #eef2f7",

          display: "flex",

          flexDirection: {
            xs: "column",
            sm: "row",
          },

          alignItems: {
            xs: "stretch",
            sm: "center",
          },

          justifyContent:
            "space-between",

          gap: 1.5,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "9px",
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <HistoryRoundedIcon
              sx={{
                fontSize: 18,
              }}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {t("reports.reportHistory")}
            </Typography>

            <Typography
              sx={{
                mt: 0.3,
                color: "#64748b",
                fontSize: 10.5,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              {t(
                "reports.reportHistoryDescription"
              )}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={0.8}
          alignItems="center"
        >
          {!loading && history.length > 0 && (
            <Box
              sx={{
                px: 1,
                py: 0.45,
                borderRadius: "7px",
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                }}
              >
                {history.length} REPORTS
              </Typography>
            </Box>
          )}

          <Tooltip
            title={t(
              "reports.refreshReportHistory"
            )}
          >
            <span>
              <IconButton
                onClick={loadHistory}
                disabled={loading}
                size="small"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  border:
                    "1px solid #dbe3ee",
                  bgcolor: "#ffffff",
                  color: "#475569",

                  "&:hover": {
                    bgcolor: "#f8fafc",
                    color: "#2563eb",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress
                    size={14}
                    thickness={5}
                  />
                ) : (
                  <RefreshRoundedIcon
                    sx={{
                      fontSize: 17,
                    }}
                  />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* ======================================================
          ERROR
          ====================================================== */}

      {errorMessage && (
        <Box
          sx={{
            px: {
              xs: 1.75,
              md: 2,
            },
            pt: 1.5,
          }}
        >
          <Alert
            severity="error"
            variant="outlined"
            sx={{
              borderRadius: "9px",
              bgcolor: "#fffafa",
              borderColor: "#fecaca",

              py: 0.25,

              "& .MuiAlert-icon": {
                fontSize: 18,
                alignItems: "center",
              },

              "& .MuiAlert-message": {
                py: 0.45,
                fontSize: 10.5,
                fontWeight: 600,
              },
            }}
          >
            {errorMessage}
          </Alert>
        </Box>
      )}

      {/* ======================================================
          LOADING
          ====================================================== */}

      {loading ? (
        <Box
          sx={{
            minHeight: 150,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.2,
          }}
        >
          <CircularProgress
            size={24}
            thickness={4}
          />

          <Typography
            sx={{
              color: "#64748b",
              fontSize: 10.5,
              fontWeight: 600,
            }}
          >
            {t(
              "reports.loadingReportHistory"
            )}
          </Typography>
        </Box>
      ) : history.length === 0 ? (
        /* ====================================================
           EMPTY STATE
           ==================================================== */

        <Box
          sx={{
            m: {
              xs: 1.75,
              md: 2,
            },

            py: 4,

            px: 2,

            textAlign: "center",

            border:
              "1px dashed #cbd5e1",

            borderRadius:
              "10px",

            bgcolor:
              "#f8fafc",
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              mx: "auto",
              mb: 1,
              borderRadius: "10px",
              bgcolor: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HistoryRoundedIcon
              sx={{
                fontSize: 19,
              }}
            />
          </Box>

          <Typography
            sx={{
              color: "#334155",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {t("reports.noReportHistory")}
          </Typography>

          <Typography
            sx={{
              mt: 0.45,
              color: "#64748b",
              fontSize: 10.5,
              lineHeight: 1.5,
            }}
          >
            {t(
              "reports.noReportHistoryDescription"
            )}
          </Typography>
        </Box>
      ) : (
        /* ====================================================
           TABLE
           ==================================================== */

        <TableContainer
          sx={{
            overflowX: "auto",
          }}
        >
          <Table
            size="small"
            sx={{
              minWidth: 760,
              tableLayout: "fixed",
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: "#f8fafc",
                }}
              >
                {[
                  ["REPORT", "31%"],
                  ["FORMAT", "10%"],
                  ["MINE", "16%"],
                  ["GENERATED", "22%"],
                  ["SIZE", "9%"],
                  ["STATUS", "12%"],
                ].map(([label, width]) => (
                  <TableCell
                    key={label}
                    sx={{
                      width,
                      py: 1,
                      px: 1.5,
                      borderBottom:
                        "1px solid #e2e8f0",
                      color: "#64748b",
                      fontSize: 8.8,
                      fontWeight: 900,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {history.map((report) => {
                const formatTheme =
                  getFormatTheme(
                    report.report_format
                  );

                const statusTheme =
                  getStatusTheme(
                    report.status
                  );

                const FormatIcon =
                  formatTheme.Icon;

                const StatusIcon =
                  statusTheme.Icon;

                return (
                  <TableRow
                    key={report.id}
                    sx={{
                      transition:
                        "background-color 120ms ease",

                      "&:hover": {
                        bgcolor:
                          "#fafcff",
                      },

                      "&:last-child td": {
                        borderBottom: 0,
                      },
                    }}
                  >
                    {/* REPORT */}

                    <TableCell
                      sx={{
                        px: 1.5,
                        py: 1.1,
                        borderColor:
                          "#eef2f7",
                      }}
                    >
                      <Tooltip
                        title={
                          report.report_name ||
                          ""
                        }
                        placement="top-start"
                      >
                        <Typography
                          sx={{
                            color:
                              "#0f172a",
                            fontSize:
                              10.8,
                            fontWeight:
                              750,
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {report.report_name ||
                            t(
                              "reports.unnamedReport"
                            )}
                        </Typography>
                      </Tooltip>

                      <Typography
                        sx={{
                          mt: 0.25,
                          color:
                            "#94a3b8",
                          fontSize:
                            8.8,
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {report.filename ||
                          report.report_key ||
                          "—"}
                      </Typography>
                    </TableCell>

                    {/* FORMAT */}

                    <TableCell
                      sx={{
                        px: 1.5,
                        py: 1.1,
                        borderColor:
                          "#eef2f7",
                      }}
                    >
                      <Chip
                        icon={
                          <FormatIcon
                            sx={{
                              fontSize:
                                "12px !important",
                              color: `${formatTheme.color} !important`,
                            }}
                          />
                        }
                        label={
                          formatTheme.label
                        }
                        size="small"
                        sx={{
                          height: 21,
                          borderRadius:
                            "6px",
                          bgcolor:
                            formatTheme.soft,
                          color:
                            formatTheme.color,
                          border: `1px solid ${formatTheme.border}`,
                          fontSize:
                            8.5,
                          fontWeight:
                            900,

                          "& .MuiChip-label":
                            {
                              px: 0.6,
                            },

                          "& .MuiChip-icon":
                            {
                              ml: 0.55,
                            },
                        }}
                      />
                    </TableCell>

                    {/* MINE */}

                    <TableCell
                      sx={{
                        px: 1.5,
                        py: 1.1,
                        borderColor:
                          "#eef2f7",
                      }}
                    >
                      <Tooltip
                        title={
                          report.mine_name ||
                          ""
                        }
                      >
                        <Typography
                          sx={{
                            color:
                              "#475569",
                            fontSize:
                              10,
                            fontWeight:
                              600,
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {report.mine_name ||
                            "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    {/* GENERATED */}

                    <TableCell
                      sx={{
                        px: 1.5,
                        py: 1.1,
                        borderColor:
                          "#eef2f7",
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            "#334155",
                          fontSize:
                            9.8,
                          fontWeight:
                            700,
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {report.generated_by ||
                          t(
                            "reports.system"
                          )}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.2,
                          color:
                            "#94a3b8",
                          fontSize:
                            8.7,
                        }}
                      >
                        {formatGeneratedDate(
                          report.generated_at
                        )}
                      </Typography>
                    </TableCell>

                    {/* SIZE */}

                    <TableCell
                      sx={{
                        px: 1.5,
                        py: 1.1,
                        borderColor:
                          "#eef2f7",
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            "#475569",
                          fontSize:
                            9.8,
                          fontWeight:
                            650,
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {report.file_size_display ||
                          "—"}
                      </Typography>
                    </TableCell>

                    {/* STATUS */}

                    <TableCell
                      sx={{
                        px: 1.5,
                        py: 1.1,
                        borderColor:
                          "#eef2f7",
                      }}
                    >
                      <Chip
                        icon={
                          <StatusIcon
                            sx={{
                              fontSize:
                                "12px !important",
                              color: `${statusTheme.color} !important`,
                            }}
                          />
                        }
                        label={
                          statusTheme.label
                        }
                        size="small"
                        sx={{
                          height: 21,
                          borderRadius:
                            "999px",
                          bgcolor:
                            statusTheme.soft,
                          color:
                            statusTheme.color,
                          border: `1px solid ${statusTheme.border}`,
                          fontSize:
                            8.5,
                          fontWeight:
                            800,

                          "& .MuiChip-label":
                            {
                              px: 0.65,
                            },

                          "& .MuiChip-icon":
                            {
                              ml: 0.55,
                            },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}

export default ReportHistoryTable;