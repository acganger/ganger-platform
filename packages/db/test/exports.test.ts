import { describe, it, expect } from '@jest/globals';

describe('@ganger/db exports', () => {
  it('should export all required modules', () => {
    // Test main exports
    const dbExports = require('../src/index');
    
    // Core exports
    expect(dbExports.db).toBeDefined();
    expect(dbExports.supabase).toBeDefined();
    expect(dbExports.supabaseAdmin).toBeDefined();
    expect(dbExports.connectionMonitor).toBeDefined();
    expect(dbExports.checkDatabaseHealth).toBeDefined();
    
    // Repository exports
    expect(dbExports.BaseRepository).toBeDefined();
    
    // Query modules
    expect(dbExports.userQueries).toBeDefined();
    expect(dbExports.locationQueries).toBeDefined();
    expect(dbExports.auditLogQueries).toBeDefined();
    expect(dbExports.auditLogger).toBeDefined();
    
    // AI Purchasing repositories
    expect(dbExports.StandardizedProductsRepository).toBeDefined();
    expect(dbExports.PurchaseRequestsRepository).toBeDefined();
    expect(dbExports.VendorManagementRepository).toBeDefined();
    expect(dbExports.VendorConfigurationsRepository).toBeDefined();
    expect(dbExports.VendorPricesRepository).toBeDefined();
    expect(dbExports.VendorContractsRepository).toBeDefined();
    expect(dbExports.UsageHistoryRepository).toBeDefined();
    expect(dbExports.ConsolidatedOrdersRepository).toBeDefined();
    
    // Validation schemas
    expect(dbExports.standardizedProductSchema).toBeDefined();
    expect(dbExports.purchaseRequestItemSchema).toBeDefined();
    expect(dbExports.createPurchaseRequestSchema).toBeDefined();
    expect(dbExports.vendorConfigurationSchema).toBeDefined();
    expect(dbExports.consolidatedOrderItemSchema).toBeDefined();
    expect(dbExports.createConsolidatedOrderSchema).toBeDefined();
  });

  it('should export connectionMonitor with correct methods', () => {
    const { connectionMonitor } = require('../src/index');
    
    expect(connectionMonitor).toBeDefined();
    expect(typeof connectionMonitor.getMetrics).toBe('function');
    expect(typeof connectionMonitor.startMonitoring).toBe('function');
    expect(typeof connectionMonitor.stopMonitoring).toBe('function');
    expect(typeof connectionMonitor.trackQuery).toBe('function');
    expect(typeof connectionMonitor.healthCheck).toBe('function');
  });
});