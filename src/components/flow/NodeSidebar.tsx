"use client";

import { NodeType } from "@/types/nodes";

interface NodeButtonConfig {
  type: NodeType;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const nodeButtons: NodeButtonConfig[] = [
  {
    type: NodeType.TEXT,
    label: "Text Input",
    shortLabel: "Text",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30",
  },
  {
    type: NodeType.IMAGE_UPLOAD,
    label: "Image Upload",
    shortLabel: "Image",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: "text-green-400",
    bgColor: "bg-green-500/10 hover:bg-green-500/20 border-green-500/30",
  },
  {
    type: NodeType.VIDEO_UPLOAD,
    label: "Video Upload",
    shortLabel: "Video",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30",
  },
  {
    type: NodeType.LLM,
    label: "LLM Model",
    shortLabel: "LLM",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30",
  },
  {
    type: NodeType.CROP_IMAGE,
    label: "Crop Image",
    shortLabel: "Crop",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h2l2 12h13l3-9H5.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h14M7 7L5 3M7 7v14" />
      </svg>
    ),
    color: "text-pink-400",
    bgColor: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30",
  },
  {
    type: NodeType.EXTRACT_FRAME,
    label: "Extract Frame",
    shortLabel: "Frame",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30",
  },
];

interface NodeSidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: NodeType) => void;
}

export default function NodeSidebar({ onDragStart }: NodeSidebarProps) {
  return (
    <div className="w-16 bg-gray-900/80 backdrop-blur-sm border-r border-gray-800 flex flex-col items-center py-4 gap-2">
      {/* Logo */}
      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
        <span className="text-lg">G</span>
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-gray-700 mb-2" />

      {/* Node Buttons */}
      {nodeButtons.map((node) => (
        <div
          key={node.type}
          draggable
          onDragStart={(e) => onDragStart(e, node.type)}
          className={`
            relative group w-11 h-11 rounded-xl border cursor-grab
            flex items-center justify-center transition-all duration-200
            ${node.bgColor} ${node.color}
            active:cursor-grabbing active:scale-95
          `}
          title={node.label}
        >
          {node.icon}
          
          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 rounded-md text-xs text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
            {node.label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
          </div>
        </div>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Help Button */}
      <button
        className="w-11 h-11 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
        title="Help"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  );
}

// Export node buttons config for use in other components
export { nodeButtons, type NodeButtonConfig };
