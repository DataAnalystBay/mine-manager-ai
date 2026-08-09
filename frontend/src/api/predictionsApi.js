import axios from "axios";

import { API_BASE_URL } from "../config/apiConfig";

const predictionsClient = axios.create({
  baseURL: `${API_BASE_URL}/api/predictions`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

predictionsClient.interceptors.request.use(
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

/**
 * Fetch Predictive Intelligence for the selected mine.
 *
 * @param {string} mineName
 * @returns {Promise}
 */
export async function getPredictionSummary(
  mineName = "Oyu Tolgoi Surface"
) {
  const normalizedMineName =
    String(mineName || "").trim() ||
    "Oyu Tolgoi Surface";

  try {
    const response =
      await predictionsClient.get(
        "/summary",
        {
          params: {
            mine_name: normalizedMineName,
          },
        }
      );

    return response.data;
  } catch (error) {
    const detail =
      error?.response?.data?.detail ||
      error?.message ||
      "Unable to load Predictive Intelligence.";

    throw new Error(detail);
  }
}

export default predictionsClient;