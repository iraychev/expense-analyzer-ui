import axiosInstance from "./axiosInstance";
import { Category, CategoryKind } from "@/interface/Category";

/** Used when GET /categories is unavailable (old API) or fails. */
export const FALLBACK_CATEGORIES: Category[] = [
  { key: "Supermarkets", label: "Supermarkets", kind: "EXPENSE" },
  { key: "Financial Services", label: "Financial Services", kind: "EXPENSE" },
  { key: "Shopping", label: "Shopping", kind: "EXPENSE" },
  { key: "Restaurants and bars", label: "Restaurants and bars", kind: "EXPENSE" },
  { key: "Entertainment and Sport", label: "Entertainment and Sport", kind: "EXPENSE" },
  { key: "Traveling and Vacation", label: "Traveling and Vacation", kind: "EXPENSE" },
  { key: "Health and Beauty", label: "Health and Beauty", kind: "EXPENSE" },
  { key: "Fees", label: "Fees", kind: "EXPENSE" },
  { key: "Other", label: "Other", kind: "EXPENSE" },
  { key: "Salary", label: "Salary", kind: "INCOME" },
  { key: "Other income", label: "Other income", kind: "INCOME" },
  { key: "Transfer in", label: "Transfer in", kind: "TRANSFER" },
  { key: "Transfer out", label: "Transfer out", kind: "TRANSFER" },
];

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await axiosInstance.get("/categories");
    const data = response.data;
    if (Array.isArray(data) && data.length > 0 && data.every((c) => c && typeof c.key === "string")) {
      return data.map((c) => ({ key: c.key, label: c.label || c.key, kind: c.kind || "EXPENSE" }));
    }
  } catch {
    // Old API (404) or network problem: fall back to the local list.
  }
  return FALLBACK_CATEGORIES;
};

/** Kind of a transaction's category (matched by key or label). Unknown categories count as expenses. */
export const getCategoryKind = (categories: Category[], category: string): CategoryKind => {
  const match = categories.find((c) => c.key === category || c.label === category);
  return match ? match.kind : "EXPENSE";
};

/** FontAwesome icon name for a category. */
export const getCategoryIcon = (category: string): any => {
  switch (category) {
    case "Supermarkets":
      return "shopping-cart";
    case "Financial Services":
      return "bank";
    case "Shopping":
      return "shopping-bag";
    case "Restaurants and bars":
      return "cutlery";
    case "Entertainment and Sport":
      return "futbol-o";
    case "Traveling and Vacation":
      return "plane";
    case "Health and Beauty":
      return "heartbeat";
    case "Salary":
      return "money";
    case "Other income":
      return "plus-circle";
    case "Transfer in":
      return "arrow-circle-down";
    case "Transfer out":
      return "arrow-circle-up";
    case "Fees":
      return "percent";
    default:
      return "question-circle";
  }
};
