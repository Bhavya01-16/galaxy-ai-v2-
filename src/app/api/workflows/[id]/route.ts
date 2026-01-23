import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// ============================================================================
// IN-MEMORY STORAGE (Same reference as parent route - in production use Prisma)
// ============================================================================

// Note: In a real app, this would be imported from a shared module or use Prisma
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
// GET - Get a specific workflow by ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workflow = workflowStorage.get(id);
    
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (workflow.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Not authorized to view this workflow" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        nodes: workflow.nodes,
        edges: workflow.edges,
        createdAt: workflow.createdAt.toISOString(),
        updatedAt: workflow.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete a workflow by ID
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workflow = workflowStorage.get(id);
    
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (workflow.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Not authorized to delete this workflow" },
        { status: 403 }
      );
    }

    workflowStorage.delete(id);

    return NextResponse.json({
      success: true,
      message: "Workflow deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
