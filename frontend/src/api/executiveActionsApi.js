import axios from "axios";
 
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";
 
const executiveActionsClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});
 
executiveActionsClient.interceptors.request.use(
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
 
executiveActionsClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendDetail =
      error?.response?.data?.detail;
 
    const backendMessage =
      error?.response?.data?.message;
 
    let message =
      "An unexpected error occurred.";
 
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
 
function normalizeStatus(status) {
  const normalized = String(status || "Open")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
 
  const statusMap = {
    open: "open",
    to_do: "open",
    todo: "open",
    in_progress: "in_progress",
    blocked: "blocked",
    completed: "completed",
    complete: "completed",
  };
 
  return statusMap[normalized] || "open";
}
 
function normalizePriority(priority) {
  const normalized = String(
    priority || "Medium"
  )
    .trim()
    .toLowerCase();
 
  const priorityMap = {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
  };
 
  return priorityMap[normalized] || "medium";
}
 
function normalizeSource(source) {
  const normalized = String(
    source || "Manual"
  )
    .trim()
    .toLowerCase();
 
  return normalized === "ai"
    ? "ai"
    : "manual";
}
 
function createManualActionKey() {
  const timestamp = Date.now();
 
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 8);
 
  return `manual_action_${timestamp}_${randomPart}`;
}
 
function normalizeExecutiveActionPayload(
  payload = {},
  options = {}
) {
  const title =
    payload.title ||
    payload.action_title ||
    payload.recommended_action ||
    payload.action ||
    "";
 
  const actionKey =
    payload.action_key ||
    options.existingActionKey ||
    createManualActionKey();
 
  const kpiKey =
    payload.kpi_key ||
    options.existingKpiKey ||
    "manual_management_action";
 
  return {
    action_key: actionKey,
    kpi_key: kpiKey,
 
    title: String(title).trim(),
 
    description: String(
      payload.description ||
        payload.action_description ||
        payload.recommendation ||
        ""
    ).trim(),
 
    owner: String(
      payload.owner ||
        payload.owner_name ||
        payload.assigned_to ||
        ""
    ).trim(),
 
    priority: normalizePriority(
      payload.priority
    ),
 
    status: normalizeStatus(
      payload.status
    ),
 
    due_date:
      payload.due_date ||
      payload.target_date ||
      null,
 
    category:
      payload.category ||
      payload.action_category ||
      "Operations",
 
    source: normalizeSource(
      payload.source ||
        payload.action_source ||
        "Manual"
    ),
  };
}
 
/**
 * Load executive actions.
 */
export async function getExecutiveActions(
  params = {}
) {
  try {
    const response =
      await executiveActionsClient.get(
        "/executive-actions",
        {
          params,
        }
      );
 
    return response.data;
  } catch (error) {
    console.error(
      "getExecutiveActions failed:",
      error
    );
 
    throw error;
  }
}
 
/**
 * Load one executive action by database ID.
 */
export async function getExecutiveAction(
  actionId
) {
  if (!actionId) {
    throw new Error(
      "Executive action ID is required."
    );
  }
 
  try {
    const response =
      await executiveActionsClient.get(
        `/executive-actions/${actionId}`
      );
 
    return response.data;
  } catch (error) {
    console.error(
      `getExecutiveAction failed for ID ${actionId}:`,
      error
    );
 
    throw error;
  }
}
 
/**
 * Load one executive action by its action key.
 */
export async function getExecutiveActionByKey(
  actionKey
) {
  if (!actionKey) {
    throw new Error(
      "Executive action key is required."
    );
  }
 
  try {
    const response =
      await executiveActionsClient.get(
        `/executive-actions/by-key/${encodeURIComponent(
          actionKey
        )}`
      );
 
    return response.data;
  } catch (error) {
    console.error(
      `getExecutiveActionByKey failed for key ${actionKey}:`,
      error
    );
 
    throw error;
  }
}
 
/**
 * Load summary cards for the Executive Action Center.
 */
export async function getExecutiveActionSummary() {
  try {
    const response =
      await executiveActionsClient.get(
        "/executive-actions/summary"
      );
 
    return response.data;
  } catch (error) {
    console.error(
      "getExecutiveActionSummary failed:",
      error
    );
 
    throw error;
  }
}
 
