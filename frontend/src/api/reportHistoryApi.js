import axios from "axios";

import {
  API_BASE_URL,
} from "../config/apiConfig";


const reportHistoryClient = axios.create({
  baseURL: `${API_BASE_URL}/reports/history`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});


reportHistoryClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


export const getReportHistory = async ({
  limit = 20,
  reportFormat = "",
  status = "",
} = {}) => {
  const params = {
    limit,
  };

  if (reportFormat) {
    params.report_format =
      reportFormat;
  }

  if (status) {
    params.status =
      status;
  }

  const response =
    await reportHistoryClient.get(
      "",
      {
        params,
      }
    );

  return response.data;
};


export const getReportHistoryById = async (
  reportHistoryId
) => {
  const response =
    await reportHistoryClient.get(
      `/${reportHistoryId}`
    );

  return response.data;
};


export const deleteReportHistory = async (
  reportHistoryId
) => {
  const response =
    await reportHistoryClient.delete(
      `/${reportHistoryId}`
    );

  return response.data;
};


export default reportHistoryClient;