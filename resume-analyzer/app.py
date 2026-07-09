"""
app.py — Streamlit frontend for the resume tailoring graph.

Usage:
  streamlit run app.py

Flow:
  1. User fills in inputs (docx upload, JD, company, role)
  2. Graph runs with live status updates per node
  3. Graph pauses at hitl_node — each section shown with Approve/Reject + feedback
  4. On submit: resume graph from checkpoint with human feedback
  5. After all sections approved: cover letter shown, download buttons appear
"""

# Expose MAX_ITERATIONS to the HITL phase (imported at top-level would be circular)
MAX_ITERATIONS = 3

import os
import sys

# Ensure the project root is in sys.path regardless of how Streamlit is launched
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import re
import time
import tempfile
import pypandoc
import streamlit as st
from dotenv import load_dotenv
from langgraph.types import Command
from nodes.convert import normalize_markdown

load_dotenv()

# Import graph lazily to avoid Streamlit re-importing on every interaction
@st.cache_resource
def get_graph():
    from graph import compile_graph
    return compile_graph()


# ── Markdown → docx conversion (review / final) ───────────────────────────────

def md_to_docx(md: str, mode: str) -> bytes:
    """Convert markdown to docx. mode='review' keeps highlights, 'final' strips them."""
    if mode == "final":
        # Strip ==highlight== markers, keep inner text
        md = re.sub(r"==(.+?)==", r"\1", md, flags=re.DOTALL)

    normalized = normalize_markdown(md)

    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
        tmp_path = tmp.name

    pypandoc.convert_text(
        normalized,
        "docx",
        format="markdown",
        outputfile=tmp_path,
        extra_args=["--standalone"],
    )

    with open(tmp_path, "rb") as f:
        data = f.read()
    os.unlink(tmp_path)
    return data


# ── Markdown renderer with ==highlight== as coloured spans ────────────────────

def render_highlighted_md(md: str) -> str:
    """Convert ==text== to HTML <mark> tags for Streamlit rendering."""
    return re.sub(r"==(.+?)==", r"<mark>\1</mark>", md, flags=re.DOTALL)


# ── Section splitter ──────────────────────────────────────────────────────────

SECTION_ALIASES = {
    "summary": ["summary", "professional summary"],
    "competencies": ["competencies", "core competencies", "skills"],
    "experience": ["experience", "work experience", "professional experience"],
    "earlier_roles": ["earlier roles", "previous roles"],
    "preserved_sections": ["certifications", "certification", "tools"],
}


def split_into_sections(md: str) -> dict[str, str]:
    """Split merged markdown into {section_key: content} for per-section HITL display."""
    parts = re.split(r"(^#{1,3}\s+.+$)", md, flags=re.MULTILINE)
    sections = {}
    current_header = None
    buffer = []

    for part in parts:
        if re.match(r"^#{1,3}\s+", part):
            if current_header is not None:
                sections[current_header] = "\n".join(buffer).strip()
            current_header = part.strip()
            buffer = [part]
        else:
            buffer.append(part)

    if current_header is not None:
        sections[current_header] = "\n".join(buffer).strip()

    return sections


def match_section_key(header: str) -> str | None:
    """Map a markdown header to a SECTION_ALIASES key."""
    header_lower = re.sub(r"^#{1,3}\s+", "", header).lower()
    for key, aliases in SECTION_ALIASES.items():
        if any(alias in header_lower for alias in aliases):
            return key
    return None


# ── Streamlit app ──────────────────────────────────────────────────────────────

st.set_page_config(page_title="Resume Tailor", layout="wide")
st.title("Resume Tailoring — LangGraph + Qwen + Gemini")

# ── Session state initialisation ──────────────────────────────────────────────
if "phase" not in st.session_state:
    st.session_state.phase = "input"          # input | running | hitl | done
if "thread_id" not in st.session_state:
    st.session_state.thread_id = str(time.time())
if "graph_state" not in st.session_state:
    st.session_state.graph_state = None
if "status_log" not in st.session_state:
    st.session_state.status_log = []


