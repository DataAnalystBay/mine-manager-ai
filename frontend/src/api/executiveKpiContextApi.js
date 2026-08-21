import axios from "axios";
import {
  API_BASE_URL,
} from "../config/apiConfig";


const executiveKpiContextApi =
  axios.create({
    baseURL: API_BASE_URL,

    timeout: 15000,

    headers: {
      "Content-Type":
        "application/json",
    },
  });


/*
 * Attach the current authentication
 * token to every KPI-context request.
 *
 * This must match the authentication
 * pattern used by executiveActionsApi.js.
 */
executiveKpiContextApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "access_token"
      ) ||
      localStorage.getItem(
        "token"
      );

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);


/*
 * Preserve useful backend error
 * information for callers.
 */
executiveKpiContextApi.interceptors.response.use(
  (response) => response,

  (error) =>
    Promise.reject(error)
);


function normalizeActionId(
  actionId
) {
  const parsedActionId =
    Number(actionId);

  if (
    !Number.isInteger(
      parsedActionId
    ) ||
    parsedActionId <= 0
  ) {
    throw new Error(
      "A valid executive action ID is required."
    );
  }

  return parsedActionId;
}


function getErrorMessage(error) {
  if (axios.isCancel(error)) {
    return (
      "The KPI context request was cancelled."
    );
  }

  const responseDetail =
    error?.response?.data?.detail;

  const responseMessage =
    error?.response?.data?.message;


  if (
    typeof responseDetail ===
      "string" &&
    responseDetail.trim()
  ) {
    return responseDetail;
  }


  if (
    Array.isArray(
      responseDetail
    ) &&
    responseDetail.length > 0
  ) {
    return responseDetail
      .map(
        (item) =>
          item?.msg ||
          item?.message ||
          "Validation error"
      )
      .join(", ");
  }


  if (
    typeof responseMessage ===
      "string" &&
    responseMessage.trim()
  ) {
    return responseMessage;
  }


  if (
    error?.code ===
    "ECONNABORTED"
  ) {
    return (
      "The KPI context request timed out."
    );
  }


  if (!error?.response) {
    return (
      error?.message ||
      "Unable to connect to the Mine Manager AI backend."
    );
  }


  return (
    error?.message ||
    "Unable to load executive action KPI context."
  );
}


/**
 * Loads live KPI context
 * for one executive action.
 *
 * Expected backend endpoint:
 *
 * GET
 * /api/executive-actions/{actionId}/kpi-context
 *
 * @param {number|string} actionId
 * @param {{ signal?: AbortSignal }} options
 *
 * @returns {Promise<{
 *   linked: boolean,
 *   message: string,
 *   context: null | {
 *     kpi_key: string,
 *     current_value: number,
 *     target_value: number,
 *     status: string,
 *     root_cause?: string
 *   }
 * }>}
 */
export async function getExecutiveActionKpiContext(
  actionId,
  options = {}
) {
  const normalizedActionId =
    normalizeActionId(
      actionId
    );


  try {
    const response =
      await executiveKpiContextApi.get(
        `/api/executive-actions/${normalizedActionId}/kpi-context`,
        {
          signal:
            options.signal,
        }
      );

    return response.data;
  } catch (error) {
    const apiError =
      new Error(
        getErrorMessage(
          error
        )
      );

    apiError.status =
      error?.response?.status;

    apiError.data =
      error?.response?.data;

    apiError.originalError =
      error;

    throw apiError;
  }
}


export default executiveKpiContextApi;