import { ReactNode, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  requireRole?: 'staff' | 'manager' | 'admin';
}

export const DashboardLayout = ({ 
  children, 
  title = 'Dashboard',
  requireRole 
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute requiredRole={requireRole}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Navigation */}
        <MobileNav 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          {/* Header */}
          <Header 
            title={title}
            onMenuClick={() => setSidebarOpen(true)}
          />

          {/* Main Content */}
          <main className="flex-1 pb-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};