# ── Phase: input ──────────────────────────────────────────────────────────────
if st.session_state.phase == "input":
    with st.form("inputs"):
        col1, col2 = st.columns(2)
        with col1:
            uploaded = st.file_uploader("Upload base resume (.docx)", type=["docx"])
            company = st.text_input("Company name")
            role = st.text_input("Role title")
        with col2:
            jd = st.text_area("Job description", height=300)

        st.markdown("**Prompts** (optional overrides — leave blank for defaults)")
        system_prompt_override = st.text_area("System prompt override", height=80)
        user_prompt_override = st.text_area("User prompt override", height=80)

        submitted = st.form_submit_button("Tailor Resume", type="primary")

    if submitted:
        if not uploaded or not company or not role or not jd:
            st.error("Please fill in all fields and upload a resume.")
        else:
            # Save uploaded docx to a temp file
            with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
                tmp.write(uploaded.read())
                docx_path = tmp.name

            from prompts import TAILOR_SYSTEM
            st.session_state.initial_input = {
                "docx_path": docx_path,
                "job_description": jd,
                "company": company,
                "role": role,
                "system_prompt": system_prompt_override or TAILOR_SYSTEM,
                "user_prompt": user_prompt_override or "",
                "iteration_count": 0,
                "approved_sections": [],
                "rejected_sections": [],
                "section_feedback": {},
                "best_attempt_md": "",
                "final_resume_md": "",
                "cover_letter_md": "",
                "coherence_issues": [],
                "coherence_passed": False,
                "auto_fixed_md": "",
                "summary_md": "",
                "competencies_md": "",
                "experience_md": "",
                "earlier_roles_md": "",
                "preserved_sections_md": "",
                "merged_resume_md": "",
                "base_resume_md": "",
                "section_order": [],
                "static_sections_md": {},
            }
            st.session_state.phase = "running"
            st.rerun()


# ── Phase: running ────────────────────────────────────────────────────────────
if st.session_state.phase == "running":
    st.subheader("Running graph...")
    status_placeholder = st.empty()
    log_placeholder = st.empty()

    graph = get_graph()
    config = {"configurable": {"thread_id": st.session_state.thread_id}}
    log = st.session_state.status_log

    node_labels = {
        "convert_docx": "📄 Converting docx → markdown",
        "tailor_summary": "✍️ Tailoring Summary",
        "tailor_competencies": "✍️ Tailoring Competencies",
        "tailor_experience": "✍️ Tailoring Experience",
        "tailor_earlier_roles": "✍️ Tailoring Earlier Roles",
        "preserve_sections": "🔒 Preserving Certifications/Tools",
        "merge_sections": "🔗 Merging sections",
        "coherence_check": "🧠 Gemini coherence check",
        "hitl_node": "⏸️ Awaiting your review",
    }

    try:
        for event in graph.stream(
            st.session_state.initial_input,
            config=config,
            stream_mode="updates",
        ):
            for node_name, node_output in event.items():
                label = node_labels.get(node_name, f"▶️ {node_name}")
                log.append(label)
                status_placeholder.info(f"**Current:** {label}")
                log_placeholder.markdown("\n\n".join(f"- {l}" for l in log))

                if node_name == "hitl_node":
                    # Graph paused — grab state snapshot and move to HITL phase
                    snapshot = graph.get_state(config)
                    st.session_state.graph_state = snapshot.values
                    st.session_state.phase = "hitl"
                    st.rerun()

        # If we get here without hitting hitl, graph completed
        snapshot = graph.get_state(config)
        st.session_state.graph_state = snapshot.values
        st.session_state.phase = "done"
        st.rerun()

    except Exception as e:
        st.error(f"Graph error: {e}")
        st.exception(e)


