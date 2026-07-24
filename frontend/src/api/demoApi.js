import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function loadDemoData() {
  const response = await axios.post(`${API_BASE_URL}/api/demo/load`);
  return response.data;
}

export async function resetDemoData() {
  const response = await axios.post(`${API_BASE_URL}/api/demo/reset`);
  return response.data;
}