import axios from "axios";
import { API_URL } from "../config/apiConfig";


const executiveInsightsClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});


executiveInsightsClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


executiveInsightsClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendDetail =
      error?.response?.data?.detail;

    const backendMessage =
      error?.response?.data?.message;

    let message =
      "An unexpected error occurred while loading executive insights.";

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
                .filter(
                  (part) =>
                    part !== "query" &&
                    part !== "body"
                )
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
 * Normalize the mine name before sending it to the API.
 *
 * @param {string} mineName
 * @returns {string}
 */
function normalizeMineName(
  mineName
) {
  const normalized = String(
    mineName || "Oyu Tolgoi Surface"
  ).trim();

  return (
    normalized ||
    "Oyu Tolgoi Surface"
  );
}


/**
 * Normalize the optional active Demo Mode scenario.
 *
 * An empty string means the backend should operate
 * in live mode.
 *
 * @param {string} scenario
 * @returns {string}
 */
function normalizeScenario(
  scenario
) {
  return String(
    scenario || ""
  ).trim();
}


/**
 * Load structured AI executive insights.
 *
 * Backend route:
 * GET /api/executive-insights
 *
 * Live-mode example:
 * getExecutiveInsights("Oyu Tolgoi Surface")
 *
 * Demo-mode example:
 * getExecutiveInsights(
 *   "Oyu Tolgoi Surface",
 *   "Fleet Breakdown"
 * )
 *
 * @param {string} mineName
 * @param {string} scenario
 * @returns {Promise<object>}
 */
export async function getExecutiveInsights(
  mineName = "Oyu Tolgoi Surface",
  scenario = ""
) {
  const normalizedMineName =
    normalizeMineName(mineName);

  const normalizedScenario =
    normalizeScenario(scenario);

  const params = {
    mine_name: normalizedMineName,
  };

  if (normalizedScenario) {
    params.scenario =
      normalizedScenario;
  }

  try {
    const response =
      await executiveInsightsClient.get(
        "/executive-insights",
        {
          params,
        }
      );

    return response.data;
  } catch (error) {
    const modeLabel =
      normalizedScenario
        ? `demo scenario "${normalizedScenario}"`
        : "live mode";

    console.error(
      `getExecutiveInsights failed for mine "${normalizedMineName}" in ${modeLabel}:`,
      error
    );

    throw error;
  }
}


/**
 * Check the Executive Insights service health.
 *
 * Backend route:
 * GET /api/executive-insights/health
 *
 * @returns {Promise<object>}
 */
export async function getExecutiveInsightsHealth() {
  try {
    const response =
      await executiveInsightsClient.get(
        "/executive-insights/health"
      );

    return response.data;
  } catch (error) {
    console.error(
      "getExecutiveInsightsHealth failed:",
      error
    );

    throw error;
  }
}


/**
 * Return a user-friendly API error message.
 *
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @returns {string}
 */
export function getExecutiveInsightsErrorMessage(
  error,
  fallbackMessage = "Unable to load executive insights."
) {
  if (
    typeof error?.userMessage === "string" &&
    error.userMessage.trim()
  ) {
    return error.userMessage;
  }

  if (
    typeof error?.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallbackMessage;
}


export default executiveInsightsClient;