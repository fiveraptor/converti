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
      return "Completed";
    case "processing":
      return "In progress";
    case "failed":
      return "Failed";
    case "pending":
      return "Pending";
    case "cancelled":
      return "Cancelled";
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
      const message = error instanceof Error ? error.message : "Download failed.";
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
      const message = error instanceof Error ? error.message : "Action failed.";
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
          <h2>History</h2>
          <p className="history-subtitle">
            Recently started conversions. Entries are stored locally in your browser.
          </p>
        </div>
        <div className="history-actions">
          {hasItems && (
            <button
              type="button"
              className="link-button"
              onClick={() => history.clearAll()}
            >
              Clear history
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
            Refresh
          </button>
        </div>
      </header>

      {history.loading && !hasItems ? (
        <p className="muted-text">Loading history...</p>
      ) : !hasItems ? (
        <p className="muted-text">No conversions yet.</p>
      ) : (
        <ul className="history-list">
          {history.items.map((item) => {
            const jobStatus = item.job?.status ?? "unknown";
            const isActive = jobStatus === "pending" || jobStatus === "processing";
            const removeLabel = isActive ? "Cancel" : "Remove";

            return (
              <li key={item.meta.jobId} className={`history-item ${jobStatus}`}>
                <div className="history-primary">
                  <div className="history-title">
                    <strong>{item.meta.category.toUpperCase()}</strong>
                    <span className="history-jobid">Job ID: {item.meta.jobId}</span>
                  </div>
                  <div className="history-meta">
                    <span>Target: {item.meta.targetFormat.toUpperCase()}</span>
                    <span>
                      Started:{" "}
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
                        {item.job.results.filter((result) => result.status === "completed").length} files converted.
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
                      Download all
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
