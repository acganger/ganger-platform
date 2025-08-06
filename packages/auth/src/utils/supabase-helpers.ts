/**
 * Supabase helper utilities
 */

/**
 * Extract project ID from Supabase URL
 * Handles both standard and custom domain URLs
 */
export function getSupabaseProjectId(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Standard Supabase URL format: https://[project-id].supabase.co
    if (urlObj.hostname.endsWith('.supabase.co')) {
      const projectId = urlObj.hostname.split('.')[0];
      return projectId || 'unknown';
    }
    
    // Custom domain - we need to use a different approach
    // For custom domains, we'll use a stable identifier based on the domain
    // This ensures consistent cookie names across the platform
    if (urlObj.hostname === 'supa.gangerdermatology.com') {
      // Use a consistent project identifier for custom domain
      // This should match what Supabase actually uses
      return 'ganger-platform';
    }
    
    // Fallback to a hash of the domain for other custom domains
    return 'custom-' + urlObj.hostname.replace(/\./g, '-');
  } catch (error) {
    console.error('Error parsing Supabase URL:', error);
    // Return a default that won't break existing implementations
    return 'pfqtzmxxxhhsxmlddrta';
  }
}

/**
 * Get cookie names for Supabase auth tokens
 */
export function getSupabaseCookieNames(supabaseUrl: string) {
  const projectId = getSupabaseProjectId(supabaseUrl);
  
  return {
    accessToken: `sb-${projectId}-auth-token`,
    refreshToken: `sb-${projectId}-auth-token.1`,
    providerToken: `sb-${projectId}-auth-token.2`,
  };
}

/**
 * Get storage key for Supabase auth
 */
export function getSupabaseStorageKey(supabaseUrl: string): string {
  // Supabase v2 uses a specific storage key format
  const url = new URL(supabaseUrl);
  return `sb-${url.hostname.split('.')[0]}-auth-token`;
}