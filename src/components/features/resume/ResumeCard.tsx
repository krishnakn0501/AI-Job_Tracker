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
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {editingLabel ? (
              <Input
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={saveLabel}
                onKeyDown={(e) => e.key === "Enter" && saveLabel()}
                autoFocus
                className="h-8 text-sm font-medium"
              />
            ) : (
              <button
                onClick={() => {
                  setLabelDraft(resume.label);
                  setEditingLabel(true);
                }}
                className="text-sm font-medium text-slate-800 hover:underline"
              >
                {resume.label}
              </button>
            )}
            {resume.isBase && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                Base resume
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!resume.isBase && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetBase}
                className="h-7 text-xs"
              >
                Set as base
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(true)}
              className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-2">
          {resume.filename} &middot; uploaded {format(new Date(resume.createdAt), "MMM d, yyyy")}
        </p>
        {resume.applications.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            Used in {resume.applications.length} application
            {resume.applications.length > 1 ? "s" : ""}
          </button>
        )}
        {expanded && (
          <div className="mt-2 pl-4 border-l-2 border-slate-100 space-y-1.5">
            {resume.applications.map((app) => (
              <Link
                key={app.id}
                href={`/application/${app.id}`}
                className="flex items-center justify-between text-xs hover:bg-slate-50 px-2 py-1.5 rounded-md"
              >
                <span className="text-slate-700">
                  {app.company} &mdash; {app.role}
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
              {resume.applications.length > 0 ? (
                <>
                  This resume was used in {resume.applications.length} application
                  {resume.applications.length > 1 ? "s" : ""}. Those applications will keep
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
