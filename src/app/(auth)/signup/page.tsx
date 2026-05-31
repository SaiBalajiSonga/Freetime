'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signup } from '../actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthQuotePanel } from '@/components/site/auth-quote-panel'
import { Sparkles, ChevronDown } from 'lucide-react'
import { COUNTRIES } from '@/lib/countries'

const initialState = {
  error: null as string | null,
}

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium text-sm'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await signup(formData)
  }, initialState)

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === '+91') || COUNTRIES[0])
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex bg-white rounded-3xl shadow-[0_8px_32px_rgba(15,23,42,0.08)] overflow-hidden w-full border border-slate-100">
      
      {/* Left side: Visuals */}
      <AuthQuotePanel />

      {/* Right side: Form */}
      <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
        
        {/* Mobile Header Branding (Hidden on md+) */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="size-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-foreground">JEE Practice</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Create Account</h1>
          <p className="text-slate-500 font-medium">Join JEE Practice and start preparing today.</p>
        </div>

        {state?.error && (
          <Alert className="bg-red-50 text-red-600 border-red-100 mb-6 rounded-xl">
            <AlertDescription className="font-semibold">{state.error}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-bold text-slate-700">
              Full Name
            </Label>
            <input id="name" name="name" type="text" placeholder="John Doe" required className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-slate-700">
              Email Address
            </Label>
            <input id="email" name="email" type="email" placeholder="you@example.com" required className={inputClass} />
          </div>
          <div className="space-y-2 relative" ref={countryDropdownRef}>
            <Label htmlFor="phone" className="text-sm font-bold text-slate-700">
              Phone Number
            </Label>
            <div className="relative flex items-center h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:ring-4 focus-within:ring-[var(--color-primary)]/10 focus-within:border-[var(--color-primary)] transition-all">
              
              <input type="hidden" name="country_code" value={selectedCountry.code} />
              
              <div className="relative h-full flex items-center">
                <button 
                  type="button" 
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  className="flex items-center gap-1.5 w-[75px] justify-center bg-transparent text-[14px] font-[500] text-slate-700 focus:outline-none hover:bg-slate-200/50 rounded-l-xl border-r border-slate-200 transition-colors h-full"
                >
                  <span className="text-[15px] font-[600]">{selectedCountry.code}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isCountryDropdownOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-[240px] max-h-[260px] overflow-y-auto bg-white border border-slate-300 shadow-lg rounded-md z-50 py-1 flex flex-col animate-in fade-in zoom-in-95 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country.code + country.name}
                        id={`country-${country.code}-${country.name}`}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country)
                          setIsCountryDropdownOpen(false)
                        }}
                        className={`group flex items-center justify-between w-full px-4 py-1.5 text-left transition-none ${selectedCountry.code === country.code ? 'bg-slate-100' : 'hover:bg-[var(--color-primary)] text-slate-700 hover:text-white'}`}
                      >
                        <span className={`text-[13px] truncate max-w-[150px] ${selectedCountry.code === country.code ? 'font-semibold text-slate-900' : 'font-normal group-hover:text-white'}`}>{country.name}</span>
                        <span className={`text-[13px] shrink-0 ${selectedCountry.code === country.code ? 'font-semibold text-slate-900' : 'text-slate-500 group-hover:text-white/80'}`}>{country.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input 
                id="phone" 
                name="phone"
                type="tel" 
                pattern="[0-9]*"
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '')
                }}
                placeholder="Enter Phone Number"
                required
                className="flex-1 bg-transparent px-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold text-slate-700">
              Password
            </Label>
            <input id="password" name="password" type="password" required className={inputClass} />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-bold bg-[var(--color-primary)] hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all" disabled={isPending}>
            {isPending ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>

        <p className="text-sm text-center text-slate-500 font-medium mt-8">
          Already have an account?{' '}
          <Link href="/#auth" className="text-[var(--color-primary)] hover:underline font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
