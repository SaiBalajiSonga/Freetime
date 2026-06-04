'use client'

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { SetupData } from './page'
import JeeStartButton from './jee-start-button'

type Props = {
  jeeAvail: SetupData['jeeAvail']
}

const MCQ_NEEDED = 20
const NUM_NEEDED = 10

export default function JeeMockModalContent({ jeeAvail }: Props) {
  const canStart = jeeAvail.every((s) => s.mcqOk && s.numOk)
  const hasWarning = !canStart

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Full-length paper with official NTA exam interface. 90 questions, 3 hours.
      </p>

      {hasWarning && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-50 dark:bg-amber-400/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Some subjects don't have enough questions. Import more questions via the Admin panel before starting.
          </span>
        </div>
      )}

      {/* Paper Structure */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-5 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Paper Structure</h3>
        <div className="space-y-3">
          {jeeAvail.map((s) => (
            <div key={s.name} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">{s.name}</span>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">30 questions • 120 marks</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* MCQ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 p-2 sm:px-3 sm:py-2 gap-2 sm:gap-0">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Multiple Choice</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {MCQ_NEEDED} req.
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {s.mcqOk ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className={`text-[11px] font-bold ${s.mcqOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {s.mcqCount} avail
                    </span>
                  </div>
                </div>
                {/* Numerical */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 p-2 sm:px-3 sm:py-2 gap-2 sm:gap-0">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Numerical</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {NUM_NEEDED} req.
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {s.numOk ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className={`text-[11px] font-bold ${s.numOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {s.numCount} avail
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-4 text-xs text-slate-500 dark:text-slate-400">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-cyan-500" />
        Questions will be randomly picked from the question bank each time. The interface replicates the official NTA exam portal.
      </div>

      {/* Start Button */}
      <div className="pt-2">
        <JeeStartButton disabled={!canStart} label="Proceed to Instructions" />
      </div>
    </div>
  )
}
