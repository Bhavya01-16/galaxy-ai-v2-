"use client";

import { useState, useRef, useEffect } from "react";

interface WorkflowOption {
  key: string;
  name: string;
  description: string;
}

interface WorkflowSelectorProps {
  workflows: WorkflowOption[];
  onSelect: (key: string) => void;
  onClear: () => void;
  currentWorkflowName?: string;
}

export default function WorkflowSelector({
  workflows,
  onSelect,
  onClear,
  currentWorkflowName = "Product Marketing Kit",
}: WorkflowSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current workflow display / trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
      >
        {/* Workflow icon */}
        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        
        <div className="text-left">
          <div className="text-sm font-medium text-white">{currentWorkflowName}</div>
          <div className="text-xs text-gray-500">Sample Workflow</div>
        </div>
        
        {/* Chevron */}
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-800">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Sample Workflows
            </div>
          </div>

          {/* Workflow options */}
          <div className="max-h-64 overflow-y-auto">
            {workflows.map((workflow) => (
              <button
                key={workflow.key}
                onClick={() => {
                  onSelect(workflow.key);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-3 text-left hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{workflow.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{workflow.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="px-3 py-2 border-t border-gray-800 bg-gray-800/50">
            <button
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start from blank canvas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
