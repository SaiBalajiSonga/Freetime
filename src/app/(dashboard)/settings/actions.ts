'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string

  const notification_settings = {
    tests: formData.get('notify_tests') === 'true',
    materials: formData.get('notify_materials') === 'true',
    ranks: formData.get('notify_ranks') === 'true',
    general: formData.get('notify_general') === 'true',
  }

  if (!name || name.trim() === '') {
    return { error: 'Name is required' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ name, phone, notification_settings })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to update profile:', error)
    return { error: 'Failed to update profile. Please try again.' }
  }

  revalidatePath('/settings')
  return { success: true }
}
