import type { Connection } from "@xyflow/react";
import type { WorkflowNode, WorkflowEdge, NodeType } from "@/store/types";
import type { HandleType as HandleTypeDef } from "@/store/types";

// Alias to avoid duplicate identifier issues
type HandleType = HandleTypeDef;

// ============================================================================
// HANDLE TYPE DEFINITIONS FOR EACH NODE
// ============================================================================

interface HandleDefinition {
  id: string;
  type: HandleType;
  position: "left" | "right";
}

interface NodeHandleConfig {
  inputs: HandleDefinition[];
  outputs: HandleDefinition[];
}

export const NODE_HANDLE_CONFIG: Record<NodeType, NodeHandleConfig> = {
  textNode: {
    inputs: [],
    outputs: [{ id: "text-out", type: "text", position: "right" }],
  },
  imageUploadNode: {
    inputs: [],
    outputs: [{ id: "image-out", type: "image", position: "right" }],
  },
  videoUploadNode: {
    inputs: [],
    outputs: [{ id: "video-out", type: "video", position: "right" }],
  },
  llmNode: {
    inputs: [
      { id: "text-in", type: "text", position: "left" },
      { id: "image-in", type: "image", position: "left" },
    ],
    outputs: [{ id: "text-out", type: "text", position: "right" }],
  },
  cropImageNode: {
    inputs: [{ id: "image-in", type: "image", position: "left" }],
    outputs: [{ id: "image-out", type: "image", position: "right" }],
  },
  extractFrameNode: {
    inputs: [{ id: "video-in", type: "video", position: "left" }],
    outputs: [{ id: "frame-out", type: "frame", position: "right" }],
  },
};

// ============================================================================
// TYPE COMPATIBILITY MATRIX
// ============================================================================

// Which output types can connect to which input types
const TYPE_COMPATIBILITY: Record<HandleType, HandleType[]> = {
  text: ["text", "any"],
  image: ["image", "any"],
  video: ["video", "any"],
  frame: ["frame", "image", "any"], // frame can go to image inputs too
  any: ["text", "image", "video", "frame", "any"],
};

// ============================================================================
// CONNECTION VALIDATION
// ============================================================================

export function getHandleType(
  nodeType: NodeType,
  handleId: string,
  isSource: boolean
): HandleType | null {
  const config = NODE_HANDLE_CONFIG[nodeType];
  if (!config) return null;

  const handles = isSource ? config.outputs : config.inputs;
  const handle = handles.find((h) => h.id === handleId);
  return handle?.type ?? null;
}

