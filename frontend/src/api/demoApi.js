import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";


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

  const response = await axios.post(
    `${API_BASE_URL}/api/demo/load`,
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

  const response = await axios.post(
    `${API_BASE_URL}/api/demo/reset`,
    mineName
      ? {
          mine_name: mineName,
        }
      : {}
  );

  return response.data;
}