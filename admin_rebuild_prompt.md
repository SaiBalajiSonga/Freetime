# ANTIGRAVITY ADMIN PANEL REBUILD — MASTER PROMPT

> **Drop this entire prompt into Claude Code, Cursor, or any AI coding agent with access to the Freetime repo. It covers every file, every decision, and every design spec needed to completely rebuild the admin panel from scratch.**

---

## MISSION

Completely rebuild the admin panel at `src/app/(admin)/` into a **world-class, production-grade, fully functional admin interface**. The current implementation works but is visually inconsistent, uses a flat table-only layout for questions (bad for reading dense content), has no search/filter, no inline previews, duplicate code everywhere, and feels like a rough draft. The new version should feel like **Linear or Supabase's own admin dashboards** — opinionated, fast, powerful, and absolutely clean.

**Do not break any server action signatures, Supabase calls, or routing.** Only the UI layer, layout composition, and component architecture change. All data fetching (Supabase queries), server actions, and auth checks stay exactly the same.

---

## WHAT EXISTS TODAY (know this before touching anything)

### File Tree (admin only)
```
src/app/(admin)/
├── layout.tsx                          ← sidebar + header shell
├── admin/
│   ├── page.tsx                        ← Question Management (paginated table, 15/page)
│   ├── admin-nav.tsx                   ← tab nav: All Questions / Subjects & Chapters / Exam Bank / Weekly Exams
│   ├── actions.ts                      ← deleteSelectedQuestions(), deleteAllQuestions()
│   ├── questions/
│   │   ├── questions-table.tsx         ← client table with multi-select, bulk delete
│   │   ├── delete-buttons.tsx          ← DeleteQuestionButton, DeleteAllQuestionsButton, DeleteSubjectButton
│   │   ├── new/
│   │   │   ├── page.tsx                ← "Add New Question" form (client component, full MCQ+numerical+image)
│   │   │   └── actions.ts             ← createQuestion() server action
│   │   └── [questionId]/edit/
│   │       ├── page.tsx
│   │       ├── edit-client.tsx         ← same form structure as new, pre-seeded
│   │       └── actions.ts             ← updateQuestion() server action
│   ├── subjects/
│   │   ├── page.tsx                    ← cards grid, per-subject question count
│   │   └── [subjectId]/page.tsx        ← chapter list for one subject
│   ├── exam-bank/
│   │   ├── page.tsx                    ← visibility=exam questions table + stats row
│   │   └── new/
│   │       ├── page.tsx
│   │       └── actions.ts
│   ├── weekly-exams/
│   │   ├── page.tsx                    ← weekly exam list table
│   │   └── new/
│   │       ├── page.tsx
│   │       ├── weekly-exam-form.tsx    ← form for creating weekly exams
│   │       └── actions.ts
│   └── import/
│       ├── page.tsx                    ← 3-step import wizard (upload → preview → result)
│       └── actions.ts                 ← processImportData(), commitImport()
```

### Database Schema (critical — don't break queries)
```sql
subjects      id, name, created_at
chapters      id, subject_id, name, created_at
questions     id, chapter_id, type (mcq|numerical), statement, difficulty (easy|medium|hard),
              tags[], hint, solution, correct_answer, source, hash, visibility (public|exam), image_url, created_at
question_options  id, question_id, text, is_correct, created_at
weekly_exams  id, title, question_ids[], starts_at, ends_at, is_published, created_at
profiles      id, name, is_admin, created_at
```

### Design Tokens Already in Place
The project uses a dark-mode-first CSS variable system. These tokens are already defined in the global CSS and used everywhere — **keep using them, never hardcode colors**:
```
bg-background, bg-surface, bg-surface-2
text-foreground, text-muted, text-muted-2
border-border, border-border-strong
bg-gradient-primary (blue gradient)
text-accent-electric (blue), text-accent-cyan, text-accent-glow
rounded-pill, rounded-2xl, rounded-xl
nav-glass, sidebar-dark, surface-glass (backdrop-filter utilities)
icon-3d-blue
```
Difficulty badge colors: `easy → emerald`, `medium → amber`, `hard → red`. Keep these consistent everywhere.

