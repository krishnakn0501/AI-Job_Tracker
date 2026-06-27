"use client";

type Props = {
  currentStatus: string;
  onChange: (status: string) => void;
};

const STATUSES = ["Applied", "Screening", "Interview", "Offer", "Rejected"];

const statusStyles: Record<string, string> = {
  Applied: "bg-[#1D4ED8] text-white",
  Screening: "bg-[#B45309] text-white",
  Interview: "bg-[#6D28D9] text-white",
  Offer: "bg-[#15803D] text-white",
  Rejected: "bg-[#64748B] text-white",
};

export default function StatusControl({ currentStatus, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden divide-x divide-slate-200">
      {STATUSES.map((status) => {
        const isActive = status === currentStatus;
        const style = isActive
          ? statusStyles[status]
          : "bg-white text-slate-500 hover:bg-slate-50";

        return (
          <button
            key={status}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset ${style}`}
            onClick={() => onChange(status)}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}