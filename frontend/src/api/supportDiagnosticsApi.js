import axios from "axios";

import { API_BASE_URL } from "../config/apiConfig";

const supportDiagnosticsClient = axios.create({
  baseURL: `${API_BASE_URL}/api/support-diagnostics`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

supportDiagnosticsClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

function extractErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || String(item))
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
    return "Administrator access is required.";
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load support diagnostics."
  );
}

export async function getSupportDiagnostics() {
  try {
    const response =
      await supportDiagnosticsClient.get("");

    return response.data;
  } catch (error) {
    const enhancedError = new Error(
      extractErrorMessage(error),
    );

    enhancedError.status =
      error?.response?.status || null;

    throw enhancedError;
  }
}

export async function getSupportDiagnosticsSummary() {
  try {
    const response =
      await supportDiagnosticsClient.get("/summary");

    return response.data;
  } catch (error) {
    const enhancedError = new Error(
      extractErrorMessage(error),
    );

    enhancedError.status =
      error?.response?.status || null;

    throw enhancedError;
  }
}

export async function downloadSupportDiagnostics() {
  try {
    const response =
      await supportDiagnosticsClient.get("/download", {
        responseType: "blob",
      });

    const contentDisposition =
      response.headers["content-disposition"];

    const filenameMatch =
      contentDisposition?.match(
        /filename="?([^"]+)"?/i,
      );

    const filename =
      filenameMatch?.[1] ||
      "mine_manager_ai_support_diagnostics.json";

    const objectUrl = window.URL.createObjectURL(
      response.data,
    );

    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(objectUrl);

    return filename;
  } catch (error) {
    const enhancedError = new Error(
      extractErrorMessage(error),
    );

    enhancedError.status =
      error?.response?.status || null;

    throw enhancedError;
  }
}

export default {
  getSupportDiagnostics,
  getSupportDiagnosticsSummary,
  downloadSupportDiagnostics,
};