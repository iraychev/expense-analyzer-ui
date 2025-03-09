import { BankConnection } from "./BankConnection";

export interface User {
  id: number;
  username: string;
  password?: string;
  email: string;
  name: string;
  bankConnections: BankConnection[];
}