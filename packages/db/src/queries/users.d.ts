import { BaseRepository } from '../utils/base-repository';
import type { User, UserRole } from '../types/database';
declare class UserRepository extends BaseRepository<User> {
    constructor();
    findByEmail(email: string): Promise<User | null>;
    findByRole(role: UserRole): Promise<User[]>;
    findByLocation(locationId: string): Promise<User[]>;
    updateLastLogin(userId: string): Promise<void>;
    updateLocations(userId: string, locations: string[]): Promise<User>;
    deactivateUser(userId: string): Promise<User>;
    activateUser(userId: string): Promise<User>;
    searchUsers(query: string): Promise<User[]>;
}
export declare const userQueries: UserRepository;
export {};
