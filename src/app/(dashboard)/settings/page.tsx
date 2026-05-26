import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-500">
        Profile not found. Please contact support.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Account Settings</h1>
        <p className="text-slate-500 mt-2">Manage your profile information and account details.</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <SettingsForm profile={profile} email={user.email || ''} />
      </div>
    </div>
  )
}
