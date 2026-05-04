'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminNav() {
  const pathname = usePathname()

  const links = [
    { name: 'All Questions', href: '/admin', exact: true },
    { name: 'Subjects & Chapters', href: '/admin/subjects', exact: false },
  ]

  return (
    <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
      {links.map(link => {
        const isActive = link.exact 
          ? pathname === link.href 
          : pathname.startsWith(link.href)

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-pill text-sm font-bold transition-all ${
              isActive
                ? 'bg-surface-2 text-foreground border border-accent-electric/35 shadow-[0_0_24px_-10px_rgba(59,130,246,0.35)]'
                : 'text-muted hover:bg-surface-2 hover:text-foreground border border-transparent hover:border-white/10'
            }`}
          >
            {link.name}
          </Link>
        )
      })}
    </div>
  )
}
