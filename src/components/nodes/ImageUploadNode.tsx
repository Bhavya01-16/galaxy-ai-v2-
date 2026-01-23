"use client";

import { memo, useCallback } from "react";
import { type NodeProps } from "@xyflow/react";
import { ImageIcon, X } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store";
import type { ImageUploadNodeData } from "@/store/types";
import { FileUploader } from "@/components/upload";

function ImageUploadNodeComponent({ id, data, selected, ...props }: NodeProps<ImageUploadNodeData>) {
  const { updateNodeData } = useWorkflowStore();

  const handleUpload = useCallback(
    (fileData: string, fileName: string, fileSize: number) => {
      updateNodeData(id, {
        imageUrl: fileData, // Now stores base64 data URL
        fileName,
        fileSize,
      });
    },
    [id, updateNodeData]
  );

  const handleClear = useCallback(() => {
    updateNodeData(id, {
      imageUrl: undefined,
      fileName: undefined,
      fileSize: undefined,
    });
  }, [id, updateNodeData]);

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
      icon={<ImageIcon className="w-4 h-4" />}
      iconBgColor="bg-green-500"
      outputs={[{ id: "image-out", type: "image", label: "Image Output" }]}
      {...props}
    >
      <div className="space-y-2">
        {data.imageUrl ? (
          <div className="relative">
            {/* Preview */}
            <div className="relative w-full h-24 rounded-lg overflow-hidden border border-surface-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.imageUrl}
                alt={data.fileName || "Uploaded image"}
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleClear}
                className="
                  absolute top-1 right-1 p-1 rounded-md
                  bg-black/50 hover:bg-red-500/80
                  text-white transition-colors
                "
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
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
          <FileUploader
            accept="image/*"
            onUpload={handleUpload}
            maxSize={10}
            placeholder="Click or drag to upload image"
          />
        )}
      </div>
    </BaseNode>
  );
}

export default memo(ImageUploadNodeComponent);
