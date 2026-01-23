"use client";

interface ConnectionErrorProps {
  message: string | null;
}

export default function ConnectionError({ message }: ConnectionErrorProps) {
  if (!message) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-4 py-2 bg-red-500/90 backdrop-blur-sm text-white text-sm rounded-lg shadow-lg flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {message}
      </div>
    </div>
  );
}
