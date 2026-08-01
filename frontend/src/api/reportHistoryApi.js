import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";


export const getReportHistory = async ({
  limit = 20,
  reportFormat = "",
  status = "",
} = {}) => {
  const params = {
    limit,
  };

  if (reportFormat) {
    params.report_format = reportFormat;
  }

  if (status) {
    params.status = status;
  }

  const response = await axios.get(
    `${API_BASE_URL}/reports/history`,
    {
      params,
    }
  );

  return response.data;
};


export const getReportHistoryById = async (
  reportHistoryId
) => {
  const response = await axios.get(
    `${API_BASE_URL}/reports/history/${reportHistoryId}`
  );

  return response.data;
};


export const deleteReportHistory = async (
  reportHistoryId
) => {
  const response = await axios.delete(
    `${API_BASE_URL}/reports/history/${reportHistoryId}`
  );

  return response.data;
};
