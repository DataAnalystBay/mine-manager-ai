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
    requiredColumns: ["report_date", "truck_id", "availability", "utilization"],
  },
  plant: {
    title: "Plant Report",
    icon: <FaLeaf />,
    endpoint: "/upload/plant",
    requiredColumns: ["report_date", "feed", "throughput", "recovery"],
  },
  safety: {
    title: "Safety Report",
    icon: <FaHardHat />,
    endpoint: "/upload/safety",
    requiredColumns: ["report_date", "lti", "tri", "near_miss"],
  },
};

function UploadReports() {
  const [reports, setReports] = useState(() => {
    const initialState = {};

    Object.keys(REPORT_CONFIG).forEach((key) => {
      initialState[key] = {
        status: "waiting",
        fileName: "",
        progress: 0,
        message: "Waiting for upload",
        uploadedAt: "",
        uploadedBy: "Bayarbat",
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
    (report) => report.status === "success"
  ).length;

  const completeness = Math.round(
    (completedCount / Object.keys(REPORT_CONFIG).length) * 100
  );

  const allReportsUploaded = completedCount === Object.keys(REPORT_CONFIG).length;

  const normalizeColumn = (column) =>
    String(column).trim().toLowerCase().replace(/\s+/g, "_");

  const validateExcelColumns = async (file, requiredColumns) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    });

    if (!rows || rows.length === 0) {
      return {
        valid: false,
        missingColumns: requiredColumns,
      };
    }

    const headerRow = rows[0].map(normalizeColumn);

    const missingColumns = requiredColumns.filter(
      (column) => !headerRow.includes(normalizeColumn(column))
    );

    return {
      valid: missingColumns.length === 0,
      missingColumns,
    };
  };

  const handleUpload = async (reportKey, acceptedFiles) => {
    const file = acceptedFiles[0];

    if (!file) return;

    const config = REPORT_CONFIG[reportKey];

    setReports((prev) => ({
      ...prev,
      [reportKey]: {
        ...prev[reportKey],
        status: "validating",
        fileName: file.name,
        progress: 0,
        message: "Validating Excel columns...",
      },
    }));

    try {
      const validation = await validateExcelColumns(file, config.requiredColumns);

      if (!validation.valid) {
        setReports((prev) => ({
          ...prev,
          [reportKey]: {
            ...prev[reportKey],
            status: "error",
            progress: 0,
            message: `Missing columns: ${validation.missingColumns.join(", ")}`,
          },
        }));
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      setReports((prev) => ({
        ...prev,
        [reportKey]: {
          ...prev[reportKey],
          status: "uploading",
          message: "Uploading report...",
        },
      }));

      await axios.post(`${API_BASE_URL}${config.endpoint}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );

          setReports((prev) => ({
            ...prev,
            [reportKey]: {
              ...prev[reportKey],
              progress: percentCompleted,
            },
          }));
        },
      });

      setReports((prev) => ({
        ...prev,
        [reportKey]: {
          ...prev[reportKey],
          status: "success",
          progress: 100,
          message: "Validated and uploaded successfully",
          uploadedAt: new Date().toLocaleString(),
        },
      }));

      if (reportKey === "production") {
        window.dispatchEvent(new Event("productionUploaded"));
      }
    } catch (error) {
      setReports((prev) => ({
        ...prev,
        [reportKey]: {
          ...prev[reportKey],
          status: "error",
          progress: 0,
          message:
            error.response?.data?.detail ||
            "Upload failed. Please check backend endpoint.",
        },
      }));
    }
  };

  const handleGenerateBriefing = async () => {
    if (!allReportsUploaded) return;

    try {
      alert("AI Daily Briefing generation will be connected in the next sprint.");
    } catch (error) {
      alert("Failed to generate briefing.");
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
        <div>
          <h1>Daily Data Center</h1>
          <p>
            Upload daily operational reports to prepare Mine Manager AI briefing.
          </p>
        </div>

        <div className="completion-card">
          <span>Data Completeness</span>
          <strong>{completeness}%</strong>
          <div className="completion-bar">
            <div
              className="completion-fill"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </div>

      <div className="upload-grid">
        {Object.entries(REPORT_CONFIG).map(([key, config]) => (
          <UploadCard
            key={key}
            reportKey={key}
            config={config}
            report={reports[key]}
            onUpload={handleUpload}
          />
        ))}
      </div>

      <div className="briefing-section">
        <button
          className={`briefing-button ${
            allReportsUploaded ? "active" : "disabled"
          }`}
          disabled={!allReportsUploaded}
          onClick={handleGenerateBriefing}
        >
          <FaBrain />
          Generate AI Daily Briefing
        </button>

        {!allReportsUploaded && (
          <p>
            Upload all required reports to activate the AI Daily Briefing button.
          </p>
        )}
      </div>

      <div className="history-section">
        <h2>Upload History</h2>

        {uploadHistory.length === 0 ? (
          <p className="empty-history">No reports uploaded yet.</p>
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
              {uploadHistory.map((item, index) => (
                <tr key={index}>
                  <td>{item.report}</td>
                  <td>{item.fileName}</td>
                  <td>{item.uploadedBy}</td>
                  <td>{item.uploadedAt}</td>
                  <td>
                    <span className="success-badge">{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function UploadCard({ reportKey, config, report, onUpload }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
    onDrop: (acceptedFiles) => onUpload(reportKey, acceptedFiles),
  });

  return (
    <div className={`upload-card ${report.status}`}>
      <div className="card-top">
        <div className="card-icon">{config.icon}</div>
        <div>
          <h3>{config.title}</h3>
          <p>{report.fileName || "No file selected"}</p>
        </div>

        <div className="status-icon">
          {report.status === "success" && <FaCheckCircle />}
          {report.status === "error" && <FaExclamationTriangle />}
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`drop-zone ${isDragActive ? "drag-active" : ""}`}
      >
        <input {...getInputProps()} />

        <FaCloudUploadAlt className="upload-cloud" />

        {isDragActive ? (
          <p>Drop the Excel file here...</p>
        ) : (
          <p>Drag Excel here or click to browse</p>
        )}

        <span>.xlsx, .xls, .csv supported</span>
      </div>

      {(report.status === "uploading" || report.progress > 0) && (
        <div className="progress-area">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${report.progress}%` }}
            />
          </div>
          <span>{report.progress}%</span>
        </div>
      )}

      <div className="report-message">{report.message}</div>

      <div className="required-columns">
        <strong>Required columns:</strong>
        <p>{config.requiredColumns.join(", ")}</p>
      </div>
    </div>
  );
}

export default UploadReports;