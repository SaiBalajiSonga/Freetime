"""
Pydantic schemas for every stage of the pipeline.

Naming convention:
  - Pass1*  → answer-key extraction
  - Pass2*  → question extraction
  - Merged* → post-merge, ready for Supabase
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ── Pass 1: Answer Key ───────────────────────────────────────────────────────

class AnswerKeyEntry(BaseModel):
    """A single answer from the answer-key section."""
    question_number: int = Field(
        ..., description="The question number as printed (per-chapter, starts at 1)."
    )
    answer: str = Field(
        ...,
        description=(
            "The raw answer string exactly as it appears in parentheses. "
            "For MCQs this will be '1', '2', '3', or '4'. "
            "For numerical questions this will be the numerical value like '117' or '474'."
        ),
    )


class ChapterAnswerKey(BaseModel):
    """All answers for a single chapter."""
    chapter_name: str = Field(
        ..., description="The chapter heading exactly as it appears in the answer-key section."
    )
    answers: list[AnswerKeyEntry] = Field(
        default_factory=list,
        description="Ordered list of answers for this chapter.",
    )


class FullAnswerKey(BaseModel):
    """The complete answer key for the entire document."""
    chapters: list[ChapterAnswerKey] = Field(
        default_factory=list,
        description="Answer keys grouped by chapter.",
    )


# ── Pass 2: Question Extraction ──────────────────────────────────────────────

class QuestionOption(BaseModel):
    """A single MCQ option."""
    option_number: int = Field(
        ..., description="The option label as an integer: 1, 2, 3, or 4."
    )
    text: str = Field(
        ...,
        description=(
            "The full option text with LaTeX preserved verbatim. "
            "Use \\(...\\) for inline math and \\[...\\] for display math, "
            "exactly as they appear in the source."
        ),
    )


class ExtractedQuestion(BaseModel):
    """A single question extracted by Pass 2.

    IMPORTANT: This schema intentionally has NO correct_answer or is_correct
    field.  Pass 2 must NEVER guess or state the correct answer.  That
    information is merged in Pass 3 from the answer key.
    """
    question_number: int = Field(
        ..., description="The question number as printed (per-chapter, starts at 1)."
    )
    question_text: str = Field(
        ...,
        description=(
            "The full question statement with all LaTeX preserved verbatim. "
            "Use \\(...\\) for inline math and \\[...\\] for display math."
        ),
    )
    question_type: Literal["mcq", "numerical"] = Field(
        ...,
        description=(
            "The question type. 'mcq' if numbered options (1)-(4) are present. "
            "'numerical' if the question asks for an integer or decimal answer "
            "with no options listed."
        ),
    )
    options: list[QuestionOption] | None = Field(
        default=None,
        description="The 4 MCQ options. Must be None for numerical questions.",
    )
    ai_difficulty: Literal["easy", "medium", "hard"] = Field(
        ...,
        description=(
            "Your estimate of the difficulty level for a JEE Main candidate. "
            "'easy' = direct formula application, "
            "'medium' = requires 2-3 step reasoning, "
            "'hard' = requires deep insight or multi-concept application."
        ),
    )


class ChapterQuestions(BaseModel):
    """All questions extracted for a single chapter chunk."""
    questions: list[ExtractedQuestion] = Field(
        default_factory=list,
        description="Ordered list of extracted questions.",
    )


# ── Pass 3: Merged Output ────────────────────────────────────────────────────

class MergedOption(BaseModel):
    """An MCQ option with correctness determined by the answer key."""
    text: str
    is_correct: bool


class MergedQuestion(BaseModel):
    """A fully merged question ready for Supabase ingestion."""
    chapter_name: str
    question_number: int
    question_text: str
    question_type: Literal["mcq", "numerical"]
    options: list[MergedOption] | None = None
    correct_answer: str | None = None  # For numerical; for MCQ this is the option_id after insert
    ai_difficulty: Literal["easy", "medium", "hard"]
    source: str | None = None
    merge_status: Literal["ok", "KEY_NOT_FOUND"] = "ok"
