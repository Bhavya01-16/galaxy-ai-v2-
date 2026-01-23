import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  WorkflowNode,
  WorkflowEdge,
  NodeExecutionStatus,
  NodeExecutionResult,
  WorkflowExecutionState,
  WorkflowRunSummary,
  WorkflowRunRecord,
  SidebarState,
  HistoryPanelState,
  NodeType,
  NodeData,
} from "./types";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
} from "@xyflow/react";

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface WorkflowState {
  // Workflow metadata
  workflowId: string | null;
  workflowName: string;
  isDirty: boolean;

  // React Flow state
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];

  // Selection state
  selectedNodeIds: string[];
  selectedEdgeIds: string[];

  // UI state
  sidebar: SidebarState;
  historyPanel: HistoryPanelState;

  // Execution state
  execution: WorkflowExecutionState;
  isExecuting: boolean;

  // History state
  workflowRuns: WorkflowRunSummary[];
  selectedRunDetails: WorkflowRunRecord | null;

  // Undo/Redo
  undoStack: Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>;
  redoStack: Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>;
  canUndo: boolean;
  canRedo: boolean;
}

interface WorkflowActions {
  // Workflow actions
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  setDirty: (dirty: boolean) => void;
  resetWorkflow: () => void;

  // Node actions
  setNodes: (nodes: WorkflowNode[]) => void;
  onNodesChange: OnNodesChange<WorkflowNode>;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteSelectedNodes: () => void;

  // Edge actions
  setEdges: (edges: WorkflowEdge[]) => void;
  onEdgesChange: OnEdgesChange<WorkflowEdge>;
  onConnect: (connection: Connection) => void;
  deleteEdge: (edgeId: string) => void;

  // Selection actions
  setSelectedNodeIds: (ids: string[]) => void;
  setSelectedEdgeIds: (ids: string[]) => void;
  clearSelection: () => void;

  // UI actions
  toggleSidebar: () => void;
  setSidebarTab: (tab: "nodes" | "settings") => void;
  toggleHistoryPanel: () => void;
  setHistoryPanelOpen: (open: boolean) => void;

  // Execution actions
  setExecutionState: (state: Partial<WorkflowExecutionState>) => void;
  setNodeStatus: (nodeId: string, status: NodeExecutionStatus, result?: NodeExecutionResult) => void;
  resetExecution: () => void;
  setIsExecuting: (executing: boolean) => void;

  // History actions
  setWorkflowRuns: (runs: WorkflowRunSummary[]) => void;
  setSelectedRunDetails: (run: WorkflowRunRecord | null) => void;
  addWorkflowRun: (run: WorkflowRunSummary) => void;

