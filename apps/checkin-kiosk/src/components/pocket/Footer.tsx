import Link from 'next/link'
import { Container } from '@/components/pocket/Container'
import { GangerLogo } from '@ganger/ui'

export function Footer() {
  return (
    <footer className="bg-slate-50">
      <Container>
        <div className="py-16">
          <div className="flex flex-col items-center border-t border-slate-400/10 pt-8 sm:flex-row-reverse sm:justify-between">
            <div className="flex gap-x-6">
              <Link
                href="/privacy"
                className="group relative -mx-3 -my-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:text-slate-900"
              >
                Privacy policy
              </Link>
              <Link
                href="/terms"
                className="group relative -mx-3 -my-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:text-slate-900"
              >
                Terms & conditions
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <GangerLogo className="h-8 w-8" />
              <p className="mt-6 text-sm text-slate-500 sm:mt-0">
                Copyright &copy; {new Date().getFullYear()} Ganger Dermatology.
                All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  )
}