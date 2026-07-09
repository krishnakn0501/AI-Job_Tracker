import { addDays, format, startOfDay } from "date-fns";

export type ReminderPreference = {
  hour: number; // 1–12
  amPm: "AM" | "PM";
  offsetDays: number; // 0 = same day, 1 = 1 day before, etc.
  repeat: boolean;
};

export type ReminderOverride = {
  enabled: boolean;
  hour: number | null;
  amPm: string | null;
  offsetDays: number | null;
  repeat: boolean | null;
};

/**
 * Given a User's global preferences and an Application's override fields,
 * returns the effective preference that actually applies.
 */
export function getEffectivePreference(
  global: ReminderPreference,
  override: ReminderOverride
): ReminderPreference {
  if (!override.enabled) return global;
  return {
    hour: override.hour ?? global.hour,
    amPm: (override.amPm as "AM" | "PM") ?? global.amPm,
    offsetDays: override.offsetDays ?? global.offsetDays,
    repeat: override.repeat ?? global.repeat,
  };
}

/**
 * Converts a 12-hour clock value to 24-hour for comparison with current hour.
 */
export function to24Hour(hour: number, amPm: "AM" | "PM"): number {
  if (amPm === "AM") {
    return hour === 12 ? 0 : hour;
  } else {
    return hour === 12 ? 12 : hour + 12;
  }
}

/**
 * Given a followUpDate and preference, returns the date(s) on which a reminder
 * should be sent.
 * - one-time: single date = followUpDate minus offsetDays
 * - repeating: every date from (followUpDate minus offsetDays) up to and
 *   including followUpDate
 */
export function getReminderDates(
  followUpDate: Date,
  pref: ReminderPreference
): string[] {
  const startDate = addDays(startOfDay(followUpDate), -pref.offsetDays);
  const endDate = startOfDay(followUpDate);

  if (!pref.repeat) {
    return [format(startDate, "yyyy-MM-dd")];
  }

  const dates: string[] = [];
  let current = startDate;
  while (current <= endDate) {
    dates.push(format(current, "yyyy-MM-dd"));
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Human-readable summary of effective preference.
 * e.g. "Will remind at 9:00 AM, 1 day before, repeating daily"
 */
export function summarizePreference(pref: ReminderPreference): string {
  const timeStr = `${pref.hour}:00 ${pref.amPm}`;
  const offsetStr =
    pref.offsetDays === 0
      ? "on the day"
      : pref.offsetDays === 1
      ? "1 day before"
      : pref.offsetDays === 7
      ? "1 week before"
      : `${pref.offsetDays} days before`;
  const repeatStr = pref.repeat ? ", repeating daily" : "";
  return `Will remind at ${timeStr}, ${offsetStr}${repeatStr}`;
}
