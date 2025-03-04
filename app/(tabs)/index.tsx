import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Expense Analyzer</Text>
      <Text style={styles.subtitle}>Track your expenses effortlessly</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.text,
  },
});
