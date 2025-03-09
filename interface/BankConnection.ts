import { Transaction } from "./Transaction";

export interface BankConnection {
  id: number;
  reference: string;
  institutionId: string;
  institutionName: string;
  requisitionId: string;
  accounts: {
    id?: number;
    iban?: string;
    bankConnectionId?: number;
    transactions: Transaction[];
    account_id?: string;
  }[];
  userId: number;
}