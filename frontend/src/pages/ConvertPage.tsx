import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConversionProgress } from "../components/ConversionProgress";
import { FileDropzone } from "../components/FileDropzone";
import { JobHistory } from "../components/JobHistory";
import { SelectedFileList } from "../components/SelectedFileList";
import { useCategories } from "../hooks/useCategories";
import { useJobHistory } from "../hooks/useJobHistory";
import { api } from "../utils/api";
import { triggerDownload } from "../utils/download";
import type { ConversionJob } from "../types/api";

export const ConvertPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { categories, loading, error: categoryError } = useCategories();
  const history = useJobHistory();
  const { trackJob } = history;

  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("");
  const [job, setJob] = useState<ConversionJob | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

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

    setIsSubmitting(true);
    setUserError(null);
    setJob(null);
    setJobId(null);

    try {
      const id = await api.startConversion(category, targetFormat, files);
      setJobId(id);
      const initialJob = await api.fetchJob(id);
      setJob(initialJob);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Konvertierung fehlgeschlagen");
    } finally {
      setIsSubmitting(false);
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
            disabled={isSubmitting || polling}
          >
            {formats.map((format) => (
              <option value={format} key={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <FileDropzone onFilesAdded={addFiles} disabled={isSubmitting || polling} />

        <SelectedFileList files={files} onRemove={removeFile} />

        {userError && <p className="error-text">{userError}</p>}

        <div className="form-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting || polling || !files.length}
          >
            {isSubmitting ? "Startet..." : "Konvertierung starten"}
          </button>
          {files.length > 0 && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => setFiles([])}
              disabled={isSubmitting || polling}
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
    case "documents":
      return "Dokumente konvertieren";
    default:
      return category;
  }
};
