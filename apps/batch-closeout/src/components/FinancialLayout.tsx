'use client'

import { StaffPortalLayout } from '@ganger/ui';
import { useStaffAuth } from '@ganger/auth';

interface FinancialLayoutProps {
  children: React.ReactNode;
}

export function FinancialLayout({ children }: FinancialLayoutProps) {
  const { user, isAuthenticated } = useStaffAuth();

  return (
    <StaffPortalLayout 
      currentApp="batch-closeout"
      relatedApps={['clinical-staffing', 'platform-dashboard']}
      preserveFinancialWorkflows={true}
      quickActions={[
        { name: 'Daily Closeout', path: '/batch/daily' },
        { name: 'Batch Protocol', path: '/batch/protocol' },
        { name: 'Financial Reports', path: '/batch/reports' },
        { name: 'Processing Queue', path: '/batch/queue' },
        { name: 'Platform Metrics', path: '/dashboard' }
      ]}
      workflowConnections={[
        {
          name: 'Clinical Staffing',
          path: '/staffing',
          description: 'Staff scheduling and operational coordination',
          category: 'Operations'
        },
        {
          name: 'Platform Dashboard',
          path: '/dashboard', 
          description: 'System metrics and business intelligence',
          category: 'Analytics'
        }
      ]}
      complianceMode={true}
      appDescription="Financial operations and daily batch closeout processing"
    >
      <div className="financial-operations-container">
        {children}
      </div>
    </StaffPortalLayout>
  );
}