"""
CLI entry point for the JEE PDF -> Supabase ingestion pipeline.

Usage:
    # From pre-OCR'd markdown
    python -m scripts.pipeline.main \
        --input "Mathematics - JEE Main 2025 January.md" \
        --subject Mathematics \
        --source "JEE Main 2025 January" \
        --dry-run

    # With automatic PDF -> Markdown conversion (requires marker-pdf)
    python -m scripts.pipeline.main \
        --input "Mathematics - JEE Main 2025 January.pdf" \
        --convert-pdf \
        --subject Mathematics
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import subprocess
import sys
import time
from pathlib import Path

# Ensure the repo root is on sys.path so relative imports work
# when invoked as `python scripts/pipeline/main.py`
_repo_root = Path(__file__).resolve().parent.parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from scripts.pipeline.config import DEFAULT_RPM, DEFAULT_CONCURRENCY, GEMINI_API_KEY
from scripts.pipeline.splitter import split_document, get_chapter_names
from scripts.pipeline.pass1_answer_key import extract_answer_key, answer_key_to_dict
from scripts.pipeline.pass2_questions import extract_all_questions
from scripts.pipeline.pass3_merge import merge
from scripts.pipeline.ingest import SupabaseIngestor, dump_dry_run_json
from scripts.pipeline.rate_limiter import RateLimiter


def _setup_logging(verbose: bool) -> None:
    """Configure console logging."""
    level = logging.DEBUG if verbose else logging.INFO
    fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    logging.basicConfig(level=level, format=fmt, stream=sys.stderr)
    # Quiet noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("google").setLevel(logging.WARNING)


def _convert_pdf_to_markdown(pdf_path: Path) -> Path:
    """Run Marker OCR on a PDF and return the path to the output markdown.

    Requires `marker-pdf` to be installed: pip install marker-pdf
    """
    logger = logging.getLogger(__name__)
    output_dir = pdf_path.parent / "marker_output"
    output_dir.mkdir(exist_ok=True)

    logger.info("Converting PDF → Markdown via Marker: %s", pdf_path.name)

    try:
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "marker",
                str(pdf_path),
                "--output_dir",
                str(output_dir),
            ],
            capture_output=True,
            text=True,
            timeout=600,  # 10 min timeout for large PDFs
        )
    except FileNotFoundError:
        logger.error(
            "Marker is not installed. Install it with: pip install marker-pdf"
        )
        sys.exit(1)
    except subprocess.TimeoutExpired:
        logger.error("Marker OCR timed out after 10 minutes.")
        sys.exit(1)

    if result.returncode != 0:
        logger.error("Marker failed:\n%s\n%s", result.stdout, result.stderr)
        sys.exit(1)

    # Find the output markdown file
    md_files = list(output_dir.rglob("*.md"))
    if not md_files:
        logger.error("Marker produced no .md output in %s", output_dir)
        sys.exit(1)

    # Use the largest .md file (main output)
    md_file = max(md_files, key=lambda f: f.stat().st_size)
    logger.info("Marker output: %s (%d bytes)", md_file.name, md_file.stat().st_size)
    return md_file


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="JEE PDF -> Supabase ingestion pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--input",
        required=True,
        type=Path,
        help="Path to the Marker-produced .md file (or .pdf with --convert-pdf)",
    )
    parser.add_argument(
        "--subject",
        required=True,
        help="Subject name: Physics, Chemistry, or Mathematics",
    )
    parser.add_argument(
        "--chapter",
        default=None,
        help="Chapter name override (required for single-chapter PDFs, "
             "e.g., 'Application of Derivatives')",
    )
    parser.add_argument(
        "--source",
        default=None,
        help="Source tag (default: derived from filename)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Extract and merge without writing to Supabase",
    )
    parser.add_argument(
        "--convert-pdf",
        action="store_true",
        help="Run Marker OCR on the input PDF first (requires marker-pdf)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output JSON file path for dry-run (default: stdout)",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=DEFAULT_CONCURRENCY,
        help=f"Max concurrent LLM calls (default: {DEFAULT_CONCURRENCY})",
    )
    parser.add_argument(
        "--rpm",
        type=int,
        default=DEFAULT_RPM,
        help=f"Max requests per minute (default: {DEFAULT_RPM})",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable debug logging",
    )
    return parser.parse_args()


async def _run_pipeline(args: argparse.Namespace) -> None:
    """Main async pipeline orchestrator."""
    logger = logging.getLogger(__name__)

    # ── Step 0: Resolve input file ────────────────────────────────────────
    input_path = args.input.resolve()

    if not input_path.exists():
        logger.error("Input file not found: %s", input_path)
        sys.exit(1)

    if args.convert_pdf:
        if input_path.suffix.lower() != ".pdf":
            logger.error("--convert-pdf requires a .pdf input, got: %s", input_path.suffix)
            sys.exit(1)
        input_path = _convert_pdf_to_markdown(input_path)
    elif input_path.suffix.lower() == ".pdf":
        logger.error(
            "Input is a PDF but --convert-pdf not specified. "
            "Either convert it first with Marker, or add --convert-pdf."
        )
        sys.exit(1)

    # Read markdown
    markdown_text = input_path.read_text(encoding="utf-8")
    logger.info("Loaded %s (%d chars)", input_path.name, len(markdown_text))

    # ── Validate API key ──────────────────────────────────────────────────
    if not GEMINI_API_KEY:
        logger.error(
            "GEMINI_API_KEY is not set. Add it to scripts/pipeline/.env "
            "or set it as an environment variable."
        )
        sys.exit(1)

    source = args.source or input_path.stem

    # ── Local Split ───────────────────────────────────────────────────────
    t0 = time.time()
    logger.info("─── Local Split ───")

    split = split_document(markdown_text, chapter_override=args.chapter)

    chapters = get_chapter_names(split)
    logger.info(
        "Split complete (%s format): %d chapters found: %s",
        split.format_type,
        len(chapters),
        ", ".join(chapters[:5]) + ("..." if len(chapters) > 5 else ""),
    )
    logger.info("Answer keys section: %d chars", len(split.answer_keys_text))

    # For single-chapter PDFs without --chapter, try to derive from filename
    if split.format_type == "single_chapter" and "_single" in chapters:
        if not args.chapter:
            # Try to extract chapter name from filename
            stem = input_path.stem
            # "Application of Derivatives - JEE Main 2024..." → "Application of Derivatives"
            if " - " in stem:
                inferred = stem.split(" - ")[0].strip()
                logger.info("Inferred chapter name from filename: '%s'", inferred)
                split.questions_by_chapter[inferred] = split.questions_by_chapter.pop("_single")
                chapters = get_chapter_names(split)

    # ── Pass 1: Answer Key Extraction ─────────────────────────────────────
    logger.info("─── Pass 1: Answer Key Extraction ───")

    full_key = extract_answer_key(split.answer_keys_text)
    answer_dict = answer_key_to_dict(full_key)

    total_answers = sum(len(v) for v in answer_dict.values())
    logger.info("Pass 1: %d answers across %d chapters.", total_answers, len(answer_dict))

    # ── Pass 2: Question Extraction ───────────────────────────────────────
    logger.info("─── Pass 2: Question Extraction ───")

    limiter = RateLimiter(rpm=args.rpm, concurrency=args.concurrency)
    questions_by_chapter = await extract_all_questions(
        split.questions_by_chapter, limiter
    )

    total_questions = sum(len(qs) for qs in questions_by_chapter.values())
    logger.info("Pass 2: %d questions across %d chapters.", total_questions, len(questions_by_chapter))

    # ── Pass 3: Merge ─────────────────────────────────────────────────────
    logger.info("─── Pass 3: Deterministic Merge ───")

    merged = merge(
        questions_by_chapter=questions_by_chapter,
        answer_key_dict=answer_dict,
        source=source,
    )

    ok_count = sum(1 for q in merged if q.merge_status == "ok")
    missing_count = sum(1 for q in merged if q.merge_status == "KEY_NOT_FOUND")
    logger.info("Pass 3: %d merged (%d ok, %d KEY_NOT_FOUND).", len(merged), ok_count, missing_count)

    elapsed = time.time() - t0
    logger.info("Pipeline processing took %.1f seconds.", elapsed)

    # ── Ingestion / Dry Run ───────────────────────────────────────────────
    if args.dry_run:
        logger.info("─── Dry Run: Dumping JSON ───")
        dump_dry_run_json(merged, args.output)
    else:
        logger.info("─── Ingestion: Writing to Supabase ───")
        ingestor = SupabaseIngestor(dry_run=False)
        stats = ingestor.ingest(merged, subject=args.subject)
        logger.info("Ingestion stats: %s", stats)

    # ── Summary ───────────────────────────────────────────────────────────
    logger.info("═══ Pipeline Complete ═══")
    logger.info("  Subject:    %s", args.subject)
    logger.info("  Source:     %s", source)
    logger.info("  Chapters:   %d", len(chapters))
    logger.info("  Questions:  %d", total_questions)
    logger.info("  Merged OK:  %d", ok_count)
    logger.info("  Missing:    %d", missing_count)
    logger.info("  Time:       %.1f s", elapsed)


def main() -> None:
    args = _parse_args()
    _setup_logging(args.verbose)
    asyncio.run(_run_pipeline(args))


if __name__ == "__main__":
    main()