---

## DESIGN DIRECTION: "COMMAND CENTER"

**Visual language**: Dense information architecture that never feels cluttered. Think of a Bloomberg terminal crossed with Linear's issue tracker. Every pixel earns its place. Dark background. Ice-blue accents. Monospace for IDs and numbers. Sharp borders. No rounded-pill buttons inside data tables — use sharp `rounded-lg` or `rounded-xl` only.

**Typography rules**:
- Headings: `font-extrabold tracking-[-0.03em]` (already used, keep)
- Table data: regular weight, `text-sm`
- IDs / counts / numbers: `font-mono text-xs`
- Labels / column headers: `text-[11px] uppercase tracking-widest font-bold text-muted-2`
- Empty states: centered, icon first, then bold label, then muted description

**Interaction rules**:
- Every destructive action needs a `confirm()` or a two-step confirmation (already implemented in delete-buttons.tsx — keep this pattern)
- Row hover: `hover:bg-surface-2/60 transition-colors`
- Selected rows: `bg-accent-electric/5 ring-1 ring-inset ring-accent-electric/20`
- Buttons loading state: replace text with spinner + "…" suffix

---

## REBUILD SPECIFICATIONS — FILE BY FILE

---

### 1. `src/app/(admin)/layout.tsx` — The Shell

**Problems**: Sidebar links for Dashboard and Questions both point to `/admin` (duplicate). Bell icon does nothing. Mobile has no sidebar.

