import TextNode from "./TextNode";
import ImageUploadNode from "./ImageUploadNode";
import VideoUploadNode from "./VideoUploadNode";
import LLMNode from "./LLMNode";
import CropImageNode from "./CropImageNode";
import ExtractFrameNode from "./ExtractFrameNode";
import { NodeType } from "@/types/nodes";

// Export all node components
export {
  TextNode,
  ImageUploadNode,
  VideoUploadNode,
  LLMNode,
  CropImageNode,
  ExtractFrameNode,
};

// Node types mapping for React Flow
export const nodeTypes = {
  [NodeType.TEXT]: TextNode,
  [NodeType.IMAGE_UPLOAD]: ImageUploadNode,
  [NodeType.VIDEO_UPLOAD]: VideoUploadNode,
  [NodeType.LLM]: LLMNode,
  [NodeType.CROP_IMAGE]: CropImageNode,
  [NodeType.EXTRACT_FRAME]: ExtractFrameNode,
};
