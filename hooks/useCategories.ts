import { useEffect, useState } from "react";
import { Category } from "@/interface/Category";
import { fetchCategories, FALLBACK_CATEGORIES } from "@/api/categoryService";

let cached: Category[] | null = null;
let inFlight: Promise<Category[]> | null = null;

const loadCategories = (): Promise<Category[]> => {
  if (cached) return Promise.resolve(cached);
  if (!inFlight) {
    inFlight = fetchCategories()
      .then((list) => {
        cached = list;
        return list;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
};

/** Category list from the API, available immediately via the local fallback. */
export const useCategories = (): Category[] => {
  const [categories, setCategories] = useState<Category[]>(cached ?? FALLBACK_CATEGORIES);

  useEffect(() => {
    let active = true;
    loadCategories().then((list) => {
      if (active) setCategories(list);
    });
    return () => {
      active = false;
    };
  }, []);

  return categories;
};
