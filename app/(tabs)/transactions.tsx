import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import axiosInstance from "../../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";

export default function Transactions() {
  interface Transaction {
    id: number;
    amount: number;
    currency: string;
    valueDate: string;
    transactionDate: string;
    category: string;
    description: string;
    type: string;
  }

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<
    "all" | "income" | "expense"
  >("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");

  const [tempCategory, setTempCategory] = useState<string>(selectedCategory);
  const [tempType, setTempType] = useState<"all" | "income" | "expense">(
    selectedType
  );
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

  useEffect(() => {
    const fetchTransactions = async () => {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        Alert.alert("Error", "Username not found in local storage");
        return;
      }
      try {
        const response = await axiosInstance.get(
          `/users/username/${username}/with-transactions`
        );
        setTransactions(
          response.data.bankConnections.flatMap((connection: any) =>
            connection.accounts.flatMap((account: any) => account.transactions)
          )
        );
      } catch (error: any) {
        Alert.alert("Failed to fetch transactions", error.message);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((transaction) => {
    const categoryMatch =
      selectedCategory === "" || transaction.category === selectedCategory;
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
      monthMatch =
        transactionDate.getFullYear() === parseInt(year) &&
        transactionMonth === monthName;
    }
    return categoryMatch && typeMatch && monthMatch;
  });

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity onPress={openFilterModal} style={styles.filterButton}>
          <FontAwesome name="filter" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.monthPickerContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={scrollViewRef}
        >
          {months.map((month) => (
            <TouchableOpacity
              key={month}
              onPress={() => setSelectedMonth(month)}
              style={[
                styles.monthOption,
                selectedMonth === month && styles.selectedMonth,
              ]}
            >
              <Text style={styles.monthText}>{month}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Filter Transactions</Text>
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
            />
            <View style={styles.toggleContainer}>
              {["all", "income", "expense"].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() =>
                    setTempType(type as "all" | "income" | "expense")
                  }
                  style={[
                    styles.toggleButton,
                    tempType === type && styles.selectedToggle,
                  ]}
                >
                  <Text style={styles.toggleText}>
                    {type === "income"
                      ? "Income"
                      : type === "expense"
                      ? "Expense"
                      : "All"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={applyFilters}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Apply</Text>
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
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => (
          <View style={styles.noTransactions}>
            <Text style={styles.noTransactionsText}>
              No transactions for the selected month.
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.transaction}>
            <FontAwesome
              name={getCategoryIcon(item.category)}
              size={24}
              color="black"
              style={styles.icon}
            />
            <View style={styles.transactionDetails}>
              <Text
                style={[
                  styles.amount,
                  { color: item.amount < 0 ? "red" : "green" },
                ]}
              >
                {Math.abs(item.amount)} {item.currency}
              </Text>
              <Text style={styles.valueDate}>{formatDate(item.valueDate)}</Text>
              <Text style={styles.description}>
                Description: {item.description}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  filterButton: {
    backgroundColor: "#6c757d",
    padding: 10,
    borderRadius: 5,
  },
  monthPickerContainer: {
    height: 50,
    marginBottom: 15,
  },
  monthOption: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ced4da",
    justifyContent: "center",
    alignItems: "center",
  },
  monthText: {
    fontSize: 16,
  },
  selectedMonth: {
    backgroundColor: "#e9ecef",
    borderColor: "#adb5bd",
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
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 5,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  selectedToggle: {
    backgroundColor: "#e9ecef",
    borderColor: "#adb5bd",
  },
  toggleText: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: "#6c757d",
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#adb5bd",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  transaction: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 15,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#fff",
    borderColor: "#ced4da",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  transactionDetails: {
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  valueDate: {
    fontSize: 14,
    color: "#6c757d",
  },
  description: {
    fontSize: 14,
    color: "#6c757d",
  },
  noTransactions: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  noTransactionsText: {
    fontSize: 18,
    color: "#6c757d",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 50,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  inputAndroid: {
    height: 50,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
});
