import { BaseRepository } from '../utils/base-repository';
class LocationRepository extends BaseRepository {
    constructor() {
        super('locations');
    }
    async findActiveLocations() {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });
        if (error)
            throw error;
        return (data || []);
    }
    async findByState(state) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('state', state)
            .eq('is_active', true)
            .order('city', { ascending: true });
        if (error)
            throw error;
        return (data || []);
    }
    async findByCity(city, state) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('city', city)
            .eq('state', state)
            .eq('is_active', true);
        if (error)
            throw error;
        return (data || []);
    }
    async searchLocations(query) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .or(`name.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`)
            .eq('is_active', true)
            .limit(50);
        if (error)
            throw error;
        return (data || []);
    }
    async updateSettings(locationId, settings) {
        return this.update(locationId, { settings });
    }
}
export const locationQueries = new LocationRepository();
