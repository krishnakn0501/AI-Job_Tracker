"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Loader2, Calendar, FileText, CheckCircle2, Clock, BriefcaseBusiness, Save } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/utils/cn";
import type { ApplicationDto } from "@/application/dtos/ApplicationDto";
import { ReminderOverride } from "@/components/ReminderOverride";
import ResumeViewer from "@/components/ResumeViewer";

type ApplicationDetailsModalProps = {
  appId: string | null;
  onClose: () => void;
  onUpdate: () => void;
};

type Tab = "overview" | "tracking" | "documents";

export default function ApplicationDetailsModal({ appId, onClose, onUpdate }: ApplicationDetailsModalProps) {
  const [app, setApp] = useState<ApplicationDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  
  // Form State
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [reminderOverride, setReminderOverride] = useState<{
    enabled: boolean;
    hour: number | null;
    amPm: string | null;
    offsetDays: number | null;
    repeat: boolean | null;
  }>({
    enabled: false,
    hour: 9,
    amPm: "AM",
    offsetDays: 0,
    repeat: false,
  });
  
  const [globalPref, setGlobalPref] = useState({
    hour: 9,
    amPm: "AM",
    offsetDays: 0,
    repeat: false,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appId) {
      setLoading(true);
      fetch(`/api/applications/${appId}`)
        .then(res => res.json())
        .then(data => {
          setApp(data);
          setNotes(data.notes || "");
          setFollowUpDate(data.followUpDate ? data.followUpDate.split("T")[0] : "");
          setInterviewDate(data.interviewDate ? data.interviewDate.split("T")[0] : "");
          setReminderOverride({
            enabled: data.reminderOverrideEnabled ?? false,
            hour: data.overrideReminderHour ?? 9,
            amPm: data.overrideReminderAmPm ?? "AM",
            offsetDays: data.overrideReminderOffsetDays ?? 0,
            repeat: data.overrideReminderRepeat ?? false,
          });
        })
        .finally(() => setLoading(false));

      fetch("/api/user/settings")
        .then(res => res.json())
        .then(data => {
          setGlobalPref({
            hour: data.reminderHour ?? 9,
            amPm: data.reminderAmPm ?? "AM",
            offsetDays: data.reminderOffsetDays ?? 0,
            repeat: data.reminderRepeat ?? false,
          });
        });
    }
  }, [appId]);

  const handleSave = async () => {
    if (!app) return;
    setSaving(true);
    
    // Save Dates
    const datesRes = await fetch(`/api/applications/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        followUpDate: followUpDate || null,
        interviewDate: interviewDate || null,
      }),
    });
    
    // Save Reminder Override
    const reminderRes = await fetch(`/api/applications/${app.id}/reminder-override`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reminderOverrideEnabled: reminderOverride.enabled,
        overrideReminderHour: reminderOverride.hour,
        overrideReminderAmPm: reminderOverride.amPm,
        overrideReminderOffsetDays: reminderOverride.offsetDays,
        overrideReminderRepeat: reminderOverride.repeat,
      }),
    });
    
    if (datesRes.ok && reminderRes.ok) {
      toast.success("Tracking updated");
      onUpdate();
    } else {
      toast.error("Failed to update tracking");
    }
    setSaving(false);
  };

  const handleRegenerate = async () => {
    if (!app) return;
    try {
      const res = await fetch(`/api/applications/${app.id}/regenerate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to start generation");
      toast.success("Generation started!");
      onUpdate();
      onClose();
    } catch (err) {
      toast.error("Could not trigger regeneration");
    }
  };

  const renderTabContent = () => {
    if (!app) return null;
    
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Description</h4>
              <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 whitespace-pre-wrap font-mono">
                {app.jdText || "No job description provided."}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</h4>
              <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Add private notes here..."
                readOnly
                className="text-sm min-h-[100px] bg-white dark:bg-black/20 resize-none rounded-xl border-slate-200 dark:border-white/10"
              />
              <p className="text-[10px] text-slate-400 mt-1 pl-1">Notes are currently read-only in this modal.</p>
            </div>
          </div>
        );
      case "tracking":
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Follow-up Date</label>
                <Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="rounded-xl border-slate-200 dark:border-white/10 shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Interview Date</label>
                <Input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className="rounded-xl border-slate-200 dark:border-white/10 shadow-sm" />
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-100 dark:border-white/5">
              <ReminderOverride 
                globalPref={globalPref as any} 
                override={reminderOverride as any} 
                onChange={(partial) => setReminderOverride(prev => ({ ...prev, ...partial }))} 
              />
            </div>
            
            <Button onClick={handleSave} disabled={saving} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md font-semibold text-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Tracking
            </Button>
          </div>
        );
      case "documents":
        if (app.generationStatus === "skipped") {
            return (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 text-center">
                    <FileText className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Tailoring Skipped</h3>
                    <p className="text-xs text-slate-500 mb-4">You skipped AI generation for this application.</p>
                    {app.resumeBaseId && (
                        <p className="text-[11px] font-mono text-slate-400 bg-white dark:bg-black/20 p-2 rounded-lg border border-slate-200 dark:border-white/5 inline-block">Base Resume Used</p>
                    )}
                </div>
            );
        }
        return (
          <div className="scale-95 origin-top -mt-4">
            <ResumeViewer
              applicationId={app.id}
              generationStatus={app.generationStatus}
              resumeReviewPath={app.resumeReviewPath ?? null}
              resumeFinalPath={app.resumeFinalPath ?? null}
              coverLetterReviewPath={app.coverLetterReviewPath ?? null}
              coverLetterFinalPath={app.coverLetterFinalPath ?? null}
              roleTitleChanged={app.roleTitleChanged ?? false}
              roleTitleNote={app.roleTitleNote || ""}
              onRegenerate={handleRegenerate}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={!!appId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-slate-200/60 dark:border-white/10 shadow-2xl rounded-[24px]">
        {loading ? (
          <div className="h-[400px] flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
            <p className="text-sm font-medium text-slate-500">Loading details...</p>
          </div>
        ) : app ? (
          <div className="flex flex-col">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-start justify-between mb-2">
                <div className="pr-4">
                  <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <BriefcaseBusiness className="h-5 w-5 text-indigo-500 shrink-0" />
                    <span className="truncate">{app.company}</span>
                  </DialogTitle>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{app.role}</p>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shrink-0">
                  {app.status}
                </div>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider mt-3">
                <Calendar className="h-3.5 w-3.5" />
                Applied {format(new Date(app.appliedDate), "MMM d, yyyy")}
              </p>
            </div>
            
            {/* Custom Tabs */}
            <div className="flex border-b border-slate-100 dark:border-white/5 px-2 bg-slate-50/30 dark:bg-black/10">
              <button 
                onClick={() => setActiveTab("overview")}
                className={cn("flex-1 py-3 text-sm font-semibold border-b-2 transition-all", activeTab === "overview" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab("tracking")}
                className={cn("flex-1 py-3 text-sm font-semibold border-b-2 transition-all", activeTab === "tracking" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                Tracking
              </button>
              <button 
                onClick={() => setActiveTab("documents")}
                className={cn("flex-1 py-3 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5", activeTab === "documents" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                Documents
                {app.generationStatus === "ready" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                {app.generationStatus === "generating" && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />}
                {app.generationStatus === "pending" && <Clock className="h-3.5 w-3.5 text-amber-500" />}
              </button>
            </div>
            
            {/* Content Area */}
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
            Application not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
