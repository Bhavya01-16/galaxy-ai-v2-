"use client";

import { Sparkles, MousePointer2, Zap } from "lucide-react";

export default function CanvasPlaceholder() {
  return (
    <div className="flex-1 h-full bg-background relative overflow-hidden">
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.15) 1px, transparent 0)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Logo/Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg">
            <Zap className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Galaxy AI
        </h1>
        <p className="text-text-secondary mb-8 text-center max-w-md">
          Visual AI Workflow Builder
        </p>

        {/* Instructions */}
        <div className="flex flex-col items-center gap-4 text-sm">
          <div className="flex items-center gap-3 text-text-tertiary">
            <MousePointer2 className="w-5 h-5 text-primary" />
            <span>Drag nodes from the sidebar to start building</span>
          </div>
          <div className="flex items-center gap-6 text-text-muted">
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-surface border border-surface-border rounded text-xs">
                Ctrl
              </kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-surface border border-surface-border rounded text-xs">
                Z
              </kbd>
              <span className="ml-1">Undo</span>
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-surface border border-surface-border rounded text-xs">
                Del
              </kbd>
              <span className="ml-1">Delete</span>
            </span>
          </div>
        </div>

        {/* Feature badges */}
        <div className="flex items-center gap-3 mt-12">
          {["Parallel Execution", "Type-Safe Connections", "Real-time History"].map(
            (feature) => (
              <span
                key={feature}
                className="
                  px-3 py-1.5 rounded-full text-xs font-medium
                  bg-surface border border-surface-border text-text-secondary
                "
              >
                {feature}
              </span>
            )
          )}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
