"use client";

import { memo, useCallback } from "react";
import { type NodeProps } from "@xyflow/react";
import { Sparkles, Info } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store";
import type { LLMNodeData } from "@/store/types";

const MODELS = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-1.5-flash-8b", label: "Gemini 1.5 Flash 8B" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
] as const;

function LLMNodeComponent({ id, data, selected, ...props }: Omit<NodeProps, "data"> & { data: LLMNodeData }) {
  const { updateNodeData } = useWorkflowStore();

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { model: e.target.value as LLMNodeData["model"] });
    },
    [id, updateNodeData]
  );

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { prompt: e.target.value });
    },
    [id, updateNodeData]
  );

  const handleTemperatureChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { temperature: parseFloat(e.target.value) });
    },
    [id, updateNodeData]
  );

  const handleSystemPromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { systemPrompt: e.target.value });
    },
    [id, updateNodeData]
  );

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<Sparkles className="w-4 h-4" />}
      iconBgColor="bg-amber-500"
      inputs={[
        { id: "text-in", type: "text", label: "Text" },
        { id: "image-in", type: "image", label: "Image" },
      ]}
      outputs={[{ id: "text-out", type: "text", label: "Response" }]}
      {...props}
    >
      <div className="space-y-3">
        {/* Model selector */}
        <div>
          <label className="text-xs text-text-tertiary block mb-1">Model</label>
          <select
            value={data.model}
            onChange={handleModelChange}
            className="
              w-full px-3 py-2 rounded-lg
              bg-background border border-surface-border
              text-sm text-text-primary
              focus:outline-none focus:border-primary
              transition-colors cursor-pointer
            "
          >
            {MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        {/* System Prompt (Optional) */}
        <div>
          <label className="text-xs text-text-tertiary block mb-1">
            System Instructions <span className="text-text-muted">(optional)</span>
          </label>
          <textarea
            value={data.systemPrompt || ""}
            onChange={handleSystemPromptChange}
            placeholder="You are a helpful assistant..."
            rows={2}
            className="
              w-full px-3 py-2 rounded-lg resize-none
              bg-background border border-surface-border
              text-sm text-text-primary placeholder-text-tertiary
              focus:outline-none focus:border-primary
              transition-colors font-mono text-xs
            "
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="text-xs text-text-tertiary block mb-1">
            Prompt Template
          </label>
          <textarea
            value={data.prompt || ""}
            onChange={handlePromptChange}
            placeholder="Use {{input}} for connected text..."
            rows={3}
            className="
              w-full px-3 py-2 rounded-lg resize-none
              bg-background border border-surface-border
              text-sm text-text-primary placeholder-text-tertiary
              focus:outline-none focus:border-primary
              transition-colors font-mono text-xs
            "
          />
          <div className="flex items-start gap-1.5 mt-1.5 text-xs text-text-muted">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{"Use {{input}} to include connected text in your prompt"}</span>
          </div>
        </div>

        {/* Temperature slider */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-text-tertiary">Temperature</label>
            <span className="text-xs text-text-secondary font-mono">
              {data.temperature?.toFixed(1) || "0.7"}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={data.temperature || 0.7}
            onChange={handleTemperatureChange}
            className="
              w-full h-1.5 rounded-full appearance-none cursor-pointer
              bg-surface-border
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:transition-transform
            "
          />
          <div className="flex justify-between mt-1 text-[10px] text-text-muted">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export default memo(LLMNodeComponent);
