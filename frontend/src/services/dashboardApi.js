import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api/dashboard";

export const getExecutiveSummary = async (mineName) => {
  const response = await axios.get(`${API_BASE_URL}/executive-summary`, {
    params: {
      mine_name: mineName,
    },
  });

  return response.data;
};

export const getAIBriefing = async (mineName) => {
  const response = await axios.get(`${API_BASE_URL}/ai-briefing`, {
    params: {
      mine_name: mineName,
    },
  });

  return response.data;
};

export const getPriorityActions = async (mineName) => {
  const response = await axios.get(`${API_BASE_URL}/priority-actions`, {
    params: {
      mine_name: mineName,
    },
  });

  return response.data;
};

export const getRiskRegister = async (mineName) => {
  const response = await axios.get(`${API_BASE_URL}/risk-register`, {
    params: {
      mine_name: mineName,
    },
  });

  return response.data;
};

export const getHealthHistory = async (mineName) => {
  const response = await axios.get(`${API_BASE_URL}/health-history`, {
    params: {
      mine_name: mineName,
    },
  });

  return response.data;
};

export const getTrendAnalysis = async (mineName) => {
  const response = await axios.get(`${API_BASE_URL}/trend-analysis`, {
    params: {
      mine_name: mineName,
    },
  });

  return response.data;
};