**Changes**:
- Fix sidebar `SidebarLink` hrefs:
  - Dashboard → `/admin`
  - Questions → `/admin` (this is fine, it's the main page)
  - Subjects → `/admin/subjects`
  - Exam Bank → `/admin/exam-bank`
  - Weekly Exams → `/admin/weekly-exams`
  - Import → `/admin/import`
- Add all 6 nav items to the sidebar with appropriate Lucide icons:
  - `LayoutDashboard` → Dashboard
  - `FileQuestion` (or `ListChecks`) → Questions
  - `BookOpen` → Subjects & Chapters
  - `ShieldCheck` → Exam Bank
  - `Calendar` → Weekly Exams
  - `Upload` → Import
- Remove the Bell button (it's a fake button doing nothing — dead UI)
- Add a stats ticker in the sidebar footer area showing total question count (fetch it server-side in layout, pass as prop to a client sidebar component, or just omit if too complex — don't add fake numbers)
- The `AdminNav` tab bar inside individual pages should be **removed from all pages** since the sidebar now handles all navigation. This reduces duplication.
- Add `aria-current="page"` to active sidebar links
- Keep mobile header. On mobile, sidebar stays hidden (current behavior).

---

### 2. `src/app/(admin)/admin/admin-nav.tsx`

**Action**: **Delete this file.** Navigation is now fully handled by the sidebar in layout.tsx. Remove all `<AdminNav />` imports from `admin/page.tsx` and `admin/subjects/page.tsx`.

---

### 3. `src/app/(admin)/admin/page.tsx` — Question Management Hub

This is the most important page. It needs the biggest upgrade.

**Current problems**:
- No search (can't find a question by text)
- No filter by subject / chapter / difficulty / type
- Truncated statement (max-w-[280px] truncate) — you can't read questions at all
- pageSize is hardcoded 15 with no option to change it
- Delete All button is dangerous (no rate-limit, just a confirm dialog)

**New layout — 3-zone architecture**:

```
┌─────────────────────────────────────────────────────┐
│ HEADER BAR: "Question Management"  [Import] [+ Add] │
│ subtitle: 1,243 total • 87 MCQ • 156 Numerical      │
├─────────────────────────────────────────────────────┤
│ FILTER BAR: [Search input] [Subject ▼] [Diff ▼]    │
│             [Type ▼]       [Clear filters]          │
├─────────────────────────────────────────────────────┤
│ BULK TOOLBAR (only visible when rows selected):     │
│   "42 selected" [Delete selected] [Clear]           │
├─────────────────────────────────────────────────────┤
│ QUESTIONS TABLE (see below)                         │
├─────────────────────────────────────────────────────┤
│ PAGINATION                                          │
└─────────────────────────────────────────────────────┘
```

**Server-side search + filter**:
Add these to `searchParams`: `q` (text search), `subject` (subject_id), `difficulty`, `type`, `page`.

In `page.tsx`:
```typescript
// Build Supabase query dynamically
let query = supabase
  .from('questions')
  .select('id, statement, type, difficulty, image_url, chapters(name, subjects(id, name))', { count: 'exact' })

if (params.q) query = query.ilike('statement', `%${params.q}%`)
if (params.difficulty) query = query.eq('difficulty', params.difficulty)
if (params.type) query = query.eq('type', params.type)
// For subject filter, you need to join through chapters — use a subquery or filter client-side after fetch

query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1)
```

Also fetch subjects list for the filter dropdown:
```typescript
const { data: subjects } = await supabase.from('subjects').select('id, name').order('name')
```

Pass `subjects`, `filters: { q, subject, difficulty, type }`, and `totalCount` as props to a new client component `<QuestionFilters />`.

**Stats bar** (below heading): Show `{totalCount} total`, `{mcqCount} MCQ`, `{numCount} Numerical`, `{easyCount} Easy`, `{medCount} Medium`, `{hardCount} Hard`. Fetch these as separate count queries or compute from the current page (note: counts should be of the full unfiltered dataset for the stats bar, but filtered dataset for the table).

**pageSize options**: Add `?pageSize=15|25|50|100` to searchParams. Default 25.

---

### 4. `src/app/(admin)/admin/questions/questions-table.tsx` — The Power Table

Complete rewrite. This is where admins spend 90% of their time.

**Two view modes — add a toggle in the header**:

#### MODE A: Compact Table (default)
Columns: `[ ] | ID | Subject › Chapter | Statement (truncated 60 chars) | Diff | Type | Actions`

Each row has an **expand chevron** (`ChevronDown`) in the rightmost cell. Clicking the row (not the checkbox) **expands it inline** — the row grows to show the full question statement, all options (for MCQ) or correct answer (numerical), hint, solution, and a row of action buttons (View / Edit / Delete). This avoids navigation for quick reviews.

Expanded row markup:
```tsx
<tr key={`${q.id}-expanded`} className="bg-surface-2/30">
  <td colSpan={8} className="px-8 py-5">
    <div className="space-y-4 max-w-3xl">
      <p className="text-foreground text-sm leading-relaxed">{q.statement}</p>
      {q.image_url && <img src={q.image_url} className="max-h-48 rounded-xl border border-border object-contain" />}
      {q.type === 'mcq' && (
        <div className="grid grid-cols-2 gap-2">
          {q.options.map((opt, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
              opt.is_correct 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold' 
                : 'bg-surface border-border text-muted'
            }`}>
              <span className="text-xs font-mono text-muted-2">{['A','B','C','D'][i]}.</span>
              {opt.text}
              {opt.is_correct && <span className="ml-auto text-[10px] font-bold">✓ CORRECT</span>}
            </div>
          ))}
        </div>
      )}
      {q.type === 'numerical' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-2 font-bold uppercase tracking-wider">Answer:</span>
          <span className="font-mono text-emerald-400 font-bold">{q.correct_answer}</span>
        </div>
      )}
      {q.hint && (
        <div className="flex items-start gap-2 text-xs text-amber-400/80">
          <span className="font-bold shrink-0">Hint:</span>
          <span>{q.hint}</span>
        </div>
      )}
      {q.solution && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer text-accent-cyan font-bold hover:text-accent-glow transition-colors">Show solution</summary>
          <p className="mt-2 leading-relaxed">{q.solution}</p>
        </details>
      )}
    </div>
  </td>
