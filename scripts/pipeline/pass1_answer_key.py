"""
Pass 1 — Extract the answer-key table into a structured dict.

This is the ONLY pass allowed to know correct answers.

Supports two answer-key formats:

Format A (multi-chapter):
    Chapter Name
    1. (answer)
    2. (answer)
    Another Chapter
    1. (answer)

Format B (single-chapter):
    Q1 (answer)
    Q2 (answer)

Also supports a solutions-based fallback:
    Q1
    (answer)
    ...solution text...
    Q2
    (answer)

For small answer-key sections (<3000 chars), uses regex extraction
directly (no LLM cost). Falls back to LLM for larger/messier sections.
"""
from __future__ import annotations

import logging
import re

import os

import instructor

from .config import GEMINI_API_KEY, GEMINI_MODEL, KNOWN_CHAPTERS
from .schemas import FullAnswerKey, ChapterAnswerKey, AnswerKeyEntry

logger = logging.getLogger(__name__)


def _build_client() -> instructor.Instructor:
    """Create an instructor-wrapped Gemini client via the google-genai SDK."""
    os.environ.setdefault("GOOGLE_API_KEY", GEMINI_API_KEY)
    client = instructor.from_provider(
        f"google/{GEMINI_MODEL}",
    )
    return client


_SYSTEM_PROMPT = """\
You are a precise data-extraction assistant. You are given the Answer Keys
section of a JEE (Indian engineering entrance exam) question bank.

The answer keys may be in one of these formats:

FORMAT A (grouped by chapter):
    Chapter Name
    1. (ANSWER)
    2. (ANSWER)
    Another Chapter Name
    1. (ANSWER)

FORMAT B (flat list):
    Q1 (ANSWER)
    Q2 (ANSWER)

Extract EVERY answer exactly as printed.  Do NOT skip any.  Do NOT guess
or infer — only extract what is explicitly written.

For Format B (flat list with no chapter groupings), use "_single" as the
chapter_name.

Return the data as a JSON object matching the provided schema.
"""


# ── Regex-based extraction (preferred for clean inputs) ───────────────────────

# Format A: "N. (answer)" or "N. answer" under chapter headings
_FORMAT_A_ANSWER_RE = re.compile(r"^\s*(\d+)\.\s*(?:\(([^)]+)\)|(\d+))\s*$", re.MULTILINE)

# Format B: "QN (answer)", "Q.N (answer)", or table entries like "| Q.1 | 2 |" or "| Q.2 | Option (3) |"
_FORMAT_B_ANSWER_RE = re.compile(
    r"(?:\|\s*)?Q\.?(\d+)[\s*|:\-]*(?:Option\s*\(?)?\(?([0-9a-zA-Z.]+)\)?",
    re.IGNORECASE,
)

# Solutions fallback: "QN.\n(answer)"
_SOLUTION_ANSWER_RE = re.compile(r"Q(\d+)\.\s*\n\s*\((\d+)\)", re.MULTILINE)


def _try_regex_extraction(text: str) -> FullAnswerKey | None:
    """Try to extract the answer key purely via regex (no LLM cost).

    Returns None if the format is too messy for reliable regex parsing.
    """
    # Preprocess text to fix table split across columns like |**3**|**.**(3)
    norm_text = re.sub(r"(\d+)\*{0,2}\s*\|\s*\*{0,2}\.", r"\1.", text)
    clean_text = norm_text.replace("<br>", "\n").replace("|", "\n").replace("*", "")

    # Detect format
    b_matches = list(_FORMAT_B_ANSWER_RE.finditer(text))
    has_format_a = bool(_FORMAT_A_ANSWER_RE.search(clean_text))

    if b_matches and not has_format_a:
        # Format B: flat Q1 (answer) list or table
        answers: list[AnswerKeyEntry] = []
        seen: set[int] = set()
        for match in b_matches:
            q_num = int(match.group(1))
            if q_num not in seen:
                seen.add(q_num)
                answers.append(AnswerKeyEntry(
                    question_number=q_num,
                    answer=match.group(2).strip(),
                ))
        answers.sort(key=lambda a: a.question_number)
        if answers:
            return FullAnswerKey(chapters=[
                ChapterAnswerKey(chapter_name="_single", answers=answers)
            ])
        return None

    if has_format_a:
        # Format A: chapter-grouped "N. (answer)"
        lines = clean_text.strip().split("\n")
        chapters: list[ChapterAnswerKey] = []
        current_chapter: str | None = None
        current_answers: list[AnswerKeyEntry] = []
        known_set = {ch.lower(): ch for ch in KNOWN_CHAPTERS}

        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                continue

            # Check if this line is an answer entry
            answer_match = _FORMAT_A_ANSWER_RE.match(line_stripped)
            if answer_match:
                ans_val = answer_match.group(2) or answer_match.group(3)
                current_answers.append(AnswerKeyEntry(
                    question_number=int(answer_match.group(1)),
                    answer=ans_val.strip(),
                ))
                continue

            norm_ch = line_stripped.lower()
            is_known = norm_ch in known_set
            is_format_b_answer = bool(re.match(r"^Q\d+\s*\(", line_stripped))
            is_generic_ch = (
                not line_stripped[0].isdigit()
                and len(line_stripped) > 2
                and not is_format_b_answer
                and not line_stripped.startswith("(")
                and not line_stripped.startswith("#")
                and "chapter" not in norm_ch
                and "mathongo" not in norm_ch
                and "jee main" not in norm_ch
                and "answer key" not in norm_ch
            )

            if is_known or is_generic_ch:
                # Save previous chapter
                if current_chapter and current_answers:
                    chapters.append(ChapterAnswerKey(
                        chapter_name=current_chapter,
                        answers=current_answers,
                    ))
                current_chapter = known_set.get(norm_ch, line_stripped)
                current_answers = []

        # Save final chapter
        if current_chapter and current_answers:
            chapters.append(ChapterAnswerKey(
                chapter_name=current_chapter,
                answers=current_answers,
            ))

        if chapters:
            return FullAnswerKey(chapters=chapters)

    return None


