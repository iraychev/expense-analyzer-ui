export type CategoryKind = "EXPENSE" | "INCOME" | "TRANSFER";

export interface Category {
  key: string;
  label: string;
  kind: CategoryKind;
}
