import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

/**
 * Load complete system health.
 */
export async function getSystemHealth() {
  const response = await axios.get(
    `${API_BASE_URL}/api/system-health`
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