</tr>
```

The expanded row needs the question's `options` — so **update the Supabase query** in `page.tsx` to also select `options:question_options(id, text, is_correct)`.

#### MODE B: Card Grid
A 2-column (desktop) or 1-column (mobile) card view. Each card shows:
- Top row: `[Subject chip] [Chapter chip] [Diff badge] [Type badge]`
- Statement (max 3 lines, `line-clamp-3`)
- Bottom: `[Q-001 monospace ID] ... [View] [Edit] [Delete]`

Cards have a thin left accent border whose color matches difficulty (emerald/amber/red).

**Toggle UI**: Two icon buttons at the top-right of the table header — `LayoutList` (table) and `LayoutGrid` (cards) — stored in `useState`. No URL persistence needed.

**Bulk select improvements**:
- Keep existing multi-select logic
- Add "Select all X questions on all pages" message when all on current page are selected: _"All 25 on this page selected. Select all 1,243?"_ button appears.
- Bulk toolbar: slide in from top with `translate-y` animation, not just opacity

**Column sorting** (client-side on current page data, no server round-trip):
- Clickable column headers for: Statement (alpha), Difficulty, Type
- Show `▲` / `▼` sort indicator

---

### 5. `src/app/(admin)/admin/questions/new/page.tsx` — Add Question Form

**Problems**: Full page form, feels like a 2010 CRUD app. No LaTeX preview. No keyboard shortcut to submit.

**New design: Two-panel split layout on desktop**

```
┌─────────────────────┬──────────────────────┐
│   FORM (left)       │   LIVE PREVIEW (right)│
│   scrollable        │   sticky              │
└─────────────────────┴──────────────────────┘
```

Left panel (form):
- Group fields into visual sections with subtle `border-b` dividers:
  - **Metadata**: Subject, Chapter, Type, Difficulty, Destination (public/exam) — in a 2×3 grid
  - **Content**: Statement textarea, Image upload
  - **Options**: MCQ radio options or Numerical input
  - **Extras** (collapsible `<details>`): Solution, Hint, Tags

Right panel (live preview, sticky):
- Shows exactly how the question will look to a student
- Statement rendered as plain text (LaTeX rendering is already in the codebase via `<Latex>` component at `src/components/ui/latex.tsx` — USE IT HERE for preview)
- Difficulty + type badges shown
- Options listed with A/B/C/D labels
- Correct answer highlighted in green
- "This is a preview" faint watermark at bottom

On mobile: single column, no preview panel (or a collapsible preview accordion below the form).

**Other improvements**:
- `Cmd+Enter` / `Ctrl+Enter` submits the form (add `keydown` listener on the form)
- Auto-focus the statement textarea on mount
- After successful submission, show a success toast and offer "Add another question" or "Back to questions" — don't just silently redirect
- Image upload zone: add drag-and-drop with `onDragOver`/`onDrop` handlers in addition to click-to-upload

---

### 6. `src/app/(admin)/admin/questions/[questionId]/edit/edit-client.tsx` — Edit Form

Same two-panel layout as the new form. The only differences:
- Heading says "Edit Question" with the question ID shown as a `font-mono` badge
- A "View live" link appears in the preview panel header (links to `/questions/{id}`)
- Show `created_at` date at the very top as metadata
- Keep all existing state management and image upload logic — just wrap it in the new layout

---

### 7. `src/app/(admin)/admin/exam-bank/page.tsx` — Exam Bank

**Problems**: No search or filter. No quick-expand to see full question. Stats row only shows 3 numbers.

**New layout**:
```
┌──────────────────────────────────────────────────┐
│ 🔒 Exam Bank   [247 questions]  [Bulk Import] [+] │
│ Questions hidden from students during practice.   │
├──────────────────────────────────────────────────┤
│ [Search]  [Subject ▼]  [Difficulty ▼]  [Type ▼] │
├──────────────────────────────────────────────────┤
│ Stats: 247 total | 180 MCQ | 67 Numerical        │
│        89 Easy | 102 Medium | 56 Hard            │
├──────────────────────────────────────────────────┤
│ Table (same expand-row pattern as main table)    │
│ Columns: # | Statement | Subject/Chapter | Type | Diff | Actions │
└──────────────────────────────────────────────────┘
```

Convert to a client component so filtering can be done client-side (data is already fully loaded — no pagination on exam bank page currently). Add `useState` for filter state.

Add action buttons per row: **Edit** (links to `/admin/questions/{id}/edit`) and **Move to Practice Pool** (calls a server action `moveQuestionVisibility(id, 'public')`). Create this server action in `exam-bank/actions.ts`.

---

### 8. `src/app/(admin)/admin/weekly-exams/page.tsx` — Weekly Exams

**Problems**: Table has no actions. Can't delete or edit an exam. Status column could be more visual.

**New additions**:
- Status badges: Live gets a `●` pulsing green dot + "Live" text. Upcoming gets a countdown timer ("Starts in 2h 34m" computed client-side). Ended is grayed out.
- Actions column: **Edit** (if you add an edit page) or at minimum **Delete exam** button
- Clicking a row expands to show `question_ids` count and a "Preview Questions" button
- Published toggle: inline toggle switch per row that calls a server action `toggleExamPublished(id, !is_published)` — create this in `weekly-exams/actions.ts`
- Empty state: add a CTA button for "Create your first weekly exam"

**Make it a client component** so the countdown timers can update without page refresh (use `useEffect` + `setInterval` to recalculate time remaining every 30 seconds).

---

### 9. `src/app/(admin)/admin/subjects/page.tsx` — Subjects & Chapters

**Current**: Grid of subject cards. Works but chapter management is hidden.

**New layout**: Split view — subjects in left panel, chapters in right panel when a subject is selected.

```
┌──────────────────┬─────────────────────────────────┐
│ SUBJECTS         │ CHAPTERS in Physics              │
│ ── Physics ──    │  ─────────────────────────────  │
│   892 questions  │  1. Kinematics          [47 Qs] │
│ Chemistry        │  2. Laws of Motion      [31 Qs] │
│   456 questions  │  3. Work & Energy       [28 Qs] │
│ Mathematics      │  ⋮                              │
│   734 questions  │  [+ Add Chapter]                │
└──────────────────┴─────────────────────────────────┘
```

Both panels are client-side with `useState` for selected subject. Chapters are fetched via Supabase client on subject selection (already done in existing pages). Chapter items show question count and have a delete button that calls the existing `DeleteSubjectButton` pattern.

Add **"+ Add Subject"** button at the top of subjects panel that shows an inline input form (not a new page).

Add **"+ Add Chapter"** button at the bottom of the chapters panel — inline input, not a new page. The server action `createChapter(subjectId, name)` needs to be added to `admin/actions.ts`.

---

### 10. `src/app/(admin)/admin/import/page.tsx` — Bulk Import

**Current**: 3-step wizard. Good structure, bad styling.

**Keep the 3-step logic completely intact.** Only upgrade the visual treatment:

**Step indicator** at the top:
```
  ① Upload JSON  ──────────  ② Preview  ──────────  ③ Result
  [filled dot]            [empty dot]            [empty dot]
