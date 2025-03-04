import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import axiosInstance from "@/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/Colors";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const credentials = btoa(`${username}:${password}`);
    try {
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
      router.replace("/");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      Alert.alert("Login Failed", `Error: ${errorMessage}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.label}>Username:</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Password:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <Button title="Login" onPress={handleLogin} />
      <TouchableOpacity onPress={() => router.push("/auth/register")}>
        <Text style={styles.link}>Don't have an account? Register here</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: Colors.primary,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
    borderColor: Colors.muted,
  },
  link: {
    marginTop: 20,
    color: Colors.accent,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
