# Fix Exam Stats, Rank Logic, Leaderboard & UI Polish

## Background

The weekly exam result page has multiple issues:
- Rank/percentile shows immediately (should wait until exam window closes)
- Subject-wise marks are missing from the leaderboard table
- Student leaderboard exposes other students' data
- No admin-side leaderboard for tutors
- The `surface-glass-strong` CSS class is referenced but never defined
- Stats/UI coloring is basic and buggy

## Proposed Changes

### 1. Rank & Percentile — Only After Exam Ends

#### [MODIFY] [page.tsx](file:///c:/Users/JOHNSON/Desktop/Freetime/src/app/(dashboard)/exams/[examId]/result/page.tsx)

**Problem**: Currently fetches leaderboard unconditionally using a basic `test_sessions` query (no rank, no subject scores, no `ends_at` check). The other result page at `tests/[sessionId]/result/page.tsx` correctly checks `ends_at` and uses the RPC, but this page doesn't.

**Fix**:
- Fetch the `weekly_exams` record to get `ends_at`
- Only call `get_jee_leaderboard` RPC if `now > ends_at`
- Pass a new `examEnded` boolean prop + `examEndsAt` to the client
- Before exam ends: show a "Rank will be available after exam closes" message instead of rank/percentile

---

### 2. Fix Subject-wise Marks in Leaderboard Data

#### [MODIFY] [result-client.tsx](file:///c:/Users/JOHNSON/Desktop/Freetime/src/app/(dashboard)/tests/[sessionId]/result/result-client.tsx)

**Problem**: The leaderboard table has columns for Math, Phy, Chem but the data from the basic query in `exams/[examId]/result/page.tsx` doesn't include those fields. Only the RPC returns `math_score`, `physics_score`, `chem_score`. Since we're fixing the page to use the RPC, this will be resolved.

---

### 3. Remove Leaderboard from Student View — Show Only Their Rank

#### [MODIFY] [result-client.tsx](file:///c:/Users/JOHNSON/Desktop/Freetime/src/app/(dashboard)/tests/[sessionId]/result/result-client.tsx)

**Changes**:
- **Remove** the entire leaderboard `<table>` section from the student-facing result page
- **Keep** the "Your All India Rank (AIR)" card but only render when `examEnded` is true
- When `examEnded` is false, show a styled banner: "🏆 Your rank & percentile will be revealed once the exam window closes on {endsAt}"
- Remove the `TIME` column reference entirely
- The rank card should show: Rank, Percentile, Total participants — visible **only** to the current student (already the case since it uses `currentUserId`)

---

### 4. Add Admin Leaderboard Page

#### [NEW] [page.tsx](file:///c:/Users/JOHNSON/Desktop/Freetime/src/app/(admin)/admin/weekly-exams/[examId]/results/page.tsx)

A new admin page that shows full exam analytics:
- Exam summary stats (total participants, avg score, highest/lowest score)
- Full leaderboard table with: Rank, Student Name, Total Score, Math, Phy, Chem, Correct, Wrong, Skipped
- No time column needed
- Uses `createAdminClient` to bypass RLS
- Uses the existing `get_jee_leaderboard` RPC
- Add a link to this page from the admin weekly exams list (add "Results" button for ended exams)

#### [MODIFY] [page.tsx](file:///c:/Users/JOHNSON/Desktop/Freetime/src/app/(admin)/admin/weekly-exams/page.tsx)

- Add a "Results" link/button in the ExamRow for exams with status "ended"

---

### 5. UI/UX Polish & Bug Fixes

#### [MODIFY] [globals.css](file:///c:/Users/JOHNSON/Desktop/Freetime/src/app/globals.css)

- Add the missing `surface-glass-strong` class definition
- Add new utility classes for the redesigned stat cards

#### [MODIFY] [result-client.tsx](file:///c:/Users/JOHNSON/Desktop/Freetime/src/app/(dashboard)/tests/[sessionId]/result/result-client.tsx)

Major visual overhaul:
- **Score Hero**: Redesign with gradient backgrounds based on performance tier, animated score counter feel
- **Stat pills**: Use colored icon boxes instead of plain text, add subtle borders and gradient accents
- **Subject Breakdown**: Add colored left borders per subject (blue for Math, orange for Physics, green for Chemistry), show score prominently, use segmented progress bar (correct/incorrect/unattempted)
- **Topics to Review**: Improve card design with colored severity indicators
- **Time Management**: Better visual hierarchy, use pill-style stat displays
- **Difficulty Breakdown**: More vibrant progress bars with gradient fills
- **Rank Card**: Premium gradient card with glassmorphism when exam has ended
- **Question Review**: Improve expanded state with better solution formatting

> [!IMPORTANT]
> The `surface-glass-strong` CSS class is used in 5 places but **never defined** in `globals.css`. This is causing those sections to have no background styling, contributing to the "basic" look. We'll add it.

---

## Open Questions

> [!IMPORTANT]
> **Leaderboard RPC**: The `get_jee_leaderboard` RPC is already deployed in Supabase, correct? The SQL file exists at the project root. The admin results page will call this same RPC via `createAdminClient`.

> [!NOTE]  
> **Negative marking display**: In the screenshots, Chemistry shows `-4 pts` — the marking logic awards `-1` for wrong MCQs and `0` for wrong numerical. Should I keep this as-is, or is there a different marking scheme you want?

---

## Verification Plan

### Manual Verification
1. Visit the exam result page while the exam is still live → rank should show "pending" message
2. Visit after `ends_at` → rank, percentile, and participant count should display correctly
3. Confirm leaderboard table is NOT visible to students
4. Visit admin panel → weekly exams → click "Results" on an ended exam → full leaderboard should display
5. Verify subject-wise breakdown shows correct scores with colored bars
6. Confirm no `surface-glass-strong` styling issues (sections should have proper glass background)
