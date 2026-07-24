import axios from "axios";
import { DASHBOARD_API_URL } from "../config/apiConfig";

export const getExecutiveSummary = async (mineName) => {
  const response = await axios.get(
    `${DASHBOARD_API_URL}/executive-summary`,
    {
      params: {
        mine_name: mineName,
      },
    }
  );

  return response.data;
};

export const getAIBriefing = async (mineName) => {
  const response = await axios.get(
    `${DASHBOARD_API_URL}/ai-briefing`,
    {
      params: {
        mine_name: mineName,
      },
    }
  );

  return response.data;
};

export const getPriorityActions = async (mineName) => {
  const response = await axios.get(
    `${DASHBOARD_API_URL}/priority-actions`,
    {
      params: {
        mine_name: mineName,
      },
    }
  );

  return response.data;
};

export const getRiskRegister = async (mineName) => {
  const response = await axios.get(
    `${DASHBOARD_API_URL}/risk-register`,
    {
      params: {
        mine_name: mineName,
      },
    }
  );

  return response.data;
};

export const getHealthHistory = async (mineName) => {
  const response = await axios.get(
    `${DASHBOARD_API_URL}/health-history`,
    {
      params: {
        mine_name: mineName,
      },
    }
  );

  return response.data;
};

export const getTrendAnalysis = async (mineName) => {
  const response = await axios.get(
    `${DASHBOARD_API_URL}/trend-analysis`,
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
    const response = await axios.get(
      `${DASHBOARD_API_URL}/shared-analytics`,
      {
        params: {
          mine_name: mineName,
          days,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to load shared analytics:", error);
    throw error;
  }
};

export const getKpiDetail = async (
  mineName,
  kpiName,
  days = 7
) => {
  try {
    const response = await axios.get(
      `${DASHBOARD_API_URL}/kpi-detail`,
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
    console.error("Failed to load KPI detail:", error);
    throw error;
  }
};
