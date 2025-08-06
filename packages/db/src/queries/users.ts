import { BaseRepository } from '../utils/base-repository';
import type { Profile, UserRole } from '../types/database';

class ProfileRepository extends BaseRepository<Profile> {
  constructor() {
    super('users', true); // Use admin client for user operations
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Profile;
  }

  async findByRole(role: UserRole): Promise<Profile[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('role', role)
      .eq('is_active', true);

    if (error) throw error;
    return (data || []) as Profile[];
  }

  async findByLocation(locationId: string): Promise<Profile[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .contains('locations', [locationId])
      .eq('is_active', true);

    if (error) throw error;
    return (data || []) as Profile[];
  }

  async updateLastLogin(userId: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  }

  // async updateLocations(userId: string, locations: string[]): Promise<Profile> {
  //   return this.update(userId, { locations });
  // }

  async deactivateProfile(userId: string): Promise<Profile> {
    return this.update(userId, { is_active: false });
  }

  async activateProfile(userId: string): Promise<Profile> {
    return this.update(userId, { is_active: true });
  }

  async searchProfiles(query: string): Promise<Profile[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(50);

    if (error) throw error;
    return (data || []) as Profile[];
  }
}

export const userQueries = new ProfileRepository();