"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, AlertTriangle, BriefcaseBusiness, Link as LinkIcon, FileText, CalendarClock, MessageSquareText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/utils/cn";
import { ReminderOverride, ReminderOverrideState } from "@/components/ReminderOverride";
import type { ReminderPreference } from "@/lib/reminder-engine";

function defaultFollowUpDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

type ResumeOption = {
  id: string;
  label: string;
  isBase: boolean;
  fileId: string;
};

export default function AddJobForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Field state
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [followUpDate, setFollowUpDate] = useState(defaultFollowUpDate());
  const [notes, setNotes] = useState("");

  // Date validation state
  const [followUpDateConfirmed, setFollowUpDateConfirmed] = useState(false);
  const [followUpDateWarning, setFollowUpDateWarning] = useState(false);

  // Validation state
  const [touched, setTouched] = useState({
    company: false,
    role: false,
    jdText: false,
  });

  // Resume selector state
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [skipTailoring, setSkipTailoring] = useState(false);

  // Reminder override state
  const [globalPref, setGlobalPref] = useState<ReminderPreference>({
    hour: 9,
    amPm: "AM",
    offsetDays: 0,
    repeat: false,
  });
  const [reminderOverride, setReminderOverride] = useState<ReminderOverrideState>({
    enabled: false,
    hour: null,
    amPm: null,
    offsetDays: null,
    repeat: null,
  });

  useEffect(() => {
    fetch("/api/resumes")
      .then((res) => res.json())
      .then((data: ResumeOption[]) => {
        setResumes(data);
        const base = data.find((r: ResumeOption) => r.isBase);
        if (base) setSelectedResumeId(base.id);
      })
      .catch(() => {});
  }, []);

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
      .catch(() => {});
  }, []);

  const checkFollowUpDate = (dateStr: string) => {
    if (!dateStr) {
      setFollowUpDateWarning(false);
      setFollowUpDateConfirmed(false);
      return;
    }
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error("Date cannot be before the application applied date (today).");
      // Reset back to today or default
      setFollowUpDate(defaultFollowUpDate());
      setFollowUpDateWarning(false);
      setFollowUpDateConfirmed(false);
    } else {
      setFollowUpDateWarning(false);
      setFollowUpDateConfirmed(false);
    }
  };

  const handleFollowUpDateChange = (dateStr: string) => {
    setFollowUpDate(dateStr);
    checkFollowUpDate(dateStr);
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showError = (field: "company" | "role" | "jdText") => {
    return touched[field] && !{ company, role, jdText }[field].trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (followUpDateWarning && !followUpDateConfirmed) {
      toast.error("Please confirm the past follow-up date or select a future date.");
      return;
    }

    if (!company.trim() || !role.trim() || !jdText.trim()) {
      toast.error("Company, role, and job description are required.");
      return;
    }

    if (!skipTailoring && !selectedResumeId) {
      toast.error("Please select a resume or check 'Skip resume tailoring'.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          jdText,
          jdUrl,
          followUpDate,
          notes,
          resumeBaseId: selectedResumeId || undefined,
          skipTailoring,
          reminderOverrideEnabled: reminderOverride.enabled,
          overrideReminderHour: reminderOverride.hour,
          overrideReminderAmPm: reminderOverride.amPm,
          overrideReminderOffsetDays: reminderOverride.offsetDays,
          overrideReminderRepeat: reminderOverride.repeat,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create application");
      }
      toast.success(skipTailoring ? "Application added successfully." : "Added! Resume generating — ready in ~30 seconds.");
      router.push("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const noResumes = resumes.length === 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left Column: Job Details */}
      <div className="flex-1 w-full flex flex-col gap-6">
        {/* Resume Selection */}
        <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-sm transform-gpu">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Base Resume</h2>
          </div>
          
          {noResumes ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl mb-4">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                No resumes uploaded yet.
              </p>
              <Button asChild variant="link" className="px-0 mt-1 h-auto text-amber-600 dark:text-amber-300">
                <Link href="/my-resumes">Upload one first →</Link>
              </Button>
            </div>
          ) : (
            <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
              <SelectTrigger className="w-full h-11 rounded-xl bg-white/50 dark:bg-black/40 backdrop-blur-sm border-slate-200 dark:border-white/10 shadow-sm transition-all focus:ring-indigo-500/50">
                <SelectValue placeholder="Select a base resume" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="font-medium">
                    {r.label} {r.isBase && <span className="text-slate-400 ml-1 font-normal">(Default Base)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="skipTailoring"
              checked={skipTailoring}
              onChange={(e) => setSkipTailoring(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-white/10 dark:bg-black/40"
            />
            <label htmlFor="skipTailoring" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Skip AI resume tailoring (just track application)
            </label>
          </div>
        </div>

        {/* Job Details Card */}
        <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-sm transform-gpu">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Job Details</h2>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Company *</label>
                <Input
                  placeholder="e.g. Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onBlur={() => handleBlur("company")}
                  className={cn(
                    "h-11 rounded-xl bg-white/50 dark:bg-black/40 backdrop-blur-sm border-slate-200 dark:border-white/10 shadow-sm transition-all focus:bg-white dark:focus:bg-black/60",
                    showError("company") && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                  )}
                />
                {showError("company") && <p className="text-xs font-medium text-red-500">Required</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Role *</label>
                <Input
                  placeholder="e.g. Software Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  onBlur={() => handleBlur("role")}
                  className={cn(
                    "h-11 rounded-xl bg-white/50 dark:bg-black/40 backdrop-blur-sm border-slate-200 dark:border-white/10 shadow-sm transition-all focus:bg-white dark:focus:bg-black/60",
                    showError("role") && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                  )}
                />
                {showError("role") && <p className="text-xs font-medium text-red-500">Required</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Job Description *</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Paste the full description. Claude uses this to highlight your most relevant skills.</p>
              <Textarea
                placeholder="Paste the requirements, responsibilities, and about the company..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                onBlur={() => handleBlur("jdText")}
                className={cn(
                  "min-h-[240px] rounded-xl bg-slate-50/50 dark:bg-black/40 backdrop-blur-sm border-slate-200 dark:border-white/10 shadow-inner font-mono text-sm leading-relaxed transition-all focus:bg-white dark:focus:bg-black/60 resize-y",
                  showError("jdText") && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                )}
              />
              {showError("jdText") && <p className="text-xs font-medium text-red-500">Required</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                Job Posting URL <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  type="url"
                  placeholder="https://careers.company.com/..."
                  value={jdUrl}
                  onChange={(e) => setJdUrl(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-white/50 dark:bg-black/40 backdrop-blur-sm border-slate-200 dark:border-white/10 shadow-sm transition-all focus:bg-white dark:focus:bg-black/60"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Tracking & Reminders */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0">
        <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-sm transform-gpu sticky top-24">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CalendarClock className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Tracking</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Follow-up Date
              </label>
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => handleFollowUpDateChange(e.target.value)}
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

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Private Notes
              </label>
              <div className="relative">
                <MessageSquareText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <Textarea
                  placeholder="Referral from…, recruiter name…"
                  className="min-h-[100px] pl-10 pt-3.5 rounded-xl bg-white/50 dark:bg-black/40 backdrop-blur-sm border-slate-200 dark:border-white/10 shadow-sm resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-white/10">
              <ReminderOverride
                globalPref={globalPref}
                override={reminderOverride}
                onChange={(partial) => setReminderOverride((prev) => ({ ...prev, ...partial }))}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || (!skipTailoring && noResumes) || (!skipTailoring && !selectedResumeId)}
              className="w-full h-14 mt-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving…
                </>
              ) : skipTailoring ? (
                "Add Application →"
              ) : (
                "Generate Tailored Resume →"
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
