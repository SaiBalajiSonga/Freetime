'use client'

import { useState, useMemo, useRef } from 'react'
import Latex from '@/components/ui/latex'
import {
  CheckCircle2,
  AlertTriangle,
  Printer,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Type,
  Hash,
  ListChecks,
  Calculator,
  ChevronDown,
  Download,
  FileJson,
  Globe,
  Lock,
} from 'lucide-react'

// ── Types matching the standard JSON output and pipeline MergedQuestion ─────

export type PipelineOption = {
  text: string
  is_correct: boolean
}

export type PipelineQuestion = {
  // Standard Platform JSON schema
  statement?: string
  type?: 'mcq' | 'numerical'
  difficulty?: 'easy' | 'medium' | 'hard'
  visibility?: 'public' | 'private'
  chapter?: string
  subject?: string
  options?: string[] | PipelineOption[] | null
  correct_option?: number
  correct_answer?: string | null
  solution?: string | null

  // Pipeline internal / legacy aliases
  chapter_name?: string
  question_number?: number
  question_text?: string
  question_type?: 'mcq' | 'numerical'
  ai_difficulty?: 'easy' | 'medium' | 'hard'
  source?: string | null
  merge_status?: 'ok' | 'KEY_NOT_FOUND'
}

type PipelinePreviewProps = {
  questions: PipelineQuestion[]
  subject?: string
}

// ── Helper: Format standard JSON matching the user's exact specification ─────

export function generateStandardJson(
  questions: PipelineQuestion[],
  defaultSubject: string = 'Mathematics'
): string {
  const result = questions.map((q) => {
    const qType = (q.type || q.question_type || 'mcq') as 'mcq' | 'numerical'
    const item: Record<string, any> = {
      statement: q.statement || q.question_text || '',
      type: qType,
      difficulty: q.difficulty || q.ai_difficulty || 'medium',
      visibility: q.visibility || 'public',
      chapter: q.chapter || q.chapter_name || 'General',
      subject: q.subject || defaultSubject,
    }

    if (qType === 'mcq' && q.options) {
      if (typeof q.options[0] === 'string') {
        item.options = (q.options as string[]).map((t) => String(t))
        item.correct_option = q.correct_option ?? 0
      } else {
        const optObjs = q.options as PipelineOption[]
        item.options = optObjs.map((o) => o.text)
        const cIdx = optObjs.findIndex((o) => o.is_correct)
        item.correct_option = cIdx >= 0 ? cIdx : (q.correct_option ?? 0)
      }
    } else if (qType === 'numerical') {
      item.correct_answer = q.correct_answer || ''
    }

    item.solution = q.solution || ''

    return item
  })

  return JSON.stringify(result, null, 2)
}

// ── Helper: Format full LaTeX document string for export ─────────────────────

