import { useCallback, useState } from "react";
import type { Node, Edge } from "@xyflow/react";

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseUndoRedoOptions {
  maxHistory?: number;
}

interface UseUndoRedoReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  takeSnapshot: () => void;
}

export function useUndoRedo(
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void,
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void,
  options: UseUndoRedoOptions = {}
): UseUndoRedoReturn {
  const { maxHistory = 50 } = options;

  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  const takeSnapshot = useCallback(() => {
    // Save current state to past
    setPast((prev) => {
      const newPast = [
        ...prev,
        {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        },
      ];
      // Limit history size
      if (newPast.length > maxHistory) {
        newPast.shift();
      }
      return newPast;
    });
    // Clear future when new action is taken
    setFuture([]);
  }, [nodes, edges, maxHistory]);

  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previousState = past[past.length - 1];
    const newPast = past.slice(0, -1);

    // Save current state to future
    setFuture((prev) => [
      ...prev,
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      },
    ]);

    setPast(newPast);
    setNodes(previousState.nodes);
    setEdges(previousState.edges);
  }, [past, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const nextState = future[future.length - 1];
    const newFuture = future.slice(0, -1);

    // Save current state to past
    setPast((prev) => [
      ...prev,
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      },
    ]);

    setFuture(newFuture);
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
  }, [future, nodes, edges, setNodes, setEdges]);

  return {
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    takeSnapshot,
  };
}
