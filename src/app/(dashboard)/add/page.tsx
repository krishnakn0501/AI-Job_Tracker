import AddJobForm from "@/components/features/application/AddJobForm";

export const metadata = { title: "JobTrack — Add job" };

export default function AddJobPage() {
  return (
    <div className="max-w-2xl mx-auto mt-4">
        <p className="text-sm text-slate-400 mb-8">
          Fill in the details — Claude will tailor your resume automatically.
        </p>
        <AddJobForm />
      </div>
  );
}
