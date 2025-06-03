import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import RNPickerSelect from "react-native-picker-select";

interface FloatingActionButtonProps {
  onAddExpense?: (expense: QuickExpense) => void;
}

interface QuickExpense {
  amount: number;
  category: string;
  description: string;
  type: "income" | "expense";
  date: Date;
}

const categories = [
  "Supermarkets",
  "Financial Services",
  "Shopping",
  "Restaurants and bars",
  "Entertainment and Sport",
  "Traveling and Vacation",
  "Health and Beauty",
  "Other",
];

export default function FloatingActionButton({ onAddExpense }: FloatingActionButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [rotateAnim] = useState(new Animated.Value(0));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  const handlePress = () => {
    Animated.timing(rotateAnim, {
      toValue: modalVisible ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setModalVisible(!modalVisible);
  };

  const resetForm = () => {
    setAmount("");
    setCategory(categories[0]);
    setDescription("");
    setType("expense");
  };

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Validation Error", "Please enter a valid amount");
      return;
    }

    const expense: QuickExpense = {
      amount: parseFloat(amount),
      category,
      description: description || `Quick ${type}`,
      type,
      date: new Date(),
    };

    if (onAddExpense) {
      onAddExpense(expense);
    }

    Alert.alert("Success", `${type === "expense" ? "Expense" : "Income"} added successfully!`);
    resetForm();
    setModalVisible(false);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="add" size={28} color={colors.white} />
        </Animated.View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Quick Add</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Type Toggle */}
                <View style={styles.typeContainer}>
                  <TouchableOpacity
                    style={[styles.typeButton, type === "expense" && styles.typeButtonActive]}
                    onPress={() => setType("expense")}
                  >
                    <Ionicons
                      name="remove-circle-outline"
                      size={20}
                      color={type === "expense" ? colors.white : colors.expense}
                    />
                    <Text style={[styles.typeText, type === "expense" && styles.typeTextActive]}>Expense</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeButton, styles.typeButtonIncome, type === "income" && styles.typeButtonActive]}
                    onPress={() => setType("income")}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={type === "income" ? colors.white : colors.income}
                    />
                    <Text style={[styles.typeText, type === "income" && styles.typeTextActive]}>Income</Text>
                  </TouchableOpacity>
                </View>

                {/* Amount Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount</Text>
                  <View style={styles.amountInputContainer}>
                    <Text
                      style={[styles.currencySymbol, { color: type === "expense" ? colors.expense : colors.income }]}
                    >
                      {type === "expense" ? "-" : "+"} €
                    </Text>
                    <TextInput
                      style={[styles.amountInput, { color: type === "expense" ? colors.expense : colors.income }]}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Category Picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.pickerContainer}>
                    <RNPickerSelect
                      onValueChange={(value) => setCategory(value)}
                      items={categories.map((cat) => ({ label: cat, value: cat }))}
                      value={category}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => <Ionicons name="chevron-down" size={20} color={colors.textMuted} />}
                    />
                  </View>
                </View>

                {/* Description Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description (optional)</Text>
                  <TextInput
                    style={styles.descriptionInput}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add a note..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  typeContainer: {
    flexDirection: "row",
    marginBottom: 25,
    gap: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.expense,
    backgroundColor: colors.white,
  },
  typeButtonIncome: {
    borderColor: colors.income,
  },
  typeButtonActive: {
    backgroundColor: colors.expense,
    borderColor: colors.expense,
  },
  typeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: colors.expense,
  },
  typeTextActive: {
    color: colors.white,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: colors.background,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "bold",
    paddingVertical: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    backgroundColor: colors.background,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: "top",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 30,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 15,
    paddingHorizontal: 15,
    color: colors.text,
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 15,
    color: colors.text,
    paddingRight: 30,
  },
  iconContainer: {
    top: 15,
    right: 15,
  },
});
