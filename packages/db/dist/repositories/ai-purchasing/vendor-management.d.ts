import { BaseRepository } from '../../utils/base-repository';
import type { VendorConfiguration, VendorProductMapping, VendorQuote, PriceComparison, PriceComparisonResult } from '@ganger/types';
import { z } from 'zod';
export declare const vendorConfigurationSchema: z.ZodObject<{
    vendor_name: z.ZodString;
    is_active: z.ZodDefault<z.ZodBoolean>;
    api_endpoint: z.ZodOptional<z.ZodString>;
    auth_method: z.ZodOptional<z.ZodEnum<["api_key", "oauth", "basic", "none"]>>;
    rate_limit_per_minute: z.ZodOptional<z.ZodNumber>;
    supports_real_time_pricing: z.ZodDefault<z.ZodBoolean>;
    supports_bulk_ordering: z.ZodDefault<z.ZodBoolean>;
    minimum_order_amount: z.ZodOptional<z.ZodNumber>;
    free_shipping_threshold: z.ZodOptional<z.ZodNumber>;
    average_delivery_days: z.ZodOptional<z.ZodNumber>;
    gpo_contract_number: z.ZodOptional<z.ZodString>;
    contract_expiry_date: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    is_active: boolean;
    vendor_name: string;
    supports_real_time_pricing: boolean;
    supports_bulk_ordering: boolean;
    notes?: string | undefined;
    api_endpoint?: string | undefined;
    auth_method?: "api_key" | "oauth" | "basic" | "none" | undefined;
    rate_limit_per_minute?: number | undefined;
    minimum_order_amount?: number | undefined;
    free_shipping_threshold?: number | undefined;
    average_delivery_days?: number | undefined;
    gpo_contract_number?: string | undefined;
    contract_expiry_date?: string | undefined;
}, {
    vendor_name: string;
    is_active?: boolean | undefined;
    notes?: string | undefined;
    api_endpoint?: string | undefined;
    auth_method?: "api_key" | "oauth" | "basic" | "none" | undefined;
    rate_limit_per_minute?: number | undefined;
    supports_real_time_pricing?: boolean | undefined;
    supports_bulk_ordering?: boolean | undefined;
    minimum_order_amount?: number | undefined;
    free_shipping_threshold?: number | undefined;
    average_delivery_days?: number | undefined;
    gpo_contract_number?: string | undefined;
    contract_expiry_date?: string | undefined;
}>;
export declare class VendorManagementRepository extends BaseRepository<VendorConfiguration> {
    constructor();
    findAll(onlyActive?: boolean): Promise<VendorConfiguration[]>;
    findActiveVendors(): Promise<VendorConfiguration[]>;
    findVendorByName(name: string): Promise<VendorConfiguration | null>;
    getVendorProductMappings(vendorId: string, productIds?: string[]): Promise<VendorProductMapping[]>;
    createProductMapping(mapping: Omit<VendorProductMapping, 'id' | 'created_at' | 'updated_at'>): Promise<VendorProductMapping>;
    updateProductPrice(mappingId: string, price: number): Promise<VendorProductMapping>;
    createPriceComparison(requestItemId: string, recommendedVendorId?: string, reason?: string): Promise<PriceComparison>;
    createVendorQuote(quote: Omit<VendorQuote, 'id' | 'created_at'>): Promise<VendorQuote>;
    getPriceComparisonResults(comparisonId: string): Promise<PriceComparisonResult | null>;
    findBestPrice(productId: string, quantity: number): Promise<{
        vendor: VendorConfiguration;
        mapping: VendorProductMapping;
        total_price: number;
        unit_price: number;
        is_contract_pricing: boolean;
    } | null>;
    getVendorPerformanceMetrics(vendorId: string, days?: number): Promise<{
        total_orders: number;
        total_spend: number;
        average_delivery_days: number;
        on_time_delivery_rate: number;
        contract_compliance_rate: number;
    }>;
    getQuotesForProduct(productId: string): Promise<VendorQuote[]>;
    getQuotesForVendor(vendorId: string): Promise<VendorQuote[]>;
    getProductMappingsForVendor(vendorId: string): Promise<VendorProductMapping[]>;
}
