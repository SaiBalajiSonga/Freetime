'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

function isHrefActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarLink({
  href,
  icon,
  label,
  disabled,
  exact,
  collapsed,
}: {
  href: string
  icon: React.ReactNode
  label: string
  disabled?: boolean
  exact?: boolean
  collapsed?: boolean
}) {
  const pathname = usePathname()
  const active = !disabled && isHrefActive(pathname, href, exact)

  // ─── COLLAPSED — YouTube mini sidebar ───────────────────────────────────────
  //
  //  YouTube's actual design:
  //  • NO background on active — just bold icon + bold text
  //  • Hover only: very subtle bg appears, disappears on leave
  //  • Each item = vertically stacked icon + tiny label
  //  • ~72px wide sidebar, items centered
  //
  if (collapsed) {
    const content = (
      <>
        <span
          style={{ color: active ? '#0f0f0f' : '#606060' }}
          className="flex items-center justify-center transition-colors duration-100"
        >
          {icon}
        </span>
        <span
          className="text-[10px] leading-tight text-center w-full truncate"
          style={{
            color: active ? '#0f0f0f' : '#606060',
            fontWeight: active ? 600 : 400,
          }}
        >
          {label}
        </span>
      </>
    )

    const wrapperCls = cn(
      'flex flex-col items-center justify-center gap-[4px]',
      'w-[56px] py-[16px] rounded-[10px]',
      'transition-colors duration-100 select-none',
      // NO persistent bg — only on hover
      'hover:bg-[#dbeafe]',
      disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
    )

    if (disabled) return <div className={wrapperCls}>{content}</div>

    return (
      <Link
        href={href}
        style={{ color: 'inherit', textDecoration: 'none' }}
        className={wrapperCls}
      >
        {content}
      </Link>
    )
  }

  // ─── EXPANDED — full-width row ──────────────────────────────────────────────
  const content = (
    <>
      <span
        className="flex items-center justify-center shrink-0 transition-colors duration-100"
        style={{ color: active ? '#0f0f0f' : '#606060' }}
      >
        {icon}
      </span>
      <span
        className="text-sm leading-none truncate transition-colors duration-100"
        style={{
          color: active ? '#0f0f0f' : '#0f0f0f',
          fontWeight: active ? 600 : 400,
        }}
      >
        {label}
      </span>
    </>
  )

  const rowCls = cn(
    'flex flex-row items-center gap-5 mx-1',
    'rounded-md px-2 py-[10px] transition-colors duration-100 select-none',
    active ? 'bg-[#dbeafe]' : 'hover:bg-[#dbeafe]',
    disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
  )

  if (disabled) return <div className={rowCls}>{content}</div>

  return (
    <Link
      href={href}
      style={{ color: 'inherit', textDecoration: 'none' }}
      className={rowCls}
    >
      {content}
    </Link>
  )
}
