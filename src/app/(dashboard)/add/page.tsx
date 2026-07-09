import AddJobForm from "@/components/features/application/AddJobForm";
import { Sparkles, FileText } from "lucide-react";

export const metadata = { title: "JobTrack — Add job" };

export default function AddJobPage() {
  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-8 mb-8 shadow-sm group transform-gpu">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-700"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              AI Tailoring
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Add a new application
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl text-sm md:text-base font-medium">
              Provide the job details below. Claude will automatically analyze the job description and instantly generate a perfectly tailored version of your base resume.
            </p>
          </div>
          
          <div className="hidden md:flex h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/20 transform rotate-3 hover:rotate-6 transition-transform duration-300 flex-shrink-0">
            <FileText className="h-10 w-10 text-white" />
          </div>
        </div>
      </div>

      {/* Main Form */}
      <AddJobForm />
    </div>
  );
}
