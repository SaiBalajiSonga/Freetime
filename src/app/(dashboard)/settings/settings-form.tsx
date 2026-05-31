'use client'

import { useActionState } from 'react'
import { updateProfile } from './actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-foreground placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium text-sm'
  
const readOnlyClass =
  'w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-500 font-medium text-sm cursor-not-allowed'

type State = {
  error?: string;
  success?: boolean;
}

const initialState: State = {
  error: undefined,
  success: false,
}

export function SettingsForm({ profile, email }: { profile: any; email: string }) {
  const [state, formAction, isPending] = useActionState(async (prevState: State, formData: FormData) => {
    return await updateProfile(prevState, formData) as State
  }, initialState)

  return (
    <form action={formAction} className="space-y-6">
      
      {state?.error && (
        <Alert className="bg-red-50 text-red-600 border-red-100 rounded-xl">
          <AlertDescription className="font-semibold">{state.error}</AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert className="bg-green-50 text-green-700 border-green-200 rounded-xl">
          <AlertDescription className="font-semibold">Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Read Only Fields */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700">Email Address</Label>
          <input type="email" value={email} readOnly className={readOnlyClass} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700">Display ID (Roll No)</Label>
          <input type="text" value={profile.display_id || 'Not assigned'} readOnly className={readOnlyClass} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700">Account Role</Label>
          <input type="text" value={profile.is_admin ? 'Administrator' : 'Student'} readOnly className={readOnlyClass} />
        </div>

        <div className="col-span-1 md:col-span-2 border-t border-slate-100 my-2 pt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Editable Information</h3>
        </div>

        {/* Editable Fields */}
        <div className="space-y-2 col-span-1 md:col-span-2">
          <Label htmlFor="name" className="text-sm font-bold text-slate-700">Full Name</Label>
          <input id="name" name="name" type="text" defaultValue={profile.name || ''} required className={inputClass} />
        </div>

        <div className="space-y-2 col-span-1 md:col-span-2">
          <Label htmlFor="phone" className="text-sm font-bold text-slate-700">Phone Number</Label>
          <input id="phone" name="phone" type="tel" defaultValue={profile.phone || ''} className={inputClass} />
        </div>

      </div>

      <div className="pt-4 flex justify-end">
        <Button 
          type="submit" 
          disabled={isPending}
          className="h-12 px-8 text-base font-bold bg-[var(--color-primary)] hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
