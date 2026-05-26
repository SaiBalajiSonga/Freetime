'use client'

import { useState } from 'react'
import { deleteQuestion, deleteAllQuestions, deleteByChapter, deleteBySubject } from '../actions'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function DeleteQuestionButton({ questionId }: { questionId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this question?')) return
    setIsDeleting(true)
    await deleteQuestion(questionId)
    setIsDeleting(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1 shrink-0"
      title="Delete question"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}

export function DeleteChapterButton({ chapterId, chapterName, count }: { chapterId: string; chapterName: string; count: number }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete all ${count} questions in "${chapterName}"?`)) return
    setIsDeleting(true)
    await deleteByChapter(chapterId)
    setIsDeleting(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs h-7 gap-1"
    >
      <Trash2 className="h-3 w-3" />
      {isDeleting ? 'Deleting...' : `Delete ${count}`}
    </Button>
  )
}

export function DeleteSubjectButton({ subjectId, subjectName, count }: { subjectId: string; subjectName: string; count: number }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete all ${count} questions in "${subjectName}"? This cannot be undone.`)) return
    setIsDeleting(true)
    await deleteBySubject(subjectId)
    setIsDeleting(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs h-7 gap-1"
    >
      <Trash2 className="h-3 w-3" />
      {isDeleting ? 'Deleting...' : `Delete All ${count}`}
    </Button>
  )
}

export function DeleteAllQuestionsButton({ count }: { count: number }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAll = async () => {
    if (!confirm(`Delete ALL ${count} questions? This cannot be undone.`)) return
    if (!confirm(`FINAL WARNING: This will permanently delete ${count} questions, their options, and all student attempts.`)) return
    
    const confirmation = prompt('Type "DELETE ALL" to permanently delete everything:')
    if (confirmation !== 'DELETE ALL') {
      alert('Deletion cancelled. You did not type "DELETE ALL".')
      return
    }

    setIsDeleting(true)
    await deleteAllQuestions()
    setIsDeleting(false)
  }

  return (
    <Button
      variant="destructive"
      onClick={handleDeleteAll}
      disabled={isDeleting}
      className="flex items-center gap-2"
    >
      <Trash2 className="h-4 w-4" />
      {isDeleting ? 'Deleting...' : `Delete All ${count}`}
    </Button>
  )
}
