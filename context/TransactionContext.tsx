import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { Transaction } from "@/interface/Transaction";
import { fetchTransactions } from "@/api/transactionService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

type TransactionContextType = {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refreshTransactions: () => Promise<void>;
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        setError("Username not found in local storage");
        return;
      }

      const fetchedTransactions = await fetchTransactions(username);
      setTransactions(fetchedTransactions);
    } catch (err: any) {
      setError(err.message || "Failed to fetch transactions");
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load transactions when the provider mounts
  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        isLoading,
        error,
        refreshTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
};
