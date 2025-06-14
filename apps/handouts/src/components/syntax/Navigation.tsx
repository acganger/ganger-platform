'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { 
  BookOpen, 
  FileText, 
  Download, 
  QrCode, 
  Settings,
  BarChart3
} from 'lucide-react'

const navigation = [
  { name: 'Templates', href: '/templates', icon: BookOpen },
  { name: 'My Handouts', href: '/handouts', icon: FileText },
  { name: 'Downloads', href: '/downloads', icon: Download },
  { name: 'QR Codes', href: '/qr', icon: QrCode },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav>
      <ul className="space-y-2">
        {navigation.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={clsx(
                'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                pathname === item.href
                  ? 'bg-sky-50 text-sky-600 dark:bg-slate-800 dark:text-sky-400'
                  : 'text-slate-700 hover:text-sky-600 hover:bg-sky-50 dark:text-slate-300 dark:hover:text-sky-400 dark:hover:bg-slate-800'
              )}
            >
              <item.icon className="h-6 w-6 shrink-0" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}