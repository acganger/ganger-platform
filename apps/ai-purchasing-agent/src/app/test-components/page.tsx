'use client'

import { useState } from 'react'
import { VendorPriceGrid } from '@/components/VendorPriceGrid'
import { RecommendationCard } from '@/components/RecommendationCard'
import { ContractComplianceWidget } from '@/components/ContractComplianceWidget'
import type { StandardizedProduct, VendorConfiguration, VendorQuote, PriceComparison } from '@ganger/types'

// Mock data for testing
const mockProduct: StandardizedProduct = {
  id: '1',
  name: 'Nitrile Exam Gloves - Medium',
  category: 'gloves_ppe',
  description: 'Powder-free nitrile examination gloves',
  specifications: ['Powder-free', 'Latex-free', 'Textured fingertips'],
  standard_package_size: 'Box of 100',
  units_per_package: 100,
  unit_of_measure: 'gloves',
  is_critical: true,
  average_monthly_usage: 500,
  reorder_point: 10,
  minimum_order_quantity: 5,
  maximum_order_quantity: 50,
  substitute_product_ids: [],
  tags: ['exam', 'nitrile', 'medium'],
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const mockVendors: VendorConfiguration[] = [
  {
    id: '1',
    vendor_name: 'McKesson',
    is_active: true,
    supports_real_time_pricing: true,
    supports_bulk_ordering: true,
    average_delivery_days: 3,
    minimum_order_amount: 100,
    free_shipping_threshold: 250,
    gpo_contract_number: 'PP-SU-1074',
    contract_expiry_date: '2024-12-31',
    notes: 'Primary vendor for gloves and wound care',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    vendor_name: 'Henry Schein',
    is_active: true,
    supports_real_time_pricing: false,
    supports_bulk_ordering: true,
    average_delivery_days: 2,
    minimum_order_amount: 150,
    notes: 'Fast delivery for syringes and diagnostics',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    vendor_name: 'Medline',
    is_active: true,
    supports_real_time_pricing: true,
    supports_bulk_ordering: true,
    average_delivery_days: 5,
    minimum_order_amount: 200,
    free_shipping_threshold: 500,
    notes: 'Backup vendor with good paper product selection',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockQuotes: VendorQuote[] = [
  {
    id: '1',
    price_comparison_id: 'comp-1',
    vendor_id: '1',
    vendor_product_mapping_id: 'map-1',
    product_match_score: 0.95,
    unit_price: 8.99,
    total_price: 89.90,
    shipping_cost: 0,
    estimated_delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_contract_pricing: true,
    is_in_stock: true,
    quote_valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'GPO contract pricing applied',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    price_comparison_id: 'comp-1',
    vendor_id: '2',
    vendor_product_mapping_id: 'map-2',
    product_match_score: 0.90,
    unit_price: 9.49,
    total_price: 94.90,
    shipping_cost: 5.00,
    estimated_delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_contract_pricing: false,
    is_in_stock: true,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    price_comparison_id: 'comp-1',
    vendor_id: '3',
    vendor_product_mapping_id: 'map-3',
    product_match_score: 0.88,
    unit_price: 10.99,
    total_price: 109.90,
    shipping_cost: 10.00,
    estimated_delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_contract_pricing: false,
    is_in_stock: true,
    created_at: new Date().toISOString()
  }
]

const mockComparison: PriceComparison = {
  id: '1',
  purchase_request_item_id: 'item-1',
  analysis_timestamp: new Date().toISOString(),
  recommended_vendor_id: '1',
  potential_savings: 15.00,
  savings_percentage: 12.5,
  recommendation_reason: 'Best price with GPO contract and fastest delivery',
  ai_confidence_score: 0.95,
  created_at: new Date().toISOString()
}

export default function TestComponentsPage() {
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendor(vendorId)
  }

  const handleAcceptRecommendation = () => {
    // Handle recommendation acceptance
  }

  const handleRejectRecommendation = () => {
    // Handle recommendation rejection
  }

  const handleViewDetails = () => {
    // Handle view details
  }

  // The quotes already have total_price from mock data

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AI Purchasing Agent - Component Test</h1>

      {/* Test VendorPriceGrid */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Vendor Price Grid</h2>
        <VendorPriceGrid
          product={mockProduct}
          quotes={mockQuotes}
          vendors={mockVendors}
          recommendedVendorId="1"
          onSelectVendor={handleVendorSelect}
        />
        {selectedVendor && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              Selected Vendor ID: {selectedVendor}
            </p>
          </div>
        )}
      </section>

      {/* Test RecommendationCard */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Recommendation Card</h2>
        <RecommendationCard
          comparison={mockComparison}
          vendor={mockVendors[0]}
          reasons={[
            {
              type: 'price',
              description: 'Lowest price available through GPO contract',
              impact: 'Save $15.00 per order'
            },
            {
              type: 'delivery',
              description: 'Fastest delivery time (3 days)',
              impact: 'Ensure stock availability'
            },
            {
              type: 'contract',
              description: 'Active Premier GPO contract',
              impact: 'Contract pricing guaranteed through 2024'
            }
          ]}
          alternativeOptions={[
            {
              vendor: mockVendors[1],
              savingsPercent: 8.5,
              tradeoff: 'Faster delivery (2 days) but higher price'
            }
          ]}
          onAccept={handleAcceptRecommendation}
          onReject={handleRejectRecommendation}
          onViewDetails={handleViewDetails}
        />
      </section>

      {/* Test ContractComplianceWidget */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Contract Compliance Widget</h2>
        <div className="max-w-md">
          <ContractComplianceWidget
            totalItems={100}
            contractItems={85}
            nonContractItems={15}
            potentialSavings={1250.00}
            vendors={mockVendors}
            expiringContracts={[
              {
                vendor: mockVendors[0],
                daysUntilExpiry: 45
              }
            ]}
          />
        </div>
      </section>
    </div>
  )
}