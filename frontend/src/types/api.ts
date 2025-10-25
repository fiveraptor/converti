export type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface ConversionResult {
  sourceName: string;
  outputName: string;
  status: JobStatus;
  error: string | null;
}

export interface ConversionJob {
  jobId: string;
  category: string;
  targetFormat: string;
  status: JobStatus;
  progress: number;
  totalFiles: number;
  processedFiles: number;
  error: string | null;
  results: ConversionResult[];
}

export type CategoryMap = Record<string, string[]>;

export interface StoredJobMeta {
  jobId: string;
  category: string;
  targetFormat: string;
  addedAt: number;
}

