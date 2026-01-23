"use client";

import { useCallback, useRef, useEffect, DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  type ReactFlowInstance,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflowStore } from "@/store";
import type { NodeType, WorkflowNode, WorkflowEdge, NodeData } from "@/store/types";
import { isValidConnection } from "@/lib/workflow-utils";

// Import custom nodes
import TextNode from "../nodes/TextNode";
import ImageUploadNode from "../nodes/ImageUploadNode";
import VideoUploadNode from "../nodes/VideoUploadNode";
import LLMNode from "../nodes/LLMNode";
import CropImageNode from "../nodes/CropImageNode";
import ExtractFrameNode from "../nodes/ExtractFrameNode";
import Toolbar from "./Toolbar";

// Node type mapping for React Flow
const nodeTypes = {
  textNode: TextNode,
  imageUploadNode: ImageUploadNode,
  videoUploadNode: VideoUploadNode,
  llmNode: LLMNode,
  cropImageNode: CropImageNode,
  extractFrameNode: ExtractFrameNode,
};

// Default edge options
const defaultEdgeOptions = {
  type: "smoothstep",
  animated: false,
  style: {
    stroke: "#6366f1",
    strokeWidth: 2,
  },
};

// Connection line style
const connectionLineStyle = {
  stroke: "#8b5cf6",
  strokeWidth: 2,
};

function FlowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance<WorkflowNode, WorkflowEdge> | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    takeSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelectedNodes,
    selectedNodeIds,
  } = useWorkflowStore();

  // Keyboard shortcuts for undo/redo and delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) undo();
      }

      // Redo: Ctrl+Y / Cmd+Shift+Z / Ctrl+Shift+Z
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "z")
      ) {
        event.preventDefault();
        if (canRedo) redo();
      }

      // Delete selected nodes: Delete or Backspace
      if ((event.key === "Delete" || event.key === "Backspace") && selectedNodeIds.length > 0) {
        event.preventDefault();
        takeSnapshot();
        deleteSelectedNodes();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo, deleteSelectedNodes, takeSnapshot, selectedNodeIds]);

  // Handle drop from sidebar
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow") as NodeType;
      if (!type) return;

      // Take snapshot for undo before adding node
      takeSnapshot();

      // Get drop position in flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode, takeSnapshot]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle selection change
  const onSelectionChange = useCallback(
    ({ nodes, edges }: { nodes: WorkflowNode[]; edges: { id: string }[] }) => {
      setSelectedNodeIds(nodes.map((n) => n.id));
      setSelectedEdgeIds(edges.map((e) => e.id));
    },
    [setSelectedNodeIds, setSelectedEdgeIds]
  );

  // Validate connection before allowing it
  const handleIsValidConnection = useCallback(
    (connection: Connection) => {
      const result = isValidConnection(connection, nodes, edges);
      return result.valid;
    },
    [nodes, edges]
  );

  // Handle connection with snapshot
  const handleConnect = useCallback(
    (connection: Connection) => {
      // Double-check validation
      const result = isValidConnection(connection, nodes, edges);
      if (!result.valid) {
        console.warn("Invalid connection:", result.reason);
        return;
      }

      takeSnapshot();
      onConnect(connection);
    },
    [onConnect, takeSnapshot, nodes, edges]
  );

  // Handle node changes with snapshot for position changes
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      // Take snapshot only for significant changes (not selection/dimensions)
      const significantChange = changes.some(
        (change) => change.type === "remove" || change.type === "position"
      );
      if (significantChange && changes.some((c) => c.type === "position" && "dragging" in c && !c.dragging)) {
        takeSnapshot();
      }
      onNodesChange(changes);
    },
    [onNodesChange, takeSnapshot]
  );

  // Handle init
  const onInit = useCallback((instance: ReactFlowInstance<WorkflowNode, WorkflowEdge>) => {
    reactFlowInstance.current = instance;
  }, []);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative">
      <Toolbar />
      <ReactFlow<WorkflowNode, WorkflowEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={onSelectionChange}
        isValidConnection={handleIsValidConnection}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={connectionLineStyle}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={null}
        selectionKeyCode={["Shift"]}
        multiSelectionKeyCode={["Control", "Meta"]}
        panOnScroll
        zoomOnScroll
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#2a2a35"
          className="bg-background"
        />
        <Controls
          showZoom
          showFitView
          showInteractive
          position="bottom-left"
          className="!bg-surface !border-surface-border !rounded-lg !shadow-card"
        />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          className="!bg-surface !border-surface-border !rounded-lg !shadow-card"
          nodeColor={(node) => {
            switch (node.type) {
              case "textNode":
                return "#3b82f6";
              case "imageUploadNode":
                return "#22c55e";
              case "videoUploadNode":
                return "#a855f7";
              case "llmNode":
                return "#f59e0b";
              case "cropImageNode":
                return "#ec4899";
              case "extractFrameNode":
                return "#f97316";
              default:
                return "#6366f1";
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}
