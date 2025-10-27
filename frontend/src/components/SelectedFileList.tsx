interface SelectedFileListProps {
  files: File[];
  onRemove: (file: File) => void;
}

export const SelectedFileList = ({ files, onRemove }: SelectedFileListProps) => {
  if (!files.length) {
    return (
      <p className="empty-info">
        No files selected yet. Drag and drop files here or use the picker above.
      </p>
    );
  }

  return (
    <ul className="file-list">
      {files.map((file) => (
        <li key={`${file.name}-${file.size}-${file.lastModified}`}>
          <div className="file-meta">
            <strong>{file.name}</strong>
            <span>{formatFileSize(file.size)}</span>
          </div>
          <button type="button" className="link-button" onClick={() => onRemove(file)}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};
