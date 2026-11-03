import axiosInstance from "./axiosInstance";
import { Transaction } from "@/interface/Transaction";

export const fetchTransactions = async (username: string): Promise<Transaction[]> => {
  const response = await axiosInstance.get(`/users/username/${username}/with-transactions`);
  // Flatten the transactions from the bank connections
  const transactions: Transaction[] = response.data.bankConnections.flatMap((connection: any) =>
    connection.accounts.flatMap((account: any) => account.transactions)
  );
  return transactions;
};

export const fetchCategories = async (): Promise<string[]> => {
  const response = await axiosInstance.get("/transactions/categories");
  return response.data;
};

export const updateTransactionCategory = async (id: number, category: string): Promise<Transaction> => {
  const response = await axiosInstance.put(`/transactions/${id}/category`, { category });
  return response.data;
};