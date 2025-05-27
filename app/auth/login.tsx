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
import { colors } from "@/constants/Colors";
import { login } from "@/api/auth";
import Head from "expo-router/head";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await login(username, password);
      router.replace("/");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      Alert.alert("Login Failed", `Error: ${errorMessage}`);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Expense Analyzer</title>
      </Head>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: colors.primary,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: colors.white,
    borderColor: colors.muted,
  },
  link: {
    marginTop: 20,
    color: colors.accent,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
