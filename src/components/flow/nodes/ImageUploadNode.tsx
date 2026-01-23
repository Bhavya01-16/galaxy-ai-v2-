"use client";

import { memo, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import type { ImageUploadNodeData } from "@/types/nodes";
import { useNodeExecution } from "@/hooks/useNodeExecution";

function ImageUploadNode(props: NodeProps) {
  const data = props.data as ImageUploadNodeData;
  const { status } = useNodeExecution(props.id);
  const [preview, setPreview] = useState<string | null>(data.imageUrl || null);

  return (
    <BaseNode
      {...props}
      data={data}
      executionStatus={status}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      }
      color="bg-green-600"
      inputs={[]}
      outputs={["image"]}
    >
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-24 object-cover rounded-lg"
          />
          <button
            onClick={() => setPreview(null)}
            disabled={status === "running"}
            className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 disabled:opacity-50"
          >
            x
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-green-500 transition-colors ${status === "running" ? "opacity-50 pointer-events-none" : ""}`}>
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-xs text-gray-500 mt-1">Upload Image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={status === "running"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setPreview(url);
              }
            }}
          />
        </label>
      )}
    </BaseNode>
  );
}

export default memo(ImageUploadNode);
