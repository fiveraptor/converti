interface SelectedFileListProps {
  files: File[];
  onRemove: (file: File) => void;
}

export const SelectedFileList = ({ files, onRemove }: SelectedFileListProps) => {
  if (!files.length) {
    return (
      <p className="empty-info">
        Noch keine Dateien ausgewählt. Du kannst Dateien per Drag & Drop hinzufügen.
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
            Entfernen
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

