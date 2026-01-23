// Execution status for nodes
export type NodeExecutionStatus = 
  | "idle" 
  | "pending" 
  | "running" 
  | "completed" 
  | "error";

// Execution result for a single node
export interface NodeExecutionResult {
  nodeId: string;
  status: NodeExecutionStatus;
  output?: unknown;
  error?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

// Overall workflow execution state
export interface WorkflowExecutionState {
  status: "idle" | "running" | "completed" | "error" | "cancelled";
  nodeStatuses: Record<string, NodeExecutionStatus>;
  nodeResults: Record<string, NodeExecutionResult>;
  startTime?: number;
  endTime?: number;
  error?: string;
}

// Initial execution state
export const initialExecutionState: WorkflowExecutionState = {
  status: "idle",
  nodeStatuses: {},
  nodeResults: {},
};
