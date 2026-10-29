import { BankConnection } from "./BankConnection";

export interface User {
  id: number;
  username: string;
  password?: string;
  email: string;
  name: string;
  bankConnections: BankConnection[];
  /** Set when the server skipped the remote fetch because of provider rate limits. */
  throttled?: boolean;
  /** ISO timestamp after which the next remote fetch is allowed. */
  nextSyncAvailableAt?: string | null;
}