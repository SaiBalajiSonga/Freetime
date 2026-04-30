'use client'

import { useState, useEffect } from 'react'
import { createQuestion } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function NewQuestionPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [type, setType] = useState('mcq')
  const supabase = createClient()

  useEffect(() => {
    async function loadSubjects() {
      const { data } = await supabase.from('subjects').select('*').order('name')
      if (data) setSubjects(data)
    }
    loadSubjects()
  }, [])

  useEffect(() => {
    async function loadChapters() {
      if (!selectedSubject) {
        setChapters([])
        return
      }
      const { data } = await supabase.from('chapters').select('*').eq('subject_id', selectedSubject).order('name')
      if (data) setChapters(data)
    }
    loadChapters()
  }, [selectedSubject])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Question</h1>
        <p className="text-gray-500">Create a new practice question for students.</p>
      </div>

      <Card>
        <form action={createQuestion}>
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v ?? '')} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Chapter</Label>
                <Select name="chapterId" required disabled={!selectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select name="type" value={type} onValueChange={(v) => setType(v ?? 'mcq')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="numerical">Numerical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select name="difficulty" defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Problem Statement</Label>
              <Textarea name="statement" placeholder="Enter the question text here..." rows={4} required />
            </div>

            {type === 'mcq' ? (
              <div className="space-y-4 border p-4 rounded-md">
                <Label>Options & Correct Answer</Label>
                <RadioGroup name="correctOptionIndex" defaultValue="0">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`opt_${index}`} />
                      <Input name={`option_${index}`} placeholder={`Option ${index + 1}`} required />
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ) : (
              <div className="space-y-2 border p-4 rounded-md">
                <Label>Correct Numerical Answer</Label>
                <Input name="correct_answer" placeholder="e.g. 42" required />
              </div>
            )}

            <div className="space-y-2">
              <Label>Solution (Optional)</Label>
              <Textarea name="solution" placeholder="Detailed step-by-step solution..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Hint (Optional)</Label>
              <Input name="hint" placeholder="A short hint..." />
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit">Create Question</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
