import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const NodeRunSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  nodeType: z.string(),
  nodeLabel: z.string(),
  status: z.string(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  duration: z.number().optional(),
  error: z.string().optional(),
});

const WorkflowRunSchema = z.object({
  workflowId: z.string().optional(),
  status: z.string(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  duration: z.number().optional(),
  nodeCount: z.number(),
  successCount: z.number(),
  failedCount: z.number(),
  nodeRuns: z.array(NodeRunSchema).optional(),
});

// ============================================================================
// IN-MEMORY STORAGE (Replace with Prisma in production)
// ============================================================================

const runStorage = new Map<string, {
  id: string;
  userId: string;
  workflowId?: string;
  status: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  nodeCount: number;
  successCount: number;
  failedCount: number;
  nodeRuns: unknown[];
}>();

// ============================================================================
// GET - List all workflow runs for current user
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get all runs for this user
    const userRuns = Array.from(runStorage.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit)
      .map(r => ({
        id: r.id,
        workflowId: r.workflowId,
        status: r.status,
        startedAt: r.startedAt.toISOString(),
        endedAt: r.endedAt?.toISOString(),
        duration: r.duration,
        nodeCount: r.nodeCount,
        successCount: r.successCount,
        failedCount: r.failedCount,
      }));

    return NextResponse.json({
      success: true,
      runs: userRuns,
    });

  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Save a new workflow run
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
    const validationResult = WorkflowRunSchema.safeParse(body);
    
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

    const data = validationResult.data;
    const id = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save run
    runStorage.set(id, {
      id,
      userId,
      workflowId: data.workflowId,
      status: data.status,
      startedAt: new Date(data.startedAt),
      endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
      duration: data.duration,
      nodeCount: data.nodeCount,
      successCount: data.successCount,
      failedCount: data.failedCount,
      nodeRuns: data.nodeRuns || [],
    });

    return NextResponse.json({
      success: true,
      run: {
        id,
        status: data.status,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        duration: data.duration,
      },
    });

  } catch (error) {
    console.error("Error saving run:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save run" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Clear all runs for current user
// ============================================================================

export async function DELETE() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete all runs for this user
    for (const [id, run] of runStorage.entries()) {
      if (run.userId === userId) {
        runStorage.delete(id);
      }
    }

    return NextResponse.json({
      success: true,
      message: "All runs cleared",
    });

  } catch (error) {
    console.error("Error clearing runs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear runs" },
      { status: 500 }
    );
  }
}
