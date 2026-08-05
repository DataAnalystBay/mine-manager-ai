import React, { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import * as XLSX from "xlsx";

import { API_BASE_URL } from "../config/apiConfig";

import {
  FaIndustry,
  FaTruckMoving,
  FaLeaf,
  FaHardHat,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCloudUploadAlt,
  FaBrain,
} from "react-icons/fa";

import "./UploadReports.css";


const REPORT_CONFIG = {
  production: {
    title: "Production Report",
    icon: <FaIndustry />,
    endpoint: "/upload/production",
    requiredColumns: [
      "report_date",
      "ore_plan",
      "ore_actual",
      "waste_plan",
      "waste_actual",
    ],
  },

  fleet: {
    title: "Fleet Report",
    icon: <FaTruckMoving />,
    endpoint: "/upload/fleet",
    requiredColumns: [
      "report_date",
      "truck_id",
      "availability",
      "utilization",
    ],
  },

  plant: {
    title: "Plant Report",
    icon: <FaLeaf />,
    endpoint: "/upload/plant",
    requiredColumns: [
      "report_date",
      "throughput_plan",
      "throughput_actual",
      "recovery",
    ],
  },

  safety: {
    title: "Safety Report",
    icon: <FaHardHat />,
    endpoint: "/upload/safety",
    requiredColumns: [
      "report_date",
      "incidents",
      "near_misses",
      "critical_risks",
      "safety_score",
    ],
  },
};


const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.warn("Unable to read stored user information.", error);
    return null;
  }
};


const getAccessToken = () => {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  );
};


const extractUploadErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return item?.msg || item?.message || "Validation error";
      })
      .join(", ");
  }

  if (detail?.message) {
    return detail.message;
  }

  if (detail?.error) {
    return detail.error;
  }

  if (error?.response?.status === 401) {
    return "Your login session has expired. Please log in again.";
  }

  if (error?.response?.status === 403) {
    return "You do not have permission to upload this report.";
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Upload failed. Please check the backend endpoint."
  );
};


