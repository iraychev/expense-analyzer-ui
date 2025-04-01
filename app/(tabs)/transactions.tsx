import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { FontAwesome } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import Head from "expo-router/head";
import { useTransactions } from "@/context/TransactionContext";

export default function Transactions() {
  const { transactions, isLoading: loading, refreshTransactions } = useTransactions();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");

  const [tempCategory, setTempCategory] = useState<string>(selectedCategory);
  const [tempType, setTempType] = useState<"all" | "income" | "expense">(selectedType);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const months: string[] = [];
  for (let year = currentYear - 1; year <= currentYear; year++) {
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      if (year === currentYear && monthIndex > currentMonth) break;
      const monthName = new Date(year, monthIndex).toLocaleString("default", {
        month: "long",
      });
      months.push(`${year} ${monthName}`);
    }
  }
  months.push("All");

  const scrollViewRef = useRef<ScrollView>(null);
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const onRefresh = useCallback(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  const filteredTransactions = transactions.filter((transaction) => {
    const categoryMatch = selectedCategory === "" || transaction.category === selectedCategory;
    let typeMatch = true;
    if (selectedType === "income") {
      typeMatch = transaction.amount > 0;
    } else if (selectedType === "expense") {
      typeMatch = transaction.amount < 0;
    }
    let monthMatch = true;
    if (selectedMonth !== "All") {
      const [year, ...monthParts] = selectedMonth.split(" ");
      const monthName = monthParts.join(" ");
      const transactionDate = new Date(transaction.valueDate);
      const transactionMonth = transactionDate.toLocaleString("default", {
        month: "long",
      });
      monthMatch = transactionDate.getFullYear() === parseInt(year) && transactionMonth === monthName;
    }
    return categoryMatch && typeMatch && monthMatch;
  });

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.valueDate).getTime() - new Date(a.valueDate).getTime()
  );

  const categories = Array.from(new Set(transactions.map((t) => t.category)));
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Supermarkets":
        return "shopping-cart";
      case "Financial Services":
        return "bank";
      case "Shopping":
        return "shopping-bag";
      case "Restaurants and bars":
        return "cutlery";
      case "Entertainment and Sport":
        return "futbol-o";
      case "Traveling and Vacation":
        return "plane";
      case "Health and Beauty":
        return "heartbeat";
      default:
        return "question-circle";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const openFilterModal = () => {
    setTempCategory(selectedCategory);
    setTempType(selectedType);
    setFilterModalVisible(true);
  };

  const applyFilters = () => {
    setSelectedCategory(tempCategory);
    setSelectedType(tempType);
    setFilterModalVisible(false);
  };

  return (
    <>
      <Head>
        <title>Your Transactions - Expense Analyzer</title>
      </Head>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Transactions</Text>
            <Text style={styles.subtitle}>Track your financial activity</Text>
          </View>

          <View style={styles.filtersRow}>
            <Text style={styles.pageSection}>Transaction History</Text>
            <TouchableOpacity onPress={openFilterModal} style={styles.filterButton}>
              <FontAwesome name="filter" size={18} color="#fff" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.monthPickerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} ref={scrollViewRef}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month}
                  onPress={() => setSelectedMonth(month)}
                  style={[styles.monthOption, selectedMonth === month && styles.selectedMonth]}
                >
                  <Text style={[styles.monthText, selectedMonth === month && styles.selectedMonthText]}>{month}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Modal visible={filterModalVisible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Filter Transactions</Text>
                <Text style={styles.filterLabel}>Category</Text>
                <RNPickerSelect
                  onValueChange={(value: string) => setTempCategory(value)}
                  items={[
                    { label: "All Categories", value: "" },
                    ...categories.map((category) => ({
                      label: category,
                      value: category,
                    })),
                  ]}
                  style={pickerSelectStyles}
                  value={tempCategory}
                  useNativeAndroidPickerStyle={false}
                  placeholder={{ label: "Select a category", value: null }}
                />

                <Text style={styles.filterLabel}>Transaction Type</Text>
                <View style={styles.toggleContainer}>
                  {["all", "income", "expense"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setTempType(type as "all" | "income" | "expense")}
                      style={[styles.toggleButton, tempType === type && styles.selectedToggle]}
                    >
                      <Text style={[styles.toggleText, tempType === type && styles.selectedToggleText]}>
                        {type === "income" ? "Income" : type === "expense" ? "Expense" : "All"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={applyFilters} style={styles.modalButton}>
                    <Text style={styles.modalButtonText}>Apply Filters</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setFilterModalVisible(false)}
                    style={[styles.modalButton, styles.cancelButton]}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={sortedTransactions}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={() => (
                <View style={styles.noTransactions}>
                  <FontAwesome name="search" size={40} color={colors.muted} style={styles.noDataIcon} />
                  <Text style={styles.noTransactionsText}>No transactions found for the selected filters.</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <View style={styles.transaction}>
                  <View style={styles.iconContainer}>
                    <FontAwesome name={getCategoryIcon(item.category)} size={24} color={colors.primary} />
                  </View>
                  <View style={styles.transactionDetails}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.category}>{item.category}</Text>
                      <Text style={[styles.amount, { color: item.amount < 0 ? "#FF3B30" : "#34C759" }]}>
                        {item.amount < 0 ? "- " : "+ "}
                        {Math.abs(item.amount)} {item.currency}
                      </Text>
                    </View>
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={styles.valueDate}>{formatDate(item.valueDate)}</Text>
                  </View>
                </View>
              )}
              refreshing={loading}
              onRefresh={onRefresh}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
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
  filtersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  pageSection: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.accent,
    paddingLeft: 10,
  },
  filterButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 5,
  },
  monthPickerContainer: {
    marginBottom: 20,
  },
  monthOption: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  monthText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedMonth: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedMonthText: {
    color: "#FFF",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: colors.primary,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: colors.accent,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  selectedToggle: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  selectedToggleText: {
    color: "#FFF",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  transaction: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    marginBottom: 4,
  },
  valueDate: {
    fontSize: 13,
    color: colors.muted,
  },
  noTransactions: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    padding: 20,
  },
  noDataIcon: {
    marginBottom: 15,
  },
  noTransactionsText: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
    fontStyle: "italic",
  },
  loader: {
    marginTop: 40,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 50,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    color: colors.text,
    paddingRight: 30,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  inputAndroid: {
    height: 50,
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    color: colors.text,
    paddingRight: 30,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
});
