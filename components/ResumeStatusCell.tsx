"use client";

import { Download } from "lucide-react";

type Props = {
  generationStatus: string;
  resumeFinalPath: string | null;
  applicationId: string;
};

export default function ResumeStatusCell({
  generationStatus,
  resumeFinalPath,
}: Props) {
  if (generationStatus === "generating") {
    return (
      <div className="flex items-center gap-1.5">
        <svg
          className="animate-spin h-3.5 w-3.5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="text-xs text-slate-400">Generating…</span>
      </div>
    );
  }

  if (generationStatus === "ready" && resumeFinalPath) {
    return (
      <a
        href={resumeFinalPath}
        download
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </a>
    );
  }

  if (generationStatus === "failed") {
    return <span className="text-xs text-red-500">Failed</span>;
  }

  return <span className="text-slate-300">—</span>;
}