function UploadReports() {
  const storedUser = getStoredUser();

  const uploadedBy =
    storedUser?.full_name ||
    storedUser?.name ||
    storedUser?.email ||
    "Current User";

  const [reports, setReports] = useState(() => {
    const initialState = {};

    Object.keys(REPORT_CONFIG).forEach((key) => {
      initialState[key] = {
        status: "waiting",
        fileName: "",
        progress: 0,
        message: "Waiting for upload",
        uploadedAt: "",
        uploadedBy,
      };
    });

    return initialState;
  });


  const uploadHistory = useMemo(() => {
    return Object.entries(reports)
      .filter(([, report]) => report.status === "success")
      .map(([key, report]) => ({
        report: REPORT_CONFIG[key].title,
        fileName: report.fileName,
        uploadedBy: report.uploadedBy,
        uploadedAt: report.uploadedAt,
        status: "Success",
      }));
  }, [reports]);


  const completedCount = Object.values(reports).filter(
    (report) => report.status === "success",
  ).length;


  const completeness = Math.round(
    (completedCount / Object.keys(REPORT_CONFIG).length) * 100,
  );


  const allReportsUploaded =
    completedCount === Object.keys(REPORT_CONFIG).length;


  const normalizeColumn = (column) =>
    String(column)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");


  const validateExcelColumns = async (
    file,
    requiredColumns,
  ) => {
    const data = await file.arrayBuffer();

    const workbook = XLSX.read(data, {
      type: "array",
    });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      return {
        valid: false,
        missingColumns: requiredColumns,
        message: "The workbook does not contain a readable worksheet.",
      };
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      blankrows: false,
    });

    if (!rows || rows.length === 0) {
      return {
        valid: false,
        missingColumns: requiredColumns,
        message: "The selected file is empty.",
      };
    }

    const headerRow = Array.isArray(rows[0])
      ? rows[0].map(normalizeColumn)
      : [];

    const missingColumns = requiredColumns.filter(
      (column) =>
        !headerRow.includes(
          normalizeColumn(column),
        ),
    );

    return {
      valid: missingColumns.length === 0,
      missingColumns,
      message:
        missingColumns.length === 0
          ? "Columns validated successfully."
          : `Missing columns: ${missingColumns.join(", ")}`,
    };
  };


  const updateReport = (
    reportKey,
    changes,
  ) => {
    setReports((previousReports) => ({
      ...previousReports,
      [reportKey]: {
        ...previousReports[reportKey],
        ...changes,
      },
    }));
  };


  const handleUpload = async (
    reportKey,
    acceptedFiles,
  ) => {
    const file = acceptedFiles[0];

    if (!file) {
      return;
    }

    const config = REPORT_CONFIG[reportKey];

    updateReport(reportKey, {
      status: "validating",
      fileName: file.name,
      progress: 0,
      message: "Validating Excel columns...",
      uploadedAt: "",
    });

    try {
      const validation = await validateExcelColumns(
        file,
        config.requiredColumns,
      );

      if (!validation.valid) {
        updateReport(reportKey, {
          status: "error",
          progress: 0,
          message:
            validation.message ||
            `Missing columns: ${validation.missingColumns.join(", ")}`,
        });

        return;
      }

      const accessToken = getAccessToken();

      if (!accessToken) {
        updateReport(reportKey, {
          status: "error",
          progress: 0,
          message:
            "Not authenticated. Please log in again before uploading.",
        });

        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      updateReport(reportKey, {
        status: "uploading",
        progress: 0,
        message: "Uploading report...",
      });

      await axios.post(
        `${API_BASE_URL}${config.endpoint}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },

          timeout: 60000,

          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || file.size;

            const percentCompleted = total
              ? Math.round(
                  (progressEvent.loaded * 100) / total,
                )
              : 0;

            updateReport(reportKey, {
              progress: percentCompleted,
            });
          },
        },
      );

      updateReport(reportKey, {
        status: "success",
        progress: 100,
        message: "Validated and uploaded successfully",
        uploadedAt: new Date().toLocaleString(),
        uploadedBy,
      });

      window.dispatchEvent(
        new CustomEvent("reportUploaded", {
          detail: {
            reportType: reportKey,
            fileName: file.name,
          },
        }),
      );

      if (reportKey === "production") {
        window.dispatchEvent(
          new Event("productionUploaded"),
        );
      }
    } catch (error) {
      console.error(
        `Unable to upload ${reportKey} report:`,
        error,
      );

      updateReport(reportKey, {
        status: "error",
        progress: 0,
        message: extractUploadErrorMessage(error),
      });
    }
  };


  const handleRejectedFiles = (
    reportKey,
    rejectedFiles,
  ) => {
    const firstRejection = rejectedFiles?.[0];
    const firstError = firstRejection?.errors?.[0];

    updateReport(reportKey, {
      status: "error",
      progress: 0,
      fileName:
        firstRejection?.file?.name || "",
      message:
        firstError?.message ||
        "Unsupported file. Please upload an Excel or CSV file.",
    });
  };


  const handleGenerateBriefing = async () => {
    if (!allReportsUploaded) {
      return;
    }

    try {
      alert(
        "AI Daily Briefing generation will be connected in the next sprint.",
      );
    } catch (error) {
      console.error(
        "Unable to generate AI Daily Briefing:",
        error,
      );

      alert("Failed to generate briefing.");
    }
  };


  return (
    <div className="upload-page">
      <div className="upload-header">
        <div>
          <h1>Daily Data Center</h1>

          <p>
            Upload daily operational reports to prepare
            Mine Manager AI briefing.
          </p>
        </div>

        <div className="completion-card">
          <span>Data Completeness</span>

          <strong>{completeness}%</strong>

          <div className="completion-bar">
            <div
              className="completion-fill"
              style={{
                width: `${completeness}%`,
              }}
            />
          </div>
        </div>
      </div>


      <div className="upload-grid">
        {Object.entries(REPORT_CONFIG).map(
          ([key, config]) => (
            <UploadCard
              key={key}
              reportKey={key}
              config={config}
              report={reports[key]}
              onUpload={handleUpload}
              onRejected={handleRejectedFiles}
            />
          ),
        )}
      </div>


      <div className="briefing-section">
        <button
          type="button"
          className={`briefing-button ${
            allReportsUploaded
              ? "active"
              : "disabled"
          }`}
          disabled={!allReportsUploaded}
          onClick={handleGenerateBriefing}
        >
          <FaBrain />

          Generate AI Daily Briefing
        </button>

        {!allReportsUploaded && (
          <p>
            Upload all required reports to activate
            the AI Daily Briefing button.
          </p>
        )}
      </div>


      <div className="history-section">
        <h2>Upload History</h2>

        {uploadHistory.length === 0 ? (
          <p className="empty-history">
            No reports uploaded yet.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Report</th>
                <th>File</th>
                <th>User</th>
                <th>Upload Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {uploadHistory.map(
                (item, index) => (
                  <tr
                    key={`${item.report}-${item.fileName}-${index}`}
                  >
                    <td>{item.report}</td>
                    <td>{item.fileName}</td>
                    <td>{item.uploadedBy}</td>
                    <td>{item.uploadedAt}</td>

                    <td>
                      <span className="success-badge">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


function UploadCard({
  reportKey,
  config,
  report,
  onUpload,
  onRejected,
}) {
  const isUploading =
    report.status === "uploading" ||
    report.status === "validating";

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        [".xlsx"],
      "application/vnd.ms-excel": [
        ".xls",
      ],
      "text/csv": [
        ".csv",
      ],
    },

    multiple: false,
    disabled: isUploading,

    onDropAccepted: (acceptedFiles) =>
      onUpload(
        reportKey,
        acceptedFiles,
      ),

    onDropRejected: (rejectedFiles) =>
      onRejected(
        reportKey,
        rejectedFiles,
      ),
  });


  return (
    <div
      className={`upload-card ${report.status}`}
    >
      <div className="card-top">
        <div className="card-icon">
          {config.icon}
        </div>

        <div>
          <h3>{config.title}</h3>

          <p>
            {report.fileName ||
              "No file selected"}
          </p>
        </div>

        <div className="status-icon">
          {report.status === "success" && (
            <FaCheckCircle />
          )}

          {report.status === "error" && (
            <FaExclamationTriangle />
          )}
        </div>
      </div>


      <div
        {...getRootProps()}
        className={`drop-zone ${
          isDragActive
            ? "drag-active"
            : ""
        } ${
          isUploading
            ? "drop-zone-disabled"
            : ""
        }`}
      >
        <input {...getInputProps()} />

        <FaCloudUploadAlt className="upload-cloud" />

        {isUploading ? (
          <p>
            {report.status === "validating"
              ? "Validating file..."
              : "Uploading file..."}
          </p>
        ) : isDragActive ? (
          <p>Drop the Excel file here...</p>
        ) : (
          <p>
            Drag Excel here or click to browse
          </p>
        )}

        <span>
          .xlsx, .xls, .csv supported
        </span>
      </div>


      {(report.status === "uploading" ||
        report.progress > 0) && (
        <div className="progress-area">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${report.progress}%`,
              }}
            />
          </div>

          <span>{report.progress}%</span>
        </div>
      )}


      <div className="report-message">
        {report.message}
      </div>


      <div className="required-columns">
        <strong>Required columns:</strong>

        <p>
          {config.requiredColumns.join(", ")}
        </p>
      </div>
    </div>
  );
}


export default UploadReports;