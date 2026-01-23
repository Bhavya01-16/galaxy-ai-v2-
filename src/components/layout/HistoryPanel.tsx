"use client";

import { useState } from "react";
import { useWorkflowStore } from "@/store";
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  Trash2,
  Type,
  ImageIcon,
  Video,
  Sparkles,
  Crop,
  Film,
} from "lucide-react";
import type { WorkflowRunStatus, NodeExecutionStatus, WorkflowRunSummary, NodeRunRecord, NodeType } from "@/store/types";

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatusIcon({ status, size = "sm" }: { status: WorkflowRunStatus | NodeExecutionStatus; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  
  switch (status) {
    case "completed":
      return <CheckCircle2 className={`${sizeClass} text-green-400`} />;
    case "failed":
      return <XCircle className={`${sizeClass} text-red-400`} />;
    case "running":
      return <Loader2 className={`${sizeClass} text-amber-400 animate-spin`} />;
    case "pending":
      return <Clock className={`${sizeClass} text-blue-400`} />;
    case "partial":
      return <AlertCircle className={`${sizeClass} text-amber-400`} />;
    case "cancelled":
    case "skipped":
      return <XCircle className={`${sizeClass} text-text-tertiary`} />;
    default:
      return <Clock className={`${sizeClass} text-text-tertiary`} />;
  }
}

function StatusBadge({ status }: { status: WorkflowRunStatus | NodeExecutionStatus }) {
  const colorMap: Record<string, string> = {
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    running: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    pending: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    partial: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    cancelled: "bg-surface text-text-tertiary border-surface-border",
    skipped: "bg-surface text-text-tertiary border-surface-border",
    idle: "bg-surface text-text-tertiary border-surface-border",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs
        border ${colorMap[status] || colorMap.idle}
      `}
    >
      <StatusIcon status={status} />
      <span className="capitalize">{status}</span>
    </span>
  );
}

function NodeTypeIcon({ nodeType }: { nodeType: string }) {
  const iconClass = "w-3 h-3";
  
  switch (nodeType) {
    case "textNode":
      return <Type className={iconClass} />;
    case "imageUploadNode":
      return <ImageIcon className={iconClass} />;
    case "videoUploadNode":
      return <Video className={iconClass} />;
    case "llmNode":
      return <Sparkles className={iconClass} />;
    case "cropImageNode":
      return <Crop className={iconClass} />;
    case "extractFrameNode":
      return <Film className={iconClass} />;
    default:
      return <Clock className={iconClass} />;
  }
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

function formatDuration(ms: number | undefined): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(date).toLocaleDateString();
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ============================================================================
// EXTENDED RUN TYPE WITH NODE DETAILS
// ============================================================================

export interface ExtendedWorkflowRun extends WorkflowRunSummary {
  nodeRuns?: NodeRunRecord[];
}

// ============================================================================
// RUN ITEM COMPONENT
// ============================================================================

interface RunItemProps {
  run: ExtendedWorkflowRun;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

function RunItem({ run, isExpanded, onToggle, onDelete }: RunItemProps) {
  return (
    <div className="border-b border-surface-border last:border-b-0">
      {/* Run Header */}
      <button
        onClick={onToggle}
        className="
          w-full p-3 text-left hover:bg-surface/50
          transition-colors flex items-start gap-3
        "
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <StatusBadge status={run.status} />
            <span className="text-xs text-text-tertiary">
              {formatRelativeTime(run.startedAt)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                {run.successCount}
              </span>
              {run.failedCount > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-400" />
                  {run.failedCount}
                </span>
              )}
              <span className="text-text-muted">/ {run.nodeCount} nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary">{formatDuration(run.duration)}</span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 text-text-muted" />
              ) : (
                <ChevronDown className="w-3 h-3 text-text-muted" />
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3">
          {/* Time Details */}
          <div className="mb-3 p-2 rounded-lg bg-background text-xs">
            <div className="flex justify-between text-text-tertiary mb-1">
              <span>Started:</span>
              <span className="text-text-secondary">{formatTime(run.startedAt)}</span>
            </div>
            {run.endedAt && (
              <div className="flex justify-between text-text-tertiary">
                <span>Ended:</span>
                <span className="text-text-secondary">{formatTime(run.endedAt)}</span>
              </div>
            )}
          </div>

          {/* Node Runs */}
          {run.nodeRuns && run.nodeRuns.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-text-tertiary mb-2">Node Execution:</div>
              {run.nodeRuns.map((nodeRun) => (
                <div
                  key={nodeRun.id}
                  className={`
                    flex items-center justify-between p-2 rounded-lg text-xs
                    ${nodeRun.status === "completed" ? "bg-green-500/5" : ""}
                    ${nodeRun.status === "failed" ? "bg-red-500/5" : ""}
                    ${nodeRun.status === "running" ? "bg-amber-500/5" : ""}
                    ${!["completed", "failed", "running"].includes(nodeRun.status) ? "bg-surface" : ""}
                  `}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon status={nodeRun.status} />
                    <NodeTypeIcon nodeType={nodeRun.nodeType} />
                    <span className="text-text-primary truncate">{nodeRun.nodeLabel}</span>
                  </div>
                  <span className="text-text-muted flex-shrink-0">
                    {formatDuration(nodeRun.duration)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="
              mt-3 w-full flex items-center justify-center gap-2 p-2
              rounded-lg text-xs text-red-400/70 hover:text-red-400
              hover:bg-red-500/10 transition-colors
            "
          >
            <Trash2 className="w-3 h-3" />
            Delete Run
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HISTORY PANEL COMPONENT
// ============================================================================

export default function HistoryPanel() {
  const { 
    historyPanel, 
    toggleHistoryPanel, 
    workflowRuns, 
    setWorkflowRuns,
    execution,
    isExecuting,
  } = useWorkflowStore();
  const { isOpen } = historyPanel;
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const handleToggleRun = (runId: string) => {
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  const handleDeleteRun = (runId: string) => {
    setWorkflowRuns(workflowRuns.filter((r) => r.id !== runId));
    if (expandedRunId === runId) {
      setExpandedRunId(null);
    }
  };

  // Show current execution if running
  const currentExecution: ExtendedWorkflowRun | null = isExecuting ? {
    id: "current",
    status: execution.status,
    startedAt: new Date(execution.startTime || Date.now()),
    nodeCount: Object.keys(execution.nodeStatuses).length,
    successCount: Object.values(execution.nodeStatuses).filter((s) => s === "completed").length,
    failedCount: Object.values(execution.nodeStatuses).filter((s) => s === "failed").length,
  } : null;

  return (
    <>
      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={toggleHistoryPanel}
          className="
            absolute right-0 top-1/2 -translate-y-1/2 z-20
            p-2 bg-surface border border-surface-border border-r-0
            rounded-l-lg hover:bg-background-hover transition-colors
          "
          aria-label="Open history panel"
        >
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        </button>
      )}

      {/* Panel */}
      <aside
        className={`
          h-full bg-background-secondary border-l border-surface-border
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? "w-history-panel" : "w-0"}
        `}
      >
        {isOpen && (
          <div className="h-full flex flex-col w-history-panel">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium text-text-primary">Run History</span>
                {workflowRuns.length > 0 && (
                  <span className="text-xs text-text-muted">({workflowRuns.length})</span>
                )}
              </div>
              <button
                onClick={toggleHistoryPanel}
                className="
                  p-1.5 rounded-lg hover:bg-surface
                  text-text-secondary hover:text-text-primary
                  transition-colors
                "
                aria-label="Close history panel"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Runs list */}
            <div className="flex-1 overflow-y-auto">
              {/* Current Execution */}
              {currentExecution && (
                <div className="border-b-2 border-primary/30 bg-primary/5">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        <span className="text-sm font-medium text-primary">Running...</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        {currentExecution.successCount}
                      </span>
                      {currentExecution.failedCount > 0 && (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-400" />
                          {currentExecution.failedCount}
                        </span>
                      )}
                      <span className="text-text-muted">/ {currentExecution.nodeCount} nodes</span>
                    </div>
                  </div>
                </div>
              )}

              {workflowRuns.length === 0 && !currentExecution ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
                    <Play className="w-8 h-8 text-text-muted" />
                  </div>
                  <h3 className="text-sm font-medium text-text-primary mb-1">
                    No runs yet
                  </h3>
                  <p className="text-xs text-text-tertiary max-w-[200px]">
                    Click the Run button to execute your workflow and see the
                    history here.
                  </p>
                </div>
              ) : (
                <div>
                  {(workflowRuns as ExtendedWorkflowRun[]).map((run) => (
                    <RunItem
                      key={run.id}
                      run={run}
                      isExpanded={expandedRunId === run.id}
                      onToggle={() => handleToggleRun(run.id)}
                      onDelete={() => handleDeleteRun(run.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer with clear all */}
            {workflowRuns.length > 1 && (
              <div className="p-3 border-t border-surface-border">
                <button
                  onClick={() => setWorkflowRuns([])}
                  className="
                    w-full p-2 rounded-lg text-xs
                    text-text-tertiary hover:text-red-400
                    hover:bg-red-500/10 transition-colors
                  "
                >
                  Clear All History
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
