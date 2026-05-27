# Student Dashboard — Professional UI Prompt

**Scope:** Student-facing pages only. Light theme. Fix real bugs first, then visual improvements. No heavy CSS — no complex animations, no backdrop-blur spam. Do not touch server actions or Supabase queries.

---

## BUGS TO FIX FIRST (broken right now)

### Bug 1 — Today highlight never works in Weekly Pulse chart
**File:** `src/app/(dashboard)/dashboard/page.tsx` line ~71

`weekDays` is built like:
```ts
weekDays.push({ label: 'M', date: String(d.getUTCDate()), ... })  // date = "27"
todayKey = "2026-05-27"
```
Then in `dashboard-client.tsx`:
```ts
day.date === todayKey  // "27" === "2026-05-27" → always false
```
Fix: change `date: String(d.getUTCDate())` to `date: d.toISOString().split('T')[0]` so it matches `todayKey` format.

### Bug 2 — Progress bar hardcoded on Subjects page
**File:** `src/app/(dashboard)/subjects/page.tsx` line ~75

```tsx
<div className="progress-fill w-[12%]" />  // hardcoded — every subject shows 12%
```
The `sp` (subject progress) object is computed in `dashboard/page.tsx` but not passed here. Fix: compute actual progress in `subjects/page.tsx` using `attempts` and `allQuestions` the same way the dashboard does, then set:
```tsx
const pct = sp[subject.name] ? Math.round((sp[subject.name].solved / sp[subject.name].total) * 100) : 0
<div className="progress-fill" style={{ width: `${pct}%` }} />
```
Also show the percentage number: `{pct}% complete` below the bar.

### Bug 3 — Two sidebar links both go to `/subjects`
**File:** `src/app/(dashboard)/layout.tsx` lines 57–58

```tsx
<SidebarLink href="/subjects" label="Learn" />
<SidebarLink href="/subjects" label="Practice" />  // same href!
```
"Practice" should go to `/tests` (the tests page). Fix: `href="/tests"` for the Practice link. Also change its icon from `FlaskConical` to `ClipboardList` which already exists in the import.

### Bug 4 — Card inner wrapper hardcodes `p-5` making `p-0` overrides useless
**File:** `src/components/site/dashboard-ui.tsx` line ~43

```tsx
<div className="relative z-10 p-5">{children}</div>  // p-5 always applied
```
This means `<Card className="p-0 overflow-hidden">` still has padding from the inner div. Fix: remove the inner wrapper entirely and apply `p-5` as a default `className` merged with the prop:
```tsx
export function Card({ variant, tone, className, children, ...props }) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl ... p-5', className)} {...props}>
      {children}
      {/* sheen overlay */}
    </div>
  )
}
```
Any card that needs `p-0` can now just pass `className="p-0"` and it works.

### Bug 5 — `subjectCounts` fetches all question rows just to count them
**File:** `src/app/(dashboard)/subjects/page.tsx` line ~7

```ts
const { data: allQuestions } = await supabase.from('questions').select('id, chapters(subject_id)')
```
This transfers potentially thousands of rows just to count them in JS. Replace with a direct count per subject using the existing query structure. Simpler fix: use `.select('id', { count: 'exact', head: true })` per subject, or denormalize the count into a single aggregation query using Supabase RPC.

---

## LAYOUT IMPROVEMENTS

### Sidebar
- **Remove "Bookmarks" link entirely** — it's `disabled` and goes nowhere. A dead navigation item erodes trust. Add it back when the feature exists.
- **User card at bottom** — currently shows just initials + email. Add the student's `name` from the profile instead of deriving from email. Also add a settings gear icon that links to `/settings`.
- **Active link style** — the current `sidebar-active-bg: #eff6ff` is very subtle. Increase contrast: `background: #dbeafe; border-left: 3px solid #2563eb; font-weight: 700;`
- **Nav label text** — "Main" and "Library" section labels use `section-label` class (10px uppercase). This is fine but add `mt-4` before "Library" to visually separate the groups.

### Top Header
- **Bell notification button** — always shows a blue dot regardless of whether there are real notifications. Either remove the dot or wire it to actual notification data. A static fake badge breaks trust.
- **Right side** — currently: Bell → divider → NavAuth avatar. Good structure. On desktop, add the student's name next to the avatar: `<span className="text-sm font-semibold text-foreground hidden lg:block">{name}</span>`.

---

## DASHBOARD PAGE

