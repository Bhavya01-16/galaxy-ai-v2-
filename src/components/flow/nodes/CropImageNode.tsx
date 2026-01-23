"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import type { CropImageNodeData } from "@/types/nodes";
import { useNodeExecution } from "@/hooks/useNodeExecution";

function CropImageNode(props: NodeProps) {
  const data = props.data as CropImageNodeData;
  const { status } = useNodeExecution(props.id);

  return (
    <BaseNode
      {...props}
      data={data}
      executionStatus={status}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      }
      color="bg-pink-600"
      inputs={["image"]}
      outputs={["image"]}
    >
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">X</label>
            <input
              type="number"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-pink-500 disabled:opacity-50"
              placeholder="0"
              defaultValue={data.x || 0}
              disabled={status === "running"}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Y</label>
            <input
              type="number"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-pink-500 disabled:opacity-50"
              placeholder="0"
              defaultValue={data.y || 0}
              disabled={status === "running"}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Width</label>
            <input
              type="number"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-pink-500 disabled:opacity-50"
              placeholder="100"
              defaultValue={data.width || 100}
              disabled={status === "running"}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Height</label>
            <input
              type="number"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-pink-500 disabled:opacity-50"
              placeholder="100"
              defaultValue={data.height || 100}
              disabled={status === "running"}
            />
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export default memo(CropImageNode);
