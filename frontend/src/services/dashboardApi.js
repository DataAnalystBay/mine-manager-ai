import axios from "axios";
import { DASHBOARD_API_URL } from "../config/apiConfig";

const dashboardClient = axios.create({
  baseURL: DASHBOARD_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

dashboardClient.interceptors.request.use(
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

export const getExecutiveSummary = async (mineName) => {
  const response = await dashboardClient.get(
    "/executive-summary",
    {
      params: {
        mine_name: mineName,
      },
    }
  );

  return response.data;
};

export const getAIBriefing = async (mineName) => {
  const response = await dashboardClient.get(
    "/ai-briefing",
    {
      params: {
        mine_name: mineName,
      },
    }
  );

  return response.data;
};

export const getPriorityActions = async (mineName) => {
  const response = await dashboardClient.get(
    "/priority-actions",
    {
      params: {
        mine_name: mineName,
      },
    }
  );

  return response.data;
};

export const getRiskRegister = async (mineName) => {
  const response = await dashboardClient.get(
    "/risk-register",
    {
      params: {
        mine_name: mineName,
      },
    }
  );

  return response.data;
};

export const getHealthHistory = async (mineName) => {
  const response = await dashboardClient.get(
    "/health-history",
    {
      params: {
        mine_name: mineName,
      },
    }
  );

  return response.data;
};

export const getTrendAnalysis = async (mineName) => {
  const response = await dashboardClient.get(
    "/trend-analysis",
    {
      params: {
        mine_name: mineName,
      },
    }
  );

  return response.data;
};

/**
 * Shared Analytics Engine
 *
 * Used by:
 * - Executive Dashboard
 * - KPI Trend Cards
 * - Executive Reports
 * - AI Briefing
 */
export const getSharedAnalytics = async (
  mineName = "Oyu Tolgoi Surface",
  days = 7
) => {
  try {
    const response = await dashboardClient.get(
      "/shared-analytics",
      {
        params: {
          mine_name: mineName,
          days,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Failed to load shared analytics:",
      error
    );
    throw error;
  }
};

export const getKpiDetail = async (
  mineName,
  kpiName,
  days = 7
) => {
  try {
    const response = await dashboardClient.get(
      "/kpi-detail",
      {
        params: {
          mine_name: mineName,
          kpi_name: kpiName,
          days,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Failed to load KPI detail:",
      error
    );
    throw error;
  }
};

export default dashboardClient;