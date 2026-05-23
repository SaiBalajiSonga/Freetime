'use client'

import { useState, useEffect, useTransition, useRef, useCallback } from 'react'
import { updateQuestion } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, ChevronDown } from 'lucide-react'
import { QuestionPreview } from '@/components/admin/question-preview'

const IMGBB_KEY = process.env.NEXT_PUBLIC_IMGBB_KEY!

const inputCls = 'w-full bg-surface-2 border border-white/[0.08] rounded-lg px-4 py-3 text-foreground placeholder:text-muted-2 focus:border-accent-electric/40 focus:outline-none focus:ring-2 focus:ring-accent-electric/20 transition text-sm'
const textareaCls = `${inputCls} resize-none`
const selectTriggerCls = 'w-full bg-surface-2 border border-white/[0.08] text-foreground focus:ring-accent-electric/20 focus:border-accent-electric/40 h-11 rounded-lg'
const sectionHeader = 'text-[11px] uppercase tracking-widest font-bold text-muted-2 mb-4'

export default function EditQuestionClient({ questionId, initialData }: { questionId: string; initialData: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── Metadata state ──────────────────────────────────────────────
  const [subjects, setSubjects] = useState<any[]>(initialData.subjects || [])
  const [chapters, setChapters] = useState<any[]>(initialData.initialChapters || [])
  const [selectedSubject, setSelectedSubject] = useState<string>(initialData.subjectId || '')
  const [selectedChapter, setSelectedChapter] = useState<string>(initialData.chapterId || '')
  const [type, setType] = useState(initialData.type || 'mcq')
  const [difficulty, setDifficulty] = useState(initialData.difficulty || 'medium')

  // ── Content state ───────────────────────────────────────────────
  const [statement, setStatement] = useState(initialData.statement || '')
  const [imageUrl, setImageUrl] = useState<string>(initialData.image_url || '')
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── MCQ options ─────────────────────────────────────────────────
  const initOptions = initialData.options?.map((o: any) => o.text) || ['', '', '', '']
  const [options, setOptions] = useState<string[]>(initOptions)
  const initCorrectIndex = (() => {
    if (initialData.type === 'mcq' && initialData.options) {
      const idx = initialData.options.findIndex((o: any) => o.is_correct)
      return idx !== -1 ? String(idx) : '0'
    }
    return '0'
  })()
  const [correctOptionIndex, setCorrectOptionIndex] = useState(initCorrectIndex)

  // ── Numerical ───────────────────────────────────────────────────
  const [numericalAnswer, setNumericalAnswer] = useState(
    type === 'numerical' ? (initialData.numericalAnswer || '') : ''
  )

  // ── Extras ─────────────────────────────────────────────────────
  const [solution, setSolution] = useState(initialData.solution || '')
  const [hint, setHint] = useState(initialData.hint || '')

  // ── Load chapters on subject change ─────────────────────────────
  useEffect(() => {
    if (!selectedSubject) { setChapters([]); return }
    if (selectedSubject === initialData.subjectId && initialData.initialChapters?.length > 0) {
      setChapters(initialData.initialChapters); return
    }
    supabase.from('chapters').select('*').eq('subject_id', selectedSubject).order('name').then(({ data }) => {
      if (data) setChapters(data)
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
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) setImageUrl(json.data.url)
      else setImageError('Upload failed. Try again.')
    } catch { setImageError('Network error during upload.') }
    finally { setImageUploading(false) }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (file) uploadFile(file)
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
    setErrorMsg(null)
    startTransition(async () => {
      const res = await updateQuestion(questionId, formData)
      if (res?.error) setErrorMsg(res.error)
      else if (res?.success) router.push('/admin')
    })
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-xl text-muted-2 hover:text-foreground hover:bg-surface-2 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Edit Question</h1>
              <span className="font-mono text-xs text-muted-2 bg-surface-2 border border-white/[0.08] px-2 py-0.5 rounded-lg">
                {questionId.slice(0, 8)}…
              </span>
            </div>
            {initialData.created_at && (
              <p className="text-xs text-muted-2 mt-0.5">
                Created {new Date(initialData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}
                <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-white/10 text-[10px] font-mono">⌘ Enter</kbd> to save
              </p>
            )}
          </div>
        </div>
        <Link href={`/questions/${questionId}`} target="_blank" className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg border border-white/10 bg-surface-2 text-muted hover:text-foreground transition-colors">
          <ExternalLink className="h-3.5 w-3.5" />
          View Live
        </Link>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">{errorMsg}</div>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* ── LEFT: Form ── */}
        <form action={handleSubmit} onKeyDown={handleKeyDown} className="space-y-0">

          {/* Section: Metadata */}
          <div className="rounded-2xl border border-white/[0.08] bg-surface p-6 mb-4">
            <p className={sectionHeader}>Metadata</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Subject</Label>
                <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v ?? '')} required>
                  <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent className="bg-surface border border-white/[0.08] text-foreground">
                    {subjects.map(s => <SelectItem key={s.id} value={s.id} className="focus:bg-surface-2">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Chapter</Label>
                <Select name="chapterId" value={selectedChapter} onValueChange={(v) => setSelectedChapter(v ?? '')} required disabled={!selectedSubject}>
                  <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select Chapter" /></SelectTrigger>
                  <SelectContent className="bg-surface border border-white/[0.08] text-foreground">
                    {chapters.map(c => <SelectItem key={c.id} value={c.id} className="focus:bg-surface-2">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
          </div>

          {/* Section: Content */}
          <div className="rounded-2xl border border-white/[0.08] bg-surface p-6 mb-4">
            <p className={sectionHeader}>Content</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Problem Statement</Label>
                <textarea
                  name="statement"
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Enter the question text here…"
                  rows={5}
                  required
                  className={textareaCls}
                  id="edit-question-statement"
                />
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted">Image <span className="text-muted-2 font-normal">(Optional)</span></Label>
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
                    htmlFor="image-upload-edit"
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-6 py-6 cursor-pointer transition-all ${isDragging ? 'border-accent-electric bg-accent-electric/5' : imageUploading ? 'border-white/10 cursor-not-allowed' : 'border-white/10 hover:border-accent-electric/40 hover:bg-surface-2'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    {imageUploading ? (
                      <><svg className="animate-spin w-5 h-5 text-accent-electric" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg><span className="text-sm text-muted">Uploading…</span></>
                    ) : (
                      <><svg className="w-6 h-6 text-muted-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-sm text-muted">{isDragging ? 'Drop image' : 'Click or drag to upload'}</span></>
                    )}
                    <input id="image-upload-edit" ref={fileInputRef} type="file" accept="image/*" className="hidden" disabled={imageUploading} onChange={handleImageChange} />
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
              <div className="space-y-2">
                <input type="hidden" name="correctOptionIndex" value={correctOptionIndex} />
                <RadioGroup value={correctOptionIndex} onValueChange={setCorrectOptionIndex} className="space-y-2">
                  {[0, 1, 2, 3].map((i) => {
                    const opt = initialData.options?.[i]
                    return (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${String(i) === correctOptionIndex ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.08] bg-surface-2'}`}>
                        {opt?.id && <input type="hidden" name={`option_id_${i}`} value={opt.id} />}
                        <RadioGroupItem value={String(i)} id={`edit_opt_${i}`} className="border-white/20 text-emerald-400 shrink-0" />
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
                    )
                  })}
                </RadioGroup>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Correct Numerical Answer</Label>
                <input name="correct_answer" value={numericalAnswer} onChange={(e) => setNumericalAnswer(e.target.value)} placeholder="e.g. 42 or 3.14" required className={inputCls} />
              </div>
            )}
          </div>

          {/* Section: Extras */}
          <details className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden group mb-4" open={!!(solution || hint)}>
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
            </div>
          </details>

          {/* Submit */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending || imageUploading}
              id="update-question-btn"
              className="inline-flex items-center gap-2 h-10 px-6 text-sm font-bold rounded-xl bg-gradient-primary text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {imageUploading ? 'Uploading image…' : isPending ? 'Updating…' : 'Update Question'}
            </button>
            <Link href="/admin" className="text-sm text-muted hover:text-foreground transition-colors">Cancel</Link>
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
