import { SearchableGlossary } from "@/components/SearchableGlossary";
import { GLOSSARY_TERMS } from "@/lib/glossary-terms";

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto mt-4 px-4">
      <p className="text-sm text-slate-400 mb-8">
        Definitions for every term used in JobTrack.
      </p>
      <SearchableGlossary terms={GLOSSARY_TERMS} />
    </div>
  );
}
