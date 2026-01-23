"use client";

import { useState } from "react";
import Link from "next/link";
import FlowCanvasWithToolbar from "./FlowCanvasWithToolbar";

interface WorkflowEditorProps {
  workflowId: string;
}

export default function WorkflowEditor({ workflowId: _workflowId }: WorkflowEditorProps) {
  // _workflowId will be used later for save/load functionality
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Top Bar */}
      <div className="h-12 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm flex items-center justify-between px-3">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>

          <div className="w-px h-6 bg-gray-700" />

          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-transparent text-white font-medium border-none outline-none focus:ring-0 w-48"
            placeholder="Workflow name..."
          />
        </div>

        {/* Center - Workflow Status */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Draft</span>
        </div>

        {/* Right Section - Placeholder, actual buttons in FlowCanvasWithToolbar */}
        <div className="w-48" />
      </div>

      {/* Main Content - Full Canvas with embedded toolbar */}
      <div className="flex-1 overflow-hidden">
        <FlowCanvasWithToolbar />
      </div>
    </div>
  );
}
