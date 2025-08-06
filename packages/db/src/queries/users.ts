import { BaseRepository } from '../utils/base-repository';
import type { Profile, UserRole } from '../types/database';

class UserRepository extends BaseRepository<Profile> {
  constructor() {
    super('profiles', true); // Use admin client for user operations
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

  async updateLastLogin(userId: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  }

  async deactivateUser(userId: string): Promise<Profile> {
    return this.update(userId, { is_active: false });
  }

  async activateUser(userId: string): Promise<Profile> {
    return this.update(userId, { is_active: true });
  }

  async searchUsers(query: string): Promise<Profile[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(50);

    if (error) throw error;
    return (data || []) as Profile[];
  }
}

export const userQueries = new UserRepository();