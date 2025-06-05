import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔍 Checking authentication from index...");
        const token = await AsyncStorage.getItem("token");
        console.log("🔑 Token found:", !!token);

        if (token) {
          console.log("✅ Redirecting to home tabs");
          router.replace("/(tabs)");
        } else {
          console.log("❌ Redirecting to login");
          router.replace("/auth/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/auth/login");
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
