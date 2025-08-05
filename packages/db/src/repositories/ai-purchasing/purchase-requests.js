import { BaseRepository } from '../../utils/base-repository';
import { z } from 'zod';
// Validation schemas
export const purchaseRequestItemSchema = z.object({
    standardized_product_id: z.string().uuid().optional(),
    product_name: z.string().min(1),
    requested_quantity: z.number().int().positive(),
    unit_of_measure: z.string().min(1),
    notes: z.string().optional(),
    vendor_sku: z.string().optional(),
    clinical_specifications: z.array(z.string()).optional()
});
export const createPurchaseRequestSchema = z.object({
    department: z.string().optional(),
    request_type: z.enum(['consolidated_order', 'shopping_cart', 'manual_entry', 'recurring_order']),
    urgency: z.enum(['routine', 'urgent', 'emergency']).optional().default('routine'),
    notes: z.string().optional(),
    items: z.array(purchaseRequestItemSchema).min(1)
});
export class PurchaseRequestsRepository extends BaseRepository {
    constructor() {
        super('purchase_requests');
    }
    async createRequest(userEmail, userName, userId, payload) {
        // Validate input
        const validated = createPurchaseRequestSchema.parse(payload);
        // Generate request number
        const { data: requestNumber, error: numberError } = await this.client
            .rpc('generate_order_number', { prefix: 'PR' });
        if (numberError)
            throw numberError;
        // Create the request
        const { data: request, error: requestError } = await this.client
            .from(this.tableName)
            .insert({
            request_number: requestNumber,
            requester_email: userEmail,
            requester_name: userName,
            requester_id: userId,
            department: validated.department,
            request_type: validated.request_type,
            urgency: validated.urgency,
            notes: validated.notes,
            status: 'draft'
        })
            .select()
            .single();
        if (requestError)
            throw requestError;
        // Create request items
        const items = validated.items.map(item => ({
            purchase_request_id: request.id,
            ...item
        }));
        const { error: itemsError } = await this.client
            .from('purchase_request_items')
            .insert(items);
        if (itemsError) {
            // Rollback by deleting the request
            await this.delete(request.id);
            throw itemsError;
        }
        return request;
    }
    async findByRequester(requesterEmail, status) {
        let query = this.client
            .from(this.tableName)
            .select('*')
            .eq('requester_email', requesterEmail);
        if (status) {
            query = query.eq('status', status);
        }
        const { data, error } = await query
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
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
    async findPendingApproval() {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('status', 'pending_approval')
            .order('urgency', { ascending: false }) // Emergency first
            .order('created_at', { ascending: true }); // FIFO within urgency
        if (error)
            throw error;
        return data;
    }
    async updateStatus(requestId, status, additionalData) {
        const updateData = { status };
        // Add timestamps based on status
        switch (status) {
            case 'submitted':
                updateData.submitted_at = new Date().toISOString();
                break;
            case 'approved':
                updateData.approved_at = new Date().toISOString();
                if (additionalData?.approved_by_email) {
                    updateData.approved_by_email = additionalData.approved_by_email;
                    updateData.approved_by_id = additionalData.approved_by_id;
                }
                break;
            case 'ordered':
                updateData.ordered_at = new Date().toISOString();
                break;
            case 'received':
                updateData.received_at = new Date().toISOString();
                break;
        }
        if (additionalData?.notes) {
            updateData.notes = additionalData.notes;
        }
        return this.update(requestId, updateData);
    }
    async getRequestWithItems(requestId) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select(`
        *,
        purchase_request_items (*)
      `)
            .eq('id', requestId)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw error;
        }
        const { purchase_request_items, ...request } = data;
        return {
            request: request,
            items: purchase_request_items
        };
    }
    async calculateTotalCost(requestId) {
        const { data, error } = await this.client
            .from('purchase_request_items')
            .select('requested_quantity, estimated_unit_price')
            .eq('purchase_request_id', requestId);
        if (error)
            throw error;
        const total = (data || []).reduce((sum, item) => {
            const itemTotal = (item.requested_quantity || 0) * (item.estimated_unit_price || 0);
            return sum + itemTotal;
        }, 0);
        // Update the request with the calculated total
        await this.update(requestId, {
            total_estimated_cost: total
        });
        return total;
    }
    async findByDateRange(startDate, endDate, status) {
        let query = this.client
            .from(this.tableName)
            .select('*')
            .gte('created_at', startDate)
            .lte('created_at', endDate);
        if (status) {
            query = query.eq('status', status);
        }
        const { data, error } = await query
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    async getAnalyticsSummary(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .gte('created_at', startDate.toISOString());
        if (error)
            throw error;
        const requests = data;
        const summary = {
            total_requests: requests.length,
            total_value: 0,
            average_value: 0,
            by_status: {},
            by_urgency: {},
            by_department: {}
        };
        requests.forEach(request => {
            // Total value
            summary.total_value += request.total_estimated_cost || 0;
            // By status
            summary.by_status[request.status] = (summary.by_status[request.status] || 0) + 1;
            // By urgency
            summary.by_urgency[request.urgency] = (summary.by_urgency[request.urgency] || 0) + 1;
            // By department
            if (request.department) {
                summary.by_department[request.department] = (summary.by_department[request.department] || 0) + 1;
            }
        });
        summary.average_value = summary.total_requests > 0
            ? summary.total_value / summary.total_requests
            : 0;
        return summary;
    }
    async addItem(item) {
        const { data, error } = await this.client
            .from('purchase_request_items')
            .insert(item)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
