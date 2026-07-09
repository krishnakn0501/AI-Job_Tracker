import { SearchableGlossary } from "@/components/SearchableGlossary";
import { GLOSSARY_TERMS } from "@/lib/glossary-terms";

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Help & Glossary</h1>
        <p className="text-sm text-slate-400 mb-8">
          Definitions for every term used in JobTrack.
        </p>
        <SearchableGlossary terms={GLOSSARY_TERMS} />
      </div>
    </main>
  );
}
