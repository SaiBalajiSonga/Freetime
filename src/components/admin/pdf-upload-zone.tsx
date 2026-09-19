'use client'

import { useCallback, useState } from 'react'
import { FileUp, X, FileText } from 'lucide-react'

type PdfUploadZoneProps = {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PdfUploadZone({ onFileSelected, disabled }: PdfUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext !== 'pdf' && ext !== 'md') {
        alert('Only .pdf and .md files are supported.')
        return
      }
      setSelectedFile(file)
      onFileSelected(file)
    },
    [onFileSelected]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile, disabled]
  )

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) setDragActive(true)
    },
    [disabled]
  )

  const onDragLeave = useCallback(() => setDragActive(false), [])

  const onClickPick = useCallback(() => {
    if (disabled) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.md'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) handleFile(file)
    }
    input.click()
  }, [handleFile, disabled])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
  }, [])

  if (selectedFile) {
    const isPdf = selectedFile.name.toLowerCase().endsWith('.pdf')
    return (
      <div
        className="relative rounded-lg p-6 transition-all"
        style={{
          background: 'rgba(56,189,248,0.05)',
          border: '2px solid rgba(56,189,248,0.2)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="size-12 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: isPdf ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.1)',
              border: `1px solid ${isPdf ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.2)'}`,
            }}
          >
            {isPdf ? (
              <FileUp className="h-5 w-5 text-red-400" />
            ) : (
              <FileText className="h-5 w-5 text-sky-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              {formatSize(selectedFile.size)} • {isPdf ? 'PDF Document' : 'Markdown File'}
            </p>
          </div>
          {!disabled && (
            <button
              onClick={clearFile}
              className="size-8 rounded-md flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: '#64748b' }}
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClickPick}
      className={`relative rounded-lg p-10 transition-all cursor-pointer group ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      style={{
        background: dragActive ? 'rgba(56,189,248,0.08)' : '#0d1117',
        border: `2px dashed ${dragActive ? 'rgba(56,189,248,0.5)' : '#2a3142'}`,
      }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="size-14 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
          style={{
            background: 'rgba(56,189,248,0.08)',
            border: '1px solid rgba(56,189,248,0.15)',
          }}
        >
          <FileUp className="h-6 w-6 text-sky-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">
            Drop a PDF or Markdown file here
          </p>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>
            or <span className="text-sky-400 font-semibold">click to browse</span> •
            supports .pdf and .md files
          </p>
        </div>
        <div
          className="flex items-center gap-4 mt-2 px-4 py-2 rounded-md text-[11px] font-medium"
          style={{ background: '#161b27', border: '1px solid #2a3142', color: '#64748b' }}
        >
          <span>📄 .pdf — runs Marker OCR + pipeline</span>
          <span className="text-[#2a3142]">|</span>
          <span>📝 .md — skips OCR, runs pipeline directly</span>
        </div>
      </div>
    </div>
  )
}
