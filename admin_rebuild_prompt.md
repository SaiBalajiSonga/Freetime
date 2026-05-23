# Admin Panel — Visual Redesign Prompt

**Rules:** Only change className strings and markup structure. Never touch server actions, Supabase queries, or exported function signatures. No heavy CSS — no backdrop-blur, no multi-layer box-shadows, no complex animations. Simple, fast, clean.

---

## Design System to Use Throughout
- Borders: `border border-white/10`
- Surfaces: `bg-white/5` for cards, `bg-white/[0.03]` for subtle containers
- Text hierarchy: `text-foreground` / `text-muted` / `text-muted-2`
- Badges: `rounded-full px-2 py-0.5 text-[11px] font-bold border`
- Buttons: `rounded-lg px-3 py-1.5 text-xs font-bold transition-colors`
- Section headers inside cards: `text-[10px] uppercase tracking-widest font-bold text-muted-2`
- Keep existing difficulty colors (emerald/amber/red) and accent-electric/cyan/violet

---

## layout.tsx

- **Sidebar brand:** Replace "Admin" + Sparkles with app name "Freetime" as bold text + "Admin Console" as a smaller muted subtitle below it. Use a simple colored square icon, not Sparkles.
- **Header left side:** Replace the empty `hidden md:block` div with `<span className="font-semibold text-sm text-muted">Admin Console</span>`
- **"Back to App" link:** Make it `text-xs uppercase tracking-wider` so it reads as a utility link, not a nav item.
- **Sidebar nav section label:** Style as `text-[10px] uppercase tracking-widest text-muted-2/50` with a thin `border-b border-white/5` below it.

---

## stats-bar.tsx

Replace inline number+label pairs with small pill containers: each stat gets `bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1` wrapping a bold number and a tiny muted label. No separators between them — just `gap-2 flex-wrap`.

---

## filter-bar.tsx

- Wrap the whole bar in `rounded-xl bg-white/[0.03] border border-white/10 p-2.5 flex flex-wrap gap-2`
- All `<select>` elements: add `appearance-none` and a custom SVG chevron via inline `backgroundImage` style — or simply replace native selects with the existing shadcn `Select` component already used in the forms, for consistent dark-mode styling
- Show an active filter count badge (e.g. "2 active") when any filter is set — `text-[11px] text-accent-electric bg-accent-electric/10 border border-accent-electric/20 rounded-full px-2`

---

## questions-table.tsx

- **View toggle:** Change from two small icon-only buttons to a pill segmented control showing "Table" and "Cards" text labels with icons. Active tab: `bg-white/10 text-foreground`. Inactive: `text-muted-2`.
- **Bulk toolbar:** Give it a visible container `bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5` instead of floating. Show selected count in a small blue badge circle.
- **Action column buttons:** Replace plain text links with tiny chip buttons `h-6 px-2 rounded border border-white/10 text-xs hover:bg-white/[0.06]` for View/Edit. Delete stays as icon.
- **Clicking a row should expand it** — add `onClick={() => onToggle(id)}` to the `<tr>` in ExpandableRow. Stop propagation on checkbox and actions cells.
- **Alternating row tint:** odd rows get `bg-white/[0.008]` — just enough to create visual rhythm.
- **Empty state:** Add a `FileQuestion` icon from lucide-react, a bold title, and a subtle "Add Question" CTA button.

---

## expandable-row.tsx

- Add `onClick={() => onToggle(id)}` to the `<tr>` so the whole row is clickable, not just the chevron.
- The expanded content row: add `border-l-2 border-l-accent-electric/30` to visually connect it to the parent row.

---

## question-card.tsx

- Add `hover:-translate-y-px transition-transform` for a subtle lift — nothing heavy.
- Statement text: bump to `text-[13px] leading-relaxed`.
- Wrap the `qId` in a `font-mono text-[10px] bg-white/[0.04] px-1.5 rounded` chip.
- Footer actions: same chip-button style as the table actions above.

---

## page.tsx (main questions page)

