'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const identifier = formData.get('identifier') as string
  const countryCode = formData.get('country_code') as string
  const password = formData.get('password') as string

  let data: any = { password }

  const loginMethod = formData.get('login_method') as string
  
  if (loginMethod === 'phone') {
    let formattedPhone = ''
    if (countryCode) {
      formattedPhone = `${countryCode}${identifier.replace(/\s+/g, '')}`
    } else {
      formattedPhone = identifier.replace(/\s+/g, '')
    }

    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('phone', formattedPhone)
      .single()

    if (profile?.id) {
      const { data: userData } = await adminSupabase.auth.admin.getUserById(profile.id)
      if (userData?.user?.email) {
        data.email = userData.user.email
      } else {
        data.phone = formattedPhone
      }
    } else {
      data.phone = formattedPhone // fallback to let Supabase throw error
    }
  } else if (loginMethod === 'email') {
    data.email = identifier
  } else if (loginMethod === 'id') {
    // Unique ID / display_id login
    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('display_id', identifier)
      .single()

    if (profile?.id) {
      const { data: userData } = await adminSupabase.auth.admin.getUserById(profile.id)
      if (userData?.user?.email) {
        data.email = userData.user.email
      } else {
        data.email = identifier
      }
    } else {
      data.email = identifier // fallback to let Supabase throw standard error
    }
  } else {
    // Fallback just in case
    data.email = identifier
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const countryCode = formData.get('country_code') as string || '+91'
  const rawPhone = formData.get('phone') as string
  const phone = `${countryCode}${rawPhone.replace(/\s+/g, '')}`

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    phone: phone,
    options: {
      data: {
        full_name: formData.get('name') as string,
        phone: phone
      }
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/#auth')
}