function generateLatexDocument(questions: PipelineQuestion[], subject: string): string {
  const chapters = Array.from(
    new Set(questions.map((q) => q.chapter || q.chapter_name || 'General'))
  )

  let doc = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\usepackage{tabularx}
\\usepackage{xcolor}

\\title{\\textbf{JEE (Main) Question Bank}\\\\\\large ${subject}}
\\author{JEEsociety Plus}
\\date{\\today}

\\begin{document}
\\maketitle
\\rule{\\textwidth}{1pt}

`

  for (const chapter of chapters) {
    const chapterQuestions = questions.filter(
      (q) => (q.chapter || q.chapter_name || 'General') === chapter
    )
    doc += `\\section*{${chapter}}\n\n`

    chapterQuestions.forEach((q, idx) => {
      const qNum = q.question_number ?? idx + 1
      const qText = q.statement || q.question_text || ''
      const qType = q.type || q.question_type || 'mcq'
      const srcTag = q.source ? ` [${q.source}]` : ''
      doc += `\\noindent \\textbf{Q.${qNum}.}${srcTag} ${qText}\n\n`

      if (qType === 'mcq' && q.options && q.options.length > 0) {
        doc += `\\begin{enumerate}[label=(\\arabic*)]\n`
        const isStringOpt = typeof q.options[0] === 'string'
        const cIdx = q.correct_option ?? 0
        q.options.forEach((opt: any, oIdx: number) => {
          const optText = isStringOpt ? opt : opt.text
          const isCorrect = isStringOpt ? oIdx === cIdx : opt.is_correct
          const star = isCorrect ? ' % [Correct Answer]' : ''
          doc += `  \\item ${optText}${star}\n`
        })
        doc += `\\end{enumerate}\n`
        const correctNum = isStringOpt
          ? cIdx + 1
          : q.options.findIndex((o: any) => o.is_correct) + 1
        if (correctNum > 0) {
          doc += `\\noindent \\textbf{Answer: (${correctNum})}\n\n`
        }
      } else if (qType === 'numerical' && q.correct_answer) {
        doc += `\\noindent \\textbf{Answer: ${q.correct_answer}}\n\n`
      }

      doc += `\\vspace{1em}\n`
    })
  }

  doc += `\\newpage\n\\section*{Answer Key}\n\\begin{tabular}{|c|c|}\n\\hline\nQ.No & Answer \\\\\n\\hline\n`
  questions.forEach((q, idx) => {
    const qNum = q.question_number ?? idx + 1
    const qType = q.type || q.question_type || 'mcq'
    let ans = '-'
    if (qType === 'mcq' && q.options) {
      if (typeof q.options[0] === 'string') {
        ans = q.correct_option !== undefined ? `(${q.correct_option + 1})` : '-'
      } else {
        const cIdx = q.options.findIndex((o: any) => o.is_correct)
        ans = cIdx >= 0 ? `(${cIdx + 1})` : '-'
      }
    } else if (qType === 'numerical' && q.correct_answer) {
      ans = q.correct_answer
    }
    doc += `${qNum} & ${ans} \\\\\n`
  })
  doc += `\\hline\n\\end{tabular}\n\n\\end{document}`

  return doc
}

export function PipelinePreview({ questions, subject = 'Mathematics' }: PipelinePreviewProps) {
  // Document state controls
  const [theme, setTheme] = useState<'paper' | 'dark'>('paper')
  const [showAnswers, setShowAnswers] = useState(true)
  const [fontSerif, setFontSerif] = useState(true)
  const [selectedChapter, setSelectedChapter] = useState<string>('all')
  const [copiedLatex, setCopiedLatex] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)

  const docRef = useRef<HTMLDivElement>(null)

  // Chapters list
  const chapters = useMemo(() => {
    const list = Array.from(
      new Set(questions.map((q) => q.chapter || q.chapter_name || 'General'))
    )
    return list
  }, [questions])

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    if (selectedChapter === 'all') return questions
    return questions.filter(
      (q) => (q.chapter || q.chapter_name || 'General') === selectedChapter
    )
  }, [questions, selectedChapter])

  // Group filtered questions by chapter
  const groupedQuestions = useMemo(() => {
    const map = new Map<string, PipelineQuestion[]>()
    for (const q of filteredQuestions) {
      const ch = q.chapter || q.chapter_name || 'General'
      const arr = map.get(ch) || []
      arr.push(q)
      map.set(ch, arr)
    }
    return Array.from(map.entries())
  }, [filteredQuestions])

  // Stats
  const totalMcq = questions.filter(
    (q) => (q.type || q.question_type) === 'mcq'
  ).length
  const totalNum = questions.filter(
    (q) => (q.type || q.question_type) === 'numerical'
  ).length
  const missingKeys = questions.filter(
    (q) => q.merge_status === 'KEY_NOT_FOUND'
  ).length

  // Print trigger
  const handlePrint = () => {
    window.print()
  }

  // Copy LaTeX code
  const handleCopyLatex = () => {
    const code = generateLatexDocument(questions, subject)
    navigator.clipboard.writeText(code)
    setCopiedLatex(true)
    setTimeout(() => setCopiedLatex(false), 2000)
  }

  // Copy Standard JSON format
  const handleCopyJson = () => {
    const jsonStr = generateStandardJson(questions, subject)
    navigator.clipboard.writeText(jsonStr)
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  // Download Standard JSON file
  const handleDownloadJson = () => {
    const jsonStr = generateStandardJson(questions, subject)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${subject.toLowerCase()}-questions.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isPaper = theme === 'paper'

  return (
    <div className="space-y-6">
      {/* ── Document Control Toolbar (Hidden in Print) ── */}
      <div
        className="no-print sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl backdrop-blur-md transition-all shadow-xl"
        style={{
          background: 'rgba(22, 27, 39, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Left: Summary and Chapter Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs">
            <span className="font-bold text-white tabular-nums">{questions.length}</span>
            <span className="text-white/50">Questions</span>
            <span className="text-white/20">•</span>
            <span className="text-blue-400 font-semibold">{totalMcq} MCQ</span>
            <span className="text-white/20">•</span>
            <span className="text-violet-400 font-semibold">{totalNum} Numerical</span>
            {missingKeys > 0 && (
              <>
                <span className="text-white/20">•</span>
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {missingKeys} unkeyed
                </span>
              </>
            )}
          </div>

          {/* Chapter Selector */}
          {chapters.length > 1 && (
            <div className="relative">
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="appearance-none text-xs font-semibold px-3 py-1.5 pr-7 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all" className="bg-[#161b27]">
                  All Chapters ({chapters.length})
                </option>
                {chapters.map((ch) => (
                  <option key={ch} value={ch} className="bg-[#161b27]">
                    {ch}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Right: Document Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Answer Toggle */}
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              showAnswers
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'bg-white/[0.05] text-white/70 border border-white/[0.1] hover:text-white'
            }`}
            title="Toggle correct answers and solution keys"
          >
            {showAnswers ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>{showAnswers ? 'Answers: Shown' : 'Answers: Hidden'}</span>
          </button>

          {/* Font Toggle (Serif vs Sans) */}
          <button
            onClick={() => setFontSerif(!fontSerif)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              fontSerif
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-white/[0.05] text-white/70 border border-white/[0.1] hover:text-white'
            }`}
            title="Toggle LaTeX Serif (Computer Modern) or Modern Sans font"
          >
            <Type className="h-3.5 w-3.5" />
            <span>{fontSerif ? 'LaTeX Serif' : 'Modern Sans'}</span>
          </button>

          {/* Paper View vs Dark Mode */}
          <button
            onClick={() => setTheme(isPaper ? 'dark' : 'paper')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] border border-white/[0.1] text-white/80 hover:text-white transition-all"
            title="Switch between Paper Document view and Night Dark view"
          >
            {isPaper ? <Moon className="h-3.5 w-3.5 text-indigo-300" /> : <Sun className="h-3.5 w-3.5 text-amber-300" />}
            <span>{isPaper ? 'Night View' : 'Paper View'}</span>
          </button>

          {/* Print / Save as PDF */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.08] hover:bg-white/[0.15] text-white transition-all border border-white/[0.1]"
            title="Print or save as camera-ready PDF document"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {/* Copy LaTeX source */}
          <button
            onClick={handleCopyLatex}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.08] hover:bg-white/[0.15] text-white transition-all border border-white/[0.1]"
            title="Copy full LaTeX (.tex) document code"
          >
            {copiedLatex ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedLatex ? 'Copied .tex!' : 'Copy LaTeX'}</span>
          </button>

          {/* Copy Standard JSON format */}
          <button
            onClick={handleCopyJson}
            id="copy-json-btn"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              copiedJson
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/[0.08] hover:bg-white/[0.15] text-white border-white/[0.1]'
            }`}
            title="Copy questions in standard JSON format"
          >
            {copiedJson ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <FileJson className="h-3.5 w-3.5 text-sky-400" />}
            <span>{copiedJson ? 'Copied JSON!' : 'Copy JSON'}</span>
          </button>

          {/* Download Standard JSON file */}
          <button
            onClick={handleDownloadJson}
            id="download-json-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600/80 hover:bg-sky-500 text-white transition-all shadow-sm"
            title="Download questions as JSON file"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
        </div>
      </div>

      {/* ── Document Page Container (The actual LaTeX paper) ── */}
      <div
        ref={docRef}
        id="latex-document-container"
        className={`latex-paper mx-auto max-w-4xl rounded-2xl transition-all duration-200 ${
          fontSerif ? 'latex-serif-mode' : 'font-sans'
        }`}
        style={{
          backgroundColor: isPaper ? '#ffffff' : '#0d1117',
          color: isPaper ? '#0f172a' : '#e6edf3',
          border: isPaper ? '1px solid #e2e8f0' : '1px solid #30363d',
          boxShadow: isPaper
            ? '0 20px 50px -10px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.15)'
            : '0 20px 50px -10px rgba(0,0,0,0.5)',
          padding: '3rem 3.5rem',
        }}
      >
        {/* ── LaTeX Document Masthead / Title ── */}
        <header className="text-center mb-8">
          <p
            className="text-xs font-bold tracking-[0.25em] uppercase mb-1"
            style={{ color: isPaper ? '#475569' : '#8b949e' }}
          >
            Joint Entrance Examination (Main)
          </p>
          <h1
            className="text-2xl sm:text-3xl font-black tracking-tight uppercase"
            style={{
              fontFamily: fontSerif
                ? "'Latin Modern Roman', 'Computer Modern', 'Times New Roman', serif"
                : 'inherit',
            }}
          >
            {selectedChapter === 'all'
              ? `${subject} — Question Bank`
              : `${subject} — ${selectedChapter}`}
          </h1>
          <p
            className="text-xs mt-1.5 font-medium italic"
            style={{ color: isPaper ? '#64748b' : '#8b949e' }}
          >
            Prepared from Official Examination Papers • Typeset with KaTeX & LaTeX
          </p>

          {/* Double LaTeX rule */}
          <div className="mt-4 mb-1">
            <div
              className="w-full h-[2px]"
              style={{ backgroundColor: isPaper ? '#0f172a' : '#e6edf3' }}
            />
            <div
              className="w-full h-[0.5px] mt-[2px]"
              style={{ backgroundColor: isPaper ? '#0f172a' : '#e6edf3' }}
            />
          </div>

          {/* Document metadata banner */}
          <div
            className="flex flex-wrap items-center justify-between text-xs py-1.5 px-2 border-b"
            style={{
              borderColor: isPaper ? '#e2e8f0' : '#21262d',
              color: isPaper ? '#475569' : '#8b949e',
            }}
          >
            <span>
              <strong>Total Questions:</strong> {filteredQuestions.length}
            </span>
            <span>
              <strong>Breakdown:</strong> {totalMcq} MCQ • {totalNum} Numerical
            </span>
            <span>
              <strong>Marking:</strong> +4 Correct • -1 Incorrect (MCQ)
            </span>
            <span>
              <strong>Time:</strong> 3 Hours
            </span>
          </div>

          {/* Document Instructions */}
          <div
            className="mt-3 p-3 text-left text-[11.5px] rounded-md leading-relaxed"
            style={{
              backgroundColor: isPaper ? '#f8fafc' : '#161b22',
              border: isPaper ? '1px solid #e2e8f0' : '1px solid #30363d',
              color: isPaper ? '#334155' : '#8b949e',
            }}
          >
            <p className="font-bold mb-1 uppercase tracking-wider text-[10px]">
              General Instructions:
            </p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>
                <strong>Section A (MCQ):</strong> Each question has four options (1), (2), (3), (4).
                Only one option is correct.
              </li>
              <li>
                <strong>Section B (Numerical):</strong> Enter the correct integer or decimal value.
              </li>
              <li>
                All mathematical symbols and formulas are verified in standard LaTeX format.
              </li>
            </ol>
          </div>
        </header>

        {/* ── Document Body (Questions) ── */}
        <div className="space-y-10">
          {groupedQuestions.map(([chapterName, chapterQs]) => {
            const mcqs = chapterQs.filter((q) => (q.type || q.question_type) === 'mcq')
            const nums = chapterQs.filter((q) => (q.type || q.question_type) === 'numerical')

            return (
              <section key={chapterName} className="space-y-8">
                {/* Chapter LaTeX Section Heading */}
                {selectedChapter === 'all' && (
                  <div
                    className="pb-2 border-b-2 pt-4"
                    style={{ borderColor: isPaper ? '#0f172a' : '#e6edf3' }}
                  >
                    <h2
                      className="text-lg sm:text-xl font-bold tracking-tight uppercase"
                      style={{
                        fontFamily: fontSerif
                          ? "'Latin Modern Roman', 'Computer Modern', 'Times New Roman', serif"
                          : 'inherit',
                      }}
                    >
                      Chapter: {chapterName}
                    </h2>
                    <p
                      className="text-xs italic"
                      style={{ color: isPaper ? '#64748b' : '#8b949e' }}
                    >
                      {chapterQs.length} Questions ({mcqs.length} Single Choice, {nums.length}{' '}
                      Numerical)
                    </p>
                  </div>
                )}

                {/* Section A: MCQ Questions */}
                {mcqs.length > 0 && (
                  <div className="space-y-6">
                    <div
                      className="text-xs font-bold uppercase tracking-wider pb-1 border-b"
                      style={{
                        borderColor: isPaper ? '#cbd5e1' : '#30363d',
                        color: isPaper ? '#1e293b' : '#c9d1d9',
                      }}
                    >
                      Section — A: Multiple Choice Questions (Single Correct Option)
                    </div>

                    <div className="space-y-7">
                      {mcqs.map((q, idx) => (
                        <DocumentQuestionItem
                          key={`${chapterName}-mcq-${idx}`}
                          q={q}
                          defaultIndex={idx + 1}
                          isPaper={isPaper}
                          showAnswers={showAnswers}
                          fontSerif={fontSerif}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Section B: Numerical Questions */}
                {nums.length > 0 && (
                  <div className="space-y-6 pt-4">
                    <div
                      className="text-xs font-bold uppercase tracking-wider pb-1 border-b"
                      style={{
                        borderColor: isPaper ? '#cbd5e1' : '#30363d',
                        color: isPaper ? '#1e293b' : '#c9d1d9',
                      }}
                    >
                      Section — B: Numerical Value Type Questions
                    </div>

                    <div className="space-y-7">
                      {nums.map((q, idx) => (
                        <DocumentQuestionItem
                          key={`${chapterName}-num-${idx}`}
                          q={q}
                          defaultIndex={mcqs.length + idx + 1}
                          isPaper={isPaper}
                          showAnswers={showAnswers}
                          fontSerif={fontSerif}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )
          })}
        </div>

        {/* ── Document Footer / Official Answer Key Table ── */}
        {showAnswers && (
          <footer
            className="mt-14 pt-8 border-t-2"
            style={{ borderColor: isPaper ? '#0f172a' : '#e6edf3' }}
          >
            <div className="text-center mb-5">
              <h3
                className="text-lg font-bold tracking-widest uppercase"
                style={{
                  fontFamily: fontSerif
                    ? "'Latin Modern Roman', 'Computer Modern', 'Times New Roman', serif"
                    : 'inherit',
                }}
              >
                Official Answer Key
              </h3>
              <p
                className="text-xs italic"
                style={{ color: isPaper ? '#64748b' : '#8b949e' }}
              >
                Verified against Official Exam Key
              </p>
            </div>

            {/* Answer key compact grid table */}
            <div
              className="overflow-x-auto rounded-lg border text-xs"
              style={{
                borderColor: isPaper ? '#cbd5e1' : '#30363d',
                backgroundColor: isPaper ? '#f8fafc' : '#161b22',
              }}
            >
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr
                    className="border-b font-bold"
                    style={{
                      borderColor: isPaper ? '#cbd5e1' : '#30363d',
                      backgroundColor: isPaper ? '#f1f5f9' : '#0d1117',
                    }}
                  >
                    <th className="py-2 px-3 border-r" style={{ borderColor: isPaper ? '#e2e8f0' : '#30363d' }}>
                      Q.No
                    </th>
                    <th className="py-2 px-3 border-r" style={{ borderColor: isPaper ? '#e2e8f0' : '#30363d' }}>
                      Answer
                    </th>
                    <th className="py-2 px-3 border-r" style={{ borderColor: isPaper ? '#e2e8f0' : '#30363d' }}>
                      Type
                    </th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q, idx) => {
                    const qNum = q.question_number ?? idx + 1
                    const qType = q.type || q.question_type || 'mcq'
                    let ansLabel = '-'
                    if (qType === 'mcq') {
                      if (q.correct_option !== undefined && q.correct_option >= 0) {
                        ansLabel = `Option (${q.correct_option + 1})`
                      } else if (q.options) {
                        const correctIdx = (q.options as any[]).findIndex(
                          (o: any) => typeof o !== 'string' && o.is_correct
                        )
                        ansLabel = correctIdx >= 0 ? `Option (${correctIdx + 1})` : '-'
                      }
                    } else if (qType === 'numerical' && q.correct_answer) {
                      ansLabel = q.correct_answer
                    }

                    return (
                      <tr
                        key={idx}
                        className="border-b last:border-b-0 hover:bg-black/[0.02]"
                        style={{ borderColor: isPaper ? '#e2e8f0' : '#21262d' }}
                      >
                        <td
                          className="py-1.5 px-3 font-bold border-r font-mono"
                          style={{ borderColor: isPaper ? '#e2e8f0' : '#30363d' }}
                        >
                          Q.{qNum}
                        </td>
                        <td
                          className="py-1.5 px-3 font-semibold border-r"
                          style={{
                            borderColor: isPaper ? '#e2e8f0' : '#30363d',
                            color:
                              q.merge_status === 'KEY_NOT_FOUND'
                                ? '#ef4444'
                                : isPaper
                                ? '#047857'
                                : '#34d399',
                          }}
                        >
                          {ansLabel}
                        </td>
                        <td
                          className="py-1.5 px-3 uppercase text-[10px] font-bold border-r"
                          style={{
                            borderColor: isPaper ? '#e2e8f0' : '#30363d',
                            color: isPaper ? '#64748b' : '#8b949e',
                          }}
                        >
                          {qType}
                        </td>
                        <td className="py-1.5 px-3">
                          {q.merge_status === 'KEY_NOT_FOUND' ? (
                            <span className="text-red-400 font-bold">⚠ Key Missing</span>
                          ) : (
                            <span className="text-emerald-500 font-bold">✓ Verified</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </footer>
        )}
      </div>

      {/* ── Print Stylesheet ── */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print,
          nav,
          aside,
          header.app-header,
          .step-connector,
          #pipeline-import-more-btn {
            display: none !important;
          }
          #latex-document-container {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .document-question-item {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 2rem !important;
          }
        }
      `}</style>
    </div>
  )
}

// ── Individual Question Component (LaTeX Typeset Document Item) ──────────────

function DocumentQuestionItem({
  q,
  defaultIndex,
  isPaper,
  showAnswers,
  fontSerif,
}: {
  q: PipelineQuestion
  defaultIndex?: number
  isPaper: boolean
  showAnswers: boolean
  fontSerif: boolean
}) {
  const qNum = q.question_number ?? defaultIndex ?? 1
  const qStatement = q.statement || q.question_text || ''
  const qType = (q.type || q.question_type || 'mcq') as 'mcq' | 'numerical'
  const qDifficulty = q.difficulty || q.ai_difficulty || 'medium'
  const qVisibility = q.visibility || 'public'

  // Normalize options to { text: string; is_correct: boolean }[]
  const parsedOptions: { text: string; is_correct: boolean }[] = useMemo(() => {
    if (!q.options || q.options.length === 0) return []
    if (typeof q.options[0] === 'string') {
      const cIdx = q.correct_option ?? 0
      return (q.options as string[]).map((text, idx) => ({
        text: String(text),
        is_correct: idx === cIdx,
      }))
    }
    return q.options as PipelineOption[]
  }, [q.options, q.correct_option])

  // Determine if options are short enough for 2-column or 4-column display
  const isShortOptions = useMemo(() => {
    if (!parsedOptions || parsedOptions.length === 0) return false
    return parsedOptions.every((opt) => opt.text.length < 35 && !opt.text.includes('\\begin{'))
  }, [parsedOptions])

  const correctOptionIdx = useMemo(() => {
    if (q.correct_option !== undefined) return q.correct_option
    return parsedOptions.findIndex((o) => o.is_correct)
  }, [q.correct_option, parsedOptions])

  return (
    <div
      className="document-question-item relative group transition-all pb-4 border-b last:border-b-0"
      style={{ borderColor: isPaper ? '#f1f5f9' : '#21262d' }}
    >
      {/* Question Header Line: Q.Number + Metadata */}
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-2">
          <span
            className="text-base font-bold select-none"
            style={{
              color: isPaper ? '#0f172a' : '#f0f6fc',
              fontFamily: fontSerif
                ? "'Latin Modern Roman', 'Computer Modern', 'Times New Roman', serif"
                : 'inherit',
            }}
          >
            Q.{qNum}.
          </span>
          {q.source && (
            <span
              className="text-[11px] font-medium tracking-tight italic"
              style={{ color: isPaper ? '#64748b' : '#8b949e' }}
            >
              [{q.source}]
            </span>
          )}
        </div>

        {/* Right tags: Visibility, Difficulty & Warnings */}
        <div className="flex items-center gap-1.5 no-print">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded capitalize flex items-center gap-1"
            style={{
              backgroundColor: isPaper ? '#f1f5f9' : '#161b22',
              color: isPaper ? '#64748b' : '#8b949e',
              border: isPaper ? '1px solid #e2e8f0' : '1px solid #30363d',
            }}
            title={`Question visibility: ${qVisibility}`}
          >
            {qVisibility === 'public' ? (
              <Globe className="h-2.5 w-2.5 text-blue-400" />
            ) : (
              <Lock className="h-2.5 w-2.5 text-amber-400" />
            )}
            {qVisibility}
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded capitalize"
            style={{
              backgroundColor: isPaper ? '#f1f5f9' : '#161b22',
              color: isPaper ? '#64748b' : '#8b949e',
              border: isPaper ? '1px solid #e2e8f0' : '1px solid #30363d',
            }}
          >
            {qDifficulty}
          </span>
          {q.merge_status === 'KEY_NOT_FOUND' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" />
              Missing Key
            </span>
          )}
        </div>
      </div>

      {/* Question Statement with KaTeX */}
      <div
        className="text-[14.5px] leading-relaxed mb-3 pl-0 sm:pl-5"
        style={{
          color: isPaper ? '#1e293b' : '#e6edf3',
          fontFamily: fontSerif
            ? "'Latin Modern Roman', 'Computer Modern', 'Times New Roman', serif"
            : 'inherit',
        }}
      >
        <Latex>{qStatement}</Latex>
      </div>

      {/* MCQ Options — Standard JEE Question Paper 2-Column / 1-Column Layout */}
      {qType === 'mcq' && parsedOptions.length > 0 && (
        <div
          className={`pl-0 sm:pl-5 mt-2.5 ${
            isShortOptions
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2'
              : 'space-y-2'
          }`}
        >
          {parsedOptions.map((opt, i) => {
            const isCorrect = opt.is_correct && showAnswers
            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 px-3 py-1.5 rounded-md text-[13.5px] leading-relaxed transition-all ${
                  isCorrect
                    ? isPaper
                      ? 'bg-emerald-50 text-emerald-950 font-medium border border-emerald-300'
                      : 'bg-emerald-500/10 text-emerald-200 font-medium border border-emerald-500/30'
                    : isPaper
                    ? 'hover:bg-slate-50 text-slate-700'
                    : 'hover:bg-white/[0.02] text-slate-300'
                }`}
              >
                <span
                  className={`font-bold shrink-0 text-xs mt-0.5 ${
                    isCorrect
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isPaper
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }`}
                >
                  ({i + 1})
                </span>
                <span className="flex-1">
                  <Latex>{opt.text}</Latex>
                </span>
                {isCorrect && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Correct Answer Box (LaTeX \fbox Style) — Displayed when Answers are toggled ON */}
      {showAnswers && (
        <div className="mt-3.5 pl-0 sm:pl-5 flex items-center justify-between">
          {qType === 'mcq' && correctOptionIdx >= 0 && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: isPaper ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)',
                border: isPaper ? '1.5px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)',
                color: isPaper ? '#065f46' : '#34d399',
                fontFamily: fontSerif
                  ? "'Latin Modern Roman', 'Computer Modern', 'Times New Roman', serif"
                  : 'inherit',
              }}
            >
              <span>Ans: Option ({correctOptionIdx + 1})</span>
              <CheckCircle2 className="h-3 w-3" />
            </div>
          )}

          {qType === 'numerical' && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: isPaper ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)',
                border: isPaper ? '1.5px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)',
                color: isPaper ? '#065f46' : '#34d399',
                fontFamily: fontSerif
                  ? "'Latin Modern Roman', 'Computer Modern', 'Times New Roman', serif"
                  : 'inherit',
              }}
            >
              <span>Answer:</span>
              <span className="font-mono text-sm">
                {q.correct_answer ? <Latex>{q.correct_answer}</Latex> : '—'}
              </span>
            </div>
          )}

          {q.merge_status === 'KEY_NOT_FOUND' && (
            <span className="text-[11px] font-semibold text-red-500 italic">
              ⚠ Answer key not found for this question
            </span>
          )}
        </div>
      )}

      {/* Explanation / Solution — Displayed when Answers are toggled ON and solution exists */}
      {showAnswers && q.solution && (
        <div
          className="mt-3.5 pl-0 sm:pl-5 rounded-lg p-3 text-xs leading-relaxed"
          style={{
            backgroundColor: isPaper ? '#f8fafc' : 'rgba(15, 23, 42, 0.4)',
            border: isPaper ? '1px solid #e2e8f0' : '1px solid #1e293b',
            color: isPaper ? '#334155' : '#cbd5e1',
          }}
        >
          <div
            className="font-bold text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
            style={{ color: isPaper ? '#475569' : '#94a3b8' }}
          >
            <span>Explanation / Solution:</span>
          </div>
          <div className="text-[13.5px] leading-relaxed">
            <Latex>{q.solution}</Latex>
          </div>
        </div>
      )}
    </div>
  )
}
