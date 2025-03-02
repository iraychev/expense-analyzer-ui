import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Alert, StyleSheet, Picker } from "react-native";
import axiosInstance from "../../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"credit" | "debit">("credit");

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

  const filteredTransactions = transactions.filter(
    (transaction) =>
      (!selectedCategory || transaction.category === selectedCategory) &&
      (selectedTab === "credit" ? transaction.amount > 0 : transaction.amount < 0)
  );

  const categories = Array.from(new Set(transactions.map((t) => t.category)));

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedCategory}
        onValueChange={(itemValue) => setSelectedCategory(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="All Categories" value={null} />
        {categories.map((category) => (
          <Picker.Item key={category} label={category} value={category} />
        ))}
      </Picker>
      <View style={styles.tabContainer}>
        <Text
          style={[
            styles.tab,
            selectedTab === "credit" && styles.selectedTab,
          ]}
          onPress={() => setSelectedTab("credit")}
        >
          Credit
        </Text>
        <Text
          style={[
            styles.tab,
            selectedTab === "debit" && styles.selectedTab,
          ]}
          onPress={() => setSelectedTab("debit")}
        >
          Debit
        </Text>
      </View>
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.transaction}>
            <Text
              style={[
                styles.amount,
                { color: item.amount < 0 ? "red" : "green" },
              ]}
            >
              {item.amount < 0 ? "Debit" : "Credit"}: {Math.abs(item.amount)}{" "}
              {item.currency}
            </Text>
            <Text style={styles.type}>Type: {item.type}</Text>
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
    backgroundColor: "#f0f0f0",
  },
  picker: {
    marginBottom: 20,
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
  },
  selectedTab: {
    backgroundColor: "#ddd",
  },
  transaction: {
    marginBottom: 10,
    padding: 15,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  type: {
    fontSize: 14,
    color: "#999",
  },
});
