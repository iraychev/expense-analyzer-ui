import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/constants/Colors";
import { fetchUser, updateBankConnections } from "@/api/userService";
import { linkBankConnection, deleteBankConnection } from "@/api/bankConnectionService";
import { User } from "@/interface/User";
import { BankConnection } from "@/interface/BankConnection";
import Head from "expo-router/head";
import { useTransactions } from "@/context/TransactionContext";
import { LinearGradient } from "expo-linear-gradient";
import AddBankConnectionModal from "@/app/modals/AddBankConnectionModal";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/context/AlertContext";

export default function BankConnections() {
  const [user, setUser] = useState<User | null>(null);
  const [expandedConnections, setExpandedConnections] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingRequisitionId, setPendingRequisitionId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const router = useRouter();
  const { refreshTransactions } = useTransactions();
  const { showAlert } = useAlert();

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        showAlert("Error", "Username not found in local storage");
        return;
      }
      try {
        const fetchedUser = await fetchUser(username);
        if (isMounted) {
          setUser(fetchedUser);
        }
      } catch (error: any) {
        if (isMounted) {
          showAlert("Failed to fetch user data", error.message);
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

  const handleUpdateBankConnections = async () => {
    const username = await AsyncStorage.getItem("username");
    if (!username) {
      showAlert("Error", "Username not found in local storage");
      return;
    }

    setSyncing(true);
    try {
      const updatedUser = await updateBankConnections(username);
      setUser(updatedUser);
      await refreshTransactions();
      showAlert("Success", "Bank connections and transactions updated successfully");
    } catch (error: any) {
      showAlert("Update Failed", error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteConnection = (connectionId: string) => {
    showAlert("Delete Connection", "Are you sure you want to delete this bank connection?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBankConnection(connectionId);
            // Refresh connections after deletion
            const username = await AsyncStorage.getItem("username");
            if (username) {
              const updatedUser = await updateBankConnections(username);
              setUser(updatedUser);
            }
            showAlert("Success", "Bank connection deleted successfully.");
          } catch (error: any) {
            showAlert("Error", error.message);
          }
        },
      },
    ]);
  };

  const toggleExpand = (connectionId: number) => {
    setExpandedConnections((prev) =>
      prev.includes(connectionId) ? prev.filter((id) => id !== connectionId) : [...prev, connectionId]
    );
  };

  const handleModalSuccess = async (requisitionId: string) => {
    setPendingRequisitionId(requisitionId);
    setShowAddModal(false);
  };

  return (
    <>
      <Head>
        <title>Bank Connections - Expense Analyzer</title>
      </Head>
      <LinearGradient
        colors={[colors.backgroundGradient.start, colors.backgroundGradient.end]}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Bank Connections</Text>
              <Text style={styles.subtitle}>Manage your financial connections</Text>
            </View>

            {/* Primary Action Button - Always visible */}
            <View style={styles.primaryActionContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={() => setShowAddModal(true)}>
                <Ionicons name="add-circle-outline" size={20} color={colors.white} />
                <Text style={styles.actionButtonText}>Add Bank Connection</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.white} style={styles.loader} />
            ) : (
              <>
                {user && user.bankConnections.length > 0 ? (
                  <>
                    <Text style={styles.pageSection}>Your Connections</Text>
                    <View style={styles.sectionContainer}>
                      {user.bankConnections.map((connection: BankConnection) => (
                        <View key={connection.id} style={styles.bankConnection}>
                          {/* Bank connection content remains the same */}
                          <TouchableOpacity
                            onPress={() => toggleExpand(connection.id)}
                            style={styles.bankConnectionHeader}
                          >
                            <View style={styles.bankInfo}>
                              <Ionicons name="business" size={20} color={colors.primary} style={styles.bankIcon} />
                              <Text style={styles.bankReference}>{connection.reference}</Text>
                            </View>
                            <Ionicons
                              name={expandedConnections.includes(connection.id) ? "chevron-up" : "chevron-down"}
                              size={20}
                              color={colors.primary}
                            />
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
                                    <View style={styles.accountRow}>
                                      <Text style={styles.accountLabel}>Account ID:</Text>
                                      <Text style={styles.accountValue}>{account.id || "N/A"}</Text>
                                    </View>
                                    <View style={styles.accountRow}>
                                      <Text style={styles.accountLabel}>IBAN:</Text>
                                      <Text style={styles.accountValue}>{account.iban || "N/A"}</Text>
                                    </View>
                                  </View>
                                ))}
                              </View>
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteConnection(connection.requisitionId)}
                              >
                                <Ionicons name="trash-outline" size={18} color={colors.white} />
                                <Text style={styles.deleteButtonText}>Delete Connection</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      ))}

                      {/* Sync Button - Only shown when connections exist */}
                      <TouchableOpacity
                        style={[styles.syncButton, syncing && styles.disabledButton]}
                        onPress={handleUpdateBankConnections}
                        disabled={syncing}
                      >
                        {syncing ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <Ionicons name="sync-outline" size={20} color={colors.white} />
                        )}
                        <Text style={styles.actionButtonText}>
                          {syncing ? "Syncing Transactions..." : "Sync Transactions & Accounts"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.sectionContainer}>
                    <View style={styles.emptyState}>
                      <View style={styles.emptyIconContainer}>
                        <Ionicons name="link-outline" size={50} color={colors.textMuted} />
                      </View>
                      <Text style={styles.noDataTitle}>No bank connections yet</Text>
                      <Text style={styles.noData}>Add a connection to start tracking your finances automatically</Text>
                    </View>
                  </View>
                )}

                {/* Pending Connection Button - Only shown when needed */}
                {pendingRequisitionId && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.pageSection}>Pending Connection</Text>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.finalizeButton]}
                      onPress={async () => {
                        const username = await AsyncStorage.getItem("username");
                        if (!username) {
                          showAlert("Error", "Username not found in local storage");
                          return;
                        }
                        try {
                          await linkBankConnection(username, pendingRequisitionId);
                          showAlert("Success", "Bank connection linked successfully.");
                          await AsyncStorage.removeItem("pendingRequisitionId");
                          setPendingRequisitionId(null);
                          const updatedUser = await updateBankConnections(username);
                          setUser(updatedUser);
                          await refreshTransactions();
                        } catch (error: any) {
                          showAlert("Error", error.message);
                        }
                      }}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                      <Text style={styles.actionButtonText}>Finalize Linking</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <AddBankConnectionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: colors.white,
    textAlign: "center",
    opacity: 0.9,
  },
  pageSection: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.white,
    marginTop: 10,
    marginBottom: 15,
    paddingLeft: 10,
  },
  sectionContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    width: "100%",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  bankConnection: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bankConnectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  bankIcon: {
    marginRight: 10,
  },
  bankReference: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  bankDetails: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
  },
  bankDetailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  bankDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bankDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  accountDetails: {
    marginTop: 15,
    padding: 15,
    backgroundColor: colors.primary + "08",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + "20",
  },
  accountItem: {
    marginBottom: 10,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  accountValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  syncButton: {
    backgroundColor: colors.info,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: colors.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: colors.info + "80",
  },
  deleteButton: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  finalizeButton: {
    backgroundColor: colors.success,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: "center",
    marginVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },
  noData: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginHorizontal: 20,
    lineHeight: 22,
  },
  primaryActionContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
});
