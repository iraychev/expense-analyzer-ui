import React from "react";
import { Stack } from "expo-router";
import { colors } from "@/constants/Colors";

export default function AuthLayout() {
  // The screens draw their own gradient; a matching base colour and a fade avoid a white flash on open.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: colors.backgroundGradient.start },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}