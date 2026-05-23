'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { BookOpen, Plus, X, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createSubject, createChapter } from '../actions'
import { deleteBySubject, deleteByChapter } from '../actions'

const subjectMeta: Record<string, { icon: string; color: string }> = {
  'Physics':     { icon: '⚡', color: 'text-accent-cyan' },
  'Chemistry':   { icon: '🧪', color: 'text-amber-400' },
  'Mathematics': { icon: '📐', color: 'text-emerald-400' },
}

export default function AdminSubjectsPage() {
  const supabase = createClient()
  const [subjects, setSubjects] = useState<any[]>([])
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({})
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({})
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ── Add subject form ───────────────────────────────────────────
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [addSubjectError, setAddSubjectError] = useState('')
  const subjectInputRef = useRef<HTMLInputElement>(null)

  // ── Add chapter form ───────────────────────────────────────────
  const [showAddChapter, setShowAddChapter] = useState(false)
  const [newChapterName, setNewChapterName] = useState('')
  const [addChapterError, setAddChapterError] = useState('')
  const chapterInputRef = useRef<HTMLInputElement>(null)

  // ── Load subjects ──────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingSubjects(true)
      const { data: subs } = await supabase.from('subjects').select('*').order('name')
      const { data: qs } = await supabase.from('questions').select('id, chapters(subject_id)')

      const counts: Record<string, number> = {}
      qs?.forEach((q: any) => {
        const sid = q.chapters?.subject_id
        if (sid) counts[sid] = (counts[sid] || 0) + 1
      })

      setSubjects(subs ?? [])
      setSubjectCounts(counts)
      setLoadingSubjects(false)
    }
    load()
  }, [])

  // ── Load chapters for selected subject ─────────────────────────
  useEffect(() => {
    if (!selectedSubject) { setChapters([]); return }
    setLoadingChapters(true)

    async function loadChapters() {
      const { data: chs } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject_id', selectedSubject.id)
        .order('name')

      const { data: qs } = await supabase
        .from('questions')
        .select('id, chapter_id')
        .in('chapter_id', (chs ?? []).map((c: any) => c.id))

      const counts: Record<string, number> = {}
      qs?.forEach((q: any) => {
        counts[q.chapter_id] = (counts[q.chapter_id] || 0) + 1
      })

      setChapters(chs ?? [])
      setChapterCounts(counts)
      setLoadingChapters(false)
      setShowAddChapter(false)
    }
    loadChapters()
  }, [selectedSubject?.id])

  // ── Add subject ────────────────────────────────────────────────
  function handleAddSubject() {
    setAddSubjectError('')
    if (!newSubjectName.trim()) { setAddSubjectError('Name is required'); return }
    startTransition(async () => {
      const res = await createSubject(newSubjectName)
      if (res?.error) { setAddSubjectError(res.error); return }
      if (res?.subject) {
        setSubjects((prev) => [...prev, res.subject].sort((a, b) => a.name.localeCompare(b.name)))
        setNewSubjectName('')
        setShowAddSubject(false)
      }
    })
  }

  // ── Add chapter ────────────────────────────────────────────────
  function handleAddChapter() {
    setAddChapterError('')
    if (!newChapterName.trim()) { setAddChapterError('Name is required'); return }
    if (!selectedSubject) return
    startTransition(async () => {
      const res = await createChapter(selectedSubject.id, newChapterName)
      if (res?.error) { setAddChapterError(res.error); return }
      if (res?.chapter) {
        setChapters((prev) => [...prev, res.chapter].sort((a, b) => a.name.localeCompare(b.name)))
        setNewChapterName('')
        setShowAddChapter(false)
      }
    })
  }

  // ── Delete chapter ─────────────────────────────────────────────
  function handleDeleteChapter(ch: any) {
    const count = chapterCounts[ch.id] ?? 0
    if (!confirm(`Delete all ${count} questions in "${ch.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteByChapter(ch.id)
      setChapters((prev) => prev.filter((c) => c.id !== ch.id))
      setSubjectCounts((prev) => ({ ...prev, [selectedSubject!.id]: Math.max(0, (prev[selectedSubject!.id] ?? 0) - count) }))
    })
  }

  // ── Delete subject ─────────────────────────────────────────────
  function handleDeleteSubject(s: any) {
    const count = subjectCounts[s.id] ?? 0
    if (!confirm(`Delete all ${count} questions in "${s.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteBySubject(s.id)
      setSubjects((prev) => prev.filter((sub) => sub.id !== s.id))
      if (selectedSubject?.id === s.id) { setSelectedSubject(null); setChapters([]) }
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Subjects & Chapters</h1>
        <p className="text-sm text-muted mt-1">Manage subjects and their chapter organization.</p>
      </div>

      {/* Split panel */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 items-start">

        {/* ── LEFT: Subjects ── */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-surface-2/40">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-2">Subjects</span>
            <button
              type="button"
              onClick={() => { setShowAddSubject(true); setTimeout(() => subjectInputRef.current?.focus(), 50) }}
              className="inline-flex items-center gap-1 text-xs font-bold text-accent-cyan hover:text-accent-glow transition-colors"
              id="add-subject-btn"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>

          {/* Inline add subject form */}
          {showAddSubject && (
            <div className="px-4 py-3 border-b border-white/[0.06] bg-accent-electric/5">
              <div className="flex items-center gap-2">
                <input
                  ref={subjectInputRef}
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubject(); if (e.key === 'Escape') setShowAddSubject(false) }}
                  placeholder="Subject name…"
                  className="flex-1 bg-surface-2 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-2 focus:outline-none focus:border-accent-electric/40"
                />
                <button type="button" onClick={handleAddSubject} disabled={isPending} className="h-7 px-2.5 text-xs font-bold rounded-lg bg-gradient-primary text-white disabled:opacity-50">
                  {isPending ? '…' : 'Add'}
                </button>
                <button type="button" onClick={() => setShowAddSubject(false)} className="text-muted-2 hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {addSubjectError && <p className="text-[11px] text-red-400 mt-1">{addSubjectError}</p>}
            </div>
          )}

          {/* Subject list */}
          <div className="divide-y divide-white/[0.05]">
            {loadingSubjects ? (
              <div className="py-10 text-center text-muted-2 text-xs">Loading…</div>
            ) : subjects.length === 0 ? (
              <div className="py-10 text-center text-muted-2 text-xs">No subjects yet</div>
            ) : (
              subjects.map((s) => {
                const meta = subjectMeta[s.name] ?? { icon: '📚', color: 'text-accent-cyan' }
                const count = subjectCounts[s.id] ?? 0
                const isActive = selectedSubject?.id === s.id

                return (
                  <div
                    key={s.id}
                    className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? 'bg-accent-electric/10' : 'hover:bg-surface-2/60'}`}
                    onClick={() => setSelectedSubject(isActive ? null : s)}
                  >
                    <span className="text-lg shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-accent-electric' : 'text-foreground'}`}>{s.name}</p>
                      <p className="text-[11px] text-muted-2 font-mono">{count} questions</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s) }}
                      className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all"
                      title="Delete subject"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── RIGHT: Chapters ── */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden">
          {!selectedSubject ? (
            <div className="py-20 text-center">
              <div className="size-12 rounded-xl bg-surface-2 border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-5 w-5 text-muted-2" />
              </div>
              <p className="text-sm text-muted font-medium">Select a subject to manage its chapters</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-surface-2/40">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-2">Chapters in </span>
                  <span className="text-[11px] font-bold text-foreground">{selectedSubject.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddChapter(true); setTimeout(() => chapterInputRef.current?.focus(), 50) }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent-cyan hover:text-accent-glow transition-colors"
                  id="add-chapter-btn"
                >
                  <Plus className="h-3 w-3" /> Add Chapter
                </button>
              </div>

              {/* Inline add chapter form */}
              {showAddChapter && (
                <div className="px-4 py-3 border-b border-white/[0.06] bg-accent-electric/5">
                  <div className="flex items-center gap-2">
                    <input
                      ref={chapterInputRef}
                      type="text"
                      value={newChapterName}
                      onChange={(e) => setNewChapterName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddChapter(); if (e.key === 'Escape') setShowAddChapter(false) }}
                      placeholder="Chapter name…"
                      className="flex-1 bg-surface-2 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-2 focus:outline-none focus:border-accent-electric/40"
                    />
                    <button type="button" onClick={handleAddChapter} disabled={isPending} className="h-7 px-2.5 text-xs font-bold rounded-lg bg-gradient-primary text-white disabled:opacity-50">
                      {isPending ? '…' : 'Add'}
                    </button>
                    <button type="button" onClick={() => setShowAddChapter(false)} className="text-muted-2 hover:text-foreground transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {addChapterError && <p className="text-[11px] text-red-400 mt-1">{addChapterError}</p>}
                </div>
              )}

              {/* Chapter list */}
              <div className="divide-y divide-white/[0.05]">
                {loadingChapters ? (
                  <div className="py-10 text-center text-muted-2 text-xs">Loading chapters…</div>
                ) : chapters.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-muted-2">No chapters yet. Click "Add Chapter" to create one.</p>
                  </div>
                ) : (
                  chapters.map((ch, idx) => {
                    const count = chapterCounts[ch.id] ?? 0
                    return (
                      <div key={ch.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-surface-2/60 transition-colors">
                        <span className="font-mono text-xs text-muted-2 w-6 shrink-0">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium truncate">{ch.name}</p>
                        </div>
                        <span className="font-mono text-xs text-muted-2 shrink-0">{count} Qs</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteChapter(ch)}
                          className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all shrink-0"
                          title="Delete chapter"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
