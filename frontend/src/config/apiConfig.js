const normalizeUrl = (url) => url.replace(/\/+$/, "");

export const API_BASE_URL = normalizeUrl(
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
);

export const API_URL = `${API_BASE_URL}/api`;
export const DASHBOARD_API_URL = `${API_URL}/dashboard`;
