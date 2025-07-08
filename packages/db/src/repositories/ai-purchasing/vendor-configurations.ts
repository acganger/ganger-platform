import { VendorManagementRepository } from './vendor-management';

/**
 * Alias for VendorManagementRepository to match expected naming
 * Both names refer to the same vendor_configurations table
 */
export class VendorConfigurationsRepository extends VendorManagementRepository {
  // This class inherits all functionality from VendorManagementRepository
  // It exists only to provide the expected class name for imports
}