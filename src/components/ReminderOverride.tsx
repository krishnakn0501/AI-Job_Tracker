"use client";

import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ReminderPreference,
  getEffectivePreference,
  summarizePreference,
} from "@/lib/reminder-engine";

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
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Custom reminder</p>
          <p className="text-xs text-slate-400">
            Override your default reminder settings for this application
          </p>
        </div>
        <Switch
          checked={override.enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {override.enabled && (
        <div className="space-y-3 mt-3 pt-3 border-t border-slate-100">
          {/* Hour */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">
                Reminder time
              </label>
              <Select
                value={override.hour !== null ? String(override.hour) : String(globalPref.hour)}
                onValueChange={(v) => onChange({ hour: Number(v) })}
              >
                <SelectTrigger>
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
              <label className="text-xs font-medium text-slate-500 block mb-1.5">
                &nbsp;
              </label>
              <Select
                value={override.amPm ?? globalPref.amPm}
                onValueChange={(v) => onChange({ amPm: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Offset */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">On the day</SelectItem>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="2">2 days before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="7">1 week before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Repeat */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700">Repeat daily</p>
              <p className="text-xs text-slate-400">
                Fire every day starting from the offset until the follow-up date
              </p>
            </div>
            <Switch
              checked={override.repeat ?? globalPref.repeat}
              onCheckedChange={(checked) => onChange({ repeat: checked })}
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
            className="text-xs text-slate-400 underline hover:text-slate-600"
            type="button"
          >
            Reset to global defaults
          </button>
        </div>
      )}

      <div className="mt-3 bg-slate-50 rounded-md px-3 py-2 text-xs text-slate-600">
        {summarizePreference(effective)}
      </div>
    </div>
  );
}
