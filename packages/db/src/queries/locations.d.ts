import { BaseRepository } from '../utils/base-repository';
import type { Location } from '../types/database';
declare class LocationRepository extends BaseRepository<Location> {
    constructor();
    findActiveLocations(): Promise<Location[]>;
    findByState(state: string): Promise<Location[]>;
    findByCity(city: string, state: string): Promise<Location[]>;
    searchLocations(query: string): Promise<Location[]>;
    updateSettings(locationId: string, settings: Record<string, any>): Promise<Location>;
}
export declare const locationQueries: LocationRepository;
export {};
