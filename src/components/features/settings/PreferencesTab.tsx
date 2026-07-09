"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { toast } from "react-hot-toast";
import { summarizePreference } from "@/lib/reminder-engine";

export default function PreferencesTab({
  userData,
  setUserData,
  reminderHour,
  setReminderHour,
  reminderAmPm,
  setReminderAmPm,
  reminderOffsetDays,
  setReminderOffsetDays,
  reminderRepeat,
  setReminderRepeat,
  offsetPreset,
  setOffsetPreset,
  customOffsetDays,
  setCustomOffsetDays,
}: any) {
  const { setTheme, theme: currentAppTheme } = useTheme();
  const [isSavingReminders, setIsSavingReminders] = useState(false);

  const effectiveOffsetDays =
    offsetPreset === "other" ? customOffsetDays : Number(offsetPreset);

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    // 1. Update the DOM/Next-Themes state immediately
    setTheme(newTheme);
    setUserData({ ...userData, theme: newTheme });

    // 2. Persist in database
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (res.ok) {
        toast.success("Theme updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to persist theme");
      }
    } catch (error) {
      toast.error("Failed to persist theme");
    }
  };

  const saveReminderPreferences = async () => {
    setIsSavingReminders(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderHour,
          reminderAmPm,
          reminderOffsetDays: effectiveOffsetDays,
          reminderRepeat,
        }),
      });

      if (res.ok) {
        toast.success("Reminder preferences saved");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save reminder preferences");
      }
    } catch (error) {
      toast.error("Failed to save reminder preferences");
    } finally {
      setIsSavingReminders(false);
    }
  };

  const handleOffsetPresetChange = (value: string) => {
    setOffsetPreset(value);
    if (value !== "other") {
      setReminderOffsetDays(Number(value));
    }
  };

  return (
    <div className="space-y-10">
      {/* Theme Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-1">
            Theme Preferences
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose your preferred theme for the application.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {[
            { id: "light", label: "Light" },
            { id: "dark", label: "Dark" },
            { id: "system", label: "System Default" },
          ].map((t) => {
            const isActive = userData.theme === t.id;
            return (
              <Button
                key={t.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => handleThemeChange(t.id as any)}
                className={
                  isActive
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all"
                    : "bg-white/50 dark:bg-black/20 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-black/50"
                }
              >
                {t.label}
              </Button>
            );
          })}
        </div>
      </section>

      {/* Reminders Section */}
      <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/10">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-1">
            Reminder Defaults
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Set when you want to receive follow-up emails. These are your
            defaults — individual applications can override them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Time of day */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                Reminder time
              </label>
              <Select
                value={String(reminderHour)}
                onValueChange={(v) => setReminderHour(Number(v))}
              >
                <SelectTrigger className="w-full bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                &nbsp;
              </label>
              <Select
                value={reminderAmPm}
                onValueChange={(v) => setReminderAmPm(v as "AM" | "PM")}
              >
                <SelectTrigger className="w-full bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lead-time offset */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              Remind me
            </label>
            <Select
              value={offsetPreset}
              onValueChange={handleOffsetPresetChange}
            >
              <SelectTrigger className="w-full bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">On the day</SelectItem>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="2">2 days before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="7">1 week before</SelectItem>
                <SelectItem value="other">Other…</SelectItem>
              </SelectContent>
            </Select>
            {offsetPreset === "other" && (
              <div className="flex items-center gap-2 mt-3">
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={customOffsetDays}
                  onChange={(e) => setCustomOffsetDays(Number(e.target.value))}
                  className="w-24 h-10 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10"
                />
                <span className="text-sm text-slate-500">days before</span>
              </div>
            )}
          </div>
        </div>

        {/* Repeat toggle */}
        <div className="flex items-center justify-between py-4 mt-2">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Repeat daily
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fire every day starting from the offset until the follow-up date
            </p>
          </div>
          <Switch
            checked={reminderRepeat}
            onCheckedChange={setReminderRepeat}
          />
        </div>

        {/* Effective summary */}
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-lg px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300">
          {summarizePreference({
            hour: reminderHour,
            amPm: reminderAmPm,
            offsetDays: effectiveOffsetDays,
            repeat: reminderRepeat,
          })}
        </div>

        <div className="pt-2">
          <Button
            onClick={saveReminderPreferences}
            disabled={isSavingReminders}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all duration-200"
          >
            {isSavingReminders ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </section>
    </div>
  );
}
