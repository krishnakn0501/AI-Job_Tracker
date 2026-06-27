"use client";

import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  applicationId: string;
  generationStatus: string;
  resumeReviewPath: string | null;
  resumeFinalPath: string | null;
  coverLetterReviewPath: string | null;
  coverLetterFinalPath: string | null;
  roleTitleChanged: boolean;
  roleTitleNote: string | null;
  onRegenerate: () => void;
};

export default function ResumeViewer({
  generationStatus,
  resumeReviewPath,
  resumeFinalPath,
  coverLetterReviewPath,
  coverLetterFinalPath,
  roleTitleChanged,
  roleTitleNote,
  onRegenerate,
}: Props) {
  if (generationStatus === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <svg
          className="animate-spin h-8 w-8 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
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
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="text-sm font-medium text-slate-600">
          Claude is tailoring your resume…
        </p>
        <p className="text-xs text-slate-400">This takes about 30-60 seconds</p>
      </div>
    );
  }

  if (generationStatus === "ready") {
    return (
      <div className="space-y-4">
        {roleTitleChanged && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <strong>Role title changed:</strong> {roleTitleNote}
          </div>
        )}

        {/* Resume downloads */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Resume
          </p>
          <div className="flex gap-2">
            <a
              href={resumeReviewPath ?? "#"}
              download
              className="flex-1 flex items-center justify-center gap-1.5 text-xs h-9 leading-9 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 font-medium transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Review
            </a>
            <a
              href={resumeFinalPath ?? "#"}
              download
              className="flex-1 flex items-center justify-center gap-1.5 text-xs h-9 leading-9 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Final
            </a>
          </div>
        </div>

        {/* Cover letter downloads */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Cover Letter
          </p>
          <div className="flex gap-2">
            <a
              href={coverLetterReviewPath ?? "#"}
              download
              className="flex-1 flex items-center justify-center gap-1.5 text-xs h-9 leading-9 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 font-medium transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Review
            </a>
            <a
              href={coverLetterFinalPath ?? "#"}
              download
              className="flex-1 flex items-center justify-center gap-1.5 text-xs h-9 leading-9 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Final
            </a>
          </div>
        </div>

        <button
          onClick={onRegenerate}
          className="w-full text-xs text-slate-400 hover:text-slate-600 underline text-center pt-2"
        >
          Re-generate resume & cover letter
        </button>
      </div>
    );
  }

  if (generationStatus === "pending") {
    return (
      <div className="text-center py-8">
        <svg
          className="h-10 w-10 text-slate-200 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm text-slate-500 mb-4">
          Resume not generated yet
        </p>
        <Button onClick={onRegenerate} size="sm">
          Generate resume
        </Button>
      </div>
    );
  }

  if (generationStatus === "failed") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-sm font-medium text-red-700 mb-1">
          Generation failed
        </p>
        <p className="text-xs text-red-500 mb-3">
          Something went wrong with Claude API. Try again.
        </p>
        <Button variant="outline" size="sm" onClick={onRegenerate}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-sm text-slate-500">
        Status: {generationStatus}
      </p>
    </div>
  );
}
