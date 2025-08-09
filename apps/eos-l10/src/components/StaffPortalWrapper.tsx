'use client'

import { StaffPortalLayout } from '@ganger/ui';
import { useAuth } from '@ganger/auth';

interface StaffPortalWrapperProps {
  children: React.ReactNode;
}

export function StaffPortalWrapper({ children }: StaffPortalWrapperProps) {
  const { user: _user } = useAuth();
  
  return (
    <StaffPortalLayout 
      currentApp="l10"
      preservePWA={true}
      relatedApps={['pharma-scheduling', 'call-center-ops', 'batch-closeout']}
      quickActions={[
        { name: 'Weekly L10 Meeting', path: '/l10/meeting/start' },
        { name: 'Scorecard Review', path: '/l10/scorecard' },
        { name: 'Rock Status', path: '/l10/rocks' },
        { name: 'IDS Board', path: '/l10/issues' }
      ]}
      workflowConnections={[
        {
          name: 'Pharma Scheduling',
          path: '/pharma-scheduling',
          description: 'Schedule pharmaceutical rep meetings',
          category: 'Business Operations'
        },
        {
          name: 'Call Center Operations', 
          path: '/phones',
          description: 'Patient communication management',
          category: 'Business Operations'
        },
        {
          name: 'Batch Closeout',
          path: '/batch',
          description: 'Financial operations and reporting',
          category: 'Business Operations'
        }
      ]}
    >
      <div className="l10-app-container">
        {children}
      </div>
    </StaffPortalLayout>
  );
}