"use client";

import { memo, useCallback } from "react";
import { type NodeProps } from "@xyflow/react";
import { Crop } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store";
import type { CropImageNodeData } from "@/store/types";

function CropImageNodeComponent({ id, data, selected, ...props }: NodeProps<CropImageNodeData>) {
  const { updateNodeData } = useWorkflowStore();

  const handleChange = useCallback(
    (field: keyof Pick<CropImageNodeData, "x" | "y" | "width" | "height">) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData(id, { [field]: parseInt(e.target.value) || 0 });
      },
    [id, updateNodeData]
  );

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<Crop className="w-4 h-4" />}
      iconBgColor="bg-pink-500"
      inputs={[{ id: "image-in", type: "image", label: "Image Input" }]}
      outputs={[{ id: "image-out", type: "image", label: "Cropped Image" }]}
      {...props}
    >
      <div className="space-y-3">
        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-tertiary block mb-1">X</label>
            <input
              type="number"
              min="0"
              value={data.x || 0}
              onChange={handleChange("x")}
              className="
                w-full px-3 py-1.5 rounded-lg
                bg-background border border-surface-border
                text-sm text-text-primary
                focus:outline-none focus:border-primary
                transition-colors
              "
            />
          </div>
          <div>
            <label className="text-xs text-text-tertiary block mb-1">Y</label>
            <input
              type="number"
              min="0"
              value={data.y || 0}
              onChange={handleChange("y")}
              className="
                w-full px-3 py-1.5 rounded-lg
                bg-background border border-surface-border
                text-sm text-text-primary
                focus:outline-none focus:border-primary
                transition-colors
              "
            />
          </div>
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-tertiary block mb-1">Width</label>
            <input
              type="number"
              min="1"
              value={data.width || 100}
              onChange={handleChange("width")}
              className="
                w-full px-3 py-1.5 rounded-lg
                bg-background border border-surface-border
                text-sm text-text-primary
                focus:outline-none focus:border-primary
                transition-colors
              "
            />
          </div>
          <div>
            <label className="text-xs text-text-tertiary block mb-1">Height</label>
            <input
              type="number"
              min="1"
              value={data.height || 100}
              onChange={handleChange("height")}
              className="
                w-full px-3 py-1.5 rounded-lg
                bg-background border border-surface-border
                text-sm text-text-primary
                focus:outline-none focus:border-primary
                transition-colors
              "
            />
          </div>
        </div>

        {/* Preview dimensions */}
        <div className="text-xs text-text-muted text-center p-2 bg-background rounded-lg">
          Crop: {data.width || 100} × {data.height || 100}px
        </div>
      </div>
    </BaseNode>
  );
}

export default memo(CropImageNodeComponent);