- Move the `pageSize <select>` into a separate `'use client'` component (`PageSizeSelect`) — the current one uses `window.location.href` inside a server component which **does not work**.
- Wrap header icon in `size-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center` before the page title.
- Danger Zone `<details>`: add `ChevronDown` that rotates `group-open:rotate-180`.

---

## exam-bank/page.tsx

- Loading state: replace `"Loading…"` text with a simple list of `animate-pulse` skeleton rows — `h-3 rounded bg-white/[0.06]` divs of varying widths inside `divide-y divide-white/5`.
- Filters: same styled container as FilterBar above. Native selects → `appearance-none` + custom chevron or shadcn Select.
- Header: add a small `size-8 rounded-lg bg-violet-500/10 border border-violet-500/20` icon box with `ShieldCheck` before the "Exam Bank" heading.

---

## weekly-exams/page.tsx

- Loading state: same skeleton pattern as exam-bank.
- Publish toggle: increase to `h-6 w-11` with a `h-4 w-4` knob — current size is too small to click confidently.
- "Details" expand button: make it a proper bordered chip `h-6 px-2 rounded border border-white/10 text-[11px]` that shows "▸ Details" / "▾ Hide".
- Ended status badge: add `opacity-60` and `line-through` so it reads as inactive.

---

## subjects/page.tsx

- Active subject row: change from `bg-accent-electric/10` to `border-l-2 border-l-accent-electric bg-white/[0.04]` for a clearer selected state.
- Subject list items: scale the emoji icon `group-hover:scale-105 transition-transform`. Show a right-pointing chevron (`›`) on the active row.
- Chapter rows: add a simple inline count bar — a `w-12 h-1 rounded-full bg-white/[0.06]` track with a filled portion relative to the max chapter count.
- Add a panel header to the left subjects list: `text-[10px] uppercase tracking-widest text-muted-2` label + "+ Add" button.

---

## questions/new/page.tsx + edit-client.tsx

- **Section separation:** Form sections currently stack with `border-b-0` causing them to bleed together. Give each section its own `rounded-2xl border border-white/10` card with `space-y-3` between them.
- **Preview panel:** Show on `lg` screens, not just `xl` — change `hidden xl:block` to `hidden lg:block`.
- **Statement textarea:** Add a character count `text-[11px] text-muted-2` aligned to the right of the label.
- **Success after create:** Show a simple modal overlay with "Question Created!" + "Add Another" / "Back to Questions" buttons instead of the small inline notice.

---

## import/page.tsx

- Primary CTA button ("Validate & Import"): change from `bg-accent-cyan text-black` to `bg-gradient-primary text-white` to match every other admin CTA.
- Add a page heading above the step indicator: icon box + "Bulk Import" title + one-line description.

---

## globals.css (admin section only)

Add these two utilities inside the existing admin `@layer components` block:

```css
.admin-select {
  appearance: none;
  background-image: url("data:image/svg+xml,...chevron svg...");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px !important;
}
```

And a simple shimmer for skeleton loaders:
```css
@keyframes shimmer {
  from { opacity: 0.5; } to { opacity: 1; }
}
.admin-layout .animate-pulse { animation: shimmer 1.2s ease-in-out infinite alternate; }
```

---

## Order of Changes

1. `globals.css` — admin-select + shimmer
2. `layout.tsx` — brand, header label, back link
3. `stats-bar.tsx` — pill chips
4. `filter-bar.tsx` — container + styled selects + active badge
5. `PageSizeSelect` — new client component (fixes server component bug)
6. `admin/page.tsx` — use PageSizeSelect, header icon, danger zone chevron
7. `expandable-row.tsx` — row click + expanded left border
8. `questions-table.tsx` — view toggle, bulk toolbar, action chips, alternating rows, empty state
9. `question-card.tsx` — lift, statement size, footer chips
10. `exam-bank/page.tsx` — skeleton, styled selects, header icon
11. `weekly-exams/page.tsx` — skeleton, toggle size, details button, ended badge
12. `subjects/page.tsx` — active border, chapter bar, panel header
13. `questions/new + edit-client` — section cards, preview at lg, char count, success modal
14. `import/page.tsx` — CTA color, page heading