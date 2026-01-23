import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const NodeDataSchema = z.object({
  label: z.string(),
}).passthrough(); // Allow additional properties

const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: NodeDataSchema,
});

const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
}).passthrough();

const WorkflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// ============================================================================
// IN-MEMORY STORAGE (Replace with Prisma in production)
// ============================================================================

// Note: This is temporary storage. In production, use Prisma + PostgreSQL
const workflowStorage = new Map<string, {
  id: string;
  userId: string;
  name: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  createdAt: Date;
  updatedAt: Date;
}>();

// ============================================================================
// GET - List all workflows for current user
// ============================================================================

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all workflows for this user
    const userWorkflows = Array.from(workflowStorage.values())
      .filter(w => w.userId === userId)
      .map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        nodeCount: w.nodes.length,
        edgeCount: w.edges.length,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      }));

    return NextResponse.json({
      success: true,
      workflows: userWorkflows,
    });

  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create/Save a new workflow
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = WorkflowSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, description, nodes, edges } = validationResult.data;
    const id = validationResult.data.id || `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    // Check if updating existing workflow
    const existing = workflowStorage.get(id);
    if (existing && existing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Not authorized to update this workflow" },
        { status: 403 }
      );
    }

    // Save workflow
    workflowStorage.set(id, {
      id,
      userId,
      name,
      description,
      nodes,
      edges,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      workflow: {
        id,
        name,
        description,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        createdAt: (existing?.createdAt || now).toISOString(),
        updatedAt: now.toISOString(),
      },
    });

  } catch (error) {
    console.error("Error saving workflow:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save workflow" },
      { status: 500 }
    );
  }
}
