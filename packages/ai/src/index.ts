/**
 * @fileoverview Main package exports
 * Entry point for the @ganger/ai package
 */

// Export everything from shared (types and constants)
export * from './shared';

// Note: Server and client exports are available via subpath imports:
// - @ganger/ai/server
// - @ganger/ai/client
// 
// This prevents importing server-side code in client components
// and vice versa, following Next.js best practices.