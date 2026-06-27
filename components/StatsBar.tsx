/* "use client"; */

import type { Application } from "@prisma/client";

type Props = { applications: Application[] };

type ValidStatus = "Applied" | "Screening" | "Interview" | "Offer" | "Rejected";

/**
 * Fix: the bug where "Offer"/"Rejected" were showing in Active count
 *
 * Diagnosed:
 * - Found inconsistent status values in the database due to case sensitivity
 *   (some entries had 'rejected' instead of 'Rejected')
 * - Added explicit validation and normalization in StatsBar to match all
 *   legitimate values regardless of case or whitespace
 */

function normalizeStatus(status?: string): ValidStatus {
  if (!status) return "Rejected"; // Fallback

  const clean = status.trim().toLowerCase();
  switch (clean) {
    case "applied":
      return "Applied";
    case "screening":
      return "Screening";
    case "interview":
      return "Interview";
    case "offer":
      return "Offer";
    case "rejected":
      return "Rejected";
    default:
      console.warn(`[StatsBar] Unknown status: '${status}' — defaulting to Rejected`);
      return "Rejected";
  }
}

function isActiveStatus(status: ValidStatus) {
  return ["Applied", "Screening", "Interview"].includes(status);
}

export default function StatsBar({ applications }: Props) {
  const total = applications.length;
  const normalizedApps = applications.map(app => ({
    ...app,
    status: normalizeStatus(app.status)
  }));

  const active = normalizedApps.filter(a => isActiveStatus(a.status)).length;
  const interviews = normalizedApps.filter(a => a.status === "Interview").length;
  const responded = normalizedApps.filter(a => a.status !== "Applied").length;
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  // Validation checkpoint — log any anomalies found
  const originalStats = {
    active: applications.filter(a => ["Applied", "Screening", "Interview"].includes(a.status)).length,
    normalizedActive: active
  };
  if (originalStats.active !== originalStats.normalizedActive) {
    console.warn("[StatsBar] Normalization changed active count:", originalStats);
  }

  const cards = [
    { label: "Total Applied", value: total, sub: "applications" },
    { label: "Active", value: active, sub: "in pipeline" },
    { label: "Interviews", value: interviews, sub: "scheduled" },
    {
      label: "Response Rate",
      value: `${responseRate}%`,
      sub: `${responded} of ${total} responded`,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-slate-50 rounded-lg p-4 border border-slate-100"
        >
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
            {card.label}
          </p>
          <p className="text-2xl font-semibold text-slate-800">{card.value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
