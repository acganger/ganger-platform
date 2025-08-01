import { BaseRepository } from '../../utils/base-repository';
import { z } from 'zod';
// Validation schemas
export const consolidatedOrderItemSchema = z.object({
    standardized_product_id: z.string().uuid(),
    requested_quantity: z.number().int().positive(),
    justification: z.string().optional(),
    urgency_level: z.enum(['routine', 'urgent']).optional().default('routine')
});
export const createConsolidatedOrderSchema = z.object({
    department: z.string().min(1),
    urgency: z.enum(['routine', 'urgent', 'emergency']).optional().default('routine'),
    notes: z.string().optional(),
    items: z.array(consolidatedOrderItemSchema).min(1)
});
export class ConsolidatedOrdersRepository extends BaseRepository {
    constructor() {
        super('consolidated_orders');
    }
    async createOrder(userEmail, userName, userId, payload) {
        // Validate input
        const validated = createConsolidatedOrderSchema.parse(payload);
        // Generate order number
        const { data: orderNumber, error: numberError } = await this.client
            .rpc('generate_order_number', { prefix: 'CO' });
        if (numberError)
            throw numberError;
        // Create the order
        const { data: order, error: orderError } = await this.client
            .from(this.tableName)
            .insert({
            order_number: orderNumber,
            requester_email: userEmail,
            requester_name: userName,
            requester_id: userId,
            department: validated.department,
            urgency: validated.urgency,
            notes: validated.notes,
            status: 'draft'
        })
            .select()
            .single();
        if (orderError)
            throw orderError;
        // Create order items
        const items = validated.items.map(item => ({
            consolidated_order_id: order.id,
            ...item
        }));
        const { error: itemsError } = await this.client
            .from('consolidated_order_items')
            .insert(items);
        if (itemsError) {
            // Rollback by deleting the order
            await this.delete(order.id);
            throw itemsError;
        }
        return order;
    }
    async findByDepartment(department, status) {
        let query = this.client
            .from(this.tableName)
            .select('*')
            .eq('department', department);
        if (status) {
            query = query.eq('status', status);
        }
        const { data, error } = await query
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    async findDraftOrders(userEmail) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('requester_email', userEmail)
            .eq('status', 'draft')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    async getOrderWithItems(orderId) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select(`
        *,
        consolidated_order_items (
          *,
          product:standardized_products (*)
        )
      `)
            .eq('id', orderId)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw error;
        }
        const { consolidated_order_items, ...order } = data;
        return {
            order: order,
            items: consolidated_order_items
        };
    }
    async submitOrder(orderId) {
        return this.update(orderId, {
            status: 'submitted',
            submitted_at: new Date().toISOString()
        });
    }
    async updateStatus(orderId, status, additionalData) {
        const updateData = { status };
        if (status === 'optimized') {
            updateData.optimized_at = new Date().toISOString();
            if (additionalData?.total_estimated_savings !== undefined) {
                updateData.total_estimated_savings = additionalData.total_estimated_savings;
            }
        }
        if (additionalData?.notes) {
            updateData.notes = additionalData.notes;
        }
        return this.update(orderId, updateData);
    }
    async addItemToOrder(orderId, item) {
        // Verify order exists and is in draft status
        const order = await this.findById(orderId);
        if (!order)
            throw new Error('Order not found');
        if (order.status !== 'draft')
            throw new Error('Can only add items to draft orders');
        const { data, error } = await this.client
            .from('consolidated_order_items')
            .insert({
            consolidated_order_id: orderId,
            ...item
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateOrderItem(itemId, updates) {
        const { data, error } = await this.client
            .from('consolidated_order_items')
            .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
            .eq('id', itemId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async removeItemFromOrder(itemId) {
        const { error } = await this.client
            .from('consolidated_order_items')
            .delete()
            .eq('id', itemId);
        if (error)
            throw error;
    }
    async getFrequentlyOrderedProducts(department, limit = 20) {
        // Get orders from the last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const { data, error } = await this.client
            .from('consolidated_order_items')
            .select(`
        standardized_product_id,
        requested_quantity,
        consolidated_order!inner (
          department,
          created_at
        ),
        product:standardized_products (*)
      `)
            .eq('consolidated_order.department', department)
            .gte('consolidated_order.created_at', ninetyDaysAgo.toISOString());
        if (error)
            throw error;
        // Aggregate by product
        const productStats = new Map();
        data.forEach((item) => {
            if (!item.product)
                return;
            const productId = item.standardized_product_id;
            if (!productStats.has(productId)) {
                productStats.set(productId, {
                    product: item.product,
                    quantities: [],
                    dates: []
                });
            }
            const stats = productStats.get(productId);
            stats.quantities.push(item.requested_quantity);
            stats.dates.push(item.consolidated_order.created_at);
        });
        // Calculate metrics and sort
        const results = Array.from(productStats.values()).map(stats => ({
            product: stats.product,
            order_count: stats.quantities.length,
            average_quantity: Math.round(stats.quantities.reduce((sum, q) => sum + q, 0) / stats.quantities.length),
            last_ordered: stats.dates.sort().reverse()[0]
        }));
        return results
            .sort((a, b) => b.order_count - a.order_count)
            .slice(0, limit);
    }
    async createTemplateOrder(department) {
        // Get frequently ordered products
        const frequentProducts = await this.getFrequentlyOrderedProducts(department, 10);
        if (frequentProducts.length === 0) {
            throw new Error('No historical data to create template');
        }
        // Create order
        const order = await this.createOrder('template@gangerdermatology.com', 'Template Order', undefined, {
            department,
            notes: `Template order based on ${department} department's frequently ordered items`,
            items: frequentProducts.map(fp => ({
                standardized_product_id: fp.product.id,
                requested_quantity: fp.average_quantity,
                justification: `Ordered ${fp.order_count} times in last 90 days`
            }))
        });
        return order;
    }
    async findAll() {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    async findWithFilters(filters, limit, offset) {
        let query = this.client
            .from(this.tableName)
            .select('*');
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                query = query.eq(key, value);
            }
        });
        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw error;
        return data;
    }
    async getItems(orderId) {
        const { data, error } = await this.client
            .from('consolidated_order_items')
            .select('*')
            .eq('consolidated_order_id', orderId)
            .order('created_at', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async addItem(item) {
        const { data, error } = await this.client
            .from('consolidated_order_items')
            .insert(item)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
