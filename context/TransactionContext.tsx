import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { Transaction } from "@/interface/Transaction";
import { fetchTransactions, updateTransactionCategory } from "@/api/transactionService";
import AsyncStorage from "@react-native-async-storage/async-storage";

type TransactionContextType = {
  transactions: Transaction[];
  /** True only while loading with nothing to show yet. */
  isLoading: boolean;
  /** True during any fetch, including background refreshes of existing data. */
  isRefreshing: boolean;
  error: string | null;
  refreshTransactions: () => Promise<void>;
  /** Optimistically sets a category; rolls back and rethrows if the server rejects it. */
  recategorizeTransaction: (id: number, category: string) => Promise<void>;
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTransactions = useCallback(async () => {
    setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  }, []);

  const recategorizeTransaction = useCallback(async (id: number, category: string) => {
    let previousCategory: string | undefined;
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        previousCategory = t.category;
        return { ...t, category };
      })
    );

    try {
      await updateTransactionCategory(id, category);
    } catch (err) {
      // Roll back only this transaction so concurrent refreshes are not clobbered.
      if (previousCategory !== undefined) {
        const original = previousCategory;
        setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, category: original } : t)));
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    const checkAndRefresh = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        refreshTransactions();
      } else {
        setIsLoading(false);
      }
    };

    checkAndRefresh();
  }, [refreshTransactions]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        isLoading,
        isRefreshing,
        error,
        refreshTransactions,
        recategorizeTransaction,
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
