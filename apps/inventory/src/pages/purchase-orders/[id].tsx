export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useStaffAuth, AuthGuard } from '@ganger/auth/staff';
import { AppLayout, PageHeader, Button, LoadingSpinner, useToast } from '@ganger/ui';

interface PurchaseOrder {
  id: string;
  order_number: string;
  vendor: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  shipping_amount: number;
  created_at: string;
  expected_delivery?: string;
  notes?: string;
  metadata?: any;
  purchase_order_items?: Array<{
    quantity: number;
    unit_price: number;
    notes?: string;
    inventory_items: {
      id: string;
      name: string;
      sku?: string;
      unit_of_measure: string;
    };
  }>;
}

function PurchaseOrderDetailPage() {
  const router = useRouter();
  const { user } = useStaffAuth();
  const { addToast } = useToast();
  const { id } = router.query;
  
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [markdownSummary, setMarkdownSummary] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrder();
      fetchSummary();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/purchase-orders?limit=1`);
      const data = await response.json();
      // Find the specific order by ID
      const foundOrder = data.orders?.find((o: PurchaseOrder) => o.id === id);
      if (foundOrder) {
        setOrder(foundOrder);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      addToast({
        title: 'Error',
        message: 'Failed to load purchase order',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`/api/purchase-orders/${id}/summary`);
      const data = await response.json();
      setMarkdownSummary(data.markdown);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/purchase-orders/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved_by: user?.email,
          user_email: user?.email
        })
      });

      if (response.ok) {
        addToast({
          title: 'Success',
          message: 'Purchase order approved successfully',
          type: 'success'
        });
        // Refresh the order
        fetchOrder();
      } else {
        const error = await response.json();
        addToast({
          title: 'Error',
          message: error.message || 'Failed to approve order',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error approving order:', err);
      addToast({
        title: 'Error',
        message: 'Failed to approve order',
        type: 'error'
      });
    }
  };

  const handleDownloadSummary = () => {
    if (!markdownSummary || !order) return;
    
    const blob = new Blob([markdownSummary], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `PO-${order.order_number}-summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };


  const canApprove = () => {
    const email = user?.email;
    return (
      order?.status === 'draft' &&
      (email === 'anand@gangerdermatology.com' || 
       email?.toLowerCase().includes('ou@') ||
       email?.toLowerCase().includes('manager'))
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Purchase order not found</p>
          <Button
            onClick={() => router.push('/purchase-orders')}
            className="mt-4"
          >
            Back to Orders
          </Button>
        </div>
      </AppLayout>
    );
  }

  const subtotal = order.purchase_order_items?.reduce(
    (sum, item) => sum + (item.quantity * item.unit_price), 
    0
  ) || 0;

  return (
    <AppLayout>
      <PageHeader 
        title={`Purchase Order: ${order.order_number}`}
        subtitle={`${order.status.charAt(0).toUpperCase() + order.status.slice(1)} • Created on ${new Date(order.created_at).toLocaleDateString()}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/purchase-orders')}
            >
              Back
            </Button>
            
            {canApprove() && (
              <Button
                variant="primary"
                onClick={handleApprove}
              >
                Approve Order
              </Button>
            )}
            
            <Button
              variant="primary"
              onClick={handleDownloadSummary}
            >
              Download Summary
            </Button>
          </div>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8">
        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Vendor</h3>
            <p className="text-lg font-semibold">{order.vendor}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Expected Delivery</h3>
            <p className="text-lg font-semibold">
              {order.expected_delivery 
                ? new Date(order.expected_delivery).toLocaleDateString() 
                : 'Not specified'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Total Amount</h3>
            <p className="text-lg font-semibold">${order.total_amount.toFixed(2)}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Order Items</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.purchase_order_items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.inventory_items.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.inventory_items.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {item.quantity} {item.inventory_items.unit_of_measure}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      ${item.unit_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                    Subtotal:
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                    ${subtotal.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
                {order.tax_amount > 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      Tax:
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      ${order.tax_amount.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                )}
                {order.shipping_amount > 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      Shipping:
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      ${order.shipping_amount.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Total:
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    ${order.total_amount.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Approval Info */}
        {order.metadata?.approved_by && (
          <div className="bg-green-50 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Approval Information</h3>
            <p className="text-green-700">
              Approved by <strong>{order.metadata.approved_by}</strong> on{' '}
              {new Date(order.metadata.approved_at).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedPurchaseOrderDetailPage() {
  return (
    <AuthGuard level="staff" appName="inventory">
      <PurchaseOrderDetailPage />
    </AuthGuard>
  );
}