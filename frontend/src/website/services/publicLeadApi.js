import api from "../../services/api";


export async function submitPublicLead(payload) {
  const response = await api.post("/api/public/leads", payload);
  return response.data;
}
