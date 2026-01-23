"use client";

import { memo, type ReactNode, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useWorkflowStore, selectNodeStatus } from "@/store";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Trash2, Link, ChevronDown, ChevronUp, Clock } from "lucide-react";
import type { BaseNodeData, HandleType, NodeExecutionStatus, NodeExecutionResult } from "@/store/types";
import { isInputConnected } from "@/lib/workflow-utils";

// ============================================================================
// NODE STATUS INDICATOR
// ============================================================================

function StatusIndicator({ status }: { status: NodeExecutionStatus }) {
  switch (status) {
    case "running":
      return (
        <div className="absolute -top-1 -right-1 z-10">
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
        </div>
      );
    case "completed":
      return (
        <div className="absolute -top-1 -right-1 z-10">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        </div>
      );
    case "failed":
      return (
        <div className="absolute -top-1 -right-1 z-10">
          <XCircle className="w-4 h-4 text-red-400" />
        </div>
      );
    case "pending":
      return (
        <div className="absolute -top-1 -right-1 z-10">
          <AlertCircle className="w-4 h-4 text-blue-400" />
        </div>
      );
    default:
      return null;
  }
}

// ============================================================================
// STATUS GLOW CLASSES
// ============================================================================

function getStatusGlowClass(status: NodeExecutionStatus): string {
  switch (status) {
    case "running":
      return "ring-2 ring-amber-400/50 shadow-glow-amber animate-pulse-glow";
    case "completed":
      return "ring-2 ring-green-400/30";
    case "failed":
      return "ring-2 ring-red-400/50";
    case "pending":
      return "ring-2 ring-blue-400/30";
    default:
      return "";
  }
}

// ============================================================================
// HANDLE COLORS BY TYPE
// ============================================================================

function getHandleColor(handleType: HandleType): string {
  switch (handleType) {
    case "text":
      return "bg-blue-500 border-blue-400";
    case "image":
      return "bg-green-500 border-green-400";
    case "video":
      return "bg-purple-500 border-purple-400";
    case "frame":
      return "bg-orange-500 border-orange-400";
    case "any":
      return "bg-primary border-primary-light";
    default:
      return "bg-gray-500 border-gray-400";
  }
}

// ============================================================================
// NODE HANDLE COMPONENT
// ============================================================================

interface NodeHandleProps {
  type: "source" | "target";
  position: Position;
  id: string;
  handleType?: HandleType;
  label?: string;
  isConnected?: boolean;
}

export function NodeHandle({ type, position, id, handleType = "any", label, isConnected }: NodeHandleProps) {
  const handleColorClass = getHandleColor(handleType);
  
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      className={`
        !w-3 !h-3 !border-2 !rounded-full
        ${handleColorClass}
        ${isConnected ? "!ring-2 !ring-green-400/50" : ""}
        hover:!scale-125 transition-transform
      `}
      title={label || handleType}
    />
  );
}

// ============================================================================
// BASE NODE WRAPPER
// ============================================================================

interface BaseNodeProps extends NodeProps<BaseNodeData> {
  icon: ReactNode;
  iconBgColor: string;
  children?: ReactNode;
  inputs?: Array<{ id: string; type: HandleType; label?: string }>;
  outputs?: Array<{ id: string; type: HandleType; label?: string }>;
}

