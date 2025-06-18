
'use client'

import { useState, useEffect } from 'react';
import { useAuth, withAuthComponent } from '@ganger/auth';
import { AppLayout, PageHeader, Card, Button } from '@ganger/ui';

// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
// Remove User import as it's not needed - user type comes from auth context

interface DashboardRedirect {
  agent: string;
  supervisor: string;
  manager: string;
  default: string;
}

const DASHBOARD_ROUTES: DashboardRedirect = {
  agent: '/dashboard/agent',
  supervisor: '/dashboard/supervisor', 
  manager: '/dashboard/manager',
  default: '/dashboard/agent'
};

function HomePage() {
  const { user, profile } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (profile?.role) {
      setIsRedirecting(true);
      const targetRoute = DASHBOARD_ROUTES[profile?.role as keyof DashboardRedirect] || DASHBOARD_ROUTES.default;
      window.location.href = targetRoute;
    }
  }, [profile?.role]);

  if (isRedirecting) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Call Center Operations Dashboard" 
        subtitle="Performance tracking and call management system"
      />
      
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Welcome to Call Center Operations
          </h2>
          <p className="text-neutral-600 mb-6">
            This dashboard provides comprehensive call center management including real-time performance 
            tracking, call journaling, and quality assurance workflows.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="primary" 
              onClick={() => window.location.href = '/dashboard/agent'}
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="font-medium">Agent Dashboard</span>
              <span className="text-sm opacity-90">Personal performance metrics</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard/supervisor'}
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="font-medium">Supervisor Dashboard</span>
              <span className="text-sm opacity-90">Team monitoring & reviews</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard/manager'}
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="font-medium">Manager Dashboard</span>
              <span className="text-sm opacity-90">Executive summaries</span>
            </Button>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-3">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/calls/journal'}
                className="w-full justify-start"
              >
                📝 Create Call Journal
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/calls/history'}
                className="w-full justify-start"
              >
                📞 View Call History
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/performance/individual'}
                className="w-full justify-start"
              >
                📊 Performance Reports
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-3">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">3CX Integration</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Real-time Updates</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Call Recording</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Enabled
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default withAuthComponent(HomePage, {
  requiredRoles: ['staff', 'manager', 'superadmin']
});