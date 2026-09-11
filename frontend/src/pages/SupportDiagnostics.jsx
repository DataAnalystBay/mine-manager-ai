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
import { useLanguage } from "../context/LanguageContext";
import { formatDisplayDateTime } from "../utils/displayDateTime";

import "./SupportDiagnostics.css";

function formatStatusLabel(status, t) {
  const key = ["healthy", "available", "warning", "failed", "not_configured", "not_available"].includes(status)
    ? `supportDiagnostics.status_${status}`
    : null;
  return (
    (key && t(key)) ||
    String(status || t("supportDiagnostics.unknown"))
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

function formatValue(value, t) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? t("common.yes") : t("common.no");
  }

  return String(value);
}

function SummaryCard({
  title,
  value,
  status,
  icon,
}) {
  const { t } = useLanguage();
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
            label={formatStatusLabel(status, t)}
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
  const { t } = useLanguage();
  return (
    <Box className="support-detail-row">
      <Typography className="support-detail-label">
        {label}
      </Typography>

      <Typography className="support-detail-value">
        {formatValue(value, t)}
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
  const { t } = useLanguage();
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
            label={formatStatusLabel(status, t)}
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
  const { language, t } = useLanguage();
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
          t("supportDiagnostics.loadError"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

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
        t("supportDiagnostics.downloaded").replace("{filename}", filename),
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          t("supportDiagnostics.downloadError"),
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
          {t("supportDiagnostics.loading")}
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
              {t("supportDiagnostics.title")}
            </Typography>
          </Stack>

          <Typography className="support-page-subtitle">
            {t("supportDiagnostics.subtitle")}
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
            {t("common.refresh")}
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
              ? t("common.preparing")
              : t("supportDiagnostics.download")}
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
          t("supportDiagnostics.securityNotice")}
      </Alert>

      <Box className="support-summary-grid">
        <SummaryCard
          title={t("supportDiagnostics.overallStatus")}
          value={formatStatusLabel(
            diagnostics?.overall_status,
            t,
          )}
          status={diagnostics?.overall_status}
          icon={<SupportAgentIcon />}
        />

        <SummaryCard
          title={t("supportDiagnostics.database")}
          value={formatStatusLabel(
            database?.status,
            t,
          )}
          status={database?.status}
          icon={<DnsIcon />}
        />

        <SummaryCard
          title={t("supportDiagnostics.storage")}
          value={
            diskStorage?.details?.free_gb !==
            undefined
              ? `${diskStorage.details.free_gb} GB ${t("supportDiagnostics.freeUnit")}`
              : formatStatusLabel(
                  diskStorage?.status,
                  t,
                )
          }
          status={diskStorage?.status}
          icon={<StorageIcon />}
        />

        <SummaryCard
          title={t("supportDiagnostics.runtimeDirectories")}
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
          title={t("supportDiagnostics.applicationInformation")}
          subtitle={t("supportDiagnostics.runtimeEnvironment")}
          icon={<SupportAgentIcon />}
          status={diagnostics?.overall_status}
        >
          <DetailRow
            label={t("supportDiagnostics.application")}
            value={
              applicationInformation.application
            }
          />

          <DetailRow
            label={t("supportDiagnostics.version")}
            value={applicationInformation.version}
          />

          <DetailRow
            label={t("supportDiagnostics.environment")}
            value={
              applicationInformation.environment
            }
          />

          <DetailRow
            label={t("supportDiagnostics.debugEnabled")}
            value={
              applicationInformation.debug_enabled
            }
          />

          <DetailRow
            label={t("supportDiagnostics.serverTime")}
            value={formatDisplayDateTime(
              applicationInformation.server_time_utc,
              language,
              { seconds: true, fallback: String(applicationInformation.server_time_utc || "—") },
            )}
          />

          <DetailRow
            label="Python"
            value={
              applicationInformation.python_version
            }
          />

          <DetailRow
            label={t("supportDiagnostics.operatingSystem")}
            value={
              applicationInformation.platform
            }
          />

          <DetailRow
            label={t("supportDiagnostics.processId")}
            value={applicationInformation.process_id}
          />
        </DiagnosticsSection>

        <DiagnosticsSection
          title={t("supportDiagnostics.database")}
          subtitle={database?.message}
          icon={<DnsIcon />}
          status={database?.status}
        >
          <DetailRow
            label={t("supportDiagnostics.database")}
            value={
              database?.details?.database_name
            }
          />

          <DetailRow
            label={t("supportDiagnostics.databaseUser")}
            value={
              database?.details?.database_user
            }
          />

          <DetailRow
            label={t("supportDiagnostics.serverVersion")}
            value={
              database?.details?.server_version
            }
          />

          <DetailRow
            label={t("supportDiagnostics.alembicRevision")}
            value={
              database?.details?.alembic_revision
            }
          />

          <DetailRow
            label={t("supportDiagnostics.responseTime")}
            value={
              database?.response_time_ms !==
              undefined
                ? `${database.response_time_ms} ms`
                : "—"
            }
          />

          <DetailRow
            label={t("supportDiagnostics.sslExpected")}
            value={
              database?.details?.ssl_expected
            }
          />
        </DiagnosticsSection>

        <DiagnosticsSection
          title={t("supportDiagnostics.diskStorage")}
          subtitle={diskStorage?.message}
          icon={<StorageIcon />}
          status={diskStorage?.status}
        >
          <DetailRow
            label={t("supportDiagnostics.path")}
            value={
              diskStorage?.details?.path
            }
          />

          <DetailRow
            label={t("supportDiagnostics.total")}
            value={
              diskStorage?.details?.total_gb !==
              undefined
                ? `${diskStorage.details.total_gb} GB`
                : "—"
            }
          />

          <DetailRow
            label={t("supportDiagnostics.used")}
            value={
              diskStorage?.details?.used_gb !==
              undefined
                ? `${diskStorage.details.used_gb} GB`
                : "—"
            }
          />

          <DetailRow
            label={t("supportDiagnostics.free")}
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
          title={t("supportDiagnostics.systemHealth")}
          subtitle={systemHealth?.message}
          icon={<StorageIcon />}
          status={systemHealth?.status}
        >
          <DetailRow
            label={t("supportDiagnostics.overallStatus")}
            value={
              systemHealth?.details?.overall_status
            }
          />

          <DetailRow
            label={t("supportDiagnostics.checkedAt")}
            value={formatDisplayDateTime(
              systemHealth?.details?.checked_at,
              language,
              { seconds: true, fallback: String(systemHealth?.details?.checked_at || "—") },
            )}
          />

          <DetailRow
            label={t("supportDiagnostics.cached")}
            value={
              systemHealth?.details?.cached
            }
          />

          <DetailRow
            label={t("supportDiagnostics.cacheAge")}
            value={
              systemHealth?.details
                ?.cache_age_seconds !== undefined
                ? `${systemHealth.details.cache_age_seconds} sec`
                : "—"
            }
          />

          <DetailRow
            label={t("supportDiagnostics.slowestService")}
            value={
              systemHealth?.details?.slowest_service
                ? typeof systemHealth.details.slowest_service === "string"
                  ? systemHealth.details.slowest_service
                  : systemHealth.details.slowest_service.name ||
                    systemHealth.details.slowest_service.label ||
                    systemHealth.details.slowest_service.service ||
                    "Unavailable"
                : "—"
            }
          />
        </DiagnosticsSection>

        <DiagnosticsSection
          title={t("supportDiagnostics.deploymentReadiness")}
          subtitle={deploymentReadiness?.message}
          icon={<SecurityIcon />}
          status={
            deploymentReadiness?.status
          }
        >
          <DetailRow
            label={t("supportDiagnostics.overallStatus")}
            value={
              deploymentReadiness?.details
                ?.overall_status
            }
          />

          <DetailRow
            label={t("supportDiagnostics.readinessScore")}
            value={
              deploymentReadiness?.details
                ?.readiness_score
            }
          />

          <DetailRow
            label={t("supportDiagnostics.passed")}
            value={
              deploymentReadiness?.details?.passed
            }
          />

          <DetailRow
            label={t("supportDiagnostics.warnings")}
            value={
              deploymentReadiness?.details
                ?.warnings
            }
          />

          <DetailRow
            label={t("supportDiagnostics.failed")}
            value={
              deploymentReadiness?.details?.failed
            }
          />
        </DiagnosticsSection>

        <DiagnosticsSection
          title={t("supportDiagnostics.applicationLogs")}
          subtitle={logs?.message}
          icon={<DescriptionIcon />}
          status={logs?.status}
        >
          <DetailRow
            label={t("supportDiagnostics.logDirectory")}
            value={
              logs?.details?.log_directory
            }
          />

          <DetailRow
            label={t("supportDiagnostics.logFiles")}
            value={
              logs?.details?.file_count
            }
          />

          <DetailRow
            label={t("supportDiagnostics.recentEntries")}
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
          title={t("supportDiagnostics.runtimeDirectories")}
          subtitle={t("supportDiagnostics.filesystemReadiness")}
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
                      t,
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
          title={t("supportDiagnostics.dependencies")}
          subtitle={t("supportDiagnostics.packageVersions")}
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
        {t("supportDiagnostics.generated")}:{" "}
        {formatDisplayDateTime(
          diagnostics?.generated_at,
          language,
          { seconds: true, fallback: String(diagnostics?.generated_at || "—") },
        )}{" "}
        · {t("supportDiagnostics.duration")}:{" "}
        {diagnostics?.generation_duration_ms ?? 0} ms
      </Typography>
    </Box>
  );
}

export default SupportDiagnostics;
