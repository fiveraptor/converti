import type { ConversionJob, ConversionResult } from "../types/api";

interface ConversionProgressProps {
  job: ConversionJob | null;
  polling: boolean;
  onDownloadAll: () => void;
  onDownloadSingle: (filename: string) => void;
}

export const ConversionProgress = ({
  job,
  polling,
  onDownloadAll,
  onDownloadSingle,
}: ConversionProgressProps) => {
  if (!job) return null;

  const progressPercent = Math.round(job.progress * 100);
  const showActivityDot = polling && (job.status === "pending" || job.status === "processing");

  return (
    <section className="conversion-status">
      <header className="conversion-header">
        <div>
          <h2>Status</h2>
          <p className="status-line">
            {translateStatus(job.status)}
            {showActivityDot && <span className="status-dot" />}
          </p>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="progress-value">{progressPercent}%</span>
      </header>

      {job.error && <p className="error-text">{job.error}</p>}

      <ul className="result-list">
        {job.results.map((result) => (
          <li key={result.outputName} className={`result-item ${result.status}`}>
            <div>
              <strong>{result.outputName}</strong>
              <p className="result-subtitle">{renderSubtitle(result)}</p>
            </div>
            {result.status === "completed" && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => onDownloadSingle(result.outputName)}
              >
                Download
              </button>
            )}
          </li>
        ))}
      </ul>

      {job.status === "completed" && (
        <button type="button" className="primary-button" onClick={onDownloadAll}>
          Download all files
        </button>
      )}
    </section>
  );
};

const translateStatus = (status: ConversionJob["status"]) => {
  switch (status) {
    case "pending":
      return "Waiting to be processed";
    case "processing":
      return "Conversion in progress";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

const renderSubtitle = (result: ConversionResult) => {
  if (result.status === "failed") {
    return result.error ?? "Unknown error";
  }
  if (result.status === "completed") {
    return "Ready to download";
  }
  if (result.status === "processing") {
    return "Processing...";
  }
  if (result.status === "cancelled") {
    return "Cancelled";
  }
  return "Queued for processing";
};
