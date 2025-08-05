import { BaseRepository } from '../../utils/base-repository';
import type { PurchaseRequestItem } from '@ganger/types';
export interface UsageHistory {
    id: string;
    product_id: string;
    usage_date: string;
    quantity_used: number;
    department: string;
    created_by?: string;
    notes?: string;
    created_at: string;
}
/**
 * Repository for product usage history
 * This simulates usage history by analyzing purchase request items and product data
 */
export declare class UsageHistoryRepository extends BaseRepository<PurchaseRequestItem> {
    constructor();
    /**
     * Find usage history for a specific product
     */
    findByProduct(productId: string): Promise<UsageHistory[]>;
    /**
     * Find usage history by department
     */
    findByDepartment(department: string): Promise<UsageHistory[]>;
    /**
     * Get usage history within a date range
     */
    findByDateRange(startDate: string, endDate: string): Promise<UsageHistory[]>;
    /**
     * Calculate average monthly usage for a product
     */
    getAverageMonthlyUsage(productId: string, months?: number): Promise<number>;
    /**
     * Get usage trend (increasing, decreasing, stable)
     */
    getUsageTrend(productId: string, months?: number): Promise<'increasing' | 'decreasing' | 'stable'>;
}
