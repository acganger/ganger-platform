import { BaseRepository } from '../utils/base-repository';
import type { User, UserRole } from '../types/database';

class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users', true); // Use admin client for user operations
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as User;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('role', role)
      .eq('is_active', true);

    if (error) throw error;
    return (data || []) as User[];
  }

  async findByLocation(locationId: string): Promise<User[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .contains('locations', [locationId])
      .eq('is_active', true);

    if (error) throw error;
    return (data || []) as User[];
  }

  async updateLastLogin(userId: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  }

  async updateLocations(userId: string, locations: string[]): Promise<User> {
    return this.update(userId, { locations });
  }

  async deactivateUser(userId: string): Promise<User> {
    return this.update(userId, { is_active: false });
  }

  async activateUser(userId: string): Promise<User> {
    return this.update(userId, { is_active: true });
  }

  async searchUsers(query: string): Promise<User[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(50);

    if (error) throw error;
    return (data || []) as User[];
  }
}

export const userQueries = new UserRepository();