### Hero Banner — Reposition and Resize
The banner takes `min-height: 180px` and is the very first thing a returning student sees above their stats. Motivational quotes are nice for day 1 but noise for day 30. Fix:

- Move the `HeroBanner` **below** the 4 stat cards — after the stats row, before the subjects section.
- Reduce its `min-height` from `180px` to `140px`.
- The quotes and carousel logic stay exactly the same — just reorder the JSX sections.

### Stat Cards — Better Subtitles
Replace generic sub text with data-driven subtitles:

| Card | Current sub | Better sub |
|---|---|---|
| Questions Solved | "Keep up the pace!" | `+{thisWeekSolved} this week` |
| Avg Accuracy | "Based on recent attempts" | `from {userAttempts.length} attempts` |
| Current Streak | "Don't break the chain" | `Best: ${bestStreak} days` (compute alongside streak) |
| Time Spent | "Total practice time" | `Avg ${avgMinPerDay}m per day` |

These require small additions to the data computed in `dashboard/page.tsx` but no new queries.

### Subject Tiles Section
Currently: `grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3` — but only 3 subjects exist, so this shows 3 tiles with 3 empty slots on desktop. Change to `grid grid-cols-3 gap-4` always. The tiles are also small (icon + name + count). Make them more substantial:

Replace `SubjectTile` with a wider card layout for the dashboard:
```
[colored icon box]  [Subject Name, bold large]
                    [X questions · Y% complete]
                    [thin progress bar]
```
This uses the `sp` subject progress data that's already passed to `DashboardClient`. Each tile becomes a proper card, not just a small icon+label.

### Weekly Pulse — Remove Redundant Numbers
The bottom of the card shows `totalSolved` and `totalTime` in `text-2xl` — but these are identical to what the 4 stat cards above already show. Remove this bottom section entirely. The chart speaks for itself.

Replace with: a 7-day summary sentence: `"You solved {weekTotal} questions this week across {activeDays} days."` in `text-sm text-muted`.

### Recent Activity — Show More Context
Currently shows: chapter name + timestamp + Correct/Wrong badge. This is useful but thin. Add one more data point per row: the question type (MCQ / Numerical) as a small secondary badge, and if `is_correct` is false, show the subject name in `text-muted-2` so students know which subject they're struggling with.

Also: the `View All` link for Recent Activity goes to `/subjects` which is wrong. It should go to `/tests` (their past sessions) or simply be removed.

### Empty State Improvements
If `userAttempts.length === 0`, the whole analytics section feels broken. Add a proper onboarding empty state:
- Replace the small "No recent attempts yet" message with a full-height card showing:
  - A simple illustration (can be an SVG or emoji-based)
  - "Start your first practice session" heading
  - "Pick a subject below to begin" subtitle
  - A direct "Start Practising →" button linking to `/subjects`

---

## SUBJECTS PAGE

### Subject Cards — Give Them Real Presence
Currently each subject card has: `icon box → subject name → "X questions available" → hardcoded 12% bar`. After fixing the progress bug, also improve the visual design:

Each card should be a `grid grid-cols-1 sm:grid-cols-3 gap-5` layout (3 subjects = 3 columns on desktop, stacked on mobile). Each card:
```
[Large icon box top-left]          [ChevronRight top-right]

[Subject Name — text-2xl font-black]
[X questions · Y chapters]

[Progress section:]
[Progress bar full width]
[Y% complete · Z solved]
```

Add the chapter count to the query: `.select('*, chapters(count)')` and show it as `X chapters`.

### Chapter Counts on Subject Page
Currently: `supabase.from('chapters').select('*')` fetches all chapter rows. Use `.select('*, questions(count)')` to get question counts per chapter in one query instead of computing them separately.

---

## TESTS PAGE

### Mode Cards
The 3 mode cards (Custom Test, JEE Mains, JEE Advanced) have a good structure but inconsistent heights because content varies. Fix: add `min-h-[240px]` to each card so they're all the same height. Also add feature bullet lists inside each card (already exists for Custom Test with the chip pills — extend this pattern to JEE Mains and Advanced).

### Past Sessions Table
The past sessions list shows: mode → score → time → date → status badge → button. This is correct but the rows are `<div>`-based and have no visual separation except `divide-y`. Small improvements:
- Score column: show `{score}/{max_score}` in bold, then below it show the percentage in `text-muted-2`
- Status badge: `completed` → show green, `in_progress` → show amber with a "Resume" button, `submitted` → show blue
- On mobile, the row is cramped — hide the "Time" column below `sm:` and show only Score + Date + Status + Action

