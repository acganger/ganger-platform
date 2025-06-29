// Main exports for @ganger/ai package

// Re-export all shared types
export * from './shared/types';

// Re-export server functionality
export { createGangerAI } from './server/client';
export type { GangerAI } from './server/client';

// Re-export all new feature modules
export * from './server/safety';
export * from './server/reliability';
export * from './server/cache';
export * from './server/monitoring';
export * from './server/error-handling';

// Re-export client components
export * from './client/components';

// Note: Client-side exports should be imported from @ganger/ai/client
// Server-side exports should be imported from @ganger/ai/server