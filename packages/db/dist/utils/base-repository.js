import { supabase, supabaseAdmin } from '../client';
export class BaseRepository {
    constructor(tableName, useAdmin = false) {
        this.tableName = tableName;
        this.useAdmin = useAdmin;
    }
    get client() {
        return this.useAdmin ? supabaseAdmin : supabase;
    }
    async findById(id) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // No rows found
            throw error;
        }
        return data;
    }
    async findMany(options) {
        let query = this.client.from(this.tableName).select('*', { count: 'exact' });
        // Apply filters
        if (options?.filters) {
            Object.entries(options.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query = query.eq(key, value);
                }
            });
        }
        // Apply ordering
        if (options?.orderBy) {
            query = query.order(options.orderBy.field, {
                ascending: options.orderBy.direction === 'asc',
            });
        }
        // Apply pagination
        if (options?.limit) {
            const offset = options.offset || 0;
            query = query.range(offset, offset + options.limit - 1);
        }
        const { data, error, count } = await query;
        if (error)
            throw error;
        return {
            data: (data || []),
            count: count || 0,
            hasMore: options?.limit ? (count || 0) > (options.offset || 0) + options.limit : false,
        };
    }
    async create(data) {
        const { data: result, error } = await this.client
            .from(this.tableName)
            .insert(data)
            .select()
            .single();
        if (error)
            throw error;
        return result;
    }
    async update(id, data) {
        const { data: result, error } = await this.client
            .from(this.tableName)
            .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return result;
    }
    async delete(id) {
        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
    async deleteMany(ids) {
        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .in('id', ids);
        if (error)
            throw error;
    }
    async exists(id) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('id')
            .eq('id', id)
            .single();
        return !error && !!data;
    }
    async count(filters) {
        let query = this.client
            .from(this.tableName)
            .select('*', { count: 'exact', head: true });
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query = query.eq(key, value);
                }
            });
        }
        const { count, error } = await query;
        if (error)
            throw error;
        return count || 0;
    }
}