---

## EXAMS PAGE

### Exam Cards Grid
Currently rendered in `ExamsClient` but the card design isn't visible in the read files. Ensure each exam card shows:
- Exam title + description
- Status badge (`Live`, `Upcoming`, `Attempted`, `Missed`) with appropriate colors
- For **Upcoming**: show a countdown `"Starts in Xh Ym"` computed client-side
- For **Attempted**: show score `{score}/{max_score}` + percentile if available
- For **Live**: show a pulsing green dot + "Live Now" badge + a prominent "Start Exam" CTA button
- For **Missed**: gray out the card with `opacity-60` and show "Window Closed"
- Duration chip: `{duration_minutes}m · {question_count} questions`

---

## COMPONENT IMPROVEMENTS

### `StatCard` — Add a progress indicator option
Add an optional `progress` prop (0–100). If provided, show a thin `h-1 bg-white/20 rounded-full` track at the very bottom of the card with a `bg-white/70` fill at `{progress}%`. Example: "Questions Solved" could show `(totalSolved / totalQ) * 100` as the fill.

### `Card` — After the inner wrapper fix (Bug 4), standardize usage
Any component passing `p-0` to Card for edge-to-edge content (like the Recent Activity list) will now work. Audit all Card usages and remove any manual `!p-0` hacks that were workarounds.

### `SectionHeader` — Consistent sizing
Currently `text-xl sm:text-2xl font-extrabold` for section headers and `text-3xl font-extrabold` for page headers. Add a size distinction: section headers should be `text-lg font-bold` (slightly smaller, clearly subordinate). The current `text-2xl` section headers compete visually with page titles.

---

## SPACE USAGE AUDIT

### Unused horizontal space on desktop
The `max-w-[1100px]` content width leaves significant white space on 1440px+ screens. This is intentional for readability. Don't change the max-width. Instead, ensure the two-column layouts (`lg:grid-cols-[1.2fr_0.8fr]`) actually use the full width. Currently "Weekly Pulse" and "Recent Activity" sit side by side but the left column has a lot of internal padding that wastes space.

### Between sections — too much `space-y-8`
The `space-y-8` (32px gap) between every section on the dashboard is generous but consistent. This is fine. Don't reduce it.

### Subject tiles on dashboard are underutilized
3 tiles in `grid-cols-3` at `p-4 rounded-2xl` — each tile is small. By making them into full cards with progress bars (as described above), the same space carries much more information.

---

## IMPLEMENTATION ORDER

1. **Bug 1** — Fix `day.date` format in `dashboard/page.tsx` (today highlight)
2. **Bug 3** — Fix Practice sidebar link to `/tests`
3. **Bug 4** — Fix Card component inner wrapper (enables all `p-0` cards)
4. **Bug 2** — Fix hardcoded progress bar in subjects page (needs real data)
5. **Bug 5** — Replace count query approach in subjects page
6. `layout.tsx` — Remove Bookmarks link, fix bell dot, add name next to avatar
7. `dashboard-client.tsx` — Reorder sections (stats → subjects → banner → pulse), update stat subtitles, remove redundant totals from chart, fix Recent Activity link
8. `SubjectTile` → convert to card layout with progress bar on dashboard
9. `subjects/page.tsx` — Subject cards with real progress, chapter count, better grid
10. `tests/page.tsx` — Consistent card heights, better past sessions table
11. `exams` page — Exam card improvements: countdown, live dot, missed opacity

---

## QUALITY CHECKS

- [ ] "Today" bar in Weekly Pulse chart is highlighted (different color from other bars)
- [ ] Progress bars on subjects page show real percentages, not 12%
- [ ] "Practice" sidebar link goes to `/tests`, not `/subjects`
- [ ] Cards with `p-0` show edge-to-edge content (no inner padding)
- [ ] Bell notification dot is removed or wired to real data
- [ ] "View All" in Recent Activity points to `/tests` not `/subjects`
- [ ] Bookmarks disabled link is removed from sidebar
- [ ] Subject tiles on dashboard show progress bars with real data
- [ ] "Missed" exam cards are visually grayed out
- [ ] StatCard subtitles show real data, not generic strings
- [ ] Section headers (`text-lg font-bold`) are visually smaller than page headers (`text-3xl font-extrabold`)