"use client";

type Props = { status: string };

const statusStyles: Record<string, string> = {
  Applied: "bg-[#EFF6FF] text-[#1D4ED8]",
  Screening: "bg-[#FFFBEB] text-[#B45309]",
  Interview: "bg-[#FAF5FF] text-[#6D28D9]",
  Offer: "bg-[#F0FDF4] text-[#15803D]",
  Rejected: "bg-[#F8FAFC] text-[#64748B]",
};

export default function StatusBadge({ status }: Props) {
  const style = statusStyles[status] ?? "bg-slate-100 text-slate-600";

  return (
    <span
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${style}`}
    >
      {status}
    </span>
  );
}