```

Use a progress bar between steps with `width` transition animation.

**Step 1 - Upload**:
- Larger drop zone (min-height 200px) with a dashed animated border on drag-over
- Show JSON format hint with a collapsible `<details>` showing the expected schema
- Add a "Download sample JSON" button that triggers download of a minimal example

**Step 2 - Preview**:
- Show valid vs. invalid counts in a `bg-emerald-500/10` / `bg-red-500/10` summary banner
- Valid questions in a scrollable table with statement preview and chapter/difficulty
- Invalid questions below with the error reason per row
- "Import X valid questions" CTA is prominent; "Cancel" link is subtle

**Step 3 - Result**:
- Big success number (`{insertedCount} questions imported`) in `text-5xl font-extrabold text-emerald-400`
- Secondary info: skipped (duplicates) + errors
- Two buttons: "Import more" (resets to step 1) and "View Questions" (links to `/admin`)

---

### 11. `src/app/(admin)/admin/questions/delete-buttons.tsx`

No functional changes. Just make sure `DeleteAllQuestionsButton` is hidden behind a "Danger zone" collapsible section on the main page — not just floating in the header. It's too easy to accidentally press right now.

---

## SHARED COMPONENTS TO CREATE

Create these reusable components at `src/components/admin/`:

### `src/components/admin/stats-bar.tsx`
```tsx
// Renders a horizontal strip of labeled number chips
// Props: stats: { label: string; value: number; color?: string }[]
```

### `src/components/admin/filter-bar.tsx`
```tsx
// Search input + multiple Select dropdowns + Clear filters link
// Renders as an uncontrolled form that updates URL searchParams via router.push()
// Props: subjects, currentFilters
```

### `src/components/admin/question-card.tsx`
```tsx
// The card view variant for a single question
// Used in card-grid mode on the main table
// Props: question (with options), index, isSelected, onToggleSelect
```

### `src/components/admin/expandable-row.tsx`
```tsx
// Wrapper that manages open/close state for an expanded table row
// Exports: ExpandableRow (the <tr>), ExpandedContent (the detail <tr>)
```

### `src/components/admin/question-preview.tsx`
```tsx
// The right-panel live preview in Add/Edit question forms
// Props: statement, type, options, correctAnswer, difficulty, hint, imageUrl
// Uses the existing <Latex> component from src/components/ui/latex.tsx
```

---

## CSS ADDITIONS NEEDED

Add to `src/app/globals.css` (or wherever the global styles live):

```css
/* Pulsing live indicator */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
.live-dot {
  animation: pulse-dot 1.5s ease-in-out infinite;
}

