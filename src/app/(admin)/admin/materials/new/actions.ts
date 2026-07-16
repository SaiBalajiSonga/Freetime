'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createMaterial(formData: FormData) {
  const supabase = createAdminClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const subject_id = formData.get('subject_id') as string
  const file = formData.get('file') as File

  if (!title?.trim()) return { error: 'Title is required' }
  if (!file || file.size === 0) return { error: 'File is required' }

  // 1. Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `uploads/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('study-materials')
    .upload(filePath, file)

  if (uploadError) {
    return { error: `Failed to upload file: ${uploadError.message}. Did you create the public 'study-materials' bucket?` }
  }

  // 2. Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('study-materials')
    .getPublicUrl(filePath)
    
  const fileUrl = publicUrlData.publicUrl

  // 3. Insert into DB
  const { error: insertError } = await supabase.from('study_materials').insert({
    title,
    description: description || null,
    subject_id: subject_id || null,
    file_url: fileUrl
  })

  if (insertError) {
    return { error: insertError.message }
  }

  // 4. Auto-generate notification
  await supabase.from('announcements').insert({
    title: 'New Study Material',
    message: `A new study material "${title}" has been posted.`,
    type: 'Material',
    priority: 'Normal'
  })

  return { success: true }
}
