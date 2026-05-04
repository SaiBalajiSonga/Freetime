import { AmbientBackdrop } from '@/components/site/ambient-backdrop'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-background relative overflow-hidden">
      <AmbientBackdrop intensity="medium" />
      {children}
    </div>
  )
}