/* Slide-down for bulk toolbar */
@keyframes slide-down {
  from { transform: translateY(-8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.animate-slide-down {
  animation: slide-down 0.18s ease-out forwards;
}

/* Step indicator connector line */
.step-connector {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--border-strong), var(--border));
}
.step-connector.done {
  background: var(--accent-electric);
}
```

---

## IMPLEMENTATION ORDER

Attack in this sequence to avoid broken states:

1. **`layout.tsx`** — fix sidebar links, add all nav items, remove Bell button
2. **Delete `admin-nav.tsx`** — remove all its imports
3. **`questions/questions-table.tsx`** — full rewrite with expand rows + card mode
4. **`admin/page.tsx`** — add filter/search searchParams, update Supabase query to include options, compute stats
5. **`filter-bar.tsx`** component
6. **`question-card.tsx`** component  
7. **`question-preview.tsx`** component
8. **`questions/new/page.tsx`** — two-panel layout
9. **`questions/[id]/edit/edit-client.tsx`** — two-panel layout
10. **`exam-bank/page.tsx`** — client component with filtering
11. **`weekly-exams/page.tsx`** — client component with live countdown
12. **`subjects/page.tsx`** — split panel layout
13. **`import/page.tsx`** — upgrade visual treatment only (don't touch logic)
14. **`delete-buttons.tsx`** — move Delete All into a danger zone section

---

## QUALITY CHECKLIST (verify each before calling done)

- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All existing server actions still work (same function signatures)
- [ ] Supabase query for questions includes `options:question_options(id, text, is_correct)` on the main admin page
- [ ] Filter bar updates URL (not just local state) so filters survive page refresh
- [ ] Multi-select state resets when navigating pages
- [ ] Expand row closes when you click another row
- [ ] Card / table toggle persists in `localStorage` (not URL)
- [ ] Images in expanded rows load with `loading="lazy"` and `unoptimized` (they're from imgbb)
- [ ] Mobile: sidebar hidden, header visible, table horizontally scrollable
- [ ] Empty states for every table (no questions, no exams, no subjects)
- [ ] All delete confirmations still work
- [ ] Import wizard: step indicator updates on each transition
- [ ] Weekly exams: countdown timers start on mount and clean up on unmount
- [ ] Subjects/chapters split panel: selecting a subject fetches chapters via Supabase client
- [ ] Two-panel question form: preview updates live as user types (use controlled inputs, sync preview via state)
- [ ] Keyboard shortcut (Cmd+Enter) submits question form
- [ ] "Delete All" button is inside a collapsible "Danger zone" — not freely accessible

---

## TONE REMINDER

The final product should feel like something an engineer would be **proud to demo**. Not just functional — genuinely impressive. The existing codebase already has a solid dark-mode design system with great CSS variables. This rebuild is about composing that system **masterfully**, not replacing it. Use what's there. Add what's missing. Elevate what's weak.

**When in doubt, look at how Linear, Supabase Dashboard, Vercel Dashboard, and Raycast handle information density. That's the target.**