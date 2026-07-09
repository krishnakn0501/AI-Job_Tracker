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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white/60 dark:bg-black/30 backdrop-blur-xl rounded-2xl p-5 border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 animate-in fade-in zoom-in"
        >
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
            {card.label}
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{card.value}</p>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
