"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Resume = {
  id: string;
  label: string;
  filename: string;
  fileId: string;
  isBase: boolean;
  createdAt: string;
  applications: Array<{ id: string; company: string; role: string; status: string }>;
};

type Props = {
  resume: Resume;
  onUpdate: () => void;
};

export default function ResumeCard({ resume, onUpdate }: Props) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(resume.label);
  const [expanded, setExpanded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const applications = resume.applications || [];

  const saveLabel = async () => {
    if (!labelDraft.trim()) {
      // Revert to original if empty
      setLabelDraft(resume.label);
      setEditingLabel(false);
      return;
    }
    if (labelDraft.trim() === resume.label) {
      setEditingLabel(false);
      return;
    }
    const res = await fetch(`/api/resumes/${resume.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: labelDraft.trim() }),
    });
    if (res.ok) {
      setEditingLabel(false);
      onUpdate();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to update label");
    }
  };

  const handleSetBase = async () => {
    const res = await fetch(`/api/resumes/${resume.id}/set-base`, {
      method: "POST",
    });
    if (res.ok) {
      onUpdate();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to set as base");
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/resumes/${resume.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleteConfirm(false);
      onUpdate();
      toast.success("Resume deleted");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to delete resume");
    }
  };

  return (
    <>
      <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-shadow transform-gpu">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {editingLabel ? (
              <Input
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={saveLabel}
                onKeyDown={(e) => e.key === "Enter" && saveLabel()}
                autoFocus
                className="h-9 w-[200px] text-sm font-bold bg-white dark:bg-black/40 border-indigo-200 dark:border-indigo-500/30 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            ) : (
              <button
                onClick={() => {
                  setLabelDraft(resume.label);
                  setEditingLabel(true);
                }}
                className="text-base font-bold text-slate-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {resume.label}
              </button>
            )}
            {resume.isBase && (
              <span className="text-xs bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Default Base
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 text-xs font-semibold rounded-lg bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <a href={resume.fileId} target="_blank" rel="noopener noreferrer">Preview</a>
            </Button>
            {!resume.isBase && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetBase}
                className="h-8 text-xs font-semibold rounded-lg bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Set as default
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(true)}
              className="h-8 text-xs font-semibold rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              Delete
            </Button>
          </div>
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 flex items-center flex-wrap gap-2">
          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 truncate max-w-[200px]" title={resume.filename}>
            {resume.filename}
          </span>
          <span>Uploaded {format(new Date(resume.createdAt), "MMM d, yyyy")}</span>
        </p>
        
        {applications.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Used in {applications.length} application{applications.length > 1 ? "s" : ""}
          </button>
        )}
        
        {expanded && (
          <div className="mt-3 pl-2 space-y-2 relative before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-[2px] before:bg-indigo-100 dark:before:bg-indigo-500/20">
            {applications.map((app) => (
              <Link
                key={app.id}
                href={`/application/${app.id}`}
                className="flex items-center justify-between text-xs hover:bg-white dark:hover:bg-slate-800/80 px-3 py-2 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all shadow-sm ml-3 group"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {app.company} &mdash; <span className="font-normal text-slate-500 dark:text-slate-400">{app.role}</span>
                </span>
                <StatusBadge status={app.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this resume?</DialogTitle>
            <DialogDescription>
              {applications.length > 0 ? (
                <>
                  This resume was used in {applications.length} application
                  {applications.length > 1 ? "s" : ""}. Those applications will keep
                  their generated resumes &mdash; they just won&apos;t be linked to this resume
                  anymore. This cannot be undone.
                </>
              ) : (
                "This resume is not used in any applications. This cannot be undone."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  StatusBadge (inline — same palette as Dashboard)                   */
/* ------------------------------------------------------------------ */

const statusColours: Record<string, { bg: string; text: string }> = {
  Applied: { bg: "#EFF6FF", text: "#1D4ED8" },
  Screening: { bg: "#FFFBEB", text: "#B45309" },
  Interview: { bg: "#FAF5FF", text: "#6D28D9" },
  Offer: { bg: "#F0FDF4", text: "#15803D" },
  Rejected: { bg: "#F8FAFC", text: "#64748B" },
};

function StatusBadge({ status }: { status: string }) {
  const colours = statusColours[status] ?? { bg: "#F8FAFC", text: "#64748B" };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: colours.bg, color: colours.text }}
    >
      {status}
    </span>
  );
}
