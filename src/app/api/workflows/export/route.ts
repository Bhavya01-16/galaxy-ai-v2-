import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

const ExportRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

// ============================================================================
// POST - Export workflow as JSON
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = ExportRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid workflow data",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, description, nodes, edges } = validationResult.data;

    // Create export object
    const exportData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      application: "Galaxy AI",
      workflow: {
        name,
        description,
        nodes,
        edges,
      },
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${name.replace(/[^a-z0-9]/gi, '_')}_workflow.json"`,
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export workflow" },
      { status: 500 }
    );
  }
}
