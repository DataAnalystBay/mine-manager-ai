import axios from "axios";

import {
  API_BASE_URL,
} from "../config/apiConfig";


const systemHealthClient = axios.create({
  baseURL: `${API_BASE_URL}/api/system-health`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});


systemHealthClient.interceptors.request.use(
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


/**
 * Load complete system health.
 *
 * forceRefresh = true
 * -> bypass backend cache
 *
 * forceRefresh = false
 * -> use backend cache (default)
 */
export async function getSystemHealth(
  forceRefresh = false
) {
  const response =
    await systemHealthClient.get(
      "",
      {
        params: {
          force_refresh:
            forceRefresh,
        },
      }
    );

  return response.data;
}


/**
 * Lightweight backend ping.
 */
export async function pingSystemHealth() {
  const response =
    await systemHealthClient.get(
      "/ping"
    );

  return response.data;
}


export default systemHealthClient;