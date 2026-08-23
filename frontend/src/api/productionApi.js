import axios from "axios";

import {
  API_BASE_URL,
} from "../config/apiConfig";


const productionClient = axios.create({
  baseURL:
    `${API_BASE_URL}/api/production`,

  headers: {
    "Content-Type":
      "application/json",
  },

  timeout:
    20000,
});


productionClient
  .interceptors
  .request
  .use(
    (config) => {
      const token =
        localStorage.getItem(
          "access_token"
        ) ||
        localStorage.getItem(
          "token"
        );

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }

      return config;
    },

    (error) =>
      Promise.reject(
        error
      )
  );


function getErrorMessage(
  error,
  fallbackMessage
) {
  const detail =
    error
      ?.response
      ?.data
      ?.detail;

  if (
    typeof detail ===
      "string" &&
    detail.trim()
  ) {
    return detail;
  }

  if (
    typeof error?.message ===
      "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallbackMessage;
}


// ============================================================
// Supported Historical Ranges
// ============================================================

export const
  SUPPORTED_PRODUCTION_RANGES = [
    "30D",
    "90D",
    "1Y",
    "3Y",
    "5Y",
  ];


function normalizeProductionRange(
  range
) {
  const normalized =
    String(
      range || "30D"
    )
      .trim()
      .toUpperCase();

  return (
    SUPPORTED_PRODUCTION_RANGES
      .includes(
        normalized
      )
      ? normalized
      : "30D"
  );
}


// ============================================================
// TODAY
// ============================================================

export async function
getTodayProduction() {
  try {
    const response =
      await productionClient.get(
        "/today"
      );

    return response.data;

  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        (
          "Unable to load today's "
          + "production data."
        )
      )
    );
  }
}


// ============================================================
// TREND
// ============================================================

export async function
getProductionTrend(
  range = "30D"
) {
  const normalizedRange =
    normalizeProductionRange(
      range
    );

  try {
    const response =
      await productionClient.get(
        "/trend",
        {
          params: {
            range:
              normalizedRange,
          },
        }
      );

    return Array.isArray(
      response.data
    )
      ? response.data
      : [];

  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        (
          "Unable to load "
          + "production trend."
        )
      )
    );
  }
}


// ============================================================
// Default Export
// ============================================================

export default productionClient;