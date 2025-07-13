import { describe, it, expect } from '@jest/globals';

// Test that all expected exports are available
describe('@ganger/db exports', () => {
  it('should export connectionMonitor', async () => {
    const { connectionMonitor } = await import('../index');
    expect(connectionMonitor).toBeDefined();
    expect(typeof connectionMonitor.getMetrics).toBe('function');
    expect(typeof connectionMonitor.startMonitoring).toBe('function');
    expect(typeof connectionMonitor.stopMonitoring).toBe('function');
    expect(typeof connectionMonitor.trackQuery).toBe('function');
    expect(typeof connectionMonitor.healthCheck).toBe('function');
  });

  it('should export database clients', async () => {
    const { db, supabase, supabaseAdmin, checkDatabaseHealth } = await import('../index');
    expect(db).toBeDefined();
    expect(supabase).toBeDefined();
    expect(supabaseAdmin).toBeDefined();
    expect(checkDatabaseHealth).toBeDefined();
    expect(typeof checkDatabaseHealth).toBe('function');
  });

  it('should export repositories', async () => {
    const { 
      BaseRepository,
      StandardizedProductsRepository,
      PurchaseRequestsRepository,
      VendorManagementRepository,
      VendorConfigurationsRepository,
      VendorPricesRepository,
      VendorContractsRepository,
      UsageHistoryRepository,
      ConsolidatedOrdersRepository
    } = await import('../index');
    
    expect(BaseRepository).toBeDefined();
    expect(StandardizedProductsRepository).toBeDefined();
    expect(PurchaseRequestsRepository).toBeDefined();
    expect(VendorManagementRepository).toBeDefined();
    expect(VendorConfigurationsRepository).toBeDefined();
    expect(VendorPricesRepository).toBeDefined();
    expect(VendorContractsRepository).toBeDefined();
    expect(UsageHistoryRepository).toBeDefined();
    expect(ConsolidatedOrdersRepository).toBeDefined();
  });

  it('should export query modules', async () => {
    const { userQueries, locationQueries, auditLogQueries, auditLogger } = await import('../index');
    expect(userQueries).toBeDefined();
    expect(locationQueries).toBeDefined();
    expect(auditLogQueries).toBeDefined();
    expect(auditLogger).toBeDefined();
  });

  it('should export validation schemas', async () => {
    const {
      standardizedProductSchema,
      purchaseRequestItemSchema,
      createPurchaseRequestSchema,
      vendorConfigurationSchema,
      consolidatedOrderItemSchema,
      createConsolidatedOrderSchema
    } = await import('../index');
    
    expect(standardizedProductSchema).toBeDefined();
    expect(purchaseRequestItemSchema).toBeDefined();
    expect(createPurchaseRequestSchema).toBeDefined();
    expect(vendorConfigurationSchema).toBeDefined();
    expect(consolidatedOrderItemSchema).toBeDefined();
    expect(createConsolidatedOrderSchema).toBeDefined();
  });
});