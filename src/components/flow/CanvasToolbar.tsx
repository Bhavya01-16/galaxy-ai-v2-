"use client";

interface CanvasToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  isSaving: boolean;
  onDelete: () => void;
  canDelete: boolean;
  selectedCount: number;
  onRun?: () => void;
  isRunning?: boolean;
  onToggleHistory?: () => void;
  isHistoryOpen?: boolean;
}

export default function CanvasToolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  isSaving,
  onDelete,
  canDelete,
  selectedCount,
  onRun,
  isRunning = false,
  onToggleHistory,
  isHistoryOpen = true,
}: CanvasToolbarProps) {
  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-2" style={{ right: isHistoryOpen ? "calc(18rem + 12px)" : "12px" }}>
      {/* Selection info */}
      {selectedCount > 0 && (
        <div className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-300">
          {selectedCount} selected
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={onDelete}
        disabled={!canDelete}
        className={`
          p-2 rounded-lg transition-all text-sm
          ${canDelete 
            ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30" 
            : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
          }
        `}
        title="Delete selected (Del)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <div className="w-px h-6 bg-gray-700" />

      {/* Undo button */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`
          p-2 rounded-lg transition-all
          ${canUndo 
            ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
            : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
          }
        `}
        title="Undo (Ctrl+Z)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      {/* Redo button */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`
          p-2 rounded-lg transition-all
          ${canRedo 
            ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
            : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
          }
        `}
        title="Redo (Ctrl+Shift+Z)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>

      <div className="w-px h-6 bg-gray-700" />

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        {isSaving ? "Saving..." : "Save"}
      </button>

      {/* Run button */}
      <button
        onClick={onRun}
        disabled={isRunning}
        className={`
          px-3 py-2 rounded-lg transition-all text-sm font-medium flex items-center gap-1.5
          ${isRunning
            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          }
        `}
      >
        {isRunning ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Running...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run
          </>
        )}
      </button>

      {/* History toggle button */}
      {onToggleHistory && (
        <button
          onClick={onToggleHistory}
          className={`
            p-2 rounded-lg transition-all
            ${isHistoryOpen 
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" 
              : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }
          `}
          title={isHistoryOpen ? "Hide History" : "Show History"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
    </div>
  );
}
