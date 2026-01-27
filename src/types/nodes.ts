import type { Node } from "@xyflow/react";

// Node data types - using Record<string, unknown> compatible interface
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
}

export interface TextNodeData extends BaseNodeData {
  text: string;
}

export interface ImageUploadNodeData extends BaseNodeData {
  imageUrl?: string;
  fileName?: string;
}

export interface VideoUploadNodeData extends BaseNodeData {
  videoUrl?: string;
  fileName?: string;
  duration?: number;
}

export interface LLMNodeData extends BaseNodeData {
  model: "gpt-4" | "gpt-3.5-turbo" | "claude-3" | "claude-2";
  prompt: string;
  temperature: number;
}

export interface CropImageNodeData extends BaseNodeData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractFrameNodeData extends BaseNodeData {
  timestamp: number; // in seconds
  format: "png" | "jpg";
}

// Union type for all node data
export type NodeData =
  | TextNodeData
  | ImageUploadNodeData
  | VideoUploadNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData;

// Custom node types enum
export enum NodeType {
  TEXT = "textNode",
  IMAGE_UPLOAD = "imageUploadNode",
  VIDEO_UPLOAD = "videoUploadNode",
  LLM = "llmNode",
  CROP_IMAGE = "cropImageNode",
  EXTRACT_FRAME = "extractFrameNode",
}

// Node configuration for sidebar
export interface NodeConfig {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  description: string;
  defaultData: NodeData;
  // Use inline type to avoid duplicate HandleType import
  inputs: ("text" | "image" | "video" | "frame" | "any")[];
  outputs: ("text" | "image" | "video" | "frame" | "any")[];
  color: string;
}

// Custom node type
export type CustomNode = Node<NodeData, NodeType>;
