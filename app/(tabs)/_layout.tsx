import React from "react";
import { Tabs } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === "index") {
            return <Ionicons name="home" size={size} color={color} />;
          } else if (route.name === "transactions") {
            return <Ionicons name="list" size={size} color={color} />;
          } else if (route.name === "bankConnections") {
            return <FontAwesome5 name="university" size={size} color={color} />;
          } else if (route.name === "profile") {
            return <Ionicons name="person" size={size} color={color} />;
          }
          return <Ionicons name="home" size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
            <Tabs.Screen
        name="bankConnections"
        options={{
          title: "Bank Connections",
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}
