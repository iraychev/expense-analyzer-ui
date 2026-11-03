import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import { getCategoryIcon } from "@/constants/categoryIcons";
import { Transaction } from "@/interface/Transaction";
import { fetchCategories } from "@/api/transactionService";
import { useTransactions } from "@/context/TransactionContext";
import { useAlert } from "@/context/AlertContext";
import { getErrorMessage } from "@/api/errors";

interface CategoryPickerModalProps {
  /** The transaction being edited; the modal is visible while this is set. */
  transaction: Transaction | null;
  onClose: () => void;
}

export default function CategoryPickerModal({ transaction, onClose }: CategoryPickerModalProps) {
  const { recategorizeTransaction } = useTransactions();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (!transaction) return;
    setSelected(transaction.category);
    if (categories.length === 0) {
      fetchCategories()
        .then(setCategories)
        .catch((error) => showAlert("Could not load categories", getErrorMessage(error)));
    }
  }, [transaction]);

  const unchanged = !selected || selected === transaction?.category;

  const handleSave = () => {
    if (!transaction || unchanged) return;
    // Close first: the optimistic update is already visible in the list, and an error alert
    // must not end up behind this modal.
    onClose();
    recategorizeTransaction(transaction.id, selected).catch((error: any) => {
      showAlert("Could not change category", getErrorMessage(error, "The category was not changed. Please try again."));
    });
  };

  return (
    <Modal visible={transaction !== null} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalContent}>
          <LinearGradient
            colors={[colors.backgroundGradient.start, colors.backgroundGradient.end]}
            style={styles.gradientHeader}
          >
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.title}>Change Category</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {transaction?.description}
            </Text>
          </LinearGradient>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {categories.length === 0 && <ActivityIndicator color={colors.primary} />}
            {categories.map((category) => {
              const isSelected = selected === category;
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryRow, isSelected && styles.categoryRowSelected]}
                  onPress={() => setSelected(category)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <FontAwesome
                    name={getCategoryIcon(category)}
                    size={20}
                    color={isSelected ? colors.white : colors.primary}
                    style={styles.categoryIcon}
                  />
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>{category}</Text>
                  {isSelected && <Ionicons name="checkmark" size={20} color={colors.white} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer sits outside the scroll area so it is always reachable and clears the bottom inset. */}
          <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
            <TouchableOpacity
              style={[styles.actionButton, unchanged && styles.disabledButton]}
              onPress={handleSave}
              disabled={unchanged}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose}>
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    maxHeight: "92%",
  },
  list: { flexGrow: 0, flexShrink: 1 },
  listContent: { padding: 20, paddingBottom: 10 },
  gradientHeader: { padding: 24, paddingTop: 34, alignItems: "center" },
  closeButton: { position: "absolute", top: 16, right: 16, padding: 10, zIndex: 10 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.white, marginBottom: 5, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.white, textAlign: "center", opacity: 0.9, paddingHorizontal: 30 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 8,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
  },
  categoryRowSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryIcon: { width: 30, textAlign: "center", marginRight: 10 },
  categoryText: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.text },
  categoryTextSelected: { color: colors.white },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 6,
    flexDirection: "row",
    justifyContent: "center",
  },
  disabledButton: { opacity: 0.5 },
  actionButtonText: { color: colors.white, fontWeight: "bold", fontSize: 16, marginLeft: 8 },
  cancelButton: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border },
  cancelButtonText: { color: colors.text, marginLeft: 0 },
});
