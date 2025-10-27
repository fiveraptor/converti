interface UploadProgressProps {
  active: boolean;
  loaded: number;
  total: number;
  speedBps: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return "0 MB";
  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 1) {
    return `${megabytes.toFixed(2)} MB`;
  }
  const kilobytes = bytes / 1024;
  return `${kilobytes.toFixed(1)} KB`;
};

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond <= 0) return "0 MB/s";
  const megabytesPerSecond = bytesPerSecond / (1024 * 1024);
  if (megabytesPerSecond >= 1) {
    return `${megabytesPerSecond.toFixed(2)} MB/s`;
  }
  const kilobytesPerSecond = bytesPerSecond / 1024;
  return `${kilobytesPerSecond.toFixed(0)} KB/s`;
};

export const UploadProgress = ({ active, loaded, total, speedBps }: UploadProgressProps) => {
  if (!active) {
    return null;
  }

  const percent =
    total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : loaded > 0 ? 100 : 0;

  return (
    <div className="upload-progress">
      <div className="upload-progress-header">
        <span>Uploading...</span>
        <span>
          {percent}% · {formatBytes(loaded)} of {formatBytes(total || loaded)}
        </span>
      </div>
      <div className="upload-progress-bar">
        <div
          className={`upload-progress-fill${total <= 0 ? " indeterminate" : ""}`}
          style={total > 0 ? { width: `${percent}%` } : undefined}
        />
      </div>
      <div className="upload-progress-meta">
        <span>Current speed: {formatSpeed(speedBps)}</span>
      </div>
    </div>
  );
};
