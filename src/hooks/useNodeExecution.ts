"use client";

import { useContext, createContext } from "react";
import type { NodeExecutionStatus, NodeExecutionResult } from "@/types/execution";

// Context for passing execution status to nodes
interface NodeExecutionContextType {
  getNodeStatus: (nodeId: string) => NodeExecutionStatus;
  getNodeResult: (nodeId: string) => NodeExecutionResult | undefined;
}

export const NodeExecutionContext = createContext<NodeExecutionContextType | null>(null);

export function useNodeExecution(nodeId: string) {
  const context = useContext(NodeExecutionContext);
  
  if (!context) {
    return {
      status: "idle" as NodeExecutionStatus,
      result: undefined,
    };
  }
  
  return {
    status: context.getNodeStatus(nodeId),
    result: context.getNodeResult(nodeId),
  };
}
