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
  TextInput,
  Platform,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import Head from "expo-router/head";
import { useTransactions } from "@/context/TransactionContext";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";

const ITEM_HEIGHT = 100;

export default function Transactions() {
  const { transactions, isLoading: loading, refreshTransactions } = useTransactions();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
  const latestMonth = months.length > 0 ? months[months.length - 1] : "All";
  months.push("All");

  const [selectedMonth, setSelectedMonth] = useState<string>(latestMonth);

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

    let searchMatch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      searchMatch =
        transaction.description.toLowerCase().includes(query) ||
        transaction.category.toLowerCase().includes(query) ||
        Math.abs(transaction.amount).toString().includes(query);
    }

    return categoryMatch && typeMatch && monthMatch && searchMatch;
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

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.transaction}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + "10" }]}>
        <FontAwesome name={getCategoryIcon(item.category)} size={24} color={colors.primary} />
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.transactionHeader}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={[styles.amount, { color: item.amount < 0 ? colors.expense : colors.income }]}>
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
  );

  const getItemLayout = (data: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  return (
    <>
      <Head>
        <title>Your Transactions - Expense Analyzer</title>
      </Head>
      <LinearGradient
        colors={[colors.backgroundGradient.start, colors.backgroundGradient.end]}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Transactions</Text>
                <Text style={styles.subtitle}>Track your financial activity</Text>
              </View>
              <TouchableOpacity onPress={openFilterModal} style={styles.filterButton}>
                <FontAwesome name="filter" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search transactions..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
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
                  <Picker
                    selectedValue={tempCategory}
                    onValueChange={(itemValue) => setTempCategory(itemValue)}
                    style={styles.picker}
                    dropdownIconColor={colors.primary}
                  >
                    <Picker.Item label="All Categories" value="" />
                    {categories.map((category) => (
                      <Picker.Item key={category} label={category} value={category} />
                    ))}
                  </Picker>

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
                      <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {loading ? (
              <ActivityIndicator size="large" color={colors.white} style={styles.loader} />
            ) : (
              <FlatList
                data={sortedTransactions}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                renderItem={renderTransaction}
                refreshing={loading}
                onRefresh={onRefresh}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                initialNumToRender={10}
                windowSize={10}
                getItemLayout={getItemLayout}
                ListEmptyComponent={() => (
                  <View style={styles.noTransactions}>
                    <View style={styles.emptyIconContainer}>
                      <FontAwesome name="search" size={50} color={colors.textMuted} />
                    </View>
                    <Text style={styles.noTransactionsTitle}>No transactions found</Text>
                    <Text style={styles.noTransactionsText}>
                      {searchQuery
                        ? "Try adjusting your search or filters"
                        : "Connect a bank account to start tracking"}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
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
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: colors.white,
    opacity: 0.9,
  },
  filterButton: {
    backgroundColor: colors.white + "20",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.white + "30",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: colors.text,
  },
  monthPickerContainer: {
    marginBottom: 20,
  },
  monthOption: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: colors.white,
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
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 25,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
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
    color: colors.primary,
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
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.white,
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
    color: colors.white,
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButtonText: {
    color: colors.text,
  },
  listContainer: {
    paddingBottom: 30,
  },
  transaction: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    height: ITEM_HEIGHT,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
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
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  valueDate: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  noTransactions: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
    padding: 20,
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
  noTransactionsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },
  noTransactionsText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  loader: {
    marginTop: 40,
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 20,
    color: colors.text,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 50,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    paddingRight: 30,
    backgroundColor: colors.white,
    marginBottom: 20,
  },
  inputAndroid: {
    height: 50,
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    paddingRight: 30,
    backgroundColor: colors.white,
    marginBottom: 20,
  },
});