  // Undo/Redo actions
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

type WorkflowStore = WorkflowState & WorkflowActions;

// ============================================================================
// DEFAULT NODE DATA
// ============================================================================

const getDefaultNodeData = (type: NodeType): NodeData => {
  switch (type) {
    case "textNode":
      return { label: "Text Input", text: "" };
    case "imageUploadNode":
      return { label: "Image Upload", imageUrl: undefined, fileName: undefined };
    case "videoUploadNode":
      return { label: "Video Upload", videoUrl: undefined, fileName: undefined, duration: undefined };
    case "llmNode":
      return { label: "LLM", model: "gemini-1.5-flash", prompt: "", temperature: 0.7 };
    case "cropImageNode":
      return { label: "Crop Image", x: 0, y: 0, width: 100, height: 100 };
    case "extractFrameNode":
      return { label: "Extract Frame", timestamp: 0, format: "png" };
    default:
      return { label: "Unknown" };
  }
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialExecutionState: WorkflowExecutionState = {
  status: "idle",
  nodeStatuses: {},
  nodeResults: {},
};

const initialState: WorkflowState = {
  workflowId: null,
  workflowName: "Untitled Workflow",
  isDirty: false,
  nodes: [],
  edges: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],
  sidebar: {
    isCollapsed: false,
    activeTab: "nodes",
  },
  historyPanel: {
    isOpen: true,
    selectedRunId: null,
  },
  execution: initialExecutionState,
  isExecuting: false,
  workflowRuns: [],
  selectedRunDetails: null,
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
};

// ============================================================================
// NODE ID GENERATOR
// ============================================================================

let nodeIdCounter = 0;
const generateNodeId = () => `node_${++nodeIdCounter}_${Date.now()}`;

// ============================================================================
// STORE CREATION
// ============================================================================

export const useWorkflowStore = create<WorkflowStore>()(
  devtools(
    subscribeWithSelector(
      immer((set) => ({
        ...initialState,

        // Workflow actions
        setWorkflowId: (id) =>
          set((state) => {
            state.workflowId = id;
          }),

        setWorkflowName: (name) =>
          set((state) => {
            state.workflowName = name;
            state.isDirty = true;
          }),

        setDirty: (dirty) =>
          set((state) => {
            state.isDirty = dirty;
          }),

        resetWorkflow: () =>
          set((state) => {
            Object.assign(state, initialState);
          }),

        // Node actions
        setNodes: (nodes) =>
          set((state) => {
            state.nodes = nodes as WorkflowNode[];
            state.isDirty = true;
          }),

        onNodesChange: (changes) =>
          set((state) => {
            state.nodes = applyNodeChanges(changes, state.nodes) as WorkflowNode[];
            state.isDirty = true;
          }),

        addNode: (type, position) =>
          set((state) => {
            const newNode: WorkflowNode = {
              id: generateNodeId(),
              type,
              position,
              data: getDefaultNodeData(type),
            };
            state.nodes.push(newNode);
            state.isDirty = true;
          }),

        updateNodeData: (nodeId, data) =>
          set((state) => {
            const node = state.nodes.find((n) => n.id === nodeId);
            if (node) {
              node.data = { ...node.data, ...data };
              state.isDirty = true;
            }
          }),

        deleteNode: (nodeId) =>
          set((state) => {
            state.nodes = state.nodes.filter((n) => n.id !== nodeId);
            state.edges = state.edges.filter(
              (e) => e.source !== nodeId && e.target !== nodeId
            );
            state.isDirty = true;
          }),

        deleteSelectedNodes: () =>
          set((state) => {
            const selectedIds = state.selectedNodeIds;
            state.nodes = state.nodes.filter((n) => !selectedIds.includes(n.id));
            state.edges = state.edges.filter(
              (e) => !selectedIds.includes(e.source) && !selectedIds.includes(e.target)
            );
            state.selectedNodeIds = [];
            state.isDirty = true;
          }),

        // Edge actions
        setEdges: (edges) =>
          set((state) => {
            state.edges = edges as WorkflowEdge[];
            state.isDirty = true;
          }),

        onEdgesChange: (changes) =>
          set((state) => {
            state.edges = applyEdgeChanges(changes, state.edges) as WorkflowEdge[];
            state.isDirty = true;
          }),

        onConnect: (connection) =>
          set((state) => {
            state.edges = addEdge(connection, state.edges) as WorkflowEdge[];
            state.isDirty = true;
          }),

        deleteEdge: (edgeId) =>
          set((state) => {
            state.edges = state.edges.filter((e) => e.id !== edgeId);
            state.isDirty = true;
          }),

        // Selection actions
        setSelectedNodeIds: (ids) =>
          set((state) => {
            state.selectedNodeIds = ids;
          }),

        setSelectedEdgeIds: (ids) =>
          set((state) => {
            state.selectedEdgeIds = ids;
          }),

        clearSelection: () =>
          set((state) => {
            state.selectedNodeIds = [];
            state.selectedEdgeIds = [];
          }),

        // UI actions
        toggleSidebar: () =>
          set((state) => {
            state.sidebar.isCollapsed = !state.sidebar.isCollapsed;
          }),

        setSidebarTab: (tab) =>
          set((state) => {
            state.sidebar.activeTab = tab;
          }),

        toggleHistoryPanel: () =>
          set((state) => {
            state.historyPanel.isOpen = !state.historyPanel.isOpen;
          }),

        setHistoryPanelOpen: (open) =>
          set((state) => {
            state.historyPanel.isOpen = open;
          }),

        // Execution actions
        setExecutionState: (execState) =>
          set((state) => {
            Object.assign(state.execution, execState);
          }),

        setNodeStatus: (nodeId, status, result) =>
          set((state) => {
            state.execution.nodeStatuses[nodeId] = status;
            if (result) {
              state.execution.nodeResults[nodeId] = result;
            }
          }),

        resetExecution: () =>
          set((state) => {
            state.execution = initialExecutionState;
            state.isExecuting = false;
          }),

        setIsExecuting: (executing) =>
          set((state) => {
            state.isExecuting = executing;
          }),

        // History actions
        setWorkflowRuns: (runs) =>
          set((state) => {
            state.workflowRuns = runs;
          }),

        setSelectedRunDetails: (run) =>
          set((state) => {
            state.selectedRunDetails = run;
            state.historyPanel.selectedRunId = run?.id ?? null;
          }),

        addWorkflowRun: (run) =>
          set((state) => {
            state.workflowRuns.unshift(run);
            // Keep only last 50 runs
            if (state.workflowRuns.length > 50) {
              state.workflowRuns = state.workflowRuns.slice(0, 50);
            }
          }),

        // Undo/Redo actions
        takeSnapshot: () =>
          set((state) => {
            state.undoStack.push({
              nodes: JSON.parse(JSON.stringify(state.nodes)),
              edges: JSON.parse(JSON.stringify(state.edges)),
            });
            state.redoStack = [];
            state.canUndo = true;
            state.canRedo = false;
            // Limit undo stack to 50 items
            if (state.undoStack.length > 50) {
              state.undoStack.shift();
            }
          }),

        undo: () =>
          set((state) => {
            if (state.undoStack.length === 0) return;

            const current = {
              nodes: JSON.parse(JSON.stringify(state.nodes)),
              edges: JSON.parse(JSON.stringify(state.edges)),
            };
            state.redoStack.push(current);

            const previous = state.undoStack.pop()!;
            state.nodes = previous.nodes;
            state.edges = previous.edges;

            state.canUndo = state.undoStack.length > 0;
            state.canRedo = true;
            state.isDirty = true;
          }),

        redo: () =>
          set((state) => {
            if (state.redoStack.length === 0) return;

            const current = {
              nodes: JSON.parse(JSON.stringify(state.nodes)),
              edges: JSON.parse(JSON.stringify(state.edges)),
            };
            state.undoStack.push(current);

            const next = state.redoStack.pop()!;
            state.nodes = next.nodes;
            state.edges = next.edges;

            state.canUndo = true;
            state.canRedo = state.redoStack.length > 0;
            state.isDirty = true;
          }),
      }))
    ),
    { name: "workflow-store" }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectNodes = (state: WorkflowStore) => state.nodes;
export const selectEdges = (state: WorkflowStore) => state.edges;
export const selectSelectedNodes = (state: WorkflowStore) =>
  state.nodes.filter((n) => state.selectedNodeIds.includes(n.id));
export const selectIsExecuting = (state: WorkflowStore) => state.isExecuting;
export const selectNodeStatus = (nodeId: string) => (state: WorkflowStore) =>
  state.execution.nodeStatuses[nodeId] ?? "idle";
export const selectWorkflowRuns = (state: WorkflowStore) => state.workflowRuns;
