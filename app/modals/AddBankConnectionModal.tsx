import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/constants/Colors";
import { createRequisition } from "@/api/bankConnectionService";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";

const institutions = [
  { id: "DSKBANK_STSABGSFXXX", name: "DSK" },
  { id: "UNICREDIT_UNCRBGSF", name: "Unicredit Bulbank" },
  { id: "REVOLUT_REVOLT21", name: "Revolut" },
  { id: "FIBANK_FINVBGSF", name: "Fibank" },
];

interface AddBankConnectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (requisitionId: string) => void;
}

export default function AddBankConnectionModal({ visible, onClose, onSuccess }: AddBankConnectionModalProps) {
  const [reference, setReference] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState(institutions[0]);
  const [loading, setLoading] = useState(false);

  const handleCreateRequisition = async () => {
    if (!reference) {
      Alert.alert("Validation", "Please provide a connection name.");
      return;
    }
    setLoading(true);
    try {
      const redirect = Linking.createURL("bankConnections");
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
        "Complete the linking on the bank webpage. Once done, return to finalize linking."
      );
      onSuccess(requisition.id);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setReference("");
    setSelectedInstitution(institutions[0]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={resetAndClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={[colors.backgroundGradient.start, colors.backgroundGradient.end]}
          style={styles.gradientBackground}
        >
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Add Bank Connection</Text>
              <Text style={styles.subtitle}>Connect your financial institution</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Connection Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter connection name"
                value={reference}
                onChangeText={setReference}
                placeholderTextColor={colors.text + "80"}
              />

              <Text style={styles.label}>Select Institution</Text>
              <View style={styles.institutionGrid}>
                {institutions.map((inst) => (
                  <TouchableOpacity
                    key={inst.id}
                    style={[styles.institutionItem, inst.id === selectedInstitution.id && styles.selectedInstitution]}
                    onPress={() => setSelectedInstitution(inst)}
                  >
                    <Text
                      style={[
                        styles.institutionText,
                        inst.id === selectedInstitution.id && styles.selectedInstitutionText,
                      ]}
                    >
                      {inst.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCreateRequisition} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>Create Requisition</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={resetAndClose}>
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  gradientBackground: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
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
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: { 
    fontSize: 16, 
    marginBottom: 10,
    marginTop: 15,
    color: colors.accent,
    fontWeight: "600",
    paddingLeft: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 15,
    backgroundColor: colors.white,
    fontSize: 16,
  },
  institutionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
    marginTop: 10,
  },
  institutionItem: {
    width: "48%",
    padding: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedInstitution: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  institutionText: { 
    color: colors.text,
    fontWeight: "500",
    fontSize: 15,
  },
  selectedInstitutionText: { 
    fontWeight: "bold", 
    color: colors.white 
  },
  buttonsContainer: {
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  cancelButtonText: {
    color: colors.text,
  },
});