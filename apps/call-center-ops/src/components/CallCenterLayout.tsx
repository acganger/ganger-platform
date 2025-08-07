'use client'

import { StaffPortalLayout } from '@ganger/ui';

interface CallCenterLayoutProps {
  children: React.ReactNode;
}

export function CallCenterLayout({ children }: CallCenterLayoutProps) {
  // Auth handled by parent layout

  return (
    <StaffPortalLayout 
      currentApp="call-center"
      relatedApps={['clinical-staffing', 'pharma-scheduling']}
      specialIntegrations={['3CX']}
      quickActions={[
        { name: 'Call Queue Status', path: '/phones/queue' },
        { name: '3CX Dashboard', path: '/phones/3cx' },
        { name: 'Call History', path: '/phones/calls/history' },
        { name: 'Agent Dashboard', path: '/phones/dashboard/agent' },
        { name: 'Manager Dashboard', path: '/phones/dashboard/manager' },
        { name: 'Staff Directory', path: '/staffing' }
      ]}
      workflowConnections={[
        {
          name: 'Clinical Staffing',
          path: '/staffing',
          description: 'Staff scheduling and availability management',
          category: 'Operations'
        },
        {
          name: 'Pharma Scheduling',
          path: '/pharma-scheduling',
          description: 'Coordinate rep meetings with patient calls',
          category: 'Business Operations'
        }
      ]}
      integrationNotes={{
        '3CX': 'Phone system integration maintained - all existing 3CX functionality preserved'
      }}
    >
      <div className="call-center-container">
        {children}
      </div>
    </StaffPortalLayout>
  );
}