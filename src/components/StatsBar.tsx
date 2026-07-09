import type { Application } from "@prisma/client";
import { Briefcase, Activity, CalendarClock, Target } from "lucide-react";

type Props = { applications: Application[] };
type ValidStatus = "Applied" | "Screening" | "Interview" | "Offer" | "Rejected";

function normalizeStatus(status?: string): ValidStatus {
  if (!status) return "Rejected";
  const clean = status.trim().toLowerCase();
  switch (clean) {
    case "applied": return "Applied";
    case "screening": return "Screening";
    case "interview": return "Interview";
    case "offer": return "Offer";
    case "rejected": return "Rejected";
    default: return "Rejected";
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

  const cards = [
    { 
      label: "Total Applied", 
      value: total, 
      sub: "applications",
      icon: Briefcase,
      color: "from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    { 
      label: "Active", 
      value: active, 
      sub: "in pipeline",
      icon: Activity,
      color: "from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    },
    { 
      label: "Interviews", 
      value: interviews, 
      sub: "scheduled",
      icon: CalendarClock,
      color: "from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      label: "Response Rate",
      value: `${responseRate}%`,
      sub: `${responded} of ${total} responded`,
      icon: Target,
      color: "from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`relative overflow-hidden bg-white/60 dark:bg-black/30 backdrop-blur-xl rounded-2xl p-5 border border-white/40 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-300 group transform-gpu`}
          >
            {/* Subtle background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
            
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{card.value}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{card.sub}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl bg-white/50 dark:bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/50 dark:border-white/5 shadow-sm group-hover:scale-110 transition-transform duration-300 ${card.iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
