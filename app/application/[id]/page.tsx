"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft, ChevronUp, ChevronDown, FileText, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import type { Application } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DashboardShell from "@/components/DashboardShell";
import StatusControl from "@/components/StatusControl";
import ResumeViewer from "@/components/ResumeViewer";

export default function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [interviewDate, setInterviewDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [jdExpanded, setJdExpanded] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<string>("");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Date validation states
  const [followUpDateConfirmed, setFollowUpDateConfirmed] = useState(false);
  const [followUpDateWarning, setFollowUpDateWarning] = useState(false);
  const [interviewDateConfirmed, setInterviewDateConfirmed] = useState(false);
  const [interviewDateWarning, setInterviewDateWarning] = useState(false);

  const handleNavigateBack = () => {
    // Clear any polling intervals before navigating
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    router.push("/dashboard");
  };

  // Check if date is in the past
  const checkDatePast = (dateStr: string | null) => {
    if (!dateStr) return false;

    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate < today;
  };

  // Handle follow-up date change
  const handleFollowUpDateChange = (dateStr: string) => {
    setFollowUpDate(dateStr);
    setFollowUpDateWarning(checkDatePast(dateStr));
    if (!checkDatePast(dateStr)) {
      setFollowUpDateConfirmed(false);
    }
  };

  // Handle interview date change
  const handleInterviewDateChange = (dateStr: string) => {
    setInterviewDate(dateStr);
    setInterviewDateWarning(checkDatePast(dateStr));
    if (!checkDatePast(dateStr)) {
      setInterviewDateConfirmed(false);
    }
  };

  // Handle follow-up date blur (save)
  const handleFollowUpDateBlur = async () => {
    // If it's a past date and not confirmed, don't save
    if (followUpDateWarning && !followUpDateConfirmed) {
      return;
    }

    await handleFieldUpdate("followUpDate", followUpDate || null);
  };

  // Handle interview date blur (save)
  const handleInterviewDateBlur = async () => {
    // If it's a past date and not confirmed, don't save
    if (interviewDateWarning && !interviewDateConfirmed) {
      return;
    }

    await handleFieldUpdate("interviewDate", interviewDate || null);
  };

  const fetchApp = async () => {
    try {
      const res = await fetch(`/api/applications/${params.id}`);
      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        console.error("[fetchApp] Failed to fetch:", res.status, res.statusText);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setApp(data);
      setFollowUpDate(data.followUpDate || "");
      setInterviewDate(data.interviewDate || "");
      setNotes(data.notes || "");

      // Initialize warnings
      setFollowUpDateWarning(checkDatePast(data.followUpDate));
      setInterviewDateWarning(checkDatePast(data.interviewDate));
    } catch (err) {
      console.error("[fetchApp] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Polling: check every 3s while generating
  useEffect(() => {
    if (app?.generationStatus === "generating") {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/applications/${params.id}`);
          const data = await res.json();
          if (data.generationStatus !== "generating") {
            setApp(data);
            if (data.generationStatus === "ready")
              toast.success("Resume ready!");
          }
        } catch {
          // Ignore fetch errors during polling (e.g., if navigating away)
        }
      }, 3000);

      setPollingInterval(interval);

      return () => {
        clearInterval(interval);
      };
    }
  }, [app?.generationStatus, params.id]);

  useEffect(() => {
    fetchApp();
  }, [params.id]);

  useEffect(() => {
    if (app) document.title = `JobTrack — ${app.company} · ${app.role}`;
  }, [app]);

  const handleStatusChange = async (status: string) => {
    // Optimistic update
    setApp((prev) => (prev ? { ...prev, status } : null));

    const res = await fetch(`/api/applications/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      toast.error("Failed to update status");
      fetchApp(); // revert
    }
  };

  const handleFieldUpdate = async (field: string, value: string | null) => {
    const res = await fetch(`/api/applications/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    if (!res.ok) {
      toast.error(`Failed to update ${field}`);
      fetchApp(); // revert
    }
  };

  const handleNotesSave = async () => {
    setSaveIndicator("Saving…");
    await handleFieldUpdate("notes", notes);
    setSaveIndicator("Saved ✓");
    setTimeout(() => setSaveIndicator(""), 2000);
  };

  const handleRegenerate = async () => {
    if (!params?.id) return;

    // Set optimistic status
    setApp((prev) =>
      prev ? { ...prev, generationStatus: "generating" } : null
    );

    // Update status to generating first
    await fetch(`/api/applications/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationStatus: "generating" }),
    });

    // Re-trigger n8n
    await fetch("/api/applications/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id, jdText: app?.jdText ?? "" }),
    });

    toast("Re-generating resume…");
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
          <h1 className="text-xl font-semibold text-slate-700 mb-2">Page not found</h1>
          <p className="text-sm text-slate-400 mb-6">
            This application doesn't exist or was deleted.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-blue-600 hover:underline"
            type="button"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading || !app) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex gap-0 h-full">
        {/* Left column */}
        <div className="w-3/5 pr-8 py-6 overflow-y-auto">
          <button
            onClick={handleNavigateBack}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors"
            type="button"
            aria-label="All applications"
          >
            <ChevronLeft className="h-4 w-4" /> All applications
          </button>

          <h1 className="text-2xl font-semibold text-slate-800">
            {app.company}
          </h1>
          <p className="text-lg text-slate-500 mt-0.5 mb-4">{app.role}</p>
          <p className="text-xs text-slate-400 mb-6">
            Applied {format(new Date(app.appliedDate), "MMMM d, yyyy")}
          </p>

          <div className="mb-6">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              Status
            </p>
            <StatusControl
              currentStatus={app.status}
              onChange={handleStatusChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                Follow-up reminder
              </label>
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => handleFollowUpDateChange(e.target.value)}
                onBlur={handleFollowUpDateBlur}
                className="h-9 text-sm"
              />
              {followUpDateWarning && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-amber-700">
                        This date is in the past — are you sure?
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-amber-700 hover:text-amber-900 text-xs mt-1"
                        onClick={() => setFollowUpDateConfirmed(true)}
                      >
                        Yes, confirm
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                Interview date
              </label>
              <Input
                type="date"
                value={interviewDate}
                onChange={(e) => handleInterviewDateChange(e.target.value)}
                onBlur={handleInterviewDateBlur}
                className="h-9 text-sm"
              />
              {interviewDateWarning && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-amber-700">
                        This date is in the past — are you sure?
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-amber-700 hover:text-amber-900 text-xs mt-1"
                        onClick={() => setInterviewDateConfirmed(true)}
                      >
                        Yes, confirm
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Private notes
              </label>
              {saveIndicator && (
                <span className="text-xs text-slate-400">{saveIndicator}</span>
              )}
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesSave}
              placeholder="Add notes about this application…"
              className="min-h-[120px] text-sm resize-none"
            />
          </div>

          {app.jdText && (
            <div className="mb-4">
              <button
                className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1"
                onClick={() => setJdExpanded(!jdExpanded)}
              >
                Job description{" "}
                {jdExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {jdExpanded ? (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 font-mono leading-relaxed max-h-48 overflow-y-auto">
                  {app.jdText}
                </div>
              ) : (
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                  {app.jdText.slice(0, 200)}…
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="w-2/5 pl-4 py-6 overflow-y-auto border-l border-slate-100">
          <div className="sticky top-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">
                Tailored resume & cover letter
              </h2>
              <ResumeViewer
                applicationId={app.id}
                generationStatus={app.generationStatus}
                resumeReviewPath={app.resumeReviewPath}
                resumeFinalPath={app.resumeFinalPath}
                coverLetterReviewPath={app.coverLetterReviewPath}
                coverLetterFinalPath={app.coverLetterFinalPath}
                roleTitleChanged={app.roleTitleChanged}
                roleTitleNote={app.roleTitleNote}
                onRegenerate={handleRegenerate}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}