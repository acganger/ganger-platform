import { BaseRepository } from '../../utils/base-repository';
import type { VendorProductMapping } from '@ganger/types';
/**
 * Repository for vendor price data
 * This wraps the vendor_product_mappings table which contains pricing information
 */
export declare class VendorPricesRepository extends BaseRepository<VendorProductMapping> {
    constructor();
    /**
     * Find all prices for a specific product across all vendors
     */
    findByProduct(productId: string): Promise<VendorProductMapping[]>;
    /**
     * Find all prices from a specific vendor
     */
    findByVendor(vendorId: string): Promise<VendorProductMapping[]>;
    /**
     * Get contract prices only
     */
    findContractPrices(): Promise<VendorProductMapping[]>;
    /**
     * Update price for a vendor-product mapping
     */
    updatePrice(mappingId: string, price: number, isContractPrice?: boolean): Promise<VendorProductMapping>;
    /**
     * Get price for specific product-vendor combination
     */
    findByProductAndVendor(productId: string, vendorId: string): Promise<VendorProductMapping | null>;
}
