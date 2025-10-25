import { ChangeEvent, DragEvent, useRef, useState } from "react";

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  accept?: string;
  disabled?: boolean;
}

export const FileDropzone = ({ onFilesAdded, accept, disabled }: FileDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    onFilesAdded(Array.from(files));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const openFileDialog = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <div
        className={`dropzone ${isDragging ? "dragging" : ""} ${disabled ? "disabled" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        onClick={openFileDialog}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFileDialog();
          }
        }}
      >
        <div className="dropzone-inner">
          <p className="dropzone-title">Dateien hier ablegen oder klicken</p>
          <p className="dropzone-subtitle">
            Unterstützt mehrere Dateien gleichzeitig · Größe begrenzt durch Server-Konfiguration
          </p>
          <span className="dropzone-hint">Drag & Drop</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        style={{ display: "none" }}
        accept={accept}
        onChange={onInputChange}
        multiple
        disabled={disabled}
      />
    </>
  );
};

