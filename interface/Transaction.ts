export type CategoryStatus = "PENDING" | "CATEGORIZED" | "FAILED" | "UNCATEGORIZABLE";

export interface Transaction {
    id: number;
    amount: number;
    currency: string;
    valueDate: string;
    transactionDate?: string;
    category: string;
    description: string;
    type: string;
    /** Missing on older API versions; treat as CATEGORIZED. */
    categoryStatus?: CategoryStatus;
    categorySource?: "USER" | "RULE" | "CACHE" | "AI";
    merchant?: string | null;
  }