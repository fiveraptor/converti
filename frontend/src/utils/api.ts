import type { CategoryMap, ConversionJob } from "../types/api";

const rawBase = import.meta.env.VITE_API_BASE_URL ?? "/api";
const API_BASE_URL = rawBase.replace(/\/$/, "");

const jsonHeaders: HeadersInit = {
  Accept: "application/json",
};

async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

async function handleBlobResponse(response: Response): Promise<Blob> {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return await response.blob();
}

export const api = {
  baseUrl: API_BASE_URL,

  async fetchCategories(): Promise<CategoryMap> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: jsonHeaders,
    });
    return handleJsonResponse<CategoryMap>(response);
  },

  async startConversion(
    category: string,
    targetFormat: string,
    files: File[],
  ): Promise<string> {
    const formData = new FormData();
    formData.append("category", category);
    formData.append("target_format", targetFormat);
    files.forEach((file) => formData.append("files", file, file.name));

    const response = await fetch(`${API_BASE_URL}/convert`, {
      method: "POST",
      body: formData,
    });
    const data = await handleJsonResponse<{ jobId: string }>(response);
    return data.jobId;
  },

  async fetchJob(jobId: string): Promise<ConversionJob> {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      headers: jsonHeaders,
    });
    return handleJsonResponse<ConversionJob>(response);
  },

  async downloadAll(jobId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/download`);
    return handleBlobResponse(response);
  },

  async downloadSingle(jobId: string, filename: string): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}/jobs/${jobId}/files/${encodeURIComponent(filename)}`,
    );
    return handleBlobResponse(response);
  },
};
