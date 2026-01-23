// In-memory history store for demo (replace with Prisma in production)
// This allows the history panel to work without a database connection

import type { 
  WorkflowRunRecord, 
  WorkflowRunSummary, 
  NodeExecutionRecord,
  WorkflowRunStatus,
  NodeExecutionStatus,
  CreateWorkflowRunInput 
} from "@/types/history";

// In-memory storage
let workflowRuns: WorkflowRunRecord[] = [];
let runIdCounter = 1;
let nodeExecIdCounter = 1;

// Generate unique IDs
const generateRunId = () => `run_${runIdCounter++}_${Date.now()}`;
const generateNodeExecId = () => `exec_${nodeExecIdCounter++}_${Date.now()}`;

// Create a new workflow run
export function createWorkflowRun(input: CreateWorkflowRunInput): WorkflowRunRecord {
  const run: WorkflowRunRecord = {
    id: generateRunId(),
    status: "RUNNING",
    startedAt: new Date(),
    workflowId: input.workflowId,
    workflowSnapshot: input.workflowSnapshot,
    nodeExecutions: [],
  };
  
  // Initialize node executions for all nodes
  const nodes = input.workflowSnapshot.nodes as Array<{ id: string; type: string; data: { label: string } }>;
  for (const node of nodes) {
    run.nodeExecutions.push({
      id: generateNodeExecId(),
      nodeId: node.id,
      nodeType: node.type,
      nodeLabel: node.data?.label || node.type,
      status: "PENDING",
    });
  }
  
  workflowRuns.unshift(run); // Add to beginning (most recent first)
  
  // Keep only last 50 runs
  if (workflowRuns.length > 50) {
    workflowRuns = workflowRuns.slice(0, 50);
  }
  
  return run;
}

// Update workflow run status
export function updateWorkflowRun(
  runId: string, 
  updates: Partial<Pick<WorkflowRunRecord, "status" | "completedAt" | "duration" | "error">>
): WorkflowRunRecord | null {
  const run = workflowRuns.find(r => r.id === runId);
  if (!run) return null;
  
  Object.assign(run, updates);
  return run;
}

// Update node execution
export function updateNodeExecution(
  runId: string,
  nodeId: string,
  updates: {
    status?: NodeExecutionStatus;
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    input?: unknown;
    output?: unknown;
    error?: string;
  }
): NodeExecutionRecord | null {
  const run = workflowRuns.find(r => r.id === runId);
  if (!run) return null;
  
  const nodeExec = run.nodeExecutions.find(e => e.nodeId === nodeId);
  if (!nodeExec) return null;
  
  Object.assign(nodeExec, updates);
  return nodeExec;
}

// Complete a workflow run (calculates final status)
export function completeWorkflowRun(runId: string): WorkflowRunRecord | null {
  const run = workflowRuns.find(r => r.id === runId);
  if (!run) return null;
  
  const completedAt = new Date();
  const duration = completedAt.getTime() - run.startedAt.getTime();
  
  // Determine final status
  const executions = run.nodeExecutions;
  const failedCount = executions.filter(e => e.status === "FAILED").length;
  const completedCount = executions.filter(e => e.status === "COMPLETED").length;
  const totalCount = executions.length;
  
  let status: WorkflowRunStatus;
  if (failedCount === 0 && completedCount === totalCount) {
    status = "COMPLETED";
  } else if (failedCount === totalCount) {
    status = "FAILED";
  } else if (failedCount > 0) {
    status = "PARTIAL";
  } else {
    status = "COMPLETED";
  }
  
  run.status = status;
  run.completedAt = completedAt;
  run.duration = duration;
  
  return run;
}

// Get a specific run
export function getWorkflowRun(runId: string): WorkflowRunRecord | null {
  return workflowRuns.find(r => r.id === runId) || null;
}

// Get all runs for a workflow (with pagination)
export function getWorkflowRuns(
  workflowId: string,
  options: { limit?: number; offset?: number } = {}
): WorkflowRunSummary[] {
  const { limit = 20, offset = 0 } = options;
  
  return workflowRuns
    .filter(r => r.workflowId === workflowId)
    .slice(offset, offset + limit)
    .map(run => ({
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      duration: run.duration,
      nodeCount: run.nodeExecutions.length,
      successCount: run.nodeExecutions.filter(e => e.status === "COMPLETED").length,
      failedCount: run.nodeExecutions.filter(e => e.status === "FAILED").length,
    }));
}

// Get recent runs (for demo, returns all runs regardless of workflowId)
export function getRecentRuns(limit: number = 20): WorkflowRunSummary[] {
  return workflowRuns
    .slice(0, limit)
    .map(run => ({
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      duration: run.duration,
      nodeCount: run.nodeExecutions.length,
      successCount: run.nodeExecutions.filter(e => e.status === "COMPLETED").length,
      failedCount: run.nodeExecutions.filter(e => e.status === "FAILED").length,
    }));
}

// Clear all runs (for testing)
export function clearRuns(): void {
  workflowRuns = [];
  runIdCounter = 1;
  nodeExecIdCounter = 1;
}
