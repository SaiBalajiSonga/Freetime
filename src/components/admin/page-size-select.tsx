'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export function PageSizeSelect({ currentSize }: { currentSize: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pageSize', e.target.value)
    params.set('page', '1') // reset page
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      value={currentSize}
      onChange={handleSizeChange}
      className="admin-select h-8 px-2 pr-8 text-[14px] font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none cursor-pointer hover:bg-white/[0.04] transition-colors"
    >
      {[15, 30, 50, 100].map((n) => (
        <option key={n} value={n}>{n} / page</option>
      ))}
    </select>
  )
}
