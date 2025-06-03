import React from "react";
import { Tabs } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = focused ? size + 2 : size;

          if (route.name === "index") {
            return <Ionicons name={focused ? "home" : "home-outline"} size={iconSize} color={color} />;
          } else if (route.name === "transactions") {
            return <Ionicons name={focused ? "list" : "list-outline"} size={iconSize} color={color} />;
          } else if (route.name === "bankConnections") {
            return <FontAwesome5 name="university" size={iconSize - 2} color={color} />;
          } else if (route.name === "profile") {
            return <Ionicons name={focused ? "person" : "person-outline"} size={iconSize} color={color} />;
          }
          return <Ionicons name="home" size={iconSize} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === "ios" ? 85 : 65,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="bankConnections"
        options={{
          title: "Banks",
          tabBarLabel: "Banks",
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarLabel: "Transactions",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
}
