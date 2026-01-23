import type { WorkflowNode, WorkflowEdge, NodeData, NodeType } from "@/store/types";
import type {
  NodeExecutionResult,
  WorkflowExecutionState,
  NodeExecutionStatus,
} from "@/store/types";
import { getParallelExecutionLevels, getConnectedInputs } from "./workflow-utils";

// ============================================================================
// TASK EXECUTION FUNCTIONS
// ============================================================================

async function executeGeminiTask(
  data: NodeData,
  inputs: Record<string, unknown>
): Promise<{ success: boolean; text?: string; error?: string }> {
  const llmData = data as { 
    prompt: string; 
    systemPrompt?: string;
    model: string; 
    temperature: number;
    maxTokens?: number;
  };
  const textInput = inputs["text-in"] as string | undefined;
  const imageInput = inputs["image-in"] as string | undefined;

  // Replace {{input}} with actual text input
  let processedPrompt = llmData.prompt || "";
  if (textInput) {
    processedPrompt = processedPrompt.replace(/\{\{input\}\}/g, textInput);
  }

  // Retry logic for rate limits
  const maxRetries = 3;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Call server-side API route
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: processedPrompt,
          systemPrompt: llmData.systemPrompt,
          model: llmData.model || "gemini-2.0-flash",
          temperature: llmData.temperature || 0.7,
          maxTokens: llmData.maxTokens || 2048,
          imageData: imageInput,
        }),
      });

      // Check if response is OK
      if (!response.ok && response.status !== 429) {
        const text = await response.text();
        return {
          success: false,
          error: `API error (${response.status}): ${text || response.statusText}`,
        };
      }

      // Parse JSON response safely
      let result;
      try {
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          return {
            success: false,
            error: "Empty response from API",
          };
        }
        result = JSON.parse(text);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return {
          success: false,
          error: "Failed to parse API response. The server may have returned invalid JSON.",
        };
      }

      if (result.success) {
        return {
          success: true,
          text: result.text,
        };
      }

      // Handle rate limit
      if (response.status === 429 || result.error?.includes("quota") || result.error?.includes("rate")) {
        lastError = result.error || "Rate limit exceeded";
        const waitTime = Math.pow(2, attempt) * 5000;
        console.log(`Rate limited. Waiting ${waitTime/1000}s before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // Other errors - don't retry
      return {
        success: false,
        error: result.error || "API call failed",
      };

    } catch (error) {
      lastError = error instanceof Error ? error.message : "Network error";
      console.error(`Gemini API Error (attempt ${attempt + 1}/${maxRetries}):`, error);
      
      // Wait before retry on network errors
      const waitTime = Math.pow(2, attempt) * 2000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  return {
    success: false,
    error: lastError || "Gemini API call failed after retries",
  };
}

async function executeCropImageTask(
  data: NodeData,
  inputs: Record<string, unknown>
): Promise<{ success: boolean; imageData?: string; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));

  const cropData = data as { x: number; y: number; width: number; height: number };
  const imageInput = inputs["image-in"] as string | undefined;

  if (!imageInput) {
    return { success: false, error: "No image input connected" };
  }

  return {
    success: true,
    imageData: `[Cropped: ${cropData.width}x${cropData.height} at (${cropData.x},${cropData.y})]`,
  };
}

async function executeExtractFrameTask(
  data: NodeData,
  inputs: Record<string, unknown>
): Promise<{ success: boolean; frameData?: string; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 500));

  const frameData = data as { timestamp: number; format: string };
  const videoInput = inputs["video-in"] as string | undefined;

  if (!videoInput) {
    return { success: false, error: "No video input connected" };
  }

  return {
    success: true,
    frameData: `[Frame at ${frameData.timestamp}s as ${frameData.format || "png"}]`,
  };
}

async function executeTextNode(
  data: NodeData
): Promise<{ success: boolean; text?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const textData = data as { text: string };
  return { success: true, text: textData.text || "" };
}

async function executeImageUploadNode(
  data: NodeData
): Promise<{ success: boolean; imageData?: string; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const imageData = data as { imageUrl?: string };
  
  if (!imageData.imageUrl) {
    return { success: false, error: "No image uploaded" };
  }
  
  return { success: true, imageData: imageData.imageUrl };
}

async function executeVideoUploadNode(
  data: NodeData
): Promise<{ success: boolean; videoData?: string; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const videoData = data as { videoUrl?: string };
  
  if (!videoData.videoUrl) {
    return { success: false, error: "No video uploaded" };
  }
  
  return { success: true, videoData: videoData.videoUrl };
}

// ============================================================================
// NODE EXECUTION
// ============================================================================

async function executeNode(
  node: WorkflowNode,
  inputs: Record<string, unknown>
): Promise<NodeExecutionResult> {
  const startTime = Date.now();

  try {
    let output: unknown;

    switch (node.type) {
      case "textNode":
        output = await executeTextNode(node.data);
        break;
      case "imageUploadNode":
        output = await executeImageUploadNode(node.data);
        break;
      case "videoUploadNode":
        output = await executeVideoUploadNode(node.data);
        break;
      case "llmNode":
        output = await executeGeminiTask(node.data, inputs);
        break;
      case "cropImageNode":
        output = await executeCropImageTask(node.data, inputs);
        break;
      case "extractFrameNode":
        output = await executeExtractFrameTask(node.data, inputs);
        break;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }

    const endTime = Date.now();
    const result = output as { success: boolean; error?: string };

    return {
      nodeId: node.id,
      status: result.success ? "completed" : "failed",
      output,
      error: result.error,
      startTime,
      endTime,
      duration: endTime - startTime,
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      nodeId: node.id,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      startTime,
      endTime,
      duration: endTime - startTime,
    };
  }
}

// ============================================================================
// OUTPUT EXTRACTION
// ============================================================================

function getNodeOutput(
  result: NodeExecutionResult,
  nodeType: NodeType,
  targetHandleId: string
): unknown {
  const output = result.output as Record<string, unknown> | undefined;
  if (!output) return undefined;

  switch (nodeType) {
    case "textNode":
      return output.text;
    case "imageUploadNode":
      return output.imageData;
    case "videoUploadNode":
      return output.videoData;
    case "llmNode":
      return output.text;
    case "cropImageNode":
      return output.imageData;
    case "extractFrameNode":
      return output.frameData;
    default:
      return undefined;
  }
}

// ============================================================================
// STATUS UPDATE CALLBACK TYPE
// ============================================================================

export type StatusUpdateCallback = (
  nodeId: string,
  status: NodeExecutionStatus,
  result?: NodeExecutionResult
) => void;

// ============================================================================
// WORKFLOW EXECUTION ENGINE
// ============================================================================

export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  onStatusUpdate: StatusUpdateCallback
): Promise<WorkflowExecutionState> {
  const state: WorkflowExecutionState = {
    status: "running",
    nodeStatuses: {},
    nodeResults: {},
    startTime: Date.now(),
  };

  // Get parallel execution levels
  const levels = getParallelExecutionLevels(nodes, edges);

  if (!levels) {
    state.status = "failed";
    state.error = "Workflow contains cycles - cannot execute";
    return state;
  }

  if (levels.length === 0) {
    state.status = "completed";
    state.endTime = Date.now();
    return state;
  }

  // Initialize all nodes as pending
  for (const node of nodes) {
    state.nodeStatuses[node.id] = "pending";
    onStatusUpdate(node.id, "pending");
  }

  try {
    // Execute level by level (nodes in same level run in parallel)
    for (const level of levels) {
      // Mark all nodes in this level as running
      for (const nodeId of level.nodeIds) {
        state.nodeStatuses[nodeId] = "running";
        onStatusUpdate(nodeId, "running");
      }

      // Execute all nodes in this level in parallel
      const results = await Promise.all(
        level.nodeIds.map(async (nodeId) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) {
            return {
              nodeId,
              status: "failed" as NodeExecutionStatus,
              error: "Node not found",
            } as NodeExecutionResult;
          }

          // Gather inputs from connected parent nodes
          const inputs = gatherInputs(nodeId, nodes, edges, state.nodeResults);

          // Execute the node
          const result = await executeNode(node, inputs);
          return result;
        })
      );

      // Update state with results
      for (const result of results) {
        state.nodeStatuses[result.nodeId] = result.status;
        state.nodeResults[result.nodeId] = result;
        onStatusUpdate(result.nodeId, result.status, result);

        // If node failed, mark as failed but continue (partial success)
        if (result.status === "failed") {
          console.warn(`Node ${result.nodeId} failed:`, result.error);
        }
      }
    }

    // Determine final status
    const statuses = Object.values(state.nodeStatuses);
    const hasFailures = statuses.some((s) => s === "failed");
    const allFailed = statuses.every((s) => s === "failed");

    if (allFailed) {
      state.status = "failed";
    } else if (hasFailures) {
      state.status = "partial";
    } else {
      state.status = "completed";
    }
  } catch (error) {
    state.status = "failed";
    state.error = error instanceof Error ? error.message : "Unknown error";
  }

  state.endTime = Date.now();
  return state;
}

// ============================================================================
// INPUT GATHERING
// ============================================================================

function gatherInputs(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  results: Record<string, NodeExecutionResult>
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};
  const connections = getConnectedInputs(nodeId, edges);

  for (const [targetHandle, connection] of Object.entries(connections)) {
    const sourceNode = nodes.find((n) => n.id === connection.sourceNodeId);
    const sourceResult = results[connection.sourceNodeId];

    if (sourceResult && sourceResult.status === "completed" && sourceNode) {
      const output = getNodeOutput(sourceResult, sourceNode.type, targetHandle);
      inputs[targetHandle] = output;
    }
  }

  return inputs;
}
