'use client'

import { useState } from 'react'
import { RawImportData, PreviewData } from '@/lib/import/types'
import { normalizeImportData } from '@/lib/import/normalize'
import { processImportData, commitImport } from './actions'
import { ImportDropzone } from '@/components/admin/import-dropzone'
import { ImportPreview } from '@/components/admin/import-preview'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Upload, Eye, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Step = 'upload' | 'preview' | 'result'

const STEPS = [
  { id: 'upload',  label: 'Upload JSON',  num: 1 },
  { id: 'preview', label: 'Preview',      num: 2 },
  { id: 'result',  label: 'Result',       num: 3 },
] as const

const SAMPLE_JSON = JSON.stringify([
  {
    statement: "What is the SI unit of force?",
    type: "mcq",
    difficulty: "easy",
    visibility: "public",
    chapter: "Laws of Motion",
    subject: "Physics",
    options: ["Newton", "Joule", "Watt", "Pascal"],
    correct_option: 0,
    solution: "Force = mass × acceleration. SI unit is Newton (N).",
    hint: "Think F = ma",
    tags: ["basics", "mechanics"]
  }
], null, 2)

function downloadSample() {
  const blob = new Blob([SAMPLE_JSON], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sample-questions.json'
  a.click()
  URL.revokeObjectURL(url)
}

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex(s => s.id === current)

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIdx
        const active = step.id === current

        return (
          <div key={step.id} className="flex items-center gap-0 flex-1 last:flex-initial">
            <div className={`flex items-center gap-2.5 shrink-0 ${active ? 'text-foreground' : done ? 'text-accent-cyan' : 'text-muted-2'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                active ? 'border-accent-electric bg-accent-electric text-white' :
                done   ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan' :
                         'border-white/10 bg-surface-2 text-muted-2'
              }`}>
                {done ? '✓' : step.num}
              </div>
              <span className={`text-xs font-bold hidden sm:block ${active ? 'text-foreground' : done ? 'text-accent-cyan' : 'text-muted-2'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-connector mx-3 ${done ? 'done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [insertResult, setInsertResult] = useState<{ insertedCount: number; skippedCount: number; errorCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleParsed = async (rawData: RawImportData[]) => {
    setIsProcessing(true)
    setError(null)
    try {
      const normalized = normalizeImportData(rawData)
      const result = await processImportData(normalized)
      setPreviewData(result)
      setStep('preview')
    } catch (err: any) {
      setError(err.message || 'Failed to process import data.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = async () => {
    if (!previewData) return
    setIsProcessing(true)
    setError(null)
    try {
      const validQs = previewData.validQuestions.map(v => v.question)
      const res = await commitImport(validQs)
      setInsertResult(res)
      setStep('result')
    } catch (err: any) {
      setError(err.message || 'Failed to insert questions.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setPreviewData(null)
    setStep('upload')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-foreground">Bulk Import Questions</h1>
        <p className="text-sm text-muted mt-1">Upload a JSON or CSV file to add multiple questions at once.</p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Error */}
      {error && (
        <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="font-bold">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="relative">
            <ImportDropzone onParsed={handleParsed} />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-md rounded-xl z-10">
                <span className="font-bold text-accent-cyan animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">Processing data…</span>
              </div>
            )}
          </div>

          {/* JSON schema hint */}
          <div className="rounded-xl border border-white/[0.08] bg-surface overflow-hidden">
            <details>
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-bold text-muted-2 hover:text-foreground transition-colors list-none">
                <span>📋 Expected JSON format</span>
                <span className="text-xs text-accent-cyan">Show</span>
              </summary>
              <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
                <pre className="text-xs text-muted font-mono leading-relaxed overflow-x-auto">{SAMPLE_JSON}</pre>
              </div>
            </details>
          </div>

          {/* Download sample */}
          <button
            type="button"
            onClick={downloadSample}
            className="inline-flex items-center gap-2 text-xs font-bold text-accent-cyan hover:text-accent-glow transition-colors"
            id="download-sample-btn"
          >
            <Upload className="h-3.5 w-3.5" />
            Download sample JSON
          </button>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 'preview' && previewData && (
        <ImportPreview
          data={previewData}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isSubmitting={isProcessing}
        />
      )}

      {/* ── Step 3: Result ── */}
      {step === 'result' && insertResult && (
        <div className="space-y-6">
          {/* Big success number */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
            <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <p className="text-5xl font-extrabold text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] tabular-nums">
              {insertResult.insertedCount}
            </p>
            <p className="text-sm text-muted mt-2 font-medium">questions imported successfully</p>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 border border-white/[0.08] rounded-2xl text-center bg-surface">
              <div className="text-2xl font-black text-amber-400">{insertResult.skippedCount}</div>
              <div className="text-xs text-muted font-medium mt-1">Skipped (duplicates)</div>
            </div>
            <div className="p-5 border border-white/[0.08] rounded-2xl text-center bg-surface">
              <div className="text-2xl font-black text-red-400">{insertResult.errorCount}</div>
              <div className="text-xs text-muted font-medium mt-1">Errors</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-white font-bold text-sm rounded-xl hover:brightness-110 transition-all shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)]"
              onClick={() => { setStep('upload'); setPreviewData(null); setInsertResult(null) }}
              id="import-more-btn"
            >
              <Upload className="h-4 w-4" />
              Import More
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 bg-surface-2 text-foreground font-bold text-sm rounded-xl hover:bg-white/[0.08] transition-all"
            >
              View Questions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
