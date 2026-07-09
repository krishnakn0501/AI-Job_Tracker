"use client";

import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ReminderPreference,
  getEffectivePreference,
  summarizePreference,
} from "@/lib/reminder-engine";
import { BellRing } from "lucide-react";

export type ReminderOverrideState = {
  enabled: boolean;
  hour: number | null;
  amPm: string | null;
  offsetDays: number | null;
  repeat: boolean | null;
};

type Props = {
  globalPref: ReminderPreference;
  override: ReminderOverrideState;
  onChange: (override: Partial<ReminderOverrideState>) => void;
};

export function ReminderOverride({ globalPref, override, onChange }: Props) {
  const effective = getEffectivePreference(globalPref, override);

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      onChange({
        enabled: false,
        hour: null,
        amPm: null,
        offsetDays: null,
        repeat: null,
      });
    } else {
      onChange({ enabled: true });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 p-5 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-indigo-500" />
          <p className="text-sm font-bold text-slate-800 dark:text-white">Custom Reminder</p>
        </div>
        <Switch
          checked={override.enabled}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-indigo-500"
        />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Override the default reminder time for this application.
      </p>

      {override.enabled && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
          {/* Hour */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                Time
              </label>
              <Select
                value={override.hour !== null ? String(override.hour) : String(globalPref.hour)}
                onValueChange={(v) => onChange({ hour: Number(v) })}
              >
                <SelectTrigger className="h-10 rounded-xl bg-white/50 dark:bg-black/40 border-slate-200 dark:border-white/10 shadow-sm focus:ring-indigo-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                    <SelectItem key={h} value={String(h)} className="font-medium">
                      {h}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                AM/PM
              </label>
              <Select
                value={override.amPm ?? globalPref.amPm}
                onValueChange={(v) => onChange({ amPm: v })}
              >
                <SelectTrigger className="h-10 rounded-xl bg-white/50 dark:bg-black/40 border-slate-200 dark:border-white/10 shadow-sm focus:ring-indigo-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                  <SelectItem value="AM" className="font-medium">AM</SelectItem>
                  <SelectItem value="PM" className="font-medium">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Offset */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
              Remind me
            </label>
            <Select
              value={
                override.offsetDays !== null
                  ? String(override.offsetDays)
                  : String(globalPref.offsetDays)
              }
              onValueChange={(v) => onChange({ offsetDays: Number(v) })}
            >
              <SelectTrigger className="h-10 rounded-xl bg-white/50 dark:bg-black/40 border-slate-200 dark:border-white/10 shadow-sm focus:ring-indigo-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                <SelectItem value="0" className="font-medium">On the day</SelectItem>
                <SelectItem value="1" className="font-medium">1 day before</SelectItem>
                <SelectItem value="2" className="font-medium">2 days before</SelectItem>
                <SelectItem value="3" className="font-medium">3 days before</SelectItem>
                <SelectItem value="7" className="font-medium">1 week before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Repeat */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Repeat daily</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Until follow-up date
              </p>
            </div>
            <Switch
              checked={override.repeat ?? globalPref.repeat}
              onCheckedChange={(checked) => onChange({ repeat: checked })}
              className="data-[state=checked]:bg-indigo-500"
            />
          </div>

          <button
            onClick={() =>
              onChange({
                hour: null,
                amPm: null,
                offsetDays: null,
                repeat: null,
              })
            }
            className="text-xs text-indigo-500 dark:text-indigo-400 font-medium hover:underline pt-2 inline-block"
            type="button"
          >
            Reset to defaults
          </button>
        </div>
      )}

      <div className="mt-4 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 text-xs font-medium text-indigo-700 dark:text-indigo-300">
        {summarizePreference(effective)}
      </div>
    </div>
  );
}
