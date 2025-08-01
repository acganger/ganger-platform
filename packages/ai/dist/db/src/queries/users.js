"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userQueries = void 0;
const base_repository_1 = require("../utils/base-repository");
class UserRepository extends base_repository_1.BaseRepository {
    constructor() {
        super('users', true); // Use admin client for user operations
    }
    async findByEmail(email) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('email', email)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw error;
        }
        return data;
    }
    async findByRole(role) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('role', role)
            .eq('is_active', true);
        if (error)
            throw error;
        return (data || []);
    }
    async findByLocation(locationId) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .contains('locations', [locationId])
            .eq('is_active', true);
        if (error)
            throw error;
        return (data || []);
    }
    async updateLastLogin(userId) {
        const { error } = await this.client
            .from(this.tableName)
            .update({ last_login: new Date().toISOString() })
            .eq('id', userId);
        if (error)
            throw error;
    }
    async updateLocations(userId, locations) {
        return this.update(userId, { locations });
    }
    async deactivateUser(userId) {
        return this.update(userId, { is_active: false });
    }
    async activateUser(userId) {
        return this.update(userId, { is_active: true });
    }
    async searchUsers(query) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
            .eq('is_active', true)
            .limit(50);
        if (error)
            throw error;
        return (data || []);
    }
}
exports.userQueries = new UserRepository();
