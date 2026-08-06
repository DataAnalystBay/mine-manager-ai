import axios from "axios";

import { API_BASE_URL } from "../config/apiConfig";


const deploymentReadinessClient = axios.create({
  baseURL: `${API_BASE_URL}/api/deployment-readiness`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});


deploymentReadinessClient.interceptors.request.use(
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
  (error) => Promise.reject(error),
);


const extractErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (detail?.message) {
    return detail.message;
  }

  if (detail?.error) {
    return detail.error;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load deployment readiness information."
  );
};


export const getDeploymentReadiness = async () => {
  try {
    const response = await deploymentReadinessClient.get("/");
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};


export const getDeploymentReadinessSummary = async () => {
  try {
    const response = await deploymentReadinessClient.get("/summary");
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};


export const getDeploymentRecommendations = async () => {
  try {
    const response = await deploymentReadinessClient.get(
      "/recommendations",
    );

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};


export default {
  getDeploymentReadiness,
  getDeploymentReadinessSummary,
  getDeploymentRecommendations,
};