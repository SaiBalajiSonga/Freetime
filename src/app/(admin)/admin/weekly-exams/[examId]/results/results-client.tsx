'use client'

import { useState } from 'react'
import { Download, Users, TrendingUp, Trophy, ArrowDown } from 'lucide-react'

type LeaderboardRow = {
  rank: number
  id: string
  user_id: string
  name: string
  score: number
  correct: number
  incorrect: number
  math_score: number
  physics_score: number
  chem_score: number
  math_incorrect: number
  physics_incorrect: number
  chem_incorrect: number
}

type Props = {
  exam: any
  leaderboard: LeaderboardRow[]
  stats: {
    totalParticipants: number
    maxScore: number
    avgScore: number
    highestScore: number
    lowestScore: number
  }
}

export default function ResultsClient({ exam, leaderboard, stats }: Props) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLeaderboard = leaderboard.filter(row =>
    row.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExportCSV = () => {
    if (leaderboard.length === 0) return

    // Define CSV headers
    const headers = [
      'Rank', 'Name', 'Total Score', 'Correct', 'Incorrect',
      'Math Score', 'Math Incorrect',
      'Physics Score', 'Physics Incorrect',
      'Chemistry Score', 'Chemistry Incorrect'
    ]

    // Map rows
    const rows = leaderboard.map(row => [
      row.rank,
      `"${row.name || 'Unknown'}"`,
      row.score,
      row.correct,
      row.incorrect,
      row.math_score,
      row.math_incorrect,
      row.physics_score,
      row.physics_incorrect,
      row.chem_score,
      row.chem_incorrect
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${exam.title.replace(/\s+/g, '_')}_results.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1c2333] border border-white/[0.05] p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Participants</p>
            <p className="text-2xl font-bold text-white">{stats.totalParticipants}</p>
          </div>
        </div>

        <div className="bg-[#1c2333] border border-white/[0.05] p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Average Score</p>
            <p className="text-2xl font-bold text-white">{stats.avgScore} <span className="text-sm font-normal text-slate-500">/ {stats.maxScore}</span></p>
          </div>
        </div>

        <div className="bg-[#1c2333] border border-white/[0.05] p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Highest Score</p>
            <p className="text-2xl font-bold text-white">{stats.highestScore}</p>
          </div>
        </div>

        <div className="bg-[#1c2333] border border-white/[0.05] p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <ArrowDown className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Lowest Score</p>
            <p className="text-2xl font-bold text-white">{stats.lowestScore}</p>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-[#1c2333] border border-white/[0.05] rounded-xl overflow-hidden flex flex-col">
        {/* Header toolbar */}
        <div className="p-5 border-b border-white/[0.05] flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">Leaderboard</h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-[#121827] border border-white/[0.1] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
            />
            <button
              onClick={handleExportCSV}
              disabled={leaderboard.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121827] border-b border-white/[0.05] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Rank</th>
                <th className="py-4 px-5">Student Name</th>
                <th className="py-4 px-5 text-right">Total Score</th>
                <th className="py-4 px-5 text-center">Math</th>
                <th className="py-4 px-5 text-center">Physics</th>
                <th className="py-4 px-5 text-center">Chemistry</th>
                <th className="py-4 px-5 text-right">C / W</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredLeaderboard.length > 0 ? (
                filteredLeaderboard.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-5 text-sm font-bold text-white">
                      #{row.rank}
                    </td>
                    <td className="py-3 px-5 text-sm font-medium text-slate-200">
                      {row.name || 'Unknown User'}
                    </td>
                    <td className="py-3 px-5 text-sm font-bold text-blue-400 text-right">
                      {row.score}
                    </td>
                    <td className="py-3 px-5 text-sm text-center">
                      <span className="text-slate-300 font-medium">{row.math_score}</span>
                      <span className="text-[10px] text-red-500/70 ml-1.5" title="Math Incorrect">(-{row.math_incorrect})</span>
                    </td>
                    <td className="py-3 px-5 text-sm text-center">
                      <span className="text-slate-300 font-medium">{row.physics_score}</span>
                      <span className="text-[10px] text-red-500/70 ml-1.5" title="Physics Incorrect">(-{row.physics_incorrect})</span>
                    </td>
                    <td className="py-3 px-5 text-sm text-center">
                      <span className="text-slate-300 font-medium">{row.chem_score}</span>
                      <span className="text-[10px] text-red-500/70 ml-1.5" title="Chemistry Incorrect">(-{row.chem_incorrect})</span>
                    </td>
                    <td className="py-3 px-5 text-sm text-right">
                      <span className="text-emerald-500 font-medium" title="Correct">{row.correct}</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-red-500 font-medium" title="Incorrect">{row.incorrect}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                    {leaderboard.length === 0 ? 'No results found for this exam yet.' : 'No matching students.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
