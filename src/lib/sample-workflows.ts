import type { WorkflowNode, WorkflowEdge, NodeType } from "@/store/types";

// ============================================================================
// EDGE COLORS BY TYPE
// ============================================================================

const EDGE_COLORS: Record<string, string> = {
  text: "#3b82f6",   // blue
  image: "#22c55e",  // green
  video: "#a855f7",  // purple
  frame: "#f97316",  // orange
  default: "#6366f1", // indigo
};

function getEdgeColor(sourceHandle: string): string {
  if (sourceHandle.includes("text")) return EDGE_COLORS.text;
  if (sourceHandle.includes("image")) return EDGE_COLORS.image;
  if (sourceHandle.includes("video")) return EDGE_COLORS.video;
  if (sourceHandle.includes("frame")) return EDGE_COLORS.frame;
  return EDGE_COLORS.default;
}

// ============================================================================
// EDGE CREATOR HELPER
// ============================================================================

const createEdge = (
  id: string,
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string
): WorkflowEdge => ({
  id,
  source,
  target,
  sourceHandle,
  targetHandle,
  type: "smoothstep",
  animated: false,
  style: { stroke: getEdgeColor(sourceHandle), strokeWidth: 2 },
});

// ============================================================================
// PRODUCT MARKETING KIT WORKFLOW
// ============================================================================

/**
 * Product Marketing Kit Workflow
 * 
 * This workflow demonstrates:
 * 1. Product image input (starting point)
 * 2. Three parallel branches:
 *    - Branch A: Crop image for social media thumbnail
 *    - Branch B: Generate product description with LLM
 *    - Branch C: Create marketing tagline with LLM (uses text input)
 * 3. Final convergence: Combine all outputs into a complete marketing kit
 * 
 * Visual Layout:
 * 
 *       [Product Image]        [Brand Guidelines]
 *             |                       |
 *    +--------+--------+              |
 *    |        |        |              |
 * [Crop]  [LLM:Desc] [LLM:Tag] <------+
 *    |        |        |
 *    +--------+--------+
 *             |
 *     [LLM: Final Kit]
 */
export const productMarketingKitWorkflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } = {
  nodes: [
    // ===== ROW 1: INPUT NODES =====
    
    // Product Image Upload (center-left)
    {
      id: "product-image",
      type: "imageUploadNode" as NodeType,
      position: { x: 100, y: 50 },
      data: {
        label: "Product Image",
        imageUrl: undefined,
        fileName: undefined,
      },
    },

    // Brand Guidelines Text Input (right)
    {
      id: "brand-guidelines",
      type: "textNode" as NodeType,
      position: { x: 550, y: 50 },
      data: {
        label: "Brand Guidelines",
        text: "Brand: TechFlow Pro\nVoice: Modern, innovative, customer-focused\nTarget: Tech-savvy professionals 25-45\nTone: Confident but approachable",
      },
    },

    // ===== ROW 2: PROCESSING NODES (PARALLEL) =====

    // Branch A: Crop for Social Media
    {
      id: "crop-thumbnail",
      type: "cropImageNode" as NodeType,
      position: { x: 50, y: 280 },
      data: {
        label: "Social Crop",
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
      },
    },

    // Branch B: Product Description Generator
    {
      id: "description-generator",
      type: "llmNode" as NodeType,
      position: { x: 300, y: 280 },
      data: {
        label: "Description Writer",
        model: "gemini-2.0-flash" as const,
        prompt: "Analyze this product image and write a compelling 2-3 sentence product description that highlights its key features and benefits. Be professional yet engaging.",
        temperature: 0.7,
      },
    },

    // Branch C: Marketing Tagline Generator
    {
      id: "tagline-generator",
      type: "llmNode" as NodeType,
      position: { x: 550, y: 280 },
      data: {
        label: "Tagline Creator",
        model: "gemini-2.0-flash" as const,
        prompt: "Using brand guidelines: {{input}}\n\nCreate 3 catchy marketing taglines for this product. Each under 10 words, memorable, highlighting unique value. Format as numbered list.",
        temperature: 0.9,
      },
    },

    // ===== ROW 3: FINAL CONVERGENCE =====

    // Marketing Kit Assembler - receives text from all LLMs
    {
      id: "marketing-kit-assembler",
      type: "llmNode" as NodeType,
      position: { x: 300, y: 520 },
      data: {
        label: "Marketing Kit Builder",
        model: "gemini-2.0-flash" as const,
        prompt: "Assemble a complete product marketing kit from these inputs:\n\n{{input}}\n\nCreate:\n1. Primary headline\n2. Refined product description\n3. Top 3 taglines\n4. Social media post copy\n5. Key selling points (bullet list)\n\nFormat professionally for marketing team.",
        temperature: 0.6,
      },
    },
  ],
  edges: [
    // Product Image -> Crop (image -> image)
    createEdge(
      "edge-image-crop",
      "product-image",
      "crop-thumbnail",
      "image-out",
      "image-in"
    ),
    
    // Product Image -> Description LLM (image -> image)
    createEdge(
      "edge-image-desc",
      "product-image",
      "description-generator",
      "image-out",
      "image-in"
    ),
    
    // Brand Guidelines -> Tagline LLM (text -> text)
    createEdge(
      "edge-brand-tagline",
      "brand-guidelines",
      "tagline-generator",
      "text-out",
      "text-in"
    ),

    // Description LLM -> Final Kit (text -> text)
    createEdge(
      "edge-desc-kit",
      "description-generator",
      "marketing-kit-assembler",
      "text-out",
      "text-in"
    ),
    
    // Tagline LLM -> Final Kit (text -> text)
    // Note: Multiple text inputs will be concatenated
    createEdge(
      "edge-tagline-kit",
      "tagline-generator",
      "marketing-kit-assembler",
      "text-out",
      "text-in"
    ),
  ],
};

