"""
Local Split — deterministically separate the Marker-produced markdown
into Questions, Answer Keys, and Solutions sections, then further split
by chapter within each section.

Supports two MathonGo PDF formats:

Format A (multi-chapter, e.g. "Mathematics - JEE Main 2025 January Chapter-wise"):
  - TOC on pages 1-3
  - Questions grouped by chapter headers (chapter restarts Q numbering)
  - "Answer Keys" section with answers grouped by chapter
  - "Solutions" section

Format B (single-chapter, e.g. "Application of Derivatives - JEE Main 2024 January"):
  - No TOC, questions start on page 1
  - Question labels include exam date: "Q1 - 2024 (01 Feb Shift 1)"
  - "Answer Key" (singular) section: "Q1 (2), Q2 (3), ..."
  - "Solutions" section
  - Chapter name is derived from the PDF filename / CLI arg

No LLM cost.  Pure regex.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from .config import KNOWN_CHAPTERS, WATERMARK_PATTERNS


# ── Compiled patterns ─────────────────────────────────────────────────────────

_WATERMARK_RE = re.compile(
    "|".join(f"^\\s*(?:{p})\\s*$" for p in WATERMARK_PATTERNS + [
        # Format B watermarks
        r"Questions with Answer Keys",
        r"Do you want to practice these PYQs.*",
        r"Click here to download MARKS App",
    ]),
    re.IGNORECASE | re.MULTILINE,
)

# Section boundary markers — support "Answer Key(s)", "Official Answer Key", "Final Answer Key", etc.
_ANSWER_KEYS_RE = re.compile(
    r"^(?:[#|*\s]*?)(?:(?:Official|Final|Verified)\s+)?Answer\s+Keys?.*$",
    re.IGNORECASE | re.MULTILINE,
)
_SOLUTIONS_RE = re.compile(
    r"^(?:[#|*\s]*?)Solutions?(?:\s+Q\d+)?(?:[|*\s]*?)$",
    re.IGNORECASE | re.MULTILINE,
)

# Build a single regex that matches any known chapter name as a heading.
_chapter_pattern = "|".join(re.escape(ch) for ch in KNOWN_CHAPTERS)
_CHAPTER_HEADING_RE = re.compile(
    rf"^(?:[#|*\s]*?)(?:\d+\.\s*)?({_chapter_pattern})(?:[|*\s]*?)$",
    re.IGNORECASE | re.MULTILINE,
)

# Content / TOC section (multi-chapter PDFs have a TOC starting with "Content")
_CONTENT_RE = re.compile(
    r"^(?:#+\s*)?Content\s*$",
    re.IGNORECASE | re.MULTILINE,
)


@dataclass
class SplitResult:
    """Holds the three major sections of a MathonGo-style document."""

    # Format A: {chapter_name: text}, Format B: {"_single": text}
    questions_by_chapter: dict[str, str] = field(default_factory=dict)
    answer_keys_text: str = ""
    solutions_by_chapter: dict[str, str] = field(default_factory=dict)

    # Detected format
    format_type: str = "unknown"  # "multi_chapter" or "single_chapter"


def _strip_watermarks(text: str) -> str:
    """Remove all watermark / header / footer lines."""
    cleaned = _WATERMARK_RE.sub("", text)
    # Collapse runs of 3+ blank lines into 2
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def _strip_page_numbers(text: str) -> str:
    """Remove standalone page number lines."""
    return re.sub(r"^\s*\d{1,3}\s*$", "", text, flags=re.MULTILINE)


def _split_by_chapters(text: str) -> dict[str, str]:
    """Split a section's text into {chapter_name: content} by chapter headings."""
    chapters: dict[str, str] = {}
    matches = list(_CHAPTER_HEADING_RE.finditer(text))

    if not matches:
        return {"_unknown": text.strip()}

    # Capture any text before the first chapter heading
    preamble = text[: matches[0].start()].strip()
    if preamble:
        chapters["_preamble"] = preamble

    for i, match in enumerate(matches):
        chapter_name = match.group(1).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        content = text[start:end].strip()
        if content:
            if chapter_name in chapters:
                chapters[chapter_name] += "\n\n" + content
            else:
                chapters[chapter_name] = content

    return chapters


def _detect_format(text: str) -> str:
    """Detect whether the document is Format A (multi-chapter) or Format B (single-chapter).

    Heuristic: if we find 2+ distinct chapter headings from KNOWN_CHAPTERS
    in the text, it's Format A. Otherwise Format B.
    """
    found_chapters = set()
    for match in _CHAPTER_HEADING_RE.finditer(text):
        found_chapters.add(match.group(1).strip())
        if len(found_chapters) >= 2:
            return "multi_chapter"
    return "single_chapter"


