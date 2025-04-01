import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { router } from "expo-router"; // Import router directly, not useRouter

// Flag to prevent multiple logout attempts
let isLoggingOut = false;

const axiosInstance = axios.create({
  baseURL: "http://192.168.11.110:8080/api/v1",
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

        Alert.alert(
          "Session Expired",
          "Please log in again.",
          [
            {
              text: "OK",
              onPress: () => {
                setTimeout(() => {
                  router.replace("/auth/login");
                  isLoggingOut = false;
                }, 100);
              },
            },
          ],
          { cancelable: false }
        );
      } catch (err) {
        isLoggingOut = false;
        console.error("Error during logout:", err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
