import { AmbientBackdrop } from '@/components/site/ambient-backdrop'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-8 relative overflow-hidden">
      <AmbientBackdrop intensity="subtle" />
      <div className="w-full max-w-[1000px] z-10 animate-in-up">
        {children}
      </div>
    </div>
  )
}