def _find_questions_start_multi(text: str) -> int:
    """For Format A: find where the actual questions begin (after TOC).

    The TOC pages list chapter names with page numbers. The first actual
    question starts with Q1 after the TOC.
    """
    first_q = re.search(r"(?:^|\n)\s*(?:[-*#|]\s*)*(?:\*\*)?Q1\b", text, re.IGNORECASE)
    if first_q:
        q_pos = first_q.start()
        window_start = max(0, q_pos - 1000)
        window = text[window_start:q_pos]
        ch_matches = list(_CHAPTER_HEADING_RE.finditer(window))
        if ch_matches:
            return window_start + ch_matches[-1].start()
        return q_pos

    # Fallback: after the Content/TOC section
    content_match = _CONTENT_RE.search(text)
    if content_match:
        sol_toc = _SOLUTIONS_RE.search(text, content_match.end())
        if sol_toc:
            next_q = re.search(r"(?:^|\n)\s*(?:[-*#|]\s*)*(?:\*\*)?Q1\b", text[sol_toc.end():], re.IGNORECASE)
            if next_q:
                return sol_toc.end() + next_q.start()

    return 0  # fallback: start from beginning


def _find_last_answer_key(text: str, after_pos: int = 0) -> re.Match | None:
    """Find the occurrence of 'Answer Key(s)' that's actually the section header.

    In multi-chapter PDFs, 'Answer Keys' appears in the TOC AND as the actual
    section header. We want the one that's followed by actual answer data
    (lines like '1. (2)' or 'Q1 (2)' or tables with '**1.**(4)').
    """
    matches = [m for m in _ANSWER_KEYS_RE.finditer(text) if m.start() >= after_pos]
    if not matches:
        return None

    # Return the first match that is followed by actual answer-like content
    for match in matches:
        after = text[match.end() : match.end() + 1000]
        if re.search(r"(?:\*\*)?\d+\.?(?:\*\*)?\s*\(|\bQ\.?\d+[\s*]*\(|\|\s*Q\.?\d+", after, re.IGNORECASE):
            return match

    # Fallback: return the last match
    return matches[-1]


def split_document(markdown_text: str, chapter_override: str | None = None) -> SplitResult:
    """Split a MathonGo-style markdown document into its three sections.

    Parameters
    ----------
    markdown_text : str
        The full text of the Marker-produced markdown file.
    chapter_override : str, optional
        For Format B (single-chapter) PDFs, use this as the chapter name.
        If not provided and format is single-chapter, uses "_single".

    Returns
    -------
    SplitResult
        With questions_by_chapter, answer_keys_text, and format_type.
    """
    result = SplitResult()

    # 1. Strip watermarks and page numbers
    cleaned = _strip_watermarks(markdown_text)
    cleaned = _strip_page_numbers(cleaned)

    # 2. Detect format
    result.format_type = _detect_format(cleaned)

    # 3. Find section boundaries
    if result.format_type == "multi_chapter":
        q_start = _find_questions_start_multi(cleaned)
        ak_match = _find_last_answer_key(cleaned, after_pos=q_start)
    else:
        q_start = 0
        ak_match = _find_last_answer_key(cleaned)

    if not ak_match:
        # Fallback for documents without an explicit Answer Key section
        # Treat entire document as questions, with empty answer keys
        result.answer_keys_text = ""
        result.solutions_text = ""
        if result.format_type == "multi_chapter":
            q_text = cleaned[q_start:]
            result.questions_by_chapter = _split_by_chapters(q_text)
        else:
            chapter_name = chapter_override or "_single"
            result.questions_by_chapter = {chapter_name: cleaned.strip()}
        return result

    sol_match = _SOLUTIONS_RE.search(cleaned, ak_match.end())
    if not sol_match and result.format_type == "multi_chapter":
        # In Format A, solutions section starts when questions (Q1) start again after answer keys
        q1_after_ak = re.search(
            r"(?:^|\n)\s*(?:[-*#|]\s*)*(?:\*\*)?Q1\b",
            cleaned[ak_match.end():],
            re.IGNORECASE,
        )
        if q1_after_ak:
            sol_start = ak_match.end() + q1_after_ak.start()
        else:
            sol_start = len(cleaned)
    elif sol_match and sol_match.start() > ak_match.start():
        sol_start = sol_match.start()
    else:
        sol_start = len(cleaned)

    # 4. Extract raw sections based on format
    if result.format_type == "multi_chapter":
        # Format A: skip TOC, extract questions until Answer Keys
        questions_raw = cleaned[q_start : ak_match.start()]
    else:
        # Format B: everything before Answer Key is questions
        questions_raw = cleaned[: ak_match.start()]

    answer_keys_raw = cleaned[ak_match.end() : sol_start]

    # 5. Split questions by chapter (or use override for single-chapter)
    if result.format_type == "multi_chapter":
        result.questions_by_chapter = _split_by_chapters(questions_raw)
        # Remove preamble/unknown entries
        result.questions_by_chapter.pop("_preamble", None)
        result.questions_by_chapter.pop("_unknown", None)
    else:
        chapter_name = chapter_override or "_single"
        result.questions_by_chapter = {chapter_name: questions_raw.strip()}

    result.answer_keys_text = answer_keys_raw.strip()

    return result


def get_chapter_names(split: SplitResult) -> list[str]:
    """Return the ordered list of chapter names found in the questions section."""
    return list(split.questions_by_chapter.keys())
