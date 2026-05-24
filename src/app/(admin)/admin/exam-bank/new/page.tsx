'use client'

import { useState, useEffect, useRef } from 'react'
import { createExamQuestion } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'

const IMGBB_KEY = process.env.NEXT_PUBLIC_IMGBB_KEY!

const inputCls = "w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-2 focus:border-accent-glow focus:outline-none focus:ring-2 focus:ring-accent-glow/30 transition text-sm"
const textareaCls = `${inputCls} resize-none`
const selectTriggerCls = "w-full bg-surface-2 border border-border text-foreground focus:ring-accent-glow/30 focus:border-accent-glow h-12 rounded-md"

export default function NewExamQuestionPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [type, setType] = useState('mcq')
  const [error, setError] = useState<string | null>(null)

  // Image upload state
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadSubjects() {
      const { data } = await supabase.from('subjects').select('*').order('name')
      if (data) setSubjects(data)
    }
    loadSubjects()
  }, [])

  useEffect(() => {
    async function loadChapters() {
      if (!selectedSubject) { setChapters([]); return }
      const { data } = await supabase.from('chapters').select('*').eq('subject_id', selectedSubject).order('name')
      if (data) setChapters(data)
    }
    loadChapters()
  }, [selectedSubject])

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError(null)
    setImageUploading(true)
    setImageUrl('')

    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.success) {
        setImageUrl(json.data.url)
      } else {
        setImageError('Upload failed. Please try again.')
      }
    } catch {
      setImageError('Network error during upload.')
    } finally {
      setImageUploading(false)
    }
  }

  function handleRemoveImage() {
    setImageUrl('')
    setImageError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createExamQuestion(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-foreground">Upload Exam Question</h1>
        <p className="text-muted mt-1">Add a question to the Exam Bank. Only admin-created exams can use these.</p>
      </div>

      {/* Notice banner */}
      <div className="flex items-start gap-3 rounded-md border border-violet-500/30 bg-violet-500/10 px-4 py-3.5">
        <ShieldCheck className="h-5 w-5 text-violet-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-violet-300">
          <span className="font-bold">Exam-only question.</span> This question will NOT be visible to students during
          practice. It will only appear when assigned to a Weekly Exam by an admin.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <form action={handleSubmit}>
          <div className="border-b border-border px-6 py-5">
            <h2 className="font-bold text-foreground">Question Details</h2>
          </div>
          <div className="space-y-6 p-6">

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Subject</Label>
                <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v ?? '')} required>
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border border-border text-foreground">
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id} className="focus:bg-surface-2">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Chapter</Label>
                <Select name="chapterId" required disabled={!selectedSubject}>
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="Select Chapter" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border border-border text-foreground">
                    {chapters.map(c => (
                      <SelectItem key={c.id} value={c.id} className="focus:bg-surface-2">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Type</Label>
                <Select name="type" value={type} onValueChange={(v) => setType(v ?? 'mcq')}>
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border border-border text-foreground">
                    <SelectItem value="mcq" className="focus:bg-surface-2">Multiple Choice</SelectItem>
                    <SelectItem value="numerical" className="focus:bg-surface-2">Numerical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Difficulty</Label>
                <Select name="difficulty" defaultValue="medium">
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border border-border text-foreground">
                    <SelectItem value="easy" className="focus:bg-surface-2">Easy</SelectItem>
                    <SelectItem value="medium" className="focus:bg-surface-2">Medium</SelectItem>
                    <SelectItem value="hard" className="focus:bg-surface-2">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Problem Statement</Label>
              <textarea name="statement" placeholder="Enter the question text here..." rows={4} required className={textareaCls} />
            </div>

            {/* Image upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Question Image <span className="text-muted-2 font-normal">(Optional — diagrams, figures)</span>
              </Label>
              <input type="hidden" name="image_url" value={imageUrl} />

              {imageUrl ? (
                <div className="space-y-3">
                  <div className="flex justify-center bg-surface-2 border border-border rounded-md p-3">
                    <Image
                      src={imageUrl}
                      alt="Question diagram preview"
                      width={600}
                      height={300}
                      className="max-h-[220px] w-auto object-contain rounded"
                      unoptimized
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs text-red-400 hover:text-red-300 underline transition-colors"
                  >
                    ✕ Remove Image
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image-upload-exam"
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md px-6 py-8 cursor-pointer transition-colors ${
                    imageUploading
                      ? 'border-accent-glow/50 bg-accent-glow/5 cursor-not-allowed'
                      : 'border-border hover:border-accent-glow/60 hover:bg-surface-2'
                  }`}
                >
                  {imageUploading ? (
                    <>
                      <svg className="animate-spin w-6 h-6 text-accent-glow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span className="text-sm text-muted">Uploading image…</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-muted-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-muted">Click to upload a diagram or figure</span>
                      <span className="text-xs text-muted-2">PNG, JPG, GIF, WebP</span>
                    </>
                  )}
                  <input
                    id="image-upload-exam"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={imageUploading}
                    onChange={handleImageChange}
                  />
                </label>
              )}
              {imageError && <p className="text-xs text-red-400">{imageError}</p>}
            </div>

            {type === 'mcq' ? (
              <div className="space-y-4 border border-border bg-surface-2 p-5 rounded-md">
                <Label className="text-sm font-bold text-foreground">Options &amp; Correct Answer</Label>
                <RadioGroup name="correctOptionIndex" defaultValue="0" className="space-y-3">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="flex items-center space-x-3 bg-surface border border-border p-3 rounded-md">
                      <RadioGroupItem value={index.toString()} id={`exam_opt_${index}`} className="border-border-strong text-accent-cyan ml-2" />
                      <input name={`option_${index}`} placeholder={`Option ${index + 1}`} required className="flex-1 bg-transparent border-0 text-foreground placeholder:text-muted-2 focus:outline-none text-sm" />
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ) : (
              <div className="space-y-2 border border-border bg-surface-2 p-5 rounded-md">
                <Label className="text-sm font-bold text-foreground">Correct Numerical Answer</Label>
                <input name="correct_answer" placeholder="e.g. 42" required className={inputCls} />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Solution (Optional)</Label>
              <textarea name="solution" placeholder="Detailed step-by-step solution..." rows={3} className={textareaCls} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Hint (Optional)</Label>
              <input name="hint" placeholder="A short hint..." className={inputCls} />
            </div>

            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-border px-6 py-5 flex items-center gap-4">
            <Button type="submit" variant="primary" disabled={imageUploading}>
              {imageUploading ? 'Uploading image…' : 'Upload to Exam Bank'}
            </Button>
            <a href="/admin/exam-bank" className="text-sm text-muted hover:text-foreground transition-colors">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
