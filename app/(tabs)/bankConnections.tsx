import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView, TouchableOpacity, Platform } from "react-native";
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
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/context/AlertContext";
import { getErrorMessage } from "@/api/errors";

const formatClock = (date: Date): string =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatTimeAgo = (date: Date, now: number): string => {
  const minutes = Math.floor((now - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export default function BankConnections() {
  const [user, setUser] = useState<User | null>(null);
  const [expandedConnections, setExpandedConnections] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingRequisitionId, setPendingRequisitionId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [finalizeStep, setFinalizeStep] = useState<"linking" | "importing">("linking");
  const [finalizing, setFinalizing] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nextSyncAvailableAt, setNextSyncAvailableAt] = useState<Date | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const { refreshTransactions } = useTransactions();
  const { showAlert } = useAlert();

  // Reload on every focus: tab screens stay mounted, so a mount-only load goes stale.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadUser = async () => {
        try {
          const username = await AsyncStorage.getItem("username");
          if (!username) {
            showAlert("Error", "Username not found in local storage");
            return;
          }
          const fetchedUser = await fetchUser(username);
          if (isActive) setUser(fetchedUser);
        } catch (error: any) {
          if (isActive) showAlert("Could not load your connections", getErrorMessage(error));
        } finally {
          if (isActive) setLoading(false);
        }
      };
      loadUser();
      return () => {
        isActive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("pendingRequisitionId").then((pending) => {
        if (pending) setPendingRequisitionId(pending);
      });
    }, [])
  );

  // Tick every 30s so "synced X ago" and the sync lock expire without user action.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const syncLockedUntil = nextSyncAvailableAt && nextSyncAvailableAt.getTime() > now ? nextSyncAvailableAt : null;

  const lastSyncedAt = (): Date | null => {
    const times = (user?.bankConnections ?? [])
      .map((c) => (c.syncedAt ? new Date(c.syncedAt).getTime() : NaN))
      .filter((t) => !isNaN(t));
    return times.length > 0 ? new Date(Math.max(...times)) : null;
  };

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
      setNow(Date.now());
      await refreshTransactions();
      if (updatedUser.throttled) {
        const next = updatedUser.nextSyncAvailableAt ? new Date(updatedUser.nextSyncAvailableAt) : null;
        const validNext = next && !isNaN(next.getTime()) ? next : null;
        setNextSyncAvailableAt(validNext);
        showAlert(
          "Already up to date",
          validNext ? `Already up to date. Next sync available at ${formatClock(validNext)}.` : "Already up to date. Please try again later."
        );
      } else {
        setNextSyncAvailableAt(null);
        showAlert("Success", "Bank connections and transactions updated successfully");
      }
    } catch (error: any) {
      if (error?.response?.status === 429) {
        const retryAfter = Number(error.response.headers?.["retry-after"]);
        if (retryAfter > 0) setNextSyncAvailableAt(new Date(Date.now() + retryAfter * 1000));
        showAlert(
          "Sync limit reached",
          `${getErrorMessage(error, "Your bank only allows a few syncs per day.")}

Your data is as of the last sync; try again later.`
        );
      } else {
        showAlert("Sync Failed", getErrorMessage(error));
      }
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
          setDeletingId(connectionId);
          try {
            await deleteBankConnection(connectionId);
            const username = await AsyncStorage.getItem("username");
            if (username) {
              setUser(await fetchUser(username));
            }
            // Transactions of the removed connection should disappear from other screens too.
            await refreshTransactions();
            showAlert("Success", "Bank connection deleted successfully.");
          } catch (error: any) {
            showAlert("Something went wrong", getErrorMessage(error));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const handleFinalizeLinking = async () => {
    if (!pendingRequisitionId) return;
    const username = await AsyncStorage.getItem("username");
    if (!username) {
      showAlert("Error", "Username not found in local storage");
      return;
    }

    setFinalizeStep("linking");
    setFinalizing(true);
    try {
      await linkBankConnection(username, pendingRequisitionId);
      await AsyncStorage.removeItem("pendingRequisitionId");
      setPendingRequisitionId(null);
    } catch (error: any) {
      showAlert("Linking Failed", getErrorMessage(error));
      setFinalizing(false);
      return;
    }

    // Linking succeeded; a failed sync must not look like a failed link.
    try {
      setFinalizeStep("importing");
      setSyncing(true);
      setUser(await updateBankConnections(username));
      await refreshTransactions();
      showAlert("Success", "Bank connection linked and transactions updated.");
    } catch (error: any) {
      showAlert("Linked, but sync failed", `${getErrorMessage(error)}\n\nUse "Sync Transactions & Accounts" to retry.`);
    } finally {
      setFinalizing(false);
      setSyncing(false);
    }
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
                                style={[styles.deleteButton, deletingId === connection.requisitionId && styles.disabledButton]}
                                disabled={deletingId !== null}
                                onPress={() => handleDeleteConnection(connection.requisitionId)}
                              >
                                {deletingId === connection.requisitionId ? (
                                  <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                  <Ionicons name="trash-outline" size={18} color={colors.white} />
                                )}
                                <Text style={styles.deleteButtonText}>
                                  {deletingId === connection.requisitionId ? "Deleting..." : "Delete Connection"}
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      ))}

                      {/* Sync Button - Only shown when connections exist */}
                      <TouchableOpacity
                        style={[styles.syncButton, (syncing || !!syncLockedUntil) && styles.disabledButton]}
                        onPress={handleUpdateBankConnections}
                        disabled={syncing || !!syncLockedUntil}
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
                      {syncLockedUntil && (
                        <Text style={styles.syncHint}>
                          Already up to date. Next sync available at {formatClock(syncLockedUntil)}.
                        </Text>
                      )}
                      {lastSyncedAt() && (
                        <Text style={styles.syncHint}>Last synced {formatTimeAgo(lastSyncedAt() as Date, now)}</Text>
                      )}
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
                    <Text style={styles.pendingTitle}>Pending Connection</Text>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.finalizeButton, finalizing && styles.disabledButton]}
                      disabled={finalizing}
                      onPress={handleFinalizeLinking}
                    >
                      {finalizing ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                      )}
                      <Text style={styles.actionButtonText}>
                        {finalizing ? (finalizeStep === "linking" ? "Linking bank..." : "Importing transactions...") : "Finalize Linking"}
                      </Text>
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
    paddingTop: Platform.OS === "android" ? 25 : 0,
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
  syncHint: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
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
  pendingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
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
