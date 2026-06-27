export const STATUS_ORDER: Record<string, number> = {
  Applied: 0,
  Screening: 1,
  Interview: 2,
  Offer: 3,
  Rejected: 3,
};

export const ALL_STATUSES = ["Applied", "Screening", "Interview", "Offer", "Rejected"] as const;
export type Status = (typeof ALL_STATUSES)[number];

/**
 * Returns true if moving from `from` to `to` is allowed under the forward-only,
 * skip-allowed, terminal-states-locked rule.
 *
 * Rules:
 * - Same status is never a valid "change" (handled separately, not via this function)
 * - A transition is allowed only if STATUS_ORDER[to] > STATUS_ORDER[from]
 * - Offer and Rejected share order=3, so neither can move to the other (3 > 3 is false)
 * - Nothing can move OUT of Offer or Rejected (both have order=3, the max — nothing
 *   has a strictly greater order, so every transition out of them evaluates to false)
 */
export function isValidTransition(from: string, to: string): boolean {
  if (from === to) return false;
  const fromOrder = STATUS_ORDER[from];
  const toOrder = STATUS_ORDER[to];
  if (fromOrder === undefined || toOrder === undefined) return false;
  return toOrder > fromOrder;
}

/**
 * Returns the list of statuses that `from` is currently allowed to move to.
 * Used to populate the Table mode dropdown so illegal options are never even shown.
 */
export function getValidNextStatuses(from: string): Status[] {
  return ALL_STATUSES.filter((to) => isValidTransition(from, to));
}

/**
 * Statuses that, when moved INTO, should auto-clear followUpDate.
 */
export const TERMINAL_STATUSES_CLEARING_FOLLOWUP = ["Offer", "Rejected"];