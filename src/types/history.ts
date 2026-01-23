// Types for workflow history

export type WorkflowRunStatus = 
  | "PENDING" 
  | "RUNNING" 
  | "COMPLETED" 
  | "PARTIAL" 
  | "FAILED" 
  | "CANCELLED";

export type NodeExecutionStatus = 
  | "PENDING" 
  | "RUNNING" 
  | "COMPLETED" 
  | "FAILED" 
  | "SKIPPED";

export interface NodeExecutionRecord {
  id: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: NodeExecutionStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  input?: unknown;
  output?: unknown;
  error?: string;
}

export interface WorkflowRunRecord {
  id: string;
  status: WorkflowRunStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  workflowId: string;
  workflowSnapshot: {
    nodes: unknown[];
    edges: unknown[];
  };
  nodeExecutions: NodeExecutionRecord[];
}

// Summary for list view
export interface WorkflowRunSummary {
  id: string;
  status: WorkflowRunStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  nodeCount: number;
  successCount: number;
  failedCount: number;
}

// For creating a new run
export interface CreateWorkflowRunInput {
  workflowId: string;
  workflowSnapshot: {
    nodes: unknown[];
    edges: unknown[];
  };
}

// For updating node execution
export interface UpdateNodeExecutionInput {
  status: NodeExecutionStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  input?: unknown;
  output?: unknown;
  error?: string;
}
