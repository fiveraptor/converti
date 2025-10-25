import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConversionJob, StoredJobMeta } from "../types/api";
import { api } from "../utils/api";

const STORAGE_KEY = "converti:jobs";
const MAX_JOBS = 20;

const readStorage = (): StoredJobMeta[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          typeof (item as StoredJobMeta).jobId === "string"
        ) {
          const meta = item as StoredJobMeta;
          return {
            jobId: meta.jobId,
            category: meta.category ?? "unknown",
            targetFormat: meta.targetFormat ?? "",
            addedAt: typeof meta.addedAt === "number" ? meta.addedAt : Date.now(),
          };
        }
        return null;
      })
      .filter((item): item is StoredJobMeta => item !== null);
  } catch (error) {
    console.warn("Konnte Job-Verlauf nicht lesen:", error);
    return [];
  }
};

const writeStorage = (entries: StoredJobMeta[]) => {
  if (typeof window === "undefined") return;
  try {
    const unique = entries
      .filter((entry) => Boolean(entry.jobId))
      .reduce<StoredJobMeta[]>((acc, entry) => {
        if (acc.find((item) => item.jobId === entry.jobId)) {
          return acc;
        }
        acc.push(entry);
        return acc;
      }, [])
      .sort((a, b) => b.addedAt - a.addedAt)
      .slice(0, MAX_JOBS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch (error) {
    console.warn("Konnte Job-Verlauf nicht speichern:", error);
  }
};

export interface JobHistoryItem {
  meta: StoredJobMeta;
  job: ConversionJob | null;
  error?: string;
}

export interface JobHistoryState {
  items: JobHistoryItem[];
  loading: boolean;
  trackJob: (job: ConversionJob, addedAt?: number) => void;
  forgetJob: (jobId: string) => void;
  clearAll: () => void;
  refresh: () => Promise<void>;
}

export const useJobHistory = (): JobHistoryState => {
  const [items, setItems] = useState<JobHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.meta.addedAt - a.meta.addedAt),
    [items],
  );

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") {
      setItems([]);
      setLoading(false);
      return;
    }
    const stored = readStorage();
    if (!stored.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const responses = await Promise.allSettled(
      stored.map((record) => api.fetchJob(record.jobId)),
    );

    const survivingMeta: StoredJobMeta[] = [];
    const nextItems: JobHistoryItem[] = [];

    responses.forEach((result, index) => {
      const meta = stored[index];
      if (result.status === "fulfilled") {
        const job = result.value;
        const updatedMeta: StoredJobMeta = {
          jobId: meta.jobId,
          category: job.category,
          targetFormat: job.targetFormat,
          addedAt: meta.addedAt,
        };
        survivingMeta.push(updatedMeta);
        nextItems.push({ meta: updatedMeta, job });
      } else {
        const message =
          result.reason instanceof Error ? result.reason.message : "Unbekannter Fehler";
        if (message.toLowerCase().includes("not found")) {
          // Job existiert nicht mehr -> aus Verlauf entfernen
          return;
        }
        survivingMeta.push(meta);
        nextItems.push({
          meta,
          job: null,
          error: message,
        });
      }
    });

    writeStorage(survivingMeta);
    setItems(nextItems);
    setLoading(false);
  }, []);

  const trackJob = useCallback(
    (job: ConversionJob, addedAt?: number) => {
      const timestamp = addedAt ?? Date.now();
      setItems((prev) => {
        const existing = prev.find((entry) => entry.meta.jobId === job.jobId);
        const meta: StoredJobMeta = {
          jobId: job.jobId,
          category: job.category,
          targetFormat: job.targetFormat,
          addedAt: existing ? existing.meta.addedAt : timestamp,
        };
        if (existing) {
          return prev.map((entry) =>
            entry.meta.jobId === job.jobId ? { meta, job } : entry,
          );
        }
        return [{ meta, job }, ...prev].slice(0, MAX_JOBS);
      });

      if (typeof window === "undefined") return;
      const stored = readStorage();
      const existingMeta = stored.find((entry) => entry.jobId === job.jobId);
      const metaToSave: StoredJobMeta =
        existingMeta ??
        ({
          jobId: job.jobId,
          category: job.category,
          targetFormat: job.targetFormat,
          addedAt: timestamp,
        } as StoredJobMeta);

      writeStorage([metaToSave, ...stored.filter((entry) => entry.jobId !== job.jobId)]);
    },
    [],
  );

  const forgetJob = useCallback((jobId: string) => {
    if (typeof window !== "undefined") {
      const remaining = readStorage().filter((entry) => entry.jobId !== jobId);
      writeStorage(remaining);
    }
    setItems((prev) => prev.filter((entry) => entry.meta.jobId !== jobId));
  }, []);

  const clearAll = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setItems([]);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        void refresh();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  return {
    items: sortedItems,
    loading,
    trackJob,
    forgetJob,
    clearAll,
    refresh,
  };
};

