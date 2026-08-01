import axios from "axios";
import { API_URL } from "../config/apiConfig";


const auditLogClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});


auditLogClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


auditLogClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendDetail =
      error?.response?.data?.detail;

    const backendMessage =
      error?.response?.data?.message;

    let message =
      "Unable to load audit logs.";

    if (typeof backendDetail === "string") {
      message = backendDetail;
    } else if (Array.isArray(backendDetail)) {
      message = backendDetail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          const location = Array.isArray(item?.loc)
            ? item.loc
                .filter((part) => part !== "body")
                .join(".")
            : "";

          const itemMessage =
            item?.msg ||
            item?.message ||
            "Validation error";

          return location
            ? `${location}: ${itemMessage}`
            : itemMessage;
        })
        .join(", ");
    } else if (
      typeof backendMessage === "string"
    ) {
      message = backendMessage;
    } else if (error?.message) {
      message = error.message;
    }

    error.userMessage = message;

    return Promise.reject(error);
  }
);


/**
 * Load a paginated and filtered list of audit logs.
 *
 * Supported parameters:
 * - page
 * - pageSize
 * - search
 * - action
 * - actorEmail
 * - entityType
 * - status
 * - startDate
 * - endDate
 */
export async function getAuditLogs({
  page = 1,
  pageSize = 20,
  search = "",
  action = "",
  actorEmail = "",
  entityType = "",
  status = "",
  startDate = "",
  endDate = "",
} = {}) {
  try {
    const params = {
      page,
      page_size: pageSize,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (action.trim()) {
      params.action = action.trim();
    }

    if (actorEmail.trim()) {
      params.actor_email =
        actorEmail.trim();
    }

    if (entityType.trim()) {
      params.entity_type =
        entityType.trim();
    }

    if (status.trim()) {
      params.status = status.trim();
    }

    if (startDate) {
      params.start_date = startDate;
    }

    if (endDate) {
      params.end_date = endDate;
    }

    const response = await auditLogClient.get(
      "/audit-logs",
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "getAuditLogs failed:",
      error
    );

    throw error;
  }
}


/**
 * Load one audit log by ID.
 *
 * This backend endpoint will be added later.
 */
export async function getAuditLog(
  auditLogId
) {
  if (!auditLogId) {
    throw new Error(
      "Audit log ID is required."
    );
  }

  try {
    const response = await auditLogClient.get(
      `/audit-logs/${auditLogId}`
    );

    return response.data;
  } catch (error) {
    console.error(
      "getAuditLog failed:",
      error
    );

    throw error;
  }
}


/**
 * Export filtered audit logs as PDF.
 *
 * The backend export endpoint will be added later.
 */
export async function exportAuditLogsPdf(
  params = {}
) {
  try {
    const response = await auditLogClient.get(
      "/audit-logs/export/pdf",
      {
        params,
        responseType: "blob",
      }
    );

    return response;
  } catch (error) {
    console.error(
      "exportAuditLogsPdf failed:",
      error
    );

    throw error;
  }
}


/**
 * Export filtered audit logs as Excel.
 *
 * The backend export endpoint will be added later.
 */
export async function exportAuditLogsExcel(
  params = {}
) {
  try {
    const response = await auditLogClient.get(
      "/audit-logs/export/excel",
      {
        params,
        responseType: "blob",
      }
    );

    return response;
  } catch (error) {
    console.error(
      "exportAuditLogsExcel failed:",
      error
    );

    throw error;
  }
}


export default auditLogClient;