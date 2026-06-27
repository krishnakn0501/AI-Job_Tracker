"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { format } from "date-fns";

type Props = {
  onReupload: () => void;
  refreshKey?: number;
};

type ResumeData = {
  fileId: string;
  filename: string;
  updatedAt: string;
};

export default function ResumeUploadStatus({
  onReupload,
  refreshKey,
}: Props) {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResume = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/resume-base");
        if (res.ok) {
          const data = await res.json();
          setResume(data);
        } else {
          setResume(null);
        }
      } catch {
        setResume(null);
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, [refreshKey]);

  if (loading) {
    return null;
  }

  if (!resume) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-700">
            No resume uploaded yet
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Upload your resume below to enable AI tailoring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <span className="text-sm font-medium text-green-700">
          Resume uploaded ✓
        </span>
        <button
          onClick={onReupload}
          className="ml-auto text-xs text-slate-400 underline hover:text-slate-600"
        >
          Re-upload to update
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <FileText className="h-3.5 w-3.5" />
        <span>{resume.filename}</span>
      </div>
      <p className="text-xs text-slate-400 mt-1">
        Uploaded {format(new Date(resume.updatedAt), "MMMM d, yyyy")}
      </p>
    </div>
  );
}
