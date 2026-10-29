import React, { useState, useRef, useCallback, useMemo } from "react";
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

const ALL_MONTHS = "all";

const formatAmount = (amount: number): string =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount));

type MonthOption = { key: string; label: string; year: number; month: number };

const buildMonthOptions = (now: Date): MonthOption[] => {
  const options: MonthOption[] = [];
  for (let year = now.getFullYear() - 1; year <= now.getFullYear(); year++) {
    for (let month = 0; month < 12; month++) {
      if (year === now.getFullYear() && month > now.getMonth()) break;
      const name = new Date(year, month).toLocaleString("default", { month: "long" });
      options.push({ key: `${year}-${month}`, label: `${year} ${name}`, year, month });
    }
  }
  return options;
};

export default function Transactions() {
  const { transactions, isLoading: loading, isRefreshing, refreshTransactions } = useTransactions();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [tempCategory, setTempCategory] = useState<string>(selectedCategory);
  const [tempType, setTempType] = useState<"all" | "income" | "expense">(selectedType);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const monthOptions = useMemo(() => buildMonthOptions(new Date()), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[monthOptions.length - 1].key);

  const scrollViewRef = useRef<ScrollView>(null);

  const onRefresh = useCallback(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  const sortedTransactions = useMemo(() => {
    const month = monthOptions.find((m) => m.key === selectedMonth);
    const query = searchQuery.trim().toLowerCase();
    const numericQuery = query !== "" && !isNaN(Number(query)) ? Math.abs(Number(query)) : null;

    return transactions
      .filter((transaction) => {
        if (selectedCategory !== "" && transaction.category !== selectedCategory) return false;
        if (selectedType === "income" && transaction.amount <= 0) return false;
        if (selectedType === "expense" && transaction.amount >= 0) return false;

        if (month) {
          const date = new Date(transaction.valueDate);
          if (date.getFullYear() !== month.year || date.getMonth() !== month.month) return false;
        }

        if (query) {
          return (
            transaction.description.toLowerCase().includes(query) ||
            transaction.category.toLowerCase().includes(query) ||
            (numericQuery !== null && Math.abs(transaction.amount) === numericQuery)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.valueDate).getTime() - new Date(a.valueDate).getTime());
  }, [transactions, selectedCategory, selectedType, selectedMonth, searchQuery, monthOptions]);

  const hasActiveFilters = selectedCategory !== "" || selectedType !== "all";

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
          <Text style={styles.category} numberOfLines={1}>
            {item.category}
          </Text>
          <Text style={[styles.amount, { color: item.amount < 0 ? colors.expense : colors.income }]}>
            {item.amount < 0 ? "- " : "+ "}
            {formatAmount(item.amount)} {item.currency}
          </Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.valueDate}>{formatDate(item.valueDate)}</Text>
      </View>
    </View>
  );

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
              <TouchableOpacity
                onPress={openFilterModal}
                style={styles.filterButton}
                accessibilityRole="button"
                accessibilityLabel={hasActiveFilters ? "Filters (active)" : "Filters"}
              >
                <FontAwesome name="filter" size={18} color={colors.white} />
                {hasActiveFilters && <View style={styles.filterBadge} />}
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
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.monthPickerContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                ref={scrollViewRef}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
              >
                {[{ key: ALL_MONTHS, label: "All" }, ...monthOptions].map((month) => (
                  <TouchableOpacity
                    key={month.key}
                    onPress={() => setSelectedMonth(month.key)}
                    style={[styles.monthOption, selectedMonth === month.key && styles.selectedMonth]}
                  >
                    <Text style={[styles.monthText, selectedMonth === month.key && styles.selectedMonthText]}>
                      {month.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Modal
              visible={filterModalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setFilterModalVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setFilterModalVisible(false)}
              >
                <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
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
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>

            {loading ? (
              <ActivityIndicator size="large" color={colors.white} style={styles.loader} />
            ) : (
              <FlatList
                data={sortedTransactions}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                renderItem={renderTransaction}
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                initialNumToRender={10}
                windowSize={10}
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
  filterBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
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
    minHeight: 100,
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
    flexShrink: 1,
    marginRight: 8,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  amount: {
    flexShrink: 0,
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
