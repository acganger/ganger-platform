
// Test imports from @ganger/db
import { connectionMonitor, db, supabase, supabaseAdmin } from '@ganger/db';

// Test imports from @ganger/cache  
import { cacheManager } from '@ganger/cache';

// Test imports from @ganger/monitoring
import { performanceMonitor } from '@ganger/monitoring';

console.log('✓ All imports resolved successfully');
console.log('✓ connectionMonitor:', typeof connectionMonitor);
console.log('✓ db:', typeof db);
console.log('✓ cacheManager:', typeof cacheManager);
console.log('✓ performanceMonitor:', typeof performanceMonitor);
