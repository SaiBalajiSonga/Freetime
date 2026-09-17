"""
Central configuration for the JEE PDF ingestion pipeline.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the pipeline directory, then fall back to repo root
_pipeline_dir = Path(__file__).parent
load_dotenv(_pipeline_dir / ".env")
load_dotenv(_pipeline_dir.parent.parent / ".env")

# ── Gemini ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

# ── Supabase ──────────────────────────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""))
SUPABASE_SERVICE_KEY: str = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    os.getenv("SUPABASE_SERVICE_KEY", ""),
)

# ── Rate Limiting ─────────────────────────────────────────────────────────────
# Requests per minute — conservative default for free tier.
# Gemini Pro users can increase this.
DEFAULT_RPM: int = int(os.getenv("PIPELINE_RPM", "10"))
DEFAULT_CONCURRENCY: int = int(os.getenv("PIPELINE_CONCURRENCY", "3"))

# ── Chunking ──────────────────────────────────────────────────────────────────
# How many questions to send to the LLM per chunk in Pass 2.
QUESTIONS_PER_CHUNK: int = int(os.getenv("PIPELINE_CHUNK_SIZE", "12"))

# ── Retry ─────────────────────────────────────────────────────────────────────
MAX_RETRIES: int = 3
RETRY_BACKOFF_BASE: float = 2.0  # exponential backoff: 2^attempt seconds

# ── Supabase Batch ────────────────────────────────────────────────────────────
SUPABASE_BATCH_SIZE: int = 200

# ── Watermark / header patterns to strip ──────────────────────────────────────
# These appear on nearly every page of MathonGo PDFs.
# Each pattern is matched case-insensitively as a full line.
WATERMARK_PATTERNS: list[str] = [
    r"JEE Main \d{4}\s*(January|February|March|April)?",
    r"Chapter[-\s]*wise\s+Question\s+Bank",
    r"MathonGo",
    r"To practice these questions digitally.*",
    r"Join Country.*Test Series.*",
    r"Download MARKS App",
    r"Click here",
]

# ── Chapter name normalization map ────────────────────────────────────────────
# Maps PDF chapter names (as they appear in the document) to canonical names.
# If a chapter name from the PDF doesn't appear here, it's used as-is.
# Extend this if your Supabase chapters table uses different names.
CHAPTER_NAME_MAP: dict[str, str] = {
    "Basic of Mathematics": "Basics of Mathematics",
    "Trigonometric Ratios & Identities": "Trigonometric Ratios and Identities",
    # Add more mappings as needed
}

# ── Known chapter names (from the MathonGo TOC) ──────────────────────────────
# Used by the splitter to detect chapter boundaries.
KNOWN_CHAPTERS: list[str] = [
    "Basic of Mathematics",
    "Quadratic Equation",
    "Complex Number",
    "Sequences and Series",
    "Permutation Combination",
    "Binomial Theorem",
    "Statistics",
    "Matrices",
    "Determinants",
    "Probability",
    "Sets and Relations",
    "Functions",
    "Limits",
    "Continuity and Differentiability",
    "Application of Derivatives",
    "Indefinite Integration",
    "Definite Integration",
    "Area Under Curves",
    "Differential Equations",
    "Straight Lines",
    "Circle",
    "Parabola",
    "Ellipse",
    "Hyperbola",
    "Trigonometric Ratios & Identities",
    "Trigonometric Equations",
    "Inverse Trigonometric Functions",
    "Vector Algebra",
    "Three Dimensional Geometry",
]


def normalize_chapter_name(raw_name: str) -> str:
    """Return the canonical chapter name, applying the mapping if present."""
    stripped = raw_name.strip()
    return CHAPTER_NAME_MAP.get(stripped, stripped)
