export interface Transaction {
    id: number;
    amount: number;
    currency: string;
    valueDate: string;
    transactionDate?: string;
    category: string;
    description: string;
    type: string;
  }