import { useState } from "react";
import type { JobHistoryItem, JobHistoryState } from "../hooks/useJobHistory";
import { api } from "../utils/api";
import { triggerDownload } from "../utils/download";

interface JobHistoryProps {
  history: JobHistoryState;
  onError?: (message: string) => void;
}

const statusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Abgeschlossen";
    case "processing":
      return "In Bearbeitung";
    case "failed":
      return "Fehlgeschlagen";
    case "pending":
      return "Wartend";
    case "cancelled":
      return "Abgebrochen";
    default:
      return status;
  }
};

const progressFromJob = (item: JobHistoryItem): number => {
  if (!item.job) return 0;
  return Math.round(item.job.progress * 100);
};

export const JobHistory = ({ history, onError }: JobHistoryProps) => {
  const [busyJob, setBusyJob] = useState<string | null>(null);

  const handleDownloadAll = async (jobId: string, category: string) => {
    try {
      setBusyJob(jobId);
      const blob = await api.downloadAll(jobId);
      triggerDownload(blob, `converti-${category}-${jobId}.zip`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Download fehlgeschlagen";
      onError?.(message);
    } finally {
      setBusyJob(null);
    }
  };

  const handleRemove = async (item: JobHistoryItem) => {
    const { jobId } = item.meta;
    try {
      setBusyJob(jobId);
      await api.deleteJob(jobId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Aktion fehlgeschlagen";
      onError?.(message);
      setBusyJob(null);
      return;
    }
    history.forgetJob(jobId);
    setBusyJob(null);
  };

  const hasItems = history.items.length > 0;

  return (
    <section className="history-section">
      <header className="history-header">
        <div>
          <h2>Verlauf</h2>
          <p className="history-subtitle">
            Zuletzt gestartete Konvertierungen. Daten werden lokal in deinem Browser
            gespeichert.
          </p>
        </div>
        <div className="history-actions">
          {hasItems && (
            <button
              type="button"
              className="link-button"
              onClick={() => history.clearAll()}
            >
              Verlauf leeren
            </button>
          )}
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setBusyJob("refresh");
              void history
                .refresh()
                .finally(() => setBusyJob((value) => (value === "refresh" ? null : value)));
            }}
            disabled={busyJob === "refresh"}
          >
            Aktualisieren
          </button>
        </div>
      </header>

      {history.loading && !hasItems ? (
        <p className="muted-text">Lade Verlauf...</p>
      ) : !hasItems ? (
        <p className="muted-text">Noch keine Konvertierungen vorhanden.</p>
      ) : (
        <ul className="history-list">
          {history.items.map((item) => {
            const jobStatus = item.job?.status ?? "unknown";
            const isActive = jobStatus === "pending" || jobStatus === "processing";
            const removeLabel = isActive ? "Abbrechen" : "Entfernen";

            return (
              <li key={item.meta.jobId} className={`history-item ${jobStatus}`}>
                <div className="history-primary">
                  <div className="history-title">
                    <strong>{item.meta.category.toUpperCase()}</strong>
                    <span className="history-jobid">Job-ID: {item.meta.jobId}</span>
                  </div>
                  <div className="history-meta">
                    <span>Ziel: {item.meta.targetFormat.toUpperCase()}</span>
                    <span>
                      Gestartet:{" "}
                      {new Date(item.meta.addedAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  {item.job ? (
                    <div className="history-status">
                      <span className={`status-tag ${item.job.status}`}>{statusLabel(item.job.status)}</span>
                      <div className="history-progress">
                        <div
                          className="history-progress-bar"
                          style={{ width: `${progressFromJob(item)}%` }}
                        />
                      </div>
                      <span className="history-progress-value">
                        {progressFromJob(item)}%
                      </span>
                    </div>
                  ) : (
                    item.error && <p className="error-text">{item.error}</p>
                  )}

                  {item.job?.status === "completed" && (
                    <div className="history-results">
                      <p>
                        {item.job.results.filter((result) => result.status === "completed").length}{" "}
                        Dateien konvertiert.
                      </p>
                    </div>
                  )}
                </div>
                <div className="history-actions-column">
                  {item.job?.status === "completed" && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleDownloadAll(item.meta.jobId, item.meta.category)}
                      disabled={busyJob === item.meta.jobId}
                    >
                      Alle herunterladen
                    </button>
                  )}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => handleRemove(item)}
                    disabled={busyJob === item.meta.jobId}
                  >
                    {removeLabel}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
