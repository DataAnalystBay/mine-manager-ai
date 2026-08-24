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
      )
    );
  }
}


export async function getPlantTrend(
  days = 30
) {
  try {
    const response =
      await plantClient.get(
        "/trend",
        {
          params: {
            days,
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
      )
    );
  }
}


export default plantClient;