import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

const ImportedWorkflowSchema = z.object({
  version: z.string().optional(),
  exportedAt: z.string().optional(),
  application: z.string().optional(),
  workflow: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    nodes: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      data: z.object({
        label: z.string(),
      }).passthrough(),
    })),
    edges: z.array(z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
    }).passthrough()),
  }),
});

// ============================================================================
// POST - Import workflow from JSON
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = ImportedWorkflowSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid workflow file format",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { workflow } = validationResult.data;

    // Generate new IDs to prevent conflicts
    const idMapping: Record<string, string> = {};
    
    const newNodes = workflow.nodes.map((node) => {
      const newId = `${node.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      idMapping[node.id] = newId;
      return {
        ...node,
        id: newId,
      };
    });

    const newEdges = workflow.edges.map((edge) => ({
      ...edge,
      id: `${edge.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      source: idMapping[edge.source] || edge.source,
      target: idMapping[edge.target] || edge.target,
    }));

    return NextResponse.json({
      success: true,
      workflow: {
        name: workflow.name,
        description: workflow.description,
        nodes: newNodes,
        edges: newEdges,
      },
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to import workflow" },
      { status: 500 }
    );
  }
}
