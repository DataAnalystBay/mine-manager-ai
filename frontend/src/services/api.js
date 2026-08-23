import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

/*
 * ======================================================
 * Mine Manager AI
 * Shared Authenticated API Client
 * ======================================================
 *
 * All authenticated API services should use this client
 * instead of importing axios directly.
 *
 * Authentication token:
 *   localStorage["access_token"]
 *
 * The fallback "token" key is retained for compatibility
 * with older frontend code.
 */

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

/*
 * ======================================================
 * Authentication Request Interceptor
 * ======================================================
 */

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;