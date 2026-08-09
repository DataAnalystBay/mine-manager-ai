import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const demoClient = axios.create({
  baseURL: `${API_BASE_URL}/api/demo`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

demoClient.interceptors.request.use(
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

function normalizeDemoPayload(payload = {}) {
  const scenario = String(
    payload.scenario || "High Performing Mine"
  ).trim();

  const mineName = String(
    payload.mine_name ||
      payload.mineName ||
      "Oyu Tolgoi Surface"
  ).trim();

  return {
    scenario:
      scenario || "High Performing Mine",

    mine_name:
      mineName || "Oyu Tolgoi Surface",
  };
}

export async function loadDemoData(
  payload = {}
) {
  const requestPayload =
    normalizeDemoPayload(payload);

  const response = await demoClient.post(
    "/load",
    requestPayload
  );

  return response.data;
}

export async function resetDemoData(
  payload = {}
) {
  const mineName = String(
    payload.mine_name ||
      payload.mineName ||
      ""
  ).trim();

  const response = await demoClient.post(
    "/reset",
    mineName
      ? {
          mine_name: mineName,
        }
      : {}
  );

  return response.data;
}

export default demoClient;