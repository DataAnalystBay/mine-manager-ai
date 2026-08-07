const normalizeUrl = (url) => url.replace(/\/+$/, "");

const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim();

const developmentApiBaseUrl =
  "http://127.0.0.1:8000";

export const API_BASE_URL = normalizeUrl(
  configuredApiBaseUrl ||
    (import.meta.env.DEV
      ? developmentApiBaseUrl
      : window.location.origin)
);

export const API_URL = `${API_BASE_URL}/api`;
export const DASHBOARD_API_URL = `${API_URL}/dashboard`;