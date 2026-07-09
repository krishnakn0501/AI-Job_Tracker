"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RemindersBell() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const fetchUncheckedReminders = async () => {
    try {
      const res = await fetch("/api/reminders");
      if (res.ok) {
        const data = await res.json();
        setCount(data.length || 0);
      }
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchUncheckedReminders();
    // Poll every 5 minutes
    const interval = setInterval(fetchUncheckedReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pathname]); // Refetch when pathname changes (e.g. when user navigates to Reminders page and clears some)

  return (
    <Link href="/reminders">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative h-9 w-9 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 shadow-sm transition-all duration-200"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-black">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>
    </Link>
  );
}
