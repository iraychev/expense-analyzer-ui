import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/Colors";
import { fetchUser, deleteUser, updateBankConnections } from "@/api/user";
import { linkBankConnection } from "@/api/bankConnection";
import { User } from "@/interface/User";
import { BankConnection } from "@/interface/BankConnection";
import Head from "expo-router/head";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [expandedConnections, setExpandedConnections] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingRequisitionId, setPendingRequisitionId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        Alert.alert("Error", "Username not found in local storage");
        return;
      }
      try {
        const fetchedUser = await fetchUser(username);
        if (isMounted) {
          setUser(fetchedUser);
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
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const checkPending = async () => {
      const pending = await AsyncStorage.getItem("pendingRequisitionId");
      if (pending) {
        setPendingRequisitionId(pending);
      }
    };
    checkPending();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("username");
    router.push("/auth/login");
  };

  const handleDeleteAccount = async () => {
    Alert.alert("Delete Account", "Are you sure you want to delete your account? This action cannot be undone.", [
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
            await deleteUser(username);
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("username");
            Alert.alert("Account Deleted", "Your account has been deleted.");
            router.push("/auth/register");
          } catch (error: any) {
            Alert.alert("Failed to delete account", error.message);
          }
        },
      },
    ]);
  };

  const handleUpdateBankConnections = async () => {
    const username = await AsyncStorage.getItem("username");
    if (!username) {
      Alert.alert("Error", "Username not found in local storage");
      return;
    }
    try {
      const updatedUser = await updateBankConnections(username);
      setUser(updatedUser);
      Alert.alert("Success", "Bank connections updated successfully");
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    }
  };

  const toggleExpand = (connectionId: number) => {
    setExpandedConnections((prev) =>
      prev.includes(connectionId) ? prev.filter((id) => id !== connectionId) : [...prev, connectionId]
    );
  };

  return (
    <>
      <Head>
        <title>Profile - Expense Analyzer</title>
      </Head>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>👤 User Profile</Text>
            <Text style={styles.subtitle}>Manage your account and connections</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : (
            <>
              <Text style={styles.pageSection}>Account Information</Text>
              <View style={styles.sectionContainer}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{user?.name}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Username</Text>
                  <Text style={styles.infoValue}>{user?.username}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>

              <Text style={styles.pageSection}>Bank Connections</Text>
              <View style={styles.sectionContainer}>
                {user && user.bankConnections.length > 0 ? (
                  user.bankConnections.map((connection: BankConnection) => (
                    <View key={connection.id} style={styles.bankConnection}>
                      <TouchableOpacity onPress={() => toggleExpand(connection.id)} style={styles.bankConnectionHeader}>
                        <Text style={styles.bankReference}>{connection.reference}</Text>
                        <Text style={styles.collapseIndicator}>
                          {expandedConnections.includes(connection.id) ? "-" : "+"}
                        </Text>
                      </TouchableOpacity>
                      {expandedConnections.includes(connection.id) && (
                        <>
                          <View style={styles.bankDetails}>
                            <View style={styles.bankDetailItem}>
                              <Text style={styles.bankDetailLabel}>Institution</Text>
                              <Text style={styles.bankDetailValue}>{connection.institutionName}</Text>
                            </View>
                            <View style={styles.bankDetailItem}>
                              <Text style={styles.bankDetailLabel}>Requisition ID</Text>
                              <Text style={styles.bankDetailValue}>{connection.requisitionId}</Text>
                            </View>
                          </View>
                          <View style={styles.accountDetails}>
                            {connection.accounts.map((account, idx) => (
                              <View key={idx} style={styles.accountItem}>
                                <Text style={styles.accountLabel}>Account id:</Text>
                                <Text style={styles.accountValue}>{account.id || "N/A"}</Text>
                                <Text style={styles.accountLabel}>IBAN:</Text>
                                <Text style={styles.accountValue}>{account.iban || "N/A"}</Text>
                              </View>
                            ))}
                          </View>
                        </>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noData}>
                    No bank connections available. Add a connection to track your finances.
                  </Text>
                )}
                {user && user.bankConnections.length > 0 && (
                  <TouchableOpacity style={styles.updateButton} onPress={handleUpdateBankConnections}>
                    <Text style={styles.actionButtonText}>Sync Bank Connections</Text>
                  </TouchableOpacity>
                )}
                {user && user.bankConnections.length === 0 && (
                  <Text style={styles.noData}>
                    No bank connections available. Add a connection to track your finances.
                  </Text>
                )}
                <View style={{ marginTop: 15 }}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/modals/addBankConnection")}>
                    <Text style={styles.actionButtonText}>Add Bank Connection</Text>
                  </TouchableOpacity>
                  {pendingRequisitionId && (
                    <TouchableOpacity
                      style={[styles.actionButton, { marginTop: 10 }]}
                      onPress={async () => {
                        const username = await AsyncStorage.getItem("username");
                        if (!username) {
                          Alert.alert("Error", "Username not found in local storage");
                          return;
                        }
                        try {
                          await linkBankConnection(username, pendingRequisitionId);
                          Alert.alert("Success", "Bank connection linked successfully.");
                          await AsyncStorage.removeItem("pendingRequisitionId");
                          setPendingRequisitionId(null);
                          const updatedUser = await updateBankConnections(username);
                          setUser(updatedUser);
                        } catch (error: any) {
                          Alert.alert("Error", error.message);
                        }
                      }}
                    >
                      <Text style={styles.actionButtonText}>Finalize Linking</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={styles.pageSection}>Account Actions</Text>
              <View style={styles.sectionContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                  <Text style={styles.actionButtonText}>Logout</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleDeleteAccount}>
                  <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
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
  accountDetails: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#eef",
    borderRadius: 10,
  },
  accountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  accountValue: {
    fontSize: 14,
    color: Colors.primary,
  },
  bankConnectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  collapseIndicator: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
});
