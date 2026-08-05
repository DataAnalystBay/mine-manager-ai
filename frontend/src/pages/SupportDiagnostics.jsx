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
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import StorageIcon from "@mui/icons-material/Storage";
import DnsIcon from "@mui/icons-material/Dns";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import SecurityIcon from "@mui/icons-material/Security";

import {
  downloadSupportDiagnostics,
  getSupportDiagnostics,
} from "../api/supportDiagnosticsApi";

import "./SupportDiagnostics.css";

const STATUS_LABELS = {
  healthy: "Healthy",
  available: "Available",
  warning: "Warning",
  failed: "Failed",
  not_configured: "Not Configured",
  not_available: "Not Available",
};

function formatStatusLabel(status) {
  return (
    STATUS_LABELS[status] ||
    String(status || "Unknown")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      )
  );
}

function getStatusClass(status) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();

  if (
    normalized === "healthy" ||
    normalized === "available"
  ) {
    return "status-success";
  }

  if (
    normalized === "failed" ||
    normalized === "critical"
  ) {
    return "status-failed";
  }

  return "status-warning";
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
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

function formatValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function SummaryCard({
  title,
  value,
  status,
  icon,
}) {
  return (
    <Paper
      elevation={0}
      className="support-summary-card"
    >
      <Box className="support-summary-icon">
        {icon}
      </Box>

      <Box>
        <Typography className="support-summary-label">
          {title}
        </Typography>

        <Typography className="support-summary-value">
          {value}
        </Typography>

        {status && (
          <Chip
            size="small"
            label={formatStatusLabel(status)}
            className={`support-status-chip ${getStatusClass(
              status,
            )}`}
          />
        )}
      </Box>
    </Paper>
  );
}

function DetailRow({
  label,
  value,
}) {
  return (
    <Box className="support-detail-row">
      <Typography className="support-detail-label">
        {label}
      </Typography>

      <Typography className="support-detail-value">
        {formatValue(value)}
      </Typography>
    </Box>
  );
}

