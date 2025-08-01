import { BaseRepository } from '../../utils/base-repository';
import { z } from 'zod';
// Validation schema for standardized products
export const standardizedProductSchema = z.object({
    name: z.string().min(1).max(255),
    category: z.enum([
        'gloves_ppe',
        'wound_care',
        'syringes',
        'paper_products',
        'antiseptics',
        'diagnostic_supplies',
        'surgical_supplies',
        'medications',
        'other'
    ]),
    description: z.string().optional(),
    specifications: z.array(z.string()).default([]),
    standard_package_size: z.string().min(1),
    unit_of_measure: z.string().min(1),
    units_per_package: z.number().int().positive(),
    minimum_order_quantity: z.number().int().positive().optional(),
    maximum_order_quantity: z.number().int().positive().optional(),
    reorder_point: z.number().int().optional(),
    average_monthly_usage: z.number().optional(),
    image_url: z.string().url().optional(),
    is_active: z.boolean().default(true),
    is_critical: z.boolean().default(false),
    substitute_product_ids: z.array(z.string().uuid()).default([]),
    tags: z.array(z.string()).default([])
});
export class StandardizedProductsRepository extends BaseRepository {
    constructor() {
        super('standardized_products');
    }
    async findAll(onlyActive = true) {
        let query = this.client
            .from(this.tableName)
            .select('*');
        if (onlyActive) {
            query = query.eq('is_active', true);
        }
        const { data, error } = await query.order('name', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async findByCategory(category, onlyActive = true) {
        let query = this.client
            .from(this.tableName)
            .select('*')
            .eq('category', category);
        if (onlyActive) {
            query = query.eq('is_active', true);
        }
        const { data, error } = await query.order('name', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async findActive() {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('is_active', true)
            .order('category', { ascending: true })
            .order('name', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async findCritical() {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('is_critical', true)
            .eq('is_active', true)
            .order('name', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async findByIds(ids) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .in('id', ids);
        if (error)
            throw error;
        return data;
    }
    async search(query) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
            .eq('is_active', true)
            .order('name', { ascending: true })
            .limit(50);
        if (error)
            throw error;
        return data;
    }
    async findSubstitutes(productId) {
        // First get the product to find its substitutes
        const product = await this.findById(productId);
        if (!product || product.substitute_product_ids.length === 0) {
            return [];
        }
        return this.findByIds(product.substitute_product_ids);
    }
    async updateUsageStats(productId, quantity) {
        // Get current product
        const product = await this.findById(productId);
        if (!product)
            throw new Error('Product not found');
        // Calculate new average (simple moving average)
        const currentAverage = product.average_monthly_usage || 0;
        const newAverage = (currentAverage * 0.8) + (quantity * 0.2); // 80/20 weighted average
        await this.update(productId, {
            average_monthly_usage: newAverage,
            last_order_date: new Date().toISOString()
        });
    }
    async findProductsNeedingReorder() {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('is_active', true)
            .not('reorder_point', 'is', null)
            .or('average_monthly_usage.gt.0');
        if (error)
            throw error;
        // Filter products that might need reordering based on last order date
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return data.filter(product => {
            if (!product.last_order_date)
                return true; // Never ordered
            const lastOrderDate = new Date(product.last_order_date);
            return lastOrderDate < thirtyDaysAgo;
        });
    }
    async createProduct(input) {
        // Validate input
        const validated = standardizedProductSchema.parse(input);
        return this.create(validated);
    }
    async toggleActive(productId, isActive) {
        return this.update(productId, { is_active: isActive });
    }
    async updateSubstitutes(productId, substituteIds) {
        // Validate that substitute products exist
        const substitutes = await this.findByIds(substituteIds);
        if (substitutes.length !== substituteIds.length) {
            throw new Error('One or more substitute products not found');
        }
        return this.update(productId, {
            substitute_product_ids: substituteIds
        });
    }
}
