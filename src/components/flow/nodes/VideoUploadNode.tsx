"use client";

import { memo, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import type { VideoUploadNodeData } from "@/types/nodes";
import { useNodeExecution } from "@/hooks/useNodeExecution";

function VideoUploadNode(props: NodeProps) {
  const data = props.data as VideoUploadNodeData;
  const { status } = useNodeExecution(props.id);
  const [fileName, setFileName] = useState<string | null>(data.fileName || null);
  const [preview, setPreview] = useState<string | null>(data.videoUrl || null);

  return (
    <BaseNode
      {...props}
      data={data}
      executionStatus={status}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      }
      color="bg-purple-600"
      inputs={[]}
      outputs={["video"]}
    >
      {preview ? (
        <div className="relative">
          <video
            src={preview}
            className="w-full h-24 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs truncate px-2">{fileName}</span>
          </div>
          <button
            onClick={() => {
              setPreview(null);
              setFileName(null);
            }}
            disabled={status === "running"}
            className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 disabled:opacity-50"
          >
            x
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-purple-500 transition-colors ${status === "running" ? "opacity-50 pointer-events-none" : ""}`}>
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <span className="text-xs text-gray-500 mt-1">Upload Video</span>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            disabled={status === "running"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setPreview(url);
                setFileName(file.name);
              }
            }}
          />
        </label>
      )}
    </BaseNode>
  );
}

export default memo(VideoUploadNode);
