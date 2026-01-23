"use client";

import { useCallback, useRef } from "react";
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
import ConnectionError from "./ConnectionError";

function FlowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    connectionError,
  } = useWorkflow();

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
      const validation = validateConnection(conn, nodes, edges);
      return validation.valid;
    },
    [nodes, edges]
  );

  return (
    <div className="flex-1 flex h-full relative">
      {/* Left Sidebar - 6 Node Buttons */}
      <NodeSidebar onDragStart={onDragStart} />

      {/* Connection Error Toast */}
      <ConnectionError message={connectionError} />

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
    </div>
  );
}

export default function FlowCanvas() {
  return (
    <WorkflowProvider>
      <ReactFlowProvider>
        <FlowCanvasInner />
      </ReactFlowProvider>
    </WorkflowProvider>
  );
}
