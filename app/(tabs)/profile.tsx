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

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
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
      </LinearGradient>
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
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: colors.text,
    textAlign: "center",
  },
  pageSection: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.accent,
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
    color: colors.text,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 16,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    width: "100%",
  },
  actionButton: {
    backgroundColor: colors.primary,
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
});
