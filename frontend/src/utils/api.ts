import type { CategoryMap, ConversionJob, UploadProgressPayload } from "../types/api";

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
    options?: {
      onProgress?: (payload: UploadProgressPayload) => void;
      signal?: AbortSignal;
    },
  ): Promise<string> {
    const formData = new FormData();
    formData.append("category", category);
    formData.append("target_format", targetFormat);
    files.forEach((file) => formData.append("files", file, file.name));

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

    return await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = performance.now();

      const cleanup = () => {
        xhr.upload.onprogress = null;
        xhr.onload = null;
        xhr.onerror = null;
        xhr.onabort = null;
      };

      xhr.open("POST", `${API_BASE_URL}/convert`);

      xhr.upload.onprogress = (event: ProgressEvent<EventTarget>) => {
        if (!options?.onProgress) return;
        const elapsedMs = performance.now() - startTime;
        const total = event.lengthComputable ? event.total : totalBytes;
        options.onProgress({
          loaded: event.loaded,
          total: total || totalBytes,
          elapsedMs,
        });
      };

      xhr.onload = () => {
        cleanup();
        const status = xhr.status;
        const responseText = xhr.responseText;
        if (status >= 200 && status < 300) {
          try {
            const data =
              responseText.length > 0 ? (JSON.parse(responseText) as { jobId: string }) : null;
            if (!data?.jobId) {
              reject(new Error("Serverantwort ungueltig"));
              return;
            }
            resolve(data.jobId);
          } catch (error) {
            reject(error instanceof Error ? error : new Error("JSON konnte nicht geparst werden"));
          }
        } else {
          try {
            const parsed = responseText ? JSON.parse(responseText) : null;
            if (parsed?.detail) {
              reject(new Error(parsed.detail));
            } else {
              reject(new Error(`HTTP ${status}`));
            }
          } catch {
            reject(new Error(`HTTP ${status}`));
          }
        }
      };

      xhr.onerror = () => {
        cleanup();
        reject(new Error("Upload fehlgeschlagen"));
      };

      xhr.onabort = () => {
        cleanup();
        reject(new Error("Upload abgebrochen"));
      };

      if (options?.signal) {
        if (options.signal.aborted) {
          xhr.abort();
          return;
        }
        options.signal.addEventListener("abort", () => {
          xhr.abort();
        });
      }

      xhr.send(formData);
    });
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

  async deleteJob(jobId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: "DELETE",
      headers: jsonHeaders,
    });
    if (response.ok || response.status === 202 || response.status === 204) {
      return;
    }
    if (response.status === 404) {
      return;
    }
    try {
      const data = await response.json();
      if (typeof data.detail === "string") {
        throw new Error(data.detail);
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(`HTTP ${response.status}`);
  },
};

