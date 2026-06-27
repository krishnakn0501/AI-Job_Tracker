// src/domains/application/entities/ApplicationStatus.ts

/**
 * Strongly-typed enumeration of application statuses.
 * All valid values are defined here for consistency.
 */
export enum ApplicationStatus {
  Applied = "Applied",
  Screening = "Screening",
  Interview = "Interview",
  Offer = "Offer",
  Rejected = "Rejected",
}

/** Canonical ordered list of statuses */
export const ALL_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.Applied,
  ApplicationStatus.Screening,
  ApplicationStatus.Interview,
  ApplicationStatus.Offer,
  ApplicationStatus.Rejected,
];

/**
 * Status order used for forward-only transition logic.
 * Offer and Rejected share the same max order, so both are terminal states.
 */
export const STATUS_ORDER: Record<ApplicationStatus, number> = {
  [ApplicationStatus.Applied]: 0,
  [ApplicationStatus.Screening]: 1,
  [ApplicationStatus.Interview]: 2,
  [ApplicationStatus.Offer]: 3,
  [ApplicationStatus.Rejected]: 3,
};

/**
 * Status colour coding used by the UI status badge.
 */
export function getStatusColor(status: ApplicationStatus): { bg: string; text: string } {
  const colors: Record<ApplicationStatus, { bg: string; text: string }> = {
    [ApplicationStatus.Applied]: { bg: "#EFF6FF", text: "#1D4ED8" },
    [ApplicationStatus.Screening]: { bg: "#FFFBEB", text: "#B45309" },
    [ApplicationStatus.Interview]: { bg: "#FAF5FF", text: "#6D28D9" },
    [ApplicationStatus.Offer]: { bg: "#F0FDF4", text: "#15803D" },
    [ApplicationStatus.Rejected]: { bg: "#F8FAFC", text: "#64748B" },
  };

  return colors[status];
}

/**
 * Returns true if moving from `from` to `to` is allowed under the forward-only,
 * skip-allowed, terminal-states-locked rule.
 */
export function isValidTransition(
  from: string,
  to: string
): boolean {
  if (from === to) return false;
  const fromOrder = STATUS_ORDER[from as ApplicationStatus];
  const toOrder = STATUS_ORDER[to as ApplicationStatus];
  if (fromOrder === undefined || toOrder === undefined) return false;
  return toOrder > fromOrder;
}

/**
 * Returns the list of statuses that `from` is currently allowed to move to.
 */
export function getValidNextStatuses(from: string): ApplicationStatus[] {
  return ALL_STATUSES.filter((to) => isValidTransition(from, to));
}

/**
 * Checks if a status indicates a terminal state (Offer or Rejected).
 */
export function isTerminalStatus(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.Offer || status === ApplicationStatus.Rejected;
}

/**
 * Statuses that, when moved INTO, should auto-clear followUpDate.
 */
export const TERMINAL_STATUSES_CLEARING_FOLLOWUP: ApplicationStatus[] = [
  ApplicationStatus.Offer,
  ApplicationStatus.Rejected,
];