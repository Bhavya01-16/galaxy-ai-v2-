"use client";

import { Sidebar, HistoryPanel } from "@/components/layout";
import { FlowCanvas } from "@/components/canvas";

export default function DashboardPage() {
  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Center Canvas Area */}
      <main className="flex-1 relative">
        <FlowCanvas />
      </main>

      {/* Right History Panel */}
      <HistoryPanel />
    </div>
  );
}
