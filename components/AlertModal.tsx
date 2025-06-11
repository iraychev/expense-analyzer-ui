import React from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: {
    text: string;
    onPress: () => void;
    style?: "default" | "cancel" | "destructive";
  }[];
  onClose: () => void;
}

export default function AlertModal({ visible, title, message, buttons, onClose }: AlertModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === "destructive" && styles.destructiveButton,
                  button.style === "cancel" && styles.cancelButton,
                ]}
                onPress={() => {
                  button.onPress();
                  onClose();
                }}
              >
                {button.style === "destructive" && (
                  <Ionicons name="warning-outline" size={18} color={colors.danger} style={styles.buttonIcon} />
                )}
                <Text
                  style={[
                    styles.buttonText,
                    button.style === "destructive" && styles.destructiveText,
                    button.style === "cancel" && styles.cancelText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginVertical: 5,
    flexDirection: "row",
    justifyContent: "center",
  },
  destructiveButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  destructiveText: {
    color: colors.danger,
  },
  cancelText: {
    color: colors.text,
  },
  buttonIcon: {
    marginRight: 6,
  },
});
