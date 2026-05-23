'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadCloud } from 'lucide-react'
import { RawImportData } from '@/lib/import/types'

interface ImportDropzoneProps {
  onParsed: (data: RawImportData[]) => void
}

export function ImportDropzone({ onParsed }: ImportDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setError(null)
    const reader = new FileReader()
    
    if (file.name.endsWith('.json')) {
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string)
          onParsed(Array.isArray(json) ? json : [json])
        } catch (err) {
          setError('Failed to parse JSON file.')
        }
      }
      reader.readAsText(file)
    } else if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`CSV Error: ${results.errors[0].message}`)
            return
          }
          onParsed(results.data as RawImportData[])
        },
        error: (err) => {
          setError(`Failed to parse CSV: ${err.message}`)
        }
      })
    } else {
      setError('Unsupported file type. Please upload a JSON or CSV file.')
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <Card 
      className={`border-2 border-dashed transition-all premium-card bg-black/40 ${isDragging ? 'border-cyan-500 shadow-[inset_0_0_30px_rgba(6,182,212,0.1)]' : 'border-white/10 hover:border-white/20'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <CardContent className="flex flex-col items-center justify-center py-16 space-y-5">
        <div className={`p-5 rounded-full transition-colors ${isDragging ? 'bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-white/5 border border-white/10'}`}>
          <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-cyan-400' : 'text-white/40'}`} />
        </div>
        <div className="text-center">
          <h3 className="font-extrabold text-xl text-white tracking-tight">Upload Questions</h3>
          <p className="text-sm text-white/50 mt-1.5 font-medium">Drag and drop a JSON or CSV file here, or click to select.</p>
        </div>
        
        {error && (
          <p className="text-sm text-red-400 font-bold bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">{error}</p>
        )}

        <input 
          type="file" 
          accept=".json,.csv" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          className="bg-gradient-primary text-white hover:brightness-110 font-bold h-11 px-6 rounded-xl transition-all shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] border-0"
        >
          Select File
        </Button>
      </CardContent>
    </Card>
  )
}
