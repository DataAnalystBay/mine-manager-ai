import axios from "axios";

import {
  API_BASE_URL,
} from "../config/apiConfig";


const fleetClient = axios.create({
  baseURL: `${API_BASE_URL}/api/fleet`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});


fleetClient.interceptors.request.use(
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


function getErrorMessage(
  error,
  fallbackMessage
) {
  const detail =
    error?.response?.data?.detail;

  if (
    typeof detail === "string" &&
    detail.trim()
  ) {
    return detail;
  }

  if (
    typeof error?.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallbackMessage;
}


export async function getTodayFleet(
  mineName
) {
  try {
    const response =
      await fleetClient.get(
        "/today",
        {
          params: mineName
            ? { mine_name: mineName }
            : undefined,
        }
      );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load today's fleet data."
      ),
      { cause: error }
    );
  }
}


export async function getFleetTrend(
  period = "30D",
  legacyDays
) {
  const supportedRanges = [
    "30D",
    "90D",
    "1Y",
    "3Y",
    "5Y",
  ];
  const isLegacyDaysOnly =
    typeof period === "number";
  const isLegacyMineAndDays =
    typeof legacyDays === "number";
  const normalizedPeriod = String(
    period || "30D"
  ).trim();
  const normalizedRange =
    normalizedPeriod.toUpperCase();
  const looksLikeRange =
    /^\d+[DYM]$/.test(normalizedRange);

  let params;

  if (isLegacyMineAndDays) {
    params = {
      mine_name: normalizedPeriod,
      days: legacyDays,
    };
  } else if (isLegacyDaysOnly) {
    params = { days: period };
  } else if (
    supportedRanges.includes(
      normalizedRange
    )
  ) {
    params = { range: normalizedRange };
  } else if (!looksLikeRange) {
    params = {
      mine_name: normalizedPeriod,
      days: 30,
    };
  } else {
    throw new Error(
      "Unsupported Fleet trend range."
    );
  }

  try {
    const response =
      await fleetClient.get(
        "/trend",
        {
          params,
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
        "Unable to load fleet trend."
      ),
      { cause: error }
    );
  }
}


export default fleetClient;
