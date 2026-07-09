"""
convert.py — docx → md using mammoth, section order extraction, static section parsing.
"""

import re
import mammoth
from state import ResumeState

# Sections that must be pulled directly from base_resume_md — Qwen never touches these
STATIC_SECTION_NAMES = {"education", "contact", "address", "references"}

# Sections handled by the preserve node (reorder only)
PRESERVE_SECTION_NAMES = {"certifications", "certification", "tools", "skills"}


def normalize_markdown(md: str) -> str:
    """
    Insert a blank line before any list that immediately follows a non-blank,
    non-list line. Idempotent — safe to run multiple times.
    """
    lines = md.split("\n")
    result = []
    list_marker = re.compile(r"^\s*([-*+]|\d+\.)\s+")
    for i, line in enumerate(lines):
        if i > 0:
            prev = lines[i - 1]
            if (
                list_marker.match(line)
                and prev.strip() != ""
                and not list_marker.match(prev)
            ):
                result.append("")
        result.append(line)
    return "\n".join(result)


def extract_sections(md: str) -> tuple[list[str], dict[str, str]]:
    """
    Parse the markdown into ordered sections.
    Returns:
      section_order  — list of section header strings in original order
      sections_map   — {header_text_lower: markdown_block_for_that_section}
    """
    # Match ATX-style headers (# / ## / ###) and Setext-style (=== / ---)
    header_pattern = re.compile(
        r"^(#{1,6}\s+.+|.+\n[=\-]{2,})$", re.MULTILINE
    )

    # Split on headers, keeping the delimiter
    parts = re.split(r"(^#{1,6}\s+.+$)", md, flags=re.MULTILINE)

    section_order = []
    sections_map = {}
    current_header = None
    buffer = []

    for part in parts:
        if re.match(r"^#{1,6}\s+", part):
            if current_header is not None:
                sections_map[current_header.lower()] = "\n".join(buffer).strip()
            # Normalise: strip leading # and whitespace for the key
            current_header = re.sub(r"^#{1,6}\s+", "", part).strip()
            section_order.append(current_header)
            buffer = [part]
        else:
            buffer.append(part)

    # Last section
    if current_header is not None:
        sections_map[current_header.lower()] = "\n".join(buffer).strip()

    return section_order, sections_map


def pull_static_sections(sections_map: dict[str, str]) -> dict[str, str]:
    """
    Return only the sections that are fully static (never touched by Qwen).
    Key is the original header text, value is the full markdown block.
    """
    static = {}
    for header, content in sections_map.items():
        for static_name in STATIC_SECTION_NAMES:
            if static_name in header:
                static[header] = content
                break
    return static


def convert_node(state: ResumeState) -> dict:
    """
    LangGraph node: convert .docx → .md, extract section order and static sections.
    """
    docx_path = state["docx_path"]

    # docx → html → md via mammoth
    with open(docx_path, "rb") as f:
        result = mammoth.convert_to_markdown(f)

    raw_md = result.value
    normalized = normalize_markdown(raw_md)

    section_order, sections_map = extract_sections(normalized)
    static_sections = pull_static_sections(sections_map)

    return {
        "base_resume_md": normalized,
        "section_order": section_order,
        "static_sections_md": static_sections,
    }
