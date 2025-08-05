import { BaseRepository } from '../../utils/base-repository';
/**
 * Repository for vendor price data
 * This wraps the vendor_product_mappings table which contains pricing information
 */
export class VendorPricesRepository extends BaseRepository {
    constructor() {
        super('vendor_product_mappings');
    }
    /**
     * Find all prices for a specific product across all vendors
     */
    async findByProduct(productId) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('standardized_product_id', productId)
            .not('vendor_unit_price', 'is', null)
            .order('vendor_unit_price', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    /**
     * Find all prices from a specific vendor
     */
    async findByVendor(vendorId) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('vendor_id', vendorId)
            .not('vendor_unit_price', 'is', null);
        if (error)
            throw error;
        return data;
    }
    /**
     * Get contract prices only
     */
    async findContractPrices() {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('is_contract_item', true)
            .not('contract_price', 'is', null);
        if (error)
            throw error;
        return data;
    }
    /**
     * Update price for a vendor-product mapping
     */
    async updatePrice(mappingId, price, isContractPrice = false) {
        const updateData = {
            vendor_unit_price: price,
            last_known_price: price,
            last_price_update: new Date().toISOString()
        };
        if (isContractPrice) {
            updateData.contract_price = price;
            updateData.is_contract_item = true;
        }
        const { data, error } = await this.client
            .from(this.tableName)
            .update(updateData)
            .eq('id', mappingId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Get price for specific product-vendor combination
     */
    async findByProductAndVendor(productId, vendorId) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('standardized_product_id', productId)
            .eq('vendor_id', vendorId)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        return data;
    }
}
