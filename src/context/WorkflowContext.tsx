"use client";

import { createContext, useContext, useCallback, useState, useEffect, useRef, type ReactNode } from "react";
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from "@xyflow/react";
import { useNodesState, useEdgesState, addEdge } from "@xyflow/react";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { isValidConnection, getHandleType, getEdgeColor } from "@/lib/workflow-utils";
import { NodeType, type NodeData } from "@/types/nodes";
import type { 
  WorkflowNode, 
  WorkflowEdge, 
  NodeExecutionStatus, 
  NodeExecutionResult,
  WorkflowExecutionState,
  WorkflowRunStatus
} from "@/store/types";
import { executeWorkflow } from "@/lib/workflow-executor";
import type { WorkflowRunSummary, WorkflowRunRecord } from "@/types/history";
import * as historyStore from "@/lib/history-store";
import { defaultWorkflow, sampleWorkflows } from "@/lib/sample-workflows";

// Default data for each node type
const getDefaultNodeData = (type: NodeType): NodeData => {
  switch (type) {
    case NodeType.TEXT:
      return { label: "Text Input", text: "" };
    case NodeType.IMAGE_UPLOAD:
      return { label: "Image Upload", imageUrl: undefined, fileName: undefined };
    case NodeType.VIDEO_UPLOAD:
      return { label: "Video Upload", videoUrl: undefined, fileName: undefined, duration: undefined };
    case NodeType.LLM:
      return { label: "LLM Model", model: "gpt-4", prompt: "", temperature: 0.7 };
    case NodeType.CROP_IMAGE:
      return { label: "Crop Image", x: 0, y: 0, width: 100, height: 100 };
    case NodeType.EXTRACT_FRAME:
      return { label: "Extract Frame", timestamp: 0, format: "png" };
    default:
      return { label: "Unknown Node" };
  }
};

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

interface WorkflowContextType {
  // Workflow data
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  deleteNode: (nodeId: string) => void;
  deleteSelectedNodes: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedNodes: Node[];
  connectionError: string | null;
  
  // Execution state
  executionState: WorkflowExecutionState;
  isExecuting: boolean;
  runWorkflow: () => Promise<void>;
  stopWorkflow: () => void;
  getNodeStatus: (nodeId: string) => NodeExecutionStatus;
  getNodeResult: (nodeId: string) => NodeExecutionResult | undefined;
  
  // History
  workflowRuns: WorkflowRunSummary[];
  currentRunId: string | null;
  selectedRunDetails: WorkflowRunRecord | null;
  selectRun: (runId: string) => void;
  clearRunSelection: () => void;
  refreshHistory: () => void;
  
