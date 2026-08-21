import axios from "axios";

import {
  API_BASE_URL,
} from "../config/apiConfig";


const kpiDetailClient = axios.create({
  baseURL: API_BASE_URL,
});


kpiDetailClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) =>
    Promise.reject(error),
);


export async function getKpiDetail({
  mineName,
  kpiName,
  days = 7,
}) {
  const response =
    await kpiDetailClient.get(
      "/api/dashboard/kpi-detail",
      {
        params: {
          mine_name: mineName,
          kpi_name: kpiName,
          days,
        },
      },
    );

  return response.data;
}


export default kpiDetailClient;