function BaseNodeComponent({
  id,
  data,
  selected,
  icon,
  iconBgColor,
  children,
  inputs = [],
  outputs = [],
}: BaseNodeProps) {
  const status = useWorkflowStore(selectNodeStatus(id));
  const edges = useWorkflowStore((state) => state.edges);
  const nodeResult = useWorkflowStore((state) => state.execution.nodeResults[id]);
  const isExecuting = useWorkflowStore((state) => state.isExecuting);
  const { deleteNode, takeSnapshot } = useWorkflowStore();
  const statusGlowClass = getStatusGlowClass(status);
  const [showResult, setShowResult] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    takeSnapshot();
    deleteNode(id);
  };

  // Check which inputs are connected
  const connectedInputs = inputs.reduce((acc, input) => {
    acc[input.id] = isInputConnected(id, input.id, edges);
    return acc;
  }, {} as Record<string, boolean>);

  // Format duration
  const formatDuration = (ms?: number) => {
    if (!ms) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Get result text
  const getResultText = (result: NodeExecutionResult | undefined) => {
    if (!result?.output) return null;
    const output = result.output as Record<string, unknown>;
    return output.text || output.imageData || output.videoData || output.frameData || null;
  };

  const resultText = getResultText(nodeResult);

  return (
    <div
      className={`
        relative min-w-[200px] max-w-[280px]
        bg-surface border border-surface-border rounded-xl
        shadow-card hover:shadow-card-hover
        transition-all duration-200
        ${selected ? "!border-primary ring-1 ring-primary/30" : ""}
        ${statusGlowClass}
      `}
    >
      {/* Status Indicator */}
      <StatusIndicator status={status} />

      {/* Input Handles */}
      {inputs.map((input) => (
        <NodeHandle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          handleType={input.type}
          label={input.label}
          isConnected={connectedInputs[input.id]}
        />
      ))}

      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-surface-border">
        <div
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${iconBgColor} text-white shadow-md
            ${status === "running" ? "animate-pulse" : ""}
          `}
        >
          {status === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        </div>
        <span className="text-sm font-medium text-text-primary flex-1 truncate">
          {data.label}
        </span>
        
        {/* Duration badge */}
        {nodeResult?.duration && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="w-3 h-3" />
            {formatDuration(nodeResult.duration)}
          </div>
        )}
        
        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isExecuting}
          className="
            p-1.5 rounded-md opacity-0 group-hover:opacity-100
            hover:bg-red-500/20 text-text-tertiary hover:text-red-400
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all
          "
          title="Delete node"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Connected inputs indicator */}
      {inputs.length > 0 && (
        <div className="px-3 py-2 border-b border-surface-border/50">
          <div className="flex flex-wrap gap-1">
            {inputs.map((input) => (
              <div
                key={input.id}
                className={`
                  flex items-center gap-1 px-2 py-0.5 rounded-md text-xs
                  ${connectedInputs[input.id]
                    ? "bg-green-500/20 text-green-400"
                    : "bg-surface-secondary text-text-tertiary"
                  }
                `}
                title={connectedInputs[input.id] ? `${input.label} connected` : `${input.label} not connected`}
              >
                {connectedInputs[input.id] && <Link className="w-3 h-3" />}
                <span>{input.label || input.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-3 group">{children}</div>

      {/* Execution Result */}
      {(status === "completed" || status === "failed") && nodeResult && (
        <div className="border-t border-surface-border">
          <button
            onClick={() => setShowResult(!showResult)}
            className="
              w-full flex items-center justify-between px-3 py-2
              text-xs text-text-secondary hover:text-text-primary
              hover:bg-background-hover transition-colors
            "
          >
            <span className={status === "failed" ? "text-red-400" : "text-green-400"}>
              {status === "failed" ? "Error" : "Output"}
            </span>
            {showResult ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          {showResult && (
            <div className="px-3 pb-3">
              {status === "failed" ? (
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
                  {nodeResult.error || "Unknown error"}
                </div>
              ) : resultText ? (
                <div className="p-2 rounded-lg bg-background text-text-secondary text-xs max-h-32 overflow-y-auto font-mono">
                  {String(resultText).substring(0, 500)}
                  {String(resultText).length > 500 && "..."}
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-green-500/10 text-green-400 text-xs">
                  Completed successfully
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Output Handles */}
      {outputs.map((output) => (
        <NodeHandle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          handleType={output.type}
          label={output.label}
        />
      ))}
    </div>
  );
}

export const BaseNode = memo(BaseNodeComponent);
