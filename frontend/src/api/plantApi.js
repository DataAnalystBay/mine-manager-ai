import axios from "axios";

import {
  API_BASE_URL,
} from "../config/apiConfig";


const plantClient = axios.create({
  baseURL: `${API_BASE_URL}/api/plant`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});


plantClient.interceptors.request.use(
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


export async function getTodayPlant() {
  try {
    const response =
      await plantClient.get(
        "/today"
      );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load today's plant data."
      ),
      { cause: error }
    );
  }
}


export async function getPlantTrend(
  range = "30D"
) {
  const supportedRanges = [
    "30D",
    "90D",
    "1Y",
    "3Y",
    "5Y",
  ];

  const normalizedRange = String(range || "30D").trim().toUpperCase();

  if (!supportedRanges.includes(normalizedRange)) {
    throw new RangeError(`Unsupported Plant trend range: ${range}`);
  }

  try {
    const response =
      await plantClient.get(
        "/trend",
        {
          params: {
            range: normalizedRange,
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
        "Unable to load plant trend."
      ),
      { cause: error }
    );
  }
}


export default plantClient;
