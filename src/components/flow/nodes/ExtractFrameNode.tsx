"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import type { ExtractFrameNodeData } from "@/types/nodes";
import { useNodeExecution } from "@/hooks/useNodeExecution";

function ExtractFrameNode(props: NodeProps) {
  const data = props.data as ExtractFrameNodeData;
  const { status } = useNodeExecution(props.id);

  return (
    <BaseNode
      {...props}
      data={data}
      executionStatus={status}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      }
      color="bg-orange-600"
      inputs={["video"]}
      outputs={["frame", "image"]}
    >
      <div className="space-y-2">
        {/* Timestamp */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Timestamp (seconds)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
            placeholder="0.0"
            defaultValue={data.timestamp || 0}
            disabled={status === "running"}
          />
        </div>

        {/* Format */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Format</label>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
            defaultValue={data.format || "png"}
            disabled={status === "running"}
          >
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
        </div>
      </div>
    </BaseNode>
  );
}

export default memo(ExtractFrameNode);
