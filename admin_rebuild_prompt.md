# Admin Panel — Classic Design Overhaul

**Goal:** Make every admin page feel like a real, distinct, professional admin interface — not a dark soup of identical panels. Each page needs visual identity, clear hierarchy, and honest contrast.

**Rules:** Don't touch server actions, Supabase queries, or exported function signatures. Only change JSX structure and classNames.

---

## Core Problem
Every page looks identical because everything uses `bg-surface` + `border border-white/[0.08]`. These are near-invisible differences on a dark background. The fix is structure + color, not opacity tweaks.

---

## 1. Design Rules to Apply Everywhere

**Surfaces:** Use `bg-[#0f1117]` for page bg, `bg-[#161b27]` for cards/panels, `bg-[#1c2333]` for table headers and inputs. These are actual hex values that render visibly different.

**Borders:** `border border-[#2a3142]` — a visible but not harsh separator.

**Page-level color identity** — every admin page has one accent color. Use it consistently for icons, badges, and CTA buttons on that page:
- PYQ Questions → `blue` (existing accent-electric)
- Exam Bank → `violet`  
- Weekly Exams → `amber`
- Import → `sky`

**Border radius — reduce everywhere:** The codebase overuses `rounded-2xl` and `rounded-xl` on everything — cards, tables, buttons, inputs, badges — making it look bubbly and toy-like instead of sharp and professional. Apply this system as a blanket rule across every file:
- Large panels, table containers, page section cards → `rounded-lg`
- Buttons, inputs, selects, dropdowns → `rounded-md`
- Small badges, status pills, count chips → `rounded` or `rounded-sm`
- Only exceptions allowed: sidebar brand icon box and stat card icon boxes can keep `rounded-lg`
- Do a find-and-replace pass: `rounded-2xl` → `rounded-lg`, `rounded-xl` → `rounded-md` everywhere in the admin folder

**Stat cards:** Large bold number on top (`text-3xl font-black`), small muted label below, left accent border matching the page color, fixed width `min-w-[120px]`.

**Table rows:** `border-b border-[#1e2536]` between rows. Header row `bg-[#1c2333]`. Odd rows stay bg, even rows get `bg-[#161b27]` — you should clearly see the difference.

**Sidebar active state:** Replace the current subtle tint with a solid `bg-[#1a2035] border-l-2 border-l-blue-500 text-white` — clearly visible.

---

## 2. layout.tsx — Sidebar

Convert the sidebar into a **collapsible client component** (`'use client'`). Add a toggle button that collapses the sidebar to icon-only mode and expands it back to full width.

**Collapse behavior:**
- Expanded: `w-[220px]` — shows icon + label for every nav item
- Collapsed: `w-[56px]` — shows only icons, no labels, no text anywhere
- Toggle persists in `localStorage` under key `admin-sidebar-collapsed`
- Transition: `transition-all duration-200` on the `<aside>` width
- Main content area `md:ml-[220px]` / `md:ml-[56px]` must update in sync — pass `collapsed` state via a context or lift it to a shared client wrapper component

**Toggle button:**
- Position: bottom of nav links, above the user footer, full width
- Collapsed state: shows `ChevronRight` icon centered
- Expanded state: shows `ChevronLeft` icon + "Collapse" text
- Style: `w-full flex items-center gap-2 px-3 py-2 rounded-md text-muted-2 hover:bg-[#1a2035] hover:text-white text-xs font-medium transition-colors`

**Collapsed nav items:**
- Each `SidebarLink` in collapsed mode: show only the icon, centered, with a `title` tooltip attribute for hover label
- Hide all text labels with `hidden` when collapsed
- Active state in collapsed mode: `bg-[#1a2035] border-l-2 border-l-blue-500` still applies, just no text

**Brand area in collapsed mode:**
- Show only the icon box `size-8 bg-blue-600 rounded-lg`, centered — hide "Freetime" and "Admin Console" text

**User footer in collapsed mode:**
- Show only the avatar initial circle, centered — hide email and "Admin" label

**Nav icons — replace all four with purpose-specific choices:**

| Route | Current | Replace with | Why |
|---|---|---|---|
| PYQ Questions | `BookOpen` | `FileQuestion` | Direct — a file with a question mark, instantly reads as "question bank" |
| Exam Bank | `ShieldCheck` | `Archive` | Implies stored/locked-away content, not security/verification |
| Weekly Exams | `Calendar` | `CalendarClock` | Calendar + clock = scheduled timed exam, far more specific |
| Import | `Upload` | `FolderInput` | Data going into a folder/system, more accurate than a generic upload arrow |
| Back to App | `ArrowLeft` | `LayoutDashboard` | Makes it clear you're going to the main dashboard, not just "back" |

