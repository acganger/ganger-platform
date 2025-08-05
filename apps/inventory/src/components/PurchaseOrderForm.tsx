import React, { useState, useEffect } from 'react';

interface VendorOption {
  id: string;
  name: string;
  value: string;
}

interface InventoryItemOption {
  id: string;
  name: string;
  sku?: string;
  unit_of_measure: string;
  cost_per_unit: number;
  vendor: string;
  category: string;
}

interface OrderItem {
  item_id: string;
  item_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  unit_of_measure: string;
  notes?: string;
}

interface PurchaseOrderFormProps {
  onSubmit: (data: any) => Promise<void>;
  userEmail?: string;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ onSubmit, userEmail }) => {
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [newVendorName, setNewVendorName] = useState('');
  const [showNewVendor, setShowNewVendor] = useState(false);
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  
  const [notes, setNotes] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [shippingAmount, setShippingAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch vendors
  useEffect(() => {
    fetchVendors();
    fetchInventoryItems();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  const fetchInventoryItems = async (vendor?: string) => {
    try {
      const url = vendor ? `/api/items?vendor=${vendor}` : '/api/items';
      const response = await fetch(url);
      const data = await response.json();
      setInventoryItems(data.items || []);
    } catch (err) {
      console.error('Error fetching inventory items:', err);
    }
  };

  const handleVendorChange = (vendor: string) => {
    setSelectedVendor(vendor);
    setShowNewVendor(false);
    // Fetch items for this vendor
    fetchInventoryItems(vendor);
  };

  const handleAddNewVendor = async () => {
    if (!newVendorName.trim()) return;
    
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVendorName })
      });
      
      if (response.ok) {
        setSelectedVendor(newVendorName);
        setShowNewVendor(false);
        setNewVendorName('');
        // Refresh vendors list
        fetchVendors();
      }
    } catch (err) {
      console.error('Error adding vendor:', err);
    }
  };

  const handleAddItem = (item: InventoryItemOption) => {
    const existingIndex = selectedItems.findIndex(i => i.item_id === item.id);
    
    if (existingIndex >= 0) {
      // Increment quantity if item already added
      const updated = [...selectedItems];
      if (updated[existingIndex]) {
        updated[existingIndex].quantity += 1;
      }
      setSelectedItems(updated);
    } else {
      // Add new item
      setSelectedItems([...selectedItems, {
        item_id: item.id,
        item_name: item.name,
        sku: item.sku,
        quantity: 1,
        unit_price: item.cost_per_unit || 0,
        unit_of_measure: item.unit_of_measure,
        notes: ''
      }]);
    }
  };

  const handleUpdateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...selectedItems];
    const item = updated[index];
    if (item) {
      updated[index] = { ...item, [field]: value };
      setSelectedItems(updated);
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + shippingAmount + taxAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVendor || selectedItems.length === 0) {
      setError('Please select a vendor and add at least one item');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({
        vendor: selectedVendor,
        items: selectedItems,
        notes,
        expected_delivery: expectedDelivery || null,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        ordered_by: userEmail
      });

      // Reset form
      setSelectedVendor('');
      setSelectedItems([]);
      setNotes('');
      setExpectedDelivery('');
      setShippingAmount(0);
      setTaxAmount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Vendor Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Vendor Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Vendor
            </label>
            <div className="flex gap-2">
              <select
                value={selectedVendor}
                onChange={(e) => handleVendorChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={showNewVendor}
              >
                <option value="">Choose a vendor...</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.value}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={() => setShowNewVendor(!showNewVendor)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                {showNewVendor ? 'Cancel' : 'New Vendor'}
              </button>
            </div>
          </div>

          {showNewVendor && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                placeholder="Enter new vendor name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddNewVendor}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                Add Vendor
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Search and Selection */}
      {selectedVendor && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Add Products</h3>
          
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name, SKU, or category..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto border rounded-md">
            {filteredItems.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{item.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.sku || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.category}</td>
                      <td className="px-4 py-2 text-sm">${item.cost_per_unit?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => handleAddItem(item)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center py-8 text-gray-500">No products found</p>
            )}
          </div>
        </div>
      )}

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Order Items</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedItems.map((item, index) => (
                  <tr key={`${item.item_id}-${index}`}>
                    <td className="px-4 py-2 text-sm">{item.item_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{item.sku || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleUpdateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm font-medium">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                        placeholder="Optional notes"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order Summary */}
          <div className="mt-6 border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>Tax:</span>
                <div className="flex items-center">
                  <span className="mr-1">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>Shipping:</span>
                <div className="flex items-center">
                  <span className="mr-1">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingAmount}
                    onChange={(e) => setShippingAmount(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={expectedDelivery}
              onChange={(e) => setExpectedDelivery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any special instructions or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !selectedVendor || selectedItems.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Purchase Order'}
        </button>
      </div>
    </form>
  );
};