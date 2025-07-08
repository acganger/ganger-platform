import { BaseRepository } from '../../utils/base-repository';
import type { VendorProductMapping } from '@ganger/types';

/**
 * Repository for vendor price data
 * This wraps the vendor_product_mappings table which contains pricing information
 */
export class VendorPricesRepository extends BaseRepository<VendorProductMapping> {
  constructor() {
    super('vendor_product_mappings');
  }

  /**
   * Find all prices for a specific product across all vendors
   */
  async findByProduct(productId: string): Promise<VendorProductMapping[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('standardized_product_id', productId)
      .not('vendor_unit_price', 'is', null)
      .order('vendor_unit_price', { ascending: true });

    if (error) throw error;
    return data as VendorProductMapping[];
  }

  /**
   * Find all prices from a specific vendor
   */
  async findByVendor(vendorId: string): Promise<VendorProductMapping[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('vendor_id', vendorId)
      .not('vendor_unit_price', 'is', null);

    if (error) throw error;
    return data as VendorProductMapping[];
  }

  /**
   * Get contract prices only
   */
  async findContractPrices(): Promise<VendorProductMapping[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_contract_item', true)
      .not('contract_price', 'is', null);

    if (error) throw error;
    return data as VendorProductMapping[];
  }

  /**
   * Update price for a vendor-product mapping
   */
  async updatePrice(
    mappingId: string, 
    price: number,
    isContractPrice = false
  ): Promise<VendorProductMapping> {
    const updateData: any = {
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

    if (error) throw error;
    return data as VendorProductMapping;
  }

  /**
   * Get price for specific product-vendor combination
   */
  async findByProductAndVendor(
    productId: string, 
    vendorId: string
  ): Promise<VendorProductMapping | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('standardized_product_id', productId)
      .eq('vendor_id', vendorId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as VendorProductMapping | null;
  }
}