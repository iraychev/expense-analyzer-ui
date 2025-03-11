import Constants from "expo-constants";
import * as Network from "expo-network";

export const getApiUrl = async () => {
  const ip = await Network.getIpAddressAsync();
  return `http://${ip}:8080/api/v1`;
};