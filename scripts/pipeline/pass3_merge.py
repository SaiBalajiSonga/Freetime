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


def _extract_solutions_and_answers(
    solutions_text: str,
) -> tuple[dict[int, str], dict[int, str]]:
    """Extract answers and step-by-step explanations from the solutions section.

    Handles formats:
        Q1.
        (4)
        Consider 1/sqrt(x) = alpha...
        Q2.
        (3)
        ...
    Or:
        Q1 - 2024 ...
        ...
        Ans = '3'
    Or:
        **Q1.**
        ...

    Returns
    -------
    tuple[dict[int, str], dict[int, str]]
        (answers_dict, solutions_dict)
    """
    answers: dict[int, str] = {}
    solutions: dict[int, str] = {}

    pattern = re.compile(
        r"(?:^|\n)\s*(?:[-*#|]\s*)*(?:\*\*)?Q\.?\s*(\d+)(?:\.|\s*[-–—]|\s*\n)",
        re.IGNORECASE,
    )
    matches = list(pattern.finditer(solutions_text))
    if not matches:
        return answers, solutions

    for i, match in enumerate(matches):
        q_num = int(match.group(1))
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(solutions_text)
        block = solutions_text[start:end].strip()

        # Check if the block starts with (answer) e.g. (4) or (117)
        ans_match = re.match(r"^\s*\((\d+)\)\s*(?:\n|$)", block)
        if ans_match:
            answers[q_num] = ans_match.group(1)
            solution_body = block[ans_match.end():].strip()
        else:
            # Check for Ans = 'X' or Answer: (X)
            ans_end_match = re.search(
                r"(?:Ans|Answer)\s*[:=]\s*['\"(]?\s*(\d+)\s*['\")]?",
                block,
                re.IGNORECASE,
            )
            if ans_end_match:
                answers[q_num] = ans_end_match.group(1)
            solution_body = block

        # Clean trailing watermarks or empty markers from solution_body
        solution_body = re.sub(r"Click here to download MARKS App.*", "", solution_body, flags=re.IGNORECASE).strip()
        if solution_body:
            solutions[q_num] = solution_body

    return answers, solutions


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

        # Build fallback answers and solutions from solutions section if available
        fallback_answers: dict[int, str] = {}
        chapter_solutions: dict[int, str] = {}
        if solutions_text_by_chapter:
            sol_text = ""
            if chapter_name in solutions_text_by_chapter:
                sol_text = solutions_text_by_chapter[chapter_name]
            else:
                matched_sol_name = _fuzzy_match_chapter(
                    chapter_name, list(solutions_text_by_chapter.keys())
                )
                if matched_sol_name:
                    sol_text = solutions_text_by_chapter[matched_sol_name]
                elif "_single" in solutions_text_by_chapter and len(questions_by_chapter) == 1:
                    sol_text = solutions_text_by_chapter["_single"]
                elif len(solutions_text_by_chapter) == 1 and len(questions_by_chapter) == 1:
                    sol_text = list(solutions_text_by_chapter.values())[0]

            if sol_text:
                fallback_answers, chapter_solutions = _extract_solutions_and_answers(sol_text)

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

            solution = chapter_solutions.get(q.question_number)

            merged.append(
                MergedQuestion(
                    chapter_name=normalize_chapter_name(chapter_name),
                    question_number=q.question_number,
                    question_text=q.question_text,
                    question_type=q.question_type,
                    options=merged_options,
                    correct_answer=correct_answer,
                    ai_difficulty=q.ai_difficulty,
                    solution=solution,
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
