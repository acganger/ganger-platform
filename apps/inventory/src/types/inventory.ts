import { BaseEntity } from '@ganger/db';

export interface InventoryItem extends BaseEntity {
  name: string;
  description?: string;
  category_id: string;
  supplier_id?: string;
  sku?: string;
  barcode?: string;
  
  // Stock management
  current_stock: number;
  min_stock_level: number;
  max_stock_level?: number;
  reorder_point: number;
  reorder_quantity: number;
  
  // Pricing
  unit_cost: number;
  unit_price?: number;
  currency: string;
  
  // Physical properties
  unit_of_measure: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  
  // Expiration tracking
  is_perishable: boolean;
  expiration_date?: string;
  lot_number?: string;
  
  // Location and organization
  location_id: string;
  storage_location?: string;
  
  // Status and flags
  is_active: boolean;
  is_prescription_required: boolean;
  is_controlled_substance: boolean;
  
  // Metadata
  last_counted_at?: string;
  last_ordered_at?: string;
  notes?: string;
}

export interface InventoryCategory extends BaseEntity {
  name: string;
  description?: string;
  parent_category_id?: string;
  color_code?: string;
  icon?: string;
  is_active: boolean;
}

export interface Supplier extends BaseEntity {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  payment_terms?: string;
  lead_time_days?: number;
  minimum_order?: number;
  is_active: boolean;
}

export interface InventoryTransaction extends BaseEntity {
  item_id: string;
  transaction_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  
  // References
  order_id?: string;
  user_id: string;
  location_id: string;
  
  // Details
  reason?: string;
  notes?: string;
  reference_number?: string;
  
  // Batch/lot tracking
  lot_number?: string;
  expiration_date?: string;
  
  // Transfer details
  from_location_id?: string;
  to_location_id?: string;
}

export interface PurchaseOrder extends BaseEntity {
  order_number: string;
  supplier_id: string;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
  
  // Financial
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  currency: string;
  
  // Dates
  order_date: string;
  expected_delivery_date?: string;
  received_date?: string;
  
  // User tracking
  created_by: string;
  approved_by?: string;
  received_by?: string;
  
  // Details
  notes?: string;
  shipping_address?: string;
}

export interface PurchaseOrderItem extends BaseEntity {
  purchase_order_id: string;
  inventory_item_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  
  // Item details at time of order
  item_name: string;
  item_sku?: string;
  
  // Receiving details
  lot_number?: string;
  expiration_date?: string;
  received_date?: string;
  
  notes?: string;
}

export interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'expiring_soon' | 'expired' | 'overstock';
  item_id: string;
  item_name: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface StockCountSession extends BaseEntity {
  session_name: string;
  location_id: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  
  // Planning
  scheduled_date: string;
  count_type: 'full' | 'partial' | 'cycle';
  category_ids?: string[];
  
  // Execution
  started_at?: string;
  completed_at?: string;
  started_by?: string;
  completed_by?: string;
  
  // Results
  items_planned: number;
  items_counted: number;
  discrepancies_found: number;
  
  notes?: string;
}

export interface StockCount extends BaseEntity {
  session_id: string;
  item_id: string;
  expected_quantity: number;
  counted_quantity: number;
  variance: number;
  variance_value: number;
  
  // Details
  counted_by: string;
  counted_at: string;
  lot_number?: string;
  expiration_date?: string;
  
  // Resolution
  is_variance_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  adjustment_made: boolean;
  
  notes?: string;
}