"""
Pass 2 — Extract questions from the question-body markdown.

Chunks questions into groups of ~10-15, sends each chunk to the LLM,
and collects structured output.

CRITICAL CONSTRAINT: This pass NEVER sees correct answers and NEVER
guesses them.  The schema (ExtractedQuestion) has no correct_answer
field — this is the anti-hallucination guarantee.
"""
from __future__ import annotations

import asyncio
import logging
import re

import os

import instructor

from .config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    QUESTIONS_PER_CHUNK,
    MAX_RETRIES,
    RETRY_BACKOFF_BASE,
)
from .rate_limiter import RateLimiter
from .schemas import ChapterQuestions, ExtractedQuestion

logger = logging.getLogger(__name__)


FALLBACK_MODELS = [
    os.getenv("GEMINI_MODEL", "gemini-3.6-flash"),
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
]


def _build_client(model_name: str | None = None) -> instructor.Instructor:
    """Create an instructor-wrapped Gemini client via the google-genai SDK."""
    os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY
    model = model_name or GEMINI_MODEL
    client = instructor.from_provider(
        f"google/{model}",
    )
    return client


_SYSTEM_PROMPT = """\
You are a precise data-extraction assistant for JEE (Indian engineering
entrance exam) questions.

You will receive a chunk of raw markdown containing several questions from
a single chapter.  Each question is numbered Q1, Q2, Q3, etc. (per chapter).

Your task:
1. Extract each question's number, full text, type, options, and difficulty.
2. PRESERVE ALL LaTeX EXACTLY as it appears.  Use \\(...\\) for inline math
   and \\[...\\] for display math.  Do NOT reformat, simplify, or "clean up"
   any mathematical expressions.
3. For MCQ questions (those with numbered options (1), (2), (3), (4)):
   - Set question_type = "mcq"
   - Extract all 4 options with their numbers and text.
   - If an option contains mathematical formulas, intervals, roots, or fractions, ALWAYS wrap the math in $...$ or \(...\) delimiters so it compiles as LaTeX.
4. For numerical/integer-answer questions (no options listed, or the question
   asks for a numerical value to fill in):
   - Set question_type = "numerical"
   - Set options = null
5. Estimate difficulty (easy/medium/hard) based on JEE Main standards:
   - easy = direct formula application, single step
   - medium = 2-3 step reasoning
   - hard = deep insight, multi-concept, or long computation

CRITICAL RULES:
- NEVER state, guess, or imply what the correct answer is.
- NEVER add any field indicating correctness of any option.
- ONLY extract — do not solve or evaluate the questions.
- If a question's text is unclear or mangled, extract it as-is.
"""


def _chunk_questions_text(
    chapter_text: str, chunk_size: int = QUESTIONS_PER_CHUNK
) -> list[str]:
    """Split chapter text into chunks of roughly `chunk_size` questions.

    Uses question markers (Q1., Q2., etc.) to find boundaries.
    """
    # Find all question start positions (supports "Q1.", "Q1 - 2024 ...", "|**Q1.**", "- **Q1.**", inline "**Q1.**")
    question_starts = list(re.finditer(
        r"(?:^|\n|\s)(?:[-*#|]\s*)*(?:\*\*)?Q(\d+)(?:\.|\s*[-–—])",
        chapter_text,
        re.IGNORECASE,
    ))

    if not question_starts:
        # No question markers found — return the whole text as one chunk
        return [chapter_text.strip()] if chapter_text.strip() else []

    chunks: list[str] = []
    for i in range(0, len(question_starts), chunk_size):
        start_match = question_starts[i]
        # End is the start of the next chunk's first question, or end of text
        if i + chunk_size < len(question_starts):
            end_pos = question_starts[i + chunk_size].start()
        else:
            end_pos = len(chapter_text)

        chunk = chapter_text[start_match.start() : end_pos].strip()
        if chunk:
            chunks.append(chunk)

    return chunks


