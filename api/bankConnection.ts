import { RequisitionRequest } from "@/interface/RequisitionRequest";
import axiosInstance from "./axiosInstance";

export const createRequisition = async (data: RequisitionRequest) => {
  const response = await axiosInstance.post("/requisitions", data);
  return response.data;
};

export const linkBankConnection = async (username: string, requisitionId: string) => {
  const response = await axiosInstance.post(`/users/username/${username}/bank-connections/link/${requisitionId}`);
  return response.data;
};

export const deleteBankConnection = async (requisitionId: string) => {
  const response = await axiosInstance.delete(`/requisitions/${requisitionId}`);
  return response.data;
};