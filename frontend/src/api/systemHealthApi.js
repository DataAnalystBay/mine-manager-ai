import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

/**
 * Load complete system health.
 *
 * forceRefresh = true
 * -> bypass backend cache
 *
 * forceRefresh = false
 * -> use backend cache (default)
 */
export async function getSystemHealth(forceRefresh = false) {
  const response = await axios.get(
    `${API_BASE_URL}/api/system-health`,
    {
      params: {
        force_refresh: forceRefresh,
      },
    }
  );

  return response.data;
}

/**
 * Lightweight backend ping.
 */
export async function pingSystemHealth() {
  const response = await axios.get(
    `${API_BASE_URL}/api/system-health/ping`
  );

  return response.data;
}