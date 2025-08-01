import type { BaseEntity, QueryOptions, QueryResult } from '../types/database';
export declare class BaseRepository<T extends BaseEntity> {
    protected tableName: string;
    protected useAdmin: boolean;
    constructor(tableName: string, useAdmin?: boolean);
    protected get client(): any;
    findById(id: string): Promise<T | null>;
    findMany(options?: QueryOptions): Promise<QueryResult<T>>;
    create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
    update(id: string, data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T>;
    delete(id: string): Promise<void>;
    deleteMany(ids: string[]): Promise<void>;
    exists(id: string): Promise<boolean>;
    count(filters?: Record<string, any>): Promise<number>;
}
//# sourceMappingURL=base-repository.d.ts.map