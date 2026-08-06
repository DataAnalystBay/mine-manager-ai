import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

/**
 * Fetch Predictive Intelligence for the selected mine.
 *
 * @param {string} mineName
 * @returns {Promise<Object>}
 */
export async function getPredictionSummary(
  mineName = "Oyu Tolgoi Surface",
) {
  const normalizedMineName =
    String(mineName || "").trim() ||
    "Oyu Tolgoi Surface";

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/predictions/summary`,
      {
        params: {
          mine_name: normalizedMineName,
        },
      },
    );

    return response.data;
  } catch (error) {
    const detail =
      error?.response?.data?.detail ||
      error?.message ||
      "Unable to load Predictive Intelligence.";

    throw new Error(detail);
  }
}