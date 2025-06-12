import { BaseRepository } from '../utils/base-repository';
import type { Location } from '../types/database';

class LocationRepository extends BaseRepository<Location> {
  constructor() {
    super('locations');
  }

  async findActiveLocations(): Promise<Location[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as Location[];
  }

  async findByState(state: string): Promise<Location[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('state', state)
      .eq('is_active', true)
      .order('city', { ascending: true });

    if (error) throw error;
    return (data || []) as Location[];
  }

  async findByCity(city: string, state: string): Promise<Location[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('city', city)
      .eq('state', state)
      .eq('is_active', true);

    if (error) throw error;
    return (data || []) as Location[];
  }

  async searchLocations(query: string): Promise<Location[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .or(`name.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(50);

    if (error) throw error;
    return (data || []) as Location[];
  }

  async updateSettings(locationId: string, settings: Record<string, any>): Promise<Location> {
    return this.update(locationId, { settings });
  }
}

export const locationQueries = new LocationRepository();