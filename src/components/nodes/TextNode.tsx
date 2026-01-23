"use client";

import { memo, useCallback } from "react";
import { type NodeProps } from "@xyflow/react";
import { Type, Info } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store";
import type { TextNodeData } from "@/store/types";

function TextNodeComponent({ id, data, selected, ...props }: Omit<NodeProps, "data"> & { data: TextNodeData }) {
  const { updateNodeData } = useWorkflowStore();

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { text: e.target.value });
    },
    [id, updateNodeData]
  );

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<Type className="w-4 h-4" />}
      iconBgColor="bg-blue-500"
      outputs={[{ id: "text-out", type: "text", label: "Text Output" }]}
      {...props}
    >
      <div className="space-y-2">
        <label className="text-xs text-text-tertiary">Text Content</label>
        <textarea
          value={data.text || ""}
          onChange={handleTextChange}
          placeholder="Enter your text..."
          rows={3}
          className="
            w-full px-3 py-2 rounded-lg resize-none
            bg-background border border-surface-border
            text-sm text-text-primary placeholder-text-tertiary
            focus:outline-none focus:border-primary
            transition-colors
          "
        />
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Info className="w-3 h-3" />
          <span>This text will be passed to connected nodes</span>
        </div>
      </div>
    </BaseNode>
  );
}

export default memo(TextNodeComponent);
