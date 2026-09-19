"""
Supabase ingestion — batched upsert of merged questions.

Mirrors the logic in src/lib/import/insert.ts but in Python:
  - Resolves subject → subject_id, chapter → chapter_id (creates if missing)
  - Inserts questions + question_options
  - Updates correct_answer for MCQs after options are inserted
  - Uses content hash for deduplication
  - Supports --dry-run (no writes)
"""
from __future__ import annotations

import hashlib
import json
import logging

from supabase import create_client, Client

from .config import SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BATCH_SIZE
from .schemas import MergedQuestion

logger = logging.getLogger(__name__)


def _generate_hash(q: MergedQuestion) -> str:
    """Generate a deterministic content hash for deduplication.

    Matches the approach in src/lib/import/dedupe.ts — hash is based on
    the question statement + options text.
    """
    content = q.question_text
    if q.options:
        for opt in q.options:
            content += f"|{opt.text}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:32]


class SupabaseIngestor:
    """Batched Supabase ingestion with subject/chapter resolution."""

    def __init__(self, dry_run: bool = False) -> None:
        self.dry_run = dry_run
        self._client: Client | None = None

        # Caches
        self._subject_cache: dict[str, str] = {}   # name_lower → id
        self._chapter_cache: dict[str, str] = {}    # "subject|chapter" → id

    @property
    def client(self) -> Client:
        if self._client is None:
            if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
                raise RuntimeError(
                    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. "
                    "Use --dry-run to skip Supabase writes."
                )
            self._client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        return self._client

    def _resolve_subject(self, subject_name: str) -> str:
        """Get or create a subject, return its UUID."""
        key = subject_name.lower().strip()
        if key in self._subject_cache:
            return self._subject_cache[key]

        # Try to find existing
        result = (
            self.client.table("subjects")
            .select("id, name")
            .ilike("name", subject_name.strip())
            .execute()
        )
        if result.data:
            self._subject_cache[key] = result.data[0]["id"]
            return self._subject_cache[key]

        # Create new
        result = (
            self.client.table("subjects")
            .insert({"name": subject_name.strip()})
            .execute()
        )
        self._subject_cache[key] = result.data[0]["id"]
        logger.info("Created subject '%s' → %s", subject_name, self._subject_cache[key])
        return self._subject_cache[key]

    def _resolve_chapter(self, subject_name: str, chapter_name: str) -> str:
        """Get or create a chapter under the given subject, return its UUID."""
        cache_key = f"{subject_name.lower().strip()}|{chapter_name.lower().strip()}"
        if cache_key in self._chapter_cache:
            return self._chapter_cache[cache_key]

        subject_id = self._resolve_subject(subject_name)

        # Try to find existing
        result = (
            self.client.table("chapters")
            .select("id, name")
            .eq("subject_id", subject_id)
            .ilike("name", chapter_name.strip())
            .execute()
        )
        if result.data:
            self._chapter_cache[cache_key] = result.data[0]["id"]
            return self._chapter_cache[cache_key]

        # Create new
        result = (
            self.client.table("chapters")
            .insert({"subject_id": subject_id, "name": chapter_name.strip()})
            .execute()
        )
        self._chapter_cache[cache_key] = result.data[0]["id"]
        logger.info(
            "Created chapter '%s' under '%s' → %s",
            chapter_name,
            subject_name,
            self._chapter_cache[cache_key],
        )
        return self._chapter_cache[cache_key]

    def ingest(
        self,
        questions: list[MergedQuestion],
        subject: str,
        visibility: str = "public",
    ) -> dict:
        """Ingest merged questions into Supabase.

        Parameters
        ----------
        questions : list[MergedQuestion]
            Fully merged questions from Pass 3.
        subject : str
            The subject name (Physics / Chemistry / Mathematics).
        visibility : str
            Visibility setting: 'public' or 'private'.

        Returns
        -------
        dict
            Summary statistics: inserted, skipped, errors, key_not_found.
        """
        stats = {
            "total": len(questions),
            "inserted": 0,
            "skipped_duplicate": 0,
            "skipped_key_not_found": 0,
            "errors": 0,
            "error_messages": [],
        }

        if self.dry_run:
            logger.info("DRY RUN: Would ingest %d questions. No writes.", len(questions))
            # Still return stats for reporting
            for q in questions:
                if q.merge_status == "KEY_NOT_FOUND":
                    stats["skipped_key_not_found"] += 1
            return stats

        # Process in batches
        for batch_start in range(0, len(questions), SUPABASE_BATCH_SIZE):
            batch = questions[batch_start : batch_start + SUPABASE_BATCH_SIZE]
            self._ingest_batch(batch, subject, stats, visibility=visibility)
            logger.info(
                "Progress: %d/%d processed (%d inserted, %d errors)",
                min(batch_start + SUPABASE_BATCH_SIZE, len(questions)),
                len(questions),
                stats["inserted"],
                stats["errors"],
            )

        logger.info(
            "Ingestion complete: %d inserted, %d skipped (dup), "
            "%d skipped (no key), %d errors",
            stats["inserted"],
            stats["skipped_duplicate"],
            stats["skipped_key_not_found"],
            stats["errors"],
        )
        return stats

    def _ingest_batch(
        self,
        batch: list[MergedQuestion],
        subject: str,
        stats: dict,
        visibility: str = "public",
    ) -> None:
        """Insert a single batch of questions."""
        questions_to_insert = []
        question_meta = []  # parallel list with original MergedQuestion for options

        for q in batch:
            if q.merge_status == "KEY_NOT_FOUND":
                stats["skipped_key_not_found"] += 1
                logger.warning(
                    "Skipping %s Q%d — KEY_NOT_FOUND",
                    q.chapter_name,
                    q.question_number,
                )
                continue

            try:
                chapter_id = self._resolve_chapter(subject, q.chapter_name)
            except Exception as e:
                stats["errors"] += 1
                msg = f"Failed to resolve chapter '{q.chapter_name}': {e}"
                stats["error_messages"].append(msg)
                logger.error(msg)
                continue

            content_hash = _generate_hash(q)

            row = {
                "chapter_id": chapter_id,
                "type": q.question_type,
                "statement": q.question_text,
                "difficulty": q.ai_difficulty,
                "tags": [f"ai_difficulty:{q.ai_difficulty}"],
                "source": q.source,
                "hash": content_hash,
                "hint": None,
                "solution": q.solution or None,
                "visibility": visibility,
            }

            # For numerical questions, set correct_answer directly
            if q.question_type == "numerical" and q.correct_answer:
                row["correct_answer"] = q.correct_answer

            questions_to_insert.append(row)
            question_meta.append(q)

        if not questions_to_insert:
            return

        # Check for existing hashes (deduplication)
        hashes = [r["hash"] for r in questions_to_insert]
        try:
            dup_result = (
                self.client.table("questions")
                .select("hash")
                .in_("hash", hashes)
                .execute()
            )
            dup_hashes = {d["hash"] for d in (dup_result.data or [])}
        except Exception as e:
            logger.error("Hash dedup check failed: %s — proceeding without dedup", e)
            dup_hashes = set()

        # Filter out duplicates
        filtered_rows = []
        filtered_meta = []
        for row, meta in zip(questions_to_insert, question_meta):
            if row["hash"] in dup_hashes:
                stats["skipped_duplicate"] += 1
            else:
                filtered_rows.append(row)
                filtered_meta.append(meta)

        if not filtered_rows:
            return

        # Insert questions
        try:
            insert_result = (
                self.client.table("questions")
                .insert(filtered_rows)
                .execute()
            )
        except Exception as e:
            stats["errors"] += len(filtered_rows)
            msg = f"Batch insert failed: {e}"
            stats["error_messages"].append(msg)
            logger.error(msg)
            return

        if not insert_result.data:
            stats["errors"] += len(filtered_rows)
            return

        # Build hash → inserted question ID map
        inserted_map: dict[str, str] = {
            r["hash"]: r["id"] for r in insert_result.data
        }

        # Insert options for MCQ questions
        options_to_insert = []
        for row, meta in zip(filtered_rows, filtered_meta):
            q_id = inserted_map.get(row["hash"])
            if q_id and meta.question_type == "mcq" and meta.options:
                for opt in meta.options:
                    options_to_insert.append({
                        "question_id": q_id,
                        "text": opt.text,
                        "is_correct": opt.is_correct,
                    })

        if options_to_insert:
            try:
                self.client.table("question_options").insert(options_to_insert).execute()
            except Exception as e:
                msg = f"Options insert failed: {e}"
                stats["error_messages"].append(msg)
                logger.error(msg)

            # Update correct_answer for MCQs (point to the correct option ID)
            try:
                mcq_q_ids = [
                    inserted_map[row["hash"]]
                    for row, meta in zip(filtered_rows, filtered_meta)
                    if meta.question_type == "mcq" and row["hash"] in inserted_map
                ]
                if mcq_q_ids:
                    correct_opts = (
                        self.client.table("question_options")
                        .select("id, question_id")
                        .in_("question_id", mcq_q_ids)
                        .eq("is_correct", True)
                        .execute()
                    )
                    if correct_opts.data:
                        updates = [
                            {"id": opt["question_id"], "correct_answer": opt["id"]}
                            for opt in correct_opts.data
                        ]
                        self.client.rpc(
                            "update_questions_correct_answers",
                            {"updates": json.dumps(updates)},
                        ).execute()
            except Exception as e:
                msg = f"correct_answer update failed: {e}"
                stats["error_messages"].append(msg)
                logger.error(msg)

        stats["inserted"] += len(insert_result.data)


