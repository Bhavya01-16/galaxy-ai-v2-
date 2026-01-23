"use client";

import { useCallback, useRef } from "react";
import { useWorkflowStore } from "@/store";
import { Undo2, Redo2, Trash2, ZoomIn, ZoomOut, Maximize2, Play, Square, Loader2, Download, Upload, Save } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { executeWorkflow } from "@/lib/workflow-executor";

export default function Toolbar() {
  const {
    nodes,
    edges,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelectedNodes,
    selectedNodeIds,
    takeSnapshot,
    isExecuting,
    setIsExecuting,
    setNodeStatus,
    resetExecution,
    setExecutionState,
    addWorkflowRun,
  } = useWorkflowStore();

  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleDelete = () => {
    if (selectedNodeIds.length > 0) {
      takeSnapshot();
      deleteSelectedNodes();
    }
  };

  const handleRun = useCallback(async () => {
    if (nodes.length === 0) {
      alert("Add some nodes to the workflow first!");
      return;
    }

    const startTime = Date.now();
    
    // Reset previous execution state
    resetExecution();
    setIsExecuting(true);
    setExecutionState({ status: "running", startTime });

    // Track node runs for history
    const nodeRunsMap: Record<string, {
      id: string;
      nodeId: string;
      nodeType: string;
      nodeLabel: string;
      status: string;
      startedAt?: Date;
      endedAt?: Date;
      duration?: number;
      error?: string;
    }> = {};

    try {
      const result = await executeWorkflow(nodes, edges, (nodeId, status, nodeResult) => {
        setNodeStatus(nodeId, status, nodeResult);
        
        // Track for history
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          if (!nodeRunsMap[nodeId]) {
            nodeRunsMap[nodeId] = {
              id: `${nodeId}_${startTime}`,
              nodeId,
              nodeType: node.type,
              nodeLabel: node.data.label,
              status,
            };
          }
          nodeRunsMap[nodeId].status = status;
          
          if (nodeResult) {
            nodeRunsMap[nodeId].startedAt = nodeResult.startTime ? new Date(nodeResult.startTime) : undefined;
            nodeRunsMap[nodeId].endedAt = nodeResult.endTime ? new Date(nodeResult.endTime) : undefined;
            nodeRunsMap[nodeId].duration = nodeResult.duration;
            nodeRunsMap[nodeId].error = nodeResult.error;
          }
        }
      });

      setExecutionState({
        status: result.status,
        endTime: result.endTime,
        error: result.error,
      });

      // Add to history
      const endTime = Date.now();
      const nodeRuns = Object.values(nodeRunsMap);
      const successCount = nodeRuns.filter((n) => n.status === "completed").length;
      const failedCount = nodeRuns.filter((n) => n.status === "failed").length;

      addWorkflowRun({
        id: `run_${startTime}`,
        status: result.status,
        startedAt: new Date(startTime),
        endedAt: new Date(endTime),
        duration: endTime - startTime,
        nodeCount: nodes.length,
        successCount,
        failedCount,
      });

    } catch (error) {
      const endTime = Date.now();
      
      setExecutionState({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        endTime,
      });

      // Add failed run to history
      addWorkflowRun({
        id: `run_${startTime}`,
        status: "failed",
        startedAt: new Date(startTime),
        endedAt: new Date(endTime),
        duration: endTime - startTime,
        nodeCount: nodes.length,
        successCount: 0,
        failedCount: nodes.length,
      });
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges, resetExecution, setIsExecuting, setExecutionState, setNodeStatus, addWorkflowRun]);

  const handleStop = useCallback(() => {
    // In a real implementation, this would cancel running tasks
    setIsExecuting(false);
    setExecutionState({ status: "cancelled", endTime: Date.now() });
  }, [setIsExecuting, setExecutionState]);

  // Export workflow as JSON
  const handleExport = useCallback(() => {
    if (nodes.length === 0) {
      alert("No nodes to export!");
      return;
    }

    const exportData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      application: "Galaxy AI",
      workflow: {
        name: "Exported Workflow",
        description: "Exported from Galaxy AI",
        nodes,
        edges,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `galaxy_workflow_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Import workflow from JSON
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.workflow || !data.workflow.nodes || !data.workflow.edges) {
        alert("Invalid workflow file format!");
        return;
      }

      // Import via API to get new IDs
      const response = await fetch("/api/workflows/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });

      const result = await response.json();
      if (result.success) {
        takeSnapshot();
        resetExecution();
        // Set nodes and edges from imported data
        const { setNodes, setEdges } = useWorkflowStore.getState();
        setNodes(result.workflow.nodes);
        setEdges(result.workflow.edges);
        alert("Workflow imported successfully!");
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch {
      alert("Failed to parse workflow file!");
    }

    // Reset input
    e.target.value = "";
  }, [takeSnapshot, resetExecution]);

  // Save workflow to server
  const handleSave = useCallback(async () => {
    if (nodes.length === 0) {
      alert("No nodes to save!");
      return;
    }

    const name = prompt("Enter workflow name:", "My Workflow");
    if (!name) return;

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: "Saved from Galaxy AI",
          nodes,
          edges,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Workflow "${name}" saved successfully!`);
      } else {
        alert(`Save failed: ${result.error}`);
      }
    } catch {
      alert("Failed to save workflow!");
    }
  }, [nodes, edges]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-surface border border-surface-border rounded-lg shadow-card">
        {/* Run/Stop Button */}
        {isExecuting ? (
          <button
            onClick={handleStop}
            className="
              flex items-center gap-2 px-3 py-1.5 rounded-md
              bg-red-500/20 text-red-400
              hover:bg-red-500/30
              transition-colors
            "
            title="Stop Execution"
          >
            <Square className="w-4 h-4" />
            <span className="text-sm font-medium">Stop</span>
          </button>
        ) : (
          <button
            onClick={handleRun}
            disabled={nodes.length === 0}
            className="
              flex items-center gap-2 px-3 py-1.5 rounded-md
              bg-green-500/20 text-green-400
              hover:bg-green-500/30
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
            title="Run Workflow"
          >
            <Play className="w-4 h-4" />
            <span className="text-sm font-medium">Run</span>
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-surface-border mx-1" />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo || isExecuting}
          className="
            p-2 rounded-md
            text-text-secondary hover:text-text-primary
            hover:bg-background-hover
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors
          "
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo || isExecuting}
          className="
            p-2 rounded-md
            text-text-secondary hover:text-text-primary
            hover:bg-background-hover
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors
          "
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-surface-border mx-1" />

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={selectedNodeIds.length === 0 || isExecuting}
          className="
            p-2 rounded-md
            text-text-secondary hover:text-red-400
            hover:bg-red-500/10
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors
          "
          title="Delete selected (Delete)"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-surface-border mx-1" />

        {/* Zoom controls */}
        <button
          onClick={() => zoomOut()}
          className="
            p-2 rounded-md
            text-text-secondary hover:text-text-primary
            hover:bg-background-hover
            transition-colors
          "
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoomIn()}
          className="
            p-2 rounded-md
            text-text-secondary hover:text-text-primary
            hover:bg-background-hover
            transition-colors
          "
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => fitView({ padding: 0.2 })}
          className="
            p-2 rounded-md
            text-text-secondary hover:text-text-primary
            hover:bg-background-hover
            transition-colors
          "
          title="Fit View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-surface-border mx-1" />

        {/* Save/Export/Import */}
        <button
          onClick={handleSave}
          disabled={nodes.length === 0 || isExecuting}
          className="
            p-2 rounded-md
            text-text-secondary hover:text-primary
            hover:bg-primary/10
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors
          "
          title="Save Workflow"
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          onClick={handleExport}
          disabled={nodes.length === 0 || isExecuting}
          className="
            p-2 rounded-md
            text-text-secondary hover:text-blue-400
            hover:bg-blue-500/10
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors
          "
          title="Export as JSON"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleImportClick}
          disabled={isExecuting}
          className="
            p-2 rounded-md
            text-text-secondary hover:text-green-400
            hover:bg-green-500/10
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors
          "
          title="Import JSON"
        >
          <Upload className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        {/* Execution Status Indicator */}
        {isExecuting && (
          <>
            <div className="w-px h-6 bg-surface-border mx-1" />
            <div className="flex items-center gap-2 px-2 text-amber-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Running...</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
