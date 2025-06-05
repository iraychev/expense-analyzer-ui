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
import { colors } from "@/constants/Colors";
import { fetchUser, deleteUser } from "@/api/userService";
import { User } from "@/interface/User";
import Head from "expo-router/head";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import TermsAndConditionsModal from "../modals/TermsAndConditionsModal";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
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

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("username");
            router.replace("/auth/login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
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
            Alert.alert("Account Deleted", "Your account has been deleted.", [
              {
                text: "OK",
                onPress: () => router.replace("/auth/register"),
              },
            ]);
          } catch (error: any) {
            Alert.alert("Failed to delete account", error.message);
          }
        },
      },
    ]);
  };

  return (
    <>
      <Head>
        <title>Profile - Expense Analyzer</title>
      </Head>
      <LinearGradient
        colors={[colors.backgroundGradient.start, colors.backgroundGradient.end]}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>User Profile</Text>
              <Text style={styles.subtitle}>Manage your account</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.white} style={styles.loader} />
            ) : (
              <>
                {/* Profile Avatar Section */}
                <View style={styles.avatarSection}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || "U"}</Text>
                  </View>
                  <Text style={styles.userName}>{user?.name}</Text>
                  <Text style={styles.userHandle}>@{user?.username}</Text>
                </View>

                <Text style={styles.pageSection}>Account Information</Text>
                <View style={styles.sectionContainer}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoLeft}>
                      <Ionicons name="person-outline" size={20} color={colors.primary} />
                      <Text style={styles.infoLabel}>Name</Text>
                    </View>
                    <Text style={styles.infoValue}>{user?.name}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoItem}>
                    <View style={styles.infoLeft}>
                      <Ionicons name="at-outline" size={20} color={colors.primary} />
                      <Text style={styles.infoLabel}>Username</Text>
                    </View>
                    <Text style={styles.infoValue}>{user?.username}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoItem}>
                    <View style={styles.infoLeft}>
                      <Ionicons name="mail-outline" size={20} color={colors.primary} />
                      <Text style={styles.infoLabel}>Email</Text>
                    </View>
                    <Text style={styles.infoValue}>{user?.email}</Text>
                  </View>
                </View>

                <Text style={styles.pageSection}>Settings</Text>
                <View style={styles.sectionContainer}>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.settingItem} onPress={() => setShowTermsModal(true)}>
                    <View style={styles.settingLeft}>
                      <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
                      <Text style={styles.settingLabel}>Terms and Conditions</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                  <View style={styles.divider} />
                </View>

                <Text style={styles.pageSection}>Account Actions</Text>
                <View style={styles.sectionContainer}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={colors.white} />
                    <Text style={styles.actionButtonText}>Logout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleDeleteAccount}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Delete Account</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
      <TermsAndConditionsModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} />
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
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: colors.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 5,
  },
  userHandle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.8,
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
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    width: "100%",
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
  dangerButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  dangerButtonText: {
    color: colors.danger,
  },
  loader: {
    marginTop: 40,
  },
});
