cd /Users/Booboo/mine-manager-ai

cat > frontend/src/api/configApi.js <<'EOF'
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

// ======================================================
// Company Configuration
// ======================================================

export const getCompanyConfig = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/config/company`
  );
  return response.data;
};

export const updateCompany = async (data) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/config/company`,
    data
  );
  return response.data;
};

// ======================================================
// Mine Configuration
// ======================================================

export const getMineConfig = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/config/mine`
  );
  return response.data;
};

export const updateMine = async (data) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/config/mine`,
    data
  );
  return response.data;
};

// ======================================================
// KPI Targets
// ======================================================

export const getKpiTargets = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/config/kpi-targets`
  );
  return response.data;
};

export const updateKpiTarget = async (kpiId, data) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/config/kpi-targets/${kpiId}`,
    data
  );
  return response.data;
};

// ======================================================
// Alert Thresholds
// ======================================================

export const getAlertThresholds = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/config/alert-thresholds`
  );
  return response.data;
};

export const updateAlertThreshold = async (alertId, data) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/config/alert-thresholds/${alertId}`,
    data
  );

  return response.data;
};

// ======================================================
// Shift Patterns
// ======================================================

export const getShiftPatterns = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/config/shift-patterns`
  );
  return response.data;
};

export const updateShiftPattern = async (shiftId, data) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/config/shift-patterns/${shiftId}`,
    data
  );
  return response.data;
};

// ======================================================
// Complete Configuration
// ======================================================

export const getFullConfig = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/config/full`
  );
  return response.data;
};

// ======================================================
// Company Logo Upload
// ======================================================

export const uploadLogo = async (file) => {
  if (!file) {
    throw new Error("Please select a logo file.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${API_BASE_URL}/api/config/upload-logo`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
EOF