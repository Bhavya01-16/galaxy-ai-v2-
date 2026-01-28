"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useWorkflowStore } from "@/store";
import {
  ChevronLeft,
  ChevronRight,
  Type,
  ImageIcon,
  Video,
  Sparkles,
  Crop,
  Film,
  Settings,
  Layers,
  FolderOpen,
  X,
} from "lucide-react";
import type { NodeType } from "@/store/types";
import { sampleWorkflows, type SampleWorkflow } from "@/lib/sample-workflows";

// Node type configuration
const nodeTypes: Array<{
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}> = [
  {
    type: "textNode",
    label: "Text",
    icon: <Type className="w-5 h-5" />,
    color: "bg-blue-500",
    description: "Text input node",
  },
  {
    type: "imageUploadNode",
    label: "Image",
    icon: <ImageIcon className="w-5 h-5" />,
    color: "bg-green-500",
    description: "Upload image file",
  },
  {
    type: "videoUploadNode",
    label: "Video",
    icon: <Video className="w-5 h-5" />,
    color: "bg-purple-500",
    description: "Upload video file",
  },
  {
    type: "llmNode",
    label: "LLM",
    icon: <Sparkles className="w-5 h-5" />,
    color: "bg-amber-500",
    description: "AI language model",
  },
  {
    type: "cropImageNode",
    label: "Crop",
    icon: <Crop className="w-5 h-5" />,
    color: "bg-pink-500",
    description: "Crop image region",
  },
  {
    type: "extractFrameNode",
    label: "Frame",
    icon: <Film className="w-5 h-5" />,
    color: "bg-orange-500",
    description: "Extract video frame",
  },
];

interface NodeButtonProps {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  isCollapsed: boolean;
  onDragStart: (event: React.DragEvent, nodeType: NodeType) => void;
}

function NodeButton({
  type,
  label,
  icon,
  color,
  description,
  isCollapsed,
  onDragStart,
}: NodeButtonProps) {
  return (
    <button
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      className={`
        group relative flex items-center gap-3 w-full p-3 rounded-lg
        bg-surface hover:bg-background-hover border border-surface-border
        transition-all duration-200 cursor-grab active:cursor-grabbing
        hover:border-surface-border-light hover:shadow-card
      `}
      title={isCollapsed ? label : undefined}
    >
      {/* Icon */}
      <div
        className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
          ${color} text-white shadow-md
          group-hover:scale-105 transition-transform
        `}
      >
        {icon}
      </div>

      {/* Label & Description */}
      {!isCollapsed && (
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">
            {label}
          </div>
          <div className="text-xs text-text-tertiary truncate">{description}</div>
        </div>
      )}
    </button>
  );
}

export default function Sidebar() {
  const { sidebar, toggleSidebar, setSidebarTab, setNodes, setEdges, takeSnapshot, resetExecution } = useWorkflowStore();
  const { isCollapsed, activeTab } = sidebar;
  const [showSampleModal, setShowSampleModal] = useState(false);

  const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleLoadSample = (sample: SampleWorkflow) => {
    takeSnapshot();
    resetExecution();
    setNodes(sample.nodes);
    setEdges(sample.edges);
    setShowSampleModal(false);
  };

  return (
    <aside
      className={`
        relative flex flex-col h-full
        bg-background-secondary border-r border-surface-border
        transition-all duration-300 ease-in-out z-sidebar
        ${isCollapsed ? "w-sidebar-collapsed" : "w-sidebar"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-border gap-2">
        {!isCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-text-primary truncate">Galaxy AI</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
          <button
            onClick={toggleSidebar}
            className={`
              p-2 rounded-lg bg-surface hover:bg-background-hover
              border border-surface-border text-text-secondary
              hover:text-text-primary transition-colors
            `}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      {!isCollapsed && (
        <div className="flex p-2 gap-1 border-b border-surface-border">
          <button
            onClick={() => setSidebarTab("nodes")}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
              text-sm font-medium transition-colors
              ${
                activeTab === "nodes"
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
              }
            `}
          >
            <Layers className="w-4 h-4" />
            Nodes
          </button>
          <button
            onClick={() => setSidebarTab("settings")}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
              text-sm font-medium transition-colors
              ${
                activeTab === "settings"
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
              }
            `}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "nodes" ? (
          <div className="space-y-2">
            {!isCollapsed && (
              <>
                <p className="text-xs text-text-tertiary px-1 mb-3">
                  Drag nodes to the canvas to build your workflow
                </p>
                
                {/* Load Sample Button */}
                <button
                  onClick={() => setShowSampleModal(true)}
                  className="
                    w-full flex items-center gap-3 p-3 rounded-lg mb-4
                    bg-primary/10 hover:bg-primary/20 
                    border border-primary/30 hover:border-primary/50
                    text-primary transition-all
                  "
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">Load Sample</div>
                    <div className="text-xs opacity-70">Pre-built workflows</div>
                  </div>
                </button>
              </>
            )}
            {nodeTypes.map((node) => (
              <NodeButton
                key={node.type}
                {...node}
                isCollapsed={isCollapsed}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {!isCollapsed && (
              <>
                <div>
                  <label className="text-xs text-text-tertiary block mb-2">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    placeholder="Untitled Workflow"
                    className="
                      w-full px-3 py-2 rounded-lg
                      bg-surface border border-surface-border
                      text-text-primary placeholder-text-tertiary
                      focus:outline-none focus:border-primary
                      text-sm
                    "
                  />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary block mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Add a description..."
                    rows={3}
                    className="
                      w-full px-3 py-2 rounded-lg resize-none
                      bg-surface border border-surface-border
                      text-text-primary placeholder-text-tertiary
                      focus:outline-none focus:border-primary
                      text-sm
                    "
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-surface-border">
          <div className="text-xs text-text-muted text-center">
            Galaxy AI v0.1.0
          </div>
        </div>
      )}

      {/* Sample Workflows Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSampleModal(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-lg mx-4 bg-surface border border-surface-border rounded-xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Sample Workflows</h2>
                  <p className="text-xs text-text-tertiary">Load a pre-built workflow template</p>
                </div>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="p-2 rounded-lg hover:bg-background-hover text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {sampleWorkflows.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleLoadSample(sample)}
                  className="
                    w-full p-4 rounded-lg text-left
                    bg-background hover:bg-background-hover
                    border border-surface-border hover:border-primary/30
                    transition-all group
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{sample.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                        {sample.name}
                      </div>
                      <div className="text-xs text-text-tertiary mt-0.5">
                        {sample.description}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span>{sample.nodes.length} nodes</span>
                        <span>•</span>
                        <span>{sample.edges.length} connections</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-surface-border">
              <p className="text-xs text-text-muted text-center">
                Loading a sample will replace your current workflow
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
