import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import axiosInstance from "../../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/Colors";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
      } finally {
        if (isMounted) {
          setLoading(false);
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
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
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
          },
        },
      ]
    );
  };

  const handleUpdateBankConnections = async () => {
    const username = await AsyncStorage.getItem("username");
    if (!username) {
      Alert.alert("Error", "Username not found in local storage");
      return;
    }
    try {
      const response = await axiosInstance.put(
        `/users/username/${username}/bank-connections/update`
      );
      setUser(response.data);
      Alert.alert("Success", "Bank connections updated successfully");
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>👤 User Profile</Text>
          <Text style={styles.subtitle}>
            Manage your account and connections
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={styles.loader}
          />
        ) : (
          <>
            <Text style={styles.pageSection}>Account Information</Text>
            <View style={styles.sectionContainer}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{user.username}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>

            <Text style={styles.pageSection}>Bank Connections</Text>
            <View style={styles.sectionContainer}>
              {user.bankConnections && user.bankConnections.length > 0 ? (
                user.bankConnections.map((connection: any) => (
                  <View key={connection.id} style={styles.bankConnection}>
                    <Text style={styles.bankReference}>
                      {connection.reference}
                    </Text>
                    <View style={styles.bankDetails}>
                      <View style={styles.bankDetailItem}>
                        <Text style={styles.bankDetailLabel}>Institution</Text>
                        <Text style={styles.bankDetailValue}>
                          {connection.institutionName}
                        </Text>
                      </View>
                      <View style={styles.bankDetailItem}>
                        <Text style={styles.bankDetailLabel}>
                          Requisition ID
                        </Text>
                        <Text style={styles.bankDetailValue}>
                          {connection.requisitionId}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noData}>
                  No bank connections available. Add a connection to track your
                  finances.
                </Text>
              )}
              {user.bankConnections && user.bankConnections.length > 0 && (
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={handleUpdateBankConnections}
                >
                  <Text style={styles.actionButtonText}>
                    Update Bank Connections
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.pageSection}>Account Actions</Text>
            <View style={styles.sectionContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLogout}
              >
                <Text style={styles.actionButtonText}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleDeleteAccount}
              >
                <Text
                  style={[styles.actionButtonText, styles.dangerButtonText]}
                >
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: Colors.text,
    textAlign: "center",
  },
  pageSection: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.accent,
    marginTop: 10,
    marginBottom: 15,
    paddingLeft: 10,
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    marginBottom: 25,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 16,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    width: "100%",
  },
  bankConnection: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  bankReference: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 10,
  },
  bankDetails: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
  },
  bankDetailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  bankDetailLabel: {
    fontSize: 14,
    color: Colors.text,
    opacity: 0.8,
  },
  bankDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FF3B30",
  },
  dangerButtonText: {
    color: "#FF3B30",
  },
  loader: {
    marginTop: 40,
  },
  noData: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
    marginVertical: 30,
    fontStyle: "italic",
  },
  updateButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
});
