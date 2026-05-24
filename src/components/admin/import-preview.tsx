'use client'

import { useState } from 'react'
import { PreviewData } from '@/lib/import/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Copy } from 'lucide-react'

interface ImportPreviewProps {
  data: PreviewData
  onConfirm: () => void
  onCancel: () => void
  isSubmitting: boolean
}

export function ImportPreview({ data, onConfirm, onCancel, isSubmitting }: ImportPreviewProps) {
  const [showInvalid, setShowInvalid] = useState(false)

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="premium-card bg-black/40 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/50 font-bold uppercase tracking-wider">Valid Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-400 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-6 h-6" />
              {data.validQuestions.length}
            </div>
            <p className="text-xs text-white/40 mt-1.5 font-medium">Ready to insert</p>
          </CardContent>
        </Card>
        
        <Card className="premium-card bg-black/40 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/50 font-bold uppercase tracking-wider">Invalid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-400 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
              <AlertCircle className="w-6 h-6" />
              {data.invalidQuestions.length}
            </div>
            <p className="text-xs text-white/40 mt-1.5 font-medium">Missing required data</p>
          </CardContent>
        </Card>

        <Card className="premium-card bg-black/40 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/50 font-bold uppercase tracking-wider">Duplicates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-400 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
              <Copy className="w-6 h-6" />
              {data.duplicateHashes.length}
            </div>
            <p className="text-xs text-white/40 mt-1.5 font-medium">Will be skipped</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          onClick={onConfirm} 
          disabled={isSubmitting || data.validQuestions.length === 0}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold h-11 px-6 rounded-md hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {isSubmitting ? 'Inserting...' : `Confirm & Insert ${data.validQuestions.length} Questions`}
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel} 
          disabled={isSubmitting}
          className="bg-white/5 border-white/10 text-white h-11 px-6 rounded-md hover:bg-white/10 hover:border-white/20 font-bold transition-all"
        >
          Cancel
        </Button>
        {data.invalidQuestions.length > 0 && (
          <Button 
            variant="ghost" 
            onClick={() => setShowInvalid(!showInvalid)}
            className="text-white/60 hover:text-white hover:bg-white/5 font-bold h-11 px-4 rounded-md transition-all"
          >
            {showInvalid ? 'Hide Invalid' : 'Show Invalid Details'}
          </Button>
        )}
      </div>

      {showInvalid && data.invalidQuestions.length > 0 && (
        <Card className="border-red-500/20 bg-red-500/5 premium-card shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]">
          <CardHeader className="border-b border-red-500/10">
            <CardTitle className="text-red-400 font-bold">Invalid Rows Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {data.invalidQuestions.map((res, idx) => (
              <div key={idx} className="text-sm p-4 bg-black/40 rounded-md border border-white/5 shadow-inner">
                <p className="font-bold text-red-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Row {idx + 1} Errors:
                </p>
                <ul className="list-disc pl-5 mb-3 text-red-300/80 space-y-1">
                  {res.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
                <p className="text-white/40 font-mono text-[11px] bg-white/5 p-2 rounded-lg overflow-hidden text-ellipsis whitespace-nowrap">
                  {JSON.stringify(res.question).substring(0, 100)}...
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="premium-card bg-black/40 border-white/5">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-white font-bold">Preview (First 10 Valid)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {data.validQuestions.slice(0, 10).map((res, idx) => (
              <div key={idx} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <div className="flex gap-2 mb-2.5">
                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:bg-cyan-500/20">{res.question.subject}</Badge>
                  <Badge className="bg-white/5 text-white/60 border border-white/10 hover:bg-white/10">{res.question.chapter}</Badge>
                  <Badge className="bg-white/5 text-white/60 border border-white/10 capitalize hover:bg-white/10">{res.question.type}</Badge>
                </div>
                <p className="text-sm font-medium text-white/80 line-clamp-2 leading-relaxed">{res.question.statement}</p>
                {res.question.type === 'mcq' && (
                  <p className="text-[11px] font-mono text-white/40 mt-2 bg-white/5 p-1.5 rounded border border-white/5">
                    Options: {res.question.options?.map(o => o.text).join(' | ')}
                  </p>
                )}
                {res.question.type === 'numerical' && (
                  <p className="text-[11px] font-mono text-emerald-400/80 mt-2 bg-emerald-500/5 p-1.5 rounded border border-emerald-500/10 w-fit">
                    Answer: {res.question.correct_answer}
                  </p>
                )}
              </div>
            ))}
            {data.validQuestions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-white/40 font-medium">No valid questions to preview.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