export function isValidConnection(
  connection: Connection,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { valid: boolean; reason?: string } {
  const { source, target, sourceHandle, targetHandle } = connection;

  // 1. Basic validation
  if (!source || !target || !sourceHandle || !targetHandle) {
    return { valid: false, reason: "Missing connection information" };
  }

  // 2. No self-connections
  if (source === target) {
    return { valid: false, reason: "Cannot connect node to itself" };
  }

  // 3. Find source and target nodes
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  if (!sourceNode || !targetNode) {
    return { valid: false, reason: "Source or target node not found" };
  }

  // 4. Check if target handle already has a connection (single input rule)
  const existingConnection = edges.find(
    (e) => e.target === target && e.targetHandle === targetHandle
  );
  if (existingConnection) {
    return { valid: false, reason: "Input already connected" };
  }

  // 5. Type compatibility check
  const sourceType = getHandleType(sourceNode.type, sourceHandle, true);
  const targetType = getHandleType(targetNode.type, targetHandle, false);

  if (!sourceType || !targetType) {
    return { valid: false, reason: "Invalid handle" };
  }

  const compatibleTypes = TYPE_COMPATIBILITY[sourceType];
  if (!compatibleTypes.includes(targetType)) {
    return {
      valid: false,
      reason: `Cannot connect ${sourceType} to ${targetType}`,
    };
  }

  // 6. DAG validation - check for cycles
  if (wouldCreateCycle(source, target, nodes, edges)) {
    return { valid: false, reason: "Connection would create a cycle" };
  }

  return { valid: true };
}

// ============================================================================
// CYCLE DETECTION (DAG VALIDATION)
// ============================================================================

export function wouldCreateCycle(
  source: string,
  target: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): boolean {
  // If adding edge from source -> target would create a cycle,
  // then there must be a path from target -> source already
  return hasPath(target, source, edges);
}

function hasPath(
  from: string,
  to: string,
  edges: WorkflowEdge[],
  visited: Set<string> = new Set()
): boolean {
  if (from === to) return true;
  if (visited.has(from)) return false;

  visited.add(from);

  // Find all nodes that 'from' connects to
  const outgoingEdges = edges.filter((e) => e.source === from);

  for (const edge of outgoingEdges) {
    if (hasPath(edge.target, to, edges, visited)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// TOPOLOGICAL SORT FOR EXECUTION ORDER
// ============================================================================

export function getExecutionOrder(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): string[] | null {
  // Kahn's algorithm for topological sort
  const inDegree: Record<string, number> = {};
  const adjacencyList: Record<string, string[]> = {};

  // Initialize
  for (const node of nodes) {
    inDegree[node.id] = 0;
    adjacencyList[node.id] = [];
  }

  // Build adjacency list and calculate in-degrees
  for (const edge of edges) {
    adjacencyList[edge.source].push(edge.target);
    inDegree[edge.target]++;
  }

  // Start with nodes that have no incoming edges (source nodes)
  const queue: string[] = [];
  for (const nodeId of Object.keys(inDegree)) {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
    }
  }

  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const neighbor of adjacencyList[current]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If not all nodes are in result, there's a cycle
  if (result.length !== nodes.length) {
    return null; // Cycle detected
  }

  return result;
}

// ============================================================================
// PARALLEL EXECUTION GROUPS
// ============================================================================

export interface ExecutionLevel {
  level: number;
  nodeIds: string[];
}

export function getParallelExecutionLevels(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ExecutionLevel[] | null {
  const levels: Record<string, number> = {};
  const inDegree: Record<string, number> = {};
  const adjacencyList: Record<string, string[]> = {};

  // Initialize
  for (const node of nodes) {
    levels[node.id] = 0;
    inDegree[node.id] = 0;
    adjacencyList[node.id] = [];
  }

  // Build adjacency list and calculate in-degrees
  for (const edge of edges) {
    adjacencyList[edge.source].push(edge.target);
    inDegree[edge.target]++;
  }

  // Process nodes level by level
  let currentLevel: string[] = [];
  for (const nodeId of Object.keys(inDegree)) {
    if (inDegree[nodeId] === 0) {
      currentLevel.push(nodeId);
      levels[nodeId] = 0;
    }
  }

  let level = 0;
  const result: ExecutionLevel[] = [];

  while (currentLevel.length > 0) {
    result.push({ level, nodeIds: [...currentLevel] });

    const nextLevel: string[] = [];

    for (const nodeId of currentLevel) {
      for (const neighbor of adjacencyList[nodeId]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          nextLevel.push(neighbor);
          levels[neighbor] = level + 1;
        }
      }
    }

    currentLevel = nextLevel;
    level++;
  }

  // Check if all nodes were processed
  const totalProcessed = result.reduce((sum, l) => sum + l.nodeIds.length, 0);
  if (totalProcessed !== nodes.length) {
    return null; // Cycle detected
  }

  return result;
}

// ============================================================================
// GET CONNECTED INPUTS FOR A NODE
// ============================================================================

export function getConnectedInputs(
  nodeId: string,
  edges: WorkflowEdge[]
): Record<string, { sourceNodeId: string; sourceHandle: string }> {
  const connections: Record<string, { sourceNodeId: string; sourceHandle: string }> = {};

  for (const edge of edges) {
    if (edge.target === nodeId && edge.targetHandle && edge.sourceHandle) {
      connections[edge.targetHandle] = {
        sourceNodeId: edge.source,
        sourceHandle: edge.sourceHandle,
      };
    }
  }

  return connections;
}

// ============================================================================
// CHECK IF INPUT IS CONNECTED
// ============================================================================

export function isInputConnected(
  nodeId: string,
  handleId: string,
  edges: WorkflowEdge[]
): boolean {
  return edges.some(
    (e) => e.target === nodeId && e.targetHandle === handleId
  );
}

// ============================================================================
// EDGE COLOR BY HANDLE TYPE
// ============================================================================

const EDGE_COLORS: Record<string, string> = {
  text: "#3b82f6",   // blue
  image: "#22c55e",  // green
  video: "#a855f7",  // purple
  frame: "#f97316",  // orange
  any: "#6366f1",    // indigo
  default: "#6366f1", // indigo
};

export function getEdgeColor(sourceHandle: HandleType | string | null | undefined): string {
  if (!sourceHandle) return EDGE_COLORS.default;
  
  // If it's a HandleType, use it directly
  const handleStr = String(sourceHandle).toLowerCase();
  
  if (handleStr === "text" || handleStr.includes("text")) return EDGE_COLORS.text;
  if (handleStr === "image" || handleStr.includes("image")) return EDGE_COLORS.image;
  if (handleStr === "video" || handleStr.includes("video")) return EDGE_COLORS.video;
  if (handleStr === "frame" || handleStr.includes("frame")) return EDGE_COLORS.frame;
  if (handleStr === "any") return EDGE_COLORS.any;
  
  return EDGE_COLORS.default;
}