async def _extract_chunk(
    client: instructor.Instructor,
    chunk_text: str,
    chapter_name: str,
    chunk_index: int,
    limiter: RateLimiter,
) -> list[ExtractedQuestion]:
    """Extract questions from a single chunk via LLM, with rate limiting, model fallbacks and retries."""
    models_to_try = (FALLBACK_MODELS * 2)[:MAX_RETRIES]
    for attempt, model_name in enumerate(models_to_try):
        try:
            curr_client = _build_client(model_name)
            async with limiter:
                logger.info(
                    "Pass 2: Processing chunk %d of chapter '%s' (attempt %d/%d, model: %s, %d chars)",
                    chunk_index,
                    chapter_name,
                    attempt + 1,
                    MAX_RETRIES,
                    model_name,
                    len(chunk_text),
                )

                # instructor's from_provider is sync — run in executor
                loop = asyncio.get_event_loop()
                result: ChapterQuestions = await loop.run_in_executor(
                    None,
                    lambda: curr_client.create(
                        response_model=ChapterQuestions,
                        messages=[
                            {"role": "system", "content": _SYSTEM_PROMPT},
                            {
                                "role": "user",
                                "content": (
                                    f"Chapter: {chapter_name}\n\n"
                                    f"Extract all questions from this chunk:\n\n"
                                    f"{chunk_text}"
                                ),
                            },
                        ],
                        max_retries=1,
                    ),
                )

                logger.info(
                    "Pass 2: Chunk %d of '%s' → %d questions extracted.",
                    chunk_index,
                    chapter_name,
                    len(result.questions),
                )
                for q in result.questions:
                    if q.options:
                        for opt in q.options:
                            t = opt.text.strip()
                            has_delimiters = bool(re.search(r"\$|\\\(|\\\[", t))
                            has_latex = bool(re.search(r"\\[a-zA-Z]+|[\^_]\{?", t))
                            if not has_delimiters and has_latex:
                                opt.text = f"${t}$"
                return result.questions

        except Exception as e:
            logger.warning(
                "Pass 2: Attempt %d/%d failed for chunk %d of '%s' (model: %s): %s",
                attempt + 1,
                MAX_RETRIES,
                chunk_index,
                chapter_name,
                model_name,
                e,
            )
            if attempt + 1 < MAX_RETRIES:
                await asyncio.sleep(RETRY_BACKOFF_BASE ** attempt)
            else:
                logger.error(
                    "Pass 2: FAILED chunk %d of '%s' after %d attempts. Skipping chunk.",
                    chunk_index,
                    chapter_name,
                    MAX_RETRIES,
                )
                return []

    return []


async def extract_questions_for_chapter(
    chapter_name: str,
    chapter_text: str,
    limiter: RateLimiter,
) -> list[ExtractedQuestion]:
    """Extract all questions for a single chapter, processing chunks concurrently.

    Parameters
    ----------
    chapter_name : str
        The chapter name (used for logging and passed to the LLM for context).
    chapter_text : str
        The raw markdown text of the questions section for this chapter.
    limiter : RateLimiter
        Shared rate limiter across all concurrent tasks.

    Returns
    -------
    list[ExtractedQuestion]
        All extracted questions, ordered by question number.
    """
    chunks = _chunk_questions_text(chapter_text)

    if not chunks:
        logger.warning("Pass 2: No question chunks found for chapter '%s'", chapter_name)
        return []

    logger.info(
        "Pass 2: Chapter '%s' split into %d chunks.", chapter_name, len(chunks)
    )

    client = _build_client()

    # Launch all chunks concurrently (rate limiter handles pacing)
    tasks = [
        _extract_chunk(client, chunk, chapter_name, i, limiter)
        for i, chunk in enumerate(chunks)
    ]
    chunk_results = await asyncio.gather(*tasks)

    # Flatten and sort by question number
    all_questions: list[ExtractedQuestion] = []
    for questions in chunk_results:
        all_questions.extend(questions)

    all_questions.sort(key=lambda q: q.question_number)

    # Check for duplicates
    seen: set[int] = set()
    deduped: list[ExtractedQuestion] = []
    for q in all_questions:
        if q.question_number not in seen:
            seen.add(q.question_number)
            deduped.append(q)
        else:
            logger.warning(
                "Pass 2: Duplicate question %d in chapter '%s' — keeping first.",
                q.question_number,
                chapter_name,
            )

    return deduped


async def extract_all_questions(
    questions_by_chapter: dict[str, str],
    limiter: RateLimiter,
) -> dict[str, list[ExtractedQuestion]]:
    """Extract questions from all chapters.

    Parameters
    ----------
    questions_by_chapter : dict[str, str]
        {chapter_name: raw_markdown_text} from the splitter.
    limiter : RateLimiter
        Shared rate limiter.

    Returns
    -------
    dict[str, list[ExtractedQuestion]]
        {chapter_name: [questions]} — ordered by question number within each.
    """
    results: dict[str, list[ExtractedQuestion]] = {}

    # Process chapters sequentially (chunks within each are concurrent)
    for chapter_name, chapter_text in questions_by_chapter.items():
        questions = await extract_questions_for_chapter(
            chapter_name, chapter_text, limiter
        )
        results[chapter_name] = questions
        logger.info(
            "Pass 2: Chapter '%s' complete — %d questions.",
            chapter_name,
            len(questions),
        )

    total = sum(len(qs) for qs in results.values())
    logger.info("Pass 2 complete: %d total questions across %d chapters.", total, len(results))
    return results