// ============================================================================
// VIDEO HIGHLIGHT REEL WORKFLOW
// ============================================================================

/**
 * Video Highlight Reel Workflow
 * 
 * Visual Layout:
 * 
 *           [Video Upload]
 *                 |
 *    +------------+------------+
 *    |            |            |
 * [Frame@0s] [Frame@15s] [Frame@30s]
 *    |            |            |
 *    +------------+------------+
 *                 |
 *        [LLM: Caption Gen]
 */
export const videoHighlightWorkflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } = {
  nodes: [
    // Video Input
    {
      id: "video-input",
      type: "videoUploadNode" as NodeType,
      position: { x: 300, y: 50 },
      data: {
        label: "Video Upload",
        videoUrl: undefined,
        fileName: undefined,
        duration: undefined,
      },
    },

    // Extract Frame 1 - Intro
    {
      id: "extract-frame-1",
      type: "extractFrameNode" as NodeType,
      position: { x: 50, y: 250 },
      data: {
        label: "Intro Frame",
        timestamp: 0,
        format: "png" as const,
      },
    },

    // Extract Frame 2 - Middle
    {
      id: "extract-frame-2",
      type: "extractFrameNode" as NodeType,
      position: { x: 300, y: 250 },
      data: {
        label: "Middle Frame",
        timestamp: 15,
        format: "png" as const,
      },
    },

    // Extract Frame 3 - End
    {
      id: "extract-frame-3",
      type: "extractFrameNode" as NodeType,
      position: { x: 550, y: 250 },
      data: {
        label: "Outro Frame",
        timestamp: 30,
        format: "png" as const,
      },
    },

    // Caption Generator
    {
      id: "caption-generator",
      type: "llmNode" as NodeType,
      position: { x: 300, y: 450 },
      data: {
        label: "Caption Generator",
        model: "gemini-2.0-flash" as const,
        prompt: "Based on these video frames, generate engaging captions for a social media highlight reel:\n\n1. Intro caption (hook)\n2. Main content caption\n3. Outro/CTA caption\n\nMake them catchy and engaging!",
        temperature: 0.8,
      },
    },
  ],
  edges: [
    // Video -> Frame extractors
    createEdge("edge-video-frame1", "video-input", "extract-frame-1", "video-out", "video-in"),
    createEdge("edge-video-frame2", "video-input", "extract-frame-2", "video-out", "video-in"),
    createEdge("edge-video-frame3", "video-input", "extract-frame-3", "video-out", "video-in"),
    
    // Frames -> Caption LLM (frame outputs can connect to image inputs)
    // Note: In real implementation, we'd need to handle multiple image inputs
  ],
};

// ============================================================================
// SIMPLE TEXT PROCESSING WORKFLOW
// ============================================================================

/**
 * Simple Text Processing Workflow
 * Great for quick testing
 * 
 * [Text Input] -> [LLM] -> Output
 */
export const simpleTextWorkflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } = {
  nodes: [
    {
      id: "text-input",
      type: "textNode" as NodeType,
      position: { x: 100, y: 100 },
      data: {
        label: "Your Text",
        text: "Write a short poem about artificial intelligence and creativity.",
      },
    },
    {
      id: "llm-processor",
      type: "llmNode" as NodeType,
      position: { x: 400, y: 100 },
      data: {
        label: "AI Writer",
        model: "gemini-2.0-flash" as const,
        prompt: "{{input}}",
        temperature: 0.8,
      },
    },
  ],
  edges: [
    createEdge("edge-text-llm", "text-input", "llm-processor", "text-out", "text-in"),
  ],
};

// ============================================================================
// SAMPLE WORKFLOWS REGISTRY
// ============================================================================

export interface SampleWorkflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const sampleWorkflows: SampleWorkflow[] = [
  {
    id: "product-marketing-kit",
    name: "Product Marketing Kit",
    description: "Generate complete marketing materials from a product image",
    icon: "📦",
    ...productMarketingKitWorkflow,
  },
  {
    id: "video-highlight-reel",
    name: "Video Highlight Reel",
    description: "Extract frames and generate captions from video",
    icon: "🎬",
    ...videoHighlightWorkflow,
  },
  {
    id: "simple-text",
    name: "Simple Text Processing",
    description: "Basic text input to LLM workflow for quick testing",
    icon: "📝",
    ...simpleTextWorkflow,
  },
];

// Default workflow to load
export const defaultWorkflow = productMarketingKitWorkflow;
