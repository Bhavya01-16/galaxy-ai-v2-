"use client";

import { useCallback, useState } from "react";
import { Upload, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface FileUploaderProps {
  accept: string;
  onUpload: (fileData: string, fileName: string, fileSize: number) => void;
  maxSize?: number; // in MB
  placeholder?: string;
  currentFile?: string;
  onClear?: () => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function FileUploader({
  accept,
  onUpload,
  maxSize = 50,
  placeholder = "Click or drag to upload",
  currentFile,
  onClear,
}: FileUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    const acceptedTypes = accept.split(",").map(t => t.trim());
    const fileType = file.type;
    const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
    
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith(".")) return fileExt === type;
      if (type.endsWith("/*")) return fileType.startsWith(type.replace("/*", ""));
      return fileType === type;
    });

    if (!isValidType) {
      setError(`Invalid file type. Accepted: ${accept}`);
      setStatus("error");
      return;
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      setError(`File too large. Max size: ${maxSize}MB`);
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setProgress(0);
    setError(null);

    try {
      // Read file as data URL (base64)
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      reader.onload = () => {
        const result = reader.result as string;
        onUpload(result, file.name, file.size);
        setStatus("success");
        setProgress(100);
        
        // Reset status after delay
        setTimeout(() => setStatus("idle"), 2000);
      };

      reader.onerror = () => {
        setError("Failed to read file");
        setStatus("error");
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }, [accept, maxSize, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // Reset input
  }, [handleFile]);

  return (
    <div className="space-y-2">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`
          relative border-2 border-dashed rounded-lg p-4
          transition-all cursor-pointer
          ${isDragging 
            ? "border-primary bg-primary/5" 
            : "border-surface-border hover:border-primary/50 hover:bg-surface/50"
          }
          ${status === "error" ? "border-red-500/50 bg-red-500/5" : ""}
          ${status === "success" ? "border-green-500/50 bg-green-500/5" : ""}
        `}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={status === "uploading"}
        />
        
        <div className="flex flex-col items-center gap-2 text-center">
          {status === "idle" && (
            <>
              <Upload className="w-6 h-6 text-text-muted" />
              <span className="text-xs text-text-tertiary">{placeholder}</span>
              <span className="text-[10px] text-text-muted">Max {maxSize}MB</span>
            </>
          )}
          
          {status === "uploading" && (
            <>
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs text-text-secondary">Uploading... {progress}%</span>
              <div className="w-full h-1 bg-surface-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </>
          )}
          
          {status === "success" && (
            <>
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span className="text-xs text-green-400">Upload complete!</span>
            </>
          )}
          
          {status === "error" && (
            <>
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span className="text-xs text-red-400">{error}</span>
            </>
          )}
        </div>
      </div>

      {/* Current File Display */}
      {currentFile && status !== "uploading" && (
        <div className="flex items-center justify-between px-2 py-1 bg-surface rounded border border-surface-border">
          <span className="text-xs text-text-secondary truncate flex-1">
            {currentFile}
          </span>
          {onClear && (
            <button
              onClick={onClear}
              className="p-1 text-text-muted hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