function DiagnosticsSection({
  title,
  subtitle,
  icon,
  status,
  children,
}) {
  return (
    <Paper
      elevation={0}
      className="support-section-card"
    >
      <Box className="support-section-header">
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <Box className="support-section-icon">
            {icon}
          </Box>

          <Box>
            <Typography className="support-section-title">
              {title}
            </Typography>

            {subtitle && (
              <Typography className="support-section-subtitle">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        {status && (
          <Chip
            size="small"
            label={formatStatusLabel(status)}
            className={`support-status-chip ${getStatusClass(
              status,
            )}`}
          />
        )}
      </Box>

      <Box className="support-section-body">
        {children}
      </Box>
    </Paper>
  );
}

function SupportDiagnostics() {
  const [diagnostics, setDiagnostics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [downloading, setDownloading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [downloadMessage, setDownloadMessage] =
    useState("");

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    setError("");
    setDownloadMessage("");

    try {
      const result =
        await getSupportDiagnostics();

      setDiagnostics(result);
    } catch (requestError) {
      setDiagnostics(null);

      setError(
        requestError?.message ||
          "Unable to load support diagnostics.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiagnostics();
  }, [loadDiagnostics]);

  const directorySummary = useMemo(() => {
    const directories =
      diagnostics?.directories || [];

    return {
      total: directories.length,
      healthy: directories.filter(
        (item) =>
          item?.status === "healthy",
      ).length,
      warning: directories.filter(
        (item) =>
          item?.status !== "healthy",
      ).length,
    };
  }, [diagnostics]);

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    setDownloadMessage("");

    try {
      const filename =
        await downloadSupportDiagnostics();

      setDownloadMessage(
        `Diagnostics downloaded: ${filename}`,
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Unable to download support diagnostics.",
      );
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Box className="support-diagnostics-page support-loading-page">
        <CircularProgress size={42} />

        <Typography>
          Loading support diagnostics...
        </Typography>
      </Box>
    );
  }

  const applicationInformation =
    diagnostics?.application_information || {};

  const database =
    diagnostics?.database || {};

  const diskStorage =
    diagnostics?.disk_storage || {};

  const logs =
    diagnostics?.logs || {};

  const systemHealth =
    diagnostics?.system_health || {};

  const deploymentReadiness =
    diagnostics?.deployment_readiness || {};

  const dependencies =
    diagnostics?.dependencies?.packages || {};

  return (
    <Box className="support-diagnostics-page">
      <Box className="support-page-header">
        <Box>
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
          >
            <Box className="support-page-title-icon">
              <SupportAgentIcon />
            </Box>

            <Typography
              variant="h4"
              component="h1"
              className="support-page-title"
            >
              Support Diagnostics
            </Typography>
          </Stack>

          <Typography className="support-page-subtitle">
            Review runtime, database, storage, logs,
            health, and deployment-readiness information.
          </Typography>
        </Box>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1.25}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDiagnostics}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={
              downloading ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <DownloadIcon />
              )
            }
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading
              ? "Preparing..."
              : "Download Diagnostics"}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert
          severity="error"
          className="support-alert"
        >
          {error}
        </Alert>
      )}

      {downloadMessage && (
        <Alert
          severity="success"
          className="support-alert"
        >
          {downloadMessage}
        </Alert>
      )}

      <Alert
        severity="info"
        className="support-security-notice"
        icon={<SecurityIcon />}
      >
        {diagnostics?.security_notice ||
          "Sensitive credentials are excluded from this diagnostics report."}
      </Alert>

      <Box className="support-summary-grid">
        <SummaryCard
          title="Overall Status"
          value={formatStatusLabel(
            diagnostics?.overall_status,
          )}
          status={diagnostics?.overall_status}
          icon={<SupportAgentIcon />}
        />

        <SummaryCard
          title="Database"
          value={formatStatusLabel(
            database?.status,
          )}
          status={database?.status}
          icon={<DnsIcon />}
        />

        <SummaryCard
          title="Storage"
          value={
            diskStorage?.details?.free_gb !==
            undefined
              ? `${diskStorage.details.free_gb} GB free`
              : formatStatusLabel(
                  diskStorage?.status,
                )
          }
          status={diskStorage?.status}
          icon={<StorageIcon />}
        />

        <SummaryCard
          title="Runtime Directories"
          value={`${directorySummary.healthy}/${directorySummary.total} ready`}
          status={
            directorySummary.warning > 0
              ? "warning"
              : "healthy"
          }
          icon={<FolderIcon />}
        />
      </Box>

      <Box className="support-sections-grid">
        <DiagnosticsSection
          title="Application Information"
          subtitle="Current runtime and environment"
          icon={<SupportAgentIcon />}
          status={diagnostics?.overall_status}
        >
          <DetailRow
            label="Application"
            value={
              applicationInformation.application
            }
          />

          <DetailRow
            label="Version"
            value={applicationInformation.version}
          />

          <DetailRow
            label="Environment"
            value={
              applicationInformation.environment
            }
          />

          <DetailRow
            label="Debug enabled"
            value={
              applicationInformation.debug_enabled
            }
          />

          <DetailRow
            label="Server time"
            value={formatDateTime(
              applicationInformation.server_time_utc,
            )}
          />

          <DetailRow
            label="Python"
            value={
              applicationInformation.python_version
            }
          />

          <DetailRow
            label="Operating system"
            value={
              applicationInformation.platform
            }
          />

          <DetailRow
            label="Process ID"
            value={applicationInformation.process_id}
          />
        </DiagnosticsSection>

        <DiagnosticsSection
          title="Database"
          subtitle={database?.message}
          icon={<DnsIcon />}
          status={database?.status}
        >
          <DetailRow
            label="Database"
            value={
              database?.details?.database_name
            }
          />

          <DetailRow
            label="Database user"
            value={
              database?.details?.database_user
            }
          />

          <DetailRow
            label="Server version"
            value={
              database?.details?.server_version
            }
          />

          <DetailRow
            label="Alembic revision"
            value={
              database?.details?.alembic_revision
            }
          />

          <DetailRow
            label="Response time"
            value={
              database?.response_time_ms !==
              undefined
                ? `${database.response_time_ms} ms`
                : "—"
            }
          />

          <DetailRow
            label="SSL expected"
            value={
              database?.details?.ssl_expected
            }
          />
        </DiagnosticsSection>

        <DiagnosticsSection
          title="Disk Storage"
          subtitle={diskStorage?.message}
          icon={<StorageIcon />}
          status={diskStorage?.status}
        >
          <DetailRow
            label="Path"
            value={
              diskStorage?.details?.path
            }
          />

          <DetailRow
            label="Total"
            value={
              diskStorage?.details?.total_gb !==
              undefined
                ? `${diskStorage.details.total_gb} GB`
                : "—"
            }
          />

          <DetailRow
            label="Used"
            value={
              diskStorage?.details?.used_gb !==
              undefined
                ? `${diskStorage.details.used_gb} GB`
                : "—"
            }
          />

          <DetailRow
            label="Free"
            value={
              diskStorage?.details?.free_gb !==
              undefined
                ? `${diskStorage.details.free_gb} GB`
                : "—"
            }
          />

          <Box className="support-progress-block">
            <Stack
              direction="row"
              justifyContent="space-between"
            >
              <Typography>
                Free space
              </Typography>

              <Typography>
                {diskStorage?.details?.free_percent ??
                  0}
                %
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={Math.min(
                Number(
                  diskStorage?.details
                    ?.free_percent || 0,
                ),
                100,
              )}
            />
          </Box>
        </DiagnosticsSection>

        <DiagnosticsSection
          title="System Health"
          subtitle={systemHealth?.message}
          icon={<StorageIcon />}
          status={systemHealth?.status}
        >
          <DetailRow
            label="Overall status"
            value={
              systemHealth?.details?.overall_status
            }
          />

          <DetailRow
            label="Checked at"
            value={formatDateTime(
              systemHealth?.details?.checked_at,
            )}
          />

          <DetailRow
            label="Cached"
            value={
              systemHealth?.details?.cached
            }
          />

          <DetailRow
            label="Cache age"
            value={
              systemHealth?.details
                ?.cache_age_seconds !== undefined
                ? `${systemHealth.details.cache_age_seconds} sec`
                : "—"
            }
          />

          <DetailRow
            label="Slowest service"
            value={
              systemHealth?.details
                ?.slowest_service?.name ||
              systemHealth?.details
                ?.slowest_service ||
              "—"
            }
          />
        </DiagnosticsSection>

        <DiagnosticsSection
          title="Deployment Readiness"
          subtitle={deploymentReadiness?.message}
          icon={<SecurityIcon />}
          status={
            deploymentReadiness?.status
          }
        >
          <DetailRow
            label="Overall status"
            value={
              deploymentReadiness?.details
                ?.overall_status
            }
          />

          <DetailRow
            label="Readiness score"
            value={
              deploymentReadiness?.details
                ?.readiness_score
            }
          />

          <DetailRow
            label="Passed"
            value={
              deploymentReadiness?.details?.passed
            }
          />

          <DetailRow
            label="Warnings"
            value={
              deploymentReadiness?.details
                ?.warnings
            }
          />

          <DetailRow
            label="Failed"
            value={
              deploymentReadiness?.details?.failed
            }
          />
        </DiagnosticsSection>

        <DiagnosticsSection
          title="Application Logs"
          subtitle={logs?.message}
          icon={<DescriptionIcon />}
          status={logs?.status}
        >
          <DetailRow
            label="Log directory"
            value={
              logs?.details?.log_directory
            }
          />

          <DetailRow
            label="Log files"
            value={
              logs?.details?.file_count
            }
          />

          <DetailRow
            label="Recent entries"
            value={
              logs?.details?.entry_count
            }
          />

          {Array.isArray(
            logs?.details?.entries,
          ) &&
            logs.details.entries.length > 0 && (
              <Box className="support-log-list">
                {logs.details.entries.map(
                  (entry, index) => (
                    <Box
                      key={`${entry.file}-${index}`}
                      className="support-log-entry"
                    >
                      <Typography className="support-log-file">
                        {entry.file}
                      </Typography>

                      <Typography className="support-log-message">
                        {entry.message}
                      </Typography>
                    </Box>
                  ),
                )}
              </Box>
            )}
        </DiagnosticsSection>

        <DiagnosticsSection
          title="Runtime Directories"
          subtitle="Application file-system readiness"
          icon={<FolderIcon />}
          status={
            directorySummary.warning > 0
              ? "warning"
              : "healthy"
          }
        >
          <Box className="support-directory-list">
            {(diagnostics?.directories || []).map(
              (directory) => (
                <Box
                  key={
                    directory?.details?.name ||
                    directory?.details?.path
                  }
                  className="support-directory-item"
                >
                  <Box>
                    <Typography className="support-directory-name">
                      {directory?.details?.name ||
                        "Directory"}
                    </Typography>

                    <Typography className="support-directory-path">
                      {directory?.details?.path ||
                        "—"}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={formatStatusLabel(
                      directory?.status,
                    )}
                    className={`support-status-chip ${getStatusClass(
                      directory?.status,
                    )}`}
                  />
                </Box>
              ),
            )}
          </Box>
        </DiagnosticsSection>

        <DiagnosticsSection
          title="Dependencies"
          subtitle="Installed backend package versions"
          icon={<DescriptionIcon />}
          status="available"
        >
          <Box className="support-dependency-grid">
            {Object.entries(dependencies).map(
              ([name, version]) => (
                <DetailRow
                  key={name}
                  label={name}
                  value={version}
                />
              ),
            )}
          </Box>
        </DiagnosticsSection>
      </Box>

      <Typography className="support-generated-at">
        Generated:{" "}
        {formatDateTime(
          diagnostics?.generated_at,
        )}{" "}
        · Duration:{" "}
        {diagnostics?.generation_duration_ms ?? 0} ms
      </Typography>
    </Box>
  );
}

export default SupportDiagnostics;