import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/constants/Colors";
import { createRequisition } from "@/api/bankConnectionService";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/context/AlertContext";

const institutions = [
  { id: "DSKBANK_STSABGSFXXX", name: "DSK", icon: "business" },
  { id: "UNICREDIT_UNCRBGSF", name: "Unicredit Bulbank", icon: "business" },
  { id: "REVOLUT_REVOLT21", name: "Revolut", icon: "card" },
  { id: "FIBANK_FINVBGSF", name: "Fibank", icon: "business" },
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
  const [validationError, setValidationError] = useState("");
  const { showAlert } = useAlert();

  const handleCreateRequisition = async () => {
    // Clear previous validation errors
    setValidationError("");

    if (!reference) {
      setValidationError("Please provide a connection name");
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
      onSuccess(requisition.id);
    } catch (error: any) {
      setValidationError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setReference("");
    setValidationError("");
    setSelectedInstitution(institutions[0]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={resetAndClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={[colors.backgroundGradient.start, colors.backgroundGradient.end]}
            style={styles.gradientHeader}
          >
            <TouchableOpacity style={styles.closeButton} onPress={resetAndClose}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.title}>Add Bank Connection</Text>
            <Text style={styles.subtitle}>Connect your financial institution</Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Connection Name</Text>
            <View style={[styles.inputContainer, validationError ? styles.inputError : null]}>
              <Ionicons name="bookmark-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., My Main Account"
                value={reference}
                onChangeText={(text) => {
                  setReference(text);
                  if (validationError) setValidationError("");
                }}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}

            <Text style={styles.label}>Select Institution</Text>
            <View style={styles.institutionGrid}>
              {institutions.map((inst) => (
                <TouchableOpacity
                  key={inst.id}
                  style={[styles.institutionItem, selectedInstitution.id === inst.id && styles.selectedInstitution]}
                  onPress={() => setSelectedInstitution(inst)}
                >
                  <Ionicons
                    name={inst.icon as any}
                    size={24}
                    color={selectedInstitution.id === inst.id ? colors.white : colors.primary}
                  />
                  <Text
                    style={[
                      styles.institutionText,
                      selectedInstitution.id === inst.id && styles.selectedInstitutionText,
                    ]}
                  >
                    {inst.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, loading && styles.disabledButton]}
                onPress={handleCreateRequisition}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="link-outline" size={20} color={colors.white} />
                    <Text style={styles.actionButtonText}>Connect Bank</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={resetAndClose}>
                <Ionicons name="close-circle-outline" size={20} color={colors.text} />
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    maxHeight: "80%",
  },
  gradientHeader: {
    padding: 30,
    paddingTop: 40,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    opacity: 0.9,
  },
  formContainer: {
    padding: 25,
    paddingTop: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: colors.primary,
    fontWeight: "600",
    paddingLeft: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: colors.background,
    marginBottom: 10,
  },
  inputError: {
    borderColor: "red",
    borderWidth: 1,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 15,
    marginLeft: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
  },
  institutionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
    marginTop: 10,
  },
  institutionItem: {
    width: "48%",
    padding: 20,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedInstitution: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  institutionText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  selectedInstitutionText: {
    color: colors.white,
  },
  buttonsContainer: {
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
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
  disabledButton: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
  },
});
