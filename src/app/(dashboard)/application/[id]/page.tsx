"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronUp, ChevronDown, FileText, AlertTriangle, Building2, BriefcaseBusiness, CalendarClock, MessageSquareText, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import type { Application } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/utils/cn";
import StatusControl from "@/components/StatusControl";
import ResumeViewer from "@/components/ResumeViewer";
import { ReminderOverride, ReminderOverrideState } from "@/components/ReminderOverride";
import type { ReminderPreference } from "@/lib/reminder-engine";

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

  // S10 — reminder override state
  const [globalPref, setGlobalPref] = useState<ReminderPreference>({
    hour: 9,
    amPm: "AM",
    offsetDays: 0,
    repeat: false,
  });
  const [currentOverride, setCurrentOverride] = useState<ReminderOverrideState>({
    enabled: false,
    hour: null,
    amPm: null,
    offsetDays: null,
    repeat: null,
  });

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

      // S10 — set reminder override state
      setCurrentOverride({
        enabled: data.reminderOverrideEnabled ?? false,
        hour: data.overrideReminderHour ?? null,
        amPm: data.overrideReminderAmPm ?? null,
        offsetDays: data.overrideReminderOffsetDays ?? null,
        repeat: data.overrideReminderRepeat ?? null,
      });

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

  // S10 — Fetch global reminder preferences
  useEffect(() => {
    fetch("/api/user/settings")
      .then((res) => res.json())
      .then((data) => {
        setGlobalPref({
          hour: data.reminderHour ?? 9,
          amPm: data.reminderAmPm ?? "AM",
          offsetDays: data.reminderOffsetDays ?? 0,
          repeat: data.reminderRepeat ?? false,
        });
      })
      .catch(() => {
        // Silently fail — use defaults
      });
  }, []);

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
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-8 mb-8 shadow-sm group transform-gpu">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-700"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="hidden md:flex h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">
                <CalendarDays className="h-3.5 w-3.5" />
                Applied {format(new Date(app.appliedDate), "MMM d, yyyy")}
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                {app.company}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl text-lg font-medium flex items-center gap-2">
                <BriefcaseBusiness className="h-5 w-5" />
                {app.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left column (70%) */}
        <div className="w-full lg:flex-[7] flex flex-col gap-6">

          {/* Context & Notes Card */}
          <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-sm transform-gpu">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <MessageSquareText className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex-1">Context & Notes</h2>
              {saveIndicator && (
                <span className="text-xs font-medium text-emerald-500 animate-pulse">{saveIndicator}</span>
              )}
            </div>

            <div className="space-y-6">
              <div className="relative">
                <MessageSquareText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesSave}
                  placeholder="Referral from…, recruiter name…"
                  className="min-h-[140px] pl-10 pt-3.5 rounded-xl bg-white/50 dark:bg-black/40 backdrop-blur-sm border-slate-200 dark:border-white/10 shadow-sm resize-none focus:bg-white dark:focus:bg-black/60 transition-colors"
                />
              </div>

              {app.jdText && (
                <div className="pt-2">
                  <button
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group"
                    onClick={() => setJdExpanded(!jdExpanded)}
                  >
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Job description
                    </span>
                    {jdExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                    )}
                  </button>
                  {jdExpanded ? (
                    <div className="mt-3 p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed max-h-64 overflow-y-auto border border-slate-200 dark:border-white/5">
                      {app.jdText}
                    </div>
                  ) : (
                    <p className="mt-3 px-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {app.jdText.slice(0, 200)}…
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column (30%) */}
        <div className="w-full lg:flex-[3] flex flex-col gap-6 shrink-0">
          
          {/* Tracking & Status Card */}
          <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-sm transform-gpu">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CalendarClock className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Tracking</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
                  Status
                </label>
                <StatusControl
                  currentStatus={app.status}
                  onChange={handleStatusChange}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
                    Follow-up reminder
                  </label>
                  <Input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => handleFollowUpDateChange(e.target.value)}
                    onBlur={handleFollowUpDateBlur}
                    className="h-11 rounded-xl bg-white/50 dark:bg-black/40 backdrop-blur-sm border-slate-200 dark:border-white/10 shadow-sm font-medium"
                  />
                  {followUpDateWarning && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            This date is in the past — are you sure?
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-amber-600 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-transparent text-xs font-bold mt-1 underline"
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
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
                    Interview date
                  </label>
                  <Input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => handleInterviewDateChange(e.target.value)}
                    onBlur={handleInterviewDateBlur}
                    className="h-11 rounded-xl bg-white/50 dark:bg-black/40 backdrop-blur-sm border-slate-200 dark:border-white/10 shadow-sm font-medium"
                  />
                  {interviewDateWarning && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            This date is in the past — are you sure?
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-amber-600 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-transparent text-xs font-bold mt-1 underline"
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

              <div className="pt-2">
                <ReminderOverride
                  globalPref={globalPref}
                  override={currentOverride}
                  onChange={async (partial) => {
                    const merged = { ...currentOverride, ...partial };
                    await fetch(`/api/applications/${app.id}/reminder-override`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(merged),
                    });
                    setCurrentOverride(merged);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="sticky top-24">
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
  );
}