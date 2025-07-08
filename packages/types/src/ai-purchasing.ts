// AI Purchasing Agent Types
// Corresponds to database schema in 20250108_create_ai_purchasing_tables.sql

// Vendor Configuration
export interface VendorConfiguration {
  id: string;
  vendor_name: string;
  is_active: boolean;
  api_endpoint?: string;
  api_key_encrypted?: string;
  auth_method?: 'api_key' | 'oauth' | 'basic' | 'none';
  rate_limit_per_minute?: number;
  supports_real_time_pricing: boolean;
  supports_bulk_ordering: boolean;
  minimum_order_amount?: number;
  free_shipping_threshold?: number;
  average_delivery_days?: number;
  gpo_contract_number?: string;
  contract_expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Product Categories
export type ProductCategory = 
  | 'gloves_ppe'
  | 'wound_care'
  | 'syringes'
  | 'paper_products'
  | 'antiseptics'
  | 'diagnostic_supplies'
  | 'surgical_supplies'
  | 'medications'
  | 'other';

// Standardized Product
export interface StandardizedProduct {
  id: string;
  name: string;
  category: ProductCategory;
  description?: string;
  specifications: string[];
  standard_package_size: string;
  unit_of_measure: string;
  units_per_package: number;
  minimum_order_quantity?: number;
  maximum_order_quantity?: number;
  reorder_point?: number;
  average_monthly_usage?: number;
  last_order_date?: string;
  image_url?: string;
  is_active: boolean;
  is_critical: boolean;
  substitute_product_ids: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Vendor Product Mapping
export interface VendorProductMapping {
  id: string;
  standardized_product_id: string;
  vendor_id: string;
  vendor_sku: string;
  vendor_product_name: string;
  vendor_package_size?: string;
  vendor_unit_price?: number;
  last_known_price?: number;
  last_price_update?: string;
  is_preferred: boolean;
  is_contract_item: boolean;
  contract_price?: number;
  lead_time_days?: number;
  minimum_order_quantity?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Request Types
export type RequestType = 
  | 'consolidated_order'
  | 'shopping_cart'
  | 'manual_entry'
  | 'recurring_order';

// Request Status
export type RequestStatus = 
  | 'draft'
  | 'submitted'
  | 'analyzing'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'ordering'
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'cancelled';

// Urgency Levels
export type UrgencyLevel = 'routine' | 'urgent' | 'emergency';

// Purchase Request
export interface PurchaseRequest {
  id: string;
  request_number: string;
  requester_email: string;
  requester_name: string;
  requester_id?: string;
  department?: string;
  request_type: RequestType;
  status: RequestStatus;
  urgency: UrgencyLevel;
  total_estimated_cost?: number;
  total_actual_cost?: number;
  estimated_savings?: number;
  notes?: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by_email?: string;
  approved_by_id?: string;
  ordered_at?: string;
  received_at?: string;
  created_at: string;
  updated_at: string;
}

// Purchase Request Item
export interface PurchaseRequestItem {
  id: string;
  purchase_request_id: string;
  standardized_product_id?: string;
  product_name: string;
  requested_quantity: number;
  unit_of_measure: string;
  estimated_unit_price?: number;
  notes?: string;
  vendor_sku?: string;
  clinical_specifications?: string[];
  created_at: string;
  updated_at: string;
}

// Price Comparison
export interface PriceComparison {
  id: string;
  purchase_request_item_id: string;
  analysis_timestamp: string;
  recommended_vendor_id?: string;
  potential_savings?: number;
  savings_percentage?: number;
  recommendation_reason?: string;
  ai_confidence_score?: number;
  created_at: string;
}

// Vendor Quote
export interface VendorQuote {
  id: string;
  price_comparison_id: string;
  vendor_id: string;
  vendor_product_mapping_id?: string;
  product_match_score?: number;
  unit_price: number;
  total_price: number;
  shipping_cost?: number;
  estimated_delivery_date?: string;
  is_contract_pricing: boolean;
  is_in_stock: boolean;
  quote_valid_until?: string;
  notes?: string;
  created_at: string;
}

// Consolidated Order Status
export type ConsolidatedOrderStatus = 
  | 'draft'
  | 'submitted'
  | 'analyzing'
  | 'optimized'
  | 'approved'
  | 'ordered';

// Consolidated Order
export interface ConsolidatedOrder {
  id: string;
  order_number: string;
  requester_email: string;
  requester_name: string;
  requester_id?: string;
  department: string;
  status: ConsolidatedOrderStatus;
  urgency: UrgencyLevel;
  notes?: string;
  submitted_at?: string;
  optimized_at?: string;
  total_estimated_savings?: number;
  created_at: string;
  updated_at: string;
}

// Consolidated Order Item
export interface ConsolidatedOrderItem {
  id: string;
  consolidated_order_id: string;
  standardized_product_id: string;
  requested_quantity: number;
  optimized_quantity?: number;
  justification?: string;
  urgency_level: 'routine' | 'urgent';
  created_at: string;
  updated_at: string;
}

// Vendor Order Split Status
export type VendorOrderSplitStatus = 
  | 'pending'
  | 'placed'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

// Vendor Order Split
export interface VendorOrderSplit {
  id: string;
  purchase_request_id?: string;
  consolidated_order_id?: string;
  vendor_id: string;
  order_total: number;
  shipping_cost?: number;
  estimated_delivery_date?: string;
  vendor_order_number?: string;
  status: VendorOrderSplitStatus;
  placed_at?: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Procurement Analytics
export interface ProcurementAnalytics {
  id: string;
  period_start: string;
  period_end: string;
  total_spend?: number;
  total_savings?: number;
  savings_percentage?: number;
  total_orders?: number;
  average_order_value?: number;
  contract_compliance_rate?: number;
  vendor_diversity_score?: number;
  top_products: Array<{
    product_id: string;
    product_name: string;
    total_quantity: number;
    total_spend: number;
  }>;
  top_vendors: Array<{
    vendor_id: string;
    vendor_name: string;
    total_orders: number;
    total_spend: number;
  }>;
  savings_by_category: Record<ProductCategory, number>;
  created_at: string;
}

// API Request/Response Types
export interface CreatePurchaseRequestPayload {
  department?: string;
  request_type: RequestType;
  urgency?: UrgencyLevel;
  notes?: string;
  items: Array<{
    standardized_product_id?: string;
    product_name: string;
    requested_quantity: number;
    unit_of_measure: string;
    notes?: string;
    vendor_sku?: string;
    clinical_specifications?: string[];
  }>;
}

export interface CreateConsolidatedOrderPayload {
  department: string;
  urgency?: UrgencyLevel;
  notes?: string;
  items: Array<{
    standardized_product_id: string;
    requested_quantity: number;
    justification?: string;
    urgency_level?: 'routine' | 'urgent';
  }>;
}

export interface PriceComparisonResult {
  comparison: PriceComparison;
  vendor_quotes: VendorQuote[];
  recommended_vendor?: VendorConfiguration;
  product_mappings: VendorProductMapping[];
}

export interface OptimizedOrderRecommendation {
  total_estimated_savings: number;
  recommended_vendor_splits: Array<{
    vendor: VendorConfiguration;
    items: Array<{
      product: StandardizedProduct;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    estimated_delivery_date: string;
  }>;
  case_optimizations: Array<{
    product: StandardizedProduct;
    original_quantity: number;
    optimized_quantity: number;
    reason: string;
    savings: number;
  }>;
  substitution_suggestions: Array<{
    original_product: StandardizedProduct;
    suggested_product: StandardizedProduct;
    reason: string;
    savings: number;
  }>;
}

// Helper Types
export interface ProductUsageStats {
  product_id: string;
  average_monthly_usage: number;
  last_order_date: string;
  last_order_quantity: number;
  reorder_suggested: boolean;
  suggested_quantity: number;
}

// Order item type for historical order data analysis
export interface OrderItem {
  id: string;
  order_id: string;
  standardized_product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  vendor_id?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorPerformanceMetrics {
  vendor_id: string;
  average_delivery_days: number;
  on_time_delivery_rate: number;
  average_savings_percentage: number;
  contract_compliance_rate: number;
  total_orders: number;
  total_spend: number;
}