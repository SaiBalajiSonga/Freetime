'use client'

import { useState } from 'react'
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react'
import type { SetupData } from './page'
import JeeStartButton from './jee-start-button'

type Props = {
  jeeAvail: SetupData['jeeAvail']
}

const MCQ_NEEDED = 20
const NUM_NEEDED = 10

export default function JeeMockModalContent({ jeeAvail }: Props) {
  const [testName, setTestName] = useState('')
  const canStart = jeeAvail.every((s) => s.mcqOk && s.numOk)
  const hasWarning = !canStart

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="font-semibold text-sm text-foreground">Official NTA Pattern</h3>
        <p className="text-sm text-slate-500">
          Full-length mock test featuring 90 questions (30 per subject) and a strict 3-hour timer. The interface replicates the actual computer-based exam.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-900">Test Name (Optional)</label>
        <div className="relative group">
          <input 
            type="text" 
            placeholder="e.g. Pre-Board JEE Mock"
            value={testName}
            onChange={e => setTestName(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 focus:ring-0 transition-colors"
          />
          {testName.length > 0 && (
            <button
              type="button"
              onClick={() => setTestName('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity p-0.5 rounded-sm"
              aria-label="Clear test name"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {hasWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <span>
            Some subjects lack sufficient questions. Please import more via the Admin Panel.
          </span>
        </div>
      )}

      {/* Readiness Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">MCQ (Req: {MCQ_NEEDED})</th>
              <th className="px-4 py-2 font-medium">Numerical (Req: {NUM_NEEDED})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {jeeAvail.map((s) => (
              <tr key={s.name}>
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={s.mcqOk ? 'text-slate-900' : 'text-red-600 font-medium'}>
                      {s.mcqCount} available
                    </span>
                    {!s.mcqOk && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                    {s.mcqOk && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={s.numOk ? 'text-slate-900' : 'text-red-600 font-medium'}>
                      {s.numCount} available
                    </span>
                    {!s.numOk && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                    {s.numOk && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Info className="h-3.5 w-3.5" />
        Questions are randomly picked from the bank to construct a unique paper each time.
      </div>

      <div className="pt-2">
        <JeeStartButton disabled={!canStart} label="Begin Simulator" testName={testName.trim() || undefined} />
      </div>
    </div>
  )
}
