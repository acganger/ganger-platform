import { BaseRepository } from '../../utils/base-repository';
import type { StandardizedProduct, PurchaseRequestItem } from '@ganger/types';

// TODO: Move this interface to @ganger/types
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
export class UsageHistoryRepository extends BaseRepository<PurchaseRequestItem> {
  constructor() {
    super('purchase_request_items');
  }

  /**
   * Find usage history for a specific product
   */
  async findByProduct(productId: string): Promise<UsageHistory[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        purchase_requests!inner(
          id,
          department,
          requester_email,
          created_at,
          status
        )
      `)
      .eq('standardized_product_id', productId)
      .eq('purchase_requests.status', 'ordered')
      .order('purchase_requests.created_at', { ascending: false });

    if (error) throw error;

    // Transform purchase request items into usage history
    return (data as any[]).map(item => ({
      id: item.id,
      product_id: item.standardized_product_id,
      usage_date: item.purchase_requests.created_at,
      quantity_used: item.approved_quantity || item.requested_quantity,
      department: item.purchase_requests.department || 'General',
      created_by: item.purchase_requests.requester_email,
      notes: item.notes,
      created_at: item.created_at
    }));
  }

  /**
   * Find usage history by department
   */
  async findByDepartment(department: string): Promise<UsageHistory[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        purchase_requests!inner(
          id,
          department,
          requester_email,
          created_at,
          status
        )
      `)
      .eq('purchase_requests.department', department)
      .eq('purchase_requests.status', 'ordered')
      .order('purchase_requests.created_at', { ascending: false });

    if (error) throw error;

    return (data as any[]).map(item => ({
      id: item.id,
      product_id: item.standardized_product_id,
      usage_date: item.purchase_requests.created_at,
      quantity_used: item.approved_quantity || item.requested_quantity,
      department: item.purchase_requests.department,
      created_by: item.purchase_requests.requester_email,
      notes: item.notes,
      created_at: item.created_at
    }));
  }

  /**
   * Get usage history within a date range
   */
  async findByDateRange(startDate: string, endDate: string): Promise<UsageHistory[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        purchase_requests!inner(
          id,
          department,
          requester_email,
          created_at,
          status
        )
      `)
      .eq('purchase_requests.status', 'ordered')
      .gte('purchase_requests.created_at', startDate)
      .lte('purchase_requests.created_at', endDate)
      .order('purchase_requests.created_at', { ascending: false });

    if (error) throw error;

    return (data as any[]).map(item => ({
      id: item.id,
      product_id: item.standardized_product_id,
      usage_date: item.purchase_requests.created_at,
      quantity_used: item.approved_quantity || item.requested_quantity,
      department: item.purchase_requests.department || 'General',
      created_by: item.purchase_requests.requester_email,
      notes: item.notes,
      created_at: item.created_at
    }));
  }

  /**
   * Calculate average monthly usage for a product
   */
  async getAverageMonthlyUsage(productId: string, months: number = 6): Promise<number> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const usageHistory = await this.findByProduct(productId);
    const recentUsage = usageHistory.filter(u => 
      new Date(u.usage_date) >= startDate
    );

    if (recentUsage.length === 0) return 0;

    const totalUsage = recentUsage.reduce((sum, u) => sum + u.quantity_used, 0);
    return Math.round(totalUsage / months);
  }

  /**
   * Get usage trend (increasing, decreasing, stable)
   */
  async getUsageTrend(productId: string, months: number = 3): Promise<'increasing' | 'decreasing' | 'stable'> {
    const usageHistory = await this.findByProduct(productId);
    
    if (usageHistory.length < 2) return 'stable';

    // Group by month
    const monthlyUsage = new Map<string, number>();
    
    usageHistory.forEach(usage => {
      const date = new Date(usage.usage_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      monthlyUsage.set(
        monthKey, 
        (monthlyUsage.get(monthKey) || 0) + usage.quantity_used
      );
    });

    // Get last few months
    const sortedMonths = Array.from(monthlyUsage.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, months)
      .map(([_, usage]) => usage);

    if (sortedMonths.length < 2) return 'stable';

    // Calculate trend
    const recentAvg = sortedMonths.slice(0, Math.floor(months / 2))
      .reduce((sum, u) => sum + u, 0) / Math.floor(months / 2);
    const olderAvg = sortedMonths.slice(Math.floor(months / 2))
      .reduce((sum, u) => sum + u, 0) / Math.ceil(months / 2);

    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (percentChange > 10) return 'increasing';
    if (percentChange < -10) return 'decreasing';
    return 'stable';
  }
}