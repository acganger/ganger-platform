import { BaseRepository } from '../../utils/base-repository';
import { z } from 'zod';
// Validation schemas
export const vendorConfigurationSchema = z.object({
    vendor_name: z.string().min(1).max(255),
    is_active: z.boolean().default(true),
    api_endpoint: z.string().url().optional(),
    auth_method: z.enum(['api_key', 'oauth', 'basic', 'none']).optional(),
    rate_limit_per_minute: z.number().int().positive().optional(),
    supports_real_time_pricing: z.boolean().default(false),
    supports_bulk_ordering: z.boolean().default(false),
    minimum_order_amount: z.number().optional(),
    free_shipping_threshold: z.number().optional(),
    average_delivery_days: z.number().int().optional(),
    gpo_contract_number: z.string().optional(),
    contract_expiry_date: z.string().optional(),
    notes: z.string().optional()
});
export class VendorManagementRepository extends BaseRepository {
    constructor() {
        super('vendor_configurations');
    }
    async findAll(onlyActive = true) {
        let query = this.client
            .from(this.tableName)
            .select('*');
        if (onlyActive) {
            query = query.eq('is_active', true);
        }
        const { data, error } = await query.order('vendor_name', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async findActiveVendors() {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('is_active', true)
            .order('vendor_name', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async findVendorByName(name) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('vendor_name', name)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw error;
        }
        return data;
    }
    async getVendorProductMappings(vendorId, productIds) {
        let query = this.client
            .from('vendor_product_mappings')
            .select('*')
            .eq('vendor_id', vendorId);
        if (productIds && productIds.length > 0) {
            query = query.in('standardized_product_id', productIds);
        }
        const { data, error } = await query
            .order('vendor_product_name', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async createProductMapping(mapping) {
        const { data, error } = await this.client
            .from('vendor_product_mappings')
            .insert(mapping)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateProductPrice(mappingId, price) {
        const { data, error } = await this.client
            .from('vendor_product_mappings')
            .update({
            last_known_price: price,
            last_price_update: new Date().toISOString()
        })
            .eq('id', mappingId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async createPriceComparison(requestItemId, recommendedVendorId, reason) {
        const { data, error } = await this.client
            .from('price_comparisons')
            .insert({
            purchase_request_item_id: requestItemId,
            recommended_vendor_id: recommendedVendorId,
            recommendation_reason: reason,
            analysis_timestamp: new Date().toISOString()
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async createVendorQuote(quote) {
        const { data, error } = await this.client
            .from('vendor_quotes')
            .insert(quote)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async getPriceComparisonResults(comparisonId) {
        // Get the comparison
        const { data: comparison, error: compError } = await this.client
            .from('price_comparisons')
            .select('*')
            .eq('id', comparisonId)
            .single();
        if (compError) {
            if (compError.code === 'PGRST116')
                return null;
            throw compError;
        }
        // Get vendor quotes
        const { data: quotes, error: quotesError } = await this.client
            .from('vendor_quotes')
            .select(`
        *,
        vendor:vendor_configurations!vendor_id (*),
        mapping:vendor_product_mappings (*)
      `)
            .eq('price_comparison_id', comparisonId)
            .order('total_price', { ascending: true });
        if (quotesError)
            throw quotesError;
        // Get recommended vendor if specified
        let recommendedVendor = null;
        if (comparison.recommended_vendor_id) {
            recommendedVendor = await this.findById(comparison.recommended_vendor_id);
        }
        // Extract mappings
        const mappings = quotes
            .map((q) => q.mapping)
            .filter(Boolean)
            .flat();
        return {
            comparison: comparison,
            vendor_quotes: quotes.map((q) => {
                const { vendor, mapping, ...quote } = q;
                return quote;
            }),
            recommended_vendor: recommendedVendor || undefined,
            product_mappings: mappings
        };
    }
    async findBestPrice(productId, quantity) {
        // Get all active vendor mappings for this product
        const { data: mappings, error: mappingsError } = await this.client
            .from('vendor_product_mappings')
            .select(`
        *,
        vendor:vendor_configurations!vendor_id (*)
      `)
            .eq('standardized_product_id', productId)
            .eq('vendor.is_active', true);
        if (mappingsError)
            throw mappingsError;
        if (!mappings || mappings.length === 0)
            return null;
        // Calculate prices and find best
        let bestOption = null;
        let lowestPrice = Infinity;
        for (const mapping of mappings) {
            if (!mapping.vendor || !mapping.last_known_price)
                continue;
            const unitPrice = mapping.is_contract_item && mapping.contract_price
                ? mapping.contract_price
                : mapping.last_known_price;
            const totalPrice = unitPrice * quantity;
            // Add shipping if below free threshold
            let finalPrice = totalPrice;
            if (mapping.vendor.free_shipping_threshold &&
                totalPrice < mapping.vendor.free_shipping_threshold) {
                // Estimate shipping cost (could be enhanced with real calculations)
                finalPrice += 15; // Base shipping cost
            }
            if (finalPrice < lowestPrice) {
                lowestPrice = finalPrice;
                bestOption = {
                    vendor: mapping.vendor,
                    mapping: {
                        ...mapping,
                        vendor: undefined // Remove nested vendor
                    },
                    total_price: finalPrice,
                    unit_price: unitPrice,
                    is_contract_pricing: mapping.is_contract_item
                };
            }
        }
        return bestOption;
    }
    async getVendorPerformanceMetrics(vendorId, days = 90) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        // Get order splits for this vendor
        const { data: splits, error } = await this.client
            .from('vendor_order_splits')
            .select('*')
            .eq('vendor_id', vendorId)
            .gte('created_at', startDate.toISOString());
        if (error)
            throw error;
        const metrics = {
            total_orders: splits.length,
            total_spend: 0,
            average_delivery_days: 0,
            on_time_delivery_rate: 0,
            contract_compliance_rate: 0
        };
        if (splits.length === 0)
            return metrics;
        // Calculate metrics
        let deliveryDaysSum = 0;
        let deliveredCount = 0;
        let onTimeCount = 0;
        splits.forEach((split) => {
            metrics.total_spend += split.order_total || 0;
            if (split.delivered_at && split.placed_at) {
                const placedDate = new Date(split.placed_at);
                const deliveredDate = new Date(split.delivered_at);
                const daysDiff = Math.floor((deliveredDate.getTime() - placedDate.getTime()) / (1000 * 60 * 60 * 24));
                deliveryDaysSum += daysDiff;
                deliveredCount++;
                if (split.estimated_delivery_date) {
                    const estimatedDate = new Date(split.estimated_delivery_date);
                    if (deliveredDate <= estimatedDate) {
                        onTimeCount++;
                    }
                }
            }
        });
        metrics.average_delivery_days = deliveredCount > 0
            ? Math.round(deliveryDaysSum / deliveredCount)
            : 0;
        metrics.on_time_delivery_rate = deliveredCount > 0
            ? Math.round((onTimeCount / deliveredCount) * 100)
            : 0;
        // Contract compliance would need additional logic based on quotes
        metrics.contract_compliance_rate = 95; // Placeholder
        return metrics;
    }
    async getQuotesForProduct(productId) {
        const { data, error } = await this.client
            .from('vendor_quotes')
            .select(`
        *,
        price_comparison:price_comparisons!price_comparison_id (
          purchase_request_item_id
        )
      `)
            .eq('price_comparison.purchase_request_item_id', productId)
            .order('total_price', { ascending: true });
        if (error)
            throw error;
        return (data || []);
    }
    async getQuotesForVendor(vendorId) {
        const { data, error } = await this.client
            .from('vendor_quotes')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return (data || []);
    }
    async getProductMappingsForVendor(vendorId) {
        return this.getVendorProductMappings(vendorId);
    }
}
