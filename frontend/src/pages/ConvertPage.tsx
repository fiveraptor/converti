import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConversionProgress } from "../components/ConversionProgress";
import { FileDropzone } from "../components/FileDropzone";
import { JobHistory } from "../components/JobHistory";
import { SelectedFileList } from "../components/SelectedFileList";
import { UploadProgress } from "../components/UploadProgress";
import { useCategories } from "../hooks/useCategories";
import { useJobHistory } from "../hooks/useJobHistory";
import { useNavigationGuard } from "../hooks/useNavigationGuard";
import { api } from "../utils/api";
import { triggerDownload } from "../utils/download";
import type { ConversionJob } from "../types/api";

type UploadState = {
  active: boolean;
  loaded: number;
  total: number;
  speedBps: number;
};

const initialUploadState: UploadState = {
  active: false,
  loaded: 0,
  total: 0,
  speedBps: 0,
};

export const ConvertPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { categories, loading, error: categoryError } = useCategories();
  const history = useJobHistory();
  const { trackJob } = history;
  const { setGuardMessage } = useNavigationGuard();

  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("");
  const [job, setJob] = useState<ConversionJob | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>(initialUploadState);

  const formats = useMemo(() => {
    if (!category || !categories) return [];
    return categories[category] ?? [];
  }, [category, categories]);

  useEffect(() => {
    if (!category) return;
    if (categories && !categories[category]) {
      navigate("/", { replace: true });
      return;
    }
    if (formats.length) {
      setTargetFormat((current) => current || formats[0]);
    }
  }, [categories, category, formats, navigate]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    setPolling(true);

    const poll = async () => {
      try {
        const data = await api.fetchJob(jobId);
        if (cancelled) return;
        setJob(data);
        if (data.status === "completed" || data.status === "failed") {
          setPolling(false);
          return true;
        }
      } catch (err) {
        if (!cancelled) {
          setUserError(err instanceof Error ? err.message : "Fehler beim Abrufen des Jobs");
          setPolling(false);
        }
        return true;
      }
      return false;
    };

    void poll();
    const interval = setInterval(async () => {
      const shouldStop = await poll();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  useEffect(() => {
    if (job) {
      trackJob(job);
    }
  }, [job, trackJob]);

  useEffect(() => {
    if (uploadState.active) {
      setGuardMessage("Aktuell laeuft noch ein Upload. Wirklich verlassen?");
    } else {
      setGuardMessage(null);
    }
    return () => {
      setGuardMessage(null);
    };
  }, [uploadState.active, setGuardMessage]);

  const addFiles = (newFiles: File[]) => {
    setUserError(null);
    setFiles((prev) => {
      const existingNames = new Set(prev.map((file) => file.name + file.size + file.lastModified));
      const deduped = newFiles.filter(
        (file) => !existingNames.has(file.name + file.size + file.lastModified),
      );
      return [...prev, ...deduped];
    });
  };

  const removeFile = (fileToRemove: File) => {
    setFiles((prev) =>
      prev.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          ),
      ),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!category) return;
    if (!files.length) {
      setUserError("Bitte fuege mindestens eine Datei hinzu.");
      return;
    }
    if (!targetFormat) {
      setUserError("Bitte waehle ein Zielformat aus.");
      return;
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    setIsSubmitting(true);
    setUploadState({
      active: true,
      loaded: 0,
      total: totalBytes,
      speedBps: 0,
    });
    setUserError(null);
    setJob(null);
    setJobId(null);

    const requestStart = performance.now();

    try {
      const id = await api.startConversion(category, targetFormat, files, {
        onProgress: ({ loaded, total, elapsedMs }) => {
          const elapsed = elapsedMs > 0 ? elapsedMs : performance.now() - requestStart;
          const seconds = elapsed > 0 ? elapsed / 1000 : 0;
          setUploadState((prev) => ({
            active: true,
            loaded,
            total: total || prev.total || totalBytes,
            speedBps: seconds > 0 ? loaded / seconds : 0,
          }));
        },
      });
      setJobId(id);
      const initialJob = await api.fetchJob(id);
      setJob(initialJob);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Konvertierung fehlgeschlagen");
    } finally {
      setIsSubmitting(false);
      setUploadState((prev) => ({
        active: false,
        loaded: prev.total || prev.loaded,
        total: prev.total,
        speedBps: 0,
      }));
    }
  };

  const handleDownloadAll = async () => {
    if (!job) return;
    try {
      const blob = await api.downloadAll(job.jobId);
      triggerDownload(blob, `converti-${job.category}-${job.jobId}.zip`);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Download fehlgeschlagen");
    }
  };

  const handleDownloadSingle = async (filename: string) => {
    if (!job) return;
    try {
      const blob = await api.downloadSingle(job.jobId, filename);
      triggerDownload(blob, filename);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Download fehlgeschlagen");
    }
  };

  if (loading && !categories) {
    return <p>Lade Konverter...</p>;
  }

  if (categoryError) {
    return <p className="error-text">{categoryError}</p>;
  }

  if (!category || !formats.length) {
    return <p>Diese Kategorie ist aktuell nicht verfuegbar.</p>;
  }

  const busy = isSubmitting || polling || uploadState.active;

  return (
    <div className="convert-page">
      <header className="convert-header">
        <h1>{titleByCategory(category)}</h1>
        <p>
          Waehle deine Dateien und das gewuenschte Zielformat. Converti verarbeitet mehrere Dateien
          nacheinander und informiert dich ueber den Fortschritt.
        </p>
      </header>

      <form className="convert-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Zielformat</span>
          <select
            value={targetFormat}
            onChange={(event) => setTargetFormat(event.target.value)}
            disabled={busy}
          >
            {formats.map((format) => (
              <option value={format} key={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <FileDropzone onFilesAdded={addFiles} disabled={busy} />

        <SelectedFileList files={files} onRemove={removeFile} />

        <UploadProgress
          active={uploadState.active}
          loaded={uploadState.loaded}
          total={uploadState.total}
          speedBps={uploadState.speedBps}
        />

        {userError && <p className="error-text">{userError}</p>}

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={busy || !files.length}>
            {isSubmitting ? "Startet..." : "Konvertierung starten"}
          </button>
          {files.length > 0 && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => setFiles([])}
              disabled={busy}
            >
              Auswahl zuruecksetzen
            </button>
          )}
        </div>
      </form>

      <ConversionProgress
        job={job}
        polling={polling}
        onDownloadAll={handleDownloadAll}
        onDownloadSingle={handleDownloadSingle}
      />

      <JobHistory history={history} onError={(message) => setUserError(message)} />
    </div>
  );
};

const titleByCategory = (category: string) => {
  switch (category) {
    case "images":
      return "Bilder konvertieren";
    case "audio":
      return "Audio konvertieren";
    case "video":
      return "Videos konvertieren";
    default:
      return category;
  }
};
