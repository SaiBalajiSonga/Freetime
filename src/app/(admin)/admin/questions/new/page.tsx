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

const inputCls = 'w-full rounded-md px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:ring-2 transition text-sm'
const textareaCls = `${inputCls} resize-none`
const selectTriggerCls = 'w-full text-white h-11 rounded-md border-0'

const INPUT_STYLE = { background: '#1c2333', border: '1px solid #2a3142' } as React.CSSProperties

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
        <div className="rounded-lg p-8 shadow-xl" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
          <div className="size-16 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Question created!</h2>
          <p className="text-sm text-emerald-400/80 mt-1 mb-6">Your question has been saved successfully.</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => { setSuccessState(false); setStatement(''); setOptions(['','','','']); setNumericalAnswer(''); setSolution(''); setHint(''); setImageUrl('') }}
              className="inline-flex items-center gap-2 h-10 px-5 text-sm font-bold rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.35)]"
            >
              Add Another
            </button>
            <Link href="/admin/questions" className="inline-flex items-center gap-2 h-10 px-5 text-sm font-bold rounded-md text-white hover:bg-white/[0.08] transition-colors" style={{ background: '#1c2333', border: '1px solid #2a3142' }}>
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
        <Link href="/admin/questions" className="p-2 rounded-md hover:text-white hover:bg-[#1c2333] transition-colors" style={{ color: '#64748b' }}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-[-0.03em]">Add New Question</h1>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: '#1c2333', border: '1px solid #2a3142' }}>⌘ Enter</kbd>
            {' '}to save
          </p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* ── LEFT: Form ── */}
        <form action={handleSubmit} onKeyDown={handleKeyDown} className="space-y-0">

          {/* Section: Metadata */}
          <div className="rounded-lg mb-4" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <div className="px-5 py-3" style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Metadata</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Subject */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Subject</Label>
                   <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v ?? '')} required>
                    <SelectTrigger className={selectTriggerCls} style={INPUT_STYLE}><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent className="border text-white bg-[#161b27] border-[#2a3142]">
                      {subjects.map(s => <SelectItem key={s.id} value={s.id} className="focus:bg-[#1c2333] focus:text-white">{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Chapter */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Chapter</Label>
                  <Select name="chapterId" value={selectedChapter} onValueChange={(v) => setSelectedChapter(v ?? '')} required disabled={!selectedSubject}>
                    <SelectTrigger className={selectTriggerCls} style={INPUT_STYLE}><SelectValue placeholder="Select Chapter" /></SelectTrigger>
                    <SelectContent className="border text-white bg-[#161b27] border-[#2a3142]">
                      {chapters.map(c => <SelectItem key={c.id} value={c.id} className="focus:bg-[#1c2333] focus:text-white">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Type</Label>
                  <Select name="type" value={type} onValueChange={(v) => setType(v ?? 'mcq')}>
                    <SelectTrigger className={selectTriggerCls} style={INPUT_STYLE}><SelectValue /></SelectTrigger>
                    <SelectContent className="border text-white bg-[#161b27] border-[#2a3142]">
                      <SelectItem value="mcq" className="focus:bg-[#1c2333] focus:text-white">Multiple Choice</SelectItem>
                      <SelectItem value="numerical" className="focus:bg-[#1c2333] focus:text-white">Numerical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Difficulty */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Difficulty</Label>
                  <Select name="difficulty" value={difficulty} onValueChange={(v) => setDifficulty(v ?? 'medium')}>
                    <SelectTrigger className={selectTriggerCls} style={INPUT_STYLE}><SelectValue /></SelectTrigger>
                    <SelectContent className="border text-white bg-[#161b27] border-[#2a3142]">
                      <SelectItem value="easy" className="focus:bg-[#1c2333] focus:text-white">Easy</SelectItem>
                      <SelectItem value="medium" className="focus:bg-[#1c2333] focus:text-white">Medium</SelectItem>
                      <SelectItem value="hard" className="focus:bg-[#1c2333] focus:text-white">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Destination</Label>
                <input type="hidden" name="visibility" value={visibility} />
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setVisibility('public')} className={`flex flex-col gap-1 p-3 rounded-md border-2 text-left transition-all ${visibility === 'public' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-[#2a3142] bg-[#1c2333] text-[#64748b] hover:border-[#3a4152]'}`}>
                    <span className="font-bold text-sm">📚 Practice Pool</span>
                    <span className="text-[11px] opacity-70">Visible to students</span>
                  </button>
                  <button type="button" onClick={() => setVisibility('exam')} className={`flex flex-col gap-1 p-3 rounded-md border-2 text-left transition-all ${visibility === 'exam' ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-[#2a3142] bg-[#1c2333] text-[#64748b] hover:border-[#3a4152]'}`}>
                    <span className="font-bold text-sm">🔒 Exam Bank</span>
                    <span className="text-[11px] opacity-70">Hidden from students</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Content */}
          <div className="rounded-lg mb-4" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <div className="px-5 py-3" style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Content</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Problem Statement</Label>
                <textarea
                  ref={statementRef}
                  name="statement"
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Enter the question text here…"
                  rows={5}
                  required
                  className={textareaCls}
                  style={INPUT_STYLE}
                  id="question-statement"
                />
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>
                  Image <span className="font-normal" style={{ color: '#64748b' }}>(Optional)</span>
                </Label>
                <input type="hidden" name="image_url" value={imageUrl} />

                {imageUrl ? (
                  <div className="space-y-2">
                    <div className="flex justify-center p-3 rounded-md" style={{ background: '#1c2333', border: '1px solid #2a3142' }}>
                      <Image src={imageUrl} alt="Preview" width={600} height={300} className="max-h-[180px] w-auto object-contain rounded" unoptimized />
                    </div>
                    <button type="button" onClick={() => { setImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-xs text-red-400 hover:text-red-300 transition-colors underline">✕ Remove Image</button>
                  </div>
                ) : (
                  <label
                    htmlFor="image-upload-new"
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md px-6 py-8 cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-500/5' : imageUploading ? 'cursor-not-allowed opacity-50' : 'hover:bg-[#1e2536]'}`}
                    style={{
                      borderColor: isDragging ? '#3b82f6' : '#2a3142',
                      background: '#1c2333'
                    }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    {imageUploading ? (
                      <><svg className="animate-spin w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg><span className="text-sm" style={{ color: '#64748b' }}>Uploading…</span></>
                    ) : (
                      <><svg className="w-7 h-7" style={{ color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-sm" style={{ color: '#94a3b8' }}>{isDragging ? 'Drop to upload' : 'Click or drag image here'}</span><span className="text-xs" style={{ color: '#64748b' }}>PNG, JPG, GIF, WebP</span></>
                    )}
                    <input id="image-upload-new" ref={fileInputRef} type="file" accept="image/*" className="hidden" disabled={imageUploading} onChange={handleImageChange} />
                  </label>
                )}
                {imageError && <p className="text-xs text-red-400">{imageError}</p>}
              </div>
            </div>
          </div>

          {/* Section: Options */}
          <div className="rounded-lg mb-4" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <div className="px-5 py-3" style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Answer</p>
            </div>
            <div className="p-5">
              {type === 'mcq' ? (
                <div className="space-y-3">
                  <RadioGroup value={correctOptionIndex} onValueChange={setCorrectOptionIndex} name="correctOptionIndex" className="space-y-2">
                    {[0, 1, 2, 3].map((i) => {
                      const isCorrect = String(i) === correctOptionIndex
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-md transition-colors" style={{
                          border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : '#2a3142'}`,
                          background: isCorrect ? 'rgba(16,185,129,0.05)' : '#1c2333',
                        }}>
                          <RadioGroupItem value={String(i)} id={`opt_${i}`} className="border-white/20 text-emerald-400 shrink-0" />
                          <span className="text-xs font-mono w-4 shrink-0" style={{ color: '#64748b' }}>{['A','B','C','D'][i]}.</span>
                          <input
                            name={`option_${i}`}
                            value={options[i]}
                            onChange={(e) => { const o = [...options]; o[i] = e.target.value; setOptions(o) }}
                            placeholder={`Option ${i + 1}`}
                            required
                            className="flex-1 bg-transparent border-0 text-white placeholder:text-[#64748b] focus:outline-none text-sm"
                          />
                        </div>
                      )
                    })}
                  </RadioGroup>
                  <p className="text-[11px]" style={{ color: '#64748b' }}>Select the radio button next to the correct answer</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Correct Numerical Answer</Label>
                  <input
                    name="correct_answer"
                    value={numericalAnswer}
                    onChange={(e) => setNumericalAnswer(e.target.value)}
                    placeholder="e.g. 42 or 3.14"
                    required
                    className={inputCls}
                    style={INPUT_STYLE}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section: Extras (collapsible) */}
          <details className="rounded-lg overflow-hidden group mb-4" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <summary className="flex items-center justify-between px-5 py-3 cursor-pointer select-none list-none" style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Extras</p>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" style={{ color: '#64748b' }} />
            </summary>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Solution (Optional)</Label>
                <textarea name="solution" value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Detailed step-by-step solution…" rows={3} className={textareaCls} style={INPUT_STYLE} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Hint (Optional)</Label>
                <input name="hint" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="A short hint…" className={inputCls} style={INPUT_STYLE} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Tags (Optional)</Label>
                <input name="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. kinematics, motion" className={inputCls} style={INPUT_STYLE} />
              </div>
            </div>
          </details>

          {/* Submit */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending || imageUploading}
              id="create-question-btn"
              className="inline-flex items-center gap-2 h-10 px-6 text-sm font-bold rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.35)]"
            >
              {isPending ? 'Creating…' : imageUploading ? 'Uploading image…' : 'Create Question'}
            </button>
            <Link href="/admin/questions" className="text-sm hover:text-white transition-colors" style={{ color: '#64748b' }}>
              Cancel
            </Link>
          </div>
        </form>

        {/* ── RIGHT: Live preview (sticky, desktop only) ── */}
        <div className="hidden lg:block sticky top-[72px] h-[calc(100vh-96px)] rounded-lg overflow-hidden flex flex-col" style={{ background: '#0d1117', border: '1px solid #2a3142' }}>
          <div className="px-4 py-2.5 shrink-0" style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Live Preview</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
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
    </div>
  )
}
