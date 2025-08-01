/**
 * Cookie-based storage adapter for Supabase Auth
 * Enables cross-domain session sharing across *.gangerdermatology.com
 */
interface StorageAdapter {
    getItem(key: string): string | null | Promise<string | null>;
    setItem(key: string, value: string): void | Promise<void>;
    removeItem(key: string): void | Promise<void>;
}
interface CookieOptions {
    domain: string;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path?: string;
    maxAge?: number;
}
export declare class CookieStorage implements StorageAdapter {
    private options;
    constructor(options: CookieOptions);
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
/**
 * Pre-configured cookie storage for Ganger Platform
 * Uses .gangerdermatology.com domain for cross-subdomain access
 */
export declare const gangerCookieStorage: CookieStorage;
export {};
