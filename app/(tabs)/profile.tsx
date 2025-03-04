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
import Colors from "@/constants/Colors";

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
      router.push("/auth/register");
    } catch (error: any) {
      Alert.alert("Failed to delete account", error.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.text,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: Colors.primary,
  },
  bankConnection: {
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderColor: Colors.muted,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    // Android shadow
    elevation: 2,
  },
  bankReference: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 5,
  },
  bankLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  buttonContainer: {
    marginTop: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
});