def format_questions_json(
    questions: list[MergedQuestion],
    subject: str = "Mathematics",
    visibility: str = "public",
) -> list[dict]:
    """Format merged questions to match the platform standard JSON schema:
    [
      {
        "statement": "...",
        "type": "mcq",
        "difficulty": "easy",
        "visibility": "public",
        "chapter": "...",
        "subject": "...",
        "options": ["...", "...", "...", "..."],
        "correct_option": 0
      }
    ]
    """
    output = []
    for q in questions:
        chapter_val = q.chapter_name if q.chapter_name != "_single" else (subject or "General")
        item: dict = {
            "statement": q.question_text,
            "type": q.question_type,
            "difficulty": q.ai_difficulty,
            "visibility": visibility,
            "chapter": chapter_val,
            "subject": subject,
        }
        if q.question_type == "mcq" and q.options:
            item["options"] = [opt.text for opt in q.options]
            # Find 0-indexed correct option (0, 1, 2, 3)
            correct_idx = 0
            for idx, opt in enumerate(q.options):
                if opt.is_correct:
                    correct_idx = idx
                    break
            item["correct_option"] = correct_idx
        elif q.question_type == "numerical":
            item["correct_answer"] = q.correct_answer or ""

        item["solution"] = q.solution or ""
        item["merge_status"] = q.merge_status

        output.append(item)
    return output


def dump_dry_run_json(
    questions: list[MergedQuestion],
    output_path: str | None,
    subject: str = "Mathematics",
    visibility: str = "public",
) -> None:
    """Write merged questions as JSON matching the standard platform schema."""
    data = format_questions_json(questions, subject=subject, visibility=visibility)

    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info("Dry-run output written to: %s (%d questions)", output_path, len(data))
    else:
        print(json.dumps(data, indent=2, ensure_ascii=False))
