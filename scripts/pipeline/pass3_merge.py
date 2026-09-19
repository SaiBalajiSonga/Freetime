"""
Pass 3 — Deterministic merge of Pass 1 (answer key) onto Pass 2 (questions).

Pure Python.  No LLM calls.  No guessing.

The merge uses question_type from Pass 2 to decide how to interpret
each answer-key value:
  • question_type == "mcq"       →  answer "2" means option 2 is correct
  • question_type == "numerical" →  answer "117" is the literal numerical value

This avoids the magnitude-heuristic bug (where a numerical answer of "3"
would be misinterpreted as "option 3").

Missing keys get merge_status = "KEY_NOT_FOUND", never guessed.
"""
from __future__ import annotations

import logging
import re
from difflib import SequenceMatcher

from .config import normalize_chapter_name
from .schemas import ExtractedQuestion, MergedOption, MergedQuestion

logger = logging.getLogger(__name__)


def _fuzzy_match_chapter(
    pass2_name: str,
    answer_key_names: list[str],
    threshold: float = 0.75,
) -> str | None:
    """Find the best fuzzy match for a chapter name in the answer key.

    Returns the matched name or None if no match exceeds the threshold.
    """
    best_score = 0.0
    best_match: str | None = None

    normalized = normalize_chapter_name(pass2_name).lower().strip()

    for ak_name in answer_key_names:
        ak_normalized = normalize_chapter_name(ak_name).lower().strip()

        # Exact match (after normalization)
        if normalized == ak_normalized:
            return ak_name

        score = SequenceMatcher(None, normalized, ak_normalized).ratio()
        if score > best_score:
            best_score = score
            best_match = ak_name

    if best_match and best_score >= threshold:
        logger.info(
            "Fuzzy-matched chapter '%s' → '%s' (score=%.2f)",
            pass2_name,
            best_match,
            best_score,
        )
        return best_match

    return None


def _extract_answers_from_solutions(
    solutions_text: str,
) -> dict[int, str]:
    """Fallback: extract answers from solutions section.

    Solutions format (from the PDF):
        Q1.
        (answer)
        ...solution text...
        Q2.
        (answer)

    Returns {question_number: answer_string}
    """
    answers: dict[int, str] = {}
    # Match: Q<number>.\n(<answer>)
    pattern = re.compile(
        r"Q(\d+)\.\s*\n\s*\((\d+)\)",
        re.MULTILINE,
    )
    for match in pattern.finditer(solutions_text):
        q_num = int(match.group(1))
        answer = match.group(2)
        answers[q_num] = answer
    return answers


def merge(
    questions_by_chapter: dict[str, list[ExtractedQuestion]],
    answer_key_dict: dict[str, dict[int, str]],
    source: str | None = None,
    solutions_text_by_chapter: dict[str, str] | None = None,
) -> list[MergedQuestion]:
    """Merge Pass 1 answers onto Pass 2 questions.

    Parameters
    ----------
    questions_by_chapter : dict[str, list[ExtractedQuestion]]
        From Pass 2.
    answer_key_dict : dict[str, dict[int, str]]
        From Pass 1: {chapter_name: {question_number: answer_string}}.
    source : str, optional
        Source tag for all questions (e.g., "JEE Main 2025 January").
    solutions_text_by_chapter : dict[str, str], optional
        Raw solutions text per chapter — used as fallback answer source.

    Returns
    -------
    list[MergedQuestion]
        Fully merged questions ready for Supabase ingestion.
    """
    merged: list[MergedQuestion] = []
    ak_chapter_names = list(answer_key_dict.keys())

    stats = {"ok": 0, "key_not_found": 0, "fallback_used": 0}

    for chapter_name, questions in questions_by_chapter.items():
        # Find matching chapter in answer key (with fuzzy matching)
        matched_ak_name = _fuzzy_match_chapter(chapter_name, ak_chapter_names)

        if matched_ak_name:
            chapter_answers = answer_key_dict[matched_ak_name]
        elif "_single" in answer_key_dict and len(questions_by_chapter) == 1:
            # Single-chapter document: match _single directly
            chapter_answers = answer_key_dict["_single"]
        elif len(answer_key_dict) == 1 and len(questions_by_chapter) == 1:
            # Only one chapter in both sides: direct match
            chapter_answers = list(answer_key_dict.values())[0]
        else:
            logger.warning(
                "Pass 3: No answer-key match for chapter '%s'. "
                "All questions will be KEY_NOT_FOUND.",
                chapter_name,
            )
            chapter_answers = {}

        # Build fallback answers from solutions section if available
        fallback_answers: dict[int, str] = {}
        if solutions_text_by_chapter and chapter_name in solutions_text_by_chapter:
            fallback_answers = _extract_answers_from_solutions(
                solutions_text_by_chapter[chapter_name]
            )

        for q in questions:
            answer_str = chapter_answers.get(q.question_number)
            used_fallback = False

            # Try fallback from solutions if primary answer key missing
            if answer_str is None and q.question_number in fallback_answers:
                answer_str = fallback_answers[q.question_number]
                used_fallback = True
                stats["fallback_used"] += 1
                logger.info(
                    "Pass 3: Using fallback answer from solutions for "
                    "%s Q%d: %s",
                    chapter_name,
                    q.question_number,
                    answer_str,
                )

            merge_status: str = "ok" if answer_str is not None else "KEY_NOT_FOUND"

            if merge_status == "KEY_NOT_FOUND":
                stats["key_not_found"] += 1
                logger.warning(
                    "Pass 3: KEY_NOT_FOUND for %s Q%d",
                    chapter_name,
                    q.question_number,
                )
            else:
                stats["ok"] += 1

            # ── Interpret the answer using question_type (NOT magnitude) ──
            merged_options: list[MergedOption] | None = None
            correct_answer: str | None = None

            if q.question_type == "mcq" and q.options:
                # answer_str is an option index like "1", "2", "3", "4"
                try:
                    correct_idx = int(answer_str) if answer_str else None
                except (ValueError, TypeError):
                    correct_idx = None
                    logger.warning(
                        "Pass 3: Cannot parse MCQ answer '%s' for %s Q%d",
                        answer_str,
                        chapter_name,
                        q.question_number,
                    )

                merged_options = []
                for opt in q.options:
                    is_correct = (
                        opt.option_number == correct_idx
                        if correct_idx is not None
                        else False
                    )
                    merged_options.append(
                        MergedOption(text=opt.text, is_correct=is_correct)
                    )

            elif q.question_type == "numerical":
                # answer_str IS the numerical answer (e.g., "117", "3", "474")
                correct_answer = answer_str

            merged.append(
                MergedQuestion(
                    chapter_name=normalize_chapter_name(chapter_name),
                    question_number=q.question_number,
                    question_text=q.question_text,
                    question_type=q.question_type,
                    options=merged_options,
                    correct_answer=correct_answer,
                    ai_difficulty=q.ai_difficulty,
                    source=source,
                    merge_status=merge_status,
                )
            )

    logger.info(
        "Pass 3 complete: %d merged (%d ok, %d KEY_NOT_FOUND, %d fallback).",
        len(merged),
        stats["ok"],
        stats["key_not_found"],
        stats["fallback_used"],
    )

    return merged
