"use client";

import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  type IsValidConnection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./nodes";
import { NodeType } from "@/types/nodes";
import NodeSidebar from "./NodeSidebar";
import { useWorkflow, WorkflowProvider } from "@/context/WorkflowContext";
import { isValidConnection as validateConnection } from "@/lib/workflow-utils";
import type { WorkflowNode, WorkflowEdge } from "@/store/types";
import ConnectionError from "./ConnectionError";
import CanvasToolbar from "./CanvasToolbar";
import HistoryPanel from "./HistoryPanel";
import WorkflowSelector from "./WorkflowSelector";
import { NodeExecutionContext } from "@/hooks/useNodeExecution";

function FlowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [isSaving, setIsSaving] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [currentWorkflowName, setCurrentWorkflowName] = useState("Product Marketing Kit");
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedNodes,
    deleteSelectedNodes,
    connectionError,
    runWorkflow,
    isExecuting,
    getNodeStatus,
    getNodeResult,
    workflowRuns,
    selectedRunDetails,
    selectRun,
    clearRunSelection,
    loadSampleWorkflow,
    clearWorkflow,
    availableWorkflows,
  } = useWorkflow();

  const handleSelectWorkflow = (key: string) => {
    loadSampleWorkflow(key);
    const workflow = availableWorkflows.find(w => w.key === key);
    if (workflow) {
      setCurrentWorkflowName(workflow.name);
    }
  };

  const handleClearWorkflow = () => {
    clearWorkflow();
    setCurrentWorkflowName("Blank Canvas");
  };

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow") as NodeType;

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  // Validate connections before they're made (visual feedback)
  const isValidConnectionCheck: IsValidConnection = useCallback(
    (connection) => {
      // Convert to Connection type for validation
      const conn = {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
      };
      // Type cast nodes and edges to WorkflowNode[] and WorkflowEdge[] for validation
      const validation = validateConnection(conn, nodes as WorkflowNode[], edges as WorkflowEdge[]);
      return validation.valid;
    },
    [nodes, edges]
  );

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement save logic
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
  };

  const handleRun = async () => {
    await runWorkflow();
  };

  return (
    <NodeExecutionContext.Provider value={{ getNodeStatus, getNodeResult }}>
      <div className="flex-1 flex h-full relative">
        {/* Left Sidebar - 6 Node Buttons */}
        <NodeSidebar onDragStart={onDragStart} />

        {/* Connection Error Toast */}
        <ConnectionError message={connectionError} />

        {/* Workflow Selector (top-left) */}
        <div className="absolute top-3 left-20 z-10">
          <WorkflowSelector
            workflows={availableWorkflows}
            onSelect={handleSelectWorkflow}
            onClear={handleClearWorkflow}
            currentWorkflowName={currentWorkflowName}
          />
        </div>

        {/* Top Toolbar (right side) */}
        <CanvasToolbar
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSave={handleSave}
          isSaving={isSaving}
          onDelete={deleteSelectedNodes}
          canDelete={selectedNodes.length > 0}
          selectedCount={selectedNodes.length}
          onRun={handleRun}
          isRunning={isExecuting}
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
          isHistoryOpen={isHistoryOpen}
        />

        {/* Canvas Area */}
        <div className="flex-1 h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            isValidConnection={isValidConnectionCheck}
            fitView
            className="bg-gray-950"
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "#6366f1", strokeWidth: 2 },
            }}
            connectionLineStyle={{ stroke: "#6366f1", strokeWidth: 2 }}
            snapToGrid
            snapGrid={[15, 15]}
            deleteKeyCode={["Delete", "Backspace"]}
            multiSelectionKeyCode="Shift"
            selectionKeyCode="Shift"
          >
            <Controls
              className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
              showInteractive={false}
            />
            <MiniMap
              className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
              nodeColor={(node) => {
                switch (node.type) {
                  case NodeType.TEXT:
                    return "#3b82f6";
                  case NodeType.IMAGE_UPLOAD:
                    return "#22c55e";
                  case NodeType.VIDEO_UPLOAD:
                    return "#a855f7";
                  case NodeType.LLM:
                    return "#f59e0b";
                  case NodeType.CROP_IMAGE:
                    return "#ec4899";
                  case NodeType.EXTRACT_FRAME:
                    return "#f97316";
                  default:
                    return "#6b7280";
                }
              }}
              maskColor="rgba(0, 0, 0, 0.8)"
              pannable
              zoomable
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1f2937" />
          </ReactFlow>
        </div>

        {/* Right Sidebar - History Panel */}
        <HistoryPanel
          runs={workflowRuns}
          selectedRunId={selectedRunDetails?.id || null}
          selectedRun={selectedRunDetails}
          onSelectRun={selectRun}
          onCloseDetails={clearRunSelection}
          isOpen={isHistoryOpen}
          onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
        />
      </div>
    </NodeExecutionContext.Provider>
  );
}

export default function FlowCanvasWithToolbar() {
  return (
    <WorkflowProvider>
      <ReactFlowProvider>
        <FlowCanvasInner />
      </ReactFlowProvider>
    </WorkflowProvider>
  );
}
