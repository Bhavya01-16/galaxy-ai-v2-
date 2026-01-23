"use client";

import { memo, useCallback, useRef, useState } from "react";
import { type NodeProps } from "@xyflow/react";
import { Video, X, Upload, Loader2 } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store";
import type { VideoUploadNodeData } from "@/store/types";

function VideoUploadNodeComponent({ id, data, selected, ...props }: Omit<NodeProps, "data"> & { data: VideoUploadNodeData }) {
  const { updateNodeData } = useWorkflowStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setIsUploading(true);
        
        // Create blob URL for video preview (more efficient for large files)
        const videoUrl = URL.createObjectURL(file);
        
        // Get video duration
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          updateNodeData(id, {
            videoUrl,
            fileName: file.name,
            fileSize: file.size,
            duration: video.duration,
          });
          setIsUploading(false);
        };
        video.onerror = () => {
          setIsUploading(false);
          alert("Failed to load video");
        };
        video.src = videoUrl;
      }
    },
    [id, updateNodeData]
  );

  const handleClear = useCallback(() => {
    updateNodeData(id, {
      videoUrl: undefined,
      fileName: undefined,
      fileSize: undefined,
      duration: undefined,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [id, updateNodeData]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<Video className="w-4 h-4" />}
      iconBgColor="bg-purple-500"
      outputs={[{ id: "video-out", type: "video", label: "Video Output" }]}
      {...props}
    >
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {data.videoUrl ? (
          <div className="relative">
            {/* Preview */}
            <div className="relative w-full h-24 rounded-lg overflow-hidden border border-surface-border bg-black">
              <video
                src={data.videoUrl}
                className="w-full h-full object-cover"
                muted
              />
              <button
                onClick={handleClear}
                className="
                  absolute top-1 right-1 p-1 rounded-md
                  bg-black/50 hover:bg-red-500/80
                  text-white transition-colors
                "
                title="Remove video"
              >
                <X className="w-3 h-3" />
              </button>
              {/* Duration badge */}
              {data.duration && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs">
                  {formatDuration(data.duration)}
                </div>
              )}
            </div>
            {/* File info */}
            <div className="mt-2 text-xs text-text-tertiary truncate">
              {data.fileName}
              {data.fileSize && (
                <span className="ml-2 text-text-muted">
                  ({formatFileSize(data.fileSize)})
                </span>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="
              w-full h-24 rounded-lg border-2 border-dashed border-surface-border
              flex flex-col items-center justify-center gap-2
              text-text-tertiary hover:text-text-secondary
              hover:border-primary/50 hover:bg-primary/5
              transition-all cursor-pointer
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs">Loading...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-xs">Click to upload video</span>
              </>
            )}
          </button>
        )}
      </div>
    </BaseNode>
  );
}

export default memo(VideoUploadNodeComponent);
