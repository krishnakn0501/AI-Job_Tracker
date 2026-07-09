from typing import TypedDict, Optional


class CoherenceIssue(TypedDict):
    section: str          # which section has the issue
    type: str             # "syntax" | "quality"
    severity: str         # "low" | "high"
    suggestion: str       # Gemini's fix suggestion


class ResumeState(TypedDict):
    # ── Inputs ────────────────────────────────────────────────────────────────
    docx_path: str
    job_description: str
    company: str
    role: str
    system_prompt: str
    user_prompt: str

    # ── After docx → md conversion ────────────────────────────────────────────
    base_resume_md: str
    section_order: list[str]          # extracted section header sequence
    static_sections_md: dict[str, str]  # {section_name: raw_md} pulled directly from base

    # ── Parallel Qwen branch outputs ──────────────────────────────────────────
    summary_md: str
    competencies_md: str
    experience_md: str
    earlier_roles_md: str
    preserved_sections_md: str        # Certifications/Tools reordered only

    # ── After merge ───────────────────────────────────────────────────────────
    merged_resume_md: str

    # ── Coherence check ───────────────────────────────────────────────────────
    coherence_issues: list[CoherenceIssue]
    coherence_passed: bool
    auto_fixed_md: str                # Gemini's auto-fixed version (low severity fixes)

    # ── HITL ──────────────────────────────────────────────────────────────────
    approved_sections: list[str]
    rejected_sections: list[str]
    section_feedback: dict[str, str]  # {section_name: human feedback text}
    iteration_count: int              # starts at 0, max 3
    best_attempt_md: str              # updated every time coherence passes

    # ── Final outputs ─────────────────────────────────────────────────────────
    final_resume_md: str
    cover_letter_md: str
