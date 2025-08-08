'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { motion } from 'framer-motion'

const navigation = [
  {
    title: 'Overview',
    links: [
      { title: 'Dashboard', href: '/' },
      { title: 'Process Summary', href: '/process' },
      { title: 'Financial Reports', href: '/reports' },
    ],
  },
  {
    title: 'Batch Processing',
    links: [
      { title: 'New Batch', href: '/batch/new' },
      { title: 'Active Batches', href: '/batch/active' },
      { title: 'Batch History', href: '/batch/history' },
      { title: 'Failed Transactions', href: '/batch/failed' },
    ],
  },
  {
    title: 'Financial Management',
    links: [
      { title: 'Payment Processing', href: '/financial/payments' },
      { title: 'Reconciliation', href: '/financial/reconciliation' },
      { title: 'Settlement Reports', href: '/financial/settlements' },
      { title: 'Transaction Logs', href: '/financial/logs' },
    ],
  },
  {
    title: 'Administration',
    links: [
      { title: 'Configuration', href: '/admin/config' },
      { title: 'User Management', href: '/admin/users' },
      { title: 'Audit Trail', href: '/admin/audit' },
      { title: 'System Health', href: '/admin/health' },
    ],
  },
]

function NavGroup({
  group,
  className,
}: {
  group: { title: string; links: Array<{ title: string; href: string }> }
  className?: string
}) {
  let pathname = usePathname()

  return (
    <li className={clsx('relative', className)}>
      <motion.h2
        layout="position"
        className="text-xs font-semibold text-zinc-900 dark:text-white"
      >
        {group.title}
      </motion.h2>
      <div className="relative mt-3 pl-2">
        <motion.div
          layout
          className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/5"
        />
        <motion.ul layout className="border-l border-transparent">
          {group.links.map((link) => (
            <motion.li key={link.href} layout="position" className="relative">
              <Link
                href={link.href}
                className={clsx(
                  'flex w-full items-center pl-3.5 pr-2 py-1 text-sm transition',
                  link.href === pathname
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
                )}
              >
                {link.title}
                {link.href === pathname && (
                  <motion.div
                    className="absolute inset-y-0 left-2 w-px bg-emerald-500"
                    layoutId="activeIndicator"
                  />
                )}
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </li>
  )
}

export function Navigation(props: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav {...props}>
      <ul role="list">
        <TopLevelNavItem href="/">Overview</TopLevelNavItem>
        <TopLevelNavItem href="/batch">Batch Processing</TopLevelNavItem>
        <TopLevelNavItem href="/financial">Financial</TopLevelNavItem>
        <TopLevelNavItem href="/reports">Reports</TopLevelNavItem>
        {navigation.map((group, groupIndex) => (
          <NavGroup
            key={group.title}
            group={group}
            className={groupIndex === 0 ? 'md:mt-0' : 'mt-8'}
          />
        ))}
      </ul>
    </nav>
  )
}

function TopLevelNavItem({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  let pathname = usePathname()
  return (
    <li className="md:hidden">
      <Link
        href={href}
        className={clsx(
          'block py-1 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
          pathname === href && 'text-zinc-900 dark:text-white',
        )}
      >
        {children}
      </Link>
    </li>
  )
}