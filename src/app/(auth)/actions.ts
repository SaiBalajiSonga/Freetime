'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', authData.user.id)
    .single()

  revalidatePath('/', 'layout')
  
  if (profile?.is_admin) {
    redirect('/admin/dashboard')
  } else {
    redirect('/dashboard')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('name') as string,
      }
    }
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', authData.user?.id)
    .single()

  revalidatePath('/', 'layout')

  if (profile?.is_admin) {
    redirect('/admin/dashboard')
  } else {
    redirect('/dashboard')
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