# ── Phase: HITL ───────────────────────────────────────────────────────────────
if st.session_state.phase == "hitl":
    graph_state = st.session_state.graph_state
    iteration = graph_state.get("iteration_count", 0)
    merged_md = graph_state.get("merged_resume_md", "")

    st.subheader(f"Review tailored resume — Iteration {iteration + 1} / {MAX_ITERATIONS}")

    if iteration >= 3:
        st.warning("Maximum iterations reached — best attempt will be used.")

    sections = split_into_sections(merged_md)

    approved = {}    # {section_key: True/False}
    feedback_map = {}

    for header, content in sections.items():
        section_key = match_section_key(header)
        if section_key is None:
            # Static section — just show it, no approve/reject
            with st.expander(f"📌 {header} (static — not changed)", expanded=False):
                st.markdown(render_highlighted_md(content), unsafe_allow_html=True)
            continue

        with st.expander(f"📝 {header}", expanded=True):
            st.markdown(render_highlighted_md(content), unsafe_allow_html=True)

            col1, col2 = st.columns([1, 1])
            with col1:
                approve = st.button(
                    "✅ Approve",
                    key=f"approve_{section_key}",
                )
            with col2:
                reject = st.button(
                    "❌ Reject",
                    key=f"reject_{section_key}",
                )

            feedback_text = st.text_input(
                "Feedback (required if rejecting)",
                key=f"feedback_{section_key}",
                placeholder="e.g. The summary is too generic, emphasise AI/ML experience more",
            )

            # Persist button state in session
            state_key_approve = f"decision_{section_key}"
            if approve:
                st.session_state[state_key_approve] = "approved"
            if reject:
                st.session_state[state_key_approve] = "rejected"

            decision = st.session_state.get(state_key_approve, "pending")
            if decision == "approved":
                st.success("Approved")
                approved[section_key] = True
            elif decision == "rejected":
                st.error("Rejected")
                approved[section_key] = False
                feedback_map[section_key] = feedback_text
            else:
                st.info("Pending decision")
                approved[section_key] = None

    st.markdown("---")
    if st.button("Submit Review", type="primary"):
        pending = [k for k, v in approved.items() if v is None]
        if pending:
            st.error(f"Please approve or reject: {', '.join(pending)}")
        else:
            rejected_sections = [k for k, v in approved.items() if v is False]
            approved_sections = [k for k, v in approved.items() if v is True]

            # Clear per-section button state
            for key in list(st.session_state.keys()):
                if key.startswith("decision_"):
                    del st.session_state[key]

            graph = get_graph()
            config = {"configurable": {"thread_id": st.session_state.thread_id}}

            # Resume graph with human feedback
            graph.invoke(
                Command(resume={
                    "approved_sections": approved_sections,
                    "rejected_sections": rejected_sections,
                    "section_feedback": feedback_map,
                    "iteration_count": graph_state.get("iteration_count", 0) + 1,
                }),
                config=config,
            )

            # Check if graph hit another interrupt (next HITL iteration) or finished
            snapshot = graph.get_state(config)
            st.session_state.graph_state = snapshot.values

            if snapshot.next and "hitl_node" in snapshot.next:
                st.session_state.phase = "hitl"
            else:
                st.session_state.phase = "done"

            st.rerun()


# ── Phase: done ───────────────────────────────────────────────────────────────
if st.session_state.phase == "done":
    graph_state = st.session_state.graph_state
    final_md = graph_state.get("final_resume_md", "")
    cover_md = graph_state.get("cover_letter_md", "")

    st.success("✅ Resume tailoring complete!")

    tab1, tab2 = st.tabs(["📄 Resume", "✉️ Cover Letter"])

    with tab1:
        col1, col2 = st.columns([3, 1])
        with col1:
            st.subheader("Tailored Resume")
            st.markdown(render_highlighted_md(final_md), unsafe_allow_html=True)
        with col2:
            st.subheader("Download")
            review_docx = md_to_docx(final_md, "review")
            final_docx = md_to_docx(final_md, "final")
            st.download_button(
                "⬇️ Resume (review — highlights)",
                data=review_docx,
                file_name="resume_review.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
            st.download_button(
                "⬇️ Resume (final — clean)",
                data=final_docx,
                file_name="resume_final.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )

    with tab2:
        col1, col2 = st.columns([3, 1])
        with col1:
            st.subheader("Cover Letter")
            st.markdown(render_highlighted_md(cover_md), unsafe_allow_html=True)
        with col2:
            st.subheader("Download")
            cl_review = md_to_docx(cover_md, "review")
            cl_final = md_to_docx(cover_md, "final")
            st.download_button(
                "⬇️ Cover Letter (review)",
                data=cl_review,
                file_name="cover_letter_review.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
            st.download_button(
                "⬇️ Cover Letter (final)",
                data=cl_final,
                file_name="cover_letter_final.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )

    if st.button("Start over"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()

