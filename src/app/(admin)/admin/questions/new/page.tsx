'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import { createQuestion } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ChevronDown } from 'lucide-react'
import { QuestionPreview } from '@/components/admin/question-preview'

const IMGBB_KEY = process.env.NEXT_PUBLIC_IMGBB_KEY!

const inputCls = 'w-full bg-surface-2 border border-white/[0.08] rounded-lg px-4 py-3 text-foreground placeholder:text-muted-2 focus:border-accent-electric/40 focus:outline-none focus:ring-2 focus:ring-accent-electric/20 transition text-sm'
const textareaCls = `${inputCls} resize-none`
const selectTriggerCls = 'w-full bg-surface-2 border border-white/[0.08] text-foreground focus:ring-accent-electric/20 focus:border-accent-electric/40 h-11 rounded-lg'

const sectionHeader = 'text-[11px] uppercase tracking-widest font-bold text-muted-2 mb-4'

export default function NewQuestionPage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [successState, setSuccessState] = useState(false)

  // ── Metadata state ──────────────────────────────────────────────
  const [subjects, setSubjects] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedChapter, setSelectedChapter] = useState('')
  const [type, setType] = useState('mcq')
  const [difficulty, setDifficulty] = useState('medium')
  const [visibility, setVisibility] = useState<'public' | 'exam'>('public')

  // ── Content state ───────────────────────────────────────────────
  const [statement, setStatement] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const statementRef = useRef<HTMLTextAreaElement>(null)

  // ── MCQ options ─────────────────────────────────────────────────
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctOptionIndex, setCorrectOptionIndex] = useState('0')

  // ── Numerical ───────────────────────────────────────────────────
  const [numericalAnswer, setNumericalAnswer] = useState('')

  // ── Extras ─────────────────────────────────────────────────────
  const [solution, setSolution] = useState('')
  const [hint, setHint] = useState('')
  const [tags, setTags] = useState('')

  // ── Load subjects ───────────────────────────────────────────────
  useEffect(() => {
    supabase.from('subjects').select('*').order('name').then(({ data }) => {
      if (data) setSubjects(data)
    })
    // Auto-focus statement textarea
    setTimeout(() => statementRef.current?.focus(), 100)
  }, [])

  // ── Load chapters on subject change ─────────────────────────────
  useEffect(() => {
    if (!selectedSubject) { setChapters([]); setSelectedChapter(''); return }
    supabase.from('chapters').select('*').eq('subject_id', selectedSubject).order('name').then(({ data }) => {
      if (data) { setChapters(data); setSelectedChapter('') }
    })
  }, [selectedSubject])

  // ── Cmd/Ctrl+Enter submit ────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.requestSubmit()
    }
  }, [])

  // ── Image upload ─────────────────────────────────────────────────
  async function uploadFile(file: File) {
    setImageError(null); setImageUploading(true); setImageUrl('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: formData })
      const json = await res.json()
      if (json.success) setImageUrl(json.data.url)
      else setImageError('Upload failed. Try again.')
    } catch { setImageError('Network error during upload.') }
    finally { setImageUploading(false) }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) uploadFile(file)
  }

  // ── Preview options ──────────────────────────────────────────────
  const previewOptions = options.map((text, i) => ({
    text,
    is_correct: String(i) === correctOptionIndex,
  }))

  // ── Submit ───────────────────────────────────────────────────────
  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createQuestion(formData)
      setSuccessState(true)
    })
  }

  if (successState) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-5">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 shadow-xl">
          <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Question created!</h2>
          <p className="text-sm text-emerald-400/80 mt-1 mb-6">Your question has been saved successfully.</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => { setSuccessState(false); setStatement(''); setOptions(['','','','']); setNumericalAnswer(''); setSolution(''); setHint(''); setImageUrl('') }}
              className="inline-flex items-center gap-2 h-10 px-5 text-sm font-bold rounded-xl bg-gradient-primary text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 transition-all"
            >
              Add Another
            </button>
            <Link href="/admin" className="inline-flex items-center gap-2 h-10 px-5 text-sm font-bold rounded-xl border border-white/10 bg-surface-2 text-foreground hover:bg-white/[0.08] transition-colors">
              Back to Questions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-xl text-muted-2 hover:text-foreground hover:bg-surface-2 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Add New Question</h1>
          <p className="text-xs text-muted-2 mt-0.5">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-white/10 text-[10px] font-mono">⌘ Enter</kbd>
            {' '}to save
          </p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* ── LEFT: Form ── */}
        <form action={handleSubmit} onKeyDown={handleKeyDown} className="space-y-0">

          {/* Section: Metadata */}
          <div className="rounded-2xl border border-white/[0.08] bg-surface p-6 mb-4">
            <p className={sectionHeader}>Metadata</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Subject */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Subject</Label>
                <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v ?? '')} required>
                  <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent className="bg-surface border border-white/[0.08] text-foreground">
                    {subjects.map(s => <SelectItem key={s.id} value={s.id} className="focus:bg-surface-2">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Chapter */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Chapter</Label>
                <Select name="chapterId" value={selectedChapter} onValueChange={(v) => setSelectedChapter(v ?? '')} required disabled={!selectedSubject}>
                  <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select Chapter" /></SelectTrigger>
                  <SelectContent className="bg-surface border border-white/[0.08] text-foreground">
                    {chapters.map(c => <SelectItem key={c.id} value={c.id} className="focus:bg-surface-2">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Type</Label>
                <Select name="type" value={type} onValueChange={(v) => setType(v ?? 'mcq')}>
                  <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-surface border border-white/[0.08] text-foreground">
                    <SelectItem value="mcq" className="focus:bg-surface-2">Multiple Choice</SelectItem>
                    <SelectItem value="numerical" className="focus:bg-surface-2">Numerical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Difficulty */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Difficulty</Label>
                <Select name="difficulty" value={difficulty} onValueChange={(v) => setDifficulty(v ?? 'medium')}>
                  <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-surface border border-white/[0.08] text-foreground">
                    <SelectItem value="easy" className="focus:bg-surface-2">Easy</SelectItem>
                    <SelectItem value="medium" className="focus:bg-surface-2">Medium</SelectItem>
                    <SelectItem value="hard" className="focus:bg-surface-2">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Destination */}
            <div className="mt-4 space-y-1.5">
              <Label className="text-xs font-semibold text-muted">Destination</Label>
              <input type="hidden" name="visibility" value={visibility} />
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setVisibility('public')} className={`flex flex-col gap-1 p-3 rounded-xl border-2 text-left transition-all ${visibility === 'public' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 bg-surface-2 text-muted hover:border-white/20'}`}>
                  <span className="font-bold text-sm">📚 Practice Pool</span>
                  <span className="text-[11px] opacity-70">Visible to students</span>
                </button>
                <button type="button" onClick={() => setVisibility('exam')} className={`flex flex-col gap-1 p-3 rounded-xl border-2 text-left transition-all ${visibility === 'exam' ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-white/10 bg-surface-2 text-muted hover:border-white/20'}`}>
                  <span className="font-bold text-sm">🔒 Exam Bank</span>
                  <span className="text-[11px] opacity-70">Hidden from students</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Content */}
          <div className="rounded-2xl border border-white/[0.08] bg-surface p-6 mb-4">
            <p className={sectionHeader}>Content</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Problem Statement</Label>
                <textarea
                  ref={statementRef}
                  name="statement"
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Enter the question text here…"
                  rows={5}
                  required
                  className={textareaCls}
                  id="question-statement"
                />
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted">
                  Image <span className="text-muted-2 font-normal">(Optional)</span>
                </Label>
                <input type="hidden" name="image_url" value={imageUrl} />

                {imageUrl ? (
                  <div className="space-y-2">
                    <div className="flex justify-center bg-surface-2 border border-white/[0.08] rounded-xl p-3">
                      <Image src={imageUrl} alt="Preview" width={600} height={300} className="max-h-[180px] w-auto object-contain rounded" unoptimized />
                    </div>
                    <button type="button" onClick={() => { setImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-xs text-red-400 hover:text-red-300 transition-colors underline">✕ Remove Image</button>
                  </div>
                ) : (
                  <label
                    htmlFor="image-upload-new"
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-all ${isDragging ? 'border-accent-electric bg-accent-electric/5' : imageUploading ? 'border-white/10 bg-white/[0.02] cursor-not-allowed' : 'border-white/10 hover:border-accent-electric/40 hover:bg-surface-2'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    {imageUploading ? (
                      <><svg className="animate-spin w-5 h-5 text-accent-electric" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg><span className="text-sm text-muted">Uploading…</span></>
                    ) : (
                      <><svg className="w-7 h-7 text-muted-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-sm text-muted">{isDragging ? 'Drop to upload' : 'Click or drag image here'}</span><span className="text-xs text-muted-2">PNG, JPG, GIF, WebP</span></>
                    )}
                    <input id="image-upload-new" ref={fileInputRef} type="file" accept="image/*" className="hidden" disabled={imageUploading} onChange={handleImageChange} />
                  </label>
                )}
                {imageError && <p className="text-xs text-red-400">{imageError}</p>}
              </div>
            </div>
          </div>

          {/* Section: Options */}
          <div className="rounded-2xl border border-white/[0.08] bg-surface p-6 mb-4">
            <p className={sectionHeader}>Answer</p>
            {type === 'mcq' ? (
              <div className="space-y-3">
                <RadioGroup value={correctOptionIndex} onValueChange={setCorrectOptionIndex} name="correctOptionIndex" className="space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${String(i) === correctOptionIndex ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.08] bg-surface-2'}`}>
                      <RadioGroupItem value={String(i)} id={`opt_${i}`} className="border-white/20 text-emerald-400 shrink-0" />
                      <span className="text-xs font-mono text-muted-2 w-4 shrink-0">{['A','B','C','D'][i]}.</span>
                      <input
                        name={`option_${i}`}
                        value={options[i]}
                        onChange={(e) => { const o = [...options]; o[i] = e.target.value; setOptions(o) }}
                        placeholder={`Option ${i + 1}`}
                        required
                        className="flex-1 bg-transparent border-0 text-foreground placeholder:text-muted-2 focus:outline-none text-sm"
                      />
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-[11px] text-muted-2">Select the radio button next to the correct answer</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Correct Numerical Answer</Label>
                <input
                  name="correct_answer"
                  value={numericalAnswer}
                  onChange={(e) => setNumericalAnswer(e.target.value)}
                  placeholder="e.g. 42 or 3.14"
                  required
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* Section: Extras (collapsible) */}
          <details className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden group mb-4">
            <summary className="flex items-center justify-between px-6 py-4 cursor-pointer select-none text-sm font-bold text-muted-2 hover:text-foreground transition-colors list-none">
              <span>Extras</span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-6 space-y-4 border-t border-white/[0.06]">
              <div className="space-y-1.5 pt-4">
                <Label className="text-xs font-semibold text-muted">Solution (Optional)</Label>
                <textarea name="solution" value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Detailed step-by-step solution…" rows={3} className={textareaCls} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Hint (Optional)</Label>
                <input name="hint" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="A short hint…" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Tags (Optional)</Label>
                <input name="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. kinematics, motion" className={inputCls} />
              </div>
            </div>
          </details>

          {/* Submit */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending || imageUploading}
              id="create-question-btn"
              className="inline-flex items-center gap-2 h-10 px-6 text-sm font-bold rounded-xl bg-gradient-primary text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {isPending ? 'Creating…' : imageUploading ? 'Uploading image…' : 'Create Question'}
            </button>
            <Link href="/admin" className="text-sm text-muted hover:text-foreground transition-colors">
              Cancel
            </Link>
          </div>
        </form>

        {/* ── RIGHT: Live preview (sticky, desktop only) ── */}
        <div className="hidden lg:block sticky top-[88px] h-[calc(100vh-110px)]">
          <QuestionPreview
            statement={statement}
            type={type}
            options={previewOptions}
            correctAnswer={numericalAnswer}
            difficulty={difficulty}
            hint={hint}
            imageUrl={imageUrl}
          />
        </div>
      </div>
    </div>
  )
}
