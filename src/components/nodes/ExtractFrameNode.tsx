"use client";

import { memo, useCallback } from "react";
import { type NodeProps } from "@xyflow/react";
import { Film } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store";
import type { ExtractFrameNodeData } from "@/store/types";

const FORMATS = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
  { value: "webp", label: "WebP" },
] as const;

function ExtractFrameNodeComponent({ id, data, selected, ...props }: NodeProps<ExtractFrameNodeData>) {
  const { updateNodeData } = useWorkflowStore();

  const handleTimestampChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { timestamp: parseFloat(e.target.value) || 0 });
    },
    [id, updateNodeData]
  );

  const handleFormatChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { format: e.target.value as ExtractFrameNodeData["format"] });
    },
    [id, updateNodeData]
  );

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<Film className="w-4 h-4" />}
      iconBgColor="bg-orange-500"
      inputs={[{ id: "video-in", type: "video", label: "Video Input" }]}
      outputs={[{ id: "frame-out", type: "frame", label: "Frame Output" }]}
      {...props}
    >
      <div className="space-y-3">
        {/* Timestamp */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-text-tertiary">Timestamp</label>
            <span className="text-xs text-text-secondary font-mono">
              {formatTimestamp(data.timestamp || 0)}
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="0.1"
            value={data.timestamp || 0}
            onChange={handleTimestampChange}
            placeholder="Seconds"
            className="
              w-full px-3 py-1.5 rounded-lg
              bg-background border border-surface-border
              text-sm text-text-primary
              focus:outline-none focus:border-primary
              transition-colors
            "
          />
        </div>

        {/* Format selector */}
        <div>
          <label className="text-xs text-text-tertiary block mb-1">Output Format</label>
          <select
            value={data.format || "png"}
            onChange={handleFormatChange}
            className="
              w-full px-3 py-2 rounded-lg
              bg-background border border-surface-border
              text-sm text-text-primary
              focus:outline-none focus:border-primary
              transition-colors cursor-pointer
            "
          >
            {FORMATS.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </BaseNode>
  );
}

export default memo(ExtractFrameNodeComponent);