  // Sample workflows
  loadSampleWorkflow: (workflowKey: string) => void;
  clearWorkflow: () => void;
  availableWorkflows: { key: string; name: string; description: string }[];
}

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export function WorkflowProvider({ 
  children,
  workflowId = "demo-workflow",
  loadSampleOnMount = true,
}: { 
  children: ReactNode;
  workflowId?: string;
  loadSampleOnMount?: boolean;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<WorkflowExecutionState>({
    status: "idle",
    nodeStatuses: {},
    nodeResults: {},
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const hasLoadedSample = useRef(false);
  
  // History state
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRunSummary[]>([]);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [selectedRunDetails, setSelectedRunDetails] = useState<WorkflowRunRecord | null>(null);

  const { undo, redo, canUndo, canRedo, takeSnapshot } = useUndoRedo(
    nodes,
    edges,
    setNodes,
    setEdges
  );

  // Get selected nodes
  const selectedNodes = nodes.filter((n) => n.selected);

  // Available sample workflows
  const availableWorkflows = sampleWorkflows.map((workflow) => ({
    key: workflow.id,
    name: workflow.name,
    description: workflow.description,
  }));

  // Load a sample workflow
  const loadSampleWorkflow = useCallback((workflowKey: string) => {
    const sample = sampleWorkflows.find((w) => w.id === workflowKey);
    if (sample) {
      setNodes(sample.nodes);
      setEdges(sample.edges);
    }
  }, [setNodes, setEdges]);

  // Clear the workflow
  const clearWorkflow = useCallback(() => {
    takeSnapshot();
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges, takeSnapshot]);

  // Load default sample workflow on mount
  useEffect(() => {
    if (loadSampleOnMount && !hasLoadedSample.current) {
      hasLoadedSample.current = true;
      setNodes(defaultWorkflow.nodes);
      setEdges(defaultWorkflow.edges);
    }
  }, [loadSampleOnMount, setNodes, setEdges]);

  // Refresh history from store
  const refreshHistory = useCallback(() => {
    const runs = historyStore.getRecentRuns(50);
    setWorkflowRuns(runs);
  }, []);

  // Load history on mount
  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Select a run and load its details
  const selectRun = useCallback((runId: string) => {
    const run = historyStore.getWorkflowRun(runId);
    setSelectedRunDetails(run);
  }, []);

  // Clear run selection
  const clearRunSelection = useCallback(() => {
    setSelectedRunDetails(null);
  }, []);

  // Handle connections with validation
  const onConnect = useCallback(
    (connection: Connection) => {
      // Type cast nodes and edges to WorkflowNode[] and WorkflowEdge[] for validation
      const validation = isValidConnection(connection, nodes as WorkflowNode[], edges as WorkflowEdge[]);
      
      if (!validation.valid) {
        setConnectionError(validation.reason || "Invalid connection");
        setTimeout(() => setConnectionError(null), 2000);
        return;
      }

      takeSnapshot();

      // Get source node to determine handle type
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const sourceType = sourceNode && sourceNode.type
        ? getHandleType(sourceNode.type as NodeType, connection.sourceHandle || "", true)
        : null;
      const edgeColor = getEdgeColor(sourceType || connection.sourceHandle || "");

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: edgeColor, strokeWidth: 2 },
            data: { handleType: sourceType },
          },
          eds
        )
      );
    },
    [nodes, edges, setEdges, takeSnapshot]
  );

  // Add a new node
  const addNode = useCallback(
    (type: NodeType, position: { x: number; y: number }) => {
      takeSnapshot();

      const newNode: Node<NodeData> = {
        id: getNodeId(),
        type,
        position,
        data: getDefaultNodeData(type),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, takeSnapshot]
  );

  // Delete a specific node
  const deleteNode = useCallback(
    (nodeId: string) => {
      takeSnapshot();

      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges, takeSnapshot]
  );

  // Delete selected nodes
  const deleteSelectedNodes = useCallback(() => {
    const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);
    
    if (selectedNodeIds.length === 0) return;

    takeSnapshot();

    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) =>
      eds.filter((e) => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target))
    );
  }, [nodes, setNodes, setEdges, takeSnapshot]);

  // Handle node changes with snapshot for deletion
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const hasRemoval = changes.some((c) => c.type === "remove");
      if (hasRemoval) {
        takeSnapshot();
      }
      onNodesChange(changes);
    },
    [onNodesChange, takeSnapshot]
  );

  // Handle edge changes with snapshot for deletion
  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const hasRemoval = changes.some((c) => c.type === "remove");
      if (hasRemoval) {
        takeSnapshot();
      }
      onEdgesChange(changes);
    },
    [onEdgesChange, takeSnapshot]
  );

  // Status update callback for execution
  const handleStatusUpdate = useCallback(
    (nodeId: string, status: NodeExecutionStatus, result?: NodeExecutionResult) => {
      setExecutionState((prev) => ({
        ...prev,
        nodeStatuses: { ...prev.nodeStatuses, [nodeId]: status },
        nodeResults: result 
          ? { ...prev.nodeResults, [nodeId]: result }
          : prev.nodeResults,
      }));

      // Update history store
      if (currentRunId) {
        const historyStatus = status === "idle" ? "PENDING" : status.toUpperCase() as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
        historyStore.updateNodeExecution(currentRunId, nodeId, {
          status: historyStatus,
          startedAt: status === "running" ? new Date() : undefined,
          completedAt: status === "completed" || status === "failed" ? new Date() : undefined,
          duration: result?.duration,
          output: result?.output,
          error: result?.error,
        });
      }
    },
    [currentRunId]
  );

  // Run the workflow
  const runWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      setConnectionError("No nodes to execute");
      setTimeout(() => setConnectionError(null), 2000);
      return;
    }

    // Create a new run in history
    const run = historyStore.createWorkflowRun({
      workflowId,
      workflowSnapshot: { nodes, edges },
    });
    setCurrentRunId(run.id);

    setIsExecuting(true);
    setExecutionState({
      status: "running" as WorkflowRunStatus,
      nodeStatuses: {},
      nodeResults: {},
      startTime: Date.now(),
    });

    // Refresh history to show new run
    refreshHistory();

    try {
      const finalState = await executeWorkflow(
        nodes as WorkflowNode[],
        edges as WorkflowEdge[],
        handleStatusUpdate
      );
      
      setExecutionState(finalState);

      // Complete the run in history
      historyStore.completeWorkflowRun(run.id);
    } catch (error) {
      setExecutionState((prev) => ({
        ...prev,
        status: "failed" as WorkflowRunStatus,
        error: error instanceof Error ? error.message : "Unknown error",
        endTime: Date.now(),
      }));

      // Update run with error
      historyStore.updateWorkflowRun(run.id, {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      });
    } finally {
      setIsExecuting(false);
      setCurrentRunId(null);
      refreshHistory();
    }
  }, [nodes, edges, workflowId, handleStatusUpdate, refreshHistory]);

  // Stop the workflow (for future cancellation support)
  const stopWorkflow = useCallback(() => {
    if (currentRunId) {
      historyStore.updateWorkflowRun(currentRunId, {
        status: "CANCELLED",
        completedAt: new Date(),
      });
    }
    
    setExecutionState((prev) => ({
      ...prev,
      status: "cancelled" as WorkflowRunStatus,
      endTime: Date.now(),
    }));
    setIsExecuting(false);
    setCurrentRunId(null);
    refreshHistory();
  }, [currentRunId, refreshHistory]);

  // Get status for a specific node
  const getNodeStatus = useCallback(
    (nodeId: string): NodeExecutionStatus => {
      return executionState.nodeStatuses[nodeId] || "idle";
    },
    [executionState.nodeStatuses]
  );

  // Get result for a specific node
  const getNodeResult = useCallback(
    (nodeId: string): NodeExecutionResult | undefined => {
      return executionState.nodeResults[nodeId];
    },
    [executionState.nodeResults]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (event.ctrlKey && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((event.ctrlKey && event.shiftKey && event.key === "z") || 
          (event.ctrlKey && event.key === "y")) {
        event.preventDefault();
        redo();
      }
      // Delete: Delete or Backspace
      if (event.key === "Delete" || event.key === "Backspace") {
        // Only delete if not focused on an input
        const target = event.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          deleteSelectedNodes();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, deleteSelectedNodes]);

  return (
    <WorkflowContext.Provider
      value={{
        nodes,
        edges,
        setNodes,
        setEdges,
        onNodesChange: handleNodesChange,
        onEdgesChange: handleEdgesChange,
        onConnect,
        addNode,
        deleteNode,
        deleteSelectedNodes,
        undo,
        redo,
        canUndo,
        canRedo,
        selectedNodes,
        connectionError,
        executionState,
        isExecuting,
        runWorkflow,
        stopWorkflow,
        getNodeStatus,
        getNodeResult,
        workflowRuns,
        currentRunId,
        selectedRunDetails,
        selectRun,
        clearRunSelection,
        refreshHistory,
        loadSampleWorkflow,
        clearWorkflow,
        availableWorkflows,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}
