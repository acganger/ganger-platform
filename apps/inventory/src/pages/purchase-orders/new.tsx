export const dynamic = 'force-dynamic';

import React from 'react';
import { useRouter } from 'next/router';
import { useStaffAuth, AuthGuard } from '@ganger/auth/staff';
import { AppLayout, PageHeader } from '@ganger/ui';
import { PurchaseOrderForm } from '../../components/PurchaseOrderForm';

function NewPurchaseOrderPage() {
  const { user } = useStaffAuth();
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to create purchase order');
      }

      await response.json();
      
      // Redirect to the purchase orders list
      router.push('/purchase-orders');
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  };

  return (
    <AppLayout>
      <PageHeader 
        title="New Purchase Order"
        subtitle="Create a new purchase order for inventory items"
      />
      
      <div className="px-4 sm:px-6 lg:px-8">
        <PurchaseOrderForm 
          onSubmit={handleSubmit}
          userEmail={user?.email}
        />
      </div>
    </AppLayout>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedNewPurchaseOrderPage() {
  return (
    <AuthGuard level="staff" appName="inventory">
      <NewPurchaseOrderPage />
    </AuthGuard>
  );
}