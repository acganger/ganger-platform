'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const links = [
  { href: '/checkin', label: 'Check In' },
  { href: '/insurance', label: 'Insurance' },
  { href: '/payment', label: 'Payment' },
  { href: '/forms', label: 'Forms' },
  { href: '/help', label: 'Help' },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <>
      {links.map(({ href, label }) => (
        <Link
          key={label}
          href={href}
          className={clsx(
            'inline-block rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900',
            pathname === href && 'bg-blue-100 text-blue-700'
          )}
        >
          {label}
        </Link>
      ))}
    </>
  )
}