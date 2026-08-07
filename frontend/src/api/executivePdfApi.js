import axios from "axios";

const { API_BASE_URL } from "../config/apiConfig";

export async function exportExecutiveKpiPdf({
  kpiKey,
  mineName = "Oyu Tolgoi Surface",
  companyName = "Oyu Tolgoi",
  days = 14,
  actionLimit = 5,
  includeCompletedActions = true,
}) {
  const response = await axios.get(
    `${API_BASE_URL}/api/executive-kpi/${kpiKey}/export-pdf`,
    {
      params: {
        mine_name: mineName,
        company_name: companyName,
        days,
        action_limit: actionLimit,
        include_completed_actions: includeCompletedActions,
      },
      responseType: "blob",
    }
  );

  const disposition = response.headers["content-disposition"];

  let filename = "Executive_KPI_Analysis.pdf";

  if (disposition) {
    const match = disposition.match(/filename="(.+)"/);

    if (match) {
      filename = match[1];
    }
  }

  return {
    blob: response.data,
    filename,
  };
}