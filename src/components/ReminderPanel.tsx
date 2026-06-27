"use client";
import { useState, useEffect } from "react";
import { Bell, Clock, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { differenceInCalendarDays, parseISO } from "date-fns";
import toast from "react-hot-toast";

type ReminderItem = {
  id: string;
  company: string;
  role: string;
  status: string;
  followUpDate: string | null;
  interviewDate: string | null;
  type: "follow_up" | "interview";
};

export default function ReminderPanel() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/reminders");
      const data = await res.json();
      setReminders(Array.isArray(data) ? data : []);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    const iv = setInterval(fetchReminders, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const handleMarkDone = async (id: string, type: "follow_up" | "interview") => {
    const field = type === "follow_up" ? "followUpDate" : "interviewDate";
    setReminders((prev) => prev.filter((r) => r.id !== id)); // optimistic
    try {
      await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: null }),
      });
      toast.success("Reminder cleared");
    } catch {
      fetchReminders(); // revert on error
      toast.error("Failed to clear reminder");
    }
  };

  const getUrgency = (item: ReminderItem) => {
    if (item.type === "interview") {
      return { label: "Interview tomorrow", color: "text-purple-600" };
    }
    const date = item.followUpDate ? parseISO(item.followUpDate) : null;
    if (!date) return { label: "Due", color: "text-slate-400" };
    const days = differenceInCalendarDays(date, new Date());
    if (days <= 0)
      return { label: "Follow-up today", color: "text-red-500 font-medium" };
    if (days <= 2)
      return { label: `In ${days} day${days > 1 ? "s" : ""}`, color: "text-amber-500" };
    return { label: `In ${days} days`, color: "text-slate-400" };
  };

  return (
    <aside className="w-60 flex-shrink-0 border-l border-slate-200 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Reminders</span>
        </div>
        {reminders.length > 0 && (
          <span className="text-xs bg-red-100 text-red-600 font-medium px-1.5 py-0.5 rounded-full">
            {reminders.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">No follow-ups this week</p>
            <p className="text-lg mt-1">🎉</p>
          </div>
        ) : (
          reminders.map((item) => {
            const urgency = getUrgency(item);
            return (
              <div
                key={item.id}
                className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <p className="text-sm font-medium text-slate-800 truncate">
                  {item.company}
                </p>
                <p className="text-xs text-slate-500 truncate">{item.role}</p>
                <div
                  className={`flex items-center gap-1 mt-1.5 text-xs ${urgency.color}`}
                >
                  <Clock className="h-3 w-3" />
                  {urgency.label}
                </div>
                <button
                  onClick={() => handleMarkDone(item.id, item.type)}
                  className="text-xs text-slate-400 underline hover:text-slate-600 mt-1.5 block"
                >
                  Mark done
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-xs text-slate-400">Daily email at 9am</span>
      </div>
    </aside>
  );
}
