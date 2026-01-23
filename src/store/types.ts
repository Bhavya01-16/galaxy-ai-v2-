import type { Node, Edge } from "@xyflow/react";

// ============================================================================
// NODE TYPES
// ============================================================================

export type NodeType =
  | "textNode"
  | "imageUploadNode"
  | "videoUploadNode"
  | "llmNode"
  | "cropImageNode"
  | "extractFrameNode";

export type HandleType = "text" | "image" | "video" | "frame" | "any";

// ============================================================================
// NODE DATA INTERFACES
// ============================================================================

export interface BaseNodeData extends Record<string, unknown> {
  label: string;
}

export interface TextNodeData extends BaseNodeData {
  text: string;
}

export interface ImageUploadNodeData extends BaseNodeData {
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface VideoUploadNodeData extends BaseNodeData {
  videoUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
}

export interface LLMNodeData extends BaseNodeData {
  model: "gemini-2.0-flash" | "gemini-1.5-flash-8b" | "gemini-2.0-flash-lite";
  prompt: string;
  systemPrompt?: string;
  temperature: number;
  maxTokens?: number;
}

export interface CropImageNodeData extends BaseNodeData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractFrameNodeData extends BaseNodeData {
  timestamp: number;
  format: "png" | "jpg" | "webp";
}

export type NodeData =
  | TextNodeData
  | ImageUploadNodeData
  | VideoUploadNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData;

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export interface WorkflowNode extends Node<NodeData> {
  type: NodeType;
}

export interface WorkflowEdge extends Edge {
  data?: {
    handleType?: HandleType;
  };
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

export type NodeExecutionStatus =
  | "idle"
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export type WorkflowRunStatus =
  | "idle"
  | "pending"
  | "running"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled";

export interface NodeExecutionResult {
  nodeId: string;
  status: NodeExecutionStatus;
  output?: unknown;
  error?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export interface WorkflowExecutionState {
  status: WorkflowRunStatus;
  runId?: string;
  nodeStatuses: Record<string, NodeExecutionStatus>;
  nodeResults: Record<string, NodeExecutionResult>;
  startTime?: number;
  endTime?: number;
  error?: string;
}

// ============================================================================
// HISTORY TYPES
// ============================================================================

export interface WorkflowRunSummary {
  id: string;
  status: WorkflowRunStatus;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  nodeCount: number;
  successCount: number;
  failedCount: number;
}

export interface NodeRunRecord {
  id: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: NodeExecutionStatus;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  input?: unknown;
  output?: unknown;
  error?: string;
}

export interface WorkflowRunRecord extends WorkflowRunSummary {
  workflowId: string;
  workflowSnapshot: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  nodeRuns: NodeRunRecord[];
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface SidebarState {
  isCollapsed: boolean;
  activeTab: "nodes" | "settings";
}

export interface HistoryPanelState {
  isOpen: boolean;
  selectedRunId: string | null;
}
