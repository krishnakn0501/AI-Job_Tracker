import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AddJobForm from "@/components/AddJobForm";

export const metadata = { title: "JobTrack — Add job" };

export default function AddJobPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">Add new job</h1>
        <p className="text-sm text-slate-400 mb-8">
          Fill in the details — Claude will tailor your resume automatically.
        </p>
        <AddJobForm />
      </div>
    </main>
  );
}
