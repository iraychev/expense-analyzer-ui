import axiosInstance from "./axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const login = async (username: string, password: string) => {
  const credentials = btoa(`${username}:${password}`);
  const response = await axiosInstance.post(
    "/token",
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );
  await AsyncStorage.setItem("token", response.data);
  await AsyncStorage.setItem("username", username);
  return response.data;
};

export const register = async (username: string, password: string, name: string) => {
  const response = await axiosInstance.post("/users", {
    username,
    password,
    name,
  });
  await AsyncStorage.setItem("username", username);
  return response.data;
};