import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { NotificationCenter } from './NotificationCenter';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <NotificationCenter />
    </div>
  );
}