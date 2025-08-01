import { BaseRepository } from '../../utils/base-repository';
import type { VendorConfiguration } from '@ganger/types';
export interface VendorContract {
    id: string;
    vendor_id: string;
    vendor_name: string;
    contract_name: string;
    gpo_name: string;
    gpo_contract_number?: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'expired' | 'pending';
    minimum_commitment?: number;
    discount_percentage?: number;
    renewal_status?: string;
    renewal_initiated_at?: string;
    created_at: string;
    updated_at: string;
}
/**
 * Repository for vendor contract data
 * This extracts contract information from the vendor_configurations table
 */
export declare class VendorContractsRepository extends BaseRepository<VendorConfiguration> {
    constructor();
    /**
     * Get all vendor contracts (vendors with GPO contract numbers)
     */
    findAll(): Promise<VendorContract[]>;
    /**
     * Find contract by ID (vendor ID)
     */
    findContractById(vendorId: string): Promise<VendorContract | null>;
    /**
     * Find contract by vendor ID (alias for findContractById)
     */
    findContractByVendorId(vendorId: string): Promise<VendorContract | null>;
    /**
     * Find active contracts
     */
    findActiveContracts(): Promise<VendorContract[]>;
    /**
     * Find contracts expiring soon (within days)
     */
    findExpiringContracts(daysAhead?: number): Promise<VendorContract[]>;
    /**
     * Update contract (updates vendor configuration)
     */
    updateContract(vendorId: string, updates: Partial<VendorContract>): Promise<VendorContract>;
    /**
     * Transform vendor configuration to contract format
     */
    private toContract;
}
