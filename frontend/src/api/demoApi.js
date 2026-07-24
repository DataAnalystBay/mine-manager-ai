import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

export async function loadDemoData() {
  const response = await axios.post(`${API_BASE_URL}/api/demo/load`);
  return response.data;
}

export async function resetDemoData() {
  const response = await axios.post(`${API_BASE_URL}/api/demo/reset`);
  return response.data;
}
