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
      <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center gap-4 text-center transform-gpu">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
          <svg
            className="animate-spin h-10 w-10 text-indigo-500 relative z-10"
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
        </div>
        <div>
          <p className="text-base font-bold text-slate-800 dark:text-white mb-1">
            Tailoring your resume
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Claude is analyzing the job description.<br/>This takes about 30-60 seconds.
          </p>
        </div>
      </div>
    );
  }

  if (generationStatus === "ready") {
    return (
      <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-sm transform-gpu space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-indigo-500" />
            Generated Documents
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tailored specifically for this application
          </p>
        </div>
        {roleTitleChanged && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <strong>Role title changed:</strong> {roleTitleNote}
          </div>
        )}

        {/* Resume downloads */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
            Resume
          </p>
          <div className="flex gap-3">
            <a
              href={resumeReviewPath ?? "#"}
              download
              className="flex-1 flex items-center justify-center gap-2 text-sm h-11 bg-white/50 dark:bg-black/40 backdrop-blur-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileText className="h-4 w-4 text-indigo-500" />
              Review
            </a>
            <a
              href={resumeFinalPath ?? "#"}
              download
              className="flex-1 flex items-center justify-center gap-2 text-sm h-11 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Final
            </a>
          </div>
        </div>

        {/* Cover letter downloads */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
            Cover Letter
          </p>
          <div className="flex gap-3">
            <a
              href={coverLetterReviewPath ?? "#"}
              download
              className="flex-1 flex items-center justify-center gap-2 text-sm h-11 bg-white/50 dark:bg-black/40 backdrop-blur-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileText className="h-4 w-4 text-purple-500" />
              Review
            </a>
            <a
              href={coverLetterFinalPath ?? "#"}
              download
              className="flex-1 flex items-center justify-center gap-2 text-sm h-11 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/20 hover:bg-purple-700 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Final
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-white/10">
          <button
            onClick={onRegenerate}
            className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-center"
          >
            Re-generate documents
          </button>
        </div>

      </div>
    );
  }

  if (generationStatus === "pending") {
    return (
      <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center transform-gpu">
        <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
          <svg
            className="h-6 w-6 text-slate-400"
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
        </div>
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">
          No generated documents
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-[200px]">
          Generate a tailored resume and cover letter for this job.
        </p>
        <Button onClick={onRegenerate} className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
          Generate Documents
        </Button>
      </div>
    );
  }

  if (generationStatus === "failed") {
    return (
      <div className="bg-red-50/80 dark:bg-red-950/30 backdrop-blur-xl border border-red-200 dark:border-red-900/50 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center transform-gpu">
        <div className="h-10 w-10 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center mb-3">
          <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
          Generation failed
        </p>
        <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-5">
          Something went wrong. Please try again.
        </p>
        <Button variant="outline" size="sm" onClick={onRegenerate} className="w-full h-11 rounded-xl border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-medium">
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
