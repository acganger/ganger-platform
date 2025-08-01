import { BaseRepository } from '../../utils/base-repository';
/**
 * Repository for vendor contract data
 * This extracts contract information from the vendor_configurations table
 */
export class VendorContractsRepository extends BaseRepository {
    constructor() {
        super('vendor_configurations');
    }
    /**
     * Get all vendor contracts (vendors with GPO contract numbers)
     */
    async findAll() {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .not('gpo_contract_number', 'is', null);
        if (error)
            throw error;
        // Transform vendor configurations into contract format
        return data.map(vendor => this.toContract(vendor));
    }
    /**
     * Find contract by ID (vendor ID)
     */
    async findContractById(vendorId) {
        const vendor = await this.findById(vendorId);
        if (!vendor || !vendor.gpo_contract_number)
            return null;
        return this.toContract(vendor);
    }
    /**
     * Find contract by vendor ID (alias for findContractById)
     */
    async findContractByVendorId(vendorId) {
        return this.findContractById(vendorId);
    }
    /**
     * Find active contracts
     */
    async findActiveContracts() {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .not('gpo_contract_number', 'is', null)
            .gte('contract_expiry_date', new Date().toISOString())
            .eq('is_active', true);
        if (error)
            throw error;
        return data.map(vendor => this.toContract(vendor));
    }
    /**
     * Find contracts expiring soon (within days)
     */
    async findExpiringContracts(daysAhead = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .not('gpo_contract_number', 'is', null)
            .gte('contract_expiry_date', new Date().toISOString())
            .lte('contract_expiry_date', futureDate.toISOString());
        if (error)
            throw error;
        return data.map(vendor => this.toContract(vendor));
    }
    /**
     * Update contract (updates vendor configuration)
     */
    async updateContract(vendorId, updates) {
        const vendorUpdates = {};
        if (updates.gpo_contract_number !== undefined) {
            vendorUpdates.gpo_contract_number = updates.gpo_contract_number;
        }
        if (updates.end_date) {
            vendorUpdates.contract_expiry_date = updates.end_date;
        }
        if (updates.renewal_status) {
            vendorUpdates.notes = `Renewal Status: ${updates.renewal_status}`;
        }
        const vendor = await this.update(vendorId, vendorUpdates);
        return this.toContract(vendor);
    }
    /**
     * Transform vendor configuration to contract format
     */
    toContract(vendor) {
        const now = new Date();
        const expiryDate = vendor.contract_expiry_date ? new Date(vendor.contract_expiry_date) : null;
        let status = 'pending';
        if (expiryDate) {
            status = expiryDate > now ? 'active' : 'expired';
        }
        // Extract GPO name from contract number (e.g., "PREMIER-2024-001" → "Premier Inc")
        const gpoName = vendor.gpo_contract_number?.split('-')[0] || 'Unknown GPO';
        const gpoDisplayName = gpoName.charAt(0).toUpperCase() + gpoName.slice(1).toLowerCase() + ' Inc';
        return {
            id: vendor.id,
            vendor_id: vendor.id,
            vendor_name: vendor.vendor_name,
            contract_name: `${vendor.vendor_name} - ${gpoDisplayName}`,
            gpo_name: gpoDisplayName,
            gpo_contract_number: vendor.gpo_contract_number,
            start_date: vendor.created_at,
            end_date: vendor.contract_expiry_date || '',
            status,
            minimum_commitment: vendor.minimum_order_amount,
            discount_percentage: 10, // Default assumption
            renewal_status: vendor.notes?.includes('Renewal Status') ?
                vendor.notes.split('Renewal Status: ')[1] : undefined,
            renewal_initiated_at: undefined,
            created_at: vendor.created_at,
            updated_at: vendor.updated_at
        };
    }
}
