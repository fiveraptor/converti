import { useEffect, useState } from "react";
import type { CategoryMap } from "../types/api";
import { api } from "../utils/api";

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryMap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.fetchCategories();
        if (active) {
          setCategories(data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unbekannter Fehler");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading, error };
};

