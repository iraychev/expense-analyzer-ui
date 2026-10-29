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
  /** silent = background poll: no refreshing flag and no error state. */
  refreshTransactions: (options?: { silent?: boolean }) => Promise<void>;
  /** Optimistically sets a category; rolls back and rethrows if the server rejects it. */
  recategorizeTransaction: (id: number, category: string, applyToMerchant: boolean) => Promise<void>;
};

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_MS = 3 * 60 * 1000;

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTransactions = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setIsRefreshing(true);
      setError(null);
    }

    try {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        setError("Username not found in local storage");
        return;
      }

      const fetchedTransactions = await fetchTransactions(username);
      setTransactions(fetchedTransactions);
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to fetch transactions");
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  const recategorizeTransaction = useCallback(
    async (id: number, category: string, applyToMerchant: boolean) => {
      let previous: Transaction | undefined;
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          previous = t;
          return { ...t, category, categoryStatus: "CATEGORIZED", categorySource: "USER" };
        })
      );

      try {
        const updated = await updateTransactionCategory(id, category, applyToMerchant);
        if (updated && typeof updated.id === "number") {
          setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
        }
      } catch (err) {
        // Roll back only this transaction so concurrent refreshes are not clobbered.
        if (previous) {
          const original = previous;
          setTransactions((prev) => prev.map((t) => (t.id === id ? original : t)));
        }
        throw err;
      }

      if (applyToMerchant) {
        await refreshTransactions({ silent: true });
      }
    },
    [refreshTransactions]
  );

  // While categorization is running on the server, quietly poll until nothing is pending.
  const hasPending = transactions.some((t) => t.categoryStatus === "PENDING");
  useEffect(() => {
    if (!hasPending) return;

    const startedAt = Date.now();
    let inFlight = false;
    const timer = setInterval(async () => {
      if (Date.now() - startedAt > MAX_POLL_MS) {
        clearInterval(timer);
        return;
      }
      if (inFlight) return;
      inFlight = true;
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          clearInterval(timer); // logged out
          return;
        }
        await refreshTransactions({ silent: true });
      } finally {
        inFlight = false;
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [hasPending, refreshTransactions]);

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
