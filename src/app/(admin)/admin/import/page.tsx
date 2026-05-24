'use client'

import { useState } from 'react'
import { RawImportData, PreviewData } from '@/lib/import/types'
import { normalizeImportData } from '@/lib/import/normalize'
import { processImportData, commitImport } from './actions'
import { ImportDropzone } from '@/components/admin/import-dropzone'
import { ImportPreview } from '@/components/admin/import-preview'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Upload, Code, FileJson, UploadCloud, FolderInput, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Step = 'upload' | 'preview' | 'result'

const STEPS = [
  { id: 'upload',  label: 'Upload JSON', num: 1 },
  { id: 'preview', label: 'Preview',     num: 2 },
  { id: 'result',  label: 'Result',      num: 3 },
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
        const done   = i < currentIdx
        const active = step.id === current

        return (
          <div key={step.id} className="flex items-center gap-0 flex-1 last:flex-initial">
            <div className={`flex items-center gap-2.5 shrink-0 ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-[#64748b]'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                active ? 'bg-blue-600 text-white border-2 border-blue-600' :
                done   ? 'bg-emerald-600/20 text-emerald-400 border-2 border-emerald-600/30' :
                         'border-2 text-[#64748b]'
              }`}
                style={(!active && !done) ? { background: '#1c2333', borderColor: '#2a3142' } : {}}
              >
                {done ? '✓' : step.num}
              </div>
              <span className={`text-xs font-bold hidden sm:block ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-[#64748b]'}`}>
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
  const [importMode, setImportMode] = useState<'file' | 'raw'>('file')
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [insertResult, setInsertResult] = useState<{ insertedCount: number; skippedCount: number; errorCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rawJson, setRawJson] = useState('')
  const [rawJsonError, setRawJsonError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')

  const handleParseRaw = () => {
    setRawJsonError(null)
    if (!rawJson.trim()) { setRawJsonError('Please enter some JSON code.'); return }
    try {
      const parsed = JSON.parse(rawJson)
      handleParsed(Array.isArray(parsed) ? parsed : [parsed])
    } catch (err: any) {
      setRawJsonError(`Invalid JSON format: ${err.message}`)
    }
  }

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
    setProgress(0)
    setProgressText('Starting import...')
    try {
      const validQs = previewData.validQuestions.map(v => v.question)
      const CHUNK_SIZE = 200
      let totalInserted = 0
      let totalSkipped = 0
      let totalErrors = 0

      for (let i = 0; i < validQs.length; i += CHUNK_SIZE) {
        const chunk = validQs.slice(i, i + CHUNK_SIZE)
        setProgressText(`Importing ${Math.min(i + CHUNK_SIZE, validQs.length)} of ${validQs.length} questions...`)
        
        const res = await commitImport(chunk)
        totalInserted += res.insertedCount
        totalSkipped += res.skippedCount
        totalErrors += res.errorCount
        
        setProgress(Math.round(((i + chunk.length) / validQs.length) * 100))
      }

      setInsertResult({
        insertedCount: totalInserted,
        skippedCount: totalSkipped,
        errorCount: totalErrors
      })
      setStep('result')
    } catch (err: any) {
      setError(err.message || 'Failed to insert questions.')
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setProgressText('')
    }
  }

  const handleCancel = () => {
    setPreviewData(null)
    setStep('upload')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-md flex items-center justify-center"
          style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.25)' }}
        >
          <FolderInput className="h-4 w-4 text-sky-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Bulk Import Questions</h1>
          <p className="text-[13px]" style={{ color: '#64748b' }}>Upload a JSON file to add multiple questions at once.</p>
        </div>
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
          {/* Mode Toggle */}
          <div className="flex items-center gap-0.5 p-1 rounded-md w-fit"
            style={{ background: '#161b27', border: '1px solid #2a3142' }}
          >
            <button
              onClick={() => setImportMode('file')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-bold transition-all ${
                importMode === 'file'
                  ? 'text-white'
                  : 'text-[#64748b] hover:text-white'
              }`}
              style={importMode === 'file' ? { background: '#1c2333' } : {}}
            >
              <Upload className="h-4 w-4" /> File Upload
            </button>
            <button
              onClick={() => setImportMode('raw')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-bold transition-all ${
                importMode === 'raw'
                  ? 'text-white'
                  : 'text-[#64748b] hover:text-white'
              }`}
              style={importMode === 'raw' ? { background: '#1c2333' } : {}}
            >
              <Code className="h-4 w-4" /> Raw JSON
            </button>
          </div>

          {importMode === 'file' ? (
            <div className="relative">
              <ImportDropzone onParsed={handleParsed} />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md rounded-lg z-10"
                  style={{ background: 'rgba(0,0,0,0.65)' }}
                >
                  <span className="font-bold text-sky-400 animate-pulse">Processing data…</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="relative group">
                <textarea
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  placeholder="Paste your JSON here..."
                  className="w-full h-[300px] p-5 text-[13px] font-mono text-white placeholder:text-[#64748b] focus:outline-none transition-all resize-y"
                  style={{
                    background: '#0d1117',
                    border: '2px solid #2a3142',
                    borderRadius: 8,
                  }}
                  spellCheck={false}
                />
                <button
                  onClick={() => setRawJson(SAMPLE_JSON)}
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all opacity-0 group-hover:opacity-100"
                  style={{ background: '#1c2333', border: '1px solid #2a3142', color: '#94a3b8', borderRadius: 6 }}
                >
                  <FileJson className="h-3.5 w-3.5" />
                  Load Template
                </button>
              </div>

              {rawJsonError && (
                <Alert className="bg-red-500/10 border-red-500/20 text-red-400 py-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-sm font-medium ml-2">{rawJsonError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleParseRaw}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-md hover:bg-blue-500 transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(59,130,246,0.35)]"
                >
                  <Code className="h-4 w-4" />
                  {isProcessing ? 'Validating...' : 'Validate & Import'}
                </button>
              </div>
            </div>
          )}

          {/* JSON schema hint */}
          <div className="rounded-lg overflow-hidden" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <details>
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-bold transition-colors list-none hover:text-white"
                style={{ color: '#94a3b8' }}
              >
                <span>📋 Expected JSON format</span>
                <span className="text-xs text-sky-400">Show</span>
              </summary>
              <div className="px-5 pb-5 pt-4" style={{ borderTop: '1px solid #2a3142' }}>
                <pre className="text-xs font-mono leading-relaxed overflow-x-auto" style={{ color: '#94a3b8' }}>{SAMPLE_JSON}</pre>
              </div>
            </details>
          </div>

          {/* Download sample */}
          <button
            type="button"
            onClick={downloadSample}
            className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
            id="download-sample-btn"
          >
            <Upload className="h-3.5 w-3.5" />
            Download sample JSON
          </button>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 'preview' && previewData && (
        <div className="space-y-4">
          <ImportPreview
            data={previewData}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isSubmitting={isProcessing}
          />
          {isProcessing && progress > 0 && (
            <div className="bg-surface-2 border border-border p-5 rounded-lg space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-foreground">{progressText}</span>
                <span className="text-sky-400">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-surface overflow-hidden rounded-full border border-border">
                <div 
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Result ── */}
      {step === 'result' && insertResult && (
        <div className="space-y-6">
          {/* Success card */}
          <div className="rounded-lg p-8 text-center" style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }}>
            <div className="size-14 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="text-5xl font-black text-emerald-400 tabular-nums">{insertResult.insertedCount}</p>
            <p className="text-sm mt-2 font-medium" style={{ color: '#94a3b8' }}>questions imported successfully</p>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-lg text-center" style={{ border: '1px solid #2a3142', background: '#161b27' }}>
              <div className="text-2xl font-black text-amber-400">{insertResult.skippedCount}</div>
              <div className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>Skipped (duplicates)</div>
            </div>
            <div className="p-5 rounded-lg text-center" style={{ border: '1px solid #2a3142', background: '#161b27' }}>
              <div className="text-2xl font-black text-red-400">{insertResult.errorCount}</div>
              <div className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>Errors</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-md hover:bg-blue-500 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.35)]"
              onClick={() => { setStep('upload'); setPreviewData(null); setInsertResult(null) }}
              id="import-more-btn"
            >
              <Upload className="h-4 w-4" />
              Import More
            </button>
            <Link
              href="/admin/questions"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm transition-all"
              style={{ border: '1px solid #2a3142', background: '#161b27', color: '#94a3b8' }}
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
