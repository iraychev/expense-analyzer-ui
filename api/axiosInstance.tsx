import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { getApiUrl } from "./getApiUrl";

export const getAxiosInstance = async () => {
  const API_URL = await getApiUrl();

  const axiosInstance = axios.create({
    baseURL: API_URL,
  });

  axiosInstance.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem("token");
      if (token && !config.url?.includes("/token")) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("username");
        Alert.alert("Session Expired", "Please log in again.");
        const router = useRouter();
        router.replace("/auth/login");
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};
