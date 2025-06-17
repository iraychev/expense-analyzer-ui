import axiosInstance from "./axiosInstance";

export interface AnalysisItem {
  period: string;
  text: string;
  icon: string;
}

export const fetchAnalysis = async (startDate?: string, endDate?: string): Promise<AnalysisItem[]> => {
  const params = new URLSearchParams();

  if (startDate) {
    params.append("startDate", startDate);
  }

  if (endDate) {
    params.append("endDate", endDate);
  }

  const response = await axiosInstance.get(`/analysis${params.toString() ? `?${params.toString()}` : ""}`);
  return response.data;
};
