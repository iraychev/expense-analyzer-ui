import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import axiosInstance from "../../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        Alert.alert("Error", "Username not found in local storage");
        return;
      }

      try {
        const response = await axiosInstance.get(`/users/username/${username}`);
        if (isMounted) {
          setUser(response.data);
        }
      } catch (error: any) {
        if (isMounted) {
          Alert.alert("Failed to fetch user data", error.message);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("username");
    router.push("/auth/login");
  };

  const handleDeleteAccount = async () => {
    const username = await AsyncStorage.getItem("username");
    if (!username) {
      Alert.alert("Error", "Username not found in local storage");
      return;
    }

    try {
      await axiosInstance.delete(`/users/username/${username}`);
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("username");
      Alert.alert("Account Deleted", "Your account has been deleted.");
      router.push("/register");
    } catch (error: any) {
      Alert.alert("Failed to delete account", error.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name: {user.name}</Text>
      <Text style={styles.label}>Username: {user.username}</Text>
      <Text style={styles.label}>Email: {user.email}</Text>
      <Text style={styles.sectionTitle}>Bank Connections:</Text>
      {user.bankConnections.map((connection: any) => (
        <View key={connection.id} style={styles.bankConnection}>
          <Text style={styles.bankReference}>{connection.reference}</Text>
          <Text style={styles.bankLabel}>
            Institution: {connection.institutionName}
          </Text>
          <Text style={styles.bankLabel}>
            Requisition ID: {connection.requisitionId}
          </Text>
        </View>
      ))}
      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={handleLogout} />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Delete Account"
          onPress={handleDeleteAccount}
          color="red"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f0f0",
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  bankConnection: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bankReference: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  bankLabel: {
    fontSize: 16,
    color: "#666",
  },
  buttonContainer: {
    marginTop: 20,
  },
});
