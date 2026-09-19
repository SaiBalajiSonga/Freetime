import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, unlink, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { execFile } from 'child_process'
import { randomUUID } from 'crypto'

/**
 * POST /api/pipeline
 *
 * Receives a PDF or Markdown file + subject, runs the Python pipeline
 * in --dry-run mode, and returns the extracted questions as JSON.
 *
 * Body: multipart/form-data with:
 *   - file: the PDF or .md file
 *   - subject: "Physics" | "Chemistry" | "Mathematics"
 *   - chapter?: optional chapter override for single-chapter PDFs
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const subject = formData.get('subject') as string | null
    const chapter = formData.get('chapter') as string | null
    const visibility = ((formData.get('visibility') as string) || 'public').toLowerCase() === 'private' ? 'private' : 'public'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf' && ext !== 'md') {
      return NextResponse.json(
        { error: 'Only .pdf and .md files are supported' },
        { status: 400 }
      )
    }

    // Create temp directory for this run
    const runId = randomUUID()
    const tmpDir = join(process.cwd(), 'tmp', 'pipeline', runId)
    await mkdir(tmpDir, { recursive: true })

    const inputPath = join(tmpDir, file.name)
    const outputPath = join(tmpDir, 'output.json')

    // Write uploaded file to disk
    const bytes = await file.arrayBuffer()
    await writeFile(inputPath, Buffer.from(bytes))

    // Build CLI args
    const args: string[] = [
      join(process.cwd(), 'scripts', 'pipeline', 'main.py'),
      '--input', inputPath,
      '--subject', subject,
      '--visibility', visibility,
      '--dry-run',
      '--output', outputPath,
      '-v',
    ]

    if (ext === 'pdf') {
      args.push('--convert-pdf')
    }

    if (chapter) {
      args.push('--chapter', chapter)
    }

    // Run the Python pipeline
    const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      execFile(
        'python',
        args,
        {
          cwd: process.cwd(),
          timeout: 300_000, // 5 min max
          maxBuffer: 10 * 1024 * 1024, // 10 MB
          env: { ...process.env },
        },
        (error, stdout, stderr) => {
          if (error) {
            reject({ error, stdout, stderr })
          } else {
            resolve({ stdout, stderr })
          }
        }
      )
    })

    // Read the output JSON
    if (!existsSync(outputPath)) {
      return NextResponse.json(
        {
          error: 'Pipeline completed but produced no output file.',
          logs: result.stderr,
        },
        { status: 500 }
      )
    }

    const jsonContent = await readFile(outputPath, 'utf-8')
    const questions = JSON.parse(jsonContent)

    // Cleanup temp files
    try {
      await rm(tmpDir, { recursive: true, force: true })
    } catch {
      // Non-critical — temp cleanup failure is fine
    }

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
      logs: result.stderr?.slice(-2000) || '', // Last 2KB of logs for debugging
    })
  } catch (err: any) {
    const stderr = err?.stderr || ''
    const stdout = err?.stdout || ''
    console.error('[Pipeline API] Error:', err?.error?.message || err?.message || err)

    return NextResponse.json(
      {
        error: 'Pipeline execution failed',
        details: err?.error?.message || err?.message || 'Unknown error',
        logs: (stderr + '\n' + stdout).slice(-3000),
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max for local pipeline execution