/**
 * Load analytics for the Executive Action Center.
 *
 * Backend route:
 * GET /api/executive-actions/analytics
 */
export async function getExecutiveActionAnalytics() {
  try {
    const response =
      await executiveActionsClient.get(
        "/executive-actions/analytics"
      );
 
    return response.data;
  } catch (error) {
    console.error(
      "getExecutiveActionAnalytics failed:",
      error
    );
 
    throw error;
  }
}
 
/**
 * Create a manually entered executive action.
 */
export async function createExecutiveAction(
  payload
) {
  const normalizedPayload =
    normalizeExecutiveActionPayload({
      ...payload,
      source: payload?.source || "Manual",
    });
 
  if (!normalizedPayload.title) {
    throw new Error(
      "Executive action title is required."
    );
  }
 
  if (!normalizedPayload.owner) {
    throw new Error(
      "Executive action owner is required."
    );
  }
 
  try {
    const response =
      await executiveActionsClient.post(
        "/executive-actions",
        normalizedPayload
      );
 
    return response.data;
  } catch (error) {
    console.error(
      "createExecutiveAction failed:",
      error
    );
 
    throw error;
  }
}
 
/**
 * Update an existing executive action.
 *
 * Backend route:
 * PATCH /api/executive-actions/{action_id}
 */
export async function updateExecutiveAction(
  actionId,
  payload
) {
  if (!actionId) {
    throw new Error(
      "Executive action ID is required."
    );
  }
 
  const normalizedPayload =
    normalizeExecutiveActionPayload(
      payload,
      {
        existingActionKey:
          payload?.action_key,
 
        existingKpiKey:
          payload?.kpi_key,
      }
    );
 
  if (!normalizedPayload.title) {
    throw new Error(
      "Executive action title is required."
    );
  }
 
  try {
    const response =
      await executiveActionsClient.patch(
        `/executive-actions/${actionId}`,
        normalizedPayload
      );
 
    return response.data;
  } catch (error) {
    console.error(
      `updateExecutiveAction failed for ID ${actionId}:`,
      error
    );
 
    throw error;
  }
}
 
/**
 * Partially update an executive action.
 */
export async function patchExecutiveAction(
  actionId,
  payload
) {
  if (!actionId) {
    throw new Error(
      "Executive action ID is required."
    );
  }
 
  const patchPayload = {
    ...payload,
  };
 
  if (payload?.status) {
    patchPayload.status =
      normalizeStatus(payload.status);
  }
 
  if (payload?.priority) {
    patchPayload.priority =
      normalizePriority(payload.priority);
  }
 
  if (payload?.source) {
    patchPayload.source =
      normalizeSource(payload.source);
  }
 
  try {
    const response =
      await executiveActionsClient.patch(
        `/executive-actions/${actionId}`,
        patchPayload
      );
 
    return response.data;
  } catch (error) {
    console.error(
      `patchExecutiveAction failed for ID ${actionId}:`,
      error
    );
 
    throw error;
  }
}
 
/**
 * Update only the status of an executive action.
 *
 * Backend route:
 * PATCH /api/executive-actions/{action_id}/status
 */
export async function updateExecutiveActionStatus(
  actionId,
  status
) {
  if (!actionId) {
    throw new Error(
      "Executive action ID is required."
    );
  }
 
  if (!status) {
    throw new Error(
      "Executive action status is required."
    );
  }
 
  try {
    const response =
      await executiveActionsClient.patch(
        `/executive-actions/${actionId}/status`,
        {
          status: normalizeStatus(status),
        }
      );
 
    return response.data;
  } catch (error) {
    console.error(
      `updateExecutiveActionStatus failed for ID ${actionId}:`,
      error
    );
 
    throw error;
  }
}
 
/**
 * Delete an executive action.
 */
export async function deleteExecutiveAction(
  actionId
) {
  if (!actionId) {
    throw new Error(
      "Executive action ID is required."
    );
  }
 
  try {
    const response =
      await executiveActionsClient.delete(
        `/executive-actions/${actionId}`
      );
 
    return response.data;
  } catch (error) {
    console.error(
      `deleteExecutiveAction failed for ID ${actionId}:`,
      error
    );
 
    throw error;
  }
}
 
export default executiveActionsClient;
