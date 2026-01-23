"use client";

import { Handle, Position, useEdges } from "@xyflow/react";
import type { HandleType, BaseNodeData } from "@/types/nodes";
import type { NodeExecutionStatus } from "@/store/types";

interface BaseNodeProps {
  id: string;
  data: BaseNodeData;
  selected?: boolean;
  icon: React.ReactNode;
  color: string;
  inputs?: HandleType[];
  outputs?: HandleType[];
  children?: React.ReactNode;
  executionStatus?: NodeExecutionStatus;
}

const handleColors: Record<HandleType, string> = {
  text: "bg-blue-500",
  image: "bg-green-500",
  video: "bg-purple-500",
  frame: "bg-orange-500",
  any: "bg-gray-400",
};

const handleLabels: Record<HandleType, string> = {
  text: "Text",
  image: "Image",
  video: "Video",
  frame: "Frame",
  any: "Any",
};

// Execution status styles
const executionStyles: Record<NodeExecutionStatus, { border: string; shadow: string; badge: string }> = {
  idle: { border: "", shadow: "", badge: "" },
  pending: { 
    border: "border-yellow-500/50", 
    shadow: "", 
    badge: "bg-yellow-500/20 text-yellow-400" 
  },
  running: { 
    border: "border-cyan-400 animate-pulse", 
    shadow: "shadow-lg shadow-cyan-500/30", 
    badge: "bg-cyan-500/20 text-cyan-400 animate-pulse" 
  },
  completed: { 
    border: "border-green-500", 
    shadow: "shadow-lg shadow-green-500/20", 
    badge: "bg-green-500/20 text-green-400" 
  },
  failed: { 
    border: "border-red-500", 
    shadow: "shadow-lg shadow-red-500/30", 
    badge: "bg-red-500/20 text-red-400" 
  },
  skipped: {
    border: "",
    shadow: "",
    badge: "bg-gray-500/20 text-gray-400"
  },
};

const executionIcons: Record<NodeExecutionStatus, React.ReactNode> = {
  idle: null,
  pending: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  running: (
    <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  completed: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  failed: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  skipped: null,
};

const executionLabels: Record<NodeExecutionStatus, string> = {
  idle: "",
  pending: "Waiting",
  running: "Running",
  completed: "Done",
  failed: "Error",
  skipped: "Skipped",
};

export default function BaseNode({
  id,
  data,
  selected,
  icon,
  color,
  inputs = [],
  outputs = [],
  children,
  executionStatus = "idle",
}: BaseNodeProps) {
  const edges = useEdges();
  const execStyle = executionStyles[executionStatus];

  // Check which input handles are connected
  const getInputConnectionStatus = (handleId: string) => {
    return edges.some((e) => e.target === id && e.targetHandle === handleId);
  };

  // Check if any input is connected
  const connectedInputs = inputs.map((type, index) => {
    const handleId = `input-${type}-${index}`;
    return {
      type,
      handleId,
      isConnected: getInputConnectionStatus(handleId),
    };
  });

  const hasAnyConnection = connectedInputs.some((input) => input.isConnected);

  // Determine border class
  const getBorderClass = () => {
    if (executionStatus !== "idle") {
      return execStyle.border;
    }
    if (selected) {
      return "border-purple-500 shadow-lg shadow-purple-500/20";
    }
    return "border-gray-700 hover:border-gray-600";
  };

  return (
    <div
      className={`
        min-w-[220px] rounded-xl border-2 transition-all duration-200
        ${getBorderClass()}
        ${execStyle.shadow}
        bg-gray-900/95 backdrop-blur-sm
        ${executionStatus === "running" ? "node-running-glow" : ""}
      `}
    >
      {/* Input Handles with labels */}
      {inputs.map((type, index) => {
        const handleId = `input-${type}-${index}`;
        const isConnected = getInputConnectionStatus(handleId);
        
        return (
          <div
            key={handleId}
            className="absolute left-0"
            style={{ top: `${((index + 1) / (inputs.length + 1)) * 100}%` }}
          >
            <Handle
              type="target"
              position={Position.Left}
              id={handleId}
              className={`
                !w-3 !h-3 !border-2 !border-gray-900 transition-all
                ${handleColors[type]}
                ${isConnected ? "!w-4 !h-4 ring-2 ring-offset-1 ring-offset-gray-900" : ""}
              `}
              style={{ left: -6 }}
            />
            {/* Handle label tooltip */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 whitespace-nowrap pointer-events-none">
              {handleLabels[type]}
              {isConnected && (
                <span className="ml-1 text-green-400">●</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Header */}
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-t-[10px] ${color}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-white">{icon}</span>
          <span className="text-sm font-medium text-white">{data.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Execution status badge */}
          {executionStatus !== "idle" && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${execStyle.badge}`}>
              {executionIcons[executionStatus]}
              <span>{executionLabels[executionStatus]}</span>
            </div>
          )}
          {/* Connection indicator (only show when idle and connected) */}
          {executionStatus === "idle" && hasAnyConnection && (
            <div className="flex items-center gap-1 text-[10px] text-white/70">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Connection status banner for nodes with inputs */}
        {inputs.length > 0 && hasAnyConnection && executionStatus === "idle" && (
          <div className="mb-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-1.5 text-[10px] text-green-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Input connected
            </div>
          </div>
        )}
        
        {/* Execution status banner */}
        {executionStatus === "running" && (
          <div className="mb-2 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400">
              <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Executing...
            </div>
          </div>
        )}
        
        {executionStatus === "completed" && (
          <div className="mb-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-1.5 text-[10px] text-green-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Completed
            </div>
          </div>
        )}
        
        {executionStatus === "failed" && (
          <div className="mb-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-1.5 text-[10px] text-red-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Error
            </div>
          </div>
        )}
        
        {children}
      </div>

      {/* Output Handles with labels */}
      {outputs.map((type, index) => {
        const handleId = `output-${type}-${index}`;
        const hasOutputConnection = edges.some(
          (e) => e.source === id && e.sourceHandle === handleId
        );
        
        return (
          <div
            key={handleId}
            className="absolute right-0"
            style={{ top: `${((index + 1) / (outputs.length + 1)) * 100}%` }}
          >
            {/* Handle label tooltip */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 whitespace-nowrap pointer-events-none text-right">
              {handleLabels[type]}
              {hasOutputConnection && (
                <span className="ml-1 text-blue-400">●</span>
              )}
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={handleId}
              className={`
                !w-3 !h-3 !border-2 !border-gray-900 transition-all
                ${handleColors[type]}
                ${hasOutputConnection ? "!w-4 !h-4" : ""}
              `}
              style={{ right: -6 }}
            />
          </div>
        );
      })}
    </div>
  );
}

// Export utility to check if node has connected input
export function useIsInputConnected(nodeId: string, handleId: string): boolean {
  const edges = useEdges();
  return edges.some((e) => e.target === nodeId && e.targetHandle === handleId);
}