def extract_answer_key(
    answer_keys_text: str,
    force_llm: bool = False,
) -> FullAnswerKey:
    """Run Pass 1: extract the answer key from raw text.

    Tries regex extraction first (free). Falls back to LLM if regex
    fails or if force_llm=True.

    Parameters
    ----------
    answer_keys_text : str
        The raw text of the Answer Keys section.
    force_llm : bool
        If True, skip regex and use LLM directly.

    Returns
    -------
    FullAnswerKey
        Structured answer key with chapter groupings.
    """
    if not answer_keys_text.strip():
        logger.warning("Answer keys text is empty — returning empty FullAnswerKey.")
        return FullAnswerKey()

    # Try regex first (no API cost)
    if not force_llm:
        regex_result = _try_regex_extraction(answer_keys_text)
        if regex_result:
            total = sum(len(ch.answers) for ch in regex_result.chapters)
            logger.info(
                "Pass 1 (regex): Extracted %d answers across %d chapters — no LLM needed.",
                total,
                len(regex_result.chapters),
            )
            return regex_result
        logger.info("Pass 1: Regex extraction insufficient — falling back to LLM.")

    # LLM fallback
    client = _build_client()

    logger.info(
        "Pass 1 (LLM): Extracting answer key (%d chars) via %s",
        len(answer_keys_text),
        GEMINI_MODEL,
    )

    result: FullAnswerKey = client.create(
        response_model=FullAnswerKey,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Here is the Answer Keys section. Extract all answers:\n\n"
                    + answer_keys_text
                ),
            },
        ],
        max_retries=3,
    )

    total = sum(len(ch.answers) for ch in result.chapters)
    logger.info(
        "Pass 1 (LLM) complete: %d chapters, %d total answers.",
        len(result.chapters),
        total,
    )

    return result


def extract_answers_from_solutions(
    solutions_text: str,
) -> dict[int, str]:
    """Fallback: extract answers from solutions section.

    Solutions format (both Format A and B):
        Q1.
        (answer)
        ...solution text...
        Q2.
        (answer)

    Or sometimes at the end: Ans = '3'

    Returns {question_number: answer_string}
    """
    answers: dict[int, str] = {}

    # Pattern 1: "Q<number>.\n(answer)"
    for match in _SOLUTION_ANSWER_RE.finditer(solutions_text):
        q_num = int(match.group(1))
        answer = match.group(2)
        answers[q_num] = answer

    # Pattern 2: "Ans = 'N'" or "Ans = N"
    ans_pattern = re.compile(
        r"Ans\s*=\s*['\"]?(\d+)['\"]?",
        re.IGNORECASE,
    )
    # Find which question each Ans belongs to by looking for preceding Q markers
    q_markers = list(re.finditer(r"Q(\d+)", solutions_text))
    for ans_match in ans_pattern.finditer(solutions_text):
        # Find the most recent Q marker before this Ans
        best_q = None
        for qm in q_markers:
            if qm.start() < ans_match.start():
                best_q = int(qm.group(1))
            else:
                break
        if best_q and best_q not in answers:
            answers[best_q] = ans_match.group(1)

    return answers


def answer_key_to_dict(
    full_key: FullAnswerKey,
) -> dict[str, dict[int, str]]:
    """Convert the Pydantic model into a plain lookup dict.

    Returns
    -------
    dict[str, dict[int, str]]
        {chapter_name: {question_number: answer_string}}
    """
    out: dict[str, dict[int, str]] = {}
    for chapter in full_key.chapters:
        chapter_dict: dict[int, str] = {}
        for entry in chapter.answers:
            chapter_dict[entry.question_number] = entry.answer
        out[chapter.chapter_name] = chapter_dict
    return out
