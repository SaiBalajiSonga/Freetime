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
    """Convert a PDF to Markdown.

    Tries pymupdf4llm first (fast, CPU-native, layout-aware),
    then falls back to Marker OCR if installed, and finally basic PyMuPDF.
    """
    logger = logging.getLogger(__name__)
    output_dir = pdf_path.parent / "converted_output"
    output_dir.mkdir(exist_ok=True)

    # 1. Try Gemini Vision OCR first for high-fidelity LaTeX & formula layout (<= 30 pages)
    if GEMINI_API_KEY:
        try:
            import pymupdf
            doc = pymupdf.open(str(pdf_path))
            page_count = len(doc)
            doc.close()
        except Exception:
            page_count = 1

        if page_count <= 30:
            try:
                from google import genai
                from google.genai import types
                from scripts.pipeline.config import GEMINI_MODEL

                logger.info("Converting PDF (%d pages) → Markdown via Gemini Vision: %s", page_count, pdf_path.name)
                client = genai.Client(api_key=GEMINI_API_KEY)
                pdf_bytes = pdf_path.read_bytes()

                prompt = (
                    "You are an expert document OCR engine for Indian engineering entrance exam (JEE) question banks.\n"
                    "Convert this PDF into clean, structured Markdown.\n"
                    "CRITICAL REQUIREMENTS:\n"
                    "1. PRESERVE ALL LaTeX EXACTLY. Use standard LaTeX: $...$ for inline math, $$...$$ for display math.\n"
                    "2. For fractions, use \\frac{a}{b}. Never drop fraction bars, root signs, or exponents.\n"
                    "3. Keep all question markers verbatim: e.g. 'Q1 - 2024 (01 Feb Shift 1)', 'Q1.', etc.\n"
                    "4. Keep all options numbered (1), (2), (3), (4).\n"
                    "5. Include the Answer Key section verbatim at the end.\n"
                    "6. Include the Solutions section verbatim if present in the document.\n"
                    "7. Output ONLY raw Markdown without extra conversational chatter."
                )

                vision_models = [GEMINI_MODEL, "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"]
                # Deduplicate while preserving order
                seen = set()
                unique_vision_models = [m for m in vision_models if not (m in seen or seen.add(m))]

                for v_model in unique_vision_models:
                    for attempt in range(2):
                        try:
                            logger.info("Attempting Gemini Vision with model: %s (attempt %d)", v_model, attempt + 1)
                            response = client.models.generate_content(
                                model=v_model,
                                contents=[
                                    types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
                                    prompt,
                                ],
                            )
                            if response.text and len(response.text.strip()) > 100:
                                md_file = output_dir / f"{pdf_path.stem}.md"
                                md_file.write_text(response.text, encoding="utf-8")
                                logger.info(
                                    "Gemini Vision conversion complete via %s: %s (%d bytes)",
                                    v_model,
                                    md_file.name,
                                    md_file.stat().st_size,
                                    )
                                return md_file
                        except Exception as err:
                            logger.warning("Vision OCR failed with %s attempt %d: %s", v_model, attempt + 1, err)
                            import time
                            time.sleep(2)
            except Exception as e:
                logger.warning("Gemini Vision PDF conversion failed (%s), falling back to pymupdf4llm...", e)

    # 2. Try pymupdf4llm (fast, CPU-native, layout-aware)
    try:
        import pymupdf4llm

        logger.info("Converting PDF → Markdown via pymupdf4llm: %s", pdf_path.name)
        md_text = pymupdf4llm.to_markdown(str(pdf_path))
        md_file = output_dir / f"{pdf_path.stem}.md"
        md_file.write_text(md_text, encoding="utf-8")
        logger.info(
            "pymupdf4llm conversion complete: %s (%d bytes)",
            md_file.name,
            md_file.stat().st_size,
        )
        return md_file
    except ImportError:
        logger.debug("pymupdf4llm not installed, trying Marker...")
    except Exception as e:
        logger.warning("pymupdf4llm conversion failed (%s), trying Marker...", e)

    # 2. Try Marker OCR (if installed)
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
            timeout=600,
        )
        if result.returncode == 0:
            md_files = list(output_dir.rglob("*.md"))
            if md_files:
                md_file = max(md_files, key=lambda f: f.stat().st_size)
                logger.info("Marker output: %s (%d bytes)", md_file.name, md_file.stat().st_size)
                return md_file
            logger.warning("Marker produced no .md files, falling back to PyMuPDF")
        else:
            logger.warning("Marker failed (code %d), falling back to PyMuPDF", result.returncode)
    except Exception as e:
        logger.warning("Marker execution error: %s, falling back to PyMuPDF", e)

    # 3. Fallback: PyMuPDF basic text extraction
    try:
        import pymupdf

        logger.info("Converting PDF → Text via pymupdf fallback: %s", pdf_path.name)
        doc = pymupdf.open(str(pdf_path))
        text = "\n\n".join(page.get_text() for page in doc)
        md_file = output_dir / f"{pdf_path.stem}.md"
        md_file.write_text(text, encoding="utf-8")
        logger.info("PyMuPDF fallback complete: %s (%d bytes)", md_file.name, md_file.stat().st_size)
        return md_file
    except Exception as e:
        logger.error("All PDF conversion strategies failed: %s", e)
        sys.exit(1)


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
        "--visibility",
        choices=["public", "private"],
        default="public",
        help="Question visibility: 'public' or 'private' (default: 'public')",
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

    # For multi-chapter documents with --chapter, filter to the requested chapter
    if args.chapter and split.format_type == "multi_chapter":
        from scripts.pipeline.pass3_merge import _fuzzy_match_chapter
        matched = _fuzzy_match_chapter(args.chapter, list(split.questions_by_chapter.keys()))
        if matched:
            split.questions_by_chapter = {matched: split.questions_by_chapter[matched]}
            chapters = [matched]
            logger.info("Filtered to requested chapter: '%s'", matched)
        else:
            logger.warning(
                "Requested chapter '%s' not found among document chapters: %s",
                args.chapter,
                list(split.questions_by_chapter.keys()),
            )

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
        solutions_text_by_chapter=split.solutions_by_chapter,
    )

    ok_count = sum(1 for q in merged if q.merge_status == "ok")
    missing_count = sum(1 for q in merged if q.merge_status == "KEY_NOT_FOUND")
    logger.info("Pass 3: %d merged (%d ok, %d KEY_NOT_FOUND).", len(merged), ok_count, missing_count)

    elapsed = time.time() - t0
    logger.info("Pipeline processing took %.1f seconds.", elapsed)

    # ── Ingestion / Dry Run ───────────────────────────────────────────────
    if args.dry_run:
        logger.info("─── Dry Run: Dumping JSON ───")
        dump_dry_run_json(merged, args.output, subject=args.subject, visibility=args.visibility)
    else:
        logger.info("─── Ingestion: Writing to Supabase ───")
        ingestor = SupabaseIngestor(dry_run=False)
        stats = ingestor.ingest(merged, subject=args.subject, visibility=args.visibility)
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