Import all five from `lucide-react`. Remove `BookOpen`, `ShieldCheck`, `Calendar`, `Upload`, `ArrowLeft` imports.

**Icon sizing:** Use `h-4 w-4` (16px) for all nav icons — the current `h-[18px]` is slightly large and causes the icon to dominate the row. In collapsed mode, center the icon in the `56px` sidebar with `mx-auto`.

**Icon color in expanded mode:** Each icon gets its page accent color when active:
- FileQuestion (active) → `text-blue-400`
- Archive (active) → `text-violet-400`
- CalendarClock (active) → `text-amber-400`
- FolderInput (active) → `text-sky-400`
- LayoutDashboard → `text-muted-2` always (it's a utility link, not a section)

Inactive state: all icons `text-muted-2`. On hover: `text-white`.

**Tooltip in collapsed mode:** Add `title={label}` on each nav item `<a>` so hovering shows the label in a native browser tooltip — cheap, zero JS, still useful.

**Sidebar general styling:**
- Background: `bg-[#0d1117]`
- Active nav item: `bg-[#1a2035] border-l-2 border-l-blue-500` with accent-colored icon and `text-white font-semibold` label
- Inactive nav item: `text-muted-2 hover:bg-[#1a2035] hover:text-white transition-colors`
- User footer card: `bg-[#161b27] border border-[#2a3142] rounded-md`
- Divider between nav and footer: `border-t border-[#2a3142]`

---

## 3. New Page — `src/app/(admin)/admin/dashboard/page.tsx`

Create this as a **server component**. This is the new landing page for the admin area. Add `LayoutDashboard` to the sidebar as the first nav link pointing to `/admin/dashboard` (exact match). Keep `/admin` as the questions page — don't redirect.

**All data fetched in parallel with `Promise.all`:**
```
- questions total count
- questions this week (created_at > 7 days ago) count
- exam bank count (visibility = 'exam')
- mcq count, numerical count
- easy/medium/hard counts
- weekly_exams total count
- live exams (starts_at <= now <= ends_at)
- upcoming exams (starts_at > now, order by starts_at asc, limit 3)
- last 5 questions (order created_at desc, select id/statement/difficulty/type/chapters)
```

**Page layout — three zones:**

**Zone 1 — Stat cards row (`grid grid-cols-2 lg:grid-cols-4 gap-4`):**

Four cards, each `bg-[#161b27] border border-[#2a3142] rounded-lg p-5`:

| Card | Icon | Accent | Primary number | Subtitle |
|---|---|---|---|---|
| Total Questions | `FileQuestion` | blue | total count | `+{thisWeek} this week` |
| Exam Bank | `Archive` | violet | exam bank count | `{examMcq} MCQ · {examNum} Num` |
| Weekly Exams | `CalendarClock` | amber | total weekly exams | `{liveCount} live now` |
| Live Right Now | `Radio` | emerald (pulse dot) | live exams count | `{upcomingCount} upcoming` |

Card internal layout:
```
[icon box 36px]                [big number text-3xl font-black]
                               [subtitle text-xs text-muted-2]
[label text-xs uppercase muted, bottom of card]
```
Icon box: `size-9 rounded-md bg-[accent]/10 border border-[accent]/20 flex items-center justify-center` with icon in accent color.

**Zone 2 — Two column grid (`grid grid-cols-1 lg:grid-cols-5 gap-5 mt-6`):**

**Left col (3/5 width — `lg:col-span-3`):**

*Content Health card* (`bg-[#161b27] border border-[#2a3142] rounded-lg`):
- Header bar: `bg-[#1c2333] border-b border-[#2a3142] px-5 py-3` — title "Content Health" + subtitle "Difficulty & type distribution"
- Body `px-5 py-4 space-y-4`:
  - **Difficulty bars** — three rows (Easy, Medium, Hard). Each row: label on left, a `rounded-sm h-2 bg-[#1c2333]` track taking `flex-1`, filled portion `bg-emerald-500/60` / `bg-amber-500/60` / `bg-red-500/60` with `style={{ width: percent + '%' }}`, count + percentage on right in `font-mono text-xs text-muted-2`. Calculate percent = (count / total) * 100.
  - Thin `border-t border-[#2a3142] my-3`
  - **Type split** — two columns side by side. MCQ: big `text-2xl font-black text-foreground` number + `text-xs text-muted-2` label "MCQ". Numerical: same. Separated by a `w-px bg-[#2a3142]` divider.

*Recent Questions card* (below health card, `mt-4`):
- Header bar: title "Recent Questions" + `Link` "View all →" to `/admin` in `text-xs text-blue-400`
- List of last 5 questions, each row `border-b border-[#1e2536] last:border-0 px-5 py-3 flex items-start gap-3 hover:bg-[#1a2035] transition-colors`:
  - Left: `font-mono text-[10px] text-muted-2 w-8 shrink-0 pt-0.5` — sequential number
  - Middle: `text-sm text-foreground line-clamp-1 flex-1` — statement. Below it: subject name in `text-[11px] text-muted-2`
  - Right: difficulty badge + `Link` "Edit" in `text-[11px] text-blue-400 hover:underline`

**Right col (2/5 width — `lg:col-span-2`):**

*Quick Actions card* (`bg-[#161b27] border border-[#2a3142] rounded-lg`):
- Header bar: "Quick Actions"
- Body `p-3 space-y-2`: Three action buttons, each full-width `w-full flex items-center gap-3 px-4 py-3 rounded-md bg-[#1c2333] border border-[#2a3142] hover:border-[#3a4152] hover:bg-[#1e2536] transition-all text-left`:
  - `FileQuestion` in blue-400 + "Add Question" bold + "Add a new PYQ or exam question" muted text below
  - `FolderInput` in sky-400 + "Bulk Import" + "Upload a JSON file of questions"
  - `CalendarClock` in amber-400 + "Create Weekly Exam" + "Schedule a new timed exam"
- Each button is a `Link` wrapping the entire row

*Scheduled Exams card* (`bg-[#161b27] border border-[#2a3142] rounded-lg mt-4`):
- Header bar: "Scheduled Exams" + `Link` "View all →" to `/admin/weekly-exams`
- Shows upcoming 3 exams (fetched server-side, `starts_at > now, order asc, limit 3`). Each row `border-b border-[#1e2536] last:border-0 px-4 py-3`:
  - Exam title `font-medium text-sm text-foreground line-clamp-1`
  - Below: status badge (Live = emerald, Upcoming = amber, Ended = muted) + starts_at date in `text-[11px] text-muted-2`
  - Right: `{question_ids.length} Qs` in `font-mono text-[11px] text-muted-2`
- Empty state: `py-8 text-center text-sm text-muted-2` — "No upcoming exams" + Link "Create one →"

---



**Replace the entire header section** with a proper stat dashboard above the table:

Four stat cards in a row (`grid grid-cols-2 md:grid-cols-4 gap-4`), each card `bg-[#161b27] border border-[#2a3142] rounded-2xl p-5`:
- Total Questions (blue accent, `BookOpen` icon)
- MCQ (cyan accent, `CheckSquare` icon)  
- Numerical (violet accent, `Hash` icon)
- Hard Questions (red accent, `Flame` icon)

Each card layout:
```
[Icon in colored rounded-lg]     [number text-3xl font-black]
                                 [label text-xs text-muted uppercase]
```

The existing `StatsBar` pills row: remove it. Replace with these cards.

**Filter bar:** Give it `bg-[#161b27] border border-[#2a3142]` — should look like a solid panel, not a ghost container. The native selects: wrap each one in `bg-[#1c2333] border border-[#2a3142] rounded-lg` and use the existing `admin-select` class.

**Table:** 
- Container: `bg-[#161b27] border border-[#2a3142] rounded-2xl overflow-hidden`
- Header row: `bg-[#1c2333] border-b border-[#2a3142]`
- Even rows: `bg-[#0f1117]`, odd rows default — actual visible alternation
- Row hover: `hover:bg-[#1a2035] transition-colors`
- Column widths: ID `w-20`, Subject/Chapter `w-44`, Statement takes remaining space, Difficulty `w-24`, Type `w-20`, Actions `w-32`

**View toggle (Table/Cards):** Make it a real segmented control, not two icon-only buttons. Show text labels. Put it inside the table container header bar alongside a `{count} questions` label on the left.

---

## 5. exam-bank/page.tsx — Exam Bank

- Page header: violet color identity. Header icon box `bg-violet-600 rounded-xl`. Title `text-2xl font-black`. Subtitle showing count.
- Add 3 stat cards above the table: Total Exam Qs, MCQ, Numerical — same card design as above but violet accent.
- Table: same `bg-[#161b27] border border-[#2a3142]` pattern. Header `bg-[#1c2333]`.
- The filter row goes inside a `bg-[#161b27] border border-[#2a3142] rounded-xl p-3` container.
- Each row: show a small `EXAM` badge in violet to distinguish visually from the public questions table.

---

## 6. weekly-exams/page.tsx — Weekly Exams

- Page header: amber color identity. Icon box `bg-amber-500/20 border border-amber-500/30 rounded-xl`. `Calendar` icon in amber.
- The table is the main UI here. Make it readable:
  - Status column: `Live` = solid `bg-emerald-600 text-white rounded-full px-2.5 py-0.5 text-[11px] font-bold`. `Upcoming` = `bg-amber-500/20 text-amber-400 border border-amber-500/30`. `Ended` = `bg-[#1c2333] text-muted-2 line-through`.
  - Published toggle: increase to `h-6 w-11` — current `h-5 w-9 scale-90` is too small and clearly invisible
  - The `Details` expand button: proper `bg-[#1c2333] border border-[#2a3142] rounded-lg px-3 py-1 text-xs` — not a plain text link
  - Expanded detail row: `bg-[#0d1117] border-l-4 border-l-amber-500/40`

---

## 7. questions/new/page.tsx + edit-client.tsx — Question Form

The form currently has sections that blend into each other. Fix:
- Each form section (`Metadata`, `Content`, `Answer`, `Extras`) = separate `bg-[#161b27] border border-[#2a3142] rounded-2xl` card with `mb-4` gap
- Section header row: `bg-[#1c2333] border-b border-[#2a3142] px-5 py-3 text-xs font-bold uppercase tracking-widest text-muted-2`
- Input fields: `bg-[#1c2333] border border-[#2a3142]` — clearly different from the card background
- The live preview panel (right side): `bg-[#0d1117] border border-[#2a3142] rounded-2xl` — should feel like a terminal/preview area, darker than the form
- Preview header bar: `bg-[#1c2333] border-b border-[#2a3142] px-4 py-2.5 text-xs font-bold uppercase tracking-widest`

---

## 8. import/page.tsx — Import

- Step indicator: make active step circle solid `bg-blue-600 text-white`, done steps `bg-emerald-600/20 text-emerald-400 border border-emerald-600/30`, pending `bg-[#1c2333] border border-[#2a3142] text-muted-2`
- Dropzone: `bg-[#0d1117] border-2 border-dashed border-[#2a3142] hover:border-blue-500/50 rounded-2xl` — bigger min-height `min-h-[180px]`, centered content
- The primary action button should be `bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6 py-2.5` — consistent, not cyan/black

---

## Implementation Order

1. `globals.css` — CSS vars: `--panel: #161b27`, `--panel-dark: #0d1117`, `--panel-header: #1c2333`, `--border-subtle: #2a3142`
2. `layout.tsx` → extract `AdminSidebarClient` — collapse toggle, new icons (`FileQuestion`, `Archive`, `CalendarClock`, `FolderInput`, `LayoutDashboard`), localStorage, synced margin. Add Dashboard as first nav link.
3. `admin/dashboard/page.tsx` — create from scratch: 4 stat cards + content health + recent questions + quick actions + scheduled exams
4. `stats-bar.tsx` — repurpose or delete (dashboard inlines its own cards)
5. `admin/page.tsx` — remove stat pills from header, keep filter + table. Downgrade all `rounded-2xl` → `rounded-lg`.
6. `questions-table.tsx` — alternating rows, view toggle with labels, real table header bg
7. `filter-bar.tsx` — solid panel bg, styled selects
8. `exam-bank/page.tsx` — violet identity, stat cards, table styling
9. `weekly-exams/page.tsx` — amber identity, bigger toggle, status badges, details button
10. `new/page.tsx` + `edit-client.tsx` — section cards with header bars, preview panel
11. `import/page.tsx` — step circles, dropzone, consistent button color
12. **Global pass** — find every `rounded-2xl` → `rounded-lg`, `rounded-xl` → `rounded-md` in the entire `(admin)/` folder