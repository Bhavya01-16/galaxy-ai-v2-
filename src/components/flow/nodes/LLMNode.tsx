"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import type { LLMNodeData } from "@/types/nodes";
import { useNodeExecution } from "@/hooks/useNodeExecution";

function LLMNode(props: NodeProps) {
  const data = props.data as LLMNodeData;
  const { status, result } = useNodeExecution(props.id);
  
  // Get output text from result
  const outputText = result?.output && typeof result.output === "object" 
    ? (result.output as { text?: string }).text 
    : undefined;

  return (
    <BaseNode
      {...props}
      data={data}
      executionStatus={status}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      }
      color="bg-amber-600"
      inputs={["text", "image"]}
      outputs={["text"]}
    >
      <div className="space-y-2">
        {/* Model Selector */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Model</label>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
            defaultValue={data.model || "gpt-4"}
            disabled={status === "running"}
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="claude-3">Claude 3</option>
            <option value="claude-2">Claude 2</option>
          </select>
        </div>

        {/* Prompt */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Prompt</label>
          <textarea
            className="w-full h-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-amber-500 disabled:opacity-50"
            placeholder="Enter your prompt..."
            defaultValue={data.prompt || ""}
            disabled={status === "running"}
          />
        </div>

        {/* Temperature */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Temperature: {data.temperature || 0.7}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            defaultValue={data.temperature || 0.7}
            disabled={status === "running"}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
          />
        </div>

        {/* Output Preview */}
        {status === "completed" && outputText && (
          <div className="mt-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
            <label className="text-xs text-gray-400 block mb-1">Output</label>
            <p className="text-xs text-gray-300 line-clamp-3">{outputText}</p>
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export default memo(LLMNode);
