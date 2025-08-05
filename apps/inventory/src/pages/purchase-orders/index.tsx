export const dynamic = 'force-dynamic';

import React from 'react';
import { useStaffAuth, AuthGuard } from '@ganger/auth/staff';
import { AppLayout, PageHeader } from '@ganger/ui';
import { PurchaseOrderList } from '../../components/PurchaseOrderList';

function PurchaseOrdersPage() {
  const { user } = useStaffAuth();

  return (
    <AppLayout>
      <PageHeader 
        title="Purchase Orders"
        subtitle="Create and manage purchase orders for inventory items"
      />
      
      <div className="px-4 sm:px-6 lg:px-8">
        <PurchaseOrderList userEmail={user?.email} />
      </div>
    </AppLayout>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedPurchaseOrdersPage() {
  return (
    <AuthGuard level="staff" appName="inventory">
      <PurchaseOrdersPage />
    </AuthGuard>
  );
}