import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// Create a global alert handler
let globalAlertHandler: (title: string, message: string, buttons?: any[]) => void;

export const setGlobalAlertHandler = (handler: (title: string, message: string, buttons?: any[]) => void) => {
  globalAlertHandler = handler;
};

let isLoggingOut = false;

const getApiBaseUrl = () => {
  if (__DEV__) {
    return "http://192.168.11.110:8080/api/v1";
  }

  return "https://expense-analyzer-production.up.railway.app/api/v1";
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token && !config.url?.includes("/token")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isLoggingOut) {
      isLoggingOut = true;

      try {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("username");

        if (globalAlertHandler) {
          globalAlertHandler("Session Expired", "Please log in again.", [
            {
              text: "OK",
              onPress: () => {
                setTimeout(() => {
                  router.replace("/auth/login");
                  isLoggingOut = false;
                }, 100);
              },
            },
          ]);
        }
      } catch (err) {
        isLoggingOut = false;
        console.error("Error during logout:", err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
