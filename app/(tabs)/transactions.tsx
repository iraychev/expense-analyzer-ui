import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  const [selectedTab, setSelectedTab] = useState<"credit" | "debit">("debit");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const months: string[] = [];
  for (let year = currentYear - 1; year <= currentYear; year++) {
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      if (year === currentYear && monthIndex > currentMonth) break;
      const month = new Date(year, monthIndex).toLocaleString("default", {
        month: "long",
      });
      months.push(`${year} ${month}`);
    }
  }

  const scrollViewRef = useRef<ScrollView>(null);

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

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const filteredTransactions = transactions.filter((transaction) => {
    const categoryMatch =
      selectedCategory === "" || transaction.category === selectedCategory;
    const typeMatch =
      selectedTab === "credit"
        ? transaction.amount > 0
        : transaction.amount < 0;

    let monthMatch = true;
    if (selectedMonth !== "All") {
      const [year, month] = selectedMonth.split(" ");
      const monthIndex = months.indexOf(selectedMonth) % 12;
      const transactionDate = new Date(transaction.valueDate);
      monthMatch =
        transactionDate.getFullYear() === parseInt(year) &&
        transactionDate.getMonth() === monthIndex;
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
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}.${month}.${year}`;
  };

  return (
    <View style={styles.container}>
      <RNPickerSelect
        onValueChange={(value: React.SetStateAction<string>) => setSelectedCategory(value)}
        items={[
          { label: "All Categories", value: "" },
          ...categories.map((category) => ({
            label: category,
            value: category,
          })),
        ]}
        style={pickerSelectStyles}
        value={selectedCategory}
      />
      <View style={styles.tabContainer}>
        <Text
          style={[styles.tab, selectedTab === "credit" && styles.selectedTab]}
          onPress={() => setSelectedTab("credit")}
        >
          Credit
        </Text>
        <Text
          style={[styles.tab, selectedTab === "debit" && styles.selectedTab]}
          onPress={() => setSelectedTab("debit")}
        >
          Debit
        </Text>
      </View>

      <View style={styles.monthPickerContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={scrollViewRef}
        >
          {months.map((month: string) => (
            <TouchableOpacity
              key={month}
              onPress={() => setSelectedMonth(month)}
              style={[
                styles.monthOption,
                selectedMonth === month && styles.selectedMonth,
              ]}
            >
              <Text>{month}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
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
                {item.amount < 0 ? "Debit" : "Credit"}: {Math.abs(item.amount)}{" "}
                {item.currency}
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
  picker: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ced4da",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  tab: {
    fontSize: 18,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#fff",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 5,
    borderColor: "#ced4da",
  },
  selectedTab: {
    backgroundColor: "#e9ecef",
    borderColor: "#adb5bd",
  },
  monthPickerContainer: {
    height: 60,
    marginBottom: 20,
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
  selectedMonth: {
    backgroundColor: "#e9ecef",
    borderColor: "#adb5bd",
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
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
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
  type: {
    fontSize: 14,
    color: "#6c757d",
  },
  description: {
    fontSize: 14,
    color: "#6c757d",
  },
  valueDate: {
    fontSize: 14,
    color: "#6c757d",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
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
