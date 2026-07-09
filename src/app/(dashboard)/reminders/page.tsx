"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Bell, Clock, CheckCircle2, ChevronRight, Briefcase } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

type ReminderDto = {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  status: string;
  followUpDate?: string;
  followUpDone?: boolean;
  interviewDate?: string;
  interviewDone?: boolean;
  type: "follow_up" | "interview";
};

type FilterType = "all" | "upcoming" | "past_due" | "completed";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("upcoming");

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/reminders/history");
      const data = await res.json();
      setReminders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch reminders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "JobTrack — Reminders";
    fetchHistory();
  }, []);

  const handleMarkDone = async (item: ReminderDto) => {
    // Optimistic update
    setReminders((prev) =>
      prev.map((r) =>
        r.id === item.id
          ? {
              ...r,
              ...(item.type === "follow_up" ? { followUpDone: true } : { interviewDone: true }),
            }
          : r
      )
    );

    try {
      const field = item.type === "follow_up" ? "followUpDone" : "interviewDone";
      await fetch(`/api/applications/${item.applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: true }),
      });
      toast.success("Reminder marked as completed");
    } catch {
      toast.error("Failed to update reminder");
      fetchHistory(); // revert on error
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredReminders = reminders.filter((r) => {
    const isDone = r.type === "follow_up" ? r.followUpDone : r.interviewDone;
    const dateStr = r.type === "follow_up" ? r.followUpDate : r.interviewDate;
    const date = dateStr ? parseISO(dateStr) : null;
    
    if (filter === "completed") return isDone;
    if (filter === "all") return true;

    // Not completed if we reached here
    if (isDone) return false;

    if (!date) return true; // fallback
    
    const isPastDue = date < today;
    
    if (filter === "past_due") return isPastDue;
    if (filter === "upcoming") return !isPastDue;
    
    return true;
  }).sort((a, b) => {
    const dateA = a.type === "follow_up" ? a.followUpDate : a.interviewDate;
    const dateB = b.type === "follow_up" ? b.followUpDate : b.interviewDate;
    // Sort ascending by date
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Bell className="h-6 w-6 text-indigo-500" />
          Reminder History
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          Track all your upcoming interviews and follow-ups.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "upcoming", label: "Upcoming" },
          { id: "past_due", label: "Past Due" },
          { id: "completed", label: "Completed" },
          { id: "all", label: "All Reminders" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as FilterType)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              filter === f.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                : "bg-white/60 dark:bg-black/30 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-black/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center h-full">
            <CheckCircle2 className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-4" />
            <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
              No {filter.replace("_", " ")} reminders
            </h2>
            <p className="text-sm text-slate-400">
              You're all caught up for this view!
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-2">
            <div className="space-y-2">
              {filteredReminders.map((item) => {
                const isDone = item.type === "follow_up" ? item.followUpDone : item.interviewDone;
                const dateStr = item.type === "follow_up" ? item.followUpDate : item.interviewDate;
                const date = dateStr ? parseISO(dateStr) : null;
                const isPastDue = date && date < today && !isDone;

                return (
                  <div
                    key={item.id}
                    className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      isDone
                        ? "bg-slate-50/50 dark:bg-neutral-800/20 border-slate-100 dark:border-neutral-800"
                        : "bg-white dark:bg-neutral-900 border-white/40 dark:border-white/5 hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isDone
                            ? "bg-slate-100 dark:bg-neutral-800 text-slate-400"
                            : item.type === "interview"
                            ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                            : isPastDue
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3
                          className={`font-semibold ${
                            isDone ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {item.company}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <Briefcase className="h-3 w-3" />
                          <span>{item.role}</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span
                            className={
                              isPastDue && !isDone
                                ? "text-red-500 font-medium"
                                : item.type === "interview" && !isDone
                                ? "text-purple-500 font-medium"
                                : ""
                            }
                          >
                            {item.type === "interview" ? "Interview: " : "Follow up: "}
                            {date ? format(date, "MMM d, yyyy") : "No date"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isDone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkDone(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                        >
                          Mark Done
                        </Button>
                      )}
                      <Link href={`/application/${item.applicationId}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
