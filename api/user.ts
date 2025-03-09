import axiosInstance from "./axiosInstance";
import { User } from "@/interface/User";

export const fetchUser = async (username: string): Promise<User> => {
  const response = await axiosInstance.get(`/users/username/${username}`);
  return response.data;
};

export const deleteUser = async (username: string): Promise<void> => {
  await axiosInstance.delete(`/users/username/${username}`);
};

export const updateBankConnections = async (username: string): Promise<User> => {
  const response = await axiosInstance.put(
    `/users/username/${username}/bank-connections/update`
  );
  return response.data;
};