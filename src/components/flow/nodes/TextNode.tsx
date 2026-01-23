"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";
import type { TextNodeData } from "@/types/nodes";
import { useNodeExecution } from "@/hooks/useNodeExecution";

function TextNode(props: NodeProps) {
  const data = props.data as TextNodeData;
  const { status } = useNodeExecution(props.id);
  
  return (
    <BaseNode
      {...props}
      data={data}
      executionStatus={status}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      }
      color="bg-blue-600"
      inputs={[]}
      outputs={["text"]}
    >
      <textarea
        className="w-full h-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 disabled:opacity-50"
        placeholder="Enter your text..."
        defaultValue={data.text || ""}
        disabled={status === "running"}
      />
    </BaseNode>
  );
}

export default memo(TextNode);
