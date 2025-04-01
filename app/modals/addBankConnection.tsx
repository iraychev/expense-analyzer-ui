import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/Colors";
import { createRequisition } from "@/api/bankConnectionService";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import Head from "expo-router/head";

const institutions = [
  { id: "DSKBANK_STSABGSFXXX", name: "DSK" },
  { id: "UNICREDIT_UNCRBGSF", name: "Unicredit Bulbank" },
  { id: "REVOLUT_REVOLT21", name: "Revolut" },
  { id: "FIBANK_FINVBGSF", name: "Fibank" },
];

export default function AddBankConnection() {
  const [reference, setReference] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState(institutions[0]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateRequisition = async () => {
    if (!reference) {
      Alert.alert("Validation", "Please provide a connection name.");
      return;
    }
    setLoading(true);
    try {
      const redirect = Linking.createURL("profile");
      const requisition = await createRequisition({
        redirect,
        institutionId: selectedInstitution.id,
        reference,
        agreement: "true",
        userLanguage: "en",
      });
      await AsyncStorage.setItem("pendingRequisitionId", requisition.id);
      Linking.openURL(requisition.link);
      Alert.alert(
        "Requisition Created",
        "Complete the linking on the bank webpage. Once done, return to your Profile to finalize linking."
      );
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Head>
        <title>Add Bank Connection - Expense Analyzer</title>
      </Head>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.pageTitle}>Add New Bank Connection</Text>
          <Text style={styles.label}>Connection Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter connection name"
            value={reference}
            onChangeText={setReference}
          />
          <Text style={styles.label}>Select Institution</Text>
          <View style={styles.institutionList}>
            {institutions.map((inst) => (
              <TouchableOpacity
                key={inst.id}
                style={[styles.institutionItem, inst.id === selectedInstitution.id && styles.selectedInstitution]}
                onPress={() => setSelectedInstitution(inst)}
              >
                <Text
                  style={[styles.institutionText, inst.id === selectedInstitution.id && styles.selectedInstitutionText]}
                >
                  {inst.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button title="Create Requisition" onPress={handleCreateRequisition} disabled={loading} />
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 20 },
  pageTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: Colors.primary, textAlign: "center" },
  label: { fontSize: 16, marginVertical: 10, color: Colors.text },
  input: {
    borderWidth: 1,
    borderColor: Colors.muted,
    borderRadius: 5,
    padding: 10,
    backgroundColor: Colors.white,
  },
  institutionList: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  institutionItem: {
    padding: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.muted,
    borderRadius: 5,
  },
  selectedInstitution: {
    backgroundColor: Colors.accent,
    borderColor: Colors.primary,
  },
  institutionText: { color: Colors.text },
  selectedInstitutionText: { fontWeight: "bold", color: Colors.white },
  cancelButton: {
    marginTop: 15,
    backgroundColor: "#ccc",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButtonText: { color: Colors.text, fontWeight: "bold" },
});
