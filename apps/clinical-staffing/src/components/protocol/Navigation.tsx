'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { 
  Users, 
  Calendar, 
  BarChart3, 
  FileText, 
  Settings,
  Clock,
  UserCheck,
  AlertTriangle,
  Briefcase
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Staff Directory', href: '/staff', icon: Users },
  { name: 'Scheduling', href: '/schedule', icon: Calendar },
  { name: 'Time Tracking', href: '/timesheet', icon: Clock },
  { name: 'Credentials', href: '/credentials', icon: UserCheck },
  { name: 'Assignments', href: '/assignments', icon: Briefcase },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="w-64">
      <div className="space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              'group flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
              pathname === item.href
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            )}
          >
            <item.icon className="h-6 w-6 shrink-0" />
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  )
}