"use client";

import { useState } from "react";
import type { WorkflowRunSummary, WorkflowRunRecord, NodeExecutionRecord } from "@/types/history";

interface HistoryPanelProps {
  runs: WorkflowRunSummary[];
  selectedRunId: string | null;
  selectedRun: WorkflowRunRecord | null;
  onSelectRun: (runId: string) => void;
  onCloseDetails: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    RUNNING: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
    PARTIAL: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
    CANCELLED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    SKIPPED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  const icons: Record<string, React.ReactNode> = {
    PENDING: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    RUNNING: (
      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    COMPLETED: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    PARTIAL: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    FAILED: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    CANCELLED: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    SKIPPED: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    ),
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${styles[status] || styles.PENDING}`}>
      {icons[status]}
      {status.toLowerCase()}
    </span>
  );
}

// Format duration
function formatDuration(ms: number | undefined): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

// Format timestamp
function formatTime(date: Date | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return d.toLocaleDateString();
}

// Node execution row
function NodeExecutionRow({ execution }: { execution: NodeExecutionRecord }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border-b border-gray-800 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3 h-3 text-gray-500 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm text-gray-300">{execution.nodeLabel}</span>
          <span className="text-xs text-gray-600">({execution.nodeType})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{formatDuration(execution.duration)}</span>
          <StatusBadge status={execution.status} />
        </div>
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 pt-1 bg-gray-800/30 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Started:</span>
              <span className="text-gray-300 ml-1">{formatTime(execution.startedAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">Completed:</span>
              <span className="text-gray-300 ml-1">{formatTime(execution.completedAt)}</span>
            </div>
          </div>
          
          {execution.error && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
              <span className="font-medium">Error:</span> {execution.error}
            </div>
          )}
          
          {execution.output != null && (
            <div className="space-y-1">
              <span className="text-xs text-gray-500">Output:</span>
              <pre className="p-2 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto max-h-32">
                {typeof execution.output === "string" 
                  ? execution.output 
                  : JSON.stringify(execution.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Run details view
function RunDetails({ 
  run, 
  onClose 
}: { 
  run: WorkflowRunRecord; 
  onClose: () => void;
}) {
  const successCount = run.nodeExecutions.filter(e => e.status === "COMPLETED").length;
  const failedCount = run.nodeExecutions.filter(e => e.status === "FAILED").length;
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-white">Run Details</span>
        <StatusBadge status={run.status} />
      </div>
      
      {/* Stats */}
      <div className="p-3 border-b border-gray-800 grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{run.nodeExecutions.length}</div>
          <div className="text-xs text-gray-500">Nodes</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-400">{successCount}</div>
          <div className="text-xs text-gray-500">Success</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-red-400">{failedCount}</div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>
      </div>
      
      {/* Timing */}
      <div className="p-3 border-b border-gray-800 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Started:</span>
          <span className="text-gray-300">{formatTime(run.startedAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Completed:</span>
          <span className="text-gray-300">{formatTime(run.completedAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Duration:</span>
          <span className="text-gray-300">{formatDuration(run.duration)}</span>
        </div>
      </div>
      
      {/* Error */}
      {run.error && (
        <div className="p-3 border-b border-gray-800">
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
            {run.error}
          </div>
        </div>
      )}
      
      {/* Node Executions */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 text-xs text-gray-500 uppercase tracking-wider">
          Node Executions
        </div>
        {run.nodeExecutions.map((execution) => (
          <NodeExecutionRow key={execution.id} execution={execution} />
        ))}
      </div>
    </div>
  );
}

// Run summary row
function RunSummaryRow({ 
  run, 
  isSelected,
  onClick 
}: { 
  run: WorkflowRunSummary; 
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
        isSelected ? "bg-purple-500/10 border-l-2 border-l-purple-500" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <StatusBadge status={run.status} />
        <span className="text-xs text-gray-500">{formatRelativeTime(run.startedAt)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-gray-400">
            <span className="text-green-400">{run.successCount}</span>
            <span className="text-gray-600">/</span>
            <span className={run.failedCount > 0 ? "text-red-400" : "text-gray-400"}>{run.nodeCount}</span>
            <span className="text-gray-600 ml-1">nodes</span>
          </span>
        </div>
        <span className="text-gray-500">{formatDuration(run.duration)}</span>
      </div>
    </button>
  );
}

export default function HistoryPanel({
  runs,
  selectedRunId,
  selectedRun,
  onSelectRun,
  onCloseDetails,
  isOpen,
  onToggle,
}: HistoryPanelProps) {
  return (
    <>
      {/* Toggle Button (when closed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-gray-900 border border-gray-700 border-r-0 rounded-l-lg hover:bg-gray-800 transition-colors"
          title="Open History"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
      
      {/* Panel */}
      <div
        className={`
          h-full bg-gray-900/95 backdrop-blur-sm border-l border-gray-800 
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? "w-72" : "w-0"}
        `}
      >
        {isOpen && (
          <div className="h-full flex flex-col w-72">
            {selectedRun ? (
              <RunDetails run={selectedRun} onClose={onCloseDetails} />
            ) : (
              <>
                {/* Header */}
                <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-white">Run History</span>
                  </div>
                  <button
                    onClick={onToggle}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Runs List */}
                <div className="flex-1 overflow-y-auto">
                  {runs.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">No runs yet</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Click &quot;Run&quot; to execute your workflow
                      </p>
                    </div>
                  ) : (
                    runs.map((run) => (
                      <RunSummaryRow
                        key={run.id}
                        run={run}
                        isSelected={selectedRunId === run.id}
                        onClick={() => onSelectRun(run.id)}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
