"""
merge.py — assembles all branch outputs into one markdown document.

Order is determined by section_order extracted at parse time from the original resume.
Static sections (Education, Contact, etc.) are pulled directly from base_resume_md —
Qwen never touches them.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import re
from nodes.convert import normalize_markdown, STATIC_SECTION_NAMES, PRESERVE_SECTION_NAMES
from state import ResumeState

# Maps section header keywords to the state key that holds that section's tailored output
SECTION_KEY_MAP = {
    "summary": "summary_md",
    "professional summary": "summary_md",
    "core competencies": "competencies_md",
    "competencies": "competencies_md",
    "skills": "competencies_md",
    "experience": "experience_md",
    "work experience": "experience_md",
    "professional experience": "experience_md",
    "earlier roles": "earlier_roles_md",
    "previous roles": "earlier_roles_md",
    "certifications": "preserved_sections_md",
    "certification": "preserved_sections_md",
    "tools": "preserved_sections_md",
}


def _resolve_section(header: str, state: ResumeState) -> str:
    """
    For a given section header, return the correct markdown content:
    - Static sections → pulled directly from base_resume_md (no LLM)
    - Tailored sections → from the relevant state key
    - Unknown sections → pulled directly from base_resume_md as fallback
    """
    header_lower = header.lower()

    # Static sections — never touched by any LLM
    for static_name in STATIC_SECTION_NAMES:
        if static_name in header_lower:
            return state.get("static_sections_md", {}).get(header_lower, "")

    # Tailored sections — find which state key to use
    for keyword, state_key in SECTION_KEY_MAP.items():
        if keyword in header_lower:
            content = state.get(state_key, "")
            if content:
                return content

    # Fallback — return as-is from base resume
    return state.get("static_sections_md", {}).get(header_lower, "")


def merge_node(state: ResumeState) -> dict:
    """
    LangGraph node: merge all parallel branch outputs in the original section order.
    """
    section_order = state.get("section_order", [])

    merged_parts = []
    for header in section_order:
        content = _resolve_section(header, state)
        if content:
            merged_parts.append(content)

    merged = "\n\n".join(merged_parts)
    # Always normalize before coherence check
    merged = normalize_markdown(merged)

    return {"merged_resume_md": merged}