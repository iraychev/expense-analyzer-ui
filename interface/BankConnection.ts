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
    /** ISO timestamp of the last fetch from the bank (null before the first sync). */
    lastSyncedAt?: string | null;
  }[];
  userId: number;
}