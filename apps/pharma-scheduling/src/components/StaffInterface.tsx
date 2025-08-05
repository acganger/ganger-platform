'use client'

import { StaffPortalLayout } from '@ganger/ui';
import { useStaffAuth } from '@ganger/auth/staff';

interface StaffInterfaceProps {
  children: React.ReactNode;
}

export function StaffInterface({ children }: StaffInterfaceProps) {
  useStaffAuth(); // Ensure authentication

  return (
    <StaffPortalLayout 
      currentApp="pharma-scheduling"
      relatedApps={['eos-l10', 'call-center-ops']}
      hasExternalInterface={true}
      quickActions={[
        { name: 'View Rep Bookings', path: '/pharma-scheduling/bookings' },
        { name: 'Manage Availability', path: '/pharma-scheduling/availability' },
        { name: 'Schedule Conflicts', path: '/pharma-scheduling/conflicts' },
        { 
          name: 'External Booking Portal', 
          path: 'https://reps.gangerdermatology.com', 
          external: true,
          description: 'External rep booking interface'
        }
      ]}
      workflowConnections={[
        {
          name: 'EOS L10 Platform',
          path: '/l10',
          description: 'Team management and business operations',
          category: 'Business Operations'
        },
        {
          name: 'Call Center Operations',
          path: '/phones',
          description: 'Patient communication coordination',
          category: 'Business Operations'
        }
      ]}
      interfaceNote="Staff interface for pharmaceutical rep scheduling. External rep portal available at reps.gangerdermatology.com"
    >
      <div className="pharma-scheduling-staff-container">
        {children}
      </div>
    </StaffPortalLayout>
